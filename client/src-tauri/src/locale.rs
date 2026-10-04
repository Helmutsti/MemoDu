// Comandi di Locale (RF-17, DEC-118) e osservazione delle cartelle sul disco (RB-84). I dati e le
// regole stanno in `archivio_locale.rs`; qui la finestra di scelta della cartella e l'evento
// `locale-cambiato` per l'interfaccia.

use std::collections::BTreeSet;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;

use notify_debouncer_full::notify::{EventKind, RecommendedWatcher, RecursiveMode};
use notify_debouncer_full::{new_debouncer, DebounceEventResult, Debouncer, RecommendedCache};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_dialog::DialogExt;

use crate::archivio::locale::{
    CartellaLocale, FileLocale, Percorso, Salvato, VoceLocale, SUFFISSO_TEMPORANEO,
};
use crate::archivio::{Errore, Esito};
use crate::comandi::Dati;

/// Tempo in cui gli eventi del disco si raggruppano: la colonna si aggiorna entro 2 s
/// (CA-17.12).
const RAGGRUPPA: Duration = Duration::from_millis(500);

type Stato<'a> = State<'a, Dati>;

/// L'osservatore delle cartelle dell'elenco che ci sono, e quali sta osservando.
#[derive(Default)]
pub struct Osservatore(Mutex<(Option<Debouncer<RecommendedWatcher, RecommendedCache>>, BTreeSet<PathBuf>)>);

#[derive(Clone, Serialize)]
struct Cambiato {
    percorsi: Vec<String>,
}

impl Osservatore {
    /// Osserva le cartelle dell'elenco presenti; non fa niente se sono le stesse di prima.
    pub fn aggiorna(&self, app: &AppHandle) {
        let radici: BTreeSet<PathBuf> =
            app.state::<Dati>().con(|a| a.radici_locali()).unwrap_or_default().into_iter().collect();
        let mut stato = self.0.lock().unwrap_or_else(|e| e.into_inner());
        if stato.0.is_some() && stato.1 == radici {
            return;
        }
        stato.0 = None;
        stato.1 = radici.clone();
        if radici.is_empty() {
            return;
        }
        let app = app.clone();
        let debouncer = new_debouncer(RAGGRUPPA, None, move |esito: DebounceEventResult| {
            let Ok(eventi) = esito else { return };
            let percorsi: BTreeSet<String> = eventi
                .iter()
                .filter(|e| !matches!(e.kind, EventKind::Access(_)))
                .flat_map(|e| e.paths.iter())
                .filter(|p| !p.to_string_lossy().ends_with(SUFFISSO_TEMPORANEO))
                .map(|p| p.display().to_string())
                .collect();
            if !percorsi.is_empty() {
                let _ = app.emit("locale-cambiato", Cambiato { percorsi: percorsi.into_iter().collect() });
            }
        });
        match debouncer {
            Ok(mut d) => {
                for radice in &radici {
                    if let Err(e) = d.watch(radice, RecursiveMode::Recursive) {
                        eprintln!("Non riesco a osservare {}: {e}", radice.display());
                    }
                }
                stato.0 = Some(d);
            }
            Err(e) => eprintln!("Osservazione del disco non disponibile: {e}"),
        }
    }
}

#[tauri::command]
pub async fn cartelle_locali(app: AppHandle, dati: Stato<'_>) -> Esito<Vec<CartellaLocale>> {
    let cartelle = dati.con(|a| a.cartelle_locali())?;
    // Una cartella tornata al suo posto si osserva di nuovo (CA-17.4).
    app.state::<Osservatore>().aggiorna(&app);
    Ok(cartelle)
}

/// Apre la finestra di scelta della cartella del sistema; None se si annulla (FL-10).
#[tauri::command]
pub async fn aggiungi_cartella_locale(app: AppHandle, dati: Stato<'_>) -> Esito<Option<CartellaLocale>> {
    let finestra = app.clone();
    let scelta = tauri::async_runtime::spawn_blocking(move || {
        finestra.dialog().file().set_title("Aggiungi una cartella a Locale").blocking_pick_folder()
    })
    .await
    .map_err(|e| Errore::DiscoRifiuta(e.to_string()))?;
    let Some(scelta) = scelta else { return Ok(None) };
    let percorso = scelta.into_path().map_err(|e| Errore::DiscoRifiuta(e.to_string()))?;
    let cartella = dati.con(|a| a.aggiungi_cartella_locale(&percorso))?;
    app.state::<Osservatore>().aggiorna(&app);
    Ok(Some(cartella))
}

#[tauri::command]
pub async fn togli_cartella_locale(app: AppHandle, dati: Stato<'_>, percorso: String) -> Esito<()> {
    dati.con(|a| a.togli_cartella_locale(&percorso))?;
    app.state::<Osservatore>().aggiorna(&app);
    Ok(())
}

#[tauri::command]
pub async fn elenca_locale(dati: Stato<'_>, percorso: String) -> Esito<Vec<VoceLocale>> {
    dati.con(|a| a.elenca_locale(&percorso))
}

#[tauri::command]
pub async fn apri_file_locale(dati: Stato<'_>, percorso: String) -> Esito<FileLocale> {
    dati.con(|a| a.apri_file_locale(&percorso))
}

#[tauri::command]
pub async fn nuovo_file_locale(dati: Stato<'_>, cartella: String) -> Esito<Percorso> {
    dati.con(|a| a.nuovo_file_locale(&cartella))
}

#[tauri::command]
pub async fn sospendi_file_locale(
    dati: Stato<'_>,
    percorso: String,
    testo: String,
    impronta: Option<String>,
) -> Esito<()> {
    dati.con(|a| a.sospendi_file_locale(&percorso, &testo, impronta.as_deref()))
}

#[tauri::command]
pub async fn salva_file_locale(
    dati: Stato<'_>,
    percorso: String,
    testo: String,
    impronta: Option<String>,
) -> Esito<Salvato> {
    dati.con(|a| a.salva_file_locale(&percorso, &testo, impronta.as_deref()))
}

#[tauri::command]
pub async fn scarta_file_locale(dati: Stato<'_>, percorso: String) -> Esito<()> {
    dati.con(|a| a.scarta_file_locale(&percorso))
}

#[tauri::command]
pub async fn crea_cartella_locale(dati: Stato<'_>, dentro: String, nome: String) -> Esito<Percorso> {
    dati.con(|a| a.crea_cartella_locale(&dentro, &nome))
}

#[tauri::command]
pub async fn rinomina_locale(dati: Stato<'_>, percorso: String, nome: String) -> Esito<Percorso> {
    dati.con(|a| a.rinomina_locale(&percorso, &nome))
}

#[tauri::command]
pub async fn sposta_locale(dati: Stato<'_>, percorso: String, dentro: String) -> Esito<Percorso> {
    dati.con(|a| a.sposta_locale(&percorso, &dentro))
}

#[tauri::command]
pub async fn elimina_locale(dati: Stato<'_>, percorso: String, per_sempre: bool) -> Esito<()> {
    dati.con(|a| a.elimina_locale(&percorso, per_sempre))
}
