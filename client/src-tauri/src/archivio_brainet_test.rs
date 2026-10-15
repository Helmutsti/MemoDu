// Prove di Brainet nella copia di lavoro (RF-18, piano di test TC-195 … TC-215). Ogni prova
// lavora in una cartella temporanea sua, cancellata alla fine.

use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use chrono::{DateTime, Duration, Utc};

use super::super::{Archivio, DatiNuovaNota, Errore, Ripristinato, SeEsiste};
use super::*;

struct Prova {
    cartella: PathBuf,
    orologio: Arc<Mutex<DateTime<Utc>>>,
    archivio: Option<Archivio>,
}

impl Prova {
    fn nuova() -> Self {
        let cartella = std::env::temp_dir().join(format!("memodu-brainet-{}", uuid::Uuid::new_v4()));
        let orologio = Arc::new(Mutex::new("2026-10-14T10:00:00Z".parse::<DateTime<Utc>>().unwrap()));
        let mut p = Prova { cartella, orologio, archivio: None };
        p.riapri();
        p
    }

    fn riapri(&mut self) {
        self.archivio = None;
        let o = Arc::clone(&self.orologio);
        self.archivio = Some(Archivio::con_orologio(&self.cartella, Box::new(move || *o.lock().unwrap())).unwrap());
    }

    fn a(&mut self) -> &mut Archivio {
        self.archivio.as_mut().unwrap()
    }

    fn passa_giorni(&self, giorni: i64) {
        *self.orologio.lock().unwrap() += Duration::days(giorni);
    }

    fn accesa() -> Self {
        let mut p = Prova::nuova();
        p.a().accendi_brainet().unwrap();
        p
    }
}

impl Drop for Prova {
    fn drop(&mut self) {
        self.archivio = None;
        let _ = std::fs::remove_dir_all(&self.cartella);
    }
}

fn cita(e: &Entita) -> String {
    format!(r#"<cita e="{}">{}</cita>"#, e.id, e.nome)
}

fn area(id: &str, stati: &[&str], entita: &[&str], frase: &str) -> String {
    let mut s = format!(r#"<area id="{id}""#);
    if !stati.is_empty() {
        s.push_str(&format!(r#" s="{}""#, stati.join(",")));
    }
    if !entita.is_empty() {
        s.push_str(&format!(r#" e="{}""#, entita.join(",")));
    }
    format!(r#"{s}>{frase}</area id="{id}">"#)
}

// ——— TC-195, CA-18.1 ———

#[test]
fn spento_di_default_e_i_comandi_non_fanno_niente() {
    let mut p = Prova::nuova();
    assert_eq!(p.a().brainet_stato().unwrap(), StatoBrainet { acceso: false, mostra_database: true });
    assert!(matches!(p.a().crea_frammento("ciao"), Err(Errore::BrainetSpento)));
    assert!(matches!(p.a().elenca_entita(), Err(Errore::BrainetSpento)));
    assert!(p.a().accendi_brainet().unwrap().acceso);
}

// ——— TC-196, CA-18.2 ———

#[test]
fn nota_nuova_in_cima_e_nel_calendario() {
    let mut p = Prova::accesa();
    p.a().crea_frammento("prima").unwrap();
    p.passa_giorni(1);
    let seconda = p.a().crea_frammento("seconda").unwrap();
    let elenco = p.a().elenca_frammenti(None, 50).unwrap();
    assert_eq!(elenco[0].id, seconda.id);
    let giorni = p.a().calendario("2026-10").unwrap();
    assert_eq!(giorni.iter().map(|g| g.note).sum::<usize>(), 2);
    assert!(matches!(p.a().crea_frammento("   "), Err(Errore::NonValido(_))));
}

#[test]
fn salvare_vuoto_cancella() {
    let mut p = Prova::accesa();
    let f = p.a().crea_frammento("x").unwrap();
    assert_eq!(p.a().salva_frammento(&f.id, "").unwrap(), None);
    assert!(p.a().elenca_frammenti(None, 50).unwrap().is_empty());
}

// ——— TC-197, TC-198, CA-18.3, CA-18.4 ———

#[test]
fn suggerimenti_per_tipo_e_crea_senza_tipo() {
    let mut p = Prova::accesa();
    let luca = p.a().crea_entita("Luca Bianchi").unwrap();
    p.a().crea_entita("Lucia").unwrap();
    p.a().crea_entita("Serra").unwrap();
    assert_eq!(luca.tipo, None);
    let s = p.a().suggerisci_entita("luc").unwrap();
    assert_eq!(s.iter().map(|e| e.nome.as_str()).collect::<Vec<_>>(), ["Luca Bianchi", "Lucia"]);
    // Lo stesso nome dà la stessa entità.
    assert_eq!(p.a().crea_entita("luca bianchi").unwrap().id, luca.id);
    assert!(matches!(p.a().crea_entita("  "), Err(Errore::NonValido(_))));
}

// ——— TC-200, TC-205, CA-18.6, CA-18.11 ———

#[test]
fn area_con_pillola_dentro_prende_anche_l_entita() {
    let mut p = Prova::accesa();
    let luca = p.a().crea_entita("Luca").unwrap();
    let serra = p.a().crea_entita("Serra").unwrap();
    let imp = p.a().crea_stato("Importante", "avviso").unwrap();
    let testo = format!(
        "Chiamata: {}",
        area("a1", &[&imp.id], &[&serra.id], &format!("con {} sulla serra", cita(&luca)))
    );
    p.a().crea_frammento(&testo).unwrap();
    let voci = p.a().elenca_entita().unwrap();
    let conta = |id: &str| voci.iter().find(|v| v.entita.id == id).unwrap().nominata;
    // Luca: una citazione e l'area che la contiene. Serra: l'area.
    assert_eq!(conta(&luca.id), 2);
    assert_eq!(conta(&serra.id), 1);
    assert_eq!(p.a().aree_con_stato(&imp.id).unwrap(), 1);
}

#[test]
fn legge_i_segni_con_aree_sovrapposte() {
    let testo = r#"<area id="a" s="x">uno <area id="b" e="y">due</area id="a"> tre</area id="b">"#;
    let (_, aree) = leggi_segni(testo);
    assert_eq!(aree.len(), 2);
    assert!(aree[0].fine < aree[1].fine);
    assert_eq!(aree[1].entita, ["y"]);
    assert_eq!(testo_semplice(testo), "uno due tre");
}

// ——— TC-202, CA-18.8 ———

#[test]
fn pillole_e_aree_seguono_il_testo() {
    let mut p = Prova::accesa();
    let luca = p.a().crea_entita("Luca").unwrap();
    let testo = format!("A pranzo con {}.", cita(&luca));
    let f = p.a().crea_frammento(&testo).unwrap();
    let nuovo = format!("Ieri, a pranzo lungo con {} e altri.", cita(&luca));
    p.a().salva_frammento(&f.id, &nuovo).unwrap();
    p.riapri();
    let letto = p.a().leggi_frammento(&f.id).unwrap();
    let (citazioni, _) = leggi_segni(&letto.testo);
    let c = &citazioni[0];
    let pezzo: String = letto.testo.chars().skip(c.inizio).take(c.fine - c.inizio).collect();
    assert_eq!(pezzo, cita(&luca));
}

// ——— TC-203, CA-18.9 ———

#[test]
fn modifica_tiene_il_giorno_e_il_cestino_ha_la_parte_brainet() {
    let mut p = Prova::accesa();
    let f = p.a().crea_frammento("ieri").unwrap();
    p.passa_giorni(1);
    let cambiato = p.a().salva_frammento(&f.id, "ieri, corretta").unwrap().unwrap();
    assert_eq!(cambiato.nato_il, f.nato_il);
    let el = p.a().elimina_frammento(&f.id).unwrap();
    assert_eq!(el.tipo, "frammento");
    assert_eq!(el.nome, "ieri, corretta");
    assert!(p.a().elenca_cestino().unwrap().iter().any(|e| e.id == f.id));
    assert!(p.a().elenca_frammenti(None, 50).unwrap().is_empty());
    assert!(matches!(p.a().ripristina(&f.id, SeEsiste::Chiedi).unwrap(), Ripristinato::Frammento(_)));
    p.a().elimina_frammento(&f.id).unwrap();
    p.a().elimina_definitivamente(&f.id).unwrap();
    assert!(p.a().elenca_cestino().unwrap().is_empty());
}

// ——— TC-204, CA-18.10 ———

#[test]
fn mostra_database() {
    let mut p = Prova::accesa();
    assert!(!p.a().imposta_mostra_database(false).unwrap().mostra_database);
    assert!(p.a().imposta_mostra_database(true).unwrap().mostra_database);
}

// ——— TC-206, CA-18.12 ———

#[test]
fn unire_due_entita() {
    let mut p = Prova::accesa();
    let luca = p.a().crea_entita("Luca").unwrap();
    let lb = p.a().crea_entita("Luca Bianchi").unwrap();
    let testo = format!(
        "{} {} {}",
        cita(&luca),
        area("a1", &[], &[&luca.id], "frase uno"),
        area("a2", &[], &[&luca.id], "frase due")
    );
    p.a().crea_frammento(&testo).unwrap();
    assert_eq!(p.a().anteprima_unione(&luca.id, &lb.id).unwrap(), Unione { citazioni: 1, aree: 2 });
    assert!(matches!(p.a().unisci_entita(&lb.id, &lb.id), Err(Errore::NonValido(_))));
    p.a().unisci_entita(&luca.id, &lb.id).unwrap();
    let voci = p.a().elenca_entita().unwrap();
    assert_eq!(voci.len(), 1);
    assert_eq!(voci[0].entita.nome, "Luca Bianchi");
    assert_eq!(voci[0].nominata, 3);
    // La pillola vecchia mostra l'entità che resta.
    assert_eq!(p.a().leggi_entita(&luca.id).unwrap().id, lb.id);
}

// ——— TC-207, CA-18.13 ———

#[test]
fn foto_ridotta_e_file_non_immagine() {
    let mut p = Prova::accesa();
    let e = p.a().crea_entita("Giulia").unwrap();
    let grande = image::RgbImage::from_pixel(1000, 500, image::Rgb([200, 100, 50]));
    let mut png = std::io::Cursor::new(Vec::new());
    grande.write_to(&mut png, image::ImageFormat::Png).unwrap();
    let con_foto = p.a().imposta_foto(&e.id, Some(png.get_ref())).unwrap();
    use base64::Engine;
    let jpeg = base64::engine::general_purpose::STANDARD.decode(con_foto.foto.unwrap()).unwrap();
    let letta = image::load_from_memory(&jpeg).unwrap();
    assert_eq!((letta.width(), letta.height()), (256, 128));
    assert!(matches!(p.a().imposta_foto(&e.id, Some(b"non sono una foto")), Err(Errore::NonValido(_))));
}

// ——— TC-209, CA-18.15 ———

#[test]
fn stati_nome_unico_e_togliere() {
    let mut p = Prova::accesa();
    let imp = p.a().crea_stato("Importante", "avviso").unwrap();
    let idea = p.a().crea_stato("Idea", "successo").unwrap();
    assert!(matches!(p.a().crea_stato("importante", "errore"), Err(Errore::NomeEsistente(_))));
    assert!(matches!(p.a().crea_stato("Altro", "viola"), Err(Errore::NonValido(_))));
    let testo = format!(
        "{} e {}",
        area("a1", &[&imp.id], &[], "solo importante"),
        area("a2", &[&imp.id, &idea.id], &[], "importante e idea")
    );
    let f = p.a().crea_frammento(&testo).unwrap();
    assert_eq!(p.a().aree_con_stato(&imp.id).unwrap(), 2);
    let esito = p.a().togli_stato(&imp.id, None).unwrap();
    assert_eq!(esito, StatoTolto { aree_cambiate: 1, aree_sparite: 1 });
    let letto = p.a().leggi_frammento(&f.id).unwrap();
    assert_eq!(leggi_segni(&letto.testo).1.len(), 1);
    assert_eq!(testo_semplice(&letto.testo), "solo importante e importante e idea");
    assert_eq!(p.a().elenca_stati().unwrap().len(), 1);
}

#[test]
fn togliere_uno_stato_cambiandolo() {
    let mut p = Prova::accesa();
    let imp = p.a().crea_stato("Importante", "avviso").unwrap();
    let urg = p.a().crea_stato("Urgente", "errore").unwrap();
    let f = p.a().crea_frammento(&area("a1", &[&imp.id], &[], "frase")).unwrap();
    let esito = p.a().togli_stato(&imp.id, Some(&urg.id)).unwrap();
    assert_eq!(esito, StatoTolto { aree_cambiate: 1, aree_sparite: 0 });
    assert_eq!(leggi_segni(&p.a().leggi_frammento(&f.id).unwrap().testo).1[0].stati, [urg.id]);
}

// ——— TC-213, CA-18.19 ———

#[test]
fn spegnere_cancella_tutto() {
    let mut p = Prova::accesa();
    let e = p.a().crea_entita("Luca").unwrap();
    p.a().crea_stato("Importante", "avviso").unwrap();
    let f = p.a().crea_frammento(&cita(&e)).unwrap();
    p.a().elimina_frammento(&f.id).unwrap();
    assert!(!p.a().spegni_brainet().unwrap().acceso);
    p.a().accendi_brainet().unwrap();
    assert!(p.a().elenca_frammenti(None, 50).unwrap().is_empty());
    assert!(p.a().elenca_entita().unwrap().is_empty());
    assert!(p.a().elenca_stati().unwrap().is_empty());
    assert!(p.a().elenca_cestino().unwrap().is_empty());
}

// ——— TC-214, CA-18.20 ———

#[test]
fn importare_copia_e_sposta() {
    let mut p = Prova::accesa();
    let nota = p
        .a()
        .crea(&DatiNuovaNota { titolo: Some("Spesa".into()), contenuto: Some("pane <area id=\"x\">".into()), cartella: None })
        .unwrap();
    p.passa_giorni(3);
    let f = p.a().importa_in_brainet(&nota.id, false).unwrap();
    assert_eq!(f.nato_il, nota.creata);
    assert_eq!(f.testo, "Spesa\n\npane &lt;area id=\"x\">");
    assert!(leggi_segni(&f.testo).1.is_empty());
    assert!(p.a().leggi(&nota.id).is_ok());
    p.a().importa_in_brainet(&nota.id, true).unwrap();
    assert!(p.a().elenca_cestino().unwrap().iter().any(|e| e.id == nota.id));
    assert_eq!(p.a().elenca_frammenti(None, 50).unwrap().len(), 2);
}

#[test]
fn una_nota_con_la_data_scelta_va_su_quel_giorno_nel_calendario() {
    let mut p = Prova::accesa();
    let nota = p
        .a()
        .crea(&DatiNuovaNota { titolo: Some("Spesa".into()), contenuto: Some("pane".into()), cartella: None })
        .unwrap();
    let dettagli: super::super::DatiDettagli = serde_json::from_str(r#"{"creataScelta":"2026-10-01"}"#).unwrap();
    p.a().salva_dettagli(&nota.id, &dettagli).unwrap();
    let f = p.a().importa_in_brainet(&nota.id, false).unwrap();
    assert!(f.nato_il.parse::<DateTime<Utc>>().is_ok(), "{}", f.nato_il);
    let giorni = p.a().calendario("2026-10").unwrap();
    assert_eq!(giorni, vec![GiornoCalendario { giorno: "2026-10-01".into(), note: 1 }]);
}
