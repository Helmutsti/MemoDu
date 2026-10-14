// Accesso del dispositivo con gli account (RF-14, RF-16, DEC-132, DEC-133). Con email e password
// si chiedono al server sale e parametri, si ricava la prova di accesso (la password non lascia
// il dispositivo) e il server restituisce il gettone di questo dispositivo, senza scadenza, con
// la chiave dati avvolta, che si apre qui. Gettone e chiave dati stanno nel portachiavi del
// sistema, mai in un file né nella copia di lavoro (RB-97, CA-10.16). Senza sessione non si
// sincronizza e si lavora in locale (RB-87). Qui ci sono anche il cambio della password, il
// recupero dell'account e i dispositivi collegati (FL-14, FL-15).

use std::sync::Mutex;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};

use crate::archivio::cartella_predefinita;
use crate::cifratura::{
    apri_blocco, avvolgi_chiave_dati, b64, casuali, chiudi_blocco, da_b64, da_password, da_recupero,
    leggi_recupero, problema_password, scrivi_recupero, svolgi_chiave_dati, svolgi_chiave_dati_recupero,
    Chiave, ParametriArgon2, ARGON2,
};
use crate::sincronizzazione::{self, Segnale};

/// Il server di produzione (scelta di Manuel Cucca del 06/10/2026); MEMODU_SERVER lo sostituisce
/// per le prove, per esempio con l'API in locale.
const SERVER: &str = "https://memodu-api.vercel.app";
pub const PROTOCOLLO: &str = "1";
const ATTESA: Duration = Duration::from_secs(15);
/// I dati aggiunti della busta del nome del dispositivo, che il server tiene cifrato (RB-51).
const SCOPO_NOME: &str = "memodu/nome-dispositivo";
/// Quante volte si ripete una richiesta che cambia la password se la rete cade (SF-08).
const TENTATIVI: usize = 3;

pub fn indirizzo() -> String {
    std::env::var("MEMODU_SERVER")
        .ok()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| SERVER.to_string())
        .trim_end_matches('/')
        .to_string()
}

/// Il tipo di questo dispositivo, per l'elenco (RB-100).
fn tipo() -> &'static str {
    if cfg!(target_os = "macos") {
        "macos"
    } else {
        "windows"
    }
}

/// La sessione del dispositivo dopo l'accesso: non scade (RB-97).
pub struct Sessione {
    pub email: String,
    pub gettone: String,
    pub dispositivo: String,
    pub chiave: Chiave,
}

/// Nel portachiavi. Una sessione del formato di prima (con il JWT, senza dispositivo) non si
/// legge più: il dispositivo rifà l'accesso una volta (DEC-133).
#[derive(Serialize, Deserialize)]
struct SessioneSalvata {
    email: String,
    gettone: String,
    dispositivo: String,
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
    Some(Sessione { email: s.email, gettone: s.gettone, dispositivo: s.dispositivo, chiave: Chiave(chiave) })
}

fn salva_nel_portachiavi(s: &Sessione) {
    let salvata = SessioneSalvata {
        email: s.email.clone(),
        gettone: s.gettone.clone(),
        dispositivo: s.dispositivo.clone(),
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
    /// Credenziali sbagliate, o il dispositivo non è più collegato (401).
    Credenziali,
    /// La password attuale o la chiave di recupero sbagliate nel cambio (403).
    Verifica,
    /// Server irraggiungibile.
    Rete,
    Altro,
}

impl ErroreAccesso {
    /// Il nome dell'errore per l'interfaccia (architettura/api.md).
    fn nome(&self, credenziali: &str) -> String {
        match self {
            ErroreAccesso::Credenziali => credenziali,
            ErroreAccesso::Verifica => "verifica",
            ErroreAccesso::Rete => "rete",
            ErroreAccesso::Altro => "errore",
        }
        .to_string()
    }
}

fn chiama(metodo: &str, percorso: &str, corpo: Option<Value>, gettone: Option<&str>) -> Result<Value, ErroreAccesso> {
    let agente = ureq::AgentBuilder::new().timeout(ATTESA).build();
    let mut r = agente
        .request(metodo, &format!("{}{}", indirizzo(), percorso))
        .set("Memodu-Protocollo", PROTOCOLLO);
    if let Some(g) = gettone {
        r = r.set("Authorization", &format!("Bearer {g}"));
    }
    let esito = match corpo {
        Some(c) => r.send_json(c),
        None => r.call(),
    };
    match esito {
        Ok(ok) if ok.status() == 204 => Ok(Value::Null),
        Ok(ok) => ok.into_json().map_err(|_| ErroreAccesso::Altro),
        Err(ureq::Error::Status(401, _)) => Err(ErroreAccesso::Credenziali),
        Err(ureq::Error::Status(403, _)) => Err(ErroreAccesso::Verifica),
        Err(ureq::Error::Status(_, _)) => Err(ErroreAccesso::Altro),
        Err(ureq::Error::Transport(_)) => Err(ErroreAccesso::Rete),
    }
}

/// Come `chiama`, ripetuta se la rete cade: il server riconosce una richiesta già passata (SF-08).
fn chiama_ripetendo(percorso: &str, corpo: Value, gettone: Option<&str>) -> Result<Value, ErroreAccesso> {
    let mut esito = Err(ErroreAccesso::Rete);
    for _ in 0..TENTATIVI {
        esito = chiama("POST", percorso, Some(corpo.clone()), gettone);
        if esito != Err(ErroreAccesso::Rete) {
            break;
        }
    }
    esito
}

/// Sale e parametri di Argon2id dell'account.
fn parametri(email: &str) -> Result<(Vec<u8>, ParametriArgon2), ErroreAccesso> {
    let p = chiama("POST", "/accesso/parametri", Some(json!({ "email": email })), None)?;
    let sale = p["sale"].as_str().and_then(da_b64).ok_or(ErroreAccesso::Altro)?;
    let argon2 = serde_json::from_value(p["argon2"].clone()).map_err(|_| ErroreAccesso::Altro)?;
    Ok((sale, argon2))
}

/// Accede: sale e parametri, prova dalla password, gettone del dispositivo e chiave dati.
fn accedi_al_server(email: &str, password: &str) -> Result<Sessione, ErroreAccesso> {
    let email = email.trim().to_lowercase();
    let (sale, argon2) = parametri(&email)?;
    let (prova, cassaforte) = da_password(password, &sale, argon2).map_err(|_| ErroreAccesso::Altro)?;
    let corpo = json!({ "email": email, "prova": b64(&prova.0), "tipo": tipo() });
    let r = chiama("POST", "/accesso", Some(corpo), None)?;
    let chiave = r["chiave"]
        .as_str()
        .and_then(|c| svolgi_chiave_dati(&cassaforte, c))
        .ok_or(ErroreAccesso::Altro)?;
    sessione_da(email, &r, chiave)
}

fn sessione_da(email: String, r: &Value, chiave: Chiave) -> Result<Sessione, ErroreAccesso> {
    Ok(Sessione {
        email,
        gettone: r["gettone"].as_str().ok_or(ErroreAccesso::Altro)?.to_string(),
        dispositivo: r["dispositivo"].as_str().ok_or(ErroreAccesso::Altro)?.to_string(),
        chiave,
    })
}

/// Ciò che il dispositivo calcola per una password nuova: sale nuovo, prova e chiave dati
/// riavvolta (la chiave dati non cambia: le note non si ricifrano).
fn password_nuova(password: &str, chiave: &Chiave) -> Result<Value, ErroreAccesso> {
    let sale: [u8; 16] = casuali();
    let (prova, cassaforte) = da_password(password, &sale, ARGON2).map_err(|_| ErroreAccesso::Altro)?;
    Ok(json!({
        "sale": b64(&sale),
        "argon2": ARGON2,
        "prova": b64(&prova.0),
        "chiave": avvolgi_chiave_dati(&cassaforte, chiave, false),
    }))
}

/// Una chiave di recupero nuova (RB-99): il testo da mostrare e ciò che va al server.
fn recupero_nuovo(chiave: &Chiave) -> (String, Value) {
    let recupero: [u8; 32] = casuali();
    let (prova, cassaforte) = da_recupero(&recupero);
    let corpo = json!({ "prova": b64(&prova.0), "chiave": avvolgi_chiave_dati(&cassaforte, chiave, true) });
    (scrivi_recupero(&recupero), corpo)
}

/// Il gettone di questo dispositivo, se ha fatto l'accesso. Non scade (RB-97).
pub fn gettone_valido(accesso: &Accesso) -> Option<String> {
    accesso.con(|s| s.map(|s| s.gettone.clone()))
}

/// Manda al server il nome di questo dispositivo, cifrato con la chiave dati (RB-51, RB-100).
pub fn manda_nome(app: &AppHandle) {
    let Some((gettone, chiave)) = app.state::<Accesso>().con(|s| s.map(|s| (s.gettone.clone(), Chiave(s.chiave.0)))) else {
        return;
    };
    let nome = crate::impostazioni::nome_dispositivo(app);
    let busta = chiudi_blocco(&chiave, SCOPO_NOME, &nome);
    tauri::async_runtime::spawn_blocking(move || {
        let _ = chiama("PUT", "/dispositivi/questo", Some(json!({ "nome": busta })), Some(&gettone));
    });
}

/// La sessione nuova: nel portachiavi, in memoria, e la sincronizzazione riparte.
fn collegato(app: &AppHandle, sessione: Sessione) {
    salva_nel_portachiavi(&sessione);
    app.state::<Accesso>().imposta(Some(sessione));
    sincronizzazione::accesso_riuscito(app);
    app.state::<Segnale>().manda();
    manda_nome(app);
}

/// Argon2id prende circa mezzo secondo: le richieste dell'accesso girano fuori dal filo
/// dell'interfaccia.
async fn fuori<T: Send + 'static>(lavoro: impl FnOnce() -> T + Send + 'static) -> Result<T, String> {
    tauri::async_runtime::spawn_blocking(lavoro).await.map_err(|_| "errore".to_string())
}

/// La sessione di questo dispositivo, o l'errore «accesso».
fn sessione(app: &AppHandle) -> Result<(String, String, Chiave), String> {
    app.state::<Accesso>()
        .con(|s| s.map(|s| (s.email.clone(), s.gettone.clone(), Chiave(s.chiave.0))))
        .ok_or_else(|| "accesso".to_string())
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
    match fuori(move || accedi_al_server(&email, &password)).await? {
        Ok(sessione) => {
            collegato(&app, sessione);
            Ok(())
        }
        Err(e) => Err(e.nome("credenziali")),
    }
}

/// «Esci» e «Non voglio usare il cloud» (RB-89): si prova a mandare le modifiche in attesa,
/// si toglie il dispositivo dal server se c'è rete, poi si tolgono gettone e chiave dati. La
/// copia di lavoro resta; quello che non è partito resta da inviare e parte al prossimo accesso.
#[tauri::command]
pub async fn esci(app: AppHandle) {
    let app2 = app.clone();
    let gettone = gettone_valido(&app.state::<Accesso>());
    let _ = fuori(move || {
        sincronizzazione::sincronizza_ora(&app2);
        if let Some(g) = gettone {
            let _ = chiama("POST", "/accesso/esci", None, Some(&g));
        }
    })
    .await;
    togli_dal_portachiavi();
    app.state::<Accesso>().imposta(None);
    sincronizzazione::uscito(&app);
}

/// Il motivo RB-88 come errore per l'interfaccia: «password:» seguito dal testo da mostrare.
fn controlla(password: &str) -> Result<(), String> {
    match problema_password(password) {
        Some(motivo) => Err(format!("password:{motivo}")),
        None => Ok(()),
    }
}

/// Cambia la password da questo dispositivo (SC-08, RB-98), verificando con la password attuale
/// o con la chiave di recupero. Con la chiave di recupero ne nasce una nuova, che si restituisce
/// per mostrarla una volta (RB-99). Errori: «password:…», «verifica», «rete», «accesso», «errore».
#[tauri::command]
pub async fn cambia_password(
    app: AppHandle,
    attuale: Option<String>,
    chiave_recupero: Option<String>,
    nuova: String,
    scollega_altri: bool,
) -> Result<Option<String>, String> {
    controlla(&nuova)?;
    let (email, gettone, chiave) = sessione(&app)?;
    let esito = fuori(move || -> Result<Option<String>, ErroreAccesso> {
        let (verifica, recupero) = match (attuale, chiave_recupero) {
            (Some(password), _) => {
                let (sale, argon2) = parametri(&email)?;
                let (prova, _) = da_password(&password, &sale, argon2).map_err(|_| ErroreAccesso::Altro)?;
                (json!({ "tipo": "password", "prova": b64(&prova.0) }), None)
            }
            (None, Some(testo)) => {
                let vecchia = leggi_recupero(&testo).ok_or(ErroreAccesso::Verifica)?;
                (json!({ "tipo": "recupero", "prova": b64(&da_recupero(&vecchia).0 .0) }), Some(recupero_nuovo(&chiave)))
            }
            (None, None) => return Err(ErroreAccesso::Altro),
        };
        let mut corpo = json!({ "verifica": verifica, "nuova": password_nuova(&nuova, &chiave)?, "scollega_altri": scollega_altri });
        if let Some((_, r)) = &recupero {
            corpo["recupero_nuovo"] = r.clone();
        }
        chiama_ripetendo("/accesso/password", corpo, Some(&gettone))?;
        Ok(recupero.map(|(testo, _)| testo))
    })
    .await?;
    esito.map_err(|e| e.nome("accesso"))
}

/// Recupera l'account con la chiave di recupero (SC-05, RB-99): password e chiave di recupero
/// nuove, poi questo dispositivo è collegato. Restituisce la chiave nuova da mostrare una volta.
/// Errori: «password:…», «credenziali», «rete», «errore».
#[tauri::command]
pub async fn recupera_account(
    app: AppHandle,
    email: String,
    chiave_recupero: String,
    nuova: String,
    scollega_altri: bool,
) -> Result<String, String> {
    controlla(&nuova)?;
    let esito = fuori(move || -> Result<(Sessione, String), ErroreAccesso> {
        let email = email.trim().to_lowercase();
        let vecchia = leggi_recupero(&chiave_recupero).ok_or(ErroreAccesso::Credenziali)?;
        let (prova, cassaforte) = da_recupero(&vecchia);
        let prova = b64(&prova.0);
        let r = chiama("POST", "/accesso/recupero/chiave", Some(json!({ "email": email, "prova_recupero": prova })), None)?;
        let chiave = r["chiave_recupero"]
            .as_str()
            .and_then(|c| svolgi_chiave_dati_recupero(&cassaforte, c))
            .ok_or(ErroreAccesso::Credenziali)?;
        let (testo, recupero) = recupero_nuovo(&chiave);
        let corpo = json!({
            "email": email,
            "prova_recupero": prova,
            "nuova": password_nuova(&nuova, &chiave)?,
            "recupero_nuovo": recupero,
            "scollega_altri": scollega_altri,
            "tipo": tipo(),
        });
        let r = chiama_ripetendo("/accesso/recupero", corpo, None)?;
        Ok((sessione_da(email, &r, chiave)?, testo))
    })
    .await?;
    match esito {
        Ok((sessione, testo)) => {
            collegato(&app, sessione);
            Ok(testo)
        }
        Err(e) => Err(e.nome("credenziali")),
    }
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DispositivoCollegato {
    id: String,
    /// Il nome aperto con la chiave dati; null se il dispositivo non l'ha ancora mandato.
    nome: Option<String>,
    tipo: String,
    ultima_sincronizzazione: Option<String>,
    questo: bool,
}

/// I dispositivi collegati all'account (SC-09, RB-100). Errori: «rete», «accesso», «errore».
#[tauri::command]
pub async fn elenca_dispositivi(app: AppHandle) -> Result<Vec<DispositivoCollegato>, String> {
    let (_, gettone, chiave) = sessione(&app)?;
    let esito = fuori(move || chiama("GET", "/dispositivi", None, Some(&gettone))).await?;
    let elenco = esito.map_err(|e| e.nome("accesso"))?;
    let righe = elenco.as_array().ok_or("errore")?;
    Ok(righe
        .iter()
        .map(|d| DispositivoCollegato {
            id: d["id"].as_str().unwrap_or_default().to_string(),
            nome: d["nome"].as_str().and_then(|n| apri_blocco(&chiave, SCOPO_NOME, n)),
            tipo: d["tipo"].as_str().unwrap_or("windows").to_string(),
            ultima_sincronizzazione: d["ultima_sincronizzazione"].as_str().map(str::to_string),
            questo: d["questo"].as_bool().unwrap_or(false),
        })
        .collect())
}

/// Scollega un altro dispositivo dell'account (SC-09, RB-100). Errori: «rete», «accesso», «errore».
#[tauri::command]
pub async fn scollega_dispositivo(app: AppHandle, id: String) -> Result<(), String> {
    let (_, gettone, _) = sessione(&app)?;
    let esito = fuori(move || chiama("DELETE", &format!("/dispositivi/{id}"), None, Some(&gettone))).await?;
    esito.map(|_| ()).map_err(|e| e.nome("accesso"))
}

#[cfg(test)]
mod prove {
    use super::*;

    #[test]
    fn l_indirizzo_di_produzione_si_sostituisce_per_le_prove() {
        std::env::remove_var("MEMODU_SERVER");
        assert_eq!(indirizzo(), SERVER);
        std::env::set_var("MEMODU_SERVER", "http://127.0.0.1:4317/");
        assert_eq!(indirizzo(), "http://127.0.0.1:4317");
        std::env::remove_var("MEMODU_SERVER");
    }

    #[test]
    fn la_sessione_di_prima_con_il_jwt_non_si_legge_piu() {
        let vecchia = r#"{"email":"a@b.it","gettone":"x.y.z","scade_il":"2026-11-01T00:00:00Z","chiave":"AAAA"}"#;
        assert!(serde_json::from_str::<SessioneSalvata>(vecchia).is_err());
    }

    #[test]
    fn la_password_nuova_tiene_la_stessa_chiave_dati() {
        let chiave = Chiave([4; 32]);
        let n = password_nuova("una frase lunga e mia", &chiave).unwrap();
        let sale = da_b64(n["sale"].as_str().unwrap()).unwrap();
        let (_, cassaforte) = da_password("una frase lunga e mia", &sale, ARGON2).unwrap();
        assert_eq!(svolgi_chiave_dati(&cassaforte, n["chiave"].as_str().unwrap()).unwrap().0, [4; 32]);
        let (testo, r) = recupero_nuovo(&chiave);
        let (_, cassaforte) = da_recupero(&leggi_recupero(&testo).unwrap());
        assert_eq!(svolgi_chiave_dati_recupero(&cassaforte, r["chiave"].as_str().unwrap()).unwrap().0, [4; 32]);
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
        let elenco = chiama("GET", "/dispositivi", None, Some(&s.gettone)).expect("elenco");
        assert!(elenco.as_array().unwrap().iter().any(|d| d["id"] == s.dispositivo.as_str()));
        chiama("POST", "/accesso/esci", None, Some(&s.gettone)).expect("esci");
        assert_eq!(chiama("GET", "/dispositivi", None, Some(&s.gettone)).err(), Some(ErroreAccesso::Credenziali));
    }
}
