// Prove degli allegati nella copia di lavoro (RF-18, DEC-135, DEC-146; TC-216 … TC-224 dal lato
// del nucleo), nelle note di CLOUD. Ogni prova lavora in una cartella temporanea sua, cancellata alla fine.

use std::path::PathBuf;

use serde_json::json;

use super::super::brainet::testo_semplice;
use super::super::sinc::Ricevuta;
use super::super::{Archivio, DatiNota, DatiNuovaNota, Errore, Nota};
use super::*;
use crate::cifratura::{apri_file, chiudi_file, Chiave};

struct Prova {
    cartella: PathBuf,
    archivio: Option<Archivio>,
}

impl Prova {
    fn accesa() -> Self {
        let cartella = std::env::temp_dir().join(format!("memodu-allegati-{}", uuid::Uuid::new_v4()));
        let mut p = Prova { archivio: Some(Archivio::apri(&cartella).unwrap()), cartella };
        p.a().accendi_brainet().unwrap();
        p
    }

    fn a(&mut self) -> &mut Archivio {
        self.archivio.as_mut().unwrap()
    }

    /// Una nota di CLOUD con questo testo (DEC-145).
    fn nota(&mut self, testo: &str) -> Nota {
        self.a().crea(&DatiNuovaNota { titolo: None, contenuto: Some(testo.into()), cartella: None }).unwrap()
    }

    fn salva(&mut self, id: &str, testo: &str) {
        self.a().salva(id, &DatiNota { titolo: None, contenuto: Some(testo.into()) }).unwrap();
    }

    fn stato(&mut self, id: &str) -> Option<String> {
        self.a().db.query_row("SELECT stato FROM allegati_file WHERE id = ?", [id], |r| r.get(0)).optional().unwrap()
    }

    fn da_inviare(&mut self, id: &str) -> Option<serde_json::Value> {
        self.a()
            .da_inviare()
            .unwrap()
            .into_iter()
            .find(|b| b.id == id)
            .map(|b| serde_json::from_str(&b.dati).unwrap())
    }
}

impl Drop for Prova {
    fn drop(&mut self) {
        self.archivio = None;
        let _ = std::fs::remove_dir_all(&self.cartella);
    }
}

fn pdf() -> Vec<u8> {
    b"%PDF-1.7\n un preventivo".to_vec()
}

fn png(larghezza: u32, altezza: u32) -> Vec<u8> {
    let immagine = image::RgbImage::from_pixel(larghezza, altezza, image::Rgb([200, 120, 40]));
    let mut fuori = std::io::Cursor::new(Vec::new());
    immagine.write_to(&mut fuori, image::ImageFormat::Png).unwrap();
    fuori.into_inner()
}

fn segno(a: &Allegato, forma: &str) -> String {
    format!(r#"<allegato id="{}" f="{forma}">{}</allegato>"#, a.id, a.nome)
}

#[test]
fn un_pdf_si_allega_e_resta_da_caricare() {
    let mut p = Prova::accesa();
    let a = p.a().allega("Preventivo.pdf", &pdf()).unwrap();
    assert_eq!((a.tipo.as_str(), a.forma.as_str(), a.nome.as_str()), ("pdf", "documento", "Preventivo.pdf"));
    assert_eq!(std::fs::read(p.a().percorso_allegato(&a.id).unwrap()).unwrap(), pdf());
    assert_eq!(p.stato(&a.id).as_deref(), Some("da_caricare"));
    assert_eq!(p.a().allegati_da_caricare().unwrap(), vec![a.id.clone()]);
    let blocco = p.da_inviare(&a.id).unwrap();
    assert_eq!(blocco["tipo"], "allegato");
    assert_eq!(blocco["campi"]["nome"], "Preventivo.pdf");
    assert_eq!(blocco["campi"]["grandezza"], pdf().len());
    // Lo stesso file con lo stesso nome è lo stesso allegato.
    assert_eq!(p.a().allega("Preventivo.pdf", &pdf()).unwrap().id, a.id);
}

#[test]
fn oltre_25_mb_o_di_un_tipo_diverso_non_entra() {
    let mut p = Prova::accesa();
    let grande = vec![b'a'; (LIMITE_BYTE + 1) as usize];
    assert!(matches!(p.a().allega("Grande.txt", &grande), Err(Errore::TroppoGrande(_))));
    let zip = b"PK\x03\x04 archivio".to_vec();
    assert!(matches!(p.a().allega("Archivio.zip", &zip), Err(Errore::NonValido(m)) if m == AVVISO_TIPO));
    // Il nome dice PDF ma il contenuto no (SF-21).
    assert!(matches!(p.a().allega("Finto.pdf", b"ciao"), Err(Errore::NonValido(_))));
    assert!(matches!(p.a().allega("Foto.png", &pdf()), Err(Errore::NonValido(_))));
    let quanti: i64 = p.a().db.query_row("SELECT count(*) FROM allegati", [], |r| r.get(0)).unwrap();
    assert_eq!(quanti, 0);
}

#[test]
fn i_tipi_si_riconoscono_dai_primi_byte() {
    assert_eq!(tipo_del_file("a.JPG", &[0xFF, 0xD8, 0xFF, 0xE0]), Some("jpg"));
    assert_eq!(tipo_del_file("a.docx", b"PK\x03\x04"), Some("word"));
    assert_eq!(tipo_del_file("a.xls", &[0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]), Some("excel"));
    assert_eq!(tipo_del_file("a.pptx", b"PK\x03\x04"), Some("powerpoint"));
    assert_eq!(tipo_del_file("note.txt", "testo è".as_bytes()), Some("testo"));
    assert_eq!(tipo_del_file("note.txt", b"bin\0ario"), None);
    assert_eq!(tipo_del_file("senza estensione", b"%PDF"), None);
}

#[test]
fn una_foto_ha_l_anteprima_ridotta() {
    let mut p = Prova::accesa();
    let a = p.a().allega("Spiaggia.png", &png(2000, 1000)).unwrap();
    assert_eq!((a.tipo.as_str(), a.forma.as_str()), ("png", "piccola"));
    let info = p.a().leggi_allegato(&a.id).unwrap();
    assert!(info.anteprima.as_deref().unwrap().starts_with("data:image/jpeg;base64,"));
    let anteprima = image::open(p.a().percorso_anteprima(&a.id)).unwrap();
    assert_eq!((anteprima.width(), anteprima.height()), (1440, 720));
    let blocco = p.da_inviare(&a.id).unwrap();
    assert_eq!((blocco["campi"]["larghezza"].clone(), blocco["campi"]["altezza"].clone()), (json!(2000), json!(1000)));
}

#[test]
fn nel_testo_semplice_resta_il_nome() {
    let mut p = Prova::accesa();
    let a = p.a().allega("Preventivo.pdf", &pdf()).unwrap();
    assert_eq!(testo_semplice(&format!("Vedi {}", segno(&a, "documento"))), "Vedi Preventivo.pdf");
    let n = p.nota(&segno(&a, "documento"));
    assert_eq!(p.a().leggi(&n.id).unwrap().contenuto, segno(&a, "documento"));
    assert_eq!(allegati_json(&n.contenuto), format!(r#"["{}"]"#, a.id));
}

#[test]
fn togli_cancella_solo_quando_nessuna_nota_lo_usa_piu_anche_nel_cestino() {
    let mut p = Prova::accesa();
    let a = p.a().allega("Spiaggia.png", &png(10, 10)).unwrap();
    // Allegato e non ancora nel testo: pulire adesso lo toglierebbe, ma il foglio pulisce solo
    // quando si chiude, dopo aver salvato.
    let f = p.nota(&format!("Al mare {}", segno(&a, "bolla")));
    let g = p.nota(&segno(&a, "grande"));
    p.salva(&f.id, "Al mare");
    assert_eq!(p.a().pulisci_allegati().unwrap(), 0);
    p.a().cestina_nota(&g.id).unwrap();
    assert_eq!(p.a().pulisci_allegati().unwrap(), 0, "nel Cestino lo usa ancora");
    let file = p.a().percorso_allegato(&a.id).unwrap();
    p.a().svuota_cestino().unwrap();
    assert!(!file.exists());
    assert!(!p.a().percorso_anteprima(&a.id).exists());
    assert_eq!(p.stato(&a.id).as_deref(), Some("da_cancellare"));
    assert_eq!(p.a().allegati_da_cancellare().unwrap(), vec![a.id.clone()]);
    p.a().allegato_cancellato(&a.id).unwrap();
    assert_eq!(p.stato(&a.id), None);
}

#[test]
fn spegnere_brainet_non_tocca_gli_allegati_e_si_allega_anche_da_spento() {
    let mut p = Prova::accesa();
    let a = p.a().allega("Preventivo.pdf", &pdf()).unwrap();
    p.nota(&segno(&a, "documento"));
    p.a().spegni_brainet().unwrap();
    assert!(p.a().percorso_allegato(&a.id).unwrap().exists());
    assert!(p.a().allegati_da_cancellare().unwrap().is_empty());
    // Allegare è l'unico modo di allegare in vista Markdown (DEC-145).
    let b = p.a().allega("Altro.pdf", b"%PDF-1.7 altro").unwrap();
    assert!(p.a().leggi_allegato(&b.id).is_ok());
}

#[test]
fn un_allegato_ricevuto_si_scarica_quando_serve_e_sparisce_quando_altrove_lo_tolgono() {
    let mut p = Prova::accesa();
    let id = uuid::Uuid::new_v4().to_string();
    let contenuto = pdf();
    let impronta: String = sha2::Sha256::digest(&contenuto).iter().map(|b| format!("{b:02x}")).collect();
    let blocco = json!({
        "formato": "chiaro", "tipo": "allegato", "modificato_il": "", "eliminato": false,
        "campi": { "nome": "Preventivo.pdf", "tipo": "pdf", "grandezza": contenuto.len(),
                   "impronta": impronta, "larghezza": null, "altezza": null,
                   "creato_il": "2026-10-15T10:00:00.000Z" }
    });
    let esito = p.a().ricevi(&[Ricevuta { id: id.clone(), versione: 1, dati: blocco.to_string() }]).unwrap();
    assert!(esito.brainet);
    assert_eq!(p.stato(&id).as_deref(), Some("remoto"));
    assert!(!p.a().allegato_scaricato(&id).unwrap());
    assert!(p.a().allegati_da_caricare().unwrap().is_empty());
    // Un file che non è quello allegato non entra.
    assert!(p.a().salva_scaricato(&id, b"%PDF un altro").is_err());
    p.a().salva_scaricato(&id, &contenuto).unwrap();
    assert!(p.a().allegato_scaricato(&id).unwrap());
    let eliminato = json!({ "formato": "chiaro", "tipo": "allegato", "modificato_il": "", "eliminato": true, "campi": {} });
    p.a().ricevi(&[Ricevuta { id: id.clone(), versione: 2, dati: eliminato.to_string() }]).unwrap();
    assert!(!p.a().cartella_allegati().join(&id).exists());
    assert_eq!(p.stato(&id), None);
    assert!(p.a().allegati_da_cancellare().unwrap().is_empty(), "il server lo cancella chi l'ha tolto");
}

#[test]
fn il_file_si_cifra_solo_per_il_suo_allegato() {
    let chiave = Chiave([9; 32]);
    let cifrato = chiudi_file(&chiave, "id-1", b"contenuto");
    assert_eq!(cifrato.len(), b"contenuto".len() + 40);
    assert!(!cifrato.windows(9).any(|w| w == b"contenuto"));
    assert_eq!(apri_file(&chiave, "id-1", &cifrato).unwrap(), b"contenuto");
    assert!(apri_file(&chiave, "id-1-anteprima", &cifrato).is_none());
    assert!(apri_file(&Chiave([1; 32]), "id-1", &cifrato).is_none());
}

#[test]
fn un_allegato_arrivato_da_un_altro_computer_non_si_cancella_qui_prima_della_sua_nota() {
    let mut p = Prova::accesa();
    let id = uuid::Uuid::new_v4().to_string();
    let blocco = json!({
        "formato": "chiaro", "tipo": "allegato", "modificato_il": "", "eliminato": false,
        "campi": { "nome": "grande.txt", "tipo": "testo", "grandezza": 3, "impronta": "x",
                   "creato_il": "2026-10-15T10:00:00.000Z" }
    });
    p.a().ricevi(&[Ricevuta { id: id.clone(), versione: 1, dati: blocco.to_string() }]).unwrap();
    // La nota che lo usa non è ancora arrivata: la pulizia non lo tocca.
    assert_eq!(p.a().pulisci_allegati().unwrap(), 0);
    assert_eq!(p.stato(&id).as_deref(), Some("remoto"));
    assert!(p.a().allegati_da_cancellare().unwrap().is_empty());
}

#[test]
fn togli_e_ctrl_z_lo_lasciano_un_file_mai_messo_nel_testo_se_ne_va() {
    let mut p = Prova::accesa();
    let a = p.a().allega("Preventivo.pdf", &pdf()).unwrap();
    let f = p.nota(&format!("vedi {}", segno(&a, "documento")));
    p.salva(&f.id, "vedi");
    p.salva(&f.id, &format!("vedi {}", segno(&a, "documento")));
    assert_eq!(p.a().pulisci_allegati().unwrap(), 0, "rimesso con Ctrl+Z");
    // Allegato e poi rimasto fuori dal testo (per esempio il foglio chiuso prima di salvare).
    let fuori = p.a().allega("Altro.txt", b"testo").unwrap();
    assert_eq!(p.a().pulisci_allegati().unwrap(), 1);
    assert_eq!(p.a().allegati_da_cancellare().unwrap(), vec![fuori.id]);
}

#[test]
fn tolto_altrove_mentre_qui_si_carica_qui_lo_si_cancella_dal_server() {
    let mut p = Prova::accesa();
    let a = p.a().allega("Grande.txt", b"un file lungo").unwrap();
    p.nota(&segno(&a, "documento"));
    // Il blocco dell'allegato è già sul server: l'altro computer lo conosce da lì.
    for b in p.a().da_inviare().unwrap() {
        p.a().inviato(&b, 1).unwrap();
    }
    let eliminato = json!({ "formato": "chiaro", "tipo": "allegato", "modificato_il": "", "eliminato": true, "campi": {} });
    p.a().ricevi(&[Ricevuta { id: a.id.clone(), versione: 5, dati: eliminato.to_string() }]).unwrap();
    // Il caricamento finisce dopo: resta da cancellare, e il filo lo cancella dal server.
    p.a().allegato_caricato(&a.id).unwrap();
    assert!(p.a().allegati_da_caricare().unwrap().is_empty());
    assert_eq!(p.a().allegati_da_cancellare().unwrap(), vec![a.id]);
}

