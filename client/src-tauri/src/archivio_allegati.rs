// Allegati di Brainet nella copia di lavoro (RF-18, DEC-135; architettura «Allegati di Brainet»).
// Nel testo di un frammento un allegato è un segno nascosto, come le pillole (EN-18):
//   <allegato id="ID" f="documento|bolla|piccola|media|grande">nome del file</allegato>
// La tabella `allegati` (EN-17) si sincronizza come blocco `allegato`; `allegati_file` dice solo
// a questo computer che cosa resta da caricare o da cancellare sul server. I file stanno nella
// cartella dei dati: `allegati/ID/nome del file` e, per le foto, `allegati/ID-anteprima.jpg`; se
// ci sono sul disco sono scaricati, se mancano si scaricano quando servono (RB-118).
// Un allegato si cancella solo sul computer dove è stato tolto (scelta di Manuel Cucca del
// 15/10/2026): Togli, Elimina per sempre, Svuota il Cestino e un file allegato che non entra nel
// testo lo mettono in `allegati_da_controllare`; alla chiusura del foglio quelli che nessuna nota
// usa più se ne vanno. Gli altri computer lo cancellano solo ricevendo il blocco «eliminato»,
// mai per conto loro: un allegato appena arrivato, prima della nota che lo usa, resta.

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::LazyLock;

use regex::Regex;
use rusqlite::{params, OptionalExtension};
use serde::Serialize;
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};

use super::{Archivio, Errore, Esito};

/// Schema 9: gli allegati e il loro stato su questo computer.
pub const SCHEMA_ALLEGATI: &str = "
  CREATE TABLE allegati (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    grandezza INTEGER NOT NULL,
    impronta TEXT NOT NULL,
    larghezza INTEGER,
    altezza INTEGER,
    creato_il TEXT NOT NULL
  );
  CREATE TABLE allegati_file (
    id TEXT PRIMARY KEY,
    stato TEXT NOT NULL
  );
  CREATE TABLE allegati_da_controllare (
    id TEXT PRIMARY KEY
  );
";

/// 25 MB (RB-115).
pub const LIMITE_BYTE: u64 = 25 * 1024 * 1024;
/// Lato lungo dell'anteprima di una foto.
const LATO_ANTEPRIMA: u32 = 1440;
/// Nome di un allegato (EN-17).
const LUNGHEZZA_NOME: usize = 255;
pub const TIPO_BLOCCO: &str = "allegato";
pub const AVVISO_TIPO: &str =
    "Si allegano solo foto e documenti (JPG, PNG, PDF, Word, Excel, PowerPoint, testo).";

/// Stati in `allegati_file`.
const DA_CARICARE: &str = "da_caricare";
const CARICATO: &str = "caricato";
const DA_CANCELLARE: &str = "da_cancellare";
/// Arrivato da un altro computer: il file è sul server.
const REMOTO: &str = "remoto";

static SEGNO: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"<allegato id="([^"]+)" f="([a-z]+)">([^<]*)</allegato>"#).unwrap()
});

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct Allegato {
    pub id: String,
    pub nome: String,
    pub tipo: String,
    /// "documento" per i documenti, "piccola" per le foto: l'interfaccia ne fa una bolla se la
    /// foto finisce dentro un paragrafo (RB-117).
    pub forma: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct InfoAllegato {
    pub nome: String,
    pub tipo: String,
    pub grandezza: u64,
    /// L'anteprima di una foto come indirizzo `data:`, o None se non è ancora sul computer.
    pub anteprima: Option<String>,
}

/// Il tipo dal nome e dai primi byte del file (RB-115, SF-21); None se non si allega.
pub fn tipo_del_file(nome: &str, byte: &[u8]) -> Option<&'static str> {
    let estensione = nome.rsplit_once('.').map(|(_, e)| e.to_lowercase()).unwrap_or_default();
    let inizia = |firma: &[u8]| byte.starts_with(firma);
    // I documenti di Office di oggi sono archivi zip, quelli di prima file OLE.
    let zip = inizia(b"PK\x03\x04");
    let ole = inizia(&[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
    let tipo = match estensione.as_str() {
        "jpg" | "jpeg" if inizia(&[0xFF, 0xD8, 0xFF]) => "jpg",
        "png" if inizia(b"\x89PNG\r\n\x1a\n") => "png",
        "pdf" if inizia(b"%PDF") => "pdf",
        "docx" if zip => "word",
        "doc" if ole => "word",
        "xlsx" if zip => "excel",
        "xls" if ole => "excel",
        "pptx" if zip => "powerpoint",
        "ppt" if ole => "powerpoint",
        "txt" if !byte.contains(&0) => "testo",
        _ => return None,
    };
    Some(tipo)
}

pub fn e_foto(tipo: &str) -> bool {
    tipo == "jpg" || tipo == "png"
}

/// Gli id degli allegati scritti in un testo.
pub fn allegati_nel_testo(testo: &str) -> impl Iterator<Item = &str> {
    SEGNO.captures_iter(testo).map(|c| c.get(1).unwrap().as_str())
}

/// Il testo che si legge al posto del segno: il nome del file.
pub fn senza_segni_allegato(testo: &str) -> String {
    SEGNO.replace_all(testo, "$3").into_owned()
}

/// Un nome che va bene come nome di file su Windows e sul Mac.
fn nome_sul_disco(nome: &str) -> String {
    let pulito: String = nome
        .chars()
        .map(|c| if "<>:\"/\\|?*".contains(c) || c.is_control() { '_' } else { c })
        .collect();
    let pulito = pulito.trim().trim_end_matches('.').to_string();
    if pulito.is_empty() { "allegato".into() } else { pulito }
}

fn impronta(byte: &[u8]) -> String {
    Sha256::digest(byte).iter().map(|b| format!("{b:02x}")).collect()
}

/// L'anteprima di una foto (lato lungo 1440 px, JPEG) con le sue misure originali.
fn anteprima_foto(byte: &[u8]) -> Esito<(Vec<u8>, u32, u32)> {
    let immagine = image::load_from_memory(byte).map_err(|_| Errore::NonValido(AVVISO_TIPO.into()))?;
    let (larghezza, altezza) = (immagine.width(), immagine.height());
    let ridotta = if larghezza.max(altezza) > LATO_ANTEPRIMA {
        immagine.thumbnail(LATO_ANTEPRIMA, LATO_ANTEPRIMA)
    } else {
        immagine
    };
    let mut fuori = std::io::Cursor::new(Vec::new());
    ridotta
        .to_rgb8()
        .write_to(&mut fuori, image::ImageFormat::Jpeg)
        .map_err(|_| Errore::NonValido(AVVISO_TIPO.into()))?;
    Ok((fuori.into_inner(), larghezza, altezza))
}

/// Scrive un file passando da uno temporaneo: un file a metà non sembra mai scaricato.
pub fn scrivi_intero(percorso: &Path, byte: &[u8]) -> Esito<()> {
    let disco = |e: std::io::Error| Errore::DiscoRifiuta(e.to_string());
    if let Some(cartella) = percorso.parent() {
        std::fs::create_dir_all(cartella).map_err(disco)?;
    }
    let provvisorio = percorso.with_extension("parziale");
    std::fs::write(&provvisorio, byte).map_err(disco)?;
    std::fs::rename(&provvisorio, percorso).map_err(disco)
}

fn info_da_riga(r: &rusqlite::Row) -> rusqlite::Result<(String, String, i64, String)> {
    Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?))
}

impl Archivio {
    // ——— Dove stanno i file ———

    pub fn cartella_allegati(&self) -> PathBuf {
        self.file.parent().map(Path::to_path_buf).unwrap_or_default().join("allegati")
    }

    fn cartella_allegato(&self, id: &str) -> PathBuf {
        self.cartella_allegati().join(id)
    }

    pub fn percorso_anteprima(&self, id: &str) -> PathBuf {
        self.cartella_allegati().join(format!("{id}-anteprima.jpg"))
    }

    /// Il percorso del file com'è (o sarà) sul disco.
    pub fn percorso_allegato(&mut self, id: &str) -> Esito<PathBuf> {
        let (nome, _, _, _) = self.con_riconnessione(|a| a.riga_allegato(id))?;
        Ok(self.cartella_allegato(id).join(nome_sul_disco(&nome)))
    }

    fn togli_file(&self, id: &str) {
        let _ = std::fs::remove_dir_all(self.cartella_allegato(id));
        let _ = std::fs::remove_file(self.percorso_anteprima(id));
    }

    // ——— Allegare (FL-23) ———

    /// Controlla il file e lo mette tra gli allegati, da caricare (RB-114, RB-115). Lo stesso file
    /// con lo stesso nome, già allegato, dà l'allegato che c'è (impronta, EN-17).
    pub fn allega(&mut self, nome: &str, byte: &[u8]) -> Esito<Allegato> {
        self.con_riconnessione(|a| a.acceso_brainet())?;
        let nome = nome.trim();
        if nome.is_empty() || nome.chars().count() > LUNGHEZZA_NOME {
            return Err(Errore::NonValido("Il nome del file non va bene".into()));
        }
        if byte.len() as u64 > LIMITE_BYTE {
            return Err(Errore::TroppoGrande(byte.len() as u64));
        }
        let tipo = tipo_del_file(nome, byte).ok_or_else(|| Errore::NonValido(AVVISO_TIPO.into()))?;
        let impronta = impronta(byte);
        let gia: Option<String> = self.con_riconnessione(|a| {
            Ok(a.db
                .query_row("SELECT id FROM allegati WHERE impronta = ? AND nome = ?", params![impronta, nome], |r| {
                    r.get(0)
                })
                .optional()?)
        })?;
        if let Some(id) = gia {
            self.con_riconnessione(|a| a.da_controllare(&id))?;
            return self.allegato(&id);
        }
        let (anteprima, misure) = if e_foto(tipo) {
            let (a, l, h) = anteprima_foto(byte)?;
            (Some(a), Some((l, h)))
        } else {
            (None, None)
        };
        let id = uuid::Uuid::new_v4().to_string();
        scrivi_intero(&self.cartella_allegato(&id).join(nome_sul_disco(nome)), byte)?;
        if let Some(a) = &anteprima {
            scrivi_intero(&self.percorso_anteprima(&id), a)?;
        }
        let scritto = self.con_riconnessione(|a| {
            a.db.execute(
                "INSERT INTO allegati (id, nome, tipo, grandezza, impronta, larghezza, altezza, creato_il)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                params![
                    id,
                    nome,
                    tipo,
                    byte.len() as i64,
                    impronta,
                    misure.map(|m| m.0),
                    misure.map(|m| m.1),
                    a.ora()
                ],
            )?;
            a.db.execute("INSERT OR REPLACE INTO allegati_file (id, stato) VALUES (?, ?)", params![id, DA_CARICARE])?;
            // Se poi non entra nel testo, alla chiusura del foglio se ne va.
            a.da_controllare(&id)
        });
        if let Err(e) = scritto {
            self.togli_file(&id);
            return Err(e);
        }
        self.allegato(&id)
    }

    fn allegato(&mut self, id: &str) -> Esito<Allegato> {
        let (nome, tipo, _, _) = self.con_riconnessione(|a| a.riga_allegato(id))?;
        let forma = if e_foto(&tipo) { "piccola" } else { "documento" };
        Ok(Allegato { id: id.to_string(), nome, forma: forma.into(), tipo })
    }

    fn riga_allegato(&self, id: &str) -> Esito<(String, String, i64, String)> {
        self.db
            .query_row("SELECT nome, tipo, grandezza, impronta FROM allegati WHERE id = ?", [id], info_da_riga)
            .optional()?
            .ok_or_else(|| Errore::BrainetNonTrovato(id.to_string()))
    }

    fn acceso_brainet(&self) -> Esito<()> {
        let acceso: Option<Option<bool>> = self
            .db
            .query_row(
                "SELECT brainet FROM impostazioni WHERE id = ?",
                [super::impostazioni::ID],
                |r| r.get(0),
            )
            .optional()?;
        if acceso.flatten().unwrap_or(false) { Ok(()) } else { Err(Errore::BrainetSpento) }
    }

    // ——— Leggere ———

    /// Nome, tipo e grandezza, con l'anteprima se la foto è sul computer.
    pub fn leggi_allegato(&mut self, id: &str) -> Esito<InfoAllegato> {
        use base64::Engine;
        let (nome, tipo, grandezza, _) = self.con_riconnessione(|a| {
            a.acceso_brainet()?;
            a.riga_allegato(id)
        })?;
        let anteprima = if e_foto(&tipo) {
            std::fs::read(self.percorso_anteprima(id))
                .ok()
                .map(|b| format!("data:image/jpeg;base64,{}", base64::engine::general_purpose::STANDARD.encode(b)))
        } else {
            None
        };
        Ok(InfoAllegato { nome, tipo, grandezza: grandezza as u64, anteprima })
    }

    /// Il file è già tutto sul computer?
    pub fn allegato_scaricato(&mut self, id: &str) -> Esito<bool> {
        Ok(self.percorso_allegato(id)?.is_file())
    }

    /// L'impronta che il file scaricato deve avere.
    pub fn impronta_allegato(&mut self, id: &str) -> Esito<String> {
        Ok(self.con_riconnessione(|a| a.riga_allegato(id))?.3)
    }

    /// Mette sul disco un file scaricato, solo se è proprio quello (impronta).
    pub fn salva_scaricato(&mut self, id: &str, byte: &[u8]) -> Esito<PathBuf> {
        if impronta(byte) != self.impronta_allegato(id)? {
            return Err(Errore::NonValido("Il file scaricato non è quello allegato".into()));
        }
        let percorso = self.percorso_allegato(id)?;
        scrivi_intero(&percorso, byte)?;
        Ok(percorso)
    }

    pub fn salva_anteprima_scaricata(&mut self, id: &str, byte: &[u8]) -> Esito<()> {
        self.con_riconnessione(|a| a.riga_allegato(id))?;
        scrivi_intero(&self.percorso_anteprima(id), byte)
    }

    // ——— Il viaggio dei file (filo degli allegati) ———

    fn con_stato(&mut self, stato: &'static str) -> Esito<Vec<String>> {
        self.con_riconnessione(|a| {
            Ok(a.db
                .prepare("SELECT id FROM allegati_file WHERE stato = ? ORDER BY id")?
                .query_map([stato], |r| r.get(0))?
                .collect::<Result<_, _>>()?)
        })
    }

    pub fn allegati_da_caricare(&mut self) -> Esito<Vec<String>> {
        self.con_stato(DA_CARICARE)
    }

    pub fn allegati_da_cancellare(&mut self) -> Esito<Vec<String>> {
        self.con_stato(DA_CANCELLARE)
    }

    /// Il file e l'anteprima da caricare, così come sono sul disco.
    pub fn file_da_caricare(&mut self, id: &str) -> Esito<(Vec<u8>, Option<Vec<u8>>)> {
        let disco = |e: std::io::Error| Errore::DiscoRifiuta(e.to_string());
        let file = std::fs::read(self.percorso_allegato(id)?).map_err(disco)?;
        let anteprima = std::fs::read(self.percorso_anteprima(id)).ok();
        Ok((file, anteprima))
    }

    pub fn allegato_caricato(&mut self, id: &str) -> Esito<()> {
        self.con_riconnessione(|a| {
            a.db.execute(
                "UPDATE allegati_file SET stato = ? WHERE id = ? AND stato = ?",
                params![CARICATO, id, DA_CARICARE],
            )?;
            Ok(())
        })
    }

    pub fn allegato_cancellato(&mut self, id: &str) -> Esito<()> {
        self.con_riconnessione(|a| {
            a.db.execute("DELETE FROM allegati_file WHERE id = ? AND stato = ?", params![id, DA_CANCELLARE])?;
            Ok(())
        })
    }

    // ——— Togliere (RB-121) ———

    fn da_controllare(&self, id: &str) -> Esito<()> {
        self.db.execute("INSERT OR IGNORE INTO allegati_da_controllare (id) VALUES (?)", [id])?;
        Ok(())
    }

    /// Gli allegati che c'erano in `prima` e non ci sono in `dopo`, tolti su questo computer.
    pub(super) fn segna_tolti(&self, prima: &str, dopo: &str) -> Esito<()> {
        let restano: HashSet<&str> = allegati_nel_testo(dopo).collect();
        for id in allegati_nel_testo(prima).filter(|id| !restano.contains(id)) {
            self.da_controllare(id)?;
        }
        Ok(())
    }

    /// Cancella gli allegati tolti qui che nessun frammento, nemmeno nel Cestino, usa più: via dal
    /// computer, e (con il blocco «eliminato» e la cancellazione sul server) da tutti gli altri.
    /// Si chiama quando si chiude il foglio, così Ctrl+Z dopo «Togli» rimette l'allegato.
    pub fn pulisci_allegati(&mut self) -> Esito<usize> {
        let tolti = self.con_riconnessione(|a| a.togli_allegati_inusati())?;
        for id in &tolti {
            self.togli_file(id);
        }
        Ok(tolti.len())
    }

    /// Nella transazione di chi chiama; i file li toglie chi chiama, dopo.
    pub(super) fn togli_allegati_inusati(&self) -> Esito<Vec<String>> {
        let testi: Vec<String> =
            self.db.prepare("SELECT testo FROM frammenti")?.query_map([], |r| r.get(0))?.collect::<Result<_, _>>()?;
        let usati: HashSet<&str> = testi.iter().flat_map(|t| allegati_nel_testo(t)).collect();
        let segnati: Vec<String> = self
            .db
            .prepare("SELECT id FROM allegati_da_controllare")?
            .query_map([], |r| r.get(0))?
            .collect::<Result<_, _>>()?;
        self.db.execute("DELETE FROM allegati_da_controllare", [])?;
        // Uno rimesso con Ctrl+Z, o usato da un'altra nota, resta.
        let tolti: Vec<String> = segnati.into_iter().filter(|id| !usati.contains(id.as_str())).collect();
        for id in &tolti {
            if self.db.query_row("SELECT 1 FROM allegati WHERE id = ?", [id], |_| Ok(())).optional()?.is_none() {
                continue;
            }
            self.db.execute("DELETE FROM allegati WHERE id = ?", [id])?;
            self.db.execute("INSERT OR REPLACE INTO allegati_file (id, stato) VALUES (?, ?)", params![id, DA_CANCELLARE])?;
        }
        Ok(tolti)
    }

    /// Spegnendo Brainet tutti gli allegati vanno, anche dal server (RB-111).
    pub(super) fn cancella_tutti_allegati(&self) -> Esito<()> {
        self.db.execute_batch(&format!(
            "INSERT OR REPLACE INTO allegati_file (id, stato) SELECT id, '{DA_CANCELLARE}' FROM allegati;
             DELETE FROM allegati; DELETE FROM allegati_da_controllare;"
        ))?;
        let _ = std::fs::remove_dir_all(self.cartella_allegati());
        Ok(())
    }

    // ——— Sincronizzazione del blocco `allegato` ———

    pub(super) fn campi_allegato(&self, id: &str) -> Esito<Option<Value>> {
        Ok(self
            .db
            .query_row(
                "SELECT nome, tipo, grandezza, impronta, larghezza, altezza, creato_il FROM allegati WHERE id = ?",
                [id],
                |r| {
                    Ok(json!({
                        "nome": r.get::<_, String>(0)?,
                        "tipo": r.get::<_, String>(1)?,
                        "grandezza": r.get::<_, i64>(2)?,
                        "impronta": r.get::<_, String>(3)?,
                        "larghezza": r.get::<_, Option<i64>>(4)?,
                        "altezza": r.get::<_, Option<i64>>(5)?,
                        "creato_il": r.get::<_, String>(6)?,
                    }))
                },
            )
            .optional()?)
    }

    /// Un allegato ricevuto: il file è sul server, si scarica quando serve.
    pub(super) fn applica_allegato(&self, id: &str, c: &Map<String, Value>) -> Esito<()> {
        let testo = |k: &str| c.get(k).and_then(Value::as_str).map(str::to_string);
        let numero = |k: &str| c.get(k).and_then(Value::as_i64);
        self.db.execute(
            "INSERT INTO allegati (id, nome, tipo, grandezza, impronta, larghezza, altezza, creato_il)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT(id) DO UPDATE SET nome = ?2, tipo = ?3, grandezza = ?4, impronta = ?5,
               larghezza = ?6, altezza = ?7, creato_il = ?8",
            params![
                id,
                testo("nome").unwrap_or_default(),
                testo("tipo").unwrap_or_else(|| "testo".into()),
                numero("grandezza").unwrap_or(0),
                testo("impronta").unwrap_or_default(),
                numero("larghezza"),
                numero("altezza"),
                testo("creato_il").unwrap_or_else(|| self.ora()),
            ],
        )?;
        self.db.execute("INSERT OR IGNORE INTO allegati_file (id, stato) VALUES (?, ?)", params![id, REMOTO])?;
        Ok(())
    }

    /// Cancellato su un altro computer: qui spariscono i file; il server lo cancella chi l'ha tolto.
    pub(super) fn allegato_eliminato_altrove(&self, id: &str) -> Esito<()> {
        self.db.execute("DELETE FROM allegati_file WHERE id = ? AND stato <> ?", params![id, DA_CANCELLARE])?;
        self.togli_file(id);
        Ok(())
    }
}

#[cfg(test)]
#[path = "archivio_allegati_test.rs"]
mod test;
