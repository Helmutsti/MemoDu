// Sincronizzazione in background (RF-10, DEC-75 … DEC-84). Un filo a parte riceve le modifiche
// dal server e manda le proprie: all'avvio, qualche secondo dopo ogni modifica, ogni 30 s e,
// senza rete, a tentativi sempre più radi fino a 5 minuti (DEC-80). Senza accesso non fa niente
// e si lavora in locale (RB-87). L'interfaccia riceve l'evento «sincronizzazione»: note
// cambiate, conflitti (RB-39), accesso scaduto o rifiutato (RB-87), avvisi di errore o di
// server irraggiungibile da più di un'ora (RB-40, DEC-112, DEC-83).
// I blocchi viaggiano cifrati con la chiave dati (DEC-121): la copia di lavoro e le basi della
// fusione restano in chiaro, la busta si chiude inviando e si apre ricevendo. Al primo accesso
// cifrato si rimanda tutto, e il server cancella le versioni in chiaro (DEC-78, condizione 3).

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{Receiver, RecvTimeoutError, Sender};
use std::sync::Mutex;
use std::time::Duration;

use chrono::{DateTime, Utc};
use serde::Serialize;
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager};

use crate::accesso::{gettone_valido, indirizzo, Accesso, PROTOCOLLO};
use crate::archivio::sinc::{DaInviare, Ricevuta};
use crate::archivio::{Archivio, Errore};
use crate::cifratura::{apri_blocco, chiudi_blocco, Chiave};
use crate::comandi::Dati;
use crate::impostazioni::{applica_scorciatoia, ProblemaSinc};

/// Una sincronizzazione alla volta: quella del filo e quella di «Esci».
static IN_CORSO: Mutex<()> = Mutex::new(());
/// Gettone scaduto o rifiutato: si aspetta un nuovo accesso (RB-87).
static SCADUTO: AtomicBool = AtomicBool::new(false);
const INTERVALLO: Duration = Duration::from_secs(30);
const DOPO_UNA_MODIFICA: Duration = Duration::from_secs(3);
const PRIMO_RITENTATIVO: Duration = Duration::from_secs(5);
const ULTIMO_RITENTATIVO: Duration = Duration::from_secs(5 * 60);
const SOGLIA_IRRAGGIUNGIBILE_ORE: i64 = 1;
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
    /// Gettone scaduto o rifiutato: le modifiche aspettano e l'avviso porta a SC-05 (RB-87).
    AccessoScaduto,
    Irraggiungibile,
    Errore { protocollo: bool },
}

/// Gettone e chiave dati di questa sincronizzazione.
struct Credenziali {
    indirizzo: String,
    gettone: String,
    chiave: Chiave,
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

fn credenziali(app: &AppHandle) -> Option<Credenziali> {
    let accesso = app.state::<Accesso>();
    let gettone = gettone_valido(&accesso)?;
    let chiave = accesso.con(|s| s.map(|s| Chiave(s.chiave.0)))?;
    Some(Credenziali { indirizzo: indirizzo(), gettone, chiave })
}

/// Dopo un accesso riuscito: si riparte a sincronizzare.
pub fn accesso_riuscito(app: &AppHandle) {
    SCADUTO.store(false, Ordering::SeqCst);
    app.state::<ProblemaSinc>().imposta(app, None);
}

/// Dopo «Esci»: niente più problemi da mostrare, si lavora in locale.
pub fn uscito(app: &AppHandle) {
    SCADUTO.store(false, Ordering::SeqCst);
    app.state::<ProblemaSinc>().imposta(app, None);
}

/// Una sincronizzazione subito, aspettando quella in corso: per «Esci» (RB-89).
pub fn sincronizza_ora(app: &AppHandle) -> bool {
    sincronizza(app).is_ok()
}

/// Avvia il filo della sincronizzazione.
pub fn avvia(app: AppHandle, segnali: Receiver<()>) {
    std::thread::spawn(move || ciclo(app, segnali));
}

fn ciclo(app: AppHandle, segnali: Receiver<()>) {
    let mut attesa = Duration::ZERO;
    let mut ritentativo = PRIMO_RITENTATIVO;
    loop {
        match segnali.recv_timeout(attesa) {
            // Dopo una modifica si aspetta qualche secondo: altre modifiche partono insieme.
            Ok(()) => {
                std::thread::sleep(DOPO_UNA_MODIFICA);
                while segnali.try_recv().is_ok() {}
            }
            Err(RecvTimeoutError::Timeout) => {}
            Err(RecvTimeoutError::Disconnected) => return,
        }
        // Con l'accesso scaduto si riparte solo dopo un nuovo accesso (RB-87).
        if SCADUTO.load(Ordering::SeqCst) {
            attesa = ULTIMO_RITENTATIVO;
            continue;
        }
        let esito = sincronizza(&app);
        // Per lo stato nella pagina delle impostazioni (DEC-91).
        let problema = match &esito {
            Ok(()) | Err(Problema::SenzaCredenziali) => None,
            Err(Problema::Rete) => Some("rete"),
            Err(Problema::Rifiutate) => Some("rifiutate"),
            Err(Problema::Protocollo) => Some("protocollo"),
            Err(Problema::Altro) => Some("errore"),
        };
        app.state::<ProblemaSinc>().imposta(&app, problema);
        match esito {
            Ok(()) => {
                // Una scorciatoia cambiata su un altro dispositivo vale anche qui (RB-52).
                applica_scorciatoia(&app);
                ritentativo = PRIMO_RITENTATIVO;
                attesa = INTERVALLO;
                let _ = app.emit("sincronizzazione", Evento::Riuscita);
            }
            Err(Problema::SenzaCredenziali) => attesa = INTERVALLO,
            Err(Problema::Rifiutate) => {
                SCADUTO.store(true, Ordering::SeqCst);
                attesa = ULTIMO_RITENTATIVO;
                let _ = app.emit("sincronizzazione", Evento::AccessoScaduto);
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
    let _uno_alla_volta = IN_CORSO.lock().unwrap_or_else(|e| e.into_inner());
    let credenziali = credenziali(app).ok_or(Problema::SenzaCredenziali)?;
    // Apre le buste ricevute; una che non si apre (blocco alterato, CA-10.15) ferma tutto.
    let apri = |r: Ricevuta| -> Result<Ricevuta, Problema> {
        let dati = apri_blocco(&credenziali.chiave, &r.id, &r.dati).ok_or(Problema::Altro)?;
        Ok(Ricevuta { dati, ..r })
    };
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
        // L'archivio del server è un altro (server nuovo o ricreato, DEC-105): le versioni e
        // il numero d'ordine di prima non valgono più, si riparte da zero.
        if let Some(archivio) = risposta["archivio"].as_str() {
            let azzerata = con_archivio(app, |a| {
                let visto = a.stato_sinc("archivio")?;
                if visto.as_deref() == Some(archivio) {
                    return Ok(false);
                }
                let sincronizzata = visto.is_some() || a.stato_sinc("ultimo_ordine")?.is_some();
                if sincronizzata {
                    a.azzera_sinc()?;
                }
                a.imposta_stato_sinc("archivio", archivio)?;
                Ok(sincronizzata)
            })?;
            if azzerata {
                continue;
            }
        }
        let ricevute: Vec<Ricevuta> = risposta["modifiche"]
            .as_array()
            .map(|m| m.iter().filter_map(ricevuta).collect::<Vec<_>>())
            .unwrap_or_default()
            .into_iter()
            .map(apri)
            .collect::<Result<_, _>>()?;
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

    // Il primo giro cifrato: ogni elemento torna da inviare, così sul server non resta niente
    // in chiaro (DEC-78, condizione 3; CA-10.13).
    let gia_cifrata = con_archivio(app, |a| a.stato_sinc("cifrata"))?.is_some();
    if !gia_cifrata {
        con_archivio(app, |a| a.segna_tutto_da_inviare())?;
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
            let busta = chiudi_blocco(&credenziali.chiave, &blocco.id, &blocco.dati);
            let corpo = json!({ "base": blocco.versione, "dati": busta });
            match richiesta(&credenziali, "PUT", &format!("/sincronizzazione/elementi/{}", blocco.id), Some(corpo)) {
                Ok(r) => {
                    let versione = r["versione"].as_i64().unwrap_or(blocco.versione + 1);
                    con_archivio(app, |a| a.inviato(&blocco, versione))?;
                }
                Err(Superata(attuale)) => {
                    if let Some(r) = ricevuta(&attuale) {
                        superati.push(apri(r)?);
                    }
                }
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
        if !gia_cifrata && a.da_inviare()?.is_empty() {
            a.imposta_stato_sinc("cifrata", "1")?;
        }
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

/// Server irraggiungibile da più di un'ora dall'ultima sincronizzazione riuscita o, se non ce
/// n'è mai stata una, dal primo tentativo (RB-40, DEC-112).
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
