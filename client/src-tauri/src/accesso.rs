// Accesso del dispositivo (RF-14, DEC-121). Con email e password si chiedono al server sale e
// parametri, si ricava la prova di accesso (la password non lascia il dispositivo) e il server
// restituisce un gettone di 30 giorni con la chiave dati avvolta, che si apre qui. Gettone e
// chiave dati stanno nel portachiavi del sistema, mai in un file né nella copia di lavoro
// (RB-86, CA-10.16). Senza sessione non si sincronizza e si lavora in locale (RB-87).

use std::sync::Mutex;
use std::time::Duration;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};

use crate::archivio::cartella_predefinita;
use crate::cifratura::{b64, da_b64, da_password, svolgi_chiave_dati, Chiave, ParametriArgon2};
use crate::sincronizzazione::{self, Segnale};

/// Il server di produzione (scelta di Manuel Cucca del 06/10/2026); MEMODU_SERVER lo sostituisce
/// per le prove, per esempio con l'API in locale.
const SERVER: &str = "https://memodu-api.vercel.app";
pub const PROTOCOLLO: &str = "1";
const ATTESA: Duration = Duration::from_secs(15);
/// Quando mancano meno giorni di questi, il gettone si rinnova da solo (RB-86).
const GIORNI_RINNOVO: i64 = 7;

pub fn indirizzo() -> String {
    std::env::var("MEMODU_SERVER")
        .ok()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| SERVER.to_string())
        .trim_end_matches('/')
        .to_string()
}

/// La sessione del dispositivo dopo l'accesso.
pub struct Sessione {
    pub email: String,
    pub gettone: String,
    pub scade_il: String,
    pub chiave: Chiave,
}

#[derive(Serialize, Deserialize)]
struct SessioneSalvata {
    email: String,
    gettone: String,
    scade_il: String,
    chiave: String,
}

/// La sessione in memoria, letta dal portachiavi alla prima richiesta.
pub struct Accesso {
    sessione: Mutex<Option<Option<Sessione>>>,
}

impl Accesso {
    pub fn new() -> Self {
        Accesso { sessione: Mutex::new(None) }
    }

    /// Esegue `f` con la sessione, se c'è.
    pub fn con<T>(&self, f: impl FnOnce(Option<&Sessione>) -> T) -> T {
        let mut s = self.sessione.lock().unwrap();
        let sessione = s.get_or_insert_with(leggi_dal_portachiavi);
        f(sessione.as_ref())
    }

    fn imposta(&self, nuova: Option<Sessione>) {
        *self.sessione.lock().unwrap() = Some(nuova);
    }

    /// Il gettone rinnovato: lo stesso utente e la stessa chiave dati.
    pub fn rinnovato(&self, gettone: String, scade_il: String) {
        let mut s = self.sessione.lock().unwrap();
        if let Some(Some(sessione)) = s.as_mut() {
            sessione.gettone = gettone;
            sessione.scade_il = scade_il;
            salva_nel_portachiavi(sessione);
        }
    }
}

// ——— Portachiavi ———

/// Il nome nel portachiavi; con MEMODU_CARTELLA (le prove) uno per cartella, così le prove non
/// toccano la sessione vera.
fn voce() -> Option<keyring::Entry> {
    let servizio = match std::env::var_os("MEMODU_CARTELLA").filter(|c| !c.is_empty()) {
        Some(_) => format!("Memodu (prove: {})", cartella_predefinita().display()),
        None => "Memodu".to_string(),
    };
    keyring::Entry::new(&servizio, "sessione").ok()
}

fn leggi_dal_portachiavi() -> Option<Sessione> {
    let testo = voce()?.get_password().ok()?;
    let s: SessioneSalvata = serde_json::from_str(&testo).ok()?;
    let chiave: [u8; 32] = da_b64(&s.chiave)?.try_into().ok()?;
    Some(Sessione { email: s.email, gettone: s.gettone, scade_il: s.scade_il, chiave: Chiave(chiave) })
}

fn salva_nel_portachiavi(s: &Sessione) {
    let salvata = SessioneSalvata {
        email: s.email.clone(),
        gettone: s.gettone.clone(),
        scade_il: s.scade_il.clone(),
        chiave: b64(&s.chiave.0),
    };
    if let (Some(v), Ok(testo)) = (voce(), serde_json::to_string(&salvata)) {
        if let Err(errore) = v.set_password(&testo) {
            eprintln!("Portachiavi non disponibile: {errore}");
        }
    }
}

fn togli_dal_portachiavi() {
    if let Some(v) = voce() {
        let _ = v.delete_credential();
    }
}

// ——— Richieste ———

#[derive(Debug, PartialEq)]
pub enum ErroreAccesso {
    /// Email o password sbagliate (401).
    Credenziali,
    /// Server irraggiungibile.
    Rete,
    Altro,
}

fn chiama(percorso: &str, corpo: Value, gettone: Option<&str>) -> Result<Value, ErroreAccesso> {
    let agente = ureq::AgentBuilder::new().timeout(ATTESA).build();
    let mut r = agente
        .post(&format!("{}{}", indirizzo(), percorso))
        .set("Memodu-Protocollo", PROTOCOLLO);
    if let Some(g) = gettone {
        r = r.set("Authorization", &format!("Bearer {g}"));
    }
    match r.send_json(corpo) {
        Ok(ok) => ok.into_json().map_err(|_| ErroreAccesso::Altro),
        Err(ureq::Error::Status(401, _)) => Err(ErroreAccesso::Credenziali),
        Err(ureq::Error::Status(_, _)) => Err(ErroreAccesso::Altro),
        Err(ureq::Error::Transport(_)) => Err(ErroreAccesso::Rete),
    }
}

/// Accede: sale e parametri, prova dalla password, gettone e chiave dati.
fn accedi_al_server(email: &str, password: &str) -> Result<Sessione, ErroreAccesso> {
    let email = email.trim().to_lowercase();
    let p = chiama("/accesso/parametri", json!({ "email": email }), None)?;
    let sale = p["sale"].as_str().and_then(da_b64).ok_or(ErroreAccesso::Altro)?;
    let parametri: ParametriArgon2 =
        serde_json::from_value(p["argon2"].clone()).map_err(|_| ErroreAccesso::Altro)?;
    let (prova, cassaforte) = da_password(password, &sale, parametri).map_err(|_| ErroreAccesso::Altro)?;
    let r = chiama("/accesso", json!({ "email": email, "prova": b64(&prova.0) }), None)?;
    let chiave = r["chiave"]
        .as_str()
        .and_then(|c| svolgi_chiave_dati(&cassaforte, c))
        .ok_or(ErroreAccesso::Altro)?;
    Ok(Sessione {
        email,
        gettone: r["gettone"].as_str().ok_or(ErroreAccesso::Altro)?.to_string(),
        scade_il: r["scade_il"].as_str().unwrap_or_default().to_string(),
        chiave,
    })
}

/// Il gettone, rinnovato se mancano meno di 7 giorni alla scadenza (RB-86). Se il rinnovo non
/// riesce si usa quello di prima, finché vale.
pub fn gettone_valido(accesso: &Accesso) -> Option<String> {
    let (gettone, scade_il) = accesso.con(|s| s.map(|s| (s.gettone.clone(), s.scade_il.clone())))?;
    if da_rinnovare(&scade_il, Utc::now()) {
        if let Ok(r) = chiama("/accesso/rinnovo", json!({}), Some(&gettone)) {
            if let (Some(g), Some(s)) = (r["gettone"].as_str(), r["scade_il"].as_str()) {
                accesso.rinnovato(g.to_string(), s.to_string());
                return Some(g.to_string());
            }
        }
    }
    Some(gettone)
}

fn da_rinnovare(scade_il: &str, adesso: DateTime<Utc>) -> bool {
    DateTime::parse_from_rfc3339(scade_il)
        .map(|s| s.signed_duration_since(adesso).num_days() < GIORNI_RINNOVO)
        .unwrap_or(false)
}

// ——— Comandi ———

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StatoAccesso {
    /// L'email dell'utente, se il dispositivo ha fatto l'accesso.
    email: Option<String>,
}

#[tauri::command]
pub fn stato_accesso(app: AppHandle) -> StatoAccesso {
    StatoAccesso { email: app.state::<Accesso>().con(|s| s.map(|s| s.email.clone())) }
}

/// Accede con email e password (SC-05). Errori: «credenziali», «rete» o «errore».
#[tauri::command]
pub async fn accedi(app: AppHandle, email: String, password: String) -> Result<(), String> {
    // Argon2id prende circa mezzo secondo: fuori dal filo dell'interfaccia.
    let esito = tauri::async_runtime::spawn_blocking(move || accedi_al_server(&email, &password))
        .await
        .map_err(|_| "errore".to_string())?;
    match esito {
        Ok(sessione) => {
            salva_nel_portachiavi(&sessione);
            app.state::<Accesso>().imposta(Some(sessione));
            sincronizzazione::accesso_riuscito(&app);
            app.state::<Segnale>().manda();
            Ok(())
        }
        Err(ErroreAccesso::Credenziali) => Err("credenziali".into()),
        Err(ErroreAccesso::Rete) => Err("rete".into()),
        Err(ErroreAccesso::Altro) => Err("errore".into()),
    }
}

/// «Esci» e «Non voglio usare il cloud» (RB-89): si prova a mandare le modifiche in attesa,
/// poi si tolgono gettone e chiave dati. La copia di lavoro resta; quello che non è partito
/// resta da inviare e parte al prossimo accesso.
#[tauri::command]
pub async fn esci(app: AppHandle) {
    let app2 = app.clone();
    let _ = tauri::async_runtime::spawn_blocking(move || sincronizzazione::sincronizza_ora(&app2)).await;
    togli_dal_portachiavi();
    app.state::<Accesso>().imposta(None);
    sincronizzazione::uscito(&app);
}

#[cfg(test)]
mod prove {
    use super::*;

    #[test]
    fn il_gettone_si_rinnova_solo_a_meno_di_7_giorni_dalla_scadenza() {
        let adesso = DateTime::parse_from_rfc3339("2026-10-06T08:00:00Z").unwrap().with_timezone(&Utc);
        assert!(!da_rinnovare("2026-10-20T08:00:00.000Z", adesso));
        assert!(da_rinnovare("2026-10-12T08:00:00.000Z", adesso));
        assert!(!da_rinnovare("non una data", adesso));
    }

    #[test]
    fn l_indirizzo_di_produzione_si_sostituisce_per_le_prove() {
        std::env::remove_var("MEMODU_SERVER");
        assert_eq!(indirizzo(), SERVER);
        std::env::set_var("MEMODU_SERVER", "http://127.0.0.1:4317/");
        assert_eq!(indirizzo(), "http://127.0.0.1:4317");
        std::env::remove_var("MEMODU_SERVER");
    }
}

#[cfg(test)]
mod prova_con_il_server {
    use super::*;

    /// Contro un'API vera (in locale): MEMODU_SERVER, MEMODU_PROVA_EMAIL e MEMODU_PROVA_PASSWORD.
    /// `cargo test -- --ignored accesso_vero`
    #[test]
    #[ignore]
    fn accesso_vero() {
        let email = std::env::var("MEMODU_PROVA_EMAIL").unwrap();
        let password = std::env::var("MEMODU_PROVA_PASSWORD").unwrap();
        assert_eq!(accedi_al_server(&email, "una password sbagliata").err(), Some(ErroreAccesso::Credenziali));
        let s = accedi_al_server(&email.to_uppercase(), &password).expect("accesso");
        assert_eq!(s.email, email.to_lowercase());
        assert!(s.scade_il.starts_with("20"));
        let r = chiama("/accesso/rinnovo", json!({}), Some(&s.gettone)).expect("rinnovo");
        assert!(r["gettone"].as_str().is_some());
    }
}
