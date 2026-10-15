// Comandi di Brainet (RF-18, architettura/api.md, «Brainet»): l'interfaccia li chiama come gli
// altri comandi della copia di lavoro; nessuna richiesta nuova al server.

use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

use crate::archivio::brainet::{
    Entita, Frammento, GiornoCalendario, Stato as StatoEvidenziatura, StatoBrainet, StatoTolto, Unione, VoceEntita,
};
use crate::archivio::{id_valido, ElementoCestino, Errore, Esito};
use crate::comandi::Dati;

type Stato<'a> = State<'a, Dati>;

/// Note del Database per pagina.
const PAGINA: usize = 50;

#[tauri::command]
pub async fn brainet_stato(dati: Stato<'_>) -> Esito<StatoBrainet> {
    dati.con(|a| a.brainet_stato())
}

#[tauri::command]
pub async fn accendi_brainet(app: AppHandle, dati: Stato<'_>) -> Esito<StatoBrainet> {
    dati.modifica(&app, |a| a.accendi_brainet())
}

#[tauri::command]
pub async fn spegni_brainet(app: AppHandle, dati: Stato<'_>) -> Esito<StatoBrainet> {
    dati.modifica(&app, |a| a.spegni_brainet())
}

#[tauri::command]
pub async fn mostra_database(app: AppHandle, dati: Stato<'_>, si: bool) -> Esito<StatoBrainet> {
    dati.modifica(&app, |a| a.imposta_mostra_database(si))
}

#[tauri::command]
pub async fn crea_frammento(app: AppHandle, dati: Stato<'_>, testo: String) -> Esito<Frammento> {
    dati.modifica(&app, |a| a.crea_frammento(&testo))
}

/// None se il testo era vuoto e il frammento non c'è più (RB-102).
#[tauri::command]
pub async fn salva_frammento(app: AppHandle, dati: Stato<'_>, id: String, testo: String) -> Esito<Option<Frammento>> {
    id_valido(&id)?;
    dati.modifica(&app, |a| a.salva_frammento(&id, &testo))
}

#[tauri::command]
pub async fn leggi_frammento(dati: Stato<'_>, id: String) -> Esito<Frammento> {
    id_valido(&id)?;
    dati.con(|a| a.leggi_frammento(&id))
}

#[tauri::command]
pub async fn elenca_frammenti(dati: Stato<'_>, prima_di: Option<String>) -> Esito<Vec<Frammento>> {
    dati.con(|a| a.elenca_frammenti(prima_di.as_deref(), PAGINA))
}

#[tauri::command]
pub async fn elimina_frammento(app: AppHandle, dati: Stato<'_>, id: String) -> Esito<ElementoCestino> {
    id_valido(&id)?;
    dati.modifica(&app, |a| a.elimina_frammento(&id))
}

#[tauri::command]
pub async fn calendario(dati: Stato<'_>, mese: String) -> Esito<Vec<GiornoCalendario>> {
    dati.con(|a| a.calendario(&mese))
}

#[tauri::command]
pub async fn suggerisci_entita(dati: Stato<'_>, testo: String) -> Esito<Vec<Entita>> {
    dati.con(|a| a.suggerisci_entita(&testo))
}

#[tauri::command]
pub async fn crea_entita(app: AppHandle, dati: Stato<'_>, nome: String) -> Esito<Entita> {
    dati.modifica(&app, |a| a.crea_entita(&nome))
}

#[tauri::command]
pub async fn leggi_entita(dati: Stato<'_>, id: String) -> Esito<Entita> {
    id_valido(&id)?;
    dati.con(|a| a.leggi_entita(&id))
}

#[tauri::command]
pub async fn elenca_entita(dati: Stato<'_>) -> Esito<Vec<VoceEntita>> {
    dati.con(|a| a.elenca_entita())
}

#[tauri::command]
pub async fn anteprima_unione(dati: Stato<'_>, da: String, verso: String) -> Esito<Unione> {
    id_valido(&da)?;
    id_valido(&verso)?;
    dati.con(|a| a.anteprima_unione(&da, &verso))
}

#[tauri::command]
pub async fn unisci_entita(app: AppHandle, dati: Stato<'_>, da: String, verso: String) -> Esito<Unione> {
    id_valido(&da)?;
    id_valido(&verso)?;
    dati.modifica(&app, |a| a.unisci_entita(&da, &verso))
}

/// Apre la finestra del sistema per scegliere un'immagine; None se si annulla (CA-18.13).
#[tauri::command]
pub async fn scegli_foto(app: AppHandle, dati: Stato<'_>, id: String) -> Esito<Option<Entita>> {
    id_valido(&id)?;
    let finestra = app.clone();
    let scelta = tauri::async_runtime::spawn_blocking(move || {
        finestra
            .dialog()
            .file()
            .set_title("Scegli una foto")
            .add_filter("Immagini", &["jpg", "jpeg", "png", "webp", "gif", "bmp"])
            .blocking_pick_file()
    })
    .await
    .map_err(|e| Errore::DiscoRifiuta(e.to_string()))?;
    let Some(scelta) = scelta else { return Ok(None) };
    let percorso = scelta.into_path().map_err(|e| Errore::DiscoRifiuta(e.to_string()))?;
    let byte = std::fs::read(&percorso).map_err(|e| Errore::DiscoRifiuta(e.to_string()))?;
    dati.modifica(&app, |a| a.imposta_foto(&id, Some(&byte))).map(Some)
}

#[tauri::command]
pub async fn elenca_stati(dati: Stato<'_>) -> Esito<Vec<StatoEvidenziatura>> {
    dati.con(|a| a.elenca_stati())
}

#[tauri::command]
pub async fn crea_stato(app: AppHandle, dati: Stato<'_>, nome: String, colore: String) -> Esito<StatoEvidenziatura> {
    dati.modifica(&app, |a| a.crea_stato(&nome, &colore))
}

#[tauri::command]
pub async fn aree_con_stato(dati: Stato<'_>, id: String) -> Esito<usize> {
    id_valido(&id)?;
    dati.con(|a| a.aree_con_stato(&id))
}

#[tauri::command]
pub async fn togli_stato(app: AppHandle, dati: Stato<'_>, id: String, sostituto: Option<String>) -> Esito<StatoTolto> {
    id_valido(&id)?;
    dati.modifica(&app, |a| a.togli_stato(&id, sostituto.as_deref()))
}

#[tauri::command]
pub async fn importa_in_brainet(app: AppHandle, dati: Stato<'_>, nota: String, sposta: bool) -> Esito<Frammento> {
    id_valido(&nota)?;
    dati.modifica(&app, |a| a.importa_in_brainet(&nota, sposta))
}
