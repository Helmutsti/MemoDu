// Locale (RF-17, DEC-115, DEC-118): file e cartelle del disco, letti e scritti dal nucleo.
// - Nella copia di lavoro restano solo l'elenco delle cartelle aggiunte e le modifiche in
//   sospeso, in tabelle senza trigger: niente va sul server (RB-73, RB-78).
// - Ogni percorso deve stare dentro una cartella dell'elenco, anche dopo aver risolto i
//   collegamenti simbolici; altrimenti 400 (DEC-118).
// - Si leggono UTF-8 e, se non è valido, Windows-1252; si scrive sempre UTF-8, con gli a capo
//   e il BOM che il file aveva (RB-79, RB-80). La scrittura passa da un file temporaneo nella
//   stessa cartella, così un errore a metà lascia intatto il file di prima (SF-37).
// - L'impronta (SHA-256 dei byte letti) dice se il file è cambiato fuori da Memodu (RB-85).

use std::fs;
use std::io::{self, Write};
use std::path::{Component, Path, PathBuf};

use encoding_rs::WINDOWS_1252;
use rusqlite::{params, OptionalExtension};
use serde::Serialize;
use sha2::{Digest, Sha256};

use super::{ordine, Archivio, Errore, Esito};

/// Oltre questa misura un file non si apre (SF-17).
pub const LIMITE_FILE: u64 = 10 * 1024 * 1024;
/// Nome provvisorio di un file nuovo, mai scritto sul disco (RB-81).
const PREFISSO_NUOVO: &str = ".memodu-nuovo-";
/// Estensione dei file temporanei del salvataggio.
pub const SUFFISSO_TEMPORANEO: &str = ".memodu-temporaneo";
const SENZA_TITOLO: &str = "Senza titolo";
const LUNGHEZZA_MASSIMA_NOME: usize = 100;
const ESTENSIONI: [&str; 2] = ["md", "txt"];
const RISERVATI: [&str; 22] = [
    "con", "prn", "aux", "nul", "com1", "com2", "com3", "com4", "com5", "com6", "com7", "com8",
    "com9", "lpt1", "lpt2", "lpt3", "lpt4", "lpt5", "lpt6", "lpt7", "lpt8", "lpt9",
];

/// Schema 6 (DEC-118): l'elenco delle cartelle e le modifiche in sospeso, solo su questo
/// computer.
pub const SCHEMA_LOCALE: &str = "
  CREATE TABLE IF NOT EXISTS locale_cartelle (percorso TEXT PRIMARY KEY, aggiunta_il TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS locale_sospesi (
    percorso TEXT PRIMARY KEY,
    testo TEXT NOT NULL,
    impronta TEXT,
    codifica TEXT NOT NULL,
    a_capo TEXT NOT NULL,
    bom INTEGER NOT NULL,
    nuovo INTEGER NOT NULL,
    aggiornata_il TEXT NOT NULL
  );
";

// ——— Forme scambiate con l'interfaccia ———

/// Un elemento dell'elenco di Locale: una cartella o, trascinato da solo, un file .md o .txt
/// (DEC-120).
#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct CartellaLocale {
    pub percorso: String,
    pub nome: String,
    /// "presente", "non trovata" o "non accessibile".
    pub stato: &'static str,
    /// "cartella" o "file".
    pub tipo: &'static str,
    /// Un file con modifiche non salvate (RB-77).
    pub sospeso: bool,
}

/// Esito dell'aggiunta di quello che si è trascinato dentro Memodu (DEC-120).
#[derive(Debug, Clone, Default, Serialize, PartialEq)]
pub struct Aggiunti {
    pub aggiunti: Vec<CartellaLocale>,
    /// Già in Locale, o dentro una cartella di Locale: la cartella o il file che c'è.
    pub gia: Vec<String>,
    /// Né cartelle né file .md o .txt.
    pub scartati: Vec<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct VoceLocale {
    pub nome: String,
    pub percorso: String,
    /// "cartella" o "file".
    pub tipo: &'static str,
    pub sospeso: bool,
    pub nuovo: bool,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FileLocale {
    pub testo: String,
    pub sospeso: bool,
    pub nuovo: bool,
    pub codifica: String,
    pub sola_lettura: bool,
    /// Impronta del file sul disco adesso; None se non c'è.
    pub impronta: Option<String>,
    /// Con modifiche in sospeso: il disco è cambiato da quando si era letto (RB-85).
    pub cambiato_fuori: bool,
    /// Con modifiche in sospeso: il file sul disco non c'è più (RB-85).
    pub sparito: bool,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Salvato {
    pub percorso: String,
    pub convertito_in_utf8: bool,
    pub impronta: String,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct Percorso {
    pub percorso: String,
}

// ——— Lettura e scrittura dei byte ———

/// Un file letto dal disco, con quello che serve a riscriverlo uguale.
#[derive(Debug, Clone)]
struct Letto {
    testo: String,
    codifica: &'static str,
    a_capo: &'static str,
    bom: bool,
    impronta: String,
}

fn impronta(byte: &[u8]) -> String {
    Sha256::digest(byte).iter().map(|b| format!("{b:02x}")).collect()
}

fn decodifica(byte: &[u8]) -> Letto {
    let impronta = impronta(byte);
    let (bom, corpo) = match byte.strip_prefix(&[0xEF, 0xBB, 0xBF]) {
        Some(resto) => (true, resto),
        None => (false, byte),
    };
    let (testo, codifica) = match std::str::from_utf8(corpo) {
        Ok(testo) => (testo.to_string(), "utf-8"),
        Err(_) => (WINDOWS_1252.decode_without_bom_handling(corpo).0.into_owned(), "windows-1252"),
    };
    let a_capo = if testo.contains("\r\n") { "crlf" } else { "lf" };
    // L'editor lavora con «\n» (DEC-118).
    Letto { testo: testo.replace("\r\n", "\n"), codifica, a_capo, bom, impronta }
}

fn codifica(testo: &str, a_capo: &str, bom: bool) -> Vec<u8> {
    let testo = testo.replace("\r\n", "\n");
    let testo = if a_capo == "crlf" { testo.replace('\n', "\r\n") } else { testo };
    let mut byte = Vec::with_capacity(testo.len() + 3);
    if bom {
        byte.extend_from_slice(&[0xEF, 0xBB, 0xBF]);
    }
    byte.extend_from_slice(testo.as_bytes());
    byte
}

fn errore_disco(errore: io::Error, percorso: &Path) -> Errore {
    match errore.kind() {
        io::ErrorKind::NotFound => Errore::FileNonTrovato(percorso.display().to_string()),
        _ => Errore::DiscoRifiuta(errore.to_string()),
    }
}

fn leggi_disco(percorso: &Path) -> Esito<Letto> {
    let info = fs::metadata(percorso).map_err(|e| errore_disco(e, percorso))?;
    if info.len() > LIMITE_FILE {
        return Err(Errore::TroppoGrande(info.len()));
    }
    let byte = fs::read(percorso).map_err(|e| errore_disco(e, percorso))?;
    Ok(decodifica(&byte))
}

/// Scrive passando da un file temporaneo nella stessa cartella: se qualcosa va storto, il file
/// di prima resta com'era (SF-37).
fn scrivi_disco(percorso: &Path, byte: &[u8]) -> Esito<()> {
    let cartella = percorso.parent().ok_or_else(|| Errore::PercorsoNonValido("Percorso senza cartella".into()))?;
    let nome = percorso.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let temporaneo = cartella.join(format!(".{nome}{SUFFISSO_TEMPORANEO}"));
    let scrivi = || -> io::Result<()> {
        let mut file = fs::File::create(&temporaneo)?;
        file.write_all(byte)?;
        file.sync_all()?;
        drop(file);
        fs::rename(&temporaneo, percorso)
    };
    scrivi().map_err(|e| {
        let _ = fs::remove_file(&temporaneo);
        errore_disco(e, percorso)
    })
}

// ——— Nomi ———

fn nome_di(percorso: &Path) -> String {
    percorso.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_else(|| percorso.display().to_string())
}

fn estensione_ammessa(nome: &str) -> bool {
    Path::new(nome)
        .extension()
        .map(|e| ESTENSIONI.contains(&e.to_string_lossy().to_lowercase().as_str()))
        .unwrap_or(false)
}

fn nascosto(nome: &str) -> bool {
    nome.starts_with('.')
}

/// Nome di un file o di una cartella (RB-82): niente caratteri vietati dal sistema, niente nomi
/// riservati di Windows, niente punto all'inizio (sarebbe nascosto, RB-75).
fn nome_valido(nome: &str, file: bool) -> Esito<()> {
    let errore = |motivo: &str| Err(Errore::PercorsoNonValido(motivo.to_string()));
    if nome.trim().is_empty() {
        return errore("Il nome è vuoto");
    }
    if nome.chars().count() > 255 {
        return errore("Il nome è troppo lungo");
    }
    if let Some(c) = nome.chars().find(|c| r#"\/:*?"<>|"#.contains(*c) || c.is_control()) {
        return errore(&format!("Il nome non può contenere «{c}»"));
    }
    if nascosto(nome) {
        return errore("Un nome che comincia con il punto sarebbe nascosto");
    }
    if nome.ends_with(' ') || nome.ends_with('.') {
        return errore("Il nome non può finire con uno spazio o un punto");
    }
    let base = nome.split('.').next().unwrap_or("").trim().to_lowercase();
    if RISERVATI.contains(&base.as_str()) {
        return errore(&format!("«{nome}» è un nome riservato del sistema"));
    }
    if file && !estensione_ammessa(nome) {
        return errore("Il file deve finire con .md o .txt");
    }
    Ok(())
}

/// Il nome di un file nuovo, dalla prima riga (RB-81).
fn nome_da_testo(testo: &str) -> String {
    let riga = testo.lines().map(str::trim).find(|r| !r.is_empty()).unwrap_or("");
    let riga = riga.trim_start_matches('#').trim();
    let pulito: String = riga
        .chars()
        .filter(|c| !r#"\/:*?"<>|"#.contains(*c) && !c.is_control())
        .take(LUNGHEZZA_MASSIMA_NOME)
        .collect();
    let pulito = pulito.trim().trim_start_matches('.').trim_end_matches(['.', ' ']).to_string();
    let base = pulito.split('.').next().unwrap_or("").trim().to_lowercase();
    if pulito.is_empty() || RISERVATI.contains(&base.as_str()) {
        SENZA_TITOLO.to_string()
    } else {
        pulito
    }
}

/// C'è già un elemento con questo nome, senza distinguere maiuscole (come Windows e il Mac)?
/// `escluso` è l'elemento stesso, che può cambiare solo le maiuscole.
fn nome_occupato(cartella: &Path, nome: &str, escluso: Option<&Path>) -> Esito<bool> {
    let cercato = nome.to_lowercase();
    for voce in fs::read_dir(cartella).map_err(|e| errore_disco(e, cartella))? {
        let voce = voce.map_err(|e| errore_disco(e, cartella))?;
        if voce.file_name().to_string_lossy().to_lowercase() == cercato
            && escluso.is_none_or(|e| e != voce.path())
        {
            return Ok(true);
        }
    }
    Ok(false)
}

fn nome_libero(cartella: &Path, base: &str, estensione: &str) -> Esito<String> {
    let mut nome = format!("{base}.{estensione}");
    let mut numero = 2;
    while nome_occupato(cartella, &nome, None)? {
        nome = format!("{base} {numero}.{estensione}");
        numero += 1;
    }
    Ok(nome)
}

fn copia_tutto(da: &Path, a: &Path) -> io::Result<()> {
    if da.is_dir() {
        fs::create_dir(a)?;
        for voce in fs::read_dir(da)? {
            let voce = voce?;
            copia_tutto(&voce.path(), &a.join(voce.file_name()))?;
        }
        Ok(())
    } else {
        fs::copy(da, a).map(|_| ())
    }
}

/// Sposta anche tra dischi diversi: dove `rename` non arriva si copia e si cancella.
fn sposta_disco(da: &Path, a: &Path) -> Esito<()> {
    match fs::rename(da, a) {
        Ok(()) => Ok(()),
        // 17: ERROR_NOT_SAME_DEVICE di Windows; 18: EXDEV di macOS e Linux.
        Err(e) if matches!(e.raw_os_error(), Some(17) | Some(18)) => {
            copia_tutto(da, a).map_err(|e| errore_disco(e, a))?;
            let tolto = if da.is_dir() { fs::remove_dir_all(da) } else { fs::remove_file(da) };
            tolto.map_err(|e| errore_disco(e, da))
        }
        Err(e) => Err(errore_disco(e, da)),
    }
}

fn testo_percorso(p: &Path) -> String {
    p.display().to_string()
}

/// Se il disco del percorso ha un Cestino (RB-83). Su Windows i dischi di rete e le chiavette
/// non lo hanno, e il Cestino del sistema li eliminerebbe per sempre senza chiedere (TC-114):
/// lo dice il tipo del volume, e solo i dischi fissi ce l'hanno. Su macOS e Linux è il Cestino
/// stesso a dare errore.
#[cfg(windows)]
fn ha_cestino(percorso: &Path) -> bool {
    use std::os::windows::ffi::OsStrExt;
    #[link(name = "kernel32")]
    extern "system" {
        fn GetVolumePathNameW(file: *const u16, volume: *mut u16, lunghezza: u32) -> i32;
        fn GetDriveTypeW(radice: *const u16) -> u32;
    }
    let largo: Vec<u16> = percorso.as_os_str().encode_wide().chain(Some(0)).collect();
    // La radice del volume è un pezzo iniziale del percorso, con la barra in fondo.
    let mut volume = vec![0u16; largo.len().max(260) + 2];
    // SAFETY: i due buffer finiscono con lo zero e `volume` è lungo quanto dichiarato.
    let trovato = unsafe { GetVolumePathNameW(largo.as_ptr(), volume.as_mut_ptr(), volume.len() as u32) };
    trovato != 0 && cestino_per_tipo(unsafe { GetDriveTypeW(volume.as_ptr()) })
}

#[cfg(not(windows))]
fn ha_cestino(_percorso: &Path) -> bool {
    true
}

/// 3: DRIVE_FIXED. Rete (4), rimovibili (2), CD (5), disco in memoria (6) e i tipi che Windows
/// non riconosce (0, 1) sono senza Cestino.
#[cfg_attr(not(windows), allow(dead_code))]
fn cestino_per_tipo(tipo: u32) -> bool {
    tipo == 3
}

// ——— Archivio ———

struct Sospeso {
    testo: String,
    impronta: Option<String>,
    codifica: String,
    a_capo: String,
    bom: bool,
    nuovo: bool,
}

impl Archivio {
    fn radici(&self) -> Esito<Vec<PathBuf>> {
        Ok(self
            .db
            .prepare("SELECT percorso FROM locale_cartelle")?
            .query_map([], |r| r.get::<_, String>(0))?
            .collect::<Result<Vec<_>, _>>()?
            .into_iter()
            .map(PathBuf::from)
            .collect())
    }

    /// Le cartelle e i file dell'elenco che ci sono, per osservarli (RB-84).
    pub fn radici_locali(&mut self) -> Esito<Vec<PathBuf>> {
        self.con_riconnessione(|a| Ok(a.radici()?.into_iter().filter(|r| r.exists()).collect()))
    }

    /// Il percorso sta dentro una cartella dell'elenco, anche dopo aver risolto i collegamenti?
    /// Restituisce la cartella dell'elenco (DEC-118).
    fn dentro_elenco(&self, percorso: &Path) -> Esito<PathBuf> {
        let fuori = || Errore::PercorsoNonValido(format!("«{}» non è in Locale", percorso.display()));
        if !percorso.is_absolute() || percorso.components().any(|c| matches!(c, Component::ParentDir)) {
            return Err(fuori());
        }
        // Il percorso può non esistere ancora (un nome nuovo): si risolve la parte che c'è.
        let mut esistente = percorso.to_path_buf();
        let mut resto = Vec::new();
        while !esistente.exists() {
            match (esistente.file_name().map(|n| n.to_os_string()), esistente.parent()) {
                (Some(nome), Some(padre)) => {
                    resto.push(nome);
                    esistente = padre.to_path_buf();
                }
                _ => return Err(fuori()),
            }
        }
        let mut vero = fs::canonicalize(&esistente).map_err(|_| fuori())?;
        for nome in resto.into_iter().rev() {
            vero.push(nome);
        }
        for radice in self.radici()? {
            if let Ok(radice_vera) = fs::canonicalize(&radice) {
                if vero.starts_with(&radice_vera) {
                    return Ok(radice);
                }
            }
        }
        Err(fuori())
    }

    /// Come `dentro_elenco`, ma non la cartella dell'elenco stessa: quella non si rinomina, non
    /// si sposta e non si elimina da Locale (RB-76).
    fn dentro_elenco_non_radice(&self, percorso: &Path) -> Esito<()> {
        let radice = self.dentro_elenco(percorso)?;
        let stessa = match (fs::canonicalize(&radice), fs::canonicalize(percorso)) {
            (Ok(a), Ok(b)) => a == b,
            _ => radice == percorso,
        };
        if stessa {
            return Err(Errore::PercorsoNonValido("Una cartella di Locale si toglie con Togli da Locale".into()));
        }
        Ok(())
    }

    fn sospeso(&self, percorso: &str) -> Esito<Option<Sospeso>> {
        Ok(self
            .db
            .query_row(
                "SELECT testo, impronta, codifica, a_capo, bom, nuovo FROM locale_sospesi WHERE percorso = ?",
                [percorso],
                |r| {
                    Ok(Sospeso {
                        testo: r.get(0)?,
                        impronta: r.get(1)?,
                        codifica: r.get(2)?,
                        a_capo: r.get(3)?,
                        bom: r.get::<_, i64>(4)? == 1,
                        nuovo: r.get::<_, i64>(5)? == 1,
                    })
                },
            )
            .optional()?)
    }

    /// Le modifiche in sospeso seguono il file o la cartella rinominati o spostati.
    fn sposta_sospesi(&self, da: &Path, a: &Path) -> Esito<()> {
        let (da, a) = (testo_percorso(da), testo_percorso(a));
        let separatore = std::path::MAIN_SEPARATOR.to_string();
        self.db.execute(
            "UPDATE locale_sospesi SET percorso = ?2 || substr(percorso, length(?1) + 1)
             WHERE percorso = ?1 OR substr(percorso, 1, length(?1) + length(?3)) = ?1 || ?3",
            params![da, a, separatore],
        )?;
        Ok(())
    }

    fn togli_sospesi(&self, percorso: &Path) -> Esito<()> {
        let p = testo_percorso(percorso);
        let separatore = std::path::MAIN_SEPARATOR.to_string();
        self.db.execute(
            "DELETE FROM locale_sospesi
             WHERE percorso = ?1 OR substr(percorso, 1, length(?1) + length(?2)) = ?1 || ?2",
            params![p, separatore],
        )?;
        Ok(())
    }

    // ——— Elenco (FL-10) ———

    /// L'elenco: prima i file, poi le cartelle, in ordine alfabetico (RB-73, DEC-119, DEC-120),
    /// con lo stato letto dal disco.
    pub fn cartelle_locali(&mut self) -> Esito<Vec<CartellaLocale>> {
        self.con_riconnessione(|a| {
            let mut elenco = Vec::new();
            for r in a.radici()? {
                let nome = nome_di(&r);
                // Un elemento che non c'è più è un file se ne ha l'estensione.
                let file = r.is_file() || (!r.exists() && estensione_ammessa(&nome));
                let stato = if file {
                    if r.is_file() { "presente" } else { "non trovata" }
                } else {
                    match fs::read_dir(&r) {
                        Ok(_) => "presente",
                        Err(_) if !r.exists() => "non trovata",
                        Err(_) => "non accessibile",
                    }
                };
                let percorso = testo_percorso(&r);
                let sospeso = file && a.sospeso(&percorso)?.is_some();
                elenco.push(CartellaLocale { nome, percorso, stato, tipo: if file { "file" } else { "cartella" }, sospeso });
            }
            elenco.sort_by(|x, y| {
                (x.tipo == "cartella")
                    .cmp(&(y.tipo == "cartella"))
                    .then_with(|| ordine(&x.nome, &y.nome))
                    .then_with(|| x.percorso.cmp(&y.percorso))
            });
            Ok(elenco)
        })
    }

    /// Aggiunge a Locale quello che si è trascinato dentro Memodu: cartelle e file .md e .txt
    /// (DEC-120). Uno alla volta, così un elemento sbagliato non ferma gli altri.
    pub fn aggiungi_percorsi_locali(&mut self, percorsi: &[PathBuf]) -> Esito<Aggiunti> {
        let mut esito = Aggiunti::default();
        for p in percorsi {
            match self.aggiungi_cartella_locale(p) {
                Ok(c) => esito.aggiunti.push(c),
                Err(Errore::GiaInLocale(dove)) => esito.gia.push(dove),
                Err(Errore::PercorsoNonValido(_)) | Err(Errore::FileNonTrovato(_)) => {
                    esito.scartati.push(testo_percorso(p))
                }
                Err(e) => return Err(e),
            }
        }
        Ok(esito)
    }

    /// Aggiunge una cartella, o un file .md o .txt trascinato da solo (DEC-120); già nell'elenco
    /// o dentro un elemento dell'elenco: 409 con quello che c'è (RB-74).
    pub fn aggiungi_cartella_locale(&mut self, percorso: &Path) -> Esito<CartellaLocale> {
        self.con_riconnessione(|a| {
            if !percorso.exists() {
                return Err(Errore::FileNonTrovato(testo_percorso(percorso)));
            }
            let file = percorso.is_file();
            if file && !estensione_ammessa(&nome_di(percorso)) {
                return Err(Errore::PercorsoNonValido("Locale prende cartelle e file .md e .txt".into()));
            }
            let vero = fs::canonicalize(percorso).map_err(|e| errore_disco(e, percorso))?;
            for radice in a.radici()? {
                if let Ok(radice_vera) = fs::canonicalize(&radice) {
                    if vero.starts_with(&radice_vera) {
                        return Err(Errore::GiaInLocale(testo_percorso(&radice)));
                    }
                }
            }
            a.db.execute(
                "INSERT INTO locale_cartelle (percorso, aggiunta_il) VALUES (?, ?)",
                params![testo_percorso(percorso), a.ora()],
            )?;
            Ok(CartellaLocale {
                nome: nome_di(percorso),
                percorso: testo_percorso(percorso),
                stato: "presente",
                tipo: if file { "file" } else { "cartella" },
                sospeso: false,
            })
        })
    }

    /// Toglie la cartella dall'elenco; sul disco non cambia niente (RB-76).
    pub fn togli_cartella_locale(&mut self, percorso: &str) -> Esito<()> {
        self.con_riconnessione(|a| {
            let tolte = a.db.execute("DELETE FROM locale_cartelle WHERE percorso = ?", [percorso])?;
            if tolte == 0 {
                return Err(Errore::FileNonTrovato(percorso.to_string()));
            }
            Ok(())
        })
    }

    /// Il contenuto di una cartella: prima i file .md e .txt, poi le sottocartelle, in ordine
    /// alfabetico (RB-75, DEC-119); niente elementi nascosti. I file nuovi non ancora salvati ci sono
    /// come «Senza titolo» (RB-81).
    pub fn elenca_locale(&mut self, percorso: &str) -> Esito<Vec<VoceLocale>> {
        self.con_riconnessione(|a| {
            let cartella = Path::new(percorso);
            a.dentro_elenco(cartella)?;
            let mut cartelle = Vec::new();
            let mut file = Vec::new();
            for voce in fs::read_dir(cartella).map_err(|e| errore_disco(e, cartella))? {
                let voce = voce.map_err(|e| errore_disco(e, cartella))?;
                let nome = voce.file_name().to_string_lossy().into_owned();
                if nascosto(&nome) {
                    continue;
                }
                let percorso = testo_percorso(&voce.path());
                if voce.path().is_dir() {
                    cartelle.push(VoceLocale { nome, percorso, tipo: "cartella", sospeso: false, nuovo: false });
                } else if estensione_ammessa(&nome) {
                    let sospeso = a.sospeso(&percorso)?.is_some();
                    file.push(VoceLocale { nome, percorso, tipo: "file", sospeso, nuovo: false });
                }
            }
            cartelle.sort_by(|x, y| ordine(&x.nome, &y.nome));
            file.sort_by(|x, y| ordine(&x.nome, &y.nome));
            let separatore = std::path::MAIN_SEPARATOR;
            let prefisso = format!("{}{separatore}{PREFISSO_NUOVO}", percorso.trim_end_matches(separatore));
            let nuovi: Vec<String> = a
                .db
                .prepare("SELECT percorso FROM locale_sospesi WHERE nuovo = 1 ORDER BY aggiornata_il")?
                .query_map([], |r| r.get::<_, String>(0))?
                .collect::<Result<Vec<_>, _>>()?
                .into_iter()
                .filter(|p| p.starts_with(&prefisso))
                .collect();
            let mut voci: Vec<VoceLocale> = nuovi
                .into_iter()
                .map(|percorso| VoceLocale {
                    nome: SENZA_TITOLO.to_string(),
                    percorso,
                    tipo: "file",
                    sospeso: true,
                    nuovo: true,
                })
                .collect();
            voci.extend(file);
            voci.extend(cartelle);
            Ok(voci)
        })
    }

    // ——— File (FL-11) ———

    /// Apre un file: con modifiche in sospeso il loro testo, e se il disco è cambiato o il file
    /// è sparito da quando si era letto (RB-78, RB-85).
    pub fn apri_file_locale(&mut self, percorso: &str) -> Esito<FileLocale> {
        self.con_riconnessione(|a| {
            let p = Path::new(percorso);
            a.dentro_elenco(p)?;
            let sospeso = a.sospeso(percorso)?;
            if let Some(s) = &sospeso {
                if s.nuovo {
                    return Ok(FileLocale {
                        testo: s.testo.clone(),
                        sospeso: true,
                        nuovo: true,
                        codifica: s.codifica.clone(),
                        sola_lettura: false,
                        impronta: None,
                        cambiato_fuori: false,
                        sparito: false,
                    });
                }
            }
            let disco = match leggi_disco(p) {
                Ok(letto) => Some(letto),
                Err(Errore::FileNonTrovato(_)) if sospeso.is_some() => None,
                Err(e) => return Err(e),
            };
            let sola_lettura = fs::metadata(p).map(|m| m.permissions().readonly()).unwrap_or(false);
            Ok(match (sospeso, disco) {
                (Some(s), disco) => FileLocale {
                    testo: s.testo,
                    sospeso: true,
                    nuovo: false,
                    codifica: s.codifica,
                    sola_lettura,
                    cambiato_fuori: disco.as_ref().is_some_and(|d| Some(&d.impronta) != s.impronta.as_ref()),
                    sparito: disco.is_none(),
                    impronta: disco.map(|d| d.impronta),
                },
                (None, Some(d)) => FileLocale {
                    testo: d.testo,
                    sospeso: false,
                    nuovo: false,
                    codifica: d.codifica.to_string(),
                    sola_lettura,
                    impronta: Some(d.impronta),
                    cambiato_fuori: false,
                    sparito: false,
                },
                (None, None) => return Err(Errore::FileNonTrovato(percorso.to_string())),
            })
        })
    }

    /// Un file nuovo nella cartella: esiste solo come modifica in sospeso finché non si salva
    /// (RB-81).
    pub fn nuovo_file_locale(&mut self, cartella: &str) -> Esito<Percorso> {
        self.con_riconnessione(|a| {
            let c = Path::new(cartella);
            a.dentro_elenco(c)?;
            if !c.is_dir() {
                return Err(Errore::FileNonTrovato(cartella.to_string()));
            }
            let percorso = testo_percorso(&c.join(format!("{PREFISSO_NUOVO}{}.md", uuid::Uuid::new_v4())));
            a.db.execute(
                "INSERT INTO locale_sospesi (percorso, testo, impronta, codifica, a_capo, bom, nuovo, aggiornata_il)
                 VALUES (?, '', NULL, 'utf-8', 'lf', 0, 1, ?)",
                params![percorso, a.ora()],
            )?;
            Ok(Percorso { percorso })
        })
    }

    /// Conserva il testo non salvato (RB-78). `impronta` è quella del disco quando il testo
    /// nell'editor si è letto (o quella accettata con «Tieni la mia versione»).
    pub fn sospendi_file_locale(&mut self, percorso: &str, testo: &str, impronta: Option<&str>) -> Esito<()> {
        if testo.len() as u64 > LIMITE_FILE {
            return Err(Errore::TroppoGrande(testo.len() as u64));
        }
        self.con_riconnessione(|a| {
            let p = Path::new(percorso);
            a.dentro_elenco(p)?;
            match a.sospeso(percorso)? {
                Some(_) => {
                    a.db.execute(
                        "UPDATE locale_sospesi SET testo = ?2, impronta = CASE WHEN nuovo = 1 THEN NULL ELSE ?3 END,
                           aggiornata_il = ?4 WHERE percorso = ?1",
                        params![percorso, testo, impronta, a.ora()],
                    )?;
                }
                None => {
                    // Codifica, a capo e BOM servono a riscriverlo uguale (RB-79, RB-80).
                    let (codifica, a_capo, bom) = match leggi_disco(p) {
                        Ok(d) => (d.codifica, d.a_capo, d.bom),
                        Err(Errore::FileNonTrovato(_)) => ("utf-8", "lf", false),
                        Err(e) => return Err(e),
                    };
                    a.db.execute(
                        "INSERT INTO locale_sospesi (percorso, testo, impronta, codifica, a_capo, bom, nuovo, aggiornata_il)
                         VALUES (?, ?, ?, ?, ?, ?, 0, ?)",
                        params![percorso, testo, impronta, codifica, a_capo, bom as i64, a.ora()],
                    )?;
                }
            }
            Ok(())
        })
    }

    /// Ctrl + S (RB-79): scrive il testo sul disco. Se il disco è cambiato da quando il testo si
    /// è letto, 409 e niente scritto (RB-85). Un file nuovo prende il nome dalla prima riga
    /// (RB-81); un file sparito si ricrea al suo posto («Ricrealo»: `impronta` vuota).
    pub fn salva_file_locale(&mut self, percorso: &str, testo: &str, impronta_letta: Option<&str>) -> Esito<Salvato> {
        if testo.len() as u64 > LIMITE_FILE {
            return Err(Errore::TroppoGrande(testo.len() as u64));
        }
        self.con_riconnessione(|a| {
            let p = Path::new(percorso);
            a.dentro_elenco(p)?;
            let sospeso = a.sospeso(percorso)?;
            if sospeso.as_ref().is_some_and(|s| s.nuovo) {
                let cartella = p.parent().ok_or_else(|| Errore::PercorsoNonValido(percorso.into()))?;
                let nome = nome_libero(cartella, &nome_da_testo(testo), "md")?;
                let finale = cartella.join(&nome);
                let byte = codifica(testo, "lf", false);
                scrivi_disco(&finale, &byte)?;
                a.db.execute("DELETE FROM locale_sospesi WHERE percorso = ?", [percorso])?;
                return Ok(Salvato { percorso: testo_percorso(&finale), convertito_in_utf8: false, impronta: impronta(&byte) });
            }
            let disco = match leggi_disco(p) {
                Ok(d) => Some(d),
                Err(Errore::FileNonTrovato(_)) => None,
                Err(e) => return Err(e),
            };
            match (&disco, impronta_letta) {
                (Some(d), Some(letta)) if d.impronta != letta => return Err(Errore::CambiatoFuori),
                (Some(_), None) => return Err(Errore::CambiatoFuori),
                (None, Some(_)) => return Err(Errore::FileNonTrovato(percorso.to_string())),
                _ => {}
            }
            if fs::metadata(p).map(|m| m.permissions().readonly()).unwrap_or(false) {
                return Err(Errore::DiscoRifiuta("Il file è in sola lettura".into()));
            }
            let (codifica_prima, a_capo, bom) = match (&sospeso, &disco) {
                (Some(s), _) => (s.codifica.clone(), s.a_capo.clone(), s.bom),
                (None, Some(d)) => (d.codifica.to_string(), d.a_capo.to_string(), d.bom),
                (None, None) => ("utf-8".to_string(), "lf".to_string(), false),
            };
            let byte = codifica(testo, &a_capo, bom);
            scrivi_disco(p, &byte)?;
            a.db.execute("DELETE FROM locale_sospesi WHERE percorso = ?", [percorso])?;
            Ok(Salvato {
                percorso: percorso.to_string(),
                convertito_in_utf8: codifica_prima != "utf-8",
                impronta: impronta(&byte),
            })
        })
    }

    /// Ricarica e Chiudi (RB-85): la modifica in sospeso sparisce; un file nuovo sparisce con lei.
    pub fn scarta_file_locale(&mut self, percorso: &str) -> Esito<()> {
        self.con_riconnessione(|a| {
            a.db.execute("DELETE FROM locale_sospesi WHERE percorso = ?", [percorso])?;
            Ok(())
        })
    }

    // ——— File e cartelle sul disco (FL-12) ———

    pub fn crea_cartella_locale(&mut self, dentro: &str, nome: &str) -> Esito<Percorso> {
        self.con_riconnessione(|a| {
            let d = Path::new(dentro);
            a.dentro_elenco(d)?;
            nome_valido(nome, false)?;
            if nome_occupato(d, nome, None)? {
                return Err(Errore::NomeEsistente(nome.to_string()));
            }
            let nuova = d.join(nome);
            fs::create_dir(&nuova).map_err(|e| errore_disco(e, &nuova))?;
            Ok(Percorso { percorso: testo_percorso(&nuova) })
        })
    }

    pub fn rinomina_locale(&mut self, percorso: &str, nome: &str) -> Esito<Percorso> {
        self.con_riconnessione(|a| {
            let p = Path::new(percorso);
            a.dentro_elenco_non_radice(p)?;
            if !p.exists() {
                return Err(Errore::FileNonTrovato(percorso.to_string()));
            }
            nome_valido(nome, p.is_file())?;
            let cartella = p.parent().ok_or_else(|| Errore::PercorsoNonValido(percorso.into()))?;
            if nome_occupato(cartella, nome, Some(p))? {
                return Err(Errore::NomeEsistente(nome.to_string()));
            }
            let nuovo = cartella.join(nome);
            fs::rename(p, &nuovo).map_err(|e| errore_disco(e, p))?;
            a.sposta_sospesi(p, &nuovo)?;
            Ok(Percorso { percorso: testo_percorso(&nuovo) })
        })
    }

    pub fn sposta_locale(&mut self, percorso: &str, dentro: &str) -> Esito<Percorso> {
        self.con_riconnessione(|a| {
            let (p, d) = (Path::new(percorso), Path::new(dentro));
            a.dentro_elenco_non_radice(p)?;
            a.dentro_elenco(d)?;
            if !p.exists() {
                return Err(Errore::FileNonTrovato(percorso.to_string()));
            }
            if p.is_dir() {
                if let (Ok(pv), Ok(dv)) = (fs::canonicalize(p), fs::canonicalize(d)) {
                    if dv.starts_with(&pv) {
                        return Err(Errore::SpostamentoImpossibile);
                    }
                }
            }
            let nome = nome_di(p);
            let nuovo = d.join(&nome);
            if nuovo == p {
                return Ok(Percorso { percorso: percorso.to_string() });
            }
            if nome_occupato(d, &nome, None)? {
                return Err(Errore::NomeEsistente(nome));
            }
            sposta_disco(p, &nuovo)?;
            a.sposta_sospesi(p, &nuovo)?;
            Ok(Percorso { percorso: testo_percorso(&nuovo) })
        })
    }

    /// Nel Cestino del sistema; se non si può, 409 e l'interfaccia chiede se eliminare per
    /// sempre (RB-83).
    pub fn elimina_locale(&mut self, percorso: &str, per_sempre: bool) -> Esito<()> {
        self.con_riconnessione(|a| {
            let p = Path::new(percorso);
            a.dentro_elenco_non_radice(p)?;
            if !p.exists() {
                return Err(Errore::FileNonTrovato(percorso.to_string()));
            }
            if per_sempre {
                let tolto = if p.is_dir() { fs::remove_dir_all(p) } else { fs::remove_file(p) };
                tolto.map_err(|e| errore_disco(e, p))?;
            } else if !ha_cestino(p) || trash::delete(p).is_err() {
                return Err(Errore::CestinoNonDisponibile);
            }
            a.togli_sospesi(p)?;
            Ok(())
        })
    }
}

#[cfg(test)]
#[path = "archivio_locale_test.rs"]
mod test;
