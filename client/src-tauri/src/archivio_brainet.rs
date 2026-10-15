// Brainet nella copia di lavoro (RF-18, DEC-134; architettura approvata il 15/10/2026).
// Le note Brainet («frammenti», EN-12) tengono pillole e aree dentro il testo, con due segni
// in forma di tag, come `<u>` per il sottolineato (DEC-28; scelta di Manuel Cucca del
// 15/10/2026):
//   collegamento (EN-14): <cita e="ID">nome</cita>
//   area (EN-15):         <area id="ID" s="ID,ID" e="ID,ID">frase</area id="ID">
// L'apertura e la chiusura di un'area si accoppiano per id, così due aree possono sovrapporsi.
// Citazioni e aree delle tabelle `brainet_*` sono solo un indice ricavato dal testo: si rifà a
// ogni scrittura del frammento e non si sincronizza.

use std::collections::{BTreeMap, HashMap, HashSet};
use std::sync::LazyLock;

use chrono::{DateTime, Datelike, Local, NaiveDate, Utc};
use regex::Regex;
use rusqlite::{params, OptionalExtension};
use serde::Serialize;
use serde_json::{json, Map, Value};

use super::impostazioni::ID as ID_IMPOSTAZIONI;
use super::{chiave, normalizza, Archivio, ElementoCestino, Errore, Esito, Ripristinato};

/// Schema 8: le tabelle di Brainet e le due impostazioni (RB-106).
pub const SCHEMA_BRAINET: &str = "
  CREATE TABLE frammenti (
    id TEXT PRIMARY KEY,
    testo TEXT NOT NULL,
    nato_il TEXT NOT NULL,
    modificato_il TEXT NOT NULL,
    eliminato_il TEXT,
    da_nota TEXT
  );
  CREATE INDEX frammenti_nato_il ON frammenti (nato_il);
  CREATE TABLE entita (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    chiave_nome TEXT NOT NULL,
    tipo TEXT,
    foto BLOB,
    unita_in TEXT,
    creata_il TEXT NOT NULL
  );
  CREATE TABLE stati (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    chiave TEXT NOT NULL,
    colore TEXT NOT NULL,
    ordine INTEGER NOT NULL
  );
  CREATE TABLE brainet_citazioni (
    frammento TEXT NOT NULL,
    entita TEXT NOT NULL,
    inizio INTEGER NOT NULL,
    fine INTEGER NOT NULL
  );
  CREATE INDEX brainet_citazioni_frammento ON brainet_citazioni (frammento);
  CREATE TABLE brainet_aree (
    frammento TEXT NOT NULL,
    id TEXT NOT NULL,
    inizio INTEGER NOT NULL,
    fine INTEGER NOT NULL,
    PRIMARY KEY (frammento, id)
  );
  CREATE TABLE brainet_aree_legami (
    frammento TEXT NOT NULL,
    area TEXT NOT NULL,
    tipo TEXT NOT NULL,
    id TEXT NOT NULL
  );
  CREATE INDEX brainet_aree_legami_frammento ON brainet_aree_legami (frammento);
  ALTER TABLE impostazioni ADD COLUMN brainet INTEGER;
  ALTER TABLE impostazioni ADD COLUMN mostra_database INTEGER;
";

/// Il testo di un frammento ha lo stesso limite di una nota (DEC-106).
const LIMITE_TESTO: usize = 4 * 1024 * 1024;
/// Nome di un'entità (EN-13).
const LUNGHEZZA_NOME_ENTITA: usize = 200;
/// Suggerimenti di @ per tipo (CMP-09 Suggerimenti).
const SUGGERIMENTI_PER_TIPO: usize = 5;
/// Lato lungo della foto di un'entità, che viaggia nel suo blocco.
const LATO_FOTO: u32 = 256;
const TIPI: [&str; 4] = ["persona", "argomento", "evento", "oggetto"];
const COLORI: [&str; 4] = ["avviso", "informazione", "successo", "errore"];

static CITA: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r#"<cita e="([^"]+)">([^<]*)</cita>"#).unwrap());
static AREA_APRE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"<area id="([^"]+)"(?: s="([^"]*)")?(?: e="([^"]*)")?>"#).unwrap()
});
static AREA_CHIUDE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r#"</area id="([^"]+)">"#).unwrap());
/// Un segno scritto a mano dall'utente, o arrivato con una nota importata, non diventa mai un
/// segno vero: il suo `<` si salva come `&lt;`.
static FINTO_SEGNO: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"<(/?)(cita|area)\b").unwrap());

// ——— Forme scambiate con l'interfaccia ———

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct StatoBrainet {
    pub acceso: bool,
    pub mostra_database: bool,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Frammento {
    pub id: String,
    pub testo: String,
    pub nato_il: String,
    pub modificato_il: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct Entita {
    pub id: String,
    pub nome: String,
    pub tipo: Option<String>,
    /// JPEG in base64, se c'è.
    pub foto: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VoceEntita {
    pub entita: Entita,
    /// Citazioni più aree (CA-18.11).
    pub nominata: usize,
    pub ultima_volta: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct Stato {
    pub id: String,
    pub nome: String,
    pub colore: String,
    pub ordine: i64,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct GiornoCalendario {
    /// AAAA-MM-GG nel fuso del computer.
    pub giorno: String,
    pub note: usize,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct Unione {
    pub citazioni: usize,
    pub aree: usize,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct StatoTolto {
    pub aree_cambiate: usize,
    pub aree_sparite: usize,
}

// ——— Lettura dei segni ———

#[derive(Debug, Clone, PartialEq)]
pub struct Citazione {
    pub entita: String,
    pub inizio: usize,
    pub fine: usize,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Area {
    pub id: String,
    pub inizio: usize,
    pub fine: usize,
    pub stati: Vec<String>,
    /// Le entità scritte nel segno; quelle citate dentro l'area si aggiungono nell'indice.
    pub entita: Vec<String>,
}

fn lista(valore: Option<regex::Match>) -> Vec<String> {
    valore
        .map(|m| m.as_str().split(',').filter(|s| !s.is_empty()).map(str::to_string).collect())
        .unwrap_or_default()
}

/// Citazioni e aree di un testo, con le posizioni in caratteri. Un'area senza chiusura arriva
/// fino in fondo; una chiusura senza apertura si ignora.
pub fn leggi_segni(testo: &str) -> (Vec<Citazione>, Vec<Area>) {
    let pos = |byte: usize| testo[..byte].chars().count();
    let citazioni = CITA
        .captures_iter(testo)
        .map(|c| {
            let m = c.get(0).unwrap();
            Citazione { entita: c[1].to_string(), inizio: pos(m.start()), fine: pos(m.end()) }
        })
        .collect();
    let chiusure: HashMap<String, usize> = AREA_CHIUDE
        .captures_iter(testo)
        .map(|c| (c[1].to_string(), pos(c.get(0).unwrap().end())))
        .collect();
    let fine_testo = testo.chars().count();
    let aree = AREA_APRE
        .captures_iter(testo)
        .map(|c| {
            let id = c[1].to_string();
            Area {
                inizio: pos(c.get(0).unwrap().start()),
                fine: chiusure.get(&id).copied().unwrap_or(fine_testo),
                stati: lista(c.get(2)),
                entita: lista(c.get(3)),
                id,
            }
        })
        .collect();
    (citazioni, aree)
}

/// Il testo che si legge, senza segni: per l'anteprima del Cestino.
pub fn testo_semplice(testo: &str) -> String {
    let testo = CITA.replace_all(testo, "$2");
    let testo = AREA_APRE.replace_all(&testo, "");
    let testo = AREA_CHIUDE.replace_all(&testo, "");
    testo.replace("&lt;", "<")
}

/// Toglie il valore di un segno finto da un testo che arriva da fuori (nota importata).
pub fn disinnesca(testo: &str) -> String {
    FINTO_SEGNO.replace_all(testo, "&lt;$1$2").into_owned()
}

/// Riscrive l'apertura dell'area `id` con stati ed entità nuovi; senza legami (né scritti né
/// citati dentro) l'area sparisce e resta solo la frase (RB-109, RB-110).
fn riscrivi_area(testo: &str, id: &str, stati: &[String], entita: &[String]) -> String {
    let (citazioni, aree) = leggi_segni(testo);
    let Some(area) = aree.iter().find(|a| a.id == id) else { return testo.to_string() };
    let citate = citazioni.iter().any(|c| c.inizio >= area.inizio && c.fine <= area.fine);
    let mut fuori = testo.to_string();
    let apre = AREA_APRE.captures_iter(testo).find(|c| &c[1] == id).map(|c| c.get(0).unwrap().range());
    let Some(range) = apre else { return fuori };
    if stati.is_empty() && entita.is_empty() && !citate {
        fuori.replace_range(range, "");
        let chiude = format!(r#"</area id="{id}">"#);
        return fuori.replacen(&chiude, "", 1);
    }
    let mut segno = format!(r#"<area id="{id}""#);
    if !stati.is_empty() {
        segno.push_str(&format!(r#" s="{}""#, stati.join(",")));
    }
    if !entita.is_empty() {
        segno.push_str(&format!(r#" e="{}""#, entita.join(",")));
    }
    segno.push('>');
    fuori.replace_range(range, &segno);
    fuori
}

fn data_locale(istante: &str) -> Option<NaiveDate> {
    istante.parse::<DateTime<Utc>>().ok().map(|i| i.with_timezone(&Local).date_naive())
}

// ——— Archivio ———

impl Archivio {
    // ——— Accendere e spegnere (FL-20) ———

    pub fn brainet_stato(&mut self) -> Esito<StatoBrainet> {
        self.con_riconnessione(|a| a.stato_brainet())
    }

    fn stato_brainet(&self) -> Esito<StatoBrainet> {
        let riga: Option<(Option<bool>, Option<bool>)> = self
            .db
            .query_row("SELECT brainet, mostra_database FROM impostazioni WHERE id = ?", [ID_IMPOSTAZIONI], |r| {
                Ok((r.get(0)?, r.get(1)?))
            })
            .optional()?;
        let (acceso, mostra) = riga.unwrap_or((None, None));
        Ok(StatoBrainet { acceso: acceso.unwrap_or(false), mostra_database: mostra.unwrap_or(true) })
    }

    fn acceso(&self) -> Esito<()> {
        if self.stato_brainet()?.acceso { Ok(()) } else { Err(Errore::BrainetSpento) }
    }

    pub fn accendi_brainet(&mut self) -> Esito<StatoBrainet> {
        self.con_riconnessione(|a| {
            a.imposta_brainet("brainet", true)?;
            a.stato_brainet()
        })
    }

    /// Spegnere vuol dire cancellare tutto Brainet (RB-111); gli altri computer lo sanno dalla
    /// sincronizzazione.
    pub fn spegni_brainet(&mut self) -> Esito<StatoBrainet> {
        self.con_riconnessione(|a| {
            a.cancella_tutto_brainet()?;
            a.imposta_brainet("brainet", false)?;
            a.stato_brainet()
        })
    }

    pub(super) fn cancella_tutto_brainet(&self) -> Esito<()> {
        self.db.execute_batch(
            "DELETE FROM brainet_citazioni; DELETE FROM brainet_aree; DELETE FROM brainet_aree_legami;
             DELETE FROM frammenti; DELETE FROM entita; DELETE FROM stati;",
        )?;
        Ok(())
    }

    pub fn imposta_mostra_database(&mut self, si: bool) -> Esito<StatoBrainet> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            a.imposta_brainet("mostra_database", si)?;
            a.stato_brainet()
        })
    }

    fn imposta_brainet(&self, colonna: &str, valore: bool) -> Esito<()> {
        let sql = format!(
            "INSERT INTO impostazioni (id, {colonna}) VALUES (?1, ?2)
             ON CONFLICT(id) DO UPDATE SET {colonna} = excluded.{colonna}"
        );
        self.db.execute(&sql, params![ID_IMPOSTAZIONI, valore])?;
        Ok(())
    }

    // ——— Frammenti (FL-16) ———

    /// Una nota Brainet nuova; il foglio la crea al primo carattere, così un foglio chiuso
    /// vuoto non lascia niente (RB-102).
    pub fn crea_frammento(&mut self, testo: &str) -> Esito<Frammento> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            if testo_semplice(testo).trim().is_empty() {
                return Err(Errore::NonValido("La nota è vuota".into()));
            }
            controlla_limite(testo)?;
            let id = uuid::Uuid::new_v4().to_string();
            let adesso = a.ora();
            a.db.execute(
                "INSERT INTO frammenti (id, testo, nato_il, modificato_il) VALUES (?, ?, ?, ?)",
                params![id, testo, adesso, adesso],
            )?;
            a.indicizza(&id, testo)?;
            a.frammento(&id)
        })
    }

    /// Salva il testo; il giorno di nascita non cambia (RB-103). Un testo vuoto cancella il
    /// frammento, come un foglio chiuso vuoto (RB-102).
    pub fn salva_frammento(&mut self, id: &str, testo: &str) -> Esito<Option<Frammento>> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            a.frammento(id)?;
            if testo_semplice(testo).trim().is_empty() {
                a.cancella_frammento(id)?;
                return Ok(None);
            }
            controlla_limite(testo)?;
            a.db.execute(
                "UPDATE frammenti SET testo = ?, modificato_il = ? WHERE id = ?",
                params![testo, a.ora(), id],
            )?;
            a.indicizza(id, testo)?;
            Ok(Some(a.frammento(id)?))
        })
    }

    pub fn leggi_frammento(&mut self, id: &str) -> Esito<Frammento> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            a.frammento(id)
        })
    }

    /// Dal più recente, a pagine: `prima_di` è il `nato_il` dell'ultimo già mostrato.
    pub fn elenca_frammenti(&mut self, prima_di: Option<&str>, quanti: usize) -> Esito<Vec<Frammento>> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            let mut stmt = a.db.prepare(
                "SELECT id, testo, nato_il, modificato_il FROM frammenti
                 WHERE eliminato_il IS NULL AND (?1 IS NULL OR nato_il < ?1)
                 ORDER BY nato_il DESC, id DESC LIMIT ?2",
            )?;
            let righe = stmt.query_map(params![prima_di, quanti as i64], riga_frammento)?;
            Ok(righe.collect::<Result<_, _>>()?)
        })
    }

    /// Nel Cestino, nella parte di Brainet (CA-18.9).
    pub fn elimina_frammento(&mut self, id: &str) -> Esito<ElementoCestino> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            let f = a.frammento(id)?;
            let eliminato = a.ora();
            a.db.execute("UPDATE frammenti SET eliminato_il = ? WHERE id = ?", params![eliminato, id])?;
            Ok(elemento_cestino(&f.id, &f.testo, eliminato))
        })
    }

    fn frammento(&self, id: &str) -> Esito<Frammento> {
        self.db
            .query_row(
                "SELECT id, testo, nato_il, modificato_il FROM frammenti WHERE id = ? AND eliminato_il IS NULL",
                [id],
                riga_frammento,
            )
            .optional()?
            .ok_or_else(|| Errore::BrainetNonTrovato(id.to_string()))
    }

    fn cancella_frammento(&self, id: &str) -> Esito<()> {
        self.db.execute("DELETE FROM frammenti WHERE id = ?", [id])?;
        self.togli_indice(id)
    }

    pub(super) fn togli_indice(&self, id: &str) -> Esito<()> {
        for tabella in ["brainet_citazioni", "brainet_aree", "brainet_aree_legami"] {
            self.db.execute(&format!("DELETE FROM {tabella} WHERE frammento = ?"), [id])?;
        }
        Ok(())
    }

    /// Rifà l'indice di un frammento dal suo testo. Un'area prende anche le entità citate
    /// dentro di lei (RB-107).
    pub(super) fn indicizza(&self, id: &str, testo: &str) -> Esito<()> {
        self.togli_indice(id)?;
        let (citazioni, aree) = leggi_segni(testo);
        for c in &citazioni {
            self.db.execute(
                "INSERT INTO brainet_citazioni (frammento, entita, inizio, fine) VALUES (?, ?, ?, ?)",
                params![id, c.entita, c.inizio as i64, c.fine as i64],
            )?;
        }
        for area in &aree {
            self.db.execute(
                "INSERT OR REPLACE INTO brainet_aree (frammento, id, inizio, fine) VALUES (?, ?, ?, ?)",
                params![id, area.id, area.inizio as i64, area.fine as i64],
            )?;
            let mut entita: Vec<&String> = area.entita.iter().collect();
            for c in citazioni.iter().filter(|c| c.inizio >= area.inizio && c.fine <= area.fine) {
                if !entita.contains(&&c.entita) {
                    entita.push(&c.entita);
                }
            }
            let legami = area.stati.iter().map(|s| ("stato", s)).chain(entita.into_iter().map(|e| ("entita", e)));
            for (tipo, valore) in legami {
                self.db.execute(
                    "INSERT INTO brainet_aree_legami (frammento, area, tipo, id) VALUES (?, ?, ?, ?)",
                    params![id, area.id, tipo, valore],
                )?;
            }
        }
        Ok(())
    }

    /// Quante note per giorno nel mese «AAAA-MM» (CA-18.14).
    pub fn calendario(&mut self, mese: &str) -> Esito<Vec<GiornoCalendario>> {
        let inizio = NaiveDate::parse_from_str(&format!("{mese}-01"), "%Y-%m-%d")
            .map_err(|_| Errore::NonValido(format!("Mese non valido: {mese}")))?;
        self.con_riconnessione(|a| {
            a.acceso()?;
            let nati: Vec<String> = a
                .db
                .prepare("SELECT nato_il FROM frammenti WHERE eliminato_il IS NULL")?
                .query_map([], |r| r.get(0))?
                .collect::<Result<_, _>>()?;
            let mut giorni: BTreeMap<NaiveDate, usize> = BTreeMap::new();
            for d in nati.iter().filter_map(|n| data_locale(n)) {
                if d.year() == inizio.year() && d.month() == inizio.month() {
                    *giorni.entry(d).or_default() += 1;
                }
            }
            Ok(giorni
                .into_iter()
                .map(|(g, note)| GiornoCalendario { giorno: g.format("%Y-%m-%d").to_string(), note })
                .collect())
        })
    }

    // ——— Entità (FL-17, FL-19) ———

    /// Le entità il cui nome contiene `testo`, al massimo cinque per tipo, quelle senza tipo
    /// per ultime (RB-104).
    pub fn suggerisci_entita(&mut self, testo: &str) -> Esito<Vec<Entita>> {
        let cerca = normalizza(testo.trim());
        self.con_riconnessione(|a| {
            a.acceso()?;
            let tutte = a.entita_vive()?;
            let mut per_tipo: HashMap<Option<String>, Vec<Entita>> = HashMap::new();
            for e in tutte {
                if normalizza(&e.nome).contains(&cerca) {
                    per_tipo.entry(e.tipo.clone()).or_default().push(e);
                }
            }
            let mut fuori = Vec::new();
            for tipo in TIPI.iter().map(|t| Some(t.to_string())).chain([None]) {
                if let Some(mut lista) = per_tipo.remove(&tipo) {
                    lista.sort_by(|x, y| normalizza(&x.nome).cmp(&normalizza(&y.nome)));
                    fuori.extend(lista.into_iter().take(SUGGERIMENTI_PER_TIPO));
                }
            }
            Ok(fuori)
        })
    }

    /// Nasce senza tipo (RB-105). Un nome uguale a un'entità che c'è già dà quella.
    pub fn crea_entita(&mut self, nome: &str) -> Esito<Entita> {
        let nome = nome.trim();
        if nome.is_empty() {
            return Err(Errore::NonValido("Il nome è vuoto".into()));
        }
        if nome.chars().count() > LUNGHEZZA_NOME_ENTITA {
            return Err(Errore::NonValido(format!("Il nome supera {LUNGHEZZA_NOME_ENTITA} caratteri")));
        }
        self.con_riconnessione(|a| {
            a.acceso()?;
            let esistente: Option<String> = a
                .db
                .query_row(
                    "SELECT id FROM entita WHERE chiave_nome = ? AND unita_in IS NULL",
                    [normalizza(nome)],
                    |r| r.get(0),
                )
                .optional()?;
            if let Some(id) = esistente {
                return a.entita(&id);
            }
            let id = uuid::Uuid::new_v4().to_string();
            a.db.execute(
                "INSERT INTO entita (id, nome, chiave_nome, creata_il) VALUES (?, ?, ?, ?)",
                params![id, nome, normalizza(nome), a.ora()],
            )?;
            a.entita(&id)
        })
    }

    /// Tutte le entità con quante volte sono nominate e l'ultima volta (CA-18.11), dalla
    /// nominata più di recente.
    pub fn elenca_entita(&mut self) -> Esito<Vec<VoceEntita>> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            let conteggi = a.conteggi()?;
            let mut voci: Vec<VoceEntita> = a
                .entita_vive()?
                .into_iter()
                .map(|e| {
                    let (nominata, ultima) = conteggi.get(&e.id).cloned().unwrap_or((0, None));
                    VoceEntita { entita: e, nominata, ultima_volta: ultima }
                })
                .collect();
            voci.sort_by(|x, y| y.ultima_volta.cmp(&x.ultima_volta).then_with(|| x.entita.nome.cmp(&y.entita.nome)));
            Ok(voci)
        })
    }

    /// Quante citazioni e aree passerebbero da `da` a `verso` (RB-108).
    pub fn anteprima_unione(&mut self, da: &str, verso: &str) -> Esito<Unione> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            a.controlla_unione(da, verso)?;
            a.conta_riferimenti(da)
        })
    }

    /// Unisce `da` in `verso`: resta `verso` con il suo nome; i testi non si riscrivono,
    /// `da` diventa un rimando (RB-108, EN-13).
    pub fn unisci_entita(&mut self, da: &str, verso: &str) -> Esito<Unione> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            a.controlla_unione(da, verso)?;
            let spostate = a.conta_riferimenti(da)?;
            a.db.execute("UPDATE entita SET unita_in = ? WHERE id = ? OR unita_in = ?", params![verso, da, da])?;
            Ok(spostate)
        })
    }

    fn controlla_unione(&self, da: &str, verso: &str) -> Esito<()> {
        a_vive(self, da)?;
        a_vive(self, verso)?;
        if da == verso {
            return Err(Errore::NonValido("Un'entità non si unisce a sé stessa".into()));
        }
        Ok(())
    }

    /// Mette la foto all'entità, ridotta a 256 px e in JPEG. None la toglie.
    pub fn imposta_foto(&mut self, id: &str, immagine: Option<&[u8]>) -> Esito<Entita> {
        let jpeg = match immagine {
            Some(byte) => Some(riduci_foto(byte)?),
            None => None,
        };
        self.con_riconnessione(|a| {
            a.acceso()?;
            a_vive(a, id)?;
            a.db.execute("UPDATE entita SET foto = ? WHERE id = ?", params![jpeg, id])?;
            a.entita(id)
        })
    }

    /// L'entità, anche unita: si segue il rimando fino a quella che resta.
    pub fn leggi_entita(&mut self, id: &str) -> Esito<Entita> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            let vera = a.risolvi_entita(id)?;
            a.entita(&vera)
        })
    }

    fn entita(&self, id: &str) -> Esito<Entita> {
        self.db
            .query_row("SELECT id, nome, tipo, foto FROM entita WHERE id = ?", [id], riga_entita)
            .optional()?
            .ok_or_else(|| Errore::BrainetNonTrovato(id.to_string()))
    }

    fn entita_vive(&self) -> Esito<Vec<Entita>> {
        Ok(self
            .db
            .prepare("SELECT id, nome, tipo, foto FROM entita WHERE unita_in IS NULL")?
            .query_map([], riga_entita)?
            .collect::<Result<_, _>>()?)
    }

    /// Dove porta un id di entità, seguendo le unioni (al massimo 20 passi, contro i cicli
    /// nati da unioni incrociate su due computer).
    fn risolvi_entita(&self, id: &str) -> Esito<String> {
        let rimandi = self.rimandi()?;
        Ok(segui(&rimandi, id))
    }

    fn rimandi(&self) -> Esito<HashMap<String, String>> {
        Ok(self
            .db
            .prepare("SELECT id, unita_in FROM entita WHERE unita_in IS NOT NULL")?
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?)))?
            .collect::<Result<_, _>>()?)
    }

    /// Per ogni entità che resta: citazioni più aree, e l'ultima nota che la nomina.
    fn conteggi(&self) -> Esito<HashMap<String, (usize, Option<String>)>> {
        let rimandi = self.rimandi()?;
        let righe: Vec<(String, String)> = self
            .db
            .prepare(
                "SELECT x.entita, f.nato_il FROM (
                   SELECT frammento, entita FROM brainet_citazioni
                   UNION ALL SELECT frammento, id FROM brainet_aree_legami WHERE tipo = 'entita'
                 ) x JOIN frammenti f ON f.id = x.frammento WHERE f.eliminato_il IS NULL",
            )?
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?)))?
            .collect::<Result<_, _>>()?;
        let mut fuori: HashMap<String, (usize, Option<String>)> = HashMap::new();
        for (entita, nato) in righe {
            let voce = fuori.entry(segui(&rimandi, &entita)).or_default();
            voce.0 += 1;
            if voce.1.as_deref().is_none_or(|u| u < nato.as_str()) {
                voce.1 = Some(nato);
            }
        }
        Ok(fuori)
    }

    fn conta_riferimenti(&self, id: &str) -> Esito<Unione> {
        let rimandi = self.rimandi()?;
        let conta = |sql: &str| -> Esito<usize> {
            let ids: Vec<String> = self.db.prepare(sql)?.query_map([], |r| r.get(0))?.collect::<Result<_, _>>()?;
            Ok(ids.iter().filter(|e| segui(&rimandi, e) == id).count())
        };
        Ok(Unione {
            citazioni: conta(
                "SELECT c.entita FROM brainet_citazioni c JOIN frammenti f ON f.id = c.frammento
                 WHERE f.eliminato_il IS NULL",
            )?,
            aree: conta(
                "SELECT l.id FROM brainet_aree_legami l JOIN frammenti f ON f.id = l.frammento
                 WHERE l.tipo = 'entita' AND f.eliminato_il IS NULL",
            )?,
        })
    }

    // ——— Stati (FL-21) ———

    pub fn elenca_stati(&mut self) -> Esito<Vec<Stato>> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            a.stati()
        })
    }

    fn stati(&self) -> Esito<Vec<Stato>> {
        Ok(self
            .db
            .prepare("SELECT id, nome, colore, ordine FROM stati ORDER BY ordine, nome")?
            .query_map([], |r| Ok(Stato { id: r.get(0)?, nome: r.get(1)?, colore: r.get(2)?, ordine: r.get(3)? }))?
            .collect::<Result<_, _>>()?)
    }

    /// Un nome già usato, senza maiuscole, è rifiutato (CA-18.15).
    pub fn crea_stato(&mut self, nome: &str, colore: &str) -> Esito<Stato> {
        let nome = nome.trim();
        if nome.is_empty() {
            return Err(Errore::NonValido("Il nome è vuoto".into()));
        }
        if !COLORI.contains(&colore) {
            return Err(Errore::NonValido(format!("Colore non valido: {colore}")));
        }
        self.con_riconnessione(|a| {
            a.acceso()?;
            let usato = a
                .db
                .query_row("SELECT 1 FROM stati WHERE chiave = ?", [chiave(nome)], |_| Ok(()))
                .optional()?;
            if usato.is_some() {
                return Err(Errore::NomeEsistente(nome.to_string()));
            }
            let ordine: i64 = a.db.query_row("SELECT ifnull(max(ordine), 0) + 1 FROM stati", [], |r| r.get(0))?;
            let id = uuid::Uuid::new_v4().to_string();
            a.db.execute(
                "INSERT INTO stati (id, nome, chiave, colore, ordine) VALUES (?, ?, ?, ?, ?)",
                params![id, nome, chiave(nome), colore, ordine],
            )?;
            Ok(Stato { id, nome: nome.to_string(), colore: colore.to_string(), ordine })
        })
    }

    /// Quante aree usano lo stato: per la domanda «cambiarlo?» prima di toglierlo (RB-110).
    pub fn aree_con_stato(&mut self, id: &str) -> Esito<usize> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            Ok(a.db.query_row(
                "SELECT count(*) FROM brainet_aree_legami l JOIN frammenti f ON f.id = l.frammento
                 WHERE l.tipo = 'stato' AND l.id = ? AND f.eliminato_il IS NULL",
                [id],
                |r| r.get::<_, i64>(0),
            )? as usize)
        })
    }

    /// Toglie lo stato dalle aree, o lo cambia con `sostituto`; un'area che resta senza legami
    /// sparisce (RB-110). Vale anche per le note nel Cestino.
    pub fn togli_stato(&mut self, id: &str, sostituto: Option<&str>) -> Esito<StatoTolto> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            let esiste = a.db.query_row("SELECT 1 FROM stati WHERE id = ?", [id], |_| Ok(())).optional()?;
            if esiste.is_none() {
                return Err(Errore::BrainetNonTrovato(id.to_string()));
            }
            if let Some(s) = sostituto {
                if s == id || a.db.query_row("SELECT 1 FROM stati WHERE id = ?", [s], |_| Ok(())).optional()?.is_none() {
                    return Err(Errore::NonValido("Stato sostituto non valido".into()));
                }
            }
            let frammenti: Vec<(String, String)> = a
                .db
                .prepare(
                    "SELECT DISTINCT f.id, f.testo FROM frammenti f JOIN brainet_aree_legami l ON l.frammento = f.id
                     WHERE l.tipo = 'stato' AND l.id = ?",
                )?
                .query_map([id], |r| Ok((r.get(0)?, r.get(1)?)))?
                .collect::<Result<_, _>>()?;
            let mut esito = StatoTolto { aree_cambiate: 0, aree_sparite: 0 };
            for (frammento, mut testo) in frammenti {
                let (_, aree) = leggi_segni(&testo);
                for area in aree.iter().filter(|x| x.stati.iter().any(|s| s == id)) {
                    let mut stati: Vec<String> = area.stati.iter().filter(|s| *s != id).cloned().collect();
                    if let Some(s) = sostituto {
                        if !stati.iter().any(|x| x == s) {
                            stati.push(s.to_string());
                        }
                    }
                    let prima = leggi_segni(&testo).1.len();
                    testo = riscrivi_area(&testo, &area.id, &stati, &area.entita);
                    if leggi_segni(&testo).1.len() < prima {
                        esito.aree_sparite += 1;
                    } else {
                        esito.aree_cambiate += 1;
                    }
                }
                a.db.execute(
                    "UPDATE frammenti SET testo = ?, modificato_il = ? WHERE id = ?",
                    params![testo, a.ora(), frammento],
                )?;
                a.indicizza(&frammento, &testo)?;
            }
            a.db.execute("DELETE FROM stati WHERE id = ?", [id])?;
            Ok(esito)
        })
    }

    // ——— Importare (FL-22) ———

    /// Copia la nota di CLOUD in Brainet, con il titolo come prima riga, nel giorno in cui era
    /// nata; tag e cartella si perdono. Con `sposta` la nota va nel Cestino (RB-112).
    pub fn importa_in_brainet(&mut self, nota: &str, sposta: bool) -> Esito<Frammento> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            let riga = a.trova(nota)?;
            let testo = match (riga.titolo.trim().is_empty(), riga.contenuto.trim().is_empty()) {
                (true, _) => riga.contenuto.clone(),
                (false, true) => riga.titolo.clone(),
                (false, false) => format!("{}\n\n{}", riga.titolo, riga.contenuto),
            };
            let testo = disinnesca(&testo);
            if testo.trim().is_empty() {
                return Err(Errore::NonValido("La nota è vuota".into()));
            }
            controlla_limite(&testo)?;
            let nato = riga.creata_scelta.clone().unwrap_or_else(|| riga.creata.clone());
            let id = uuid::Uuid::new_v4().to_string();
            a.db.execute(
                "INSERT INTO frammenti (id, testo, nato_il, modificato_il, da_nota) VALUES (?, ?, ?, ?, ?)",
                params![id, testo, nato, riga.modificata, nota],
            )?;
            a.indicizza(&id, &testo)?;
            if sposta {
                let provenienza = a.percorso(riga.cartella.as_deref())?.unwrap_or_default();
                a.db.execute(
                    "UPDATE note SET eliminata_il = ?, provenienza = ? WHERE id = ?",
                    params![a.ora(), provenienza, nota],
                )?;
            }
            a.frammento(&id)
        })
    }

    // ——— Cestino (SC-04, parte Brainet) ———

    pub(super) fn frammenti_nel_cestino(&self) -> Esito<Vec<ElementoCestino>> {
        let righe: Vec<(String, String, String)> = self
            .db
            .prepare("SELECT id, testo, eliminato_il FROM frammenti WHERE eliminato_il IS NOT NULL")?
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))?
            .collect::<Result<_, _>>()?;
        Ok(righe.into_iter().map(|(id, testo, eliminato)| elemento_cestino(&id, &testo, eliminato)).collect())
    }

    /// Some se l'id era un frammento nel Cestino.
    pub(super) fn ripristina_frammento(&self, id: &str) -> Esito<Option<Ripristinato>> {
        let n = self.db.execute(
            "UPDATE frammenti SET eliminato_il = NULL WHERE id = ? AND eliminato_il IS NOT NULL",
            [id],
        )?;
        if n == 0 {
            return Ok(None);
        }
        let f = self.frammento(id)?;
        Ok(Some(Ripristinato::Frammento(f)))
    }

    pub(super) fn elimina_frammento_per_sempre(&self, id: &str) -> Esito<bool> {
        let n = self.db.execute("DELETE FROM frammenti WHERE id = ? AND eliminato_il IS NOT NULL", [id])?;
        if n > 0 {
            self.togli_indice(id)?;
        }
        Ok(n > 0)
    }

    pub(super) fn svuota_frammenti(&self) -> Esito<()> {
        let ids: Vec<String> = self
            .db
            .prepare("SELECT id FROM frammenti WHERE eliminato_il IS NOT NULL")?
            .query_map([], |r| r.get(0))?
            .collect::<Result<_, _>>()?;
        for id in ids {
            self.elimina_frammento_per_sempre(&id)?;
        }
        Ok(())
    }
}

// ——— Sincronizzazione (DEC-75, DEC-76) ———

/// Tipi dei blocchi di Brainet; le app che non li conoscono li saltano.
pub const TIPI_BLOCCHI: [&str; 3] = ["frammento", "entita", "stato"];

impl Archivio {
    /// I campi del blocco di un elemento di Brainet; None se non c'è più.
    pub(super) fn campi_brainet(&self, id: &str, tipo: &str) -> Esito<Option<Value>> {
        use base64::Engine;
        let campi = match tipo {
            "frammento" => self
                .db
                .query_row(
                    "SELECT testo, nato_il, modificato_il, eliminato_il, da_nota FROM frammenti WHERE id = ?",
                    [id],
                    |r| {
                        Ok(json!({
                            "testo": r.get::<_, String>(0)?,
                            "nato_il": r.get::<_, String>(1)?,
                            "modificato_il": r.get::<_, String>(2)?,
                            "eliminato_il": r.get::<_, Option<String>>(3)?,
                            "da_nota": r.get::<_, Option<String>>(4)?,
                        }))
                    },
                )
                .optional()?,
            "entita" => self
                .db
                .query_row(
                    "SELECT nome, tipo, foto, unita_in, creata_il FROM entita WHERE id = ?",
                    [id],
                    |r| {
                        let foto: Option<Vec<u8>> = r.get(2)?;
                        Ok(json!({
                            "nome": r.get::<_, String>(0)?,
                            "tipo": r.get::<_, Option<String>>(1)?,
                            "foto": foto.map(|b| base64::engine::general_purpose::STANDARD.encode(b)),
                            "unita_in": r.get::<_, Option<String>>(3)?,
                            "creata_il": r.get::<_, String>(4)?,
                        }))
                    },
                )
                .optional()?,
            _ => self
                .db
                .query_row("SELECT nome, colore, ordine FROM stati WHERE id = ?", [id], |r| {
                    Ok(json!({
                        "nome": r.get::<_, String>(0)?,
                        "colore": r.get::<_, String>(1)?,
                        "ordine": r.get::<_, i64>(2)?,
                    }))
                })
                .optional()?,
        };
        Ok(campi)
    }

    /// Scrive un elemento di Brainet ricevuto (senza segnarlo: chi chiama tiene spenti i trigger)
    /// e rifà l'indice.
    pub(super) fn applica_brainet(&self, id: &str, tipo: &str, c: &Map<String, Value>) -> Esito<()> {
        use base64::Engine;
        let testo = |k: &str| c.get(k).and_then(Value::as_str).map(str::to_string);
        let adesso = self.ora();
        match tipo {
            "frammento" => {
                let t = testo("testo").unwrap_or_default();
                self.db.execute(
                    "INSERT INTO frammenti (id, testo, nato_il, modificato_il, eliminato_il, da_nota)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                     ON CONFLICT(id) DO UPDATE SET testo = ?2, nato_il = ?3, modificato_il = ?4,
                       eliminato_il = ?5, da_nota = ?6",
                    params![
                        id,
                        t,
                        testo("nato_il").unwrap_or_else(|| adesso.clone()),
                        testo("modificato_il").unwrap_or(adesso),
                        testo("eliminato_il"),
                        testo("da_nota"),
                    ],
                )?;
                self.indicizza(id, &t)?;
            }
            "entita" => {
                let nome = testo("nome").unwrap_or_default();
                let foto = testo("foto").and_then(|f| base64::engine::general_purpose::STANDARD.decode(f).ok());
                self.db.execute(
                    "INSERT INTO entita (id, nome, chiave_nome, tipo, foto, unita_in, creata_il)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
                     ON CONFLICT(id) DO UPDATE SET nome = ?2, chiave_nome = ?3, tipo = ?4, foto = ?5,
                       unita_in = ?6, creata_il = ?7",
                    params![
                        id,
                        nome,
                        normalizza(&nome),
                        testo("tipo"),
                        foto,
                        testo("unita_in"),
                        testo("creata_il").unwrap_or(adesso),
                    ],
                )?;
            }
            _ => {
                let nome = testo("nome").unwrap_or_default();
                self.db.execute(
                    "INSERT INTO stati (id, nome, chiave, colore, ordine) VALUES (?1, ?2, ?3, ?4, ?5)
                     ON CONFLICT(id) DO UPDATE SET nome = ?2, chiave = ?3, colore = ?4, ordine = ?5",
                    params![
                        id,
                        nome,
                        chiave(&nome),
                        testo("colore").unwrap_or_else(|| COLORI[1].to_string()),
                        c.get("ordine").and_then(Value::as_i64).unwrap_or(0),
                    ],
                )?;
            }
        }
        Ok(())
    }

    /// Il testo di qui di un frammento cambiato anche altrove va in un frammento nuovo, nato lo
    /// stesso giorno, con le sue pillole e aree (DEC-06, CA-18.17).
    pub(super) fn copia_frammento_in_conflitto(&self, originale: &str, testo: &str) -> Esito<String> {
        let id = uuid::Uuid::new_v4().to_string();
        self.db.execute(
            "INSERT INTO frammenti (id, testo, nato_il, modificato_il, da_nota)
             SELECT ?1, ?2, nato_il, ?3, da_nota FROM frammenti WHERE id = ?4",
            params![id, testo, self.ora(), originale],
        )?;
        self.indicizza(&id, testo)?;
        Ok(id)
    }
}

fn a_vive(a: &Archivio, id: &str) -> Esito<()> {
    let viva = a
        .db
        .query_row("SELECT 1 FROM entita WHERE id = ? AND unita_in IS NULL", [id], |_| Ok(()))
        .optional()?;
    viva.ok_or_else(|| Errore::BrainetNonTrovato(id.to_string()))
}

fn segui(rimandi: &HashMap<String, String>, id: &str) -> String {
    let mut attuale = id.to_string();
    let mut visti = HashSet::new();
    while let Some(dopo) = rimandi.get(&attuale) {
        if !visti.insert(attuale.clone()) || visti.len() > 20 {
            break;
        }
        attuale = dopo.clone();
    }
    attuale
}

fn controlla_limite(testo: &str) -> Esito<()> {
    if testo.len() > LIMITE_TESTO {
        return Err(Errore::TroppoGrande(testo.len() as u64));
    }
    Ok(())
}

fn riga_frammento(r: &rusqlite::Row) -> rusqlite::Result<Frammento> {
    Ok(Frammento { id: r.get(0)?, testo: r.get(1)?, nato_il: r.get(2)?, modificato_il: r.get(3)? })
}

fn riga_entita(r: &rusqlite::Row) -> rusqlite::Result<Entita> {
    use base64::Engine;
    let foto: Option<Vec<u8>> = r.get(3)?;
    Ok(Entita {
        id: r.get(0)?,
        nome: r.get(1)?,
        tipo: r.get(2)?,
        foto: foto.map(|b| base64::engine::general_purpose::STANDARD.encode(b)),
    })
}

fn elemento_cestino(id: &str, testo: &str, eliminato: String) -> ElementoCestino {
    ElementoCestino {
        id: id.to_string(),
        tipo: "frammento",
        nome: super::anteprima(&testo_semplice(testo)),
        provenienza: String::new(),
        eliminato,
        conteggio: None,
    }
}

/// Riduce un'immagine al lato lungo di 256 px e la salva in JPEG.
fn riduci_foto(byte: &[u8]) -> Esito<Vec<u8>> {
    let immagine = image::load_from_memory(byte)
        .map_err(|_| Errore::NonValido("Il file non è un'immagine".into()))?;
    let ridotta = if immagine.width().max(immagine.height()) > LATO_FOTO {
        immagine.thumbnail(LATO_FOTO, LATO_FOTO)
    } else {
        immagine
    };
    let mut fuori = std::io::Cursor::new(Vec::new());
    ridotta
        .to_rgb8()
        .write_to(&mut fuori, image::ImageFormat::Jpeg)
        .map_err(|_| Errore::NonValido("L'immagine non si salva".into()))?;
    Ok(fuori.into_inner())
}

#[cfg(test)]
#[path = "archivio_brainet_test.rs"]
mod test;
