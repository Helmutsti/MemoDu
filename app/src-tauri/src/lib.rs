// Nucleo Rust di Memodu. Nel frammento Must A fa solo area di notifica, scorciatoia globale
// e finestre (DEC-30): le note passano dall'API, che l'interfaccia chiama direttamente.
//
// - Scorciatoia globale Ctrl + Alt + N (Control + Option + N su macOS): apre una nota rapida
//   anche con Memodu in background (RF-01, SC-02).
// - Icona nell'area di notifica (Windows) o nella barra dei menu (macOS): apre la nota rapida
//   o il programma (CA-01.6).
// - Note rapide: finestre senza cornice, sempre in primo piano, 480 × 320, a cascata di 32 px
//   sullo schermo del puntatore; arrivata al bordo, la cascata riparte (SF-04).
// - «Esci da Memodu»: ogni finestra salva e risponde; con testo non salvato chiede prima
//   conferma (RB-62). Si esce quando tutte hanno risposto.

use std::collections::HashSet;
use std::sync::Mutex;

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{
    AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, RunEvent, State, WebviewUrl,
    WebviewWindow, WebviewWindowBuilder, WindowEvent,
};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState};

const LARGHEZZA_RAPIDA: f64 = 480.0;
const ALTEZZA_RAPIDA: f64 = 320.0;
const PASSO_CASCATA: f64 = 32.0;
const PREFISSO_RAPIDA: &str = "rapida-";

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

fn scorciatoia_nota_rapida() -> Shortcut {
    Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyN)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(Cascata::default()))
        .manage(Mutex::new(Uscita::default()))
        .invoke_handler(tauri::generate_handler![pronta_a_uscire, uscita_annullata])
        .on_window_event(|finestra, evento| {
            if let WindowEvent::Destroyed = evento {
                finestra_pronta(finestra.app_handle(), finestra.label());
            }
        })
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, scorciatoia, evento| {
                    if evento.state == ShortcutState::Pressed
                        && *scorciatoia == scorciatoia_nota_rapida()
                    {
                        apri_nota_rapida(app);
                    }
                })
                .build(),
        )
        .setup(|app| {
            use tauri_plugin_global_shortcut::GlobalShortcutExt;
            // Se un altro programma usa già la combinazione, la nota rapida resta
            // raggiungibile dall'icona (scorciatoia fissa nel frammento Must A).
            if let Err(errore) = app.global_shortcut().register(scorciatoia_nota_rapida()) {
                eprintln!("Scorciatoia della nota rapida non disponibile: {errore}");
            }

            let nota_rapida =
                MenuItem::with_id(app, "nota-rapida", "Nuova nota rapida", true, None::<&str>)?;
            let programma = MenuItem::with_id(app, "programma", "Apri Memodu", true, None::<&str>)?;
            let esci = MenuItem::with_id(app, "esci", "Esci da Memodu", true, None::<&str>)?;
            let separatore = PredefinedMenuItem::separator(app)?;
            let menu = Menu::with_items(app, &[&nota_rapida, &programma, &separatore, &esci])?;
            TrayIconBuilder::with_id("memodu")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Memodu")
                .menu(&menu)
                .on_menu_event(|app, evento| match evento.id().as_ref() {
                    "nota-rapida" => apri_nota_rapida(app),
                    "programma" => mostra_programma(app),
                    "esci" => richiedi_uscita(app),
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Memodu non è riuscito ad avviarsi")
        .run(|_app, evento| match evento {
            // Memodu resta attivo in background anche senza finestre aperte (RF-01).
            RunEvent::ExitRequested { api, code, .. } if code.is_none() => api.prevent_exit(),
            // macOS: clic sull'icona nel Dock con la finestra nascosta.
            #[cfg(target_os = "macos")]
            RunEvent::Reopen { .. } => mostra_programma(_app),
            _ => {}
        });
}
