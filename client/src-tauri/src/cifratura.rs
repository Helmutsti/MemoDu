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
const SCOPO_PROVA_RECUPERO: &str = "memodu/prova/recupero";
const SCOPO_CASSAFORTE_RECUPERO: &str = "memodu/cassaforte/recupero";
const SCOPO_CHIAVE_DATI_RECUPERO: &str = "memodu/chiave-dati/recupero";

/// I parametri di Argon2id di una password nuova: 64 MiB, 3 passaggi, 1 filo (DEC-121).
pub const ARGON2: ParametriArgon2 = ParametriArgon2 { memoria: 65536, passaggi: 3, fili: 1 };

#[derive(Debug, Clone, Copy, Deserialize, serde::Serialize, PartialEq)]
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

/// Prova di recupero e chiave della cassaforte di recupero dalla chiave di recupero (RB-99).
pub fn da_recupero(recupero: &[u8; 32]) -> (Chiave, Chiave) {
    (ricava(recupero, SCOPO_PROVA_RECUPERO), ricava(recupero, SCOPO_CASSAFORTE_RECUPERO))
}

/// Byte casuali dal generatore del sistema.
pub fn casuali<const N: usize>() -> [u8; N] {
    use chacha20poly1305::aead::rand_core::RngCore;
    use chacha20poly1305::aead::OsRng;
    let mut byte = [0u8; N];
    OsRng.fill_bytes(&mut byte);
    byte
}

const ALFABETO: &[u8; 32] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/// La chiave di recupero da mostrare: 52 caratteri in gruppi di 4, senza 0, O, 1 e I, come
/// `scriviRecupero` del server.
pub fn scrivi_recupero(chiave: &[u8; 32]) -> String {
    let mut bit: String = chiave.iter().map(|b| format!("{b:08b}")).collect();
    while bit.len() % 5 != 0 {
        bit.push('0');
    }
    let lettere: Vec<char> = (0..bit.len())
        .step_by(5)
        .map(|i| ALFABETO[usize::from_str_radix(&bit[i..i + 5], 2).unwrap()] as char)
        .collect();
    lettere.chunks(4).map(|g| g.iter().collect::<String>()).collect::<Vec<_>>().join("-")
}

/// L'inverso di `scrivi_recupero`; accetta minuscole, spazi e trattini. None se non è una chiave.
pub fn leggi_recupero(testo: &str) -> Option<[u8; 32]> {
    let pulito: Vec<u8> =
        testo.to_uppercase().bytes().filter(|c| !c.is_ascii_whitespace() && *c != b'-').collect();
    if pulito.len() != 52 {
        return None;
    }
    let mut bit = String::new();
    for c in pulito {
        let i = ALFABETO.iter().position(|a| *a == c)?;
        bit.push_str(&format!("{i:05b}"));
    }
    let mut chiave = [0u8; 32];
    for (i, b) in chiave.iter_mut().enumerate() {
        *b = u8::from_str_radix(&bit[i * 8..i * 8 + 8], 2).ok()?;
    }
    Some(chiave)
}

/// Le password più comuni, in minuscolo: lo stesso elenco di `api/src/chiavi.ts` (RB-88).
const COMUNI: &[&str] = &[
    "123456789012", "1234567890123", "password1234", "passwordpassword", "qwertyuiopas", "qwerty123456",
    "abcdefghijkl", "abc123456789", "000000000000", "111111111111", "iloveyou1234", "ciaociaociao",
    "password123!", "amore1234567", "juventus1234", "napoli123456", "forzainter12", "forzamilan12",
    "admin1234567", "benvenuto123", "passwordciao", "qwertyqwerty", "asdfghjklzxc", "1q2w3e4r5t6y",
    "letmein12345", "welcome12345", "memodu123456", "memodumemodu", "passw0rd1234", "aaaaaaaaaaaa",
];

/// Il motivo per cui la password non va bene, o None (RB-88): gli stessi testi del server.
pub fn problema_password(password: &str) -> Option<&'static str> {
    let testo: String = password.nfc().collect();
    if testo.chars().count() < 12 {
        return Some("La password deve avere almeno 12 caratteri.");
    }
    let minuscola = testo.to_lowercase();
    let mut lettere = minuscola.chars();
    let prima = lettere.next();
    if COMUNI.contains(&minuscola.as_str()) || lettere.all(|c| Some(c) == prima) {
        return Some("Questa password è tra le più usate: scegline un'altra.");
    }
    None
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

/// La chiave dati avvolta con una cassaforte, come la conserva il server: con la password o con
/// la chiave di recupero (FL-14).
pub fn avvolgi_chiave_dati(cassaforte: &Chiave, chiave: &Chiave, con_recupero: bool) -> String {
    let scopo = if con_recupero { SCOPO_CHIAVE_DATI_RECUPERO } else { SCOPO_CHIAVE_DATI };
    let nonce = rand_nonce();
    let mut byte = nonce.to_vec();
    byte.extend(cifra(&cassaforte.0, &nonce, &chiave.0, scopo.as_bytes()));
    b64(&byte)
}

/// La chiave dati avvolta con la cassaforte di recupero, aperta (FL-14).
pub fn svolgi_chiave_dati_recupero(cassaforte: &Chiave, avvolta: &str) -> Option<Chiave> {
    let byte = da_b64(avvolta)?;
    if byte.len() != 24 + 32 + 16 {
        return None;
    }
    let chiave = decifra(&cassaforte.0, &byte[..24], &byte[24..], SCOPO_CHIAVE_DATI_RECUPERO.as_bytes())?;
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

/// Un allegato (o la sua anteprima) prima di partire: nonce e file cifrato, con `scopo` (l'id,
/// o l'id seguito da «-anteprima») come dati aggiunti, così un file non passa per un altro
/// (DEC-135).
pub fn chiudi_file(chiave: &Chiave, scopo: &str, byte: &[u8]) -> Vec<u8> {
    let nonce = rand_nonce();
    let mut fuori = nonce.to_vec();
    fuori.extend(cifra(&chiave.0, &nonce, byte, scopo.as_bytes()));
    fuori
}

/// Il file in chiaro da uno scaricato; None se non si apre.
pub fn apri_file(chiave: &Chiave, scopo: &str, cifrato: &[u8]) -> Option<Vec<u8>> {
    if cifrato.len() < 24 {
        return None;
    }
    decifra(&chiave.0, &cifrato[..24], &cifrato[24..], scopo.as_bytes())
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
    fn la_chiave_di_recupero_da_le_stesse_prove_e_si_scrive_come_sul_server() {
        let r = [0x22; 32];
        let (prova, cassaforte) = da_recupero(&r);
        assert_eq!(prova.0.to_vec(), esa("e32fa610c5e29957383dfa393316c665f9ba7aee85a8a6e1c60a7ceaee9f4b99"));
        assert_eq!(cassaforte.0.to_vec(), esa("926154ec01673d40dfa411f9d3f6a222fe8fa47e842d46e628e89a222bd1aa8c"));
        let testo = scrivi_recupero(&r);
        assert_eq!(testo, "EJTC-EJTC-EJTC-EJTC-EJTC-EJTC-EJTC-EJTC-EJTC-EJTC-EJTC-EJTC-EJTA");
        assert_eq!(leggi_recupero(&testo.to_lowercase().replace('-', " ")), Some(r));
        assert_eq!(leggi_recupero("EJTC"), None);
        assert_eq!(leggi_recupero(&testo.replace('E', "0")), None);
        let avvolta = "HIdC6mVNUdCxVM00QB8fNCaJjDVM9d4v3UT0hA0cjNgwFKl9rqsudB285Ee0Gf99PrBiRpsqiJDYf4lwFjnGnyoZ8KxGWIYU";
        assert_eq!(svolgi_chiave_dati_recupero(&cassaforte, avvolta).unwrap().0, [0x33; 32]);
    }

    #[test]
    fn la_chiave_dati_riavvolta_si_riapre_con_la_sua_cassaforte() {
        let cassaforte = Chiave([5; 32]);
        let avvolta = avvolgi_chiave_dati(&cassaforte, &Chiave([9; 32]), false);
        assert_eq!(svolgi_chiave_dati(&cassaforte, &avvolta).unwrap().0, [9; 32]);
        assert!(svolgi_chiave_dati_recupero(&cassaforte, &avvolta).is_none());
        let di_recupero = avvolgi_chiave_dati(&cassaforte, &Chiave([9; 32]), true);
        assert_eq!(svolgi_chiave_dati_recupero(&cassaforte, &di_recupero).unwrap().0, [9; 32]);
    }

    #[test]
    fn la_password_almeno_12_caratteri_e_non_tra_le_piu_comuni() {
        assert!(problema_password("corta12345").unwrap().contains("12 caratteri"));
        assert!(problema_password("Password1234").unwrap().contains("più usate"));
        assert!(problema_password("zzzzzzzzzzzzzz").unwrap().contains("più usate"));
        assert_eq!(problema_password("àèìòù àèìòù xy"), None);
        assert_eq!(problema_password("una frase lunga e mia"), None);
    }

    #[test]
    fn i_blocchi_in_chiaro_di_prima_passano() {
        let chiave = Chiave([7; 32]);
        let chiaro = r#"{"formato":"chiaro","tipo":"tag","campi":{}}"#;
        assert_eq!(apri_blocco(&chiave, "x", chiaro).as_deref(), Some(chiaro));
        assert!(apri_blocco(&chiave, "x", "non json").is_none());
    }
}
