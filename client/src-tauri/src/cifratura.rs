// Chiavi e cifratura end-to-end (DEC-08, DEC-121). Dalla password, sul dispositivo:
// Argon2id(password in NFC, sale), poi HKDF-SHA256 ricava la prova di accesso, che va al server,
// e la chiave della cassaforte, che apre la chiave dati. Gli stessi passi, byte per byte, sono in
// `api/src/chiavi.ts`, che crea l'utente fisso. Ogni blocco della sincronizzazione viaggia
// cifrato con la chiave dati: XChaCha20-Poly1305 con un nonce casuale di 24 byte e l'id
// dell'elemento come dati aggiunti, così un blocco non si può spostare su un altro elemento.

use argon2::{Algorithm, Argon2, Params, Version};
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use chacha20poly1305::aead::{Aead, KeyInit, Payload};
use chacha20poly1305::{XChaCha20Poly1305, XNonce};
use hkdf::Hkdf;
use serde::Deserialize;
use serde_json::{json, Value};
use sha2::Sha256;
use unicode_normalization::UnicodeNormalization;

/// Il formato dei blocchi cifrati (DEC-121); quelli di prima dichiarano «chiaro» (DEC-78).
pub const FORMATO_CIFRATO: &str = "xchacha20poly1305";
const SCOPO_PROVA: &str = "memodu/prova/accesso";
const SCOPO_CASSAFORTE: &str = "memodu/cassaforte/password";
const SCOPO_CHIAVE_DATI: &str = "memodu/chiave-dati/password";

#[derive(Debug, Clone, Copy, Deserialize, PartialEq)]
pub struct ParametriArgon2 {
    /// In KiB.
    pub memoria: u32,
    pub passaggi: u32,
    pub fili: u32,
}

/// Una chiave di 32 byte che si cancella dalla memoria quando non serve più.
pub struct Chiave(pub [u8; 32]);

impl Drop for Chiave {
    fn drop(&mut self) {
        self.0.iter_mut().for_each(|b| *b = 0);
    }
}

pub fn b64(byte: &[u8]) -> String {
    URL_SAFE_NO_PAD.encode(byte)
}

pub fn da_b64(testo: &str) -> Option<Vec<u8>> {
    URL_SAFE_NO_PAD.decode(testo.trim_end_matches('=')).ok()
}

fn ricava(segreto: &[u8], scopo: &str) -> Chiave {
    let mut uscita = [0u8; 32];
    Hkdf::<Sha256>::new(None, segreto)
        .expand(scopo.as_bytes(), &mut uscita)
        .expect("32 byte si possono sempre ricavare");
    Chiave(uscita)
}

/// Prova di accesso e chiave della cassaforte dalla password.
pub fn da_password(password: &str, sale: &[u8], p: ParametriArgon2) -> Result<(Chiave, Chiave), String> {
    let parametri = Params::new(p.memoria, p.passaggi, p.fili, Some(32)).map_err(|e| e.to_string())?;
    let mut base = Chiave([0u8; 32]);
    let testo: String = password.nfc().collect();
    Argon2::new(Algorithm::Argon2id, Version::V0x13, parametri)
        .hash_password_into(testo.as_bytes(), sale, &mut base.0)
        .map_err(|e| e.to_string())?;
    Ok((ricava(&base.0, SCOPO_PROVA), ricava(&base.0, SCOPO_CASSAFORTE)))
}

fn cifra(chiave: &[u8; 32], nonce: &[u8; 24], testo: &[u8], aggiunti: &[u8]) -> Vec<u8> {
    XChaCha20Poly1305::new(chiave.into())
        .encrypt(XNonce::from_slice(nonce), Payload { msg: testo, aad: aggiunti })
        .expect("la cifratura in memoria non fallisce")
}

fn decifra(chiave: &[u8; 32], nonce: &[u8], cifrato: &[u8], aggiunti: &[u8]) -> Option<Vec<u8>> {
    if nonce.len() != 24 {
        return None;
    }
    XChaCha20Poly1305::new(chiave.into())
        .decrypt(XNonce::from_slice(nonce), Payload { msg: cifrato, aad: aggiunti })
        .ok()
}

/// La chiave dati avvolta dal server (nonce, chiave cifrata e controllo, in base64url), aperta
/// con la chiave della cassaforte.
pub fn svolgi_chiave_dati(cassaforte: &Chiave, avvolta: &str) -> Option<Chiave> {
    let byte = da_b64(avvolta)?;
    if byte.len() != 24 + 32 + 16 {
        return None;
    }
    let chiave = decifra(&cassaforte.0, &byte[..24], &byte[24..], SCOPO_CHIAVE_DATI.as_bytes())?;
    Some(Chiave(chiave.try_into().ok()?))
}

/// Un blocco in chiaro (JSON) dentro la busta cifrata che va al server.
pub fn chiudi_blocco(chiave: &Chiave, id: &str, blocco: &str) -> String {
    let nonce: [u8; 24] = rand_nonce();
    let cifrato = cifra(&chiave.0, &nonce, blocco.as_bytes(), id.as_bytes());
    json!({ "formato": FORMATO_CIFRATO, "nonce": b64(&nonce), "dati": b64(&cifrato) }).to_string()
}

/// Il blocco in chiaro da una busta ricevuta. I blocchi di prima, in chiaro (DEC-78), passano
/// com'erano: li mandano ancora le app senza accesso, finché il server accetta il gettone
/// statico. None se la busta non si apre: chiave sbagliata o blocco alterato (CA-10.15).
pub fn apri_blocco(chiave: &Chiave, id: &str, ricevuto: &str) -> Option<String> {
    let busta: Value = serde_json::from_str(ricevuto).ok()?;
    match busta["formato"].as_str()? {
        "chiaro" => Some(ricevuto.to_string()),
        FORMATO_CIFRATO => {
            let nonce = da_b64(busta["nonce"].as_str()?)?;
            let cifrato = da_b64(busta["dati"].as_str()?)?;
            String::from_utf8(decifra(&chiave.0, &nonce, &cifrato, id.as_bytes())?).ok()
        }
        _ => None,
    }
}

fn rand_nonce() -> [u8; 24] {
    use chacha20poly1305::aead::{AeadCore, OsRng};
    XChaCha20Poly1305::generate_nonce(&mut OsRng).into()
}

#[cfg(test)]
mod prove {
    use super::*;

    fn esa(testo: &str) -> Vec<u8> {
        (0..testo.len()).step_by(2).map(|i| u8::from_str_radix(&testo[i..i + 2], 16).unwrap()).collect()
    }

    // Valori calcolati da api/src/chiavi.ts e api/src/xchacha.ts con gli stessi dati: client e
    // server devono dare gli stessi byte, o l'accesso non funziona.
    const LEGGERO: ParametriArgon2 = ParametriArgon2 { memoria: 1024, passaggi: 1, fili: 1 };

    #[test]
    fn la_password_da_la_stessa_prova_e_la_stessa_cassaforte_del_server() {
        let (prova, cassaforte) = da_password("una frase lunga e mia", &[0x11; 16], LEGGERO).unwrap();
        assert_eq!(prova.0.to_vec(), esa("c52e9c1c3b197f6a8d1cc770ab0b49f6211a71baaf02b920af33ba481310b97a"));
        assert_eq!(cassaforte.0.to_vec(), esa("dd5da387b1ef1f021e6a25a85a009d61545505192438cb66355af4770f3abff8"));
    }

    #[test]
    fn la_password_si_confronta_in_nfc() {
        let composta = da_password("caff\u{e8} e altro ancora", &[1; 16], LEGGERO).unwrap().0;
        let scomposta = da_password("caffe\u{300} e altro ancora", &[1; 16], LEGGERO).unwrap().0;
        assert_eq!(composta.0, scomposta.0);
    }

    #[test]
    fn la_chiave_dati_avvolta_dal_server_si_apre() {
        let (_, cassaforte) = da_password("una frase lunga e mia", &[0x11; 16], LEGGERO).unwrap();
        let avvolta = "REREREREREREREREREREREREREREREREEYdsxGwNBSzXDAq3DHgd9OmbbSaHzWfS4b8ijnEAVHxx1o1juoPctbR6qe19Uyi0";
        assert_eq!(svolgi_chiave_dati(&cassaforte, avvolta).unwrap().0, [0x33; 32]);
        assert!(svolgi_chiave_dati(&Chiave([0; 32]), avvolta).is_none());
    }

    #[test]
    fn un_blocco_si_chiude_e_si_riapre_solo_per_il_suo_elemento() {
        let chiave = Chiave([7; 32]);
        let blocco = r#"{"campi":{"titolo":"Riunione"},"formato":"chiaro","tipo":"nota"}"#;
        let busta = chiudi_blocco(&chiave, "id-1", blocco);
        assert!(!busta.contains("Riunione"));
        assert!(busta.contains(FORMATO_CIFRATO));
        assert_eq!(apri_blocco(&chiave, "id-1", &busta).as_deref(), Some(blocco));
        assert!(apri_blocco(&chiave, "id-2", &busta).is_none());
        assert!(apri_blocco(&Chiave([8; 32]), "id-1", &busta).is_none());
    }

    #[test]
    fn un_blocco_alterato_non_si_apre() {
        let chiave = Chiave([7; 32]);
        let mut busta: Value = serde_json::from_str(&chiudi_blocco(&chiave, "id", "{}")).unwrap();
        let mut dati = da_b64(busta["dati"].as_str().unwrap()).unwrap();
        dati[0] ^= 1;
        busta["dati"] = json!(b64(&dati));
        assert!(apri_blocco(&chiave, "id", &busta.to_string()).is_none());
    }

    #[test]
    fn i_blocchi_in_chiaro_di_prima_passano() {
        let chiave = Chiave([7; 32]);
        let chiaro = r#"{"formato":"chiaro","tipo":"tag","campi":{}}"#;
        assert_eq!(apri_blocco(&chiave, "x", chiaro).as_deref(), Some(chiaro));
        assert!(apri_blocco(&chiave, "x", "non json").is_none());
    }
}
