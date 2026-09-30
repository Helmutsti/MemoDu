// Sincronizzazione in background (RF-10, DEC-75 … DEC-84). Un filo a parte riceve le modifiche
// dal server e manda le proprie: all'avvio, qualche secondo dopo ogni modifica, ogni 30 s e,
// senza rete, a tentativi sempre più radi fino a 5 minuti (DEC-80). Senza il file `credenziali`
// non fa niente e si lavora in locale (DEC-84). L'interfaccia riceve l'evento
// «sincronizzazione»: note cambiate, conflitti (RB-39), credenziali rifiutate (RB-57), avvisi
// di errore o di server irraggiungibile da più di 24 ore (RB-40, DEC-82, DEC-83).
// I blocchi viaggiano in chiaro finché la cifratura è spenta (DEC-78).

use std::sync::mpsc::{Receiver, RecvTimeoutError, Sender};
use std::sync::Mutex;
use std::time::Duration;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager};

use crate::archivio::sinc::{DaInviare, Ricevuta};
use crate::archivio::{cartella_predefinita, Archivio, Errore};
use crate::comandi::Dati;

/// Versione del protocollo, la stessa del server (DEC-83).
const PROTOCOLLO: &str = "1";
const INTERVALLO: Duration = Duration::from_secs(30);
const DOPO_UNA_MODIFICA: Duration = Duration::from_secs(3);
const PRIMO_RITENTATIVO: Duration = Duration::from_secs(5);
const ULTIMO_RITENTATIVO: Duration = Duration::from_secs(5 * 60);
const SOGLIA_IRRAGGIUNGIBILE_ORE: i64 = 24;
const ATTESA_RICHIESTA: Duration = Duration::from_secs(15);

/// Il segnale che fa partire una sincronizzazione presto: dopo una modifica o con Riprova.
pub struct Segnale(pub Mutex<Sender<()>>);

impl Segnale {
    pub fn manda(&self) {
        let _ = self.0.lock().map(|s| s.send(()));
    }
}

/// Quello che l'interfaccia viene a sapere.
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "tipo", rename_all = "kebab-case")]
pub enum Evento {
    /// Note, cartelle o tag cambiati per modifiche ricevute: si ricarica la colonna e, se tra le
    /// note c'è quella aperta e non ha testo in attesa, la si rilegge.
    NoteCambiate { note: Vec<String> },
    /// Nata una copia in conflitto (RB-39). `scrivendo`: dal testo della nota aperta, che si apre
    /// al posto dell'originale.
    Conflitto { originale: String, copia: String, scrivendo: bool },
    Riuscita,
    CredenzialiRifiutate,
    Irraggiungibile,
    Errore { protocollo: bool },
}

#[derive(Debug, Deserialize)]
struct Credenziali {
    indirizzo: String,
    gettone: String,
}

enum Problema {
    SenzaCredenziali,
    Rete,
    Rifiutate,
    Protocollo,
    Altro,
}

impl From<Errore> for Problema {
    fn from(_: Errore) -> Self {
        Problema::Altro
    }
}

fn credenziali() -> Option<Credenziali> {
    let testo = std::fs::read_to_string(cartella_predefinita().join("credenziali")).ok()?;
    serde_json::from_str(testo.trim()).ok()
}

/// Avvia il filo della sincronizzazione.
pub fn avvia(app: AppHandle, segnali: Receiver<()>) {
    std::thread::spawn(move || ciclo(app, segnali));
}

fn ciclo(app: AppHandle, segnali: Receiver<()>) {
    let mut attesa = Duration::ZERO;
    let mut ritentativo = PRIMO_RITENTATIVO;
    let mut bloccata = false;
    loop {
        match segnali.recv_timeout(attesa) {
            // Dopo una modifica si aspetta qualche secondo: altre modifiche partono insieme.
            Ok(()) => {
                std::thread::sleep(DOPO_UNA_MODIFICA);
                while segnali.try_recv().is_ok() {}
            }
            Err(RecvTimeoutError::Timeout) => {
                // Con le credenziali rifiutate si riprova solo con Riprova (RB-57).
                if bloccata {
                    attesa = ULTIMO_RITENTATIVO;
                    continue;
                }
            }
            Err(RecvTimeoutError::Disconnected) => return,
        }
        match sincronizza(&app) {
            Ok(()) => {
                bloccata = false;
                ritentativo = PRIMO_RITENTATIVO;
                attesa = INTERVALLO;
                let _ = app.emit("sincronizzazione", Evento::Riuscita);
            }
            Err(Problema::SenzaCredenziali) => attesa = INTERVALLO,
            Err(Problema::Rifiutate) => {
                bloccata = true;
                attesa = ULTIMO_RITENTATIVO;
                let _ = app.emit("sincronizzazione", Evento::CredenzialiRifiutate);
            }
            Err(problema) => {
                attesa = ritentativo;
                ritentativo = (ritentativo * 2).min(ULTIMO_RITENTATIVO);
                let evento = match problema {
                    Problema::Rete if irraggiungibile_da_troppo(&app) => Some(Evento::Irraggiungibile),
                    Problema::Rete => None,
                    Problema::Protocollo => Some(Evento::Errore { protocollo: true }),
                    _ => Some(Evento::Errore { protocollo: false }),
                };
                if let Some(evento) = evento {
                    let _ = app.emit("sincronizzazione", evento);
                }
            }
        }
    }
}

/// Esegue un'operazione sull'archivio, aprendolo se serve.
fn con_archivio<T>(app: &AppHandle, f: impl FnOnce(&mut Archivio) -> Result<T, Errore>) -> Result<T, Problema> {
    let dati = app.state::<Dati>();
    Ok(dati.con(f)?)
}

/// Una sincronizzazione completa: prima si riceve, poi si invia (DEC-76).
fn sincronizza(app: &AppHandle) -> Result<(), Problema> {
    let credenziali = credenziali().ok_or(Problema::SenzaCredenziali)?;
    con_archivio(app, |a| {
        if a.stato_sinc("primo_tentativo")?.is_none() {
            a.imposta_stato_sinc("primo_tentativo", &Utc::now().to_rfc3339())?;
        }
        Ok(())
    })?;
    let mut note_cambiate = Vec::new();
    let mut altro = false;

    // Ricevere: le versioni attuali cambiate dopo l'ultimo numero d'ordine visto.
    loop {
        let dopo: i64 = con_archivio(app, |a| a.stato_sinc("ultimo_ordine"))?
            .and_then(|v| v.parse().ok())
            .unwrap_or(0);
        let risposta = richiesta(&credenziali, "GET", &format!("/sincronizzazione/modifiche?dopo={dopo}"), None)?;
        let ricevute: Vec<Ricevuta> = risposta["modifiche"]
            .as_array()
            .map(|m| m.iter().filter_map(ricevuta).collect())
            .unwrap_or_default();
        let ultimo = risposta["ultimo"].as_i64().unwrap_or(dopo);
        let esito = con_archivio(app, |a| {
            let esito = a.ricevi(&ricevute)?;
            a.imposta_stato_sinc("ultimo_ordine", &ultimo.to_string())?;
            Ok(esito)
        })?;
        note_cambiate.extend(esito.note);
        altro |= esito.altro;
        if risposta["altre"] != json!(true) {
            break;
        }
    }

    // Inviare: ogni elemento modificato qui, dalla versione da cui parte. Se sul server è
    // cambiato nel frattempo, si fonde la sua versione e si riprova (al massimo tre giri).
    for _ in 0..3 {
        let blocchi: Vec<DaInviare> = con_archivio(app, |a| a.da_inviare())?;
        if blocchi.is_empty() {
            break;
        }
        let mut superati = Vec::new();
        for blocco in blocchi {
            let corpo = json!({ "base": blocco.versione, "dati": blocco.dati });
            match richiesta(&credenziali, "PUT", &format!("/sincronizzazione/elementi/{}", blocco.id), Some(corpo)) {
                Ok(r) => {
                    let versione = r["versione"].as_i64().unwrap_or(blocco.versione + 1);
                    con_archivio(app, |a| a.inviato(&blocco, versione))?;
                }
                Err(Superata(attuale)) => superati.extend(ricevuta(&attuale)),
                Err(Richiesta(problema)) => return Err(problema),
            }
        }
        if superati.is_empty() {
            break;
        }
        let esito = con_archivio(app, |a| a.ricevi(&superati))?;
        note_cambiate.extend(esito.note);
        altro |= esito.altro;
    }

    let conflitti = con_archivio(app, |a| {
        a.imposta_stato_sinc("ultima_riuscita", &Utc::now().to_rfc3339())?;
        Ok(a.prendi_conflitti())
    })?;
    if !note_cambiate.is_empty() || altro || !conflitti.is_empty() {
        let _ = app.emit("sincronizzazione", Evento::NoteCambiate { note: note_cambiate });
    }
    for c in conflitti {
        let _ = app.emit(
            "sincronizzazione",
            Evento::Conflitto { originale: c.originale, copia: c.copia, scrivendo: c.scrivendo },
        );
    }
    Ok(())
}

fn ricevuta(v: &Value) -> Option<Ricevuta> {
    Some(Ricevuta {
        id: v["id"].as_str()?.to_string(),
        versione: v["versione"].as_i64()?,
        dati: v["dati"].as_str()?.to_string(),
    })
}

/// Server irraggiungibile da più di 24 ore dall'ultima sincronizzazione riuscita o, se non ce
/// n'è mai stata una, dal primo tentativo (RB-40, DEC-82).
fn irraggiungibile_da_troppo(app: &AppHandle) -> bool {
    let ultima = con_archivio(app, |a| {
        Ok(a.stato_sinc("ultima_riuscita")?.or(a.stato_sinc("primo_tentativo")?))
    })
    .ok()
    .flatten();
    ultima
        .and_then(|u| DateTime::parse_from_rfc3339(&u).ok())
        .is_some_and(|u| Utc::now().signed_duration_since(u).num_hours() >= SOGLIA_IRRAGGIUNGIBILE_ORE)
}

enum Fallita {
    /// 409: la versione di partenza è superata; il server manda quella attuale.
    Superata(Value),
    Richiesta(Problema),
}
use Fallita::{Richiesta, Superata};

impl From<Fallita> for Problema {
    fn from(f: Fallita) -> Self {
        match f {
            Richiesta(p) => p,
            Superata(_) => Problema::Altro,
        }
    }
}

fn richiesta(c: &Credenziali, metodo: &str, percorso: &str, corpo: Option<Value>) -> Result<Value, Fallita> {
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
        Ok(ok) => ok.into_json::<Value>().map_err(|_| Richiesta(Problema::Altro)),
        Err(ureq::Error::Status(409, r)) => {
            let v: Value = r.into_json().unwrap_or(Value::Null);
            Err(Superata(v["attuale"].clone()))
        }
        Err(ureq::Error::Status(401, _)) => Err(Richiesta(Problema::Rifiutate)),
        Err(ureq::Error::Status(426, _)) => Err(Richiesta(Problema::Protocollo)),
        Err(ureq::Error::Status(_, _)) => Err(Richiesta(Problema::Altro)),
        Err(ureq::Error::Transport(_)) => Err(Richiesta(Problema::Rete)),
    }
}
