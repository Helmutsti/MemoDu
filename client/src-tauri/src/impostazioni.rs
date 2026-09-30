// SC-06 Impostazioni (DEC-91): i comandi della pagina e quello che il nucleo applica.
// - Scorciatoia della nota rapida: si registra nel sistema prima di salvarla; se un altro
//   programma la usa già resta quella di prima. È separata per Windows e macOS e si sincronizza
//   (RB-52): quella arrivata da un altro dispositivo si registra dopo la sincronizzazione.
// - Avvio all'accensione: lo tiene il sistema (plugin autostart), solo su questo dispositivo.
//   Avviato così, Memodu parte in background, senza la finestra principale.
// - Tema: Sistema, Chiaro o Scuro, solo su questo dispositivo; vale per tutte le finestre.
// - In primo piano: la finestra principale resta sopra gli altri programmi, solo su questo
//   dispositivo (DEC-93; la posizione nella pagina è da rivedere).
// - Nome del dispositivo: di default il nome del computer (RB-51).
// - Stato della sincronizzazione, in sola lettura.

use std::str::FromStr;
use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State, Theme};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Modifiers, Shortcut};

use crate::archivio::impostazioni::Sistema;
use crate::archivio::{cartella_predefinita, Errore, Esito};
use crate::comandi::Dati;

/// Ctrl + Alt + N su Windows, Control + Option + N su macOS (SC-02).
pub const SCORCIATOIA_PREDEFINITA: &str = "Control+Alt+KeyN";
/// Argomento con cui il sistema avvia Memodu all'accensione.
pub const IN_BACKGROUND: &str = "--in-background";
const CHIAVE_TEMA: &str = "tema";
const CHIAVE_NOME: &str = "nome";
const CHIAVE_PRIMO_PIANO: &str = "primo_piano";
const LUNGHEZZA_MASSIMA_NOME: usize = 100;

/// La scorciatoia registrata ora nel sistema.
#[derive(Default)]
pub struct ScorciatoiaAttiva(pub Mutex<Option<Shortcut>>);

impl ScorciatoiaAttiva {
    pub fn e(&self, scorciatoia: &Shortcut) -> bool {
        self.0.lock().unwrap().as_ref() == Some(scorciatoia)
    }
}

/// Com'è andata l'ultima sincronizzazione: None se è riuscita o non è ancora partita.
#[derive(Default)]
pub struct ProblemaSinc(pub Mutex<Option<&'static str>>);

impl ProblemaSinc {
    /// Aggiorna lo stato; se cambia, la pagina delle impostazioni lo rilegge.
    pub fn imposta(&self, app: &AppHandle, problema: Option<&'static str>) {
        let mut attuale = self.0.lock().unwrap();
        if *attuale != problema {
            *attuale = problema;
            let _ = app.emit("stato-sincronizzazione", ());
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Impostazioni {
    /// "windows" o "macos": la scorciatoia mostrata è quella di questo sistema.
    sistema: &'static str,
    /// Nel formato del nucleo, per esempio "Control+Alt+KeyN".
    scorciatoia: String,
    scorciatoia_predefinita: bool,
    /// "sistema", "chiaro" o "scuro".
    tema: String,
    avvio_automatico: bool,
    in_primo_piano: bool,
    nome_dispositivo: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StatoSincronizzazione {
    /// C'è il file delle credenziali: senza, si lavora solo in locale (DEC-84).
    collegata: bool,
    ultima_riuscita: Option<String>,
    /// "rete", "rifiutate", "protocollo" o "errore".
    problema: Option<&'static str>,
}

fn scorciatoia_salvata(dati: &Dati) -> Option<String> {
    dati.con(|a| a.scorciatoia(Sistema::attuale())).ok().flatten()
}

fn nome_del_computer() -> String {
    gethostname::gethostname().to_string_lossy().into_owned()
}

/// Almeno due tasti tra Ctrl, Alt, Maiusc e Win (⌘), così la combinazione non copre quelle dei
/// programmi (Ctrl + C) e resta una sola di tasto normale.
fn valida(testo: &str) -> Esito<Shortcut> {
    let scorciatoia = Shortcut::from_str(testo)
        .map_err(|_| Errore::ScorciatoiaNonValida(format!("Combinazione non valida: {testo}")))?;
    let modificatori = [Modifiers::CONTROL, Modifiers::ALT, Modifiers::SHIFT, Modifiers::SUPER]
        .iter()
        .filter(|m| scorciatoia.mods.contains(**m))
        .count();
    if modificatori < 2 {
        return Err(Errore::ScorciatoiaNonValida("Servono almeno due tasti tra Ctrl, Alt, Maiusc e Win".into()));
    }
    Ok(scorciatoia)
}

/// Registra `nuova` al posto della scorciatoia attiva. Se il sistema la rifiuta, resta quella
/// di prima.
fn registra(app: &AppHandle, nuova: Shortcut) -> Esito<()> {
    let stato = app.state::<ScorciatoiaAttiva>();
    let mut attiva = stato.0.lock().unwrap();
    if attiva.as_ref() == Some(&nuova) {
        return Ok(());
    }
    let sistema = app.global_shortcut();
    sistema.register(nuova).map_err(|_| Errore::ScorciatoiaOccupata)?;
    if let Some(vecchia) = attiva.replace(nuova) {
        let _ = sistema.unregister(vecchia);
    }
    Ok(())
}

/// All'avvio e dopo ogni sincronizzazione: registra la scorciatoia salvata, se è cambiata.
/// Se un altro programma la usa già, la nota rapida resta raggiungibile dall'icona.
pub fn applica_scorciatoia(app: &AppHandle) {
    let testo = scorciatoia_salvata(&app.state::<Dati>()).unwrap_or_else(|| SCORCIATOIA_PREDEFINITA.into());
    let scorciatoia = valida(&testo).or_else(|_| valida(SCORCIATOIA_PREDEFINITA));
    if let Ok(scorciatoia) = scorciatoia {
        if registra(app, scorciatoia).is_err() {
            eprintln!("Scorciatoia della nota rapida non disponibile: {testo}");
        }
    }
}

fn tema_salvato(dati: &Dati) -> String {
    dati.con(|a| a.valore_dispositivo(CHIAVE_TEMA)).ok().flatten().unwrap_or_else(|| "sistema".into())
}

/// Applica il tema salvato a tutte le finestre, anche a quelle che si apriranno.
pub fn applica_tema(app: &AppHandle) {
    let tema = match tema_salvato(&app.state::<Dati>()).as_str() {
        "chiaro" => Some(Theme::Light),
        "scuro" => Some(Theme::Dark),
        _ => None,
    };
    app.set_theme(tema);
}

fn primo_piano_salvato(dati: &Dati) -> bool {
    dati.con(|a| a.valore_dispositivo(CHIAVE_PRIMO_PIANO)).ok().flatten().is_some()
}

/// All'avvio: la finestra principale in primo piano, se scelto (DEC-93).
pub fn applica_primo_piano(app: &AppHandle) {
    if let Some(finestra) = app.get_webview_window("main") {
        let _ = finestra.set_always_on_top(primo_piano_salvato(&app.state::<Dati>()));
    }
}

#[tauri::command]
pub async fn leggi_impostazioni(app: AppHandle, dati: State<'_, Dati>) -> Esito<Impostazioni> {
    let scelta = scorciatoia_salvata(&dati);
    let nome = dati.con(|a| a.valore_dispositivo(CHIAVE_NOME))?;
    Ok(Impostazioni {
        sistema: if Sistema::attuale() == Sistema::Macos { "macos" } else { "windows" },
        scorciatoia_predefinita: scelta.is_none(),
        scorciatoia: scelta.unwrap_or_else(|| SCORCIATOIA_PREDEFINITA.into()),
        tema: tema_salvato(&dati),
        avvio_automatico: app.autolaunch().is_enabled().unwrap_or(false),
        in_primo_piano: primo_piano_salvato(&dati),
        nome_dispositivo: nome.unwrap_or_else(nome_del_computer),
    })
}

/// Cambia la scorciatoia della nota rapida; None torna a quella di default («Ripristina»).
#[tauri::command]
pub async fn cambia_scorciatoia(app: AppHandle, dati: State<'_, Dati>, combinazione: Option<String>) -> Esito<()> {
    let testo = combinazione.unwrap_or_else(|| SCORCIATOIA_PREDEFINITA.into());
    registra(&app, valida(&testo)?)?;
    let valore = (testo != SCORCIATOIA_PREDEFINITA).then_some(testo.as_str());
    dati.con(|a| a.imposta_scorciatoia(Sistema::attuale(), valore))?;
    app.state::<crate::sincronizzazione::Segnale>().manda();
    Ok(())
}

#[tauri::command]
pub async fn cambia_tema(app: AppHandle, dati: State<'_, Dati>, tema: String) -> Esito<()> {
    if !["sistema", "chiaro", "scuro"].contains(&tema.as_str()) {
        return Err(Errore::PercorsoNonValido(format!("Tema non valido: {tema}")));
    }
    let valore = (tema != "sistema").then_some(tema.as_str());
    dati.con(|a| a.imposta_valore_dispositivo(CHIAVE_TEMA, valore))?;
    applica_tema(&app);
    Ok(())
}

#[tauri::command]
pub async fn cambia_avvio(app: AppHandle, attivo: bool) -> Esito<()> {
    let avvio = app.autolaunch();
    let esito = if attivo { avvio.enable() } else { avvio.disable() };
    esito.map_err(|e| Errore::NonDisponibile(format!("Avvio all'accensione non disponibile: {e}")))
}

/// «Tieni Memodu in primo piano» (DEC-93): vale subito per la finestra principale.
#[tauri::command]
pub async fn cambia_primo_piano(app: AppHandle, dati: State<'_, Dati>, attivo: bool) -> Esito<()> {
    dati.con(|a| a.imposta_valore_dispositivo(CHIAVE_PRIMO_PIANO, attivo.then_some("1")))?;
    applica_primo_piano(&app);
    Ok(())
}

/// Il nome di questo dispositivo; vuoto torna il nome del computer (RB-51).
#[tauri::command]
pub async fn cambia_nome_dispositivo(dati: State<'_, Dati>, nome: String) -> Esito<String> {
    let nome: String = nome.trim().chars().take(LUNGHEZZA_MASSIMA_NOME).collect();
    let valore = (!nome.is_empty() && nome != nome_del_computer()).then_some(nome.as_str());
    dati.con(|a| a.imposta_valore_dispositivo(CHIAVE_NOME, valore))?;
    Ok(valore.map(str::to_string).unwrap_or_else(nome_del_computer))
}

#[tauri::command]
pub async fn stato_sincronizzazione(
    dati: State<'_, Dati>,
    problema: State<'_, ProblemaSinc>,
) -> Esito<StatoSincronizzazione> {
    Ok(StatoSincronizzazione {
        collegata: cartella_predefinita().join("credenziali").exists(),
        ultima_riuscita: dati.con(|a| a.stato_sinc("ultima_riuscita"))?,
        problema: *problema.0.lock().unwrap(),
    })
}
