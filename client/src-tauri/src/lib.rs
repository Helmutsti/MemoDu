// Nucleo Rust di Memodu: area di notifica, scorciatoia globale, finestre e la copia di lavoro
// delle note sul dispositivo (DEC-67), che l'interfaccia legge e scrive con i comandi di
// `comandi.rs`. Il client funziona anche senza l'API.
//
// - Scorciatoia globale, di default Ctrl + Alt + N (Control + Option + N su macOS), che si
//   cambia dalle impostazioni: apre una nota rapida anche con Memodu in background (RF-01,
//   SC-02, DEC-91).
// - Avviato all'accensione (DEC-91) parte in background, senza mostrare la finestra principale.
// - Icona nell'area di notifica (Windows) o nella barra dei menu (macOS): apre la nota rapida
//   o il programma (CA-01.6); su Windows il clic sinistro apre il programma, il destro il menu.
// - Note rapide: finestre senza cornice, sempre in primo piano, 480 × 320, a cascata di 32 px
//   sullo schermo del puntatore; arrivata al bordo, la cascata riparte (SF-04).
// - «Esci da Memodu»: ogni finestra salva e risponde; con testo non salvato chiede prima
//   conferma (RB-62). Si esce quando tutte hanno risposto.

mod accesso;
mod archivio;
mod cifratura;
mod comandi;
mod impostazioni;
mod locale;
mod sincronizzazione;

#[cfg(target_os = "macos")]
mod icone_macos;

use std::collections::HashSet;
use std::sync::Mutex;

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::image::Image;
use tauri::{
    AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, RunEvent, State, WebviewUrl,
    WebviewWindow, WebviewWindowBuilder, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_global_shortcut::ShortcutState;

const LARGHEZZA_RAPIDA: f64 = 480.0;
const ALTEZZA_RAPIDA: f64 = 320.0;
const PASSO_CASCATA: f64 = 32.0;
const PREFISSO_RAPIDA: &str = "rapida-";

/// Icona dell'area di notifica: nera per le barre chiare, bianca per le scure (DEC-73).
const ICONA_TEMA_CHIARO: &[u8] = include_bytes!("../icons/area-di-notifica/tema-chiaro.png");
const ICONA_TEMA_SCURO: &[u8] = include_bytes!("../icons/area-di-notifica/tema-scuro.png");

/// L'icona nel colore della barra delle applicazioni. Su macOS è un modello: il sistema la
/// colora da solo come le altre icone della barra dei menu.
fn icona_area_di_notifica() -> Image<'static> {
    let byte = if barra_chiara() { ICONA_TEMA_CHIARO } else { ICONA_TEMA_SCURO };
    Image::from_bytes(byte).expect("icona dell'area di notifica non valida")
}

/// Icona delle finestre (barra delle applicazioni, Alt + Tab): come quella dell'area di
/// notifica, nera sulle barre chiare e chiara sulle scure (DEC-103). Le icone fisse del file
/// (programma chiuso, menu Start) non seguono il tema: sono quelle chiare.
const FINESTRA_TEMA_CHIARO: &[u8] = include_bytes!("../icons/finestra/tema-chiaro.png");
const FINESTRA_TEMA_SCURO: &[u8] = include_bytes!("../icons/finestra/tema-scuro.png");

fn icona_finestra() -> Image<'static> {
    let byte = if barra_chiara() { FINESTRA_TEMA_CHIARO } else { FINESTRA_TEMA_SCURO };
    Image::from_bytes(byte).expect("icona della finestra non valida")
}

/// Le icone nel colore della barra: area di notifica e finestre aperte. Su macOS le finestre
/// non hanno un'icona propria.
fn aggiorna_icone(app: &AppHandle) {
    if let Some(icona) = app.tray_by_id("memodu") {
        #[cfg(target_os = "macos")]
        let risultato = icona.set_icon_with_as_template(Some(icona_area_di_notifica()), true);
        #[cfg(not(target_os = "macos"))]
        let risultato = icona.set_icon(Some(icona_area_di_notifica()));
        if let Err(errore) = risultato {
            eprintln!("Aggiornamento icona dell'area di notifica non riuscito: {errore}");
        }
    }
    if cfg!(windows) {
        for finestra in app.webview_windows().values() {
            let _ = finestra.set_icon(icona_finestra());
        }
    }
    #[cfg(target_os = "macos")]
    if let Some(finestra) = app.get_webview_window("main") {
        if let Ok(tema) = finestra.theme() {
            icone_macos::aggiorna_dock(tema);
        }
    }
}

/// Su Windows il colore della barra segue «Scegli la modalità di Windows», che è diverso da
/// quello delle app; senza l'impostazione vale quello predefinito di Windows 11, scuro.
#[cfg(windows)]
fn barra_chiara() -> bool {
    use winreg::{enums::HKEY_CURRENT_USER, RegKey};
    RegKey::predef(HKEY_CURRENT_USER)
        .open_subkey(r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize")
        .and_then(|chiave| chiave.get_value::<u32, _>("SystemUsesLightTheme"))
        .map(|valore| valore != 0)
        .unwrap_or(false)
}

#[cfg(not(windows))]
fn barra_chiara() -> bool {
    true
}

/// Dove è comparsa l'ultima nota rapida, per la cascata.
#[derive(Default)]
struct Cascata {
    ultima: Option<PhysicalPosition<i32>>,
    contatore: u32,
}

/// Posizione della prossima nota rapida: al centro dello schermo del puntatore, oppure 32 px
/// a destra e in basso dall'ultima; se esce dallo schermo, riparte dal centro.
/// Restituisce la posizione in pixel logici, come la vuole il costruttore della finestra.
fn prossima_posizione(app: &AppHandle, cascata: &mut Cascata) -> Option<(f64, f64)> {
    let puntatore = app.cursor_position().ok();
    let schermo = puntatore
        .and_then(|p| app.monitor_from_point(p.x, p.y).ok().flatten())
        .or_else(|| app.primary_monitor().ok().flatten())?;
    let scala = schermo.scale_factor();
    let dim = PhysicalSize::new(
        (LARGHEZZA_RAPIDA * scala) as i32,
        (ALTEZZA_RAPIDA * scala) as i32,
    );
    let origine = *schermo.position();
    let area = *schermo.size();
    let centro = PhysicalPosition::new(
        origine.x + (area.width as i32 - dim.width) / 2,
        origine.y + (area.height as i32 - dim.height) / 2,
    );
    let rapide_aperte = app
        .webview_windows()
        .keys()
        .any(|l| l.starts_with(PREFISSO_RAPIDA));
    let passo = (PASSO_CASCATA * scala) as i32;
    let dentro = |p: PhysicalPosition<i32>| {
        p.x >= origine.x
            && p.y >= origine.y
            && p.x + dim.width <= origine.x + area.width as i32
            && p.y + dim.height <= origine.y + area.height as i32
    };
    let posizione = match cascata.ultima {
        Some(u) if rapide_aperte => {
            let dopo = PhysicalPosition::new(u.x + passo, u.y + passo);
            if dentro(dopo) {
                dopo
            } else {
                centro
            }
        }
        _ => centro,
    };
    cascata.ultima = Some(posizione);
    Some((posizione.x as f64 / scala, posizione.y as f64 / scala))
}

/// Apre una nuova nota rapida. Quelle già aperte perdono il focus: si salvano e restano aperte
/// (RB-04, DEC-53).
fn apri_nota_rapida(app: &AppHandle) {
    let stato = app.state::<Mutex<Cascata>>();
    let mut cascata = stato.lock().unwrap();
    cascata.contatore += 1;
    let etichetta = format!("{PREFISSO_RAPIDA}{}", cascata.contatore);
    let posizione = prossima_posizione(app, &mut cascata);
    drop(cascata);

    let mut finestra = WebviewWindowBuilder::new(
        app,
        &etichetta,
        WebviewUrl::App("index.html?rapida".into()),
    )
    .title("Nota rapida")
    .inner_size(LARGHEZZA_RAPIDA, ALTEZZA_RAPIDA)
    .decorations(false)
    .shadow(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .resizable(true)
    // Come la finestra principale (dragDropEnabled: false): il trascinamento di testo arriva
    // all'editor invece che al gestore dei file di Tauri.
    .disable_drag_drop_handler()
    .focused(true);
    if let Some((x, y)) = posizione {
        finestra = finestra.position(x, y);
    }
    if let Ok(creata) = finestra.build() {
        if cfg!(windows) {
            let _ = creata.set_icon(icona_finestra());
        }
        let _ = creata.set_focus();
    }
}

/// Mostra la finestra del programma completo.
fn mostra_programma(app: &AppHandle) {
    if let Some(finestra) = app.get_webview_window("main") {
        let _ = finestra.unminimize();
        let _ = finestra.show();
        let _ = finestra.set_focus();
    }
}

/// Finestre che devono ancora rispondere a «Esci da Memodu»; None se non si sta uscendo.
#[derive(Default)]
struct Uscita {
    attese: Option<HashSet<String>>,
}

/// «Esci da Memodu»: le finestre ricevono "esci-richiesto", salvano e rispondono con
/// `pronta_a_uscire`; con testo non salvato mostrano prima la conferma (RB-62).
fn richiedi_uscita(app: &AppHandle) {
    let finestre: HashSet<String> = app.webview_windows().keys().cloned().collect();
    if finestre.is_empty() {
        app.exit(0);
        return;
    }
    app.state::<Mutex<Uscita>>().lock().unwrap().attese = Some(finestre);
    let _ = app.emit("esci-richiesto", ());
}

/// Una finestra ha risposto (o è stata chiusa): quando mancano zero finestre, si esce.
fn finestra_pronta(app: &AppHandle, etichetta: &str) {
    let stato = app.state::<Mutex<Uscita>>();
    let mut uscita = stato.lock().unwrap();
    if let Some(attese) = uscita.attese.as_mut() {
        attese.remove(etichetta);
        if attese.is_empty() {
            uscita.attese = None;
            drop(uscita);
            app.exit(0);
        }
    }
}

#[tauri::command]
fn pronta_a_uscire(app: AppHandle, window: WebviewWindow) {
    finestra_pronta(&app, window.label());
}

/// Annulla nella conferma: Memodu resta aperto.
#[tauri::command]
fn uscita_annullata(stato: State<Mutex<Uscita>>) {
    stato.lock().unwrap().attese = None;
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // La sincronizzazione aspetta i segnali in un filo a parte (DEC-80).
    let (segnale, segnali) = std::sync::mpsc::channel();
    let mut segnali = Some(segnali);
    tauri::Builder::default()
        .manage(Mutex::new(Cascata::default()))
        .manage(Mutex::new(Uscita::default()))
        .manage(comandi::Dati::apri())
        .manage(sincronizzazione::Segnale(Mutex::new(segnale)))
        .manage(impostazioni::ScorciatoiaAttiva::default())
        .manage(impostazioni::ProblemaSinc::default())
        .manage(accesso::Accesso::new())
        .manage(locale::Osservatore::default())
        .invoke_handler(tauri::generate_handler![
            pronta_a_uscire,
            uscita_annullata,
            comandi::elenca_note,
            comandi::leggi_nota,
            comandi::crea_nota,
            comandi::salva_nota,
            comandi::elimina_se_vuota,
            comandi::sposta_nota,
            comandi::salva_dettagli,
            comandi::cambia_vista,
            comandi::elenca_tag,
            comandi::aggiungi_tag,
            comandi::togli_tag,
            comandi::elimina_tag,
            comandi::albero,
            comandi::cerca,
            comandi::crea_cartella,
            comandi::rinomina_cartella,
            comandi::sposta_cartella,
            comandi::cestina_nota,
            comandi::cestina_cartella,
            comandi::elenca_cestino,
            comandi::ripristina,
            comandi::elimina_definitivamente,
            comandi::svuota_cestino,
            comandi::riprova_sincronizzazione,
            accesso::stato_accesso,
            accesso::accedi,
            accesso::esci,
            impostazioni::leggi_impostazioni,
            impostazioni::cambia_scorciatoia,
            impostazioni::cambia_tema,
            impostazioni::cambia_avvio,
            impostazioni::cambia_primo_piano,
            impostazioni::cambia_cestino_in_ricerca,
            impostazioni::cambia_nome_dispositivo,
            impostazioni::stato_sincronizzazione,
            locale::cartelle_locali,
            locale::aggiungi_cartella_locale,
            locale::aggiungi_percorsi_locali,
            locale::togli_cartella_locale,
            locale::elenca_locale,
            locale::apri_file_locale,
            locale::nuovo_file_locale,
            locale::sospendi_file_locale,
            locale::salva_file_locale,
            locale::scarta_file_locale,
            locale::crea_cartella_locale,
            locale::rinomina_locale,
            locale::sposta_locale,
            locale::elimina_locale,
        ])
        .on_window_event(|finestra, evento| {
            match evento {
                WindowEvent::Destroyed => finestra_pronta(finestra.app_handle(), finestra.label()),
                // Cambiato il tema di Windows: le icone prendono il colore della barra (DEC-73,
                // DEC-103).
                WindowEvent::ThemeChanged(_) => aggiorna_icone(finestra.app_handle()),
                _ => {}
            }
        })
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, scorciatoia, evento| {
                    if evento.state == ShortcutState::Pressed
                        && app.state::<impostazioni::ScorciatoiaAttiva>().e(scorciatoia)
                    {
                        apri_nota_rapida(app);
                    }
                })
                .build(),
        )
        // Finestra di scelta della cartella di Locale (DEC-118), chiamata solo dal nucleo.
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![impostazioni::IN_BACKGROUND]),
        ))
        .setup(move |app| {
            impostazioni::applica_scorciatoia(app.handle());
            impostazioni::applica_tema(app.handle());
            impostazioni::applica_primo_piano(app.handle());
            // Le cartelle di Locale si osservano da subito (RB-84).
            app.state::<locale::Osservatore>().aggiorna(app.handle());
            // La finestra principale parte nascosta: si mostra, tranne quando il sistema avvia
            // Memodu all'accensione (DEC-91).
            if !std::env::args().any(|a| a == impostazioni::IN_BACKGROUND) {
                mostra_programma(app.handle());
            }

            let nota_rapida =
                MenuItem::with_id(app, "nota-rapida", "Nuova nota rapida", true, None::<&str>)?;
            let programma = MenuItem::with_id(app, "programma", "Apri Memodu", true, None::<&str>)?;
            let esci = MenuItem::with_id(app, "esci", "Esci da Memodu", true, None::<&str>)?;
            let separatore = PredefinedMenuItem::separator(app)?;
            let menu = Menu::with_items(app, &[&nota_rapida, &programma, &separatore, &esci])?;
            if let Some(segnali) = segnali.take() {
                sincronizzazione::avvia(app.handle().clone(), segnali);
            }
            TrayIconBuilder::with_id("memodu")
                .icon(icona_area_di_notifica())
                .icon_as_template(cfg!(target_os = "macos"))
                .tooltip("Memodu")
                .menu(&menu)
                // Su Windows il clic sinistro apre Memodu e il menu compare solo con il destro
                // (DEC-72); su macOS il menu resta sul clic, come nella barra dei menu.
                .show_menu_on_left_click(cfg!(target_os = "macos"))
                .on_tray_icon_event(|icona, evento| {
                    if cfg!(target_os = "macos") {
                        return;
                    }
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = evento
                    {
                        mostra_programma(icona.app_handle());
                    }
                })
                .on_menu_event(|app, evento| match evento.id().as_ref() {
                    "nota-rapida" => apri_nota_rapida(app),
                    "programma" => mostra_programma(app),
                    "esci" => richiedi_uscita(app),
                    _ => {}
                })
                .build(app)?;
            aggiorna_icone(app.handle());
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Memodu non è riuscito ad avviarsi")
        .run(|_app, evento| match evento {
            // Tauri assegna l'icona del Dock in Ready durante lo sviluppo: applicare
            // dopo di lui la variante della M corrispondente al tema (DEC-108).
            #[cfg(target_os = "macos")]
            RunEvent::Ready => aggiorna_icone(_app),
            // Memodu resta attivo in background anche senza finestre aperte (RF-01).
            RunEvent::ExitRequested { api, code, .. } if code.is_none() => api.prevent_exit(),
            // macOS: clic sull'icona nel Dock con la finestra nascosta.
            #[cfg(target_os = "macos")]
            RunEvent::Reopen { .. } => mostra_programma(_app),
            _ => {}
        });
}
