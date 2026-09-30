// Lato sincronizzazione della copia di lavoro (DEC-75, DEC-76). Ogni elemento diventa un blocco:
// {"formato": "chiaro", "tipo", "modificato_il", "eliminato", "campi"}. Per ora i blocchi sono
// in chiaro, con il formato dichiarato per la cifratura futura (DEC-78). Ricevendo, un elemento
// non modificato qui si prende com'è; uno modificato anche qui si fonde campo per campo con la
// base: il testo cambiato da tutte e due le parti fa nascere la copia in conflitto (DEC-06),
// il resto va all'istante della modifica più tardo (RB-36, RB-37, RB-38); una nota finita in
// una cartella mandata nel cestino altrove la riporta fuori (RB-30).

use std::collections::BTreeSet;

use rusqlite::{params, OptionalExtension};
use serde_json::{json, Map, Value};

use super::{chiave, Archivio, ConflittoNato, Esito, SeEsiste};

/// Formato dei blocchi: in chiaro finché la cifratura è spenta (DEC-78).
pub const FORMATO: &str = "chiaro";

/// Un elemento da mandare al server.
#[derive(Debug, Clone)]
pub struct DaInviare {
    pub id: String,
    pub versione: i64,
    pub dati: String,
    pub modificato_il: String,
}

/// La versione attuale di un elemento sul server.
#[derive(Debug, Clone)]
pub struct Ricevuta {
    pub id: String,
    pub versione: i64,
    pub dati: String,
}

/// Cosa è cambiato ricevendo.
#[derive(Debug, Default)]
pub struct EsitoRicezione {
    /// Note il cui contenuto o posizione è cambiato: l'interfaccia le rilegge.
    pub note: Vec<String>,
    pub altro: bool,
}

struct Voce {
    tipo: String,
    versione: i64,
    base: Option<String>,
    modificato: bool,
    modificato_il: Option<String>,
}

const CAMPI_TESTO: [&str; 2] = ["titolo", "contenuto"];

impl Archivio {
    // ——— Stato della sincronizzazione ———

    pub fn stato_sinc(&mut self, chiave: &str) -> Esito<Option<String>> {
        self.con_riconnessione(|a| {
            Ok(a.db
                .query_row("SELECT valore FROM sinc_stato WHERE chiave = ?", [chiave], |r| r.get(0))
                .optional()?)
        })
    }

    pub fn imposta_stato_sinc(&mut self, chiave: &str, valore: &str) -> Esito<()> {
        self.con_riconnessione(|a| {
            a.db.execute(
                "INSERT OR REPLACE INTO sinc_stato (chiave, valore) VALUES (?, ?)",
                params![chiave, valore],
            )?;
            Ok(())
        })
    }

    /// I conflitti nati dall'ultima volta, per l'interfaccia.
    pub fn prendi_conflitti(&mut self) -> Vec<ConflittoNato> {
        std::mem::take(&mut *self.conflitti.borrow_mut())
    }

    // ——— Invio ———

    /// Gli elementi modificati qui, come blocchi da inviare, con la versione da cui partono.
    pub fn da_inviare(&mut self) -> Esito<Vec<DaInviare>> {
        self.con_riconnessione(|a| {
            let righe: Vec<(String, String, i64, Option<String>)> = a
                .db
                .prepare("SELECT id, tipo, versione, modificato_il FROM sinc_elementi WHERE modificato = 1")?
                .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)))?
                .collect::<Result<_, _>>()?;
            let mut blocchi = Vec::new();
            for (id, tipo, versione, modificato_il) in righe {
                let modificato_il = modificato_il.unwrap_or_else(|| a.ora());
                // Un elemento nato e sparito prima di essere mai inviato non interessa a nessuno.
                let blocco = a.blocco_attuale(&id, &tipo, &modificato_il)?;
                if versione == 0 && blocco["eliminato"] == json!(true) {
                    a.db.execute("DELETE FROM sinc_elementi WHERE id = ?", [&id])?;
                    continue;
                }
                blocchi.push(DaInviare { id, versione, dati: blocco.to_string(), modificato_il });
            }
            Ok(blocchi)
        })
    }

    /// Il server ha accettato il blocco: è la nuova base. Se nel frattempo l'elemento è cambiato
    /// ancora, resta da inviare.
    pub fn inviato(&mut self, blocco: &DaInviare, versione: i64) -> Esito<()> {
        self.con_riconnessione(|a| {
            a.db.execute(
                "UPDATE sinc_elementi SET versione = ?, base = ?,
                   modificato = CASE WHEN modificato_il = ? THEN 0 ELSE modificato END
                 WHERE id = ?",
                params![versione, blocco.dati, blocco.modificato_il, blocco.id],
            )?;
            Ok(())
        })
    }

    // ——— Ricezione ———

    /// Applica le versioni ricevute, fondendole con le modifiche fatte qui.
    pub fn ricevi(&mut self, ricevute: &[Ricevuta]) -> Esito<EsitoRicezione> {
        let esito = self.con_riconnessione(|a| a.ricevi_in_transazione(ricevute))?;
        // Le note cambiate non si sovrascrivono con il testo vecchio della finestra (DEC-06).
        self.cambiate_da_sinc.borrow_mut().extend(esito.note.iter().cloned());
        Ok(esito)
    }

    fn ricevi_in_transazione(&self, ricevute: &[Ricevuta]) -> Esito<EsitoRicezione> {
        let mut esito = EsitoRicezione::default();
        // Prima i tag e le cartelle, poi le note che li usano; i riferimenti si controllano alla
        // fine della transazione.
        self.db.pragma_update(None, "defer_foreign_keys", "ON")?;
        let ordine = |r: &Ricevuta| -> u8 {
            match serde_json::from_str::<Value>(&r.dati).ok().and_then(|b| b["tipo"].as_str().map(str::to_string)) {
                Some(t) if t == "tag" => 0,
                Some(t) if t == "cartella" => 1,
                _ => 2,
            }
        };
        let mut ordinate: Vec<&Ricevuta> = ricevute.iter().collect();
        ordinate.sort_by_key(|r| ordine(r));
        let mut spostate = Vec::new();
        for r in ordinate {
            let remoto: Value = match serde_json::from_str(&r.dati) {
                Ok(v) => v,
                Err(_) => continue,
            };
            let tipo = remoto["tipo"].as_str().unwrap_or("").to_string();
            if !["nota", "cartella", "tag", "impostazioni"].contains(&tipo.as_str()) {
                continue;
            }
            let voce = self.voce(&r.id)?;
            // L'eco di una versione già nota (per esempio la propria appena inviata).
            if voce.as_ref().is_some_and(|v| v.versione >= r.versione) {
                continue;
            }
            let prima = self.blocco_attuale(&r.id, &tipo, "")?;
            let risultato = match voce.as_ref().filter(|v| v.modificato) {
                None => remoto.clone(),
                Some(v) => self.fondi(&r.id, v, &prima, &remoto)?,
            };
            self.applica(&r.id, &tipo, &risultato)?;
            let uguale_al_server = campi(&risultato) == campi(&remoto)
                && risultato["eliminato"] == remoto["eliminato"];
            self.db.execute(
                "INSERT INTO sinc_elementi (id, tipo, versione, base, modificato, modificato_il)
                 VALUES (?1, ?2, ?3, ?4, 0, NULL)
                 ON CONFLICT(id) DO UPDATE SET versione = ?3, base = ?4,
                   modificato = CASE WHEN ?5 THEN 0 ELSE modificato END",
                params![r.id, tipo, r.versione, r.dati, uguale_al_server],
            )?;
            if tipo == "nota" {
                let cambiata = campi(&prima) != campi(&risultato) || prima["eliminato"] != risultato["eliminato"];
                if cambiata {
                    esito.note.push(r.id.clone());
                }
                if campi(&prima).get("cartella") != campi(&risultato).get("cartella") {
                    spostate.push(r.id.clone());
                }
            } else {
                esito.altro = true;
            }
        }
        self.sistema_riferimenti()?;
        // RB-30: una nota creata o spostata in una cartella che altrove è finita nel cestino la
        // riporta fuori, con le cartelle madri.
        let da_controllare: Vec<String> = self
            .db
            .prepare("SELECT id FROM sinc_elementi WHERE tipo = 'nota' AND modificato = 1")?
            .query_map([], |r| r.get(0))?
            .collect::<Result<Vec<String>, _>>()?
            .into_iter()
            .chain(spostate)
            .collect();
        for id in da_controllare {
            if self.riporta_fuori_le_cartelle(&id)? {
                esito.altro = true;
            }
        }
        Ok(esito)
    }

    fn voce(&self, id: &str) -> Esito<Option<Voce>> {
        Ok(self
            .db
            .query_row(
                "SELECT tipo, versione, base, modificato, modificato_il FROM sinc_elementi WHERE id = ?",
                [id],
                |r| {
                    Ok(Voce {
                        tipo: r.get(0)?,
                        versione: r.get(1)?,
                        base: r.get(2)?,
                        modificato: r.get::<_, i64>(3)? == 1,
                        modificato_il: r.get(4)?,
                    })
                },
            )
            .optional()?)
    }

    /// Fonde un elemento modificato qui e sul server, campo per campo con la base (DEC-76).
    fn fondi(&self, id: &str, voce: &Voce, locale: &Value, remoto: &Value) -> Esito<Value> {
        let base: Value = voce
            .base
            .as_deref()
            .and_then(|b| serde_json::from_str(b).ok())
            .unwrap_or(Value::Null);
        let quando_locale = voce.modificato_il.clone().unwrap_or_default();
        let quando_remoto = remoto["modificato_il"].as_str().unwrap_or("").to_string();
        let vince_remoto = quando_remoto > quando_locale;
        let eliminato_locale = locale["eliminato"] == json!(true);
        let eliminato_remoto = remoto["eliminato"] == json!(true);
        // Eliminato per sempre da una parte e cambiato dall'altra: vince il più tardo.
        if eliminato_locale || eliminato_remoto {
            if eliminato_locale && eliminato_remoto {
                return Ok(remoto.clone());
            }
            return Ok(if vince_remoto { remoto.clone() } else { locale.clone() });
        }
        let (b, l, r) = (campi(&base), campi(locale), campi(remoto));
        let mut fusi = Map::new();
        let mut conflitto_di_testo = false;
        let chiavi: BTreeSet<&String> = l.keys().chain(r.keys()).collect();
        for k in chiavi {
            let (vb, vl, vr) = (b.get(k), l.get(k), r.get(k));
            let valore = if vl == vr || vl == vb {
                vr
            } else if vr == vb {
                vl
            } else if voce.tipo == "nota" && CAMPI_TESTO.contains(&k.as_str()) {
                // Il testo cambiato da tutte e due le parti: l'originale prende quello del server,
                // quello di qui va nella copia in conflitto (DEC-06).
                conflitto_di_testo = true;
                vr
            } else if k == "tag" {
                fusi.insert(k.clone(), unisci_insiemi(vb, vl, vr));
                continue;
            } else if vince_remoto {
                vr
            } else {
                vl
            };
            if let Some(v) = valore {
                fusi.insert(k.clone(), v.clone());
            }
        }
        // RB-36: tra cestino e modifica vince l'azione più tarda, anche se hanno toccato campi
        // diversi della nota: una modifica più tarda la fa uscire dal cestino.
        if voce.tipo == "nota" {
            let k = "eliminata_il";
            let (cl, cr) = (l.get(k) != b.get(k), r.get(k) != b.get(k));
            let altro = |m: &Map<String, Value>| m.iter().any(|(c, v)| c != k && c != "provenienza" && c != "modificata" && b.get(c) != Some(v));
            if cl != cr && ((cl && altro(&r)) || (cr && altro(&l))) {
                let tardo = if vince_remoto { &r } else { &l };
                for c in [k, "provenienza"] {
                    fusi.insert(c.to_string(), tardo.get(c).cloned().unwrap_or(Value::Null));
                }
            }
        }
        // RB-38: una cartella rinominata in due modi prende il nome più tardo e accanto nasce
        // una cartella vuota con l'altro.
        if voce.tipo == "cartella" {
            let (nl, nr, nb) = (l.get("nome"), r.get("nome"), b.get("nome"));
            if nl != nr && nl != nb && nr != nb {
                let perdente = if vince_remoto { nl } else { nr };
                if let Some(nome) = perdente.and_then(Value::as_str) {
                    let madre = fusi.get("madre").and_then(Value::as_str).map(str::to_string);
                    self.nasce_cartella_vuota(nome, madre.as_deref())?;
                }
            }
        }
        if conflitto_di_testo {
            let titolo = l.get("titolo").and_then(Value::as_str).unwrap_or("").to_string();
            let contenuto = l.get("contenuto").and_then(Value::as_str).unwrap_or("").to_string();
            let copia = self.crea_copia_in_conflitto(id, &titolo, &contenuto)?;
            self.conflitti.borrow_mut().push(ConflittoNato {
                originale: id.to_string(),
                copia,
                scrivendo: false,
            });
        }
        Ok(json!({
            "formato": FORMATO,
            "tipo": voce.tipo,
            "modificato_il": if vince_remoto { quando_remoto } else { quando_locale },
            "eliminato": false,
            "campi": fusi,
        }))
    }

    // ——— Blocchi ———

    /// Il blocco dell'elemento com'è ora nella copia di lavoro; «eliminato» se non c'è più.
    fn blocco_attuale(&self, id: &str, tipo: &str, modificato_il: &str) -> Esito<Value> {
        let campi = match tipo {
            "nota" => self
                .db
                .query_row(
                    "SELECT titolo, contenuto, cartella, creata, creata_scelta, modificata,
                            fine_validita, eliminata_il, provenienza FROM note WHERE id = ?",
                    [id],
                    |r| {
                        Ok(json!({
                            "titolo": r.get::<_, String>(0)?,
                            "contenuto": r.get::<_, String>(1)?,
                            "cartella": r.get::<_, Option<String>>(2)?,
                            "creata": r.get::<_, String>(3)?,
                            "creata_scelta": r.get::<_, Option<String>>(4)?,
                            "modificata": r.get::<_, String>(5)?,
                            "fine_validita": r.get::<_, Option<String>>(6)?,
                            "eliminata_il": r.get::<_, Option<String>>(7)?,
                            "provenienza": r.get::<_, Option<String>>(8)?,
                        }))
                    },
                )
                .optional()?
                .map(|mut c| -> Esito<Value> {
                    let mut tag: Vec<String> = self
                        .db
                        .prepare("SELECT tag FROM note_tag WHERE nota = ?")?
                        .query_map([id], |r| r.get(0))?
                        .collect::<Result<_, _>>()?;
                    tag.sort();
                    c["tag"] = json!(tag);
                    Ok(c)
                })
                .transpose()?,
            "cartella" => self
                .db
                .query_row(
                    "SELECT nome, madre, eliminata_il, provenienza FROM cartelle WHERE id = ?",
                    [id],
                    |r| {
                        Ok(json!({
                            "nome": r.get::<_, String>(0)?,
                            "madre": r.get::<_, Option<String>>(1)?,
                            "eliminata_il": r.get::<_, Option<String>>(2)?,
                            "provenienza": r.get::<_, Option<String>>(3)?,
                        }))
                    },
                )
                .optional()?,
            "impostazioni" => self
                .db
                .query_row(
                    "SELECT scorciatoia_windows, scorciatoia_macos FROM impostazioni WHERE id = ?",
                    [id],
                    |r| {
                        Ok(json!({
                            "scorciatoia_windows": r.get::<_, Option<String>>(0)?,
                            "scorciatoia_macos": r.get::<_, Option<String>>(1)?,
                        }))
                    },
                )
                .optional()?,
            _ => self
                .db
                .query_row("SELECT nome, padre FROM tag WHERE id = ?", [id], |r| {
                    Ok(json!({
                        "nome": r.get::<_, String>(0)?,
                        "padre": r.get::<_, Option<String>>(1)?,
                    }))
                })
                .optional()?,
        };
        Ok(json!({
            "formato": FORMATO,
            "tipo": tipo,
            "modificato_il": modificato_il,
            "eliminato": campi.is_none(),
            "campi": campi.unwrap_or_else(|| json!({})),
        }))
    }

    /// Scrive il blocco nella copia di lavoro senza segnarlo come modificato qui.
    fn applica(&self, id: &str, tipo: &str, blocco: &Value) -> Esito<()> {
        self.db.execute("INSERT OR REPLACE INTO sinc_stato (chiave, valore) VALUES ('applicando', '1')", [])?;
        let esito = self.applica_senza_segnare(id, tipo, blocco);
        self.db.execute("DELETE FROM sinc_stato WHERE chiave = 'applicando'", [])?;
        esito
    }

    fn applica_senza_segnare(&self, id: &str, tipo: &str, blocco: &Value) -> Esito<()> {
        let tabella = match tipo {
            "nota" => "note",
            "cartella" => "cartelle",
            "impostazioni" => "impostazioni",
            _ => "tag",
        };
        if blocco["eliminato"] == json!(true) {
            self.db.execute(&format!("DELETE FROM {tabella} WHERE id = ?"), [id])?;
            return Ok(());
        }
        let c = campi(blocco);
        let testo = |k: &str| c.get(k).and_then(Value::as_str).map(str::to_string);
        match tipo {
            "nota" => {
                let adesso = self.ora();
                self.db.execute(
                    "INSERT INTO note (id, titolo, contenuto, cartella, creata, creata_scelta, modificata,
                                       fine_validita, eliminata_il, provenienza)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
                     ON CONFLICT(id) DO UPDATE SET titolo = ?2, contenuto = ?3, cartella = ?4,
                       creata = ?5, creata_scelta = ?6, modificata = ?7, fine_validita = ?8,
                       eliminata_il = ?9, provenienza = ?10",
                    params![
                        id,
                        testo("titolo").unwrap_or_default(),
                        testo("contenuto").unwrap_or_default(),
                        testo("cartella"),
                        testo("creata").unwrap_or_else(|| adesso.clone()),
                        testo("creata_scelta"),
                        testo("modificata").unwrap_or(adesso),
                        testo("fine_validita"),
                        testo("eliminata_il"),
                        testo("provenienza"),
                    ],
                )?;
                self.db.execute("DELETE FROM note_tag WHERE nota = ?", [id])?;
                if let Some(tag) = c.get("tag").and_then(Value::as_array) {
                    for t in tag.iter().filter_map(Value::as_str) {
                        self.db.execute(
                            "INSERT OR IGNORE INTO note_tag (nota, tag) SELECT ?1, id FROM tag WHERE id = ?2",
                            params![id, t],
                        )?;
                    }
                }
            }
            "impostazioni" => {
                self.db.execute(
                    "INSERT INTO impostazioni (id, scorciatoia_windows, scorciatoia_macos) VALUES (?1, ?2, ?3)
                     ON CONFLICT(id) DO UPDATE SET scorciatoia_windows = ?2, scorciatoia_macos = ?3",
                    params![id, testo("scorciatoia_windows"), testo("scorciatoia_macos")],
                )?;
            }
            "cartella" => {
                let madre = testo("madre");
                let mut nome = testo("nome").unwrap_or_default();
                let eliminata = testo("eliminata_il");
                // Due dispositivi hanno creato cartelle sorelle con lo stesso nome: quella
                // ricevuta prende un numero, come in RB-31, e il nome nuovo torna al server.
                let mut rinominata = false;
                if eliminata.is_none() {
                    let scelta = self.risolvi(madre.as_deref(), &nome, SeEsiste::Numero, Some(id))?;
                    rinominata = scelta.nome != nome;
                    nome = scelta.nome;
                }
                self.db.execute(
                    "INSERT INTO cartelle (id, nome, chiave, madre, eliminata_il, provenienza)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                     ON CONFLICT(id) DO UPDATE SET nome = ?2, chiave = ?3, madre = ?4,
                       eliminata_il = ?5, provenienza = ?6",
                    params![id, nome, chiave(&nome), madre, eliminata, testo("provenienza")],
                )?;
                if rinominata {
                    self.segna(id, "cartella")?;
                }
            }
            _ => {
                let padre = testo("padre");
                let nome = testo("nome").unwrap_or_default();
                // Lo stesso tag creato su due dispositivi: si tiene quello ricevuto e le note del
                // doppione passano a lui.
                let doppione: Option<String> = self
                    .db
                    .query_row(
                        "SELECT id FROM tag WHERE ifnull(padre, '') = ? AND chiave = ? AND id <> ?",
                        params![padre.as_deref().unwrap_or(""), chiave(&nome), id],
                        |r| r.get(0),
                    )
                    .optional()?;
                if let Some(d) = &doppione {
                    self.db.execute("UPDATE tag SET chiave = chiave || '#' || id WHERE id = ?", [d])?;
                }
                self.db.execute(
                    "INSERT INTO tag (id, nome, chiave, padre) VALUES (?1, ?2, ?3, ?4)
                     ON CONFLICT(id) DO UPDATE SET nome = ?2, chiave = ?3, padre = ?4",
                    params![id, nome, chiave(&nome), padre],
                )?;
                if let Some(d) = doppione {
                    let note: Vec<String> = self
                        .db
                        .prepare("SELECT nota FROM note_tag WHERE tag = ?")?
                        .query_map([&d], |r| r.get(0))?
                        .collect::<Result<_, _>>()?;
                    self.db.execute("UPDATE OR IGNORE note_tag SET tag = ? WHERE tag = ?", params![id, d])?;
                    self.db.execute("UPDATE tag SET padre = ? WHERE padre = ?", params![id, d])?;
                    self.db.execute("DELETE FROM tag WHERE id = ?", [&d])?;
                    self.segna(&d, "tag")?;
                    for n in note {
                        self.segna(&n, "nota")?;
                    }
                }
            }
        }
        Ok(())
    }

    /// Riferimenti a elementi che non ci sono più (eliminati per sempre altrove): la nota va
    /// nella radice, la cartella al primo livello, il tag perde il padre.
    fn sistema_riferimenti(&self) -> Esito<()> {
        self.db.execute("INSERT OR REPLACE INTO sinc_stato (chiave, valore) VALUES ('applicando', '1')", [])?;
        self.db.execute_batch(
            "UPDATE note SET cartella = NULL WHERE cartella IS NOT NULL AND cartella NOT IN (SELECT id FROM cartelle);
             UPDATE cartelle SET madre = NULL WHERE madre IS NOT NULL AND madre NOT IN (SELECT id FROM cartelle);
             UPDATE tag SET padre = NULL WHERE padre IS NOT NULL AND padre NOT IN (SELECT id FROM tag);
             DELETE FROM note_tag WHERE tag NOT IN (SELECT id FROM tag) OR nota NOT IN (SELECT id FROM note);",
        )?;
        self.db.execute("DELETE FROM sinc_stato WHERE chiave = 'applicando'", [])?;
        Ok(())
    }

    /// RB-30: la nota, visibile, sta in una cartella nel cestino? Allora le cartelle tornano
    /// com'erano, e la modifica va al server.
    fn riporta_fuori_le_cartelle(&self, nota: &str) -> Esito<bool> {
        let riga: Option<(Option<String>, Option<String>)> = self
            .db
            .query_row("SELECT cartella, eliminata_il FROM note WHERE id = ?", [nota], |r| {
                Ok((r.get(0)?, r.get(1)?))
            })
            .optional()?;
        let Some((mut attuale, None)) = riga else { return Ok(false) };
        let mut cambiato = false;
        while let Some(id) = attuale {
            let riga = self.cartella(&id)?;
            if riga.eliminata_il.is_some() {
                self.db.execute(
                    "UPDATE cartelle SET eliminata_il = NULL, provenienza = NULL WHERE id = ?",
                    [&id],
                )?;
                cambiato = true;
            }
            attuale = riga.madre;
        }
        Ok(cambiato)
    }

    /// RB-38: la cartella vuota con il nome che ha perso, accanto a quella rinominata.
    fn nasce_cartella_vuota(&self, nome: &str, madre: Option<&str>) -> Esito<()> {
        let scelta = self.risolvi(madre, nome, SeEsiste::Numero, None)?;
        self.inserisci_cartella(&scelta.nome, madre)?;
        Ok(())
    }

    /// La copia in conflitto: stessa cartella e stessi tag dell'originale, il titolo seguito da
    /// «(copia in conflitto)» (RB-39). Si crea come una nota qualsiasi, quindi va al server.
    pub(super) fn crea_copia_in_conflitto(&self, originale: &str, titolo: &str, contenuto: &str) -> Esito<String> {
        let id = uuid::Uuid::new_v4().to_string();
        let adesso = self.ora();
        let titolo = if titolo.trim().is_empty() {
            "(copia in conflitto)".to_string()
        } else {
            format!("{titolo} (copia in conflitto)")
        };
        self.db.execute(
            "INSERT INTO note (id, titolo, contenuto, cartella, creata, modificata)
             SELECT ?1, ?2, ?3, cartella, ?4, ?4 FROM note WHERE id = ?5",
            params![id, titolo, contenuto, adesso, originale],
        )?;
        self.db.execute(
            "INSERT INTO note_tag (nota, tag) SELECT ?1, tag FROM note_tag WHERE nota = ?2",
            params![id, originale],
        )?;
        Ok(id)
    }

    /// Segna a mano un elemento come modificato qui (mentre i trigger tacciono).
    fn segna(&self, id: &str, tipo: &str) -> Esito<()> {
        self.db.execute(
            "INSERT INTO sinc_elementi (id, tipo, modificato, modificato_il) VALUES (?1, ?2, 1, ?3)
             ON CONFLICT(id) DO UPDATE SET modificato = 1, modificato_il = ?3",
            params![id, tipo, self.ora()],
        )?;
        Ok(())
    }
}

fn campi(blocco: &Value) -> Map<String, Value> {
    blocco["campi"].as_object().cloned().unwrap_or_default()
}

/// Tag della nota cambiati da tutte e due le parti: restano quelli che nessuno ha tolto, più
/// quelli aggiunti da una parte o dall'altra.
fn unisci_insiemi(base: Option<&Value>, locale: Option<&Value>, remoto: Option<&Value>) -> Value {
    let insieme = |v: Option<&Value>| -> BTreeSet<String> {
        v.and_then(Value::as_array)
            .map(|a| a.iter().filter_map(Value::as_str).map(str::to_string).collect())
            .unwrap_or_default()
    };
    let (b, l, r) = (insieme(base), insieme(locale), insieme(remoto));
    let tenuti = b.iter().filter(|t| l.contains(*t) && r.contains(*t)).cloned();
    let aggiunti = l.difference(&b).chain(r.difference(&b)).cloned();
    let tutti: BTreeSet<String> = tenuti.chain(aggiunti).collect();
    json!(tutti.into_iter().collect::<Vec<_>>())
}

#[cfg(test)]
#[path = "archivio_sinc_test.rs"]
mod test;
