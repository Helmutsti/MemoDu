// Ricerca e filtri sulla copia di lavoro (RF-08, DEC-94, DEC-95): non passa mai dal server.
// - Il testo si cerca in titolo, contenuto e percorsi dei tag, anche dentro le parole, senza
//   maiuscole e accenti; con più parole servono tutte (RB-69). Dalla terza lettera con l'indice
//   a trigrammi, con una o due lettere scorrendo le note con `normalizza`.
// - I filtri si sommano: ogni tag scelto, con i suoi sotto-tag, e i periodi di creazione e
//   modifica (RB-70). I periodi li calcola l'interfaccia nell'ora locale.
// - Prima le note con il testo nel titolo o nei tag, poi le altre, per ultima modifica (RB-34).

use std::collections::HashMap;

use chrono::{DateTime, Local, NaiveDate, Utc};
use rusqlite::params_from_iter;
use serde::{Deserialize, Serialize};

use super::{anteprima, livelli_tag, nome_nota, normalizza, Archivio, Errore, Esito, RigaNota, SPAZI};

/// Caratteri dell'estratto attorno alla parola trovata (DEC-95).
const LUNGHEZZA_ESTRATTO: usize = 80;
/// Caratteri prima della parola, quando c'è spazio.
const PRIMA_DELLA_PAROLA: usize = 24;
/// Sotto questa lunghezza l'indice a trigrammi non trova niente.
const LETTERE_INDICE: usize = 3;

/// Un periodo, con gli estremi compresi; None è aperto.
#[derive(Debug, Default, Clone, Deserialize)]
pub struct Intervallo {
    pub da: Option<String>,
    pub a: Option<String>,
}

#[derive(Debug, Default, Clone, Deserialize)]
pub struct Richiesta {
    #[serde(default)]
    pub testo: String,
    /// Percorsi dei tag: la nota deve averli tutti, o un loro sotto-tag.
    #[serde(default)]
    pub tag: Vec<String>,
    pub creata: Option<Intervallo>,
    pub modificata: Option<Intervallo>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Risultato {
    pub id: String,
    pub titolo: String,
    pub estratto: String,
    /// Inizio e fine della parola da evidenziare, in caratteri dell'estratto.
    pub evidenza: Option<[usize; 2]>,
    /// Da dove veniva, per le note nel cestino.
    pub cartella: String,
    /// Istante UTC, o giorno AAAA-MM-GG per una data di creazione scelta.
    pub data: String,
    pub nel_cestino: bool,
}

/// Un periodo già letto.
struct Periodo {
    da: Option<DateTime<Utc>>,
    a: Option<DateTime<Utc>>,
}

impl Periodo {
    fn da(intervallo: &Intervallo) -> Esito<Self> {
        let leggi = |testo: &Option<String>| -> Esito<Option<DateTime<Utc>>> {
            testo
                .as_deref()
                .map(|t| {
                    DateTime::parse_from_rfc3339(t)
                        .map(|d| d.with_timezone(&Utc))
                        .map_err(|_| Errore::DataNonValida(format!("Istante non valido: {t}")))
                })
                .transpose()
        };
        let periodo = Periodo { da: leggi(&intervallo.da)?, a: leggi(&intervallo.a)? };
        if let (Some(da), Some(a)) = (periodo.da, periodo.a) {
            if da > a {
                return Err(Errore::DataNonValida("Il periodo finisce prima di cominciare".into()));
            }
        }
        Ok(periodo)
    }

    fn contiene(&self, momento: DateTime<Utc>) -> bool {
        self.da.is_none_or(|da| momento >= da) && self.a.is_none_or(|a| momento <= a)
    }
}

impl Archivio {
    pub fn cerca(&mut self, richiesta: &Richiesta) -> Esito<Vec<Risultato>> {
        let creata = richiesta.creata.as_ref().map(Periodo::da).transpose()?;
        let modificata = richiesta.modificata.as_ref().map(Periodo::da).transpose()?;
        // Una parola fatta solo di segni diacritici resta vuota: non conta (RB-69).
        let parole: Vec<String> =
            richiesta.testo.split_whitespace().map(normalizza).filter(|p| !p.is_empty()).collect();
        if parole.is_empty() && richiesta.tag.is_empty() && creata.is_none() && modificata.is_none() {
            // La card mostra solo i filtri (RB-33).
            return Ok(Vec::new());
        }
        let cestino = self.cestino_in_ricerca()?;
        self.con_riconnessione(|a| {
            a.risultati(&parole, &richiesta.tag, creata.as_ref(), modificata.as_ref(), cestino)
        })
    }

    fn risultati(
        &self,
        parole: &[String],
        tag: &[String],
        creata: Option<&Periodo>,
        modificata: Option<&Periodo>,
        cestino: bool,
    ) -> Esito<Vec<Risultato>> {
        let mut condizioni = Vec::new();
        let mut valori: Vec<String> = Vec::new();
        let lunghe: Vec<&String> =
            parole.iter().filter(|p| p.chars().count() >= LETTERE_INDICE).collect();
        if !lunghe.is_empty() {
            // Ogni parola tra virgolette: il testo non è mai una query (RB-08).
            let frase: Vec<String> =
                lunghe.iter().map(|p| format!("\"{}\"", p.replace('"', "\"\""))).collect();
            condizioni.push("ricerca MATCH ?".to_string());
            valori.push(frase.join(" "));
        }
        for corta in parole.iter().filter(|p| p.chars().count() < LETTERE_INDICE) {
            condizioni.push(
                "instr(normalizza(r.titolo || char(10) || r.contenuto || char(10) || r.tag), ?) > 0"
                    .to_string(),
            );
            valori.push(corta.clone());
        }
        for percorso in tag {
            // Un tag che non esiste non ha note (RB-70).
            let Some(id) = self.id_tag(&livelli_tag(percorso)?, false)? else {
                return Ok(Vec::new());
            };
            condizioni.push(
                "EXISTS (SELECT 1 FROM note_tag nt WHERE nt.nota = n.id AND nt.tag IN (
                   WITH RECURSIVE giu(id) AS (SELECT ? UNION SELECT t.id FROM tag t JOIN giu ON t.padre = giu.id)
                   SELECT id FROM giu))"
                    .to_string(),
            );
            valori.push(id);
        }
        if !cestino {
            // Le note eliminate da sole si escludono qui; quelle dentro una cartella nel cestino
            // più sotto, con l'albero delle cartelle (RB-29).
            condizioni.push("n.eliminata_il IS NULL".to_string());
        }
        let dove = if condizioni.is_empty() { String::new() } else { format!("WHERE {}", condizioni.join(" AND ")) };
        let sql = format!(
            "SELECT n.*, r.tag AS percorsi_tag FROM ricerca r JOIN note n ON n.id = r.id {dove}"
        );
        let mut stmt = self.db.prepare(&sql)?;
        let righe = stmt
            .query_map(params_from_iter(&valori), |r| Ok((RigaNota::da(r)?, r.get::<_, String>("percorsi_tag")?)))?
            .collect::<Result<Vec<_>, _>>()?;

        let cartelle = Cartelle::leggi(self)?;
        let mut trovati = Vec::new();
        for (riga, percorsi_tag) in righe {
            let momento_modifica = istante(&riga.modificata);
            if let Some(periodo) = modificata {
                if !momento_modifica.is_some_and(|m| periodo.contiene(m)) {
                    continue;
                }
            }
            if let Some(periodo) = creata {
                let momento = match &riga.creata_scelta {
                    Some(giorno) => mezzanotte_locale(giorno),
                    None => istante(&riga.creata),
                };
                if !momento.is_some_and(|m| periodo.contiene(m)) {
                    continue;
                }
            }
            let nel_cestino = riga.eliminata_il.is_some() || cartelle.nel_cestino(riga.cartella.as_deref());
            if nel_cestino && !cestino {
                continue;
            }
            let cartella = if riga.eliminata_il.is_some() {
                riga.provenienza.clone().unwrap_or_default()
            } else {
                cartelle.percorso(riga.cartella.as_deref())
            };
            // Prima le note con una parola nel titolo o nei tag (RB-34).
            let in_evidenza = normalizza(&format!("{}\n{}", riga.titolo, percorsi_tag));
            let gruppo = if parole.iter().any(|p| in_evidenza.contains(p.as_str())) { 0 } else { 1 };
            let (estratto, evidenza) = match estratto(&riga.contenuto, parole) {
                Some((testo, evidenza)) => (testo, Some(evidenza)),
                None => (anteprima(&riga.contenuto), None),
            };
            let data = if modificata.is_some() || creata.is_none() {
                riga.modificata.clone()
            } else {
                riga.creata_scelta.clone().unwrap_or_else(|| riga.creata.clone())
            };
            trovati.push((
                gruppo,
                riga.modificata.clone(),
                Risultato {
                    id: riga.id.clone(),
                    titolo: nome_nota(&riga),
                    estratto,
                    evidenza,
                    cartella,
                    data,
                    nel_cestino,
                },
            ));
        }
        trovati.sort_by(|a, b| a.0.cmp(&b.0).then_with(|| b.1.cmp(&a.1)));
        Ok(trovati.into_iter().map(|(_, _, r)| r).collect())
    }
}

/// Tutte le cartelle, lette una volta per ricerca: nome, madre e se sono nel cestino.
struct Cartelle(HashMap<String, (String, Option<String>, bool)>);

impl Cartelle {
    fn leggi(archivio: &Archivio) -> Esito<Self> {
        let mut stmt = archivio.db.prepare("SELECT id, nome, madre, eliminata_il IS NOT NULL FROM cartelle")?;
        let righe = stmt
            .query_map([], |r| Ok((r.get::<_, String>(0)?, (r.get(1)?, r.get(2)?, r.get(3)?))))?
            .collect::<Result<HashMap<_, _>, _>>()?;
        Ok(Cartelle(righe))
    }

    /// Le madri della cartella, dalla più vicina; si ferma se una non c'è.
    fn catena<'a>(&'a self, id: Option<&'a str>) -> impl Iterator<Item = &'a (String, Option<String>, bool)> + 'a {
        std::iter::successors(id.and_then(|i| self.0.get(i)), |c| c.1.as_deref().and_then(|m| self.0.get(m)))
            .take(self.0.len())
    }

    fn nel_cestino(&self, id: Option<&str>) -> bool {
        self.catena(id).any(|c| c.2)
    }

    /// Il percorso con i nomi di tutte le madri, anche se sono nel cestino.
    fn percorso(&self, id: Option<&str>) -> String {
        let mut nomi: Vec<&str> = self.catena(id).map(|c| c.0.as_str()).collect();
        nomi.reverse();
        nomi.join("/")
    }
}

#[cfg(test)]
#[path = "archivio_ricerca_test.rs"]
mod prove;

fn istante(testo: &str) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(testo).ok().map(|d| d.with_timezone(&Utc))
}

/// Un giorno scelto (DEC-28) vale dalla mezzanotte di questo computer.
fn mezzanotte_locale(giorno: &str) -> Option<DateTime<Utc>> {
    NaiveDate::parse_from_str(giorno, "%Y-%m-%d")
        .ok()?
        .and_hms_opt(0, 0, 0)?
        .and_local_timezone(Local)
        .earliest()
        .map(|d| d.with_timezone(&Utc))
}

/// Circa 80 caratteri attorno alla prima parola trovata nel contenuto, a parole intere, con
/// «…» dove si taglia; None se nessuna parola è nel contenuto.
pub fn estratto(contenuto: &str, parole: &[String]) -> Option<(String, [usize; 2])> {
    let testo = SPAZI.replace_all(contenuto, " ");
    let caratteri: Vec<char> = testo.trim().chars().collect();
    // Il testo normalizzato, con per ogni suo carattere quello del testo da cui viene.
    let mut normale: Vec<char> = Vec::new();
    let mut origine: Vec<usize> = Vec::new();
    for (i, c) in caratteri.iter().enumerate() {
        if c.is_ascii() {
            normale.push(c.to_ascii_lowercase());
            origine.push(i);
            continue;
        }
        for n in normalizza(&c.to_string()).chars() {
            normale.push(n);
            origine.push(i);
        }
    }
    let (inizio, fine) = parole
        .iter()
        .filter_map(|p| {
            let cercata: Vec<char> = p.chars().collect();
            if cercata.is_empty() {
                return None;
            }
            let posizione = normale.windows(cercata.len()).position(|w| w == cercata.as_slice())?;
            Some((origine[posizione], origine[posizione + cercata.len() - 1] + 1))
        })
        .min()?;
    let totale = caratteri.len();
    let mut da = inizio.saturating_sub(PRIMA_DELLA_PAROLA);
    if da > 0 {
        // Si comincia da una parola intera.
        if let Some(spazio) = caratteri[da..inizio].iter().position(|c| *c == ' ') {
            da += spazio + 1;
        } else {
            da = inizio;
        }
    }
    let mut a = (da + LUNGHEZZA_ESTRATTO).max(fine).min(totale);
    if a < totale {
        if let Some(spazio) = caratteri[fine..a].iter().rposition(|c| *c == ' ') {
            a = fine + spazio;
        }
    }
    let prima = if da > 0 { "…" } else { "" };
    let dopo = if a < totale { "…" } else { "" };
    let corpo: String = caratteri[da..a].iter().collect();
    let spostamento = prima.chars().count();
    Some((
        format!("{prima}{}{dopo}", corpo.trim_end()),
        [inizio - da + spostamento, fine - da + spostamento],
    ))
}
