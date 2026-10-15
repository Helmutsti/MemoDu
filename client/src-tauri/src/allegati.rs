// Allegati di Brainet (RF-18, DEC-135; architettura/api.md, «Allegati»): i comandi
// dell'interfaccia e il filo che porta i file al server e li riporta indietro. Il filo è a parte
// da quello della sincronizzazione, così un file grande non ferma le note (RB-118). I file
// partono cifrati con la chiave dati e arrivano al deposito con indirizzi firmati dal server.

use std::collections::HashSet;
use std::io::Read;
use std::path::PathBuf;
use std::sync::mpsc::{Receiver, RecvTimeoutError, Sender};
use std::sync::Mutex;
use std::time::Duration;

use serde_json::{json, Value};
use tauri::ipc::{InvokeBody, Request};
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

use crate::accesso::PROTOCOLLO;
use crate::archivio::allegati::{Allegato, InfoAllegato, AVVISO_TIPO, LIMITE_BYTE};
use crate::archivio::{id_valido, Errore, Esito};
use crate::cifratura::{apri_file, chiudi_file};
use crate::comandi::Dati;
use crate::sincronizzazione::{credenziali, Credenziali};

/// Un giro ogni 30 s, come la sincronizzazione, e subito dopo un allegato nuovo.
const INTERVALLO: Duration = Duration::from_secs(30);
const ATTESA_RICHIESTA: Duration = Duration::from_secs(15);
/// Per i file: il tempo massimo senza che passi niente, non per tutto il file.
const ATTESA_FILE: Duration = Duration::from_secs(60);
const ESTENSIONI: [&str; 11] = ["jpg", "jpeg", "png", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"];

/// Il filo degli allegati: il segnale per svegliarlo e le anteprime da scaricare.
pub struct FiloAllegati {
    segnale: Mutex<Sender<()>>,
    anteprime: Mutex<HashSet<String>>,
}

impl FiloAllegati {
    pub fn nuovo() -> (Self, Receiver<()>) {
        let (segnale, segnali) = std::sync::mpsc::channel();
        (FiloAllegati { segnale: Mutex::new(segnale), anteprime: Mutex::default() }, segnali)
    }

    pub fn sveglia(&self) {
        let _ = self.segnale.lock().map(|s| s.send(()));
    }

    fn chiedi_anteprima(&self, id: &str) {
        let nuova = self.anteprime.lock().map(|mut a| a.insert(id.to_string())).unwrap_or(false);
        if nuova {
            self.sveglia();
        }
    }
}

pub fn avvia(app: AppHandle, segnali: Receiver<()>) {
    std::thread::spawn(move || loop {
        match segnali.recv_timeout(INTERVALLO) {
            Ok(()) | Err(RecvTimeoutError::Timeout) => while segnali.try_recv().is_ok() {},
            Err(RecvTimeoutError::Disconnected) => return,
        }
        giro(&app);
    });
}

/// Cancella sul server quello che nessuno usa più, carica i file nuovi, scarica le anteprime
/// chieste. Senza accesso o senza rete aspetta il giro dopo (SF-08, SF-30).
fn giro(app: &AppHandle) {
    let Some(c) = credenziali(app) else { return };
    let dati = app.state::<Dati>();
    for id in dati.con(|a| a.allegati_da_cancellare()).unwrap_or_default() {
        match api(&c, "DELETE", &format!("/allegati/{id}"), None) {
            Ok(_) => {
                let _ = dati.con(|a| a.allegato_cancellato(&id));
            }
            Err(Fallita::Rete) => return,
            Err(_) => {}
        }
    }
    for id in dati.con(|a| a.allegati_da_caricare()).unwrap_or_default() {
        match carica(&dati, &c, &id) {
            Ok(()) => {
                let _ = dati.con(|a| a.allegato_caricato(&id));
            }
            Err(Fallita::Rete) => return,
            Err(_) => {}
        }
    }
    let filo = app.state::<FiloAllegati>();
    let chieste: Vec<String> = filo.anteprime.lock().map(|mut a| a.drain().collect()).unwrap_or_default();
    for id in chieste {
        match scarica_anteprima(&dati, &c, &id) {
            Ok(()) => {
                let _ = app.emit("allegato-pronto", json!({ "id": id }));
            }
            // Senza rete si riprova al giro dopo; se il file non è ancora sul server (l'altro
            // computer lo sta caricando) si riprova quando la nota lo chiede di nuovo.
            Err(Fallita::Rete) => {
                let _ = filo.anteprime.lock().map(|mut a| a.insert(id));
            }
            Err(_) => {}
        }
    }
}

fn carica(dati: &Dati, c: &Credenziali, id: &str) -> Result<(), Fallita> {
    let (file, anteprima) = dati.con(|a| a.file_da_caricare(id)).map_err(|_| Fallita::Altro)?;
    let file = chiudi_file(&c.chiave, id, &file);
    let anteprima = anteprima.map(|a| chiudi_file(&c.chiave, &format!("{id}-anteprima"), &a));
    let corpo = json!({ "grandezza": file.len(), "anteprima": anteprima.as_ref().map_or(0, Vec::len) });
    let indirizzi = api(c, "POST", &format!("/allegati/{id}/caricamento"), Some(corpo))?;
    metti(indirizzi["file"].as_str().ok_or(Fallita::Altro)?, &file)?;
    if let (Some(a), Some(indirizzo)) = (anteprima, indirizzi["anteprima"].as_str()) {
        metti(indirizzo, &a)?;
    }
    api(c, "POST", &format!("/allegati/{id}/fatto"), None)?;
    Ok(())
}

fn scarica_anteprima(dati: &Dati, c: &Credenziali, id: &str) -> Result<(), Fallita> {
    let indirizzi = api(c, "GET", &format!("/allegati/{id}/scaricamento"), None)?;
    let cifrata = prendi(indirizzi["anteprima"].as_str().ok_or(Fallita::Altro)?)?;
    let anteprima = apri_file(&c.chiave, &format!("{id}-anteprima"), &cifrata).ok_or(Fallita::Altro)?;
    dati.con(|a| a.salva_anteprima_scaricata(id, &anteprima)).map_err(|_| Fallita::Altro)
}

/// Il file sul computer, scaricandolo se serve (RB-118): per «Apri» e «Mostra nella cartella».
fn file_sul_computer(app: &AppHandle, id: &str) -> Esito<PathBuf> {
    let dati = app.state::<Dati>();
    if dati.con(|a| a.allegato_scaricato(id))? {
        return dati.con(|a| a.percorso_allegato(id));
    }
    let c = credenziali(app).ok_or(Errore::SenzaRete)?;
    let scaricato = (|| -> Result<Vec<u8>, Fallita> {
        let indirizzi = api(&c, "GET", &format!("/allegati/{id}/scaricamento"), None)?;
        let cifrato = prendi(indirizzi["file"].as_str().ok_or(Fallita::Altro)?)?;
        apri_file(&c.chiave, id, &cifrato).ok_or(Fallita::Altro)
    })();
    match scaricato {
        Ok(byte) => dati.con(|a| a.salva_scaricato(id, &byte)),
        Err(Fallita::Rete) => Err(Errore::SenzaRete),
        // SF-20: sul server non c'è (più), o non si apre.
        Err(_) => Err(Errore::NonValido("Allegato non più disponibile".into())),
    }
}

// ——— Richieste ———

enum Fallita {
    Rete,
    Altro,
}

fn api(c: &Credenziali, metodo: &str, percorso: &str, corpo: Option<Value>) -> Result<Value, Fallita> {
    let agente = ureq::AgentBuilder::new().timeout(ATTESA_RICHIESTA).build();
    let url = format!("{}{}", c.indirizzo.trim_end_matches('/'), percorso);
    let r = agente
        .request(metodo, &url)
        .set("Authorization", &format!("Bearer {}", c.gettone))
        .set("Memodu-Protocollo", PROTOCOLLO);
    let risposta = match corpo {
        Some(corpo) => r.send_json(corpo),
        None => r.call(),
    };
    match risposta {
        Ok(ok) if ok.status() == 204 => Ok(Value::Null),
        Ok(ok) => ok.into_json::<Value>().map_err(|_| Fallita::Altro),
        Err(ureq::Error::Transport(_)) => Err(Fallita::Rete),
        Err(ureq::Error::Status(_, _)) => Err(Fallita::Altro),
    }
}

fn agente_file() -> ureq::Agent {
    ureq::AgentBuilder::new()
        .timeout_connect(ATTESA_RICHIESTA)
        .timeout_read(ATTESA_FILE)
        .timeout_write(ATTESA_FILE)
        .build()
}

/// PUT su un indirizzo firmato: la firma è l'unico permesso.
fn metti(indirizzo: &str, byte: &[u8]) -> Result<(), Fallita> {
    match agente_file().put(indirizzo).set("Content-Type", "application/octet-stream").send_bytes(byte) {
        Ok(_) => Ok(()),
        Err(ureq::Error::Transport(_)) => Err(Fallita::Rete),
        Err(_) => Err(Fallita::Altro),
    }
}

fn prendi(indirizzo: &str) -> Result<Vec<u8>, Fallita> {
    match agente_file().get(indirizzo).call() {
        Ok(r) => {
            let mut byte = Vec::new();
            r.into_reader()
                .take(LIMITE_BYTE + 1024)
                .read_to_end(&mut byte)
                .map_err(|_| Fallita::Rete)?;
            Ok(byte)
        }
        Err(ureq::Error::Transport(_)) => Err(Fallita::Rete),
        Err(_) => Err(Fallita::Altro),
    }
}

/// Il nome del file arriva nell'intestazione, scritto con encodeURIComponent.
fn decodifica(testo: &str) -> Option<String> {
    let mut byte = Vec::new();
    let mut resto = testo.bytes();
    while let Some(b) = resto.next() {
        if b == b'%' {
            let alto = (resto.next()? as char).to_digit(16)?;
            let basso = (resto.next()? as char).to_digit(16)?;
            byte.push((alto * 16 + basso) as u8);
        } else {
            byte.push(b);
        }
    }
    String::from_utf8(byte).ok()
}

// ——— Comandi ———

type Stato<'a> = State<'a, Dati>;

/// Allega un file dal disco: trascinato, o scelto con la finestra del sistema se `percorso` non
/// c'è (@ › «Allega un file…», RB-114). None se si annulla la finestra.
#[tauri::command]
pub async fn allega_file(app: AppHandle, dati: Stato<'_>, percorso: Option<String>) -> Esito<Option<Allegato>> {
    let percorso = match percorso {
        Some(p) => PathBuf::from(p),
        None => {
            let finestra = app.clone();
            let scelta = tauri::async_runtime::spawn_blocking(move || {
                finestra
                    .dialog()
                    .file()
                    .set_title("Allega un file")
                    .add_filter("Foto e documenti", &ESTENSIONI)
                    .blocking_pick_file()
            })
            .await
            .map_err(|e| Errore::DiscoRifiuta(e.to_string()))?;
            let Some(scelta) = scelta else { return Ok(None) };
            scelta.into_path().map_err(|e| Errore::DiscoRifiuta(e.to_string()))?
        }
    };
    let disco = |e: std::io::Error| Errore::DiscoRifiuta(e.to_string());
    if !percorso.is_file() {
        return Err(Errore::NonValido(AVVISO_TIPO.into()));
    }
    // Un file troppo grande non si legge nemmeno (SF-17).
    let grandezza = std::fs::metadata(&percorso).map_err(disco)?.len();
    if grandezza > LIMITE_BYTE {
        return Err(Errore::TroppoGrande(grandezza));
    }
    let nome = percorso.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let byte = std::fs::read(&percorso).map_err(disco)?;
    let allegato = dati.modifica(&app, |a| a.allega(&nome, &byte))?;
    app.state::<FiloAllegati>().sveglia();
    Ok(Some(allegato))
}

/// Allega i byte di un file incollato: il corpo della richiesta è il file, l'intestazione
/// `memodu-nome` il suo nome.
#[tauri::command]
pub async fn allega_dati(app: AppHandle, dati: Stato<'_>, richiesta: Request<'_>) -> Esito<Allegato> {
    let InvokeBody::Raw(byte) = richiesta.body() else {
        return Err(Errore::NonValido(AVVISO_TIPO.into()));
    };
    let nome = richiesta
        .headers()
        .get("memodu-nome")
        .and_then(|n| n.to_str().ok())
        .and_then(decodifica)
        .ok_or_else(|| Errore::NonValido("Il nome del file non va bene".into()))?;
    let allegato = dati.modifica(&app, |a| a.allega(&nome, byte))?;
    app.state::<FiloAllegati>().sveglia();
    Ok(allegato)
}

/// Nome, tipo, grandezza e anteprima. Una foto non ancora sul computer si scarica e arriva
/// l'evento `allegato-pronto` (RB-118).
#[tauri::command]
pub async fn leggi_allegato(app: AppHandle, dati: Stato<'_>, id: String) -> Esito<InfoAllegato> {
    id_valido(&id)?;
    let info = dati.con(|a| a.leggi_allegato(&id))?;
    if crate::archivio::allegati::e_foto(&info.tipo) && info.anteprima.is_none() {
        app.state::<FiloAllegati>().chiedi_anteprima(&id);
    }
    Ok(info)
}

/// Apre il file con il programma del computer (RB-119).
#[tauri::command]
pub async fn apri_allegato(app: AppHandle, id: String) -> Esito<()> {
    id_valido(&id)?;
    let percorso = file_sul_computer(&app, &id)?;
    app.opener()
        .open_path(percorso.to_string_lossy(), None::<&str>)
        .map_err(|e| Errore::DiscoRifiuta(e.to_string()))
}

/// Esplora file o il Finder, sul file (RB-119).
#[tauri::command]
pub async fn mostra_allegato(app: AppHandle, id: String) -> Esito<()> {
    id_valido(&id)?;
    let percorso = file_sul_computer(&app, &id)?;
    app.opener().reveal_item_in_dir(percorso).map_err(|e| Errore::DiscoRifiuta(e.to_string()))
}

/// Il foglio si chiude: gli allegati che nessuna nota usa più se ne vanno (RB-121).
#[tauri::command]
pub async fn pulisci_allegati(app: AppHandle, dati: Stato<'_>) -> Esito<usize> {
    let tolti = dati.modifica(&app, |a| a.pulisci_allegati())?;
    if tolti > 0 {
        app.state::<FiloAllegati>().sveglia();
    }
    Ok(tolti)
}

#[cfg(test)]
mod prove {
    use super::decodifica;

    #[test]
    fn il_nome_del_file_si_decodifica() {
        assert_eq!(decodifica("Preventivo%20d'autunno%20%C3%A8.pdf").as_deref(), Some("Preventivo d'autunno è.pdf"));
        assert_eq!(decodifica("a%2"), None);
    }
}
