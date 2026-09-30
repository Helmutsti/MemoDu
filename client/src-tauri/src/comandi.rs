// Comandi con cui l'interfaccia legge e scrive la copia di lavoro (DEC-67): uno per ogni
// endpoint che prima chiamava sull'API (architettura/api.md), con gli stessi dati e gli
// stessi codici di errore. Finestra principale e note rapide passano tutte da qui, una
// operazione alla volta.

use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager, State};

use crate::sincronizzazione::{Evento, Segnale};
use crate::archivio::{
    cartella_predefinita, Albero, Archivio, DatiDettagli, DatiNota, DatiNuovaNota,
    ElementoCestino, Errore, Esito, EsitoCartella, Nota, Ripristinato, SeEsiste, VoceElenco,
    VoceTag,
};

/// L'archivio aperto; None se all'avvio non si è aperto: si riprova al comando successivo
/// (Riprova di SC-07).
#[derive(Default)]
pub struct Dati(Mutex<Option<Archivio>>);

impl Dati {
    pub fn apri() -> Self {
        let archivio = Archivio::apri(&cartella_predefinita())
            .inspect_err(|e| eprintln!("Copia di lavoro non disponibile: {e:?}"))
            .ok();
        Dati(Mutex::new(archivio))
    }

    pub(crate) fn con<T>(&self, operazione: impl FnOnce(&mut Archivio) -> Esito<T>) -> Esito<T> {
        let mut archivio = self.0.lock().unwrap_or_else(|e| e.into_inner());
        if archivio.is_none() {
            *archivio = Some(Archivio::apri(&cartella_predefinita())?);
        }
        operazione(archivio.as_mut().ok_or_else(|| Errore::NonDisponibile(String::new()))?)
    }

    /// Un'operazione che cambia i dati: dopo, la sincronizzazione parte presto (DEC-80), e i
    /// conflitti nati scrivendo arrivano all'interfaccia (RB-39).
    fn modifica<T>(&self, app: &AppHandle, operazione: impl FnOnce(&mut Archivio) -> Esito<T>) -> Esito<T> {
        let (esito, conflitti) = {
            let esito = self.con(operazione);
            (esito, self.con(|a| Ok(a.prendi_conflitti())).unwrap_or_default())
        };
        app.state::<Segnale>().manda();
        for c in conflitti {
            let _ = app.emit(
                "sincronizzazione",
                Evento::Conflitto { originale: c.originale, copia: c.copia, scrivendo: c.scrivendo },
            );
        }
        esito
    }
}

type Stato<'a> = State<'a, Dati>;

#[tauri::command]
pub async fn elenca_note(dati: Stato<'_>) -> Esito<Vec<VoceElenco>> {
    dati.con(|a| a.elenca())
}

#[tauri::command]
pub async fn leggi_nota(dati: Stato<'_>, id: String) -> Esito<Nota> {
    dati.con(|a| a.leggi(&id))
}

#[tauri::command]
pub async fn crea_nota(app: AppHandle,
    dati: Stato<'_>, nuova: DatiNuovaNota) -> Esito<Nota> {
    dati.modifica(&app, |a| a.crea(&nuova))
}

#[tauri::command]
pub async fn salva_nota(app: AppHandle,
    dati: Stato<'_>, id: String, nota: DatiNota) -> Esito<Nota> {
    dati.modifica(&app, |a| a.salva(&id, &nota))
}

/// Cancella la nota solo se è vuota (DEC-39); con del testo risponde 409.
#[tauri::command]
pub async fn elimina_se_vuota(app: AppHandle,
    dati: Stato<'_>, id: String) -> Esito<()> {
    dati.modifica(&app, |a| a.elimina_se_vuota(&id))
}

#[tauri::command]
pub async fn sposta_nota(app: AppHandle,
    dati: Stato<'_>, id: String, cartella: String) -> Esito<Nota> {
    dati.modifica(&app, |a| a.sposta_nota(&id, &cartella))
}

#[tauri::command]
pub async fn salva_dettagli(app: AppHandle,
    dati: Stato<'_>, id: String, dettagli: DatiDettagli) -> Esito<Nota> {
    dati.modifica(&app, |a| a.salva_dettagli(&id, &dettagli))
}

#[tauri::command]
pub async fn elenca_tag(dati: Stato<'_>) -> Esito<Vec<VoceTag>> {
    dati.con(|a| a.elenca_tag())
}

#[tauri::command]
pub async fn aggiungi_tag(app: AppHandle,
    dati: Stato<'_>, id: String, nome: String) -> Esito<Nota> {
    dati.modifica(&app, |a| a.aggiungi_tag(&id, &nome))
}

#[tauri::command]
pub async fn togli_tag(app: AppHandle,
    dati: Stato<'_>, id: String, nome: String) -> Esito<Nota> {
    dati.modifica(&app, |a| a.togli_tag(&id, &nome))
}

#[tauri::command]
pub async fn elimina_tag(app: AppHandle,
    dati: Stato<'_>, nome: String) -> Esito<()> {
    dati.modifica(&app, |a| a.elimina_tag(&nome))
}

#[tauri::command]
pub async fn albero(dati: Stato<'_>) -> Esito<Albero> {
    dati.con(|a| a.albero())
}

#[tauri::command]
pub async fn crea_cartella(
    app: AppHandle,
    dati: Stato<'_>,
    genitore: String,
    nome: Option<String>,
    se_esiste: Option<SeEsiste>,
) -> Esito<EsitoCartella> {
    dati.modifica(&app, |a| a.crea_cartella(&genitore, nome.as_deref(), se_esiste.unwrap_or_default()))
}

#[tauri::command]
pub async fn rinomina_cartella(
    app: AppHandle,
    dati: Stato<'_>,
    percorso: String,
    nome: String,
    se_esiste: Option<SeEsiste>,
) -> Esito<EsitoCartella> {
    dati.modifica(&app, |a| a.rinomina_cartella(&percorso, &nome, se_esiste.unwrap_or_default()))
}

#[tauri::command]
pub async fn sposta_cartella(
    app: AppHandle,
    dati: Stato<'_>,
    percorso: String,
    destinazione: String,
    se_esiste: Option<SeEsiste>,
    da_unione: Option<bool>,
) -> Esito<EsitoCartella> {
    dati.modifica(&app, |a| {
        a.sposta_cartella(
            &percorso,
            &destinazione,
            se_esiste.unwrap_or_default(),
            da_unione.unwrap_or(false),
        )
    })
}

#[tauri::command]
pub async fn cestina_nota(app: AppHandle,
    dati: Stato<'_>, id: String) -> Esito<ElementoCestino> {
    dati.modifica(&app, |a| a.cestina_nota(&id))
}

#[tauri::command]
pub async fn cestina_cartella(app: AppHandle,
    dati: Stato<'_>, percorso: String) -> Esito<ElementoCestino> {
    dati.modifica(&app, |a| a.cestina_cartella(&percorso))
}

#[tauri::command]
pub async fn elenca_cestino(dati: Stato<'_>) -> Esito<Vec<ElementoCestino>> {
    dati.con(|a| a.elenca_cestino())
}

#[tauri::command]
pub async fn ripristina(
    app: AppHandle,
    dati: Stato<'_>,
    id: String,
    se_esiste: Option<SeEsiste>,
) -> Esito<Ripristinato> {
    dati.modifica(&app, |a| a.ripristina(&id, se_esiste.unwrap_or_default()))
}

#[tauri::command]
pub async fn elimina_definitivamente(app: AppHandle,
    dati: Stato<'_>, id: String) -> Esito<()> {
    dati.modifica(&app, |a| a.elimina_definitivamente(&id))
}

#[tauri::command]
pub async fn svuota_cestino(app: AppHandle,
    dati: Stato<'_>) -> Esito<()> {
    dati.modifica(&app, |a| a.svuota_cestino())
}

/// Riprova della schermata di blocco: rilegge le credenziali e sincronizza subito (RB-57).
#[tauri::command]
pub async fn riprova_sincronizzazione(app: AppHandle) {
    app.state::<Segnale>().manda();
}
