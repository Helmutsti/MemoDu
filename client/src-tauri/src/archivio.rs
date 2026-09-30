// Copia di lavoro di note, cartelle e cestino sul dispositivo, in SQLite (DEC-67), con lo
// schema di DEC-48 e le stesse regole che l'API applicava in `api/src/archivio.ts`.
// L'interfaccia vede le cartelle come percorsi di nomi ("Lavoro/Clienti", DEC-37); nel
// database hanno un id e una cartella madre. Un elemento è nel cestino se ha «eliminata il»:
// una cartella nel cestino porta con sé tutto ciò che contiene (RB-25).

use std::cell::RefCell;
use std::cmp::Ordering;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::{Arc, LazyLock};

use chrono::{DateTime, NaiveDate, SecondsFormat, Utc};
use regex::Regex;
use rusqlite::functions::FunctionFlags;
use rusqlite::{params, params_from_iter, Connection, ErrorCode, OptionalExtension, Row};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use unicode_normalization::UnicodeNormalization;

/// File della copia di lavoro nella cartella dei dati.
pub const FILE_DATABASE: &str = "copia-di-lavoro.db";
/// File dell'API quando girava sulla stessa macchina (DEC-46): da lì si copiano le note alla
/// prima apertura, così non si perde niente.
pub const FILE_API: &str = "memodu.db";
const VERSIONE_SCHEMA: i64 = 4;
const SENZA_TITOLO: &str = "Senza titolo";
const NUOVA_CARTELLA: &str = "Nuova cartella";
const LUNGHEZZA_MASSIMA_NOME: usize = 100;
const LUNGHEZZA_ANTEPRIMA: usize = 80;

const SCHEMA: &str = "
  CREATE TABLE cartelle (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    chiave TEXT NOT NULL,
    madre TEXT REFERENCES cartelle(id) ON DELETE CASCADE,
    eliminata_il TEXT,
    provenienza TEXT
  );
  CREATE UNIQUE INDEX cartelle_nome_unico
    ON cartelle (ifnull(madre, ''), chiave) WHERE eliminata_il IS NULL;
  CREATE TABLE note (
    id TEXT PRIMARY KEY,
    titolo TEXT NOT NULL,
    contenuto TEXT NOT NULL,
    cartella TEXT REFERENCES cartelle(id) ON DELETE SET NULL,
    creata TEXT NOT NULL,
    creata_scelta TEXT,
    modificata TEXT NOT NULL,
    fine_validita TEXT,
    eliminata_il TEXT,
    provenienza TEXT
  );
  CREATE INDEX note_cartella ON note (cartella);
  CREATE TABLE tag (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    chiave TEXT NOT NULL,
    padre TEXT REFERENCES tag(id) ON DELETE CASCADE
  );
  CREATE UNIQUE INDEX tag_nome_unico ON tag (ifnull(padre, ''), chiave);
  CREATE TABLE note_tag (
    nota TEXT NOT NULL REFERENCES note(id) ON DELETE CASCADE,
    tag TEXT NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
    PRIMARY KEY (nota, tag)
  );
";

/// Schema 2 (DEC-75, DEC-76): per ogni elemento la versione ricevuta dal server, il suo
/// contenuto (la base) e il segno «modificato qui» con l'istante della modifica. I trigger lo
/// segnano da soli a ogni scrittura, tranne mentre si applicano le modifiche ricevute
/// (riga «applicando» in sinc_stato). Gli elementi già presenti partono tutti da inviare.
const SCHEMA_SINCRONIZZAZIONE: &str = "
  CREATE TABLE sinc_elementi (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    versione INTEGER NOT NULL DEFAULT 0,
    base TEXT,
    modificato INTEGER NOT NULL DEFAULT 0,
    modificato_il TEXT
  );
  CREATE TABLE sinc_stato (chiave TEXT PRIMARY KEY, valore TEXT NOT NULL);
  INSERT INTO sinc_elementi (id, tipo, modificato, modificato_il)
    SELECT id, 'nota', 1, adesso_utc() FROM note;
  INSERT INTO sinc_elementi (id, tipo, modificato, modificato_il)
    SELECT id, 'cartella', 1, adesso_utc() FROM cartelle;
  INSERT INTO sinc_elementi (id, tipo, modificato, modificato_il)
    SELECT id, 'tag', 1, adesso_utc() FROM tag;
";

/// Schema 3 (DEC-91): le impostazioni che si sincronizzano, in un solo elemento
/// «impostazioni» (RB-52), e quelle che restano sul dispositivo, senza trigger.
const SCHEMA_IMPOSTAZIONI: &str = "
  CREATE TABLE impostazioni (
    id TEXT PRIMARY KEY,
    scorciatoia_windows TEXT,
    scorciatoia_macos TEXT
  );
  CREATE TABLE dispositivo (chiave TEXT PRIMARY KEY, valore TEXT NOT NULL);
";

/// Schema 4 (DEC-95): l'indice di ricerca a trigrammi, senza maiuscole e accenti, tenuto
/// aggiornato dai trigger anche per le modifiche ricevute; in `tag` i percorsi completi dei tag
/// della nota, uno per riga (`tag_della_nota`). E l'impostazione delle note del cestino nei
/// risultati, che si sincronizza con le altre (RB-29, RB-52); vuota vale accesa.
const SCHEMA_RICERCA: &str = "
  CREATE VIRTUAL TABLE ricerca USING fts5(
    id UNINDEXED, titolo, contenuto, tag,
    tokenize = 'trigram remove_diacritics 1'
  );
  INSERT INTO ricerca (id, titolo, contenuto, tag)
    SELECT id, titolo, contenuto, tag_della_nota(id) FROM note;
  CREATE TRIGGER ricerca_note_INSERT AFTER INSERT ON note BEGIN
    INSERT INTO ricerca (id, titolo, contenuto, tag)
    VALUES (NEW.id, NEW.titolo, NEW.contenuto, tag_della_nota(NEW.id));
  END;
  CREATE TRIGGER ricerca_note_UPDATE AFTER UPDATE OF titolo, contenuto ON note BEGIN
    UPDATE ricerca SET titolo = NEW.titolo, contenuto = NEW.contenuto WHERE id = NEW.id;
  END;
  CREATE TRIGGER ricerca_note_DELETE AFTER DELETE ON note BEGIN
    DELETE FROM ricerca WHERE id = OLD.id;
  END;
  CREATE TRIGGER ricerca_note_tag_INSERT AFTER INSERT ON note_tag BEGIN
    UPDATE ricerca SET tag = tag_della_nota(NEW.nota) WHERE id = NEW.nota;
  END;
  CREATE TRIGGER ricerca_note_tag_DELETE AFTER DELETE ON note_tag BEGIN
    UPDATE ricerca SET tag = tag_della_nota(OLD.nota) WHERE id = OLD.nota;
  END;
  CREATE TRIGGER ricerca_tag_UPDATE AFTER UPDATE OF nome, padre ON tag BEGIN
    UPDATE ricerca SET tag = tag_della_nota(id) WHERE id IN (SELECT nota FROM note_tag);
  END;
  ALTER TABLE impostazioni ADD COLUMN cestino_in_ricerca INTEGER;
";

/// Trigger che segnano un elemento come modificato qui: (tabella, tipo, id nel caso di
/// inserimento o modifica, id nel caso di eliminazione, eventi).
type Trigger = (&'static str, &'static str, &'static str, &'static str);
const TRIGGER: [Trigger; 4] = [
    ("note", "nota", "NEW.id", "OLD.id"),
    ("cartelle", "cartella", "NEW.id", "OLD.id"),
    ("tag", "tag", "NEW.id", "OLD.id"),
    // Aggiungere o togliere un tag modifica la nota.
    ("note_tag", "nota", "NEW.nota", "OLD.nota"),
];

const TRIGGER_IMPOSTAZIONI: [Trigger; 1] = [("impostazioni", "impostazioni", "NEW.id", "OLD.id")];

fn schema_trigger(trigger: &[Trigger]) -> String {
    let mut sql = String::new();
    for &(tabella, tipo, nuovo, vecchio) in trigger {
        for (evento, id) in [("INSERT", nuovo), ("UPDATE", nuovo), ("DELETE", vecchio)] {
            if tabella == "note_tag" && evento == "UPDATE" {
                continue;
            }
            sql.push_str(&format!(
                "CREATE TRIGGER sinc_{tabella}_{evento} AFTER {evento} ON {tabella}
                 WHEN NOT EXISTS (SELECT 1 FROM sinc_stato WHERE chiave = 'applicando')
                 BEGIN
                   INSERT INTO sinc_elementi (id, tipo, modificato, modificato_il)
                   VALUES ({id}, '{tipo}', 1, adesso_utc())
                   ON CONFLICT(id) DO UPDATE SET modificato = 1, modificato_il = excluded.modificato_il;
                 END;\n"
            ));
        }
    }
    sql
}

/// Orologio dell'archivio: lo stesso per le date delle note e per i trigger.
type Orologio = Arc<dyn Fn() -> DateTime<Utc> + Send + Sync>;

/// Un conflitto nato mentre si scriveva o sincronizzando (DEC-06, RB-39).
#[derive(Debug, Clone, PartialEq)]
pub struct ConflittoNato {
    pub originale: String,
    pub copia: String,
    /// Nato dal testo della nota aperta, che d'ora in poi si salva nella copia.
    pub scrivendo: bool,
}

// ——— Errori ———

/// Errori dell'archivio. Arrivano all'interfaccia con lo stesso codice che dava l'API
/// (architettura/api.md), così le schermate non cambiano.
#[derive(Debug)]
pub enum Errore {
    /// Con `cestino`: la nota è nel cestino, e quello è l'elemento da ripristinare.
    NotaNonTrovata { id: String, cestino: Option<String> },
    /// Per esempio eliminata da un'altra finestra (SF-32).
    CartellaNonTrovata(String),
    ElementoNonTrovato(String),
    /// Percorso con parti vuote o «..», o nome vuoto.
    PercorsoNonValido(String),
    /// Nome già usato nella destinazione, con seEsiste = "chiedi" (RB-31, SF-19).
    NomeEsistente(String),
    /// Cartella spostata dentro sé stessa o una sua sottocartella (RB-24, SF-18).
    SpostamentoImpossibile,
    TagNonTrovato(String),
    DataNonValida(String),
    /// La nota non è vuota e non si cancella da sola (DEC-39).
    NotaNonVuota,
    /// La copia di lavoro non si apre: l'interfaccia mostra SC-07 come quando l'API non
    /// rispondeva (RB-61).
    NonDisponibile(String),
    /// Combinazione che non si può usare per la nota rapida (DEC-91).
    ScorciatoiaNonValida(String),
    /// Combinazione già usata da un altro programma: resta quella di prima (DEC-91).
    ScorciatoiaOccupata,
    Database(rusqlite::Error),
}

impl From<rusqlite::Error> for Errore {
    fn from(errore: rusqlite::Error) -> Self {
        Errore::Database(errore)
    }
}

impl Errore {
    /// Codice come quello HTTP dell'API; None vuol dire «non risponde».
    pub fn stato(&self) -> Option<u16> {
        match self {
            Errore::NotaNonTrovata { .. }
            | Errore::CartellaNonTrovata(_)
            | Errore::ElementoNonTrovato(_)
            | Errore::TagNonTrovato(_) => Some(404),
            Errore::PercorsoNonValido(_)
            | Errore::DataNonValida(_)
            | Errore::ScorciatoiaNonValida(_) => Some(400),
            Errore::NomeEsistente(_) | Errore::NotaNonVuota | Errore::ScorciatoiaOccupata => Some(409),
            Errore::SpostamentoImpossibile => Some(422),
            Errore::NonDisponibile(_) => None,
            Errore::Database(_) => Some(500),
        }
    }

    fn messaggio(&self) -> String {
        match self {
            Errore::NotaNonTrovata { id, .. } => format!("Nessuna nota con id {id}"),
            Errore::CartellaNonTrovata(percorso) => format!("Nessuna cartella «{percorso}»"),
            Errore::ElementoNonTrovato(id) => format!("Nessun elemento {id} nel cestino"),
            Errore::PercorsoNonValido(testo) | Errore::DataNonValida(testo) => testo.clone(),
            Errore::NomeEsistente(nome) => format!("Esiste già «{nome}»"),
            Errore::SpostamentoImpossibile => "Una cartella non si sposta dentro sé stessa".into(),
            Errore::TagNonTrovato(nome) => format!("Nessun tag «{nome}»"),
            Errore::NotaNonVuota => "La nota non è vuota".into(),
            Errore::NonDisponibile(testo) | Errore::ScorciatoiaNonValida(testo) => testo.clone(),
            Errore::ScorciatoiaOccupata => "Combinazione già usata da un altro programma".into(),
            Errore::Database(errore) => errore.to_string(),
        }
    }
}

impl Serialize for Errore {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        #[derive(Serialize)]
        struct Forma<'a> {
            stato: Option<u16>,
            messaggio: String,
            #[serde(skip_serializing_if = "Option::is_none")]
            conflitto: Option<&'a str>,
            #[serde(skip_serializing_if = "Option::is_none")]
            cestino: Option<&'a str>,
        }
        let conflitto = match self {
            Errore::NomeEsistente(nome) => Some(nome.as_str()),
            _ => None,
        };
        let cestino = match self {
            Errore::NotaNonTrovata { cestino, .. } => cestino.as_deref(),
            _ => None,
        };
        Forma { stato: self.stato(), messaggio: self.messaggio(), conflitto, cestino }
            .serialize(serializer)
    }
}

pub type Esito<T> = Result<T, Errore>;

// ——— Forme scambiate con l'interfaccia (condiviso/src) ———

/// Una nota completa (EN-01).
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Nota {
    pub id: String,
    pub titolo: String,
    pub contenuto: String,
    pub creata: String,
    pub modificata: String,
    /// Percorso della cartella; "" per le non organizzate (DEC-37).
    pub cartella: String,
    pub creata_scelta: Option<String>,
    pub fine_validita: Option<String>,
    pub tag: Vec<String>,
}

/// Una riga dell'elenco, ordinato per ultima modifica (RB-60).
#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct VoceElenco {
    pub id: String,
    pub titolo: String,
    pub anteprima: String,
    pub modificata: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct Cartella {
    pub nome: String,
    pub percorso: String,
    /// Note della cartella e delle sottocartelle, senza quelle nel cestino (RB-56).
    pub conteggio: usize,
    pub cartelle: Vec<Cartella>,
    pub note: Vec<VoceElenco>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct NonOrganizzate {
    pub conteggio: usize,
    pub note: Vec<VoceElenco>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Albero {
    pub non_organizzate: NonOrganizzate,
    pub cartelle: Vec<Cartella>,
    /// Quanti elementi ci sono nel cestino (DEC-40).
    pub cestino: usize,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EsitoCartella {
    pub cartella: Cartella,
    pub da_risolvere: Vec<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct ElementoCestino {
    pub id: String,
    /// "nota" o "cartella".
    pub tipo: &'static str,
    pub nome: String,
    pub provenienza: String,
    pub eliminato: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conteggio: Option<usize>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct VoceTag {
    pub nome: String,
    pub note: usize,
}

/// Ripristinare dà una nota o, per una cartella, l'esito dello spostamento.
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(untagged)]
pub enum Ripristinato {
    Nota(Nota),
    Cartella(EsitoCartella),
}

#[derive(Debug, Default, Deserialize)]
pub struct DatiNota {
    pub titolo: Option<String>,
    pub contenuto: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct DatiNuovaNota {
    pub titolo: Option<String>,
    pub contenuto: Option<String>,
    pub cartella: Option<String>,
}

/// Un campo assente resta com'è, null lo svuota (DEC-51).
#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DatiDettagli {
    #[serde(default, deserialize_with = "presente")]
    pub creata_scelta: Option<Option<String>>,
    #[serde(default, deserialize_with = "presente")]
    pub fine_validita: Option<Option<String>>,
}

/// Distingue un campo assente (None) da un campo null (Some(None)).
fn presente<'de, D: Deserializer<'de>>(d: D) -> Result<Option<Option<String>>, D::Error> {
    Ok(Some(Option::deserialize(d)?))
}

/// Cosa fare se il nome esiste già nella destinazione (RB-31).
#[derive(Debug, Clone, Copy, Default, PartialEq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SeEsiste {
    #[default]
    Chiedi,
    Numero,
    Unisci,
}

// ——— Righe del database ———

struct RigaNota {
    id: String,
    titolo: String,
    contenuto: String,
    cartella: Option<String>,
    creata: String,
    creata_scelta: Option<String>,
    modificata: String,
    fine_validita: Option<String>,
    eliminata_il: Option<String>,
    provenienza: Option<String>,
}

impl RigaNota {
    fn da(riga: &Row) -> rusqlite::Result<Self> {
        Ok(RigaNota {
            id: riga.get("id")?,
            titolo: riga.get("titolo")?,
            contenuto: riga.get("contenuto")?,
            cartella: riga.get("cartella")?,
            creata: riga.get("creata")?,
            creata_scelta: riga.get("creata_scelta")?,
            modificata: riga.get("modificata")?,
            fine_validita: riga.get("fine_validita")?,
            eliminata_il: riga.get("eliminata_il")?,
            provenienza: riga.get("provenienza")?,
        })
    }
}

#[derive(Clone)]
struct RigaCartella {
    id: String,
    nome: String,
    madre: Option<String>,
    eliminata_il: Option<String>,
    provenienza: Option<String>,
}

impl RigaCartella {
    fn da(riga: &Row) -> rusqlite::Result<Self> {
        Ok(RigaCartella {
            id: riga.get("id")?,
            nome: riga.get("nome")?,
            madre: riga.get("madre")?,
            eliminata_il: riga.get("eliminata_il")?,
            provenienza: riga.get("provenienza")?,
        })
    }
}

struct Scelta {
    nome: String,
    unisci: bool,
    id: Option<String>,
}

fn chiave(nome: &str) -> String {
    nome.to_lowercase()
}

fn stesso(a: &str, b: &str) -> bool {
    chiave(a) == chiave(b)
}

fn padre(percorso: &str) -> String {
    match percorso.rfind('/') {
        Some(posizione) => percorso[..posizione].to_string(),
        None => String::new(),
    }
}

fn unisci_percorso(a: &str, b: &str) -> String {
    if a.is_empty() {
        b.to_string()
    } else {
        format!("{a}/{b}")
    }
}

/// Ordine alfabetico senza distinguere maiuscole e accenti, come il confronto italiano
/// «base» dell'API.
fn ordine(a: &str, b: &str) -> Ordering {
    let base = |testo: &str| -> String {
        testo
            .nfd()
            .filter(|c| !unicode_normalization::char::is_combining_mark(*c))
            .collect::<String>()
            .to_lowercase()
    };
    base(a).cmp(&base(b))
}

fn istante(momento: DateTime<Utc>) -> String {
    momento.to_rfc3339_opts(SecondsFormat::Millis, true)
}

/// Segnaposto "?,?,?" per una lista di valori.
fn segnaposto(quanti: usize) -> String {
    vec!["?"; quanti].join(",")
}

// ——— Archivio ———

pub struct Archivio {
    db: Connection,
    file: PathBuf,
    adesso: Orologio,
    /// Cartelle di partenza di un'unione con sottocartelle ancora da risolvere (RB-31): quando
    /// l'ultima esce, spariscono anche loro, un livello alla volta.
    origini_unione: RefCell<HashSet<String>>,
    /// Note il cui testo è cambiato per una modifica ricevuta e che l'interfaccia non ha ancora
    /// riletto: salvarci sopra il testo vecchio della finestra lo perderebbe (DEC-06).
    cambiate_da_sinc: RefCell<HashSet<String>>,
    /// Note aperte il cui testo, dopo un conflitto, si salva nella copia.
    reindirizzi: RefCell<HashMap<String, String>>,
    /// Conflitti da far sapere all'interfaccia.
    conflitti: RefCell<Vec<ConflittoNato>>,
}

impl Archivio {
    /// Apre (o crea) la copia di lavoro in `cartella`. Alla prima apertura, se nella stessa
    /// cartella c'è il database dell'API (DEC-46), le note si copiano da lì.
    pub fn apri(cartella: &Path) -> Esito<Self> {
        Self::con_orologio(cartella, Box::new(Utc::now))
    }

    pub fn con_orologio(
        cartella: &Path,
        adesso: Box<dyn Fn() -> DateTime<Utc> + Send + Sync>,
    ) -> Esito<Self> {
        let adesso: Orologio = Arc::from(adesso);
        std::fs::create_dir_all(cartella)
            .map_err(|e| Errore::NonDisponibile(format!("Cartella dei dati non disponibile: {e}")))?;
        let file = cartella.join(FILE_DATABASE);
        let dell_api = cartella.join(FILE_API);
        if !file.exists() && dell_api.exists() {
            copia_dall_api(&dell_api, &file)?;
        }
        let db = connetti(&file, &adesso)?;
        let versione: i64 = db.pragma_query_value(None, "user_version", |r| r.get(0))?;
        if versione < VERSIONE_SCHEMA {
            let tx = db.unchecked_transaction()?;
            if versione < 1 {
                tx.execute_batch(SCHEMA)?;
            }
            if versione < 2 {
                tx.execute_batch(SCHEMA_SINCRONIZZAZIONE)?;
                tx.execute_batch(&schema_trigger(&TRIGGER))?;
            }
            if versione < 3 {
                tx.execute_batch(SCHEMA_IMPOSTAZIONI)?;
                tx.execute_batch(&schema_trigger(&TRIGGER_IMPOSTAZIONI))?;
            }
            if versione < 4 {
                tx.execute_batch(SCHEMA_RICERCA)?;
            }
            tx.pragma_update(None, "user_version", VERSIONE_SCHEMA)?;
            tx.commit()?;
        }
        Ok(Archivio {
            db,
            file,
            adesso,
            origini_unione: RefCell::new(HashSet::new()),
            cambiate_da_sinc: RefCell::new(HashSet::new()),
            reindirizzi: RefCell::new(HashMap::new()),
            conflitti: RefCell::new(Vec::new()),
        })
    }

    fn ora(&self) -> String {
        istante((self.adesso)())
    }

    /// Unico punto di passaggio di ogni operazione, sempre in una transazione. SQLite decide
    /// all'apertura se il file si può scrivere: se era in sola lettura, la connessione resta
    /// tale anche quando il permesso torna. Con un errore di sola lettura si riapre la
    /// connessione e si riprova una volta; riprovare è sicuro, perché la transazione fallita
    /// non ha scritto niente.
    fn con_riconnessione<T>(&mut self, operazione: impl Fn(&Self) -> Esito<T>) -> Esito<T> {
        match self.in_transazione(&operazione) {
            Err(Errore::Database(errore)) if sola_lettura(&errore) => {
                self.db = connetti(&self.file, &self.adesso)?;
                self.in_transazione(&operazione)
            }
            esito => esito,
        }
    }

    fn in_transazione<T>(&self, operazione: &impl Fn(&Self) -> Esito<T>) -> Esito<T> {
        let tx = self.db.unchecked_transaction()?;
        let esito = operazione(self)?;
        tx.commit()?;
        Ok(esito)
    }

    // ——— Note ———

    /// Le non organizzate, la modificata più di recente in cima (RB-60).
    pub fn elenca(&mut self) -> Esito<Vec<VoceElenco>> {
        self.con_riconnessione(|a| a.elenco_non_organizzate())
    }

    /// Cancella per sempre la nota, solo se titolo e testo sono vuoti (RB-10, DEC-39).
    pub fn elimina_se_vuota(&mut self, id: &str) -> Esito<()> {
        self.con_riconnessione(|a| {
            let riga = a.trova(id)?;
            if !riga.titolo.trim().is_empty() || !riga.contenuto.trim().is_empty() {
                return Err(Errore::NotaNonVuota);
            }
            a.db.execute("DELETE FROM note WHERE id = ?", [id])?;
            Ok(())
        })
    }

    /// Legge la nota. L'interfaccia che la rilegge vede le modifiche ricevute: da qui in poi può
    /// salvarci sopra (DEC-06).
    pub fn leggi(&mut self, id: &str) -> Esito<Nota> {
        self.cambiate_da_sinc.borrow_mut().remove(id);
        self.reindirizzi.borrow_mut().remove(id);
        self.con_riconnessione(|a| a.nota_da_id(id))
    }

    /// Crea una nota nella radice (RB-01) o nella cartella indicata (RB-09), anche vuota (RB-10).
    pub fn crea(&mut self, dati: &DatiNuovaNota) -> Esito<Nota> {
        self.con_riconnessione(|a| {
            let cartella = dati.cartella.as_deref().unwrap_or("");
            valida(cartella, true)?;
            let id_cartella = a.id_cartella(cartella)?;
            let adesso = a.ora();
            let id = uuid::Uuid::new_v4().to_string();
            a.db.execute(
                "INSERT INTO note (id, titolo, contenuto, cartella, creata, modificata) VALUES (?, ?, ?, ?, ?, ?)",
                params![
                    id,
                    dati.titolo.as_deref().unwrap_or(""),
                    dati.contenuto.as_deref().unwrap_or(""),
                    id_cartella,
                    adesso,
                    adesso
                ],
            )?;
            a.nota_da_id(&id)
        })
    }

    /// Salva titolo e contenuto e aggiorna la data di modifica (RB-06). Se nel frattempo la nota
    /// è cambiata per una modifica ricevuta, il testo della finestra non la sovrascrive: va in
    /// una copia in conflitto, dove finiscono anche i salvataggi successivi (DEC-06, RB-39).
    pub fn salva(&mut self, id: &str, dati: &DatiNota) -> Esito<Nota> {
        let copia = self.reindirizzi.borrow().get(id).cloned();
        if let Some(copia) = copia {
            self.salva(&copia, dati)?;
            return self.con_riconnessione(|a| a.nota_da_id(id));
        }
        if self.cambiate_da_sinc.borrow().contains(id) {
            let attuale = self.con_riconnessione(|a| a.nota_da_id(id))?;
            let diverso = dati.titolo.as_ref().is_some_and(|t| *t != attuale.titolo)
                || dati.contenuto.as_ref().is_some_and(|c| *c != attuale.contenuto);
            if diverso {
                let titolo = dati.titolo.clone().unwrap_or_else(|| attuale.titolo.clone());
                let contenuto = dati.contenuto.clone().unwrap_or_else(|| attuale.contenuto.clone());
                let copia = self.con_riconnessione(|a| a.crea_copia_in_conflitto(id, &titolo, &contenuto))?;
                self.cambiate_da_sinc.borrow_mut().remove(id);
                self.reindirizzi.borrow_mut().insert(id.to_string(), copia.clone());
                self.conflitti.borrow_mut().push(ConflittoNato {
                    originale: id.to_string(),
                    copia,
                    scrivendo: true,
                });
                return Ok(attuale);
            }
        }
        self.con_riconnessione(|a| {
            let attuale = a.trova(id)?;
            a.db.execute(
                "UPDATE note SET titolo = ?, contenuto = ?, modificata = ? WHERE id = ?",
                params![
                    dati.titolo.as_deref().unwrap_or(&attuale.titolo),
                    dati.contenuto.as_deref().unwrap_or(&attuale.contenuto),
                    a.ora(),
                    id
                ],
            )?;
            a.nota_da_id(id)
        })
    }

    /// Sposta la nota in un'altra cartella; la data di modifica non cambia (FL-05).
    pub fn sposta_nota(&mut self, id: &str, cartella: &str) -> Esito<Nota> {
        self.con_riconnessione(|a| {
            valida(cartella, true)?;
            a.trova(id)?;
            let id_cartella = a.id_cartella(cartella)?;
            a.db.execute("UPDATE note SET cartella = ? WHERE id = ?", params![id_cartella, id])?;
            a.nota_da_id(id)
        })
    }

    // ——— Albero e cartelle ———

    /// Tutta la colonna: non organizzate (RB-60) e cartelle in ordine alfabetico (RB-64, RB-65).
    pub fn albero(&mut self) -> Esito<Albero> {
        self.con_riconnessione(|a| {
            let note = a.elenco_non_organizzate()?;
            let mut cartelle = Vec::new();
            for c in a.figlie(None)? {
                cartelle.push(a.descrivi(&c.id, &c.nome, None)?);
            }
            Ok(Albero {
                non_organizzate: NonOrganizzate { conteggio: note.len(), note },
                cartelle,
                cestino: a.elementi_cestino()?.len(),
            })
        })
    }

    /// Crea una cartella dentro `genitore`. Senza nome: «Nuova cartella», con un numero se c'è
    /// già (RB-48); con un nome già usato segue RB-31.
    pub fn crea_cartella(
        &mut self,
        genitore: &str,
        nome: Option<&str>,
        se_esiste: SeEsiste,
    ) -> Esito<EsitoCartella> {
        self.con_riconnessione(|a| {
            valida(genitore, true)?;
            let id_genitore = a.id_cartella(genitore)?;
            let voluto = match nome {
                None => NUOVA_CARTELLA.to_string(),
                Some(n) => nome_cartella(n)?,
            };
            // Il nome proposto (senza `nome`) prende da solo un numero (RB-48); un nome scritto,
            // anche «Nuova cartella», segue RB-31.
            let regola = if nome.is_none() { SeEsiste::Numero } else { se_esiste };
            let scelta = a.risolvi(id_genitore.as_deref(), &voluto, regola, None)?;
            // Unendo una cartella nuova, e quindi vuota, a una esistente non c'è niente da spostare.
            let id = match (scelta.unisci, scelta.id.clone()) {
                (true, Some(id)) => id,
                _ => a.inserisci_cartella(&scelta.nome, id_genitore.as_deref())?,
            };
            Ok(EsitoCartella {
                cartella: a.descrivi(&id, &scelta.nome, Some(genitore))?,
                da_risolvere: vec![],
            })
        })
    }

    /// Rinomina una cartella (RB-63); un nome già usato segue RB-31 (RB-23).
    pub fn rinomina_cartella(
        &mut self,
        percorso: &str,
        nome: &str,
        se_esiste: SeEsiste,
    ) -> Esito<EsitoCartella> {
        self.con_riconnessione(|a| {
            valida(percorso, false)?;
            let riga = a.cartella_visibile(percorso)?;
            let nuovo = nome_cartella(nome)?;
            let genitore = padre(percorso);
            if nuovo == riga.nome || stesso(&nuovo, &riga.nome) {
                // Stesso nome, o solo maiuscole e minuscole diverse: nessun conflitto possibile.
                a.db.execute(
                    "UPDATE cartelle SET nome = ?, chiave = ? WHERE id = ?",
                    params![nuovo, chiave(&nuovo), riga.id],
                )?;
                return Ok(EsitoCartella {
                    cartella: a.descrivi(&riga.id, &nuovo, Some(&genitore))?,
                    da_risolvere: vec![],
                });
            }
            a.metti(&riga.id, riga.madre.as_deref(), &genitore, &nuovo, se_esiste)
        })
    }

    /// Sposta una cartella con tutto il contenuto dentro `destinazione` (RB-24). Con
    /// `da_unione` la cartella di partenza, origine di un'unione, si toglie se resta vuota.
    pub fn sposta_cartella(
        &mut self,
        percorso: &str,
        destinazione: &str,
        se_esiste: SeEsiste,
        da_unione: bool,
    ) -> Esito<EsitoCartella> {
        self.con_riconnessione(|a| {
            valida(percorso, false)?;
            valida(destinazione, true)?;
            let riga = a.cartella_visibile(percorso)?;
            let id_destinazione = a.id_cartella(destinazione)?;
            let dentro = stesso(destinazione, percorso)
                || chiave(destinazione).starts_with(&format!("{}/", chiave(percorso)));
            if dentro {
                return Err(Errore::SpostamentoImpossibile);
            }
            if stesso(&padre(percorso), destinazione) {
                return Ok(EsitoCartella {
                    cartella: a.descrivi(&riga.id, &riga.nome, Some(destinazione))?,
                    da_risolvere: vec![],
                });
            }
            let esito =
                a.metti(&riga.id, id_destinazione.as_deref(), destinazione, &riga.nome, se_esiste)?;
            if da_unione {
                if let Some(madre) = &riga.madre {
                    a.togli_se_vuota(madre)?;
                }
            }
            Ok(esito)
        })
    }

    // ——— Cestino ———

    /// Manda una nota nel cestino (RB-26).
    pub fn cestina_nota(&mut self, id: &str) -> Esito<ElementoCestino> {
        self.con_riconnessione(|a| {
            let riga = a.trova(id)?;
            let provenienza = a.percorso(riga.cartella.as_deref())?.unwrap_or_default();
            let eliminato = a.ora();
            a.db.execute(
                "UPDATE note SET eliminata_il = ?, provenienza = ? WHERE id = ?",
                params![eliminato, provenienza, id],
            )?;
            Ok(ElementoCestino {
                id: id.to_string(),
                tipo: "nota",
                nome: nome_nota(&riga),
                provenienza,
                eliminato,
                conteggio: None,
            })
        })
    }

    /// Manda una cartella nel cestino con tutto il contenuto (RB-25).
    pub fn cestina_cartella(&mut self, percorso: &str) -> Esito<ElementoCestino> {
        self.con_riconnessione(|a| {
            valida(percorso, false)?;
            let riga = a.cartella_visibile(percorso)?;
            let conteggio = a.conta_note(&riga.id)?;
            let eliminato = a.ora();
            let provenienza = padre(percorso);
            a.db.execute(
                "UPDATE cartelle SET eliminata_il = ?, provenienza = ? WHERE id = ?",
                params![eliminato, provenienza, riga.id],
            )?;
            Ok(ElementoCestino {
                id: riga.id,
                tipo: "cartella",
                nome: riga.nome,
                provenienza,
                eliminato,
                conteggio: Some(conteggio),
            })
        })
    }

    /// Gli elementi del cestino, l'eliminato più di recente in cima (SC-04).
    pub fn elenca_cestino(&mut self) -> Esito<Vec<ElementoCestino>> {
        self.con_riconnessione(|a| a.elementi_cestino())
    }

    /// Riporta l'elemento nella radice (RB-28); una cartella con un nome già usato segue RB-31.
    pub fn ripristina(&mut self, id: &str, se_esiste: SeEsiste) -> Esito<Ripristinato> {
        self.con_riconnessione(|a| {
            let nota = a
                .db
                .query_row(
                    "SELECT id FROM note WHERE id = ? AND eliminata_il IS NOT NULL",
                    [id],
                    |r| r.get::<_, String>(0),
                )
                .optional()?;
            if nota.is_some() {
                a.db.execute(
                    "UPDATE note SET cartella = NULL, eliminata_il = NULL, provenienza = NULL WHERE id = ?",
                    [id],
                )?;
                return Ok(Ripristinato::Nota(a.nota_da_id(id)?));
            }
            let cartella = a
                .db
                .query_row(
                    "SELECT * FROM cartelle WHERE id = ? AND eliminata_il IS NOT NULL",
                    [id],
                    RigaCartella::da,
                )
                .optional()?
                .ok_or_else(|| Errore::ElementoNonTrovato(id.to_string()))?;
            let scelta = a.risolvi(None, &cartella.nome, se_esiste, None)?;
            // Con Unisci la cartella esce prima con un nome libero, poi si unisce come in uno
            // spostamento.
            let nome = if scelta.unisci {
                a.risolvi(None, &cartella.nome, SeEsiste::Numero, None)?.nome
            } else {
                scelta.nome.clone()
            };
            a.db.execute(
                "UPDATE cartelle SET madre = NULL, nome = ?, chiave = ?, eliminata_il = NULL, provenienza = NULL WHERE id = ?",
                params![nome, chiave(&nome), id],
            )?;
            match (scelta.unisci, scelta.id) {
                (true, Some(arrivo)) => {
                    let da_risolvere = a.unisci(id, &nome, &arrivo)?;
                    Ok(Ripristinato::Cartella(EsitoCartella {
                        cartella: a.descrivi(&arrivo, &scelta.nome, Some(""))?,
                        da_risolvere,
                    }))
                }
                _ => Ok(Ripristinato::Cartella(EsitoCartella {
                    cartella: a.descrivi(id, &nome, Some(""))?,
                    da_risolvere: vec![],
                })),
            }
        })
    }

    /// Cancella per sempre un elemento del cestino (RB-55).
    pub fn elimina_definitivamente(&mut self, id: &str) -> Esito<()> {
        self.con_riconnessione(|a| {
            let note =
                a.db.execute("DELETE FROM note WHERE id = ? AND eliminata_il IS NOT NULL", [id])?;
            if note > 0 {
                return Ok(());
            }
            let cartella = a
                .db
                .query_row(
                    "SELECT id FROM cartelle WHERE id = ? AND eliminata_il IS NOT NULL",
                    [id],
                    |r| r.get::<_, String>(0),
                )
                .optional()?;
            if cartella.is_none() {
                return Err(Errore::ElementoNonTrovato(id.to_string()));
            }
            a.cancella_cartella(id)
        })
    }

    /// Svuota il cestino (RB-32).
    pub fn svuota_cestino(&mut self) -> Esito<()> {
        self.con_riconnessione(|a| {
            a.db.execute("DELETE FROM note WHERE eliminata_il IS NOT NULL", [])?;
            let cartelle: Vec<String> = a
                .db
                .prepare("SELECT id FROM cartelle WHERE eliminata_il IS NOT NULL")?
                .query_map([], |r| r.get(0))?
                .collect::<Result<_, _>>()?;
            for id in cartelle {
                let esiste = a
                    .db
                    .query_row("SELECT 1 FROM cartelle WHERE id = ?", [&id], |_| Ok(()))
                    .optional()?;
                if esiste.is_some() {
                    a.cancella_cartella(&id)?;
                }
            }
            Ok(())
        })
    }

    // ——— Dettagli e tag (DEC-51) ———

    /// Cambia data di creazione scelta e fine validità; aggiorna l'ultima modifica (DEC-51).
    pub fn salva_dettagli(&mut self, id: &str, dati: &DatiDettagli) -> Esito<Nota> {
        self.con_riconnessione(|a| {
            let attuale = a.trova(id)?;
            let creata = dati.creata_scelta.clone().unwrap_or(attuale.creata_scelta);
            let fine = dati.fine_validita.clone().unwrap_or(attuale.fine_validita);
            for giorno in [&creata, &fine].into_iter().flatten() {
                valida_giorno(giorno)?;
            }
            a.db.execute(
                "UPDATE note SET creata_scelta = ?, fine_validita = ?, modificata = ? WHERE id = ?",
                params![creata, fine, a.ora(), id],
            )?;
            a.nota_da_id(id)
        })
    }

    /// Tutti i tag, anche senza note (RB-49), con quante note fuori dal cestino usano il tag o
    /// un suo sotto-tag: è il numero della conferma di eliminazione (RB-19).
    pub fn elenca_tag(&mut self) -> Esito<Vec<VoceTag>> {
        self.con_riconnessione(|a| {
            let ids: Vec<String> = a
                .db
                .prepare("SELECT id FROM tag")?
                .query_map([], |r| r.get(0))?
                .collect::<Result<_, _>>()?;
            let mut conta = a.db.prepare(
                "WITH RECURSIVE ramo(id) AS (
                   SELECT ?
                   UNION ALL
                   SELECT t.id FROM tag t JOIN ramo r ON t.padre = r.id
                 )
                 SELECT count(DISTINCT nt.nota) FROM note_tag nt
                 JOIN note n ON n.id = nt.nota
                 WHERE nt.tag IN (SELECT id FROM ramo) AND n.eliminata_il IS NULL",
            )?;
            let mut voci = Vec::new();
            for id in ids {
                let note: i64 = conta.query_row([&id], |r| r.get(0))?;
                voci.push(VoceTag { nome: a.percorso_tag(&id)?, note: note as usize });
            }
            voci.sort_by(|x, y| ordine(&x.nome, &y.nome));
            Ok(voci)
        })
    }

    /// Aggiunge un tag alla nota; se non esiste nasce con i livelli mancanti (RB-17, RB-18).
    pub fn aggiungi_tag(&mut self, id: &str, nome: &str) -> Esito<Nota> {
        self.con_riconnessione(|a| {
            a.trova(id)?;
            let livelli = livelli_tag(nome)?;
            let tag = a.id_tag(&livelli, true)?.expect("il tag appena creato ha un id");
            let nuovo = a.db.execute(
                "INSERT OR IGNORE INTO note_tag (nota, tag) VALUES (?, ?)",
                params![id, tag],
            )?;
            if nuovo > 0 {
                a.tocca(id)?;
            }
            a.nota_da_id(id)
        })
    }

    /// Toglie un tag dalla nota; il tag resta anche se nessuna nota lo usa più (RB-49).
    pub fn togli_tag(&mut self, id: &str, nome: &str) -> Esito<Nota> {
        self.con_riconnessione(|a| {
            a.trova(id)?;
            let tag = a
                .id_tag(&livelli_tag(nome)?, false)?
                .ok_or_else(|| Errore::TagNonTrovato(nome.to_string()))?;
            let tolto = a
                .db
                .execute("DELETE FROM note_tag WHERE nota = ? AND tag = ?", params![id, tag])?;
            if tolto > 0 {
                a.tocca(id)?;
            }
            a.nota_da_id(id)
        })
    }

    /// Elimina un tag e i suoi sotto-tag da tutte le note, senza toccare altro (RB-19).
    pub fn elimina_tag(&mut self, nome: &str) -> Esito<()> {
        self.con_riconnessione(|a| {
            let tag = a
                .id_tag(&livelli_tag(nome)?, false)?
                .ok_or_else(|| Errore::TagNonTrovato(nome.to_string()))?;
            a.db.execute("DELETE FROM tag WHERE id = ?", [tag])?;
            Ok(())
        })
    }

    // ——— Interni ———

    fn elenco_non_organizzate(&self) -> Esito<Vec<VoceElenco>> {
        let righe = self.righe_note(
            "SELECT * FROM note WHERE cartella IS NULL AND eliminata_il IS NULL ORDER BY modificata DESC",
            &[],
        )?;
        Ok(righe.iter().map(voce).collect())
    }

    fn righe_note(&self, sql: &str, valori: &[&str]) -> Esito<Vec<RigaNota>> {
        let mut stmt = self.db.prepare(sql)?;
        let righe = stmt.query_map(params_from_iter(valori), RigaNota::da)?;
        Ok(righe.collect::<Result<_, _>>()?)
    }

    fn elementi_cestino(&self) -> Esito<Vec<ElementoCestino>> {
        let mut elementi: Vec<ElementoCestino> = self
            .righe_note("SELECT * FROM note WHERE eliminata_il IS NOT NULL", &[])?
            .into_iter()
            .map(|n| ElementoCestino {
                nome: nome_nota(&n),
                id: n.id,
                tipo: "nota",
                provenienza: n.provenienza.unwrap_or_default(),
                eliminato: n.eliminata_il.unwrap_or_default(),
                conteggio: None,
            })
            .collect();
        let cartelle: Vec<RigaCartella> = self
            .db
            .prepare("SELECT * FROM cartelle WHERE eliminata_il IS NOT NULL")?
            .query_map([], RigaCartella::da)?
            .collect::<Result<_, _>>()?;
        for c in cartelle {
            elementi.push(ElementoCestino {
                conteggio: Some(self.conta_note(&c.id)?),
                id: c.id,
                tipo: "cartella",
                nome: c.nome,
                provenienza: c.provenienza.unwrap_or_default(),
                eliminato: c.eliminata_il.unwrap_or_default(),
            });
        }
        elementi.sort_by(|a, b| b.eliminato.cmp(&a.eliminato));
        Ok(elementi)
    }

    /// La nota fuori dal cestino e non dentro una cartella eliminata: altrimenti 404.
    fn trova(&self, id: &str) -> Esito<RigaNota> {
        let riga = self
            .db
            .query_row("SELECT * FROM note WHERE id = ?", [id], RigaNota::da)
            .optional()?
            .ok_or_else(|| Errore::NotaNonTrovata { id: id.to_string(), cestino: None })?;
        if riga.eliminata_il.is_some() {
            return Err(Errore::NotaNonTrovata { id: id.to_string(), cestino: Some(id.to_string()) });
        }
        if let Some(cartella) = self.cartella_nel_cestino(riga.cartella.as_deref())? {
            return Err(Errore::NotaNonTrovata { id: id.to_string(), cestino: Some(cartella) });
        }
        Ok(riga)
    }

    /// La cartella più vicina nel cestino tra `id` e le sue madri, se c'è.
    fn cartella_nel_cestino(&self, id: Option<&str>) -> Esito<Option<String>> {
        let mut attuale = id.map(str::to_string);
        while let Some(id) = attuale {
            let riga = self.cartella(&id)?;
            if riga.eliminata_il.is_some() {
                return Ok(Some(riga.id));
            }
            attuale = riga.madre;
        }
        Ok(None)
    }

    fn nota_da_id(&self, id: &str) -> Esito<Nota> {
        let riga = self.trova(id)?;
        self.nota(riga)
    }

    fn nota(&self, riga: RigaNota) -> Esito<Nota> {
        Ok(Nota {
            cartella: self.percorso(riga.cartella.as_deref())?.unwrap_or_default(),
            tag: self.tag_della_nota(&riga.id)?,
            id: riga.id,
            titolo: riga.titolo,
            contenuto: riga.contenuto,
            creata: riga.creata,
            modificata: riga.modificata,
            creata_scelta: riga.creata_scelta,
            fine_validita: riga.fine_validita,
        })
    }

    /// I tag della nota come percorsi completi, in ordine alfabetico (RB-18).
    fn tag_della_nota(&self, id: &str) -> Esito<Vec<String>> {
        let ids: Vec<String> = self
            .db
            .prepare("SELECT tag FROM note_tag WHERE nota = ?")?
            .query_map([id], |r| r.get(0))?
            .collect::<Result<_, _>>()?;
        let mut tag = ids.iter().map(|t| self.percorso_tag(t)).collect::<Esito<Vec<_>>>()?;
        tag.sort_by(|a, b| ordine(a, b));
        Ok(tag)
    }

    /// Percorso completo di un tag: i nomi dai livelli più alti, separati da "/".
    fn percorso_tag(&self, id: &str) -> Esito<String> {
        let mut nomi = Vec::new();
        let mut attuale = Some(id.to_string());
        while let Some(id) = attuale {
            let (nome, padre): (String, Option<String>) = self.db.query_row(
                "SELECT nome, padre FROM tag WHERE id = ?",
                [&id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )?;
            nomi.insert(0, nome);
            attuale = padre;
        }
        Ok(nomi.join("/"))
    }

    /// Id del tag con quei livelli, senza distinguere maiuscole e minuscole (RB-22).
    fn id_tag(&self, livelli: &[String], crea: bool) -> Esito<Option<String>> {
        let mut padre: Option<String> = None;
        for nome in livelli {
            let trovato = self
                .db
                .query_row(
                    "SELECT id FROM tag WHERE ifnull(padre, '') = ? AND chiave = ?",
                    params![padre.as_deref().unwrap_or(""), chiave(nome)],
                    |r| r.get::<_, String>(0),
                )
                .optional()?;
            if let Some(id) = trovato {
                padre = Some(id);
                continue;
            }
            if !crea {
                return Ok(None);
            }
            // Un tag nuovo nasce con i livelli che mancano, scritti come la prima volta
            // (RB-17, RB-18).
            let id = uuid::Uuid::new_v4().to_string();
            self.db.execute(
                "INSERT INTO tag (id, nome, chiave, padre) VALUES (?, ?, ?, ?)",
                params![id, nome, chiave(nome), padre],
            )?;
            padre = Some(id);
        }
        Ok(padre)
    }

    fn tocca(&self, id: &str) -> Esito<()> {
        self.db.execute("UPDATE note SET modificata = ? WHERE id = ?", params![self.ora(), id])?;
        Ok(())
    }

    fn cartella(&self, id: &str) -> Esito<RigaCartella> {
        Ok(self.db.query_row("SELECT * FROM cartelle WHERE id = ?", [id], RigaCartella::da)?)
    }

    /// La cartella visibile con quel percorso (non la radice).
    fn cartella_visibile(&self, percorso: &str) -> Esito<RigaCartella> {
        let id = self.id_cartella(percorso)?.expect("il percorso non è la radice");
        self.cartella(&id)
    }

    /// Id della cartella visibile con quel percorso, senza distinguere le maiuscole; "" è None.
    fn id_cartella(&self, percorso: &str) -> Esito<Option<String>> {
        if percorso.is_empty() {
            return Ok(None);
        }
        let mut madre: Option<String> = None;
        for nome in percorso.split('/') {
            let trovato = self
                .db
                .query_row(
                    "SELECT id FROM cartelle WHERE ifnull(madre, '') = ? AND chiave = ? AND eliminata_il IS NULL",
                    params![madre.as_deref().unwrap_or(""), chiave(nome)],
                    |r| r.get::<_, String>(0),
                )
                .optional()?;
            match trovato {
                Some(id) => madre = Some(id),
                None => return Err(Errore::CartellaNonTrovata(percorso.to_string())),
            }
        }
        Ok(madre)
    }

    /// Percorso di una cartella visibile; None se lei o una madre è nel cestino.
    fn percorso(&self, id: Option<&str>) -> Esito<Option<String>> {
        let mut nomi = Vec::new();
        let mut attuale = id.map(str::to_string);
        while let Some(id) = attuale {
            let riga = self.cartella(&id)?;
            if riga.eliminata_il.is_some() {
                return Ok(None);
            }
            nomi.insert(0, riga.nome);
            attuale = riga.madre;
        }
        Ok(Some(nomi.join("/")))
    }

    /// Sottocartelle visibili in ordine alfabetico (RB-64).
    fn figlie(&self, madre: Option<&str>) -> Esito<Vec<RigaCartella>> {
        let mut righe: Vec<RigaCartella> = self
            .db
            .prepare("SELECT * FROM cartelle WHERE ifnull(madre, '') = ? AND eliminata_il IS NULL")?
            .query_map([madre.unwrap_or("")], RigaCartella::da)?
            .collect::<Result<_, _>>()?;
        righe.sort_by(|a, b| ordine(&a.nome, &b.nome));
        Ok(righe)
    }

    /// La cartella con sottocartelle e note in ordine alfabetico e il numero di note
    /// (RB-56, RB-65).
    fn descrivi(&self, id: &str, nome: &str, genitore: Option<&str>) -> Esito<Cartella> {
        let genitore = match genitore {
            Some(g) => g.to_string(),
            None => padre(&self.percorso(Some(id))?.unwrap_or_else(|| nome.to_string())),
        };
        let percorso = unisci_percorso(&genitore, nome);
        let mut cartelle = Vec::new();
        for c in self.figlie(Some(id))? {
            cartelle.push(self.descrivi(&c.id, &c.nome, Some(&percorso))?);
        }
        let mut note: Vec<VoceElenco> = self
            .righe_note("SELECT * FROM note WHERE cartella = ? AND eliminata_il IS NULL", &[id])?
            .iter()
            .map(voce)
            .collect();
        note.sort_by(|a, b| {
            let nome = |v: &VoceElenco| {
                if v.titolo.is_empty() { v.anteprima.clone() } else { v.titolo.clone() }
            };
            ordine(&nome(a), &nome(b))
        });
        let conteggio = note.len() + cartelle.iter().map(|c| c.conteggio).sum::<usize>();
        Ok(Cartella { nome: nome.to_string(), percorso, conteggio, cartelle, note })
    }

    /// Id della cartella e di tutte le sottocartelle non eliminate a parte.
    fn sottoalbero(&self, id: &str) -> Esito<Vec<String>> {
        let ids = self
            .db
            .prepare(
                "WITH RECURSIVE albero(id) AS (
                   SELECT ?
                   UNION ALL
                   SELECT c.id FROM cartelle c JOIN albero a ON c.madre = a.id WHERE c.eliminata_il IS NULL
                 )
                 SELECT id FROM albero",
            )?
            .query_map([id], |r| r.get(0))?
            .collect::<Result<_, _>>()?;
        Ok(ids)
    }

    /// Note della cartella e delle sottocartelle, senza quelle eliminate a parte (RB-56).
    fn conta_note(&self, id: &str) -> Esito<usize> {
        let ids = self.sottoalbero(id)?;
        let sql = format!(
            "SELECT count(*) FROM note WHERE eliminata_il IS NULL AND cartella IN ({})",
            segnaposto(ids.len())
        );
        let n: i64 = self.db.query_row(&sql, params_from_iter(&ids), |r| r.get(0))?;
        Ok(n as usize)
    }

    fn inserisci_cartella(&self, nome: &str, madre: Option<&str>) -> Esito<String> {
        let id = uuid::Uuid::new_v4().to_string();
        self.db.execute(
            "INSERT INTO cartelle (id, nome, chiave, madre) VALUES (?, ?, ?, ?)",
            params![id, nome, chiave(nome), madre],
        )?;
        Ok(id)
    }

    /// Nome da usare nella destinazione secondo RB-31: libero, numerato o da unire.
    fn risolvi(
        &self,
        madre: Option<&str>,
        nome: &str,
        se_esiste: SeEsiste,
        escluso: Option<&str>,
    ) -> Esito<Scelta> {
        let presenti: Vec<RigaCartella> = self
            .figlie(madre)?
            .into_iter()
            .filter(|c| Some(c.id.as_str()) != escluso)
            .collect();
        let Some(esistente) = presenti.iter().find(|c| stesso(&c.nome, nome)) else {
            return Ok(Scelta { nome: nome.to_string(), unisci: false, id: None });
        };
        match se_esiste {
            SeEsiste::Unisci => Ok(Scelta {
                nome: esistente.nome.clone(),
                unisci: true,
                id: Some(esistente.id.clone()),
            }),
            SeEsiste::Chiedi => Err(Errore::NomeEsistente(esistente.nome.clone())),
            SeEsiste::Numero => {
                let mut n = 2;
                loop {
                    let candidato = format!("{nome} ({n})");
                    if !presenti.iter().any(|c| stesso(&c.nome, &candidato)) {
                        return Ok(Scelta { nome: candidato, unisci: false, id: None });
                    }
                    n += 1;
                }
            }
        }
    }

    /// Mette la cartella `id` dentro `madre` con il nome `nome`, secondo RB-31.
    fn metti(
        &self,
        id: &str,
        madre: Option<&str>,
        genitore: &str,
        nome: &str,
        se_esiste: SeEsiste,
    ) -> Esito<EsitoCartella> {
        let scelta = self.risolvi(madre, nome, se_esiste, Some(id))?;
        if let (true, Some(arrivo)) = (scelta.unisci, scelta.id.as_deref()) {
            let origine = self.percorso(Some(id))?.unwrap_or_default();
            let da_risolvere = self.unisci(id, &origine, arrivo)?;
            return Ok(EsitoCartella {
                cartella: self.descrivi(arrivo, &scelta.nome, Some(genitore))?,
                da_risolvere,
            });
        }
        self.db.execute(
            "UPDATE cartelle SET madre = ?, nome = ?, chiave = ? WHERE id = ?",
            params![madre, scelta.nome, chiave(&scelta.nome), id],
        )?;
        Ok(EsitoCartella {
            cartella: self.descrivi(id, &scelta.nome, Some(genitore))?,
            da_risolvere: vec![],
        })
    }

    /// Unisce `origine` in `arrivo` (RB-31): le note passano (i titoli possono ripetersi,
    /// RB-16), le sottocartelle senza omonimi passano anche loro, quelle con un omonimo restano
    /// e si restituiscono. L'origine sparisce se resta vuota.
    fn unisci(&self, origine: &str, percorso_origine: &str, arrivo: &str) -> Esito<Vec<String>> {
        let mut da_risolvere = Vec::new();
        let presenti = self.figlie(Some(arrivo))?;
        for figlia in self.figlie(Some(origine))? {
            if presenti.iter().any(|p| stesso(&p.nome, &figlia.nome)) {
                da_risolvere.push(unisci_percorso(percorso_origine, &figlia.nome));
            } else {
                self.db.execute(
                    "UPDATE cartelle SET madre = ? WHERE id = ?",
                    params![arrivo, figlia.id],
                )?;
            }
        }
        self.db.execute(
            "UPDATE note SET cartella = ? WHERE cartella = ? AND eliminata_il IS NULL",
            params![arrivo, origine],
        )?;
        if !da_risolvere.is_empty() {
            self.origini_unione.borrow_mut().insert(origine.to_string());
        }
        self.togli_se_vuota(origine)?;
        Ok(da_risolvere)
    }

    /// Toglie la cartella se non ha più contenuto visibile. Gli elementi nel cestino che
    /// venivano da lì si staccano prima: tornano comunque nella radice (RB-28) e la
    /// provenienza resta.
    fn togli_se_vuota(&self, id: &str) -> Esito<()> {
        let esiste = |sql: &str| -> Esito<bool> {
            Ok(self.db.query_row(sql, [id], |_| Ok(())).optional()?.is_some())
        };
        let cartelle = esiste("SELECT 1 FROM cartelle WHERE madre = ? AND eliminata_il IS NULL")?;
        let note = esiste("SELECT 1 FROM note WHERE cartella = ? AND eliminata_il IS NULL")?;
        let riga = self
            .db
            .query_row("SELECT madre FROM cartelle WHERE id = ?", [id], |r| {
                r.get::<_, Option<String>>(0)
            })
            .optional()?;
        // Già tolta risalendo da una sottocartella unita.
        let Some(madre) = riga else { return Ok(()) };
        if cartelle || note {
            return Ok(());
        }
        self.db.execute("UPDATE cartelle SET madre = NULL WHERE madre = ?", [id])?;
        self.db.execute("UPDATE note SET cartella = NULL WHERE cartella = ?", [id])?;
        self.db.execute("DELETE FROM cartelle WHERE id = ?", [id])?;
        self.origini_unione.borrow_mut().remove(id);
        // Unione su più livelli: se anche la madre era una cartella di partenza, può sparire.
        if let Some(madre) = madre {
            if self.origini_unione.borrow().contains(&madre) {
                self.togli_se_vuota(&madre)?;
            }
        }
        Ok(())
    }

    /// Cancella per sempre una cartella eliminata con il suo contenuto. Le sottocartelle e le
    /// note eliminate a parte restano nel cestino: si staccano prima di cancellare.
    fn cancella_cartella(&self, id: &str) -> Esito<()> {
        let ids = self.sottoalbero(id)?;
        let posti = segnaposto(ids.len());
        let mut valori = ids.clone();
        valori.push(id.to_string());
        self.db.execute(
            &format!(
                "UPDATE cartelle SET madre = NULL WHERE madre IN ({posti}) AND eliminata_il IS NOT NULL AND id <> ?"
            ),
            params_from_iter(&valori),
        )?;
        self.db.execute(
            &format!("DELETE FROM note WHERE cartella IN ({posti}) AND eliminata_il IS NULL"),
            params_from_iter(&ids),
        )?;
        self.db.execute("DELETE FROM cartelle WHERE id = ?", [id])?;
        Ok(())
    }
}

/// Apre il database con le impostazioni di ogni connessione. `adesso_utc()` dà ai trigger
/// l'istante dell'orologio dell'archivio (DEC-76); `tag_della_nota()` e `normalizza()`
/// servono all'indice di ricerca (DEC-95).
fn connetti(file: &Path, adesso: &Orologio) -> Esito<Connection> {
    let db = Connection::open(file)?;
    db.pragma_update(None, "journal_mode", "WAL")?;
    db.pragma_update(None, "foreign_keys", "ON")?;
    let orologio = Arc::clone(adesso);
    db.create_scalar_function("adesso_utc", 0, FunctionFlags::SQLITE_UTF8, move |_| {
        Ok(istante(orologio()))
    })?;
    db.create_scalar_function("tag_della_nota", 1, FunctionFlags::SQLITE_UTF8, |ctx| {
        let nota: String = ctx.get(0)?;
        // Sicuro: la funzione legge soltanto, sulla stessa connessione che la chiama.
        let db = unsafe { ctx.get_connection()? };
        percorsi_tag(&db, &nota)
    })?;
    db.create_scalar_function(
        "normalizza",
        1,
        FunctionFlags::SQLITE_UTF8 | FunctionFlags::SQLITE_DETERMINISTIC,
        |ctx| Ok(normalizza(&ctx.get::<String>(0)?)),
    )?;
    Ok(db)
}

/// I percorsi completi dei tag della nota, uno per riga, per l'indice di ricerca. Un tag che non
/// c'è più (mentre si eliminano un tag e i suoi sotto-tag) si ferma dove arriva.
fn percorsi_tag(db: &Connection, nota: &str) -> rusqlite::Result<String> {
    let ids: Vec<String> = db
        .prepare("SELECT tag FROM note_tag WHERE nota = ?")?
        .query_map([nota], |r| r.get(0))?
        .collect::<Result<_, _>>()?;
    let mut percorsi = Vec::new();
    for id in ids {
        let mut nomi = Vec::new();
        let mut attuale = Some(id);
        while let Some(id) = attuale {
            let riga: Option<(String, Option<String>)> = db
                .query_row("SELECT nome, padre FROM tag WHERE id = ?", [&id], |r| {
                    Ok((r.get(0)?, r.get(1)?))
                })
                .optional()?;
            let Some((nome, padre)) = riga else { break };
            nomi.insert(0, nome);
            attuale = padre;
        }
        if !nomi.is_empty() {
            percorsi.push(nomi.join("/"));
        }
    }
    Ok(percorsi.join("\n"))
}

/// Testo senza accenti e in minuscolo, per confrontare come l'indice di ricerca (RB-69).
pub fn normalizza(testo: &str) -> String {
    testo
        .nfd()
        .filter(|c| !unicode_normalization::char::is_combining_mark(*c))
        .collect::<String>()
        .to_lowercase()
}

/// Copia il database dell'API nella copia di lavoro, senza toccare l'originale.
fn copia_dall_api(origine: &Path, destinazione: &Path) -> Esito<()> {
    let db = Connection::open(origine)?;
    db.execute("VACUUM INTO ?", [destinazione.to_string_lossy()])?;
    Ok(())
}

/// Errore di SQLite per un file che non si può scrivere (SQLITE_READONLY e varianti).
fn sola_lettura(errore: &rusqlite::Error) -> bool {
    matches!(errore, rusqlite::Error::SqliteFailure(e, _) if e.code == ErrorCode::ReadOnly)
}

fn nome_nota(riga: &RigaNota) -> String {
    if riga.titolo.is_empty() { anteprima(&riga.contenuto) } else { riga.titolo.clone() }
}

fn voce(riga: &RigaNota) -> VoceElenco {
    VoceElenco {
        id: riga.id.clone(),
        titolo: riga.titolo.clone(),
        anteprima: anteprima(&riga.contenuto),
        modificata: riga.modificata.clone(),
    }
}

// ——— Regole sui nomi e sui testi ———

static SOTTOLINEATO: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"</?u>").unwrap());
static INIZIO_RIGA: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?m)^\s*(#{1,6}|[-*+]|[0-9]+\.)\s+(\[[ xX]\]\s+)?").unwrap()
});
static ENFASI: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(\*\*|__|\*|_|~~)").unwrap());
static SPAZI: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"\s+").unwrap());
static VIETATI: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r#"[<>:"/\\|?*\p{Cc}]"#).unwrap());
static FINALI: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"[. ]+$").unwrap());
static SOLO_TRATTINI: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^-+$").unwrap());
static SOLO_TRATTINI_E_PUNTI: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^[-.]+$").unwrap());
// Nomi che Windows non accetta come nome di file: restano esclusi anche per le cartelle (RB-63).
static NOMI_RISERVATI: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?i)^(con|prn|aux|nul|com[1-9]|lpt[1-9])$").unwrap());
static GIORNO: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$").unwrap());

/// Prime parole del contenuto senza simboli markdown, al massimo 80 caratteri (RB-15): come
/// `anteprima` in condiviso, che l'interfaccia usa per la nota aperta.
pub fn anteprima(contenuto: &str) -> String {
    let testo = SOTTOLINEATO.replace_all(contenuto, "");
    let testo = INIZIO_RIGA.replace_all(&testo, "");
    let testo = ENFASI.replace_all(&testo, "");
    let testo = SPAZI.replace_all(&testo, " ");
    let testo = testo.trim();
    if testo.chars().count() <= LUNGHEZZA_ANTEPRIMA {
        return testo.to_string();
    }
    let taglio: String = testo.chars().take(LUNGHEZZA_ANTEPRIMA).collect();
    match taglio.rfind(' ') {
        Some(spazio) if spazio > 0 => taglio[..spazio].to_string(),
        _ => taglio,
    }
}

/// Livelli di un tag (RB-18, RB-22): separati da "/", senza spazi ai lati; i "/" all'inizio,
/// alla fine e ripetuti si tolgono. Senza livelli il nome è vuoto.
pub fn livelli_tag(nome: &str) -> Esito<Vec<String>> {
    let livelli: Vec<String> = nome
        .split('/')
        .map(|l| SPAZI.replace_all(l, " ").trim().to_string())
        .filter(|l| !l.is_empty())
        .collect();
    if livelli.is_empty() {
        return Err(Errore::PercorsoNonValido("Il nome del tag è vuoto".into()));
    }
    Ok(livelli)
}

/// Un giorno del calendario AAAA-MM-GG che esiste davvero (DEC-28, RB-20).
fn valida_giorno(giorno: &str) -> Esito<()> {
    let valido = GIORNO.is_match(giorno)
        && NaiveDate::parse_from_str(giorno, "%Y-%m-%d")
            .map(|d| d.format("%Y-%m-%d").to_string() == giorno)
            .unwrap_or(false);
    if valido {
        Ok(())
    } else {
        Err(Errore::DataNonValida(format!("Data non valida: {giorno}")))
    }
}

/// Controlla un percorso di cartella (DEC-37); `radice` dice se "" è ammesso.
fn valida(percorso: &str, radice: bool) -> Esito<()> {
    if percorso.is_empty() {
        if radice {
            return Ok(());
        }
        return Err(Errore::PercorsoNonValido("La radice non è una cartella".into()));
    }
    if percorso.split('/').any(|p| p.is_empty() || p == "." || p == ".." || p.contains('\\')) {
        return Err(Errore::PercorsoNonValido(format!("Percorso non valido: {percorso}")));
    }
    Ok(())
}

/// Nome di una cartella: i caratteri vietati diventano "-" (RB-63); vuoto non è ammesso.
fn nome_cartella(nome: &str) -> Esito<String> {
    if nome.trim().is_empty() {
        return Err(Errore::PercorsoNonValido("Il nome è vuoto".into()));
    }
    // Un nome fatto solo di caratteri vietati resta di trattini («???» → «---»), non «Senza
    // titolo», che è il ripiego delle note; «.» e «..» restano esclusi da base_nome.
    let trattini = VIETATI.replace_all(nome, "-");
    let trattini = SPAZI.replace_all(&trattini, "");
    if SOLO_TRATTINI.is_match(&trattini) {
        return Ok(trattini.chars().take(LUNGHEZZA_MASSIMA_NOME).collect());
    }
    Ok(base_nome(nome))
}

/// Nome pulito: i caratteri vietati nei nomi dei file diventano "-" (RB-63).
pub fn base_nome(titolo: &str) -> String {
    let intero = VIETATI.replace_all(titolo, "-");
    let intero = SPAZI.replace_all(&intero, " ");
    let intero = FINALI.replace(intero.trim(), "").to_string();
    // Si contano i caratteri veri: un'emoji non si spezza a metà.
    let pulito: String = intero.chars().take(LUNGHEZZA_MASSIMA_NOME).collect();
    let pulito = pulito.trim();
    if pulito.is_empty() || SOLO_TRATTINI_E_PUNTI.is_match(pulito) {
        return SENZA_TITOLO.to_string();
    }
    if NOMI_RISERVATI.is_match(pulito) {
        format!("{pulito}-")
    } else {
        pulito.to_string()
    }
}

/// Cartella dei dati: quella delle applicazioni (DEC-46), fuori da OneDrive e iCloud; su
/// Windows quella locale, che non segue il profilo nei domini aziendali. MEMODU_CARTELLA la
/// sostituisce, per le prove.
pub fn cartella_predefinita() -> PathBuf {
    if let Some(cartella) = std::env::var_os("MEMODU_CARTELLA").filter(|c| !c.is_empty()) {
        return PathBuf::from(cartella);
    }
    let casa = || std::env::var_os(if cfg!(windows) { "USERPROFILE" } else { "HOME" })
        .map(PathBuf::from)
        .unwrap_or_default();
    if cfg!(windows) {
        let locale = std::env::var_os("LOCALAPPDATA")
            .map(PathBuf::from)
            .unwrap_or_else(|| casa().join("AppData").join("Local"));
        return locale.join("Memodu");
    }
    if cfg!(target_os = "macos") {
        return casa().join("Library").join("Application Support").join("Memodu");
    }
    casa().join(".local").join("share").join("Memodu")
}

#[path = "archivio_sinc.rs"]
pub mod sinc;

#[path = "archivio_impostazioni.rs"]
pub mod impostazioni;

#[path = "archivio_ricerca.rs"]
pub mod ricerca;

#[cfg(test)]
#[path = "archivio_test.rs"]
mod test;
