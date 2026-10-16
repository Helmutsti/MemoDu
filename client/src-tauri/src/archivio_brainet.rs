// Brainet nella copia di lavoro (RF-18, DEC-134, DEC-145, DEC-146).
// Dalla DEC-145 Brainet non ha note sue: le note di CLOUD in vista Markdown tengono pillole e
// aree dentro il testo, con due segni in forma di tag, come `<u>` per il sottolineato (DEC-28;
// scelta di Manuel Cucca del 15/10/2026):
//   collegamento (EN-14): <cita e="ID">nome</cita>
//   area (EN-15):         <area id="ID" s="ID,ID" e="ID,ID">frase</area id="ID">
// L'apertura e la chiusura di un'area si accoppiano per id, così due aree possono sovrapporsi.
// Citazioni e aree delle tabelle `brainet_*` sono solo un indice ricavato dal testo, che non si
// sincronizza: un trigger mette in `brainet_da_indicizzare` ogni nota che ha (o aveva) dei
// segni, e l'indice di quelle note si rifà prima di ogni lettura di Brainet, da qualunque
// strada sia arrivata la modifica (scrittura, sincronizzazione, copia in conflitto). Gli
// allegati hanno un segno loro (archivio_allegati.rs). I frammenti della 1.0.0 diventano note
// allo schema 10 (RB-125).

use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};
use std::sync::LazyLock;

use chrono::{DateTime, Datelike, Local, NaiveDate, Utc};
use regex::Regex;
use rusqlite::{params, OptionalExtension};
use serde::Serialize;
use serde_json::{json, Map, Value};

use super::impostazioni::ID as ID_IMPOSTAZIONI;
use super::{chiave, normalizza, Archivio, Errore, Esito};

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

/// Contiene un segno di Brainet (pillola o area)? Per i trigger dell'indice.
const HA_SEGNI: &str = "(instr({t}, '<cita ') > 0 OR instr({t}, '<area ') > 0)";

/// Schema 10 (DEC-146, DEC-147): la nota sa se sta in Brainet (`brainet`); l'indice passa dai
/// frammenti alle note e si rifà da solo; la ricerca legge il testo senza segni (RB-126). I frammenti diventano note in `passa_frammenti_in_note`.
pub fn schema_brainet_note() -> String {
    let nuovo = HA_SEGNI.replace("{t}", "NEW.contenuto");
    let vecchio = HA_SEGNI.replace("{t}", "OLD.contenuto");
    format!(
        "
  ALTER TABLE note ADD COLUMN brainet INTEGER;
  DROP TRIGGER IF EXISTS sinc_frammenti_INSERT;
  DROP TRIGGER IF EXISTS sinc_frammenti_UPDATE;
  DROP TRIGGER IF EXISTS sinc_frammenti_DELETE;
  DELETE FROM brainet_citazioni; DELETE FROM brainet_aree; DELETE FROM brainet_aree_legami;
  ALTER TABLE brainet_citazioni RENAME COLUMN frammento TO nota;
  ALTER TABLE brainet_aree RENAME COLUMN frammento TO nota;
  ALTER TABLE brainet_aree_legami RENAME COLUMN frammento TO nota;
  CREATE TABLE brainet_da_indicizzare (nota TEXT PRIMARY KEY);
  CREATE TRIGGER brainet_note_INSERT AFTER INSERT ON note WHEN {nuovo} BEGIN
    INSERT OR IGNORE INTO brainet_da_indicizzare (nota) VALUES (NEW.id);
  END;
  CREATE TRIGGER brainet_note_UPDATE AFTER UPDATE OF contenuto ON note WHEN {nuovo} OR {vecchio} BEGIN
    INSERT OR IGNORE INTO brainet_da_indicizzare (nota) VALUES (NEW.id);
  END;
  CREATE TRIGGER brainet_note_DELETE AFTER DELETE ON note BEGIN
    DELETE FROM brainet_citazioni WHERE nota = OLD.id;
    DELETE FROM brainet_aree WHERE nota = OLD.id;
    DELETE FROM brainet_aree_legami WHERE nota = OLD.id;
    DELETE FROM brainet_da_indicizzare WHERE nota = OLD.id;
  END;
  DROP TRIGGER IF EXISTS ricerca_note_INSERT;
  DROP TRIGGER IF EXISTS ricerca_note_UPDATE;
  CREATE TRIGGER ricerca_note_INSERT AFTER INSERT ON note BEGIN
    INSERT INTO ricerca_righe (id, riga)
    VALUES (NEW.id, (SELECT ifnull(max(riga), 0) + 1 FROM ricerca_righe));
    INSERT INTO ricerca (rowid, id, titolo, contenuto, tag)
    VALUES ((SELECT riga FROM ricerca_righe WHERE id = NEW.id), NEW.id, NEW.titolo,
            senza_segni(NEW.contenuto), tag_della_nota(NEW.id));
  END;
  CREATE TRIGGER ricerca_note_UPDATE AFTER UPDATE OF titolo, contenuto ON note BEGIN
    UPDATE ricerca SET titolo = NEW.titolo, contenuto = senza_segni(NEW.contenuto)
    WHERE rowid = (SELECT riga FROM ricerca_righe WHERE id = NEW.id);
  END;
"
    )
}

/// Dopo `schema_brainet_note`, nella stessa transazione: ogni frammento diventa una nota in
/// Brainet con lo stesso id, senza titolo, fuori dalle cartelle, in vista Markdown, con le sue
/// date; uno nel Cestino va nel Cestino (RB-125, DEC-147). La riga di sincronizzazione diventa quella
/// di una nota, da inviare; la base si traduce, così la fusione con il server confronta campi
/// uguali. Poi la ricerca si rifà senza segni e l'indice di Brainet si rifà alla prima lettura.
pub fn passa_frammenti_in_note(db: &rusqlite::Connection) -> rusqlite::Result<()> {
    let frammenti: Vec<(String, String, String, String, Option<String>)> = db
        .prepare("SELECT id, testo, nato_il, modificato_il, eliminato_il FROM frammenti")?
        .query_map([], |r| {
            Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?))
        })?
        .collect::<Result<_, _>>()?;
    for (id, testo, nato, modificato, eliminato) in frammenti {
        db.execute(
            "INSERT OR IGNORE INTO note (id, titolo, contenuto, cartella, creata, modificata, eliminata_il,
                                         provenienza, vista, brainet)
             VALUES (?1, '', ?2, NULL, ?3, ?4, ?5, CASE WHEN ?5 IS NULL THEN NULL ELSE '' END, 'markdown', 1)",
            params![id, testo, nato, modificato, eliminato],
        )?;
        let base: Option<Option<String>> = db
            .query_row("SELECT base FROM sinc_elementi WHERE id = ?", [&id], |r| {
                r.get(0)
            })
            .optional()?;
        let base = base
            .flatten()
            .and_then(|b| serde_json::from_str::<Value>(&b).ok())
            .map(|b| blocco_da_frammento(&b).to_string());
        db.execute(
            "INSERT INTO sinc_elementi (id, tipo, modificato, modificato_il) VALUES (?1, 'nota', 1, adesso_utc())
             ON CONFLICT(id) DO UPDATE SET tipo = 'nota', base = ?2, modificato = 1, modificato_il = adesso_utc()",
            params![id, base],
        )?;
    }
    db.execute_batch(
        "DELETE FROM frammenti;
         UPDATE ricerca SET contenuto = senza_segni((SELECT contenuto FROM note WHERE note.id = ricerca.id));",
    )?;
    let con_segni = HA_SEGNI.replace("{t}", "contenuto");
    db.execute(&format!("INSERT OR IGNORE INTO brainet_da_indicizzare (nota) SELECT id FROM note WHERE {con_segni}"), [])?;
    Ok(())
}

/// Il blocco di un frammento (1.0.0) tradotto in quello di una nota di CLOUD (RB-125): lo
/// stesso passaggio della migrazione, per i blocchi che arrivano da un computer con la 1.0.0.
pub fn blocco_da_frammento(blocco: &Value) -> Value {
    let c = blocco.get("campi").and_then(Value::as_object);
    let campo = |k: &str| c.and_then(|c| c.get(k)).cloned().unwrap_or(Value::Null);
    let eliminato = campo("eliminato_il");
    let mut fuori = blocco.clone();
    fuori["tipo"] = json!("nota");
    if blocco["eliminato"] != json!(true) {
        fuori["campi"] = json!({
            "titolo": "",
            "contenuto": campo("testo").as_str().unwrap_or(""),
            "cartella": null,
            "creata": campo("nato_il"),
            "creata_scelta": null,
            "modificata": campo("modificato_il"),
            "fine_validita": null,
            "provenienza": if eliminato.is_null() { Value::Null } else { json!("") },
            "eliminata_il": eliminato,
            "vista": "markdown",
            "brainet": true,
            "tag": [],
        });
    }
    fuori
}

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
// ——— Forme scambiate con l'interfaccia ———

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct StatoBrainet {
    pub acceso: bool,
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
    /// AAAA-MM-GG nel fuso del computer: un giorno con almeno una nota con Brainet (RB-113).
    pub giorno: String,
}

/// Un paragrafo che nomina l'entità (RB-124).
#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct Passaggio {
    pub nota: String,
    /// Il titolo, o le prime parole.
    pub titolo: String,
    /// HH:MM della creazione nel fuso del computer; vuota per una data scelta senza ora.
    pub ora: String,
    /// Il paragrafo con i suoi segni.
    pub testo: String,
    /// Dove comincia il paragrafo nella nota, come la conta l'editor (unità UTF-16 di
    /// JavaScript): con un'emoji prima, i caratteri non bastano.
    pub inizio: usize,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct GiornoPassaggi {
    pub giorno: String,
    pub passaggi: Vec<Passaggio>,
}

/// La pagina dell'entità (FL-26).
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PaginaEntita {
    pub entita: Entita,
    pub nominata: usize,
    pub ultima_volta: Option<String>,
    pub giorni: Vec<GiornoPassaggi>,
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
    super::allegati::senza_segni_allegato(&testo).replace("&lt;", "<")
}

/// Il testo ha pillole, aree o allegati? Allora la nota resta in vista Markdown (RB-123).
pub fn ha_segni(testo: &str) -> bool {
    CITA.is_match(testo)
        || AREA_APRE.is_match(testo)
        || super::allegati::allegati_nel_testo(testo).next().is_some()
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
        let acceso: Option<Option<bool>> = self
            .db
            .query_row("SELECT brainet FROM impostazioni WHERE id = ?", [ID_IMPOSTAZIONI], |r| r.get(0))
            .optional()?;
        Ok(StatoBrainet { acceso: acceso.flatten().unwrap_or(false) })
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

    /// Spegnere nasconde Brainet e non cancella niente: pillole, aree, allegati, entità e stati
    /// restano (RB-111, DEC-145); gli altri computer lo sanno dalla sincronizzazione.
    pub fn spegni_brainet(&mut self) -> Esito<StatoBrainet> {
        self.con_riconnessione(|a| {
            a.imposta_brainet("brainet", false)?;
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

    // ——— Spostare in Brainet e il Journal (DEC-147) ———

    /// «Sposta in Brainet»: la nota esce dalla cartella, dall'albero e dalla ricerca, e resta in
    /// vista Markdown; senza ritorno (RB-130, RB-132).
    pub fn sposta_in_brainet(&mut self, id: &str) -> Esito<super::Nota> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            a.trova(id)?;
            a.db.execute(
                "UPDATE note SET brainet = 1, cartella = NULL, vista = 'markdown' WHERE id = ?",
                [id],
            )?;
            a.nota_da_id(id)
        })
    }

    /// Le note in Brainet fuori dal Cestino, dalla più recente (RB-131).
    pub fn elenca_journal(&mut self) -> Esito<Vec<super::Nota>> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            let ids: Vec<String> = a
                .db
                .prepare(
                    "SELECT id FROM note WHERE brainet = 1 AND eliminata_il IS NULL
                     ORDER BY coalesce(creata_scelta, creata) DESC, creata DESC",
                )?
                .query_map([], |r| r.get(0))?
                .collect::<Result<_, _>>()?;
            ids.iter().map(|id| a.nota_da_id(id)).collect()
        })
    }

    // ——— L'indice (DEC-146) ———

    /// Rifà l'indice delle note messe in coda dai trigger: quelle che hanno, o avevano, dei
    /// segni. Si chiama prima di ogni lettura di Brainet.
    pub(super) fn aggiorna_indice(&self) -> Esito<()> {
        let righe: Vec<(String, Option<String>)> = self
            .db
            .prepare(
                "SELECT d.nota, n.contenuto FROM brainet_da_indicizzare d LEFT JOIN note n ON n.id = d.nota",
            )?
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?)))?
            .collect::<Result<_, _>>()?;
        for (nota, testo) in righe {
            match testo {
                Some(t) => self.indicizza(&nota, &t)?,
                None => self.togli_indice(&nota)?,
            }
        }
        self.db.execute("DELETE FROM brainet_da_indicizzare", [])?;
        Ok(())
    }

    pub(super) fn togli_indice(&self, id: &str) -> Esito<()> {
        for tabella in ["brainet_citazioni", "brainet_aree", "brainet_aree_legami"] {
            self.db.execute(&format!("DELETE FROM {tabella} WHERE nota = ?"), [id])?;
        }
        Ok(())
    }

    /// Rifà l'indice di una nota dal suo testo. Un'area prende anche le entità citate
    /// dentro di lei (RB-107).
    pub(super) fn indicizza(&self, id: &str, testo: &str) -> Esito<()> {
        self.togli_indice(id)?;
        let (citazioni, aree) = leggi_segni(testo);
        for c in &citazioni {
            self.db.execute(
                "INSERT INTO brainet_citazioni (nota, entita, inizio, fine) VALUES (?, ?, ?, ?)",
                params![id, c.entita, c.inizio as i64, c.fine as i64],
            )?;
        }
        for area in &aree {
            self.db.execute(
                "INSERT OR REPLACE INTO brainet_aree (nota, id, inizio, fine) VALUES (?, ?, ?, ?)",
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
                    "INSERT INTO brainet_aree_legami (nota, area, tipo, id) VALUES (?, ?, ?, ?)",
                    params![id, area.id, tipo, valore],
                )?;
            }
        }
        Ok(())
    }

    /// I giorni del mese «AAAA-MM» in cui è nata almeno una nota in Brainet, fuori dal Cestino:
    /// un pallino per giorno (RB-113, RB-127).
    pub fn calendario(&mut self, mese: &str) -> Esito<Vec<GiornoCalendario>> {
        let inizio = NaiveDate::parse_from_str(&format!("{mese}-01"), "%Y-%m-%d")
            .map_err(|_| Errore::NonValido(format!("Mese non valido: {mese}")))?;
        self.con_riconnessione(|a| {
            a.acceso()?;
            a.aggiorna_indice()?;
            let giorni: BTreeSet<NaiveDate> = a
                .date_note_con_brainet()?
                .into_values()
                .filter(|d| d.year() == inizio.year() && d.month() == inizio.month())
                .collect();
            Ok(giorni.into_iter().map(|g| GiornoCalendario { giorno: g.format("%Y-%m-%d").to_string() }).collect())
        })
    }

    /// Il giorno di ogni nota in Brainet, fuori dal Cestino (DEC-147).
    fn date_note_con_brainet(&self) -> Esito<HashMap<String, NaiveDate>> {
        let righe: Vec<(String, String, Option<String>)> = self
            .db
            .prepare(
                "SELECT id, creata, creata_scelta FROM note WHERE eliminata_il IS NULL AND brainet = 1",
            )?
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))?
            .collect::<Result<_, _>>()?;
        Ok(righe
            .into_iter()
            .filter_map(|(id, creata, scelta)| giorno_della_nota(&creata, scelta.as_deref()).map(|g| (id, g)))
            .collect())
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
            a.aggiorna_indice()?;
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
            a.aggiorna_indice()?;
            a.controlla_unione(da, verso)?;
            a.conta_riferimenti(da)
        })
    }

    /// Unisce `da` in `verso`: resta `verso` con il suo nome; i testi non si riscrivono,
    /// `da` diventa un rimando (RB-108, EN-13).
    pub fn unisci_entita(&mut self, da: &str, verso: &str) -> Esito<Unione> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            a.aggiorna_indice()?;
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

    /// Cambia il tipo dell'entità; None la lascia senza tipo (RB-122).
    pub fn imposta_tipo(&mut self, id: &str, tipo: Option<&str>) -> Esito<Entita> {
        if let Some(t) = tipo {
            if !TIPI.contains(&t) {
                return Err(Errore::NonValido(format!("Tipo sconosciuto: {t}")));
            }
        }
        self.con_riconnessione(|a| {
            a.acceso()?;
            a_vive(a, id)?;
            a.db.execute("UPDATE entita SET tipo = ? WHERE id = ?", params![tipo, id])?;
            a.entita(id)
        })
    }

    /// L'entità, anche unita: si segue il rimando fino a quella che resta. Anche con Brainet
    /// spento, per mostrare le pillole già scritte (RB-111).
    pub fn leggi_entita(&mut self, id: &str) -> Esito<Entita> {
        self.con_riconnessione(|a| {
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

    /// Le citazioni e le aree delle note in Brainet fuori dal Cestino (RB-127): (entità, nota).
    fn riferimenti(&self) -> Esito<Vec<(String, String)>> {
        Ok(self
            .db
            .prepare(
                "SELECT x.entita, x.nota FROM (
                   SELECT nota, entita FROM brainet_citazioni
                   UNION ALL SELECT nota, id FROM brainet_aree_legami WHERE tipo = 'entita'
                 ) x JOIN note n ON n.id = x.nota WHERE n.eliminata_il IS NULL AND n.brainet = 1",
            )?
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?)))?
            .collect::<Result<_, _>>()?)
    }

    /// Per ogni entità che resta: citazioni più aree, e il giorno dell'ultima nota che la nomina.
    fn conteggi(&self) -> Esito<HashMap<String, (usize, Option<String>)>> {
        let rimandi = self.rimandi()?;
        let date = self.date_note_con_brainet()?;
        let mut fuori: HashMap<String, (usize, Option<String>)> = HashMap::new();
        for (entita, nota) in self.riferimenti()? {
            let voce = fuori.entry(segui(&rimandi, &entita)).or_default();
            voce.0 += 1;
            if let Some(giorno) = date.get(&nota).map(|g| g.format("%Y-%m-%d").to_string()) {
                if voce.1.as_deref().is_none_or(|u| u < giorno.as_str()) {
                    voce.1 = Some(giorno);
                }
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
                "SELECT c.entita FROM brainet_citazioni c JOIN note n ON n.id = c.nota
                 WHERE n.eliminata_il IS NULL AND n.brainet = 1",
            )?,
            aree: conta(
                "SELECT l.id FROM brainet_aree_legami l JOIN note n ON n.id = l.nota
                 WHERE l.tipo = 'entita' AND n.eliminata_il IS NULL AND n.brainet = 1",
            )?,
        })
    }

    // ——— La pagina dell'entità (FL-26) ———

    /// I paragrafi delle note fuori dal Cestino che nominano l'entità (o una unita in lei), uno
    /// per paragrafo, per giorno di creazione della nota dal più recente (RB-124).
    pub fn passaggi_entita(&mut self, id: &str) -> Esito<PaginaEntita> {
        self.con_riconnessione(|a| {
            a.acceso()?;
            a.aggiorna_indice()?;
            let vera = a.risolvi_entita(id)?;
            let entita = a.entita(&vera)?;
            let rimandi = a.rimandi()?;
            let (nominata, ultima_volta) = a.conteggi()?.get(&vera).cloned().unwrap_or((0, None));
            // Per ogni nota, dove cominciano i suoi riferimenti all'entità.
            let mut punti: HashMap<String, Vec<usize>> = HashMap::new();
            let righe: Vec<(String, String, i64)> = a
                .db
                .prepare(
                    "SELECT nota, entita, inizio FROM brainet_citazioni
                     UNION ALL SELECT l.nota, l.id, r.inizio FROM brainet_aree_legami l
                       JOIN brainet_aree r ON r.nota = l.nota AND r.id = l.area WHERE l.tipo = 'entita'",
                )?
                .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))?
                .collect::<Result<_, _>>()?;
            for (nota, e, inizio) in righe {
                if segui(&rimandi, &e) == vera {
                    punti.entry(nota).or_default().push(inizio as usize);
                }
            }
            let mut per_giorno: BTreeMap<NaiveDate, Vec<(String, Passaggio)>> = BTreeMap::new();
            for (nota, mut inizi) in punti {
                let riga: Option<(String, String, String, Option<String>)> = a
                    .db
                    .query_row(
                        "SELECT titolo, contenuto, creata, creata_scelta FROM note
                         WHERE id = ? AND eliminata_il IS NULL AND brainet = 1",
                        [&nota],
                        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
                    )
                    .optional()?;
                let Some((titolo, contenuto, creata, scelta)) = riga else { continue };
                let Some(giorno) = giorno_della_nota(&creata, scelta.as_deref()) else { continue };
                let titolo =
                    if titolo.trim().is_empty() { super::anteprima(&testo_semplice(&contenuto)) } else { titolo };
                let ora = if scelta.is_some() { String::new() } else { ora_locale(&creata) };
                let mut visti = HashSet::new();
                inizi.sort_unstable();
                for inizio in inizi {
                    let (da, testo) = paragrafo(&contenuto, inizio);
                    if visti.insert(da) {
                        let inizio = utf16(&contenuto, da);
                        let p = Passaggio { nota: nota.clone(), titolo: titolo.clone(), ora: ora.clone(), testo, inizio };
                        per_giorno.entry(giorno).or_default().push((creata.clone(), p));
                    }
                }
            }
            let giorni = per_giorno
                .into_iter()
                .rev()
                .map(|(g, mut lista)| {
                    lista.sort_by(|x, y| y.0.cmp(&x.0).then_with(|| x.1.inizio.cmp(&y.1.inizio)));
                    GiornoPassaggi {
                        giorno: g.format("%Y-%m-%d").to_string(),
                        passaggi: lista.into_iter().map(|(_, p)| p).collect(),
                    }
                })
                .collect();
            Ok(PaginaEntita { entita, nominata, ultima_volta, giorni })
        })
    }

    // ——— Stati (FL-21) ———

    /// Anche con Brainet spento, per i colori delle aree già scritte (RB-111).
    pub fn elenca_stati(&mut self) -> Esito<Vec<Stato>> {
        self.con_riconnessione(|a| a.stati())
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
            a.aggiorna_indice()?;
            Ok(a.db.query_row(
                "SELECT count(*) FROM brainet_aree_legami l JOIN note n ON n.id = l.nota
                 WHERE l.tipo = 'stato' AND l.id = ? AND n.eliminata_il IS NULL AND n.brainet = 1",
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
            a.aggiorna_indice()?;
            let esiste = a.db.query_row("SELECT 1 FROM stati WHERE id = ?", [id], |_| Ok(())).optional()?;
            if esiste.is_none() {
                return Err(Errore::BrainetNonTrovato(id.to_string()));
            }
            if let Some(s) = sostituto {
                if s == id || a.db.query_row("SELECT 1 FROM stati WHERE id = ?", [s], |_| Ok(())).optional()?.is_none() {
                    return Err(Errore::NonValido("Stato sostituto non valido".into()));
                }
            }
            let note: Vec<(String, String)> = a
                .db
                .prepare(
                    "SELECT DISTINCT n.id, n.contenuto FROM note n JOIN brainet_aree_legami l ON l.nota = n.id
                     WHERE l.tipo = 'stato' AND l.id = ?",
                )?
                .query_map([id], |r| Ok((r.get(0)?, r.get(1)?)))?
                .collect::<Result<_, _>>()?;
            let mut esito = StatoTolto { aree_cambiate: 0, aree_sparite: 0 };
            for (nota, mut testo) in note {
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
                    "UPDATE note SET contenuto = ?, modificata = ? WHERE id = ?",
                    params![testo, a.ora(), nota],
                )?;
                a.indicizza(&nota, &testo)?;
            }
            a.db.execute("DELETE FROM stati WHERE id = ?", [id])?;
            Ok(esito)
        })
    }
}

// ——— Sincronizzazione (DEC-75, DEC-76) ———

/// Tipi dei blocchi di Brainet; le app che non li conoscono li saltano.
/// Il blocco `frammento` della 1.0.0 non è qui: ricevuto, diventa una nota (RB-125).
pub const TIPI_BLOCCHI: [&str; 3] = ["entita", "stato", super::allegati::TIPO_BLOCCO];

impl Archivio {
    /// I campi del blocco di un elemento di Brainet; None se non c'è più.
    pub(super) fn campi_brainet(&self, id: &str, tipo: &str) -> Esito<Option<Value>> {
        use base64::Engine;
        let campi = match tipo {
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
            super::allegati::TIPO_BLOCCO => self.campi_allegato(id)?,
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
            super::allegati::TIPO_BLOCCO => self.applica_allegato(id, c)?,
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

/// Il giorno di una nota nel fuso del computer: quello scelto in Info, se c'è, altrimenti quello
/// della creazione (RB-113, RB-124).
fn giorno_della_nota(creata: &str, scelta: Option<&str>) -> Option<NaiveDate> {
    match scelta {
        Some(g) => NaiveDate::parse_from_str(g, "%Y-%m-%d")
            .ok()
            .or_else(|| data_locale(g)),
        None => data_locale(creata),
    }
}

/// HH:MM di un istante nel fuso del computer.
fn ora_locale(istante: &str) -> String {
    istante
        .parse::<DateTime<Utc>>()
        .map(|i| i.with_timezone(&Local).format("%H:%M").to_string())
        .unwrap_or_default()
}

/// Il paragrafo che contiene il carattere `inizio`, con la sua posizione in caratteri (RB-124,
/// DEC-146): il testo tra due righe vuote; un titolo o una voce di elenco è una riga sola.
fn paragrafo(testo: &str, inizio: usize) -> (usize, String) {
    let righe: Vec<&str> = testo.split('\n').collect();
    let mut inizi = Vec::with_capacity(righe.len());
    let mut da = 0;
    for riga in &righe {
        inizi.push(da);
        da += riga.chars().count() + 1;
    }
    let i = inizi.iter().rposition(|&d| d <= inizio).unwrap_or(0);
    let da_sola = |r: &str| r.trim().is_empty() || riga_a_se(r);
    if da_sola(righe[i]) {
        return (inizi[i], righe[i].to_string());
    }
    let mut su = i;
    while su > 0 && !da_sola(righe[su - 1]) {
        su -= 1;
    }
    let mut giu = i;
    while giu + 1 < righe.len() && !da_sola(righe[giu + 1]) {
        giu += 1;
    }
    (inizi[su], righe[su..=giu].join("\n"))
}

/// Un titolo, una voce di elenco (anche numerata o da spuntare) o una citazione: una riga a sé.
fn riga_a_se(riga: &str) -> bool {
    let t = riga.trim_start();
    let numerata = t.find(['.', ')']).is_some_and(|n| {
        n > 0 && t[..n].chars().all(|c| c.is_ascii_digit()) && t[n + 1..].starts_with(' ')
    });
    t.starts_with('#') || t.starts_with("- ") || t.starts_with("* ") || t.starts_with("+ ") || t.starts_with('>') || numerata
}

/// Quante unità UTF-16 occupano i primi `caratteri` caratteri: le posizioni dell'editor.
fn utf16(testo: &str, caratteri: usize) -> usize {
    testo.chars().take(caratteri).map(char::len_utf16).sum()
}

/// Il messaggio quando come foto di un'entità si sceglie un file che non è un'immagine (CA-18.13,
/// DEC-141).
pub(crate) const FOTO_NON_IMMAGINE: &str = "Il file scelto non è un'immagine: la foto non cambia.";

/// Riduce un'immagine al lato lungo di 256 px e la salva in JPEG.
fn riduci_foto(byte: &[u8]) -> Esito<Vec<u8>> {
    let immagine = image::load_from_memory(byte)
        .map_err(|_| Errore::NonValido(FOTO_NON_IMMAGINE.into()))?;
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
