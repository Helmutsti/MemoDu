// Prove di Brainet nella copia di lavoro (RF-18, DEC-145, DEC-146; piano di test TC-197 … TC-239).
// Brainet vive nelle note di CLOUD: le prove scrivono i segni nel testo delle note. Ogni prova
// lavora in una cartella temporanea sua, cancellata alla fine.

use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use chrono::{DateTime, Duration, Utc};
use rusqlite::params;

use super::super::ricerca::Richiesta;
use super::super::{Archivio, DatiDettagli, DatiNota, DatiNuovaNota, Errore, Nota};
use super::*;

struct Prova {
    cartella: PathBuf,
    orologio: Arc<Mutex<DateTime<Utc>>>,
    archivio: Option<Archivio>,
}

impl Prova {
    fn nuova() -> Self {
        let cartella =
            std::env::temp_dir().join(format!("memodu-brainet-{}", uuid::Uuid::new_v4()));
        let orologio = Arc::new(Mutex::new(
            "2026-10-14T10:00:00Z".parse::<DateTime<Utc>>().unwrap(),
        ));
        let mut p = Prova {
            cartella,
            orologio,
            archivio: None,
        };
        p.riapri();
        p
    }

    fn riapri(&mut self) {
        self.archivio = None;
        let o = Arc::clone(&self.orologio);
        self.archivio = Some(
            Archivio::con_orologio(&self.cartella, Box::new(move || *o.lock().unwrap())).unwrap(),
        );
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

    /// Una nota di CLOUD con questo testo.
    fn nota(&mut self, testo: &str) -> Nota {
        self.a()
            .crea(&DatiNuovaNota {
                titolo: None,
                contenuto: Some(testo.into()),
                cartella: None,
            })
            .unwrap()
    }

    fn salva(&mut self, id: &str, testo: &str) {
        self.a()
            .salva(
                id,
                &DatiNota {
                    titolo: None,
                    contenuto: Some(testo.into()),
                },
            )
            .unwrap();
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

fn nominata(p: &mut Prova, id: &str) -> usize {
    p.a()
        .elenca_entita()
        .unwrap()
        .iter()
        .find(|v| v.entita.id == id)
        .map(|v| v.nominata)
        .unwrap_or(0)
}

// ——— TC-226, CA-18.32 ———

#[test]
fn spento_di_default_e_i_comandi_non_fanno_niente() {
    let mut p = Prova::nuova();
    assert_eq!(
        p.a().brainet_stato().unwrap(),
        StatoBrainet { acceso: false }
    );
    assert!(matches!(p.a().elenca_entita(), Err(Errore::BrainetSpento)));
    assert!(matches!(
        p.a().calendario("2026-10"),
        Err(Errore::BrainetSpento)
    ));
    assert!(p.a().accendi_brainet().unwrap().acceso);
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
    assert_eq!(
        s.iter().map(|e| e.nome.as_str()).collect::<Vec<_>>(),
        ["Luca Bianchi", "Lucia"]
    );
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
        area(
            "a1",
            &[&imp.id],
            &[&serra.id],
            &format!("con {} sulla serra", cita(&luca))
        )
    );
    p.nota(&testo);
    // Luca: una citazione e l'area che la contiene. Serra: l'area.
    assert_eq!(nominata(&mut p, &luca.id), 2);
    assert_eq!(nominata(&mut p, &serra.id), 1);
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
fn l_indice_segue_il_testo_salvato() {
    let mut p = Prova::accesa();
    let luca = p.a().crea_entita("Luca").unwrap();
    let serra = p.a().crea_entita("Serra").unwrap();
    let n = p.nota(&format!("A pranzo con {}.", cita(&luca)));
    assert_eq!(nominata(&mut p, &luca.id), 1);
    p.salva(
        &n.id,
        &format!("Ieri, a pranzo con {} e la {}.", cita(&luca), cita(&serra)),
    );
    p.riapri();
    assert_eq!(nominata(&mut p, &luca.id), 1);
    assert_eq!(nominata(&mut p, &serra.id), 1);
    // Tolte le pillole, l'entità non è più nominata.
    p.salva(&n.id, "A pranzo da solo.");
    assert_eq!(nominata(&mut p, &luca.id), 0);
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
    p.nota(&testo);
    assert_eq!(
        p.a().anteprima_unione(&luca.id, &lb.id).unwrap(),
        Unione {
            citazioni: 1,
            aree: 2
        }
    );
    assert!(matches!(
        p.a().unisci_entita(&lb.id, &lb.id),
        Err(Errore::NonValido(_))
    ));
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
    let jpeg = base64::engine::general_purpose::STANDARD
        .decode(con_foto.foto.unwrap())
        .unwrap();
    let letta = image::load_from_memory(&jpeg).unwrap();
    assert_eq!((letta.width(), letta.height()), (256, 128));
    assert!(matches!(
        p.a().imposta_foto(&e.id, Some(b"non sono una foto")),
        Err(Errore::NonValido(m)) if m == super::FOTO_NON_IMMAGINE
    ));
}

// ——— TC-225, CA-18.31 ———

#[test]
fn cambiare_il_tipo_e_tornare_senza() {
    let mut p = Prova::accesa();
    let e = p.a().crea_entita("Giorgio").unwrap();
    assert_eq!(e.tipo, None);
    assert_eq!(
        p.a()
            .imposta_tipo(&e.id, Some("persona"))
            .unwrap()
            .tipo
            .as_deref(),
        Some("persona")
    );
    // Il menu di @ lo mette tra le persone.
    assert_eq!(
        p.a().suggerisci_entita("gior").unwrap()[0].tipo.as_deref(),
        Some("persona")
    );
    assert_eq!(p.a().imposta_tipo(&e.id, None).unwrap().tipo, None);
    assert!(matches!(
        p.a().imposta_tipo(&e.id, Some("animale")),
        Err(Errore::NonValido(_))
    ));
}

// ——— TC-209, CA-18.15 ———

#[test]
fn stati_nome_unico_e_togliere() {
    let mut p = Prova::accesa();
    let imp = p.a().crea_stato("Importante", "avviso").unwrap();
    let idea = p.a().crea_stato("Idea", "successo").unwrap();
    assert!(matches!(
        p.a().crea_stato("importante", "errore"),
        Err(Errore::NomeEsistente(_))
    ));
    assert!(matches!(
        p.a().crea_stato("Altro", "viola"),
        Err(Errore::NonValido(_))
    ));
    let testo = format!(
        "{} e {}",
        area("a1", &[&imp.id], &[], "solo importante"),
        area("a2", &[&imp.id, &idea.id], &[], "importante e idea")
    );
    let n = p.nota(&testo);
    assert_eq!(p.a().aree_con_stato(&imp.id).unwrap(), 2);
    let esito = p.a().togli_stato(&imp.id, None).unwrap();
    assert_eq!(
        esito,
        StatoTolto {
            aree_cambiate: 1,
            aree_sparite: 1
        }
    );
    let letta = p.a().leggi(&n.id).unwrap();
    assert_eq!(leggi_segni(&letta.contenuto).1.len(), 1);
    assert_eq!(
        testo_semplice(&letta.contenuto),
        "solo importante e importante e idea"
    );
    assert_eq!(p.a().elenca_stati().unwrap().len(), 1);
}

#[test]
fn togliere_uno_stato_cambiandolo() {
    let mut p = Prova::accesa();
    let imp = p.a().crea_stato("Importante", "avviso").unwrap();
    let urg = p.a().crea_stato("Urgente", "errore").unwrap();
    let n = p.nota(&area("a1", &[&imp.id], &[], "frase"));
    let esito = p.a().togli_stato(&imp.id, Some(&urg.id)).unwrap();
    assert_eq!(
        esito,
        StatoTolto {
            aree_cambiate: 1,
            aree_sparite: 0
        }
    );
    assert_eq!(
        leggi_segni(&p.a().leggi(&n.id).unwrap().contenuto).1[0].stati,
        [urg.id]
    );
}

// ——— TC-227, CA-18.33 ———

#[test]
fn calendario_un_pallino_per_giorno_senza_cestino() {
    let mut p = Prova::accesa();
    let luca = p.a().crea_entita("Luca").unwrap();
    // Il 14: una nota con la pillola, che poi va nel Cestino.
    let cestinata = p.nota(&cita(&luca));
    p.passa_giorni(1);
    // Il 15: una nota senza Brainet.
    p.nota("niente pillole");
    p.passa_giorni(1);
    // Il 16: due note con la pillola.
    p.nota(&cita(&luca));
    p.nota(&format!("ancora {}", cita(&luca)));
    p.a().cestina_nota(&cestinata.id).unwrap();
    let giorni = p.a().calendario("2026-10").unwrap();
    assert_eq!(
        giorni,
        vec![GiornoCalendario {
            giorno: "2026-10-16".into()
        }]
    );
    // La nota nel Cestino non conta nemmeno in Entità (RB-127).
    assert_eq!(nominata(&mut p, &luca.id), 2);
}

#[test]
fn una_nota_con_la_data_scelta_va_su_quel_giorno() {
    let mut p = Prova::accesa();
    let luca = p.a().crea_entita("Luca").unwrap();
    let n = p.nota(&cita(&luca));
    let dettagli: DatiDettagli = serde_json::from_str(r#"{"creataScelta":"2026-10-01"}"#).unwrap();
    p.a().salva_dettagli(&n.id, &dettagli).unwrap();
    assert_eq!(
        p.a().calendario("2026-10").unwrap(),
        vec![GiornoCalendario {
            giorno: "2026-10-01".into()
        }]
    );
}

// ——— TC-229, CA-18.35 ———

#[test]
fn spegnere_non_cancella_niente() {
    let mut p = Prova::accesa();
    let e = p.a().crea_entita("Luca").unwrap();
    p.a().crea_stato("Importante", "avviso").unwrap();
    let n = p.nota(&cita(&e));
    assert!(!p.a().spegni_brainet().unwrap().acceso);
    // Le pillole già scritte si vedono: entità e stati si leggono anche da spento.
    assert_eq!(p.a().leggi_entita(&e.id).unwrap().nome, "Luca");
    assert_eq!(p.a().elenca_stati().unwrap().len(), 1);
    assert_eq!(p.a().leggi(&n.id).unwrap().contenuto, cita(&e));
    p.a().accendi_brainet().unwrap();
    assert_eq!(nominata(&mut p, &e.id), 1);
}

// ——— TC-230, CA-18.36 ———

#[test]
fn la_ricerca_trova_le_parole_e_non_i_segni() {
    let mut p = Prova::accesa();
    let luca = p.a().crea_entita("Luca Bianchi").unwrap();
    let n = p.nota(&format!(
        "Chiamata con {}: {}",
        cita(&luca),
        area("a1", &[], &[], "il preventivo della serra")
    ));
    let cerca = |p: &mut Prova, testo: &str| {
        p.a()
            .cerca(&Richiesta {
                testo: testo.into(),
                ..Default::default()
            })
            .unwrap()
            .iter()
            .any(|r| r.id == n.id)
    };
    assert!(cerca(&mut p, "luca"));
    assert!(cerca(&mut p, "preventivo"));
    assert!(!cerca(&mut p, "cita"));
    assert!(!cerca(&mut p, &luca.id[..8]));
}

// ——— TC-231, CA-18.37 ———

#[test]
fn una_nota_con_brainet_resta_in_markdown() {
    let mut p = Prova::accesa();
    let luca = p.a().crea_entita("Luca").unwrap();
    let n = p.nota(&cita(&luca));
    assert!(matches!(
        p.a().cambia_vista(&n.id, "testo"),
        Err(Errore::NotaConBrainet)
    ));
    p.salva(&n.id, "Luca");
    assert_eq!(p.a().cambia_vista(&n.id, "testo").unwrap().vista, "testo");
}

// ——— TC-233, CA-18.39 ———

#[test]
fn la_pagina_dell_entita_per_giorno_un_passaggio_per_paragrafo() {
    let mut p = Prova::accesa();
    let serra = p.a().crea_entita("Serra").unwrap();
    let imp = p.a().crea_stato("Importante", "avviso").unwrap();
    // Il 14 alle 10: una nota con due pillole nello stesso paragrafo e una in un altro.
    let prima = p.nota(&format!(
        "La {} e la {} grande\nMisurare la {}",
        cita(&serra),
        cita(&serra),
        cita(&serra)
    ));
    p.passa_giorni(2);
    // Il 16: un'area legata alla Serra.
    let seconda = p.nota(&format!(
        "Arrivato: {}",
        area("a1", &[&imp.id], &[&serra.id], "costa 1.200 €")
    ));
    let pagina = p.a().passaggi_entita(&serra.id).unwrap();
    assert_eq!(pagina.entita.id, serra.id);
    assert_eq!(pagina.nominata, 4);
    assert_eq!(pagina.ultima_volta.as_deref(), Some("2026-10-16"));
    let giorni: Vec<&str> = pagina.giorni.iter().map(|g| g.giorno.as_str()).collect();
    assert_eq!(giorni, ["2026-10-16", "2026-10-14"]);
    assert_eq!(pagina.giorni[0].passaggi[0].nota, seconda.id);
    assert_eq!(
        pagina.giorni[0].passaggi[0].titolo,
        "Arrivato: costa 1.200 €"
    );
    let del_14 = &pagina.giorni[1].passaggi;
    assert_eq!(del_14.len(), 2);
    assert!(del_14.iter().all(|x| x.nota == prima.id));
    assert_eq!(del_14[0].inizio, 0);
    assert!(del_14[1].testo.starts_with("Misurare"));
    assert_eq!(
        del_14[1].inizio,
        prima.contenuto.split('\n').next().unwrap().chars().count() + 1
    );
}

#[test]
fn la_pagina_di_un_entita_nominata_solo_nel_cestino_e_vuota() {
    let mut p = Prova::accesa();
    let giorgio = p.a().crea_entita("Giorgio").unwrap();
    let n = p.nota(&cita(&giorgio));
    p.a().cestina_nota(&n.id).unwrap();
    let pagina = p.a().passaggi_entita(&giorgio.id).unwrap();
    assert_eq!(pagina.nominata, 0);
    assert!(pagina.giorni.is_empty());
}

// ——— TC-237, CA-18.43 ———

#[test]
fn i_frammenti_della_1_0_0_diventano_note() {
    let mut p = Prova::accesa();
    let luca = p.a().crea_entita("Luca").unwrap();
    let testo = format!("Chiamata con {}", cita(&luca));
    {
        let db = &p.a().db;
        db.execute(
            "INSERT INTO frammenti (id, testo, nato_il, modificato_il, eliminato_il) VALUES
               ('f1', ?1, '2026-10-01T09:00:00.000Z', '2026-10-02T09:00:00.000Z', NULL),
               ('f2', 'nel cestino', '2026-10-03T09:00:00.000Z', '2026-10-03T09:00:00.000Z', '2026-10-04T09:00:00.000Z')",
            [&testo],
        )
        .unwrap();
        let base = r#"{"formato":1,"tipo":"frammento","modificato_il":"","eliminato":false,"campi":{"testo":"vecchio","nato_il":"2026-10-01T09:00:00.000Z","modificato_il":"2026-10-01T09:00:00.000Z","eliminato_il":null,"da_nota":null}}"#;
        db.execute(
            "INSERT INTO sinc_elementi (id, tipo, versione, base, modificato) VALUES ('f1', 'frammento', 3, ?1, 0)",
            params![base],
        )
        .unwrap();
        passa_frammenti_in_note(db).unwrap();
    }
    let n = p.a().leggi("f1").unwrap();
    assert_eq!(
        (n.titolo.as_str(), n.contenuto.as_str(), n.vista.as_str()),
        ("", testo.as_str(), "markdown")
    );
    assert_eq!(n.creata, "2026-10-01T09:00:00.000Z");
    assert_eq!(n.cartella, "");
    assert!(p
        .a()
        .elenca_cestino()
        .unwrap()
        .iter()
        .any(|e| e.id == "f2" && e.tipo == "nota"));
    let (tipo, modificato, base): (String, i64, String) = p
        .a()
        .db
        .query_row(
            "SELECT tipo, modificato, base FROM sinc_elementi WHERE id = 'f1'",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )
        .unwrap();
    assert_eq!((tipo.as_str(), modificato), ("nota", 1));
    let base: serde_json::Value = serde_json::from_str(&base).unwrap();
    assert_eq!(base["tipo"], "nota");
    assert_eq!(base["campi"]["contenuto"], "vecchio");
    assert_eq!(nominata(&mut p, &luca.id), 1);
    let frammenti: i64 = p
        .a()
        .db
        .query_row("SELECT count(*) FROM frammenti", [], |r| r.get(0))
        .unwrap();
    assert_eq!(frammenti, 0);
}

#[test]
fn il_blocco_di_un_frammento_diventa_quello_di_una_nota() {
    let blocco = serde_json::json!({
        "formato": 1, "tipo": "frammento", "modificato_il": "x", "eliminato": false,
        "campi": {"testo": "ciao", "nato_il": "2026-10-01T09:00:00.000Z", "modificato_il": "2026-10-02T09:00:00.000Z",
                  "eliminato_il": null, "da_nota": null}
    });
    let nota = blocco_da_frammento(&blocco);
    assert_eq!(nota["tipo"], "nota");
    assert_eq!(nota["campi"]["contenuto"], "ciao");
    assert_eq!(nota["campi"]["creata"], "2026-10-01T09:00:00.000Z");
    assert_eq!(nota["campi"]["vista"], "markdown");
    let eliminato =
        serde_json::json!({"formato": 1, "tipo": "frammento", "eliminato": true, "campi": {}});
    assert_eq!(blocco_da_frammento(&eliminato)["eliminato"], true);
}

#[test]
fn paragrafo_prende_la_riga() {
    assert_eq!(
        paragrafo("uno\ndue tre\nquattro", 5),
        (4, "due tre".to_string())
    );
    assert_eq!(paragrafo("uno", 0), (0, "uno".to_string()));
}

#[test]
fn una_copia_di_lavoro_della_1_0_0_si_apre_con_le_note_brainet_in_cloud() {
    let mut p = Prova::accesa();
    let luca = p.a().crea_entita("Luca").unwrap();
    let file = p.cartella.join(super::super::FILE_DATABASE);
    p.archivio = None;
    // Lo schema 9 della 1.0.0: l'indice sui frammenti, senza la coda e i trigger delle note.
    let db = rusqlite::Connection::open(&file).unwrap();
    db.execute_batch(
        "DROP TRIGGER brainet_note_INSERT; DROP TRIGGER brainet_note_UPDATE; DROP TRIGGER brainet_note_DELETE;
         DROP TRIGGER allegati_note_UPDATE; DROP TRIGGER allegati_note_DELETE; DROP TABLE brainet_da_indicizzare;
         ALTER TABLE brainet_citazioni RENAME COLUMN nota TO frammento;
         ALTER TABLE brainet_aree RENAME COLUMN nota TO frammento;
         ALTER TABLE brainet_aree_legami RENAME COLUMN nota TO frammento;
         PRAGMA user_version = 9;",
    )
    .unwrap();
    db.execute(
        "INSERT INTO frammenti (id, testo, nato_il, modificato_il) VALUES ('f1', ?1, '2026-10-10T09:00:00.000Z', '2026-10-10T09:00:00.000Z')",
        [cita(&luca)],
    )
    .unwrap();
    drop(db);
    p.riapri();
    assert_eq!(p.a().leggi("f1").unwrap().contenuto, cita(&luca));
    assert_eq!(nominata(&mut p, &luca.id), 1);
    assert_eq!(
        p.a().calendario("2026-10").unwrap(),
        vec![GiornoCalendario {
            giorno: "2026-10-10".into()
        }]
    );
}
