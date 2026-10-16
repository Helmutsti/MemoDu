// Comandi di Brainet (RF-18, architettura/api.md, «Brainet»): l'interfaccia li chiama come gli
// altri comandi della copia di lavoro; nessuna richiesta nuova al server.

use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

use crate::archivio::brainet::{
    Entita, GiornoCalendario, PaginaEntita, Stato as StatoEvidenziatura, StatoBrainet, StatoTolto, Unione, VoceEntita,
};
use crate::archivio::{id_valido, Errore, Esito, Nota};
use crate::comandi::Dati;

type Stato<'a> = State<'a, Dati>;

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

/// «Sposta in Brainet»: la nota esce dall'albero e dalla ricerca, senza ritorno (RB-130).
#[tauri::command]
pub async fn sposta_in_brainet(app: AppHandle, dati: Stato<'_>, id: String) -> Esito<Nota> {
    id_valido(&id)?;
    dati.modifica(&app, |a| a.sposta_in_brainet(&id))
}

/// Le note in Brainet, dalla più recente (RB-131).
#[tauri::command]
pub async fn elenca_journal(dati: Stato<'_>) -> Esito<Vec<Nota>> {
    dati.con(|a| a.elenca_journal())
}

/// La pagina dell'entità: i passaggi per giorno (FL-26, RB-124).
#[tauri::command]
pub async fn passaggi_entita(dati: Stato<'_>, id: String) -> Esito<PaginaEntita> {
    id_valido(&id)?;
    dati.con(|a| a.passaggi_entita(&id))
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

#[tauri::command]
pub async fn imposta_tipo(app: AppHandle, dati: Stato<'_>, id: String, tipo: Option<String>) -> Esito<Entita> {
    id_valido(&id)?;
    dati.modifica(&app, |a| a.imposta_tipo(&id, tipo.as_deref()))
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
