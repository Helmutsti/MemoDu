// Prove della ricerca (RF-08): criteri CA-08.2 … CA-08.9, CA-08.15 e CA-08.16, casi TC-64 …
// TC-71, TC-77 e TC-78 per la parte del nucleo. Ogni prova lavora in una cartella temporanea
// sua, cancellata alla fine.

use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use chrono::{DateTime, Duration, Utc};

use super::super::{Archivio, DatiDettagli, DatiNota, DatiNuovaNota, SeEsiste};
use super::{estratto, Intervallo, Richiesta, Risultato};

struct Prova {
    cartella: PathBuf,
    orologio: Arc<Mutex<DateTime<Utc>>>,
    a: Archivio,
}

impl Prova {
    fn nuova() -> Self {
        let cartella = std::env::temp_dir().join(format!("memodu-ricerca-{}", uuid::Uuid::new_v4()));
        let orologio = Arc::new(Mutex::new("2026-09-30T08:00:00Z".parse::<DateTime<Utc>>().unwrap()));
        let o = Arc::clone(&orologio);
        let a = Archivio::con_orologio(&cartella, Box::new(move || *o.lock().unwrap())).unwrap();
        Prova { cartella, orologio, a }
    }

    fn passa(&self, secondi: i64) {
        *self.orologio.lock().unwrap() += Duration::seconds(secondi);
    }

    fn nota(&mut self, titolo: &str, contenuto: &str, cartella: &str) -> String {
        self.passa(60);
        self.a
            .crea(&DatiNuovaNota {
                titolo: Some(titolo.into()),
                contenuto: Some(contenuto.into()),
                cartella: Some(cartella.into()),
            })
            .unwrap()
            .id
    }

    fn cartella(&mut self, genitore: &str, nome: &str) {
        self.a.crea_cartella(genitore, Some(nome), SeEsiste::Chiedi).unwrap();
    }

    fn cerca(&mut self, testo: &str) -> Vec<Risultato> {
        self.a.cerca(&Richiesta { testo: testo.into(), ..Default::default() }).unwrap()
    }

    fn titoli(&mut self, testo: &str) -> Vec<String> {
        self.cerca(testo).into_iter().map(|r| r.titolo).collect()
    }
}

impl Drop for Prova {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.cartella);
    }
}

fn con_tag(tag: &[&str]) -> Richiesta {
    Richiesta { tag: tag.iter().map(|t| t.to_string()).collect(), ..Default::default() }
}

fn titoli(risultati: &[Risultato]) -> Vec<&str> {
    risultati.iter().map(|r| r.titolo.as_str()).collect()
}

/// Il set di dati «Ricerca» di ambienti.md, ridotto a quello che serve.
fn set_ricerca() -> Prova {
    let mut p = Prova::nuova();
    p.cartella("", "Lavoro");
    p.cartella("Lavoro", "Clienti");
    let idee = p.nota("Idee per il sito", "Una pagina con le note di rilascio per ogni versione.", "");
    let riunione = p.nota(
        "Riunione di lunedì",
        "Abbiamo deciso di spostare il rilascio alla settimana dopo, venerdì.",
        "Lavoro/Clienti",
    );
    let versione = p.nota("Rilascio della versione 2", "Fissato per venerdì, dopo le prove.", "Lavoro");
    let rossi = p.nota("Rossi", "Telefonare per il preventivo.", "Lavoro/Clienti");
    p.nota("Perché no", "Domande aperte.", "");
    // Aggiungere un tag cambia l'ultima modifica (DEC-51): un minuto tra l'uno e l'altro.
    for (id, tag) in [(&versione, "lavoro"), (&riunione, "lavoro"), (&riunione, "clienti"), (&rossi, "lavoro/clienti")] {
        p.passa(60);
        p.a.aggiungi_tag(id, tag).unwrap();
    }
    let _ = idee;
    p
}

// ——— Testo (CA-08.2 … CA-08.4, RB-34, RB-69) ———

#[test]
fn prima_titolo_e_tag_poi_il_testo_ciascuno_per_ultima_modifica() {
    let mut p = set_ricerca();
    // «Rilascio della versione 2» ha la parola nel titolo; le altre solo nel testo, la
    // modificata più di recente in cima.
    assert_eq!(p.titoli("rilascio"), ["Rilascio della versione 2", "Riunione di lunedì", "Idee per il sito"]);
    let r = &p.cerca("rilascio")[1];
    assert_eq!(r.cartella, "Lavoro/Clienti");
    assert!(!r.nel_cestino);
    let [da, a] = r.evidenza.unwrap();
    let parola: String = r.estratto.chars().skip(da).take(a - da).collect();
    assert_eq!(parola, "rilascio");
}

#[test]
fn trova_dentro_le_parole_senza_maiuscole_e_accenti_anche_con_due_lettere() {
    let mut p = set_ricerca();
    assert_eq!(p.titoli("lascio").len(), 3);
    assert_eq!(p.titoli("PERCHE"), ["Perché no"]);
    assert_eq!(p.titoli("RILASCIO").len(), 3);
    // Una e due lettere scorrono le note (DEC-94).
    assert!(p.titoli("pé").contains(&"Perché no".to_string()));
    assert!(p.titoli("ro").contains(&"Rossi".to_string()));
    // Con più parole servono tutte.
    let mut tutte = p.titoli("rilascio venerdì");
    tutte.sort();
    assert_eq!(tutte, ["Rilascio della versione 2", "Riunione di lunedì"]);
    assert_eq!(p.titoli("rilascio preventivo"), Vec::<String>::new());
}

#[test]
fn cercando_un_tag_si_trovano_anche_i_sotto_tag() {
    let mut p = set_ricerca();
    // «Rossi» ha solo «lavoro/clienti» e non ha la parola nel testo.
    assert!(p.titoli("lavoro").contains(&"Rossi".to_string()));
}

#[test]
fn senza_testo_e_senza_filtri_non_ci_sono_risultati() {
    let mut p = set_ricerca();
    assert!(p.cerca("   ").is_empty());
}

#[test]
fn virgolette_asterischi_e_operatori_sono_caratteri() {
    // CA-08.15, TC-77: il testo non è mai una query (RB-08).
    let mut p = set_ricerca();
    let strana = p.nota("Formula", "Scrivere \"a*\" OR b nella cella (NEAR) - fine", "");
    for testo in ["\"a*\" OR b", "(", "NEAR", "-", "\"", "*", "OR", "a\"b"] {
        p.a.cerca(&Richiesta { testo: testo.into(), ..Default::default() }).unwrap();
    }
    let trovate = p.cerca("\"a*\" OR b");
    assert_eq!(trovate.iter().map(|r| r.id.as_str()).collect::<Vec<_>>(), [strana.as_str()]);
}

// ——— Filtri (CA-08.5 … CA-08.7, RB-70) ———

#[test]
fn con_piu_tag_escono_le_note_che_li_hanno_tutti() {
    let mut p = set_ricerca();
    let r = p.a.cerca(&con_tag(&["lavoro", "clienti"])).unwrap();
    assert_eq!(titoli(&r), ["Riunione di lunedì"]);
    let r = p.a.cerca(&Richiesta { testo: "venerdì".into(), ..con_tag(&["lavoro"]) }).unwrap();
    assert_eq!(r.len(), 2);
    // Un tag che non esiste non ha note.
    assert!(p.a.cerca(&con_tag(&["viaggi"])).unwrap().is_empty());
}

#[test]
fn il_filtro_tag_senza_testo_prende_i_sotto_tag_per_ultima_modifica() {
    let mut p = set_ricerca();
    let r = p.a.cerca(&con_tag(&["lavoro"])).unwrap();
    assert_eq!(titoli(&r), ["Rossi", "Riunione di lunedì", "Rilascio della versione 2"]);
    // Senza testo l'estratto è l'inizio della nota.
    assert_eq!(r[0].estratto, "Telefonare per il preventivo.");
    assert_eq!(r[0].evidenza, None);
}

#[test]
fn i_periodi_filtrano_modifica_e_creazione_e_danno_la_data() {
    let mut p = set_ricerca();
    let vecchia = p.nota("Vecchia", "rilascio di agosto", "");
    p.a.db
        .execute("UPDATE note SET modificata = '2026-09-20T08:00:00.000Z', creata = '2026-09-20T08:00:00.000Z' WHERE id = ?", [&vecchia])
        .unwrap();
    let ultimi_7 = Intervallo { da: Some("2026-09-23T22:00:00Z".into()), a: None };
    let r = p
        .a
        .cerca(&Richiesta { testo: "rilascio".into(), modificata: Some(ultimi_7.clone()), ..Default::default() })
        .unwrap();
    assert!(!titoli(&r).contains(&"Vecchia"));
    assert_eq!(r.len(), 3);
    // Per la creazione vale la data scelta nei Dettagli (RF-04), dalla mezzanotte locale.
    p.a.salva_dettagli(&vecchia, &DatiDettagli { creata_scelta: Some(Some("2026-09-29".into())), fine_validita: None })
        .unwrap();
    let r = p.a.cerca(&Richiesta { creata: Some(ultimi_7), ..Default::default() }).unwrap();
    let vecchia_trovata = r.iter().find(|r| r.titolo == "Vecchia").expect("con la data scelta rientra");
    assert_eq!(vecchia_trovata.data, "2026-09-29");
    // Un periodo che finisce prima di cominciare è un errore 400.
    let rovescio = Intervallo { da: Some("2026-09-30T00:00:00Z".into()), a: Some("2026-09-01T00:00:00Z".into()) };
    let errore = p.a.cerca(&Richiesta { modificata: Some(rovescio), ..Default::default() }).unwrap_err();
    assert_eq!(errore.stato(), Some(400));
    let storto = Intervallo { da: Some("ieri".into()), a: None };
    assert_eq!(p.a.cerca(&Richiesta { creata: Some(storto), ..Default::default() }).unwrap_err().stato(), Some(400));
}

// ——— Cestino (CA-08.9, RB-29) ———

#[test]
fn le_note_del_cestino_compaiono_segnate_se_l_impostazione_e_accesa() {
    let mut p = set_ricerca();
    let scaletta = p.nota("Vecchia scaletta", "il rilascio era a settembre", "Lavoro");
    p.a.cestina_nota(&scaletta).unwrap();
    p.cartella("", "Archivio");
    p.nota("Appunti", "rilascio vecchio", "Archivio");
    p.a.cestina_cartella("Archivio").unwrap();
    let r = p.cerca("rilascio");
    let nel_cestino: Vec<(&str, &str)> =
        r.iter().filter(|r| r.nel_cestino).map(|r| (r.titolo.as_str(), r.cartella.as_str())).collect();
    assert_eq!(nel_cestino.len(), 2);
    assert!(nel_cestino.contains(&("Vecchia scaletta", "Lavoro")));
    assert!(nel_cestino.contains(&("Appunti", "Archivio")));
    // Spenta, le note del cestino non compaiono più.
    assert!(p.a.cestino_in_ricerca().unwrap());
    p.a.imposta_cestino_in_ricerca(false).unwrap();
    assert!(!p.a.cestino_in_ricerca().unwrap());
    assert!(p.cerca("rilascio").iter().all(|r| !r.nel_cestino));
}

// ——— Indice aggiornato (DEC-95) ———

#[test]
fn l_indice_segue_ogni_modifica_di_note_e_tag() {
    let mut p = set_ricerca();
    let id = p.nota("Bozza", "niente di speciale", "");
    p.a.salva(&id, &DatiNota { titolo: Some("Scaletta".into()), contenuto: Some("con il fornitore".into()) })
        .unwrap();
    assert_eq!(p.titoli("fornitore"), ["Scaletta"]);
    assert!(p.titoli("speciale").is_empty());
    p.a.aggiungi_tag(&id, "viaggi/estate").unwrap();
    assert_eq!(p.titoli("estate"), ["Scaletta"]);
    // Un tag rinominato (per esempio dalla sincronizzazione) cambia i percorsi nell'indice.
    p.a.db.execute("UPDATE tag SET nome = 'vacanze', chiave = 'vacanze' WHERE chiave = 'viaggi'", []).unwrap();
    assert_eq!(p.titoli("vacanze/estate"), ["Scaletta"]);
    p.a.togli_tag(&id, "vacanze/estate").unwrap();
    assert!(p.titoli("estate").is_empty());
    p.a.aggiungi_tag(&id, "vacanze/estate").unwrap();
    p.a.elimina_tag("vacanze").unwrap();
    assert!(p.titoli("vacanze").is_empty());
    p.a.cestina_nota(&id).unwrap();
    p.a.elimina_definitivamente(&id).unwrap();
    assert!(p.titoli("fornitore").is_empty());
}

#[test]
fn una_copia_di_lavoro_con_lo_schema_3_riempie_l_indice() {
    let mut p = set_ricerca();
    let file = p.cartella.join(super::super::FILE_DATABASE);
    drop(std::mem::replace(&mut p.a, Archivio::con_orologio(&p.cartella.join("altra"), Box::new(Utc::now)).unwrap()));
    let db = rusqlite::Connection::open(&file).unwrap();
    db.execute_batch(
        "DROP TRIGGER ricerca_note_INSERT; DROP TRIGGER ricerca_note_UPDATE; DROP TRIGGER ricerca_note_DELETE;
         DROP TRIGGER ricerca_note_tag_INSERT; DROP TRIGGER ricerca_note_tag_DELETE; DROP TRIGGER ricerca_tag_UPDATE;
         DROP TRIGGER ricerca_note_tag_UPDATE; DROP TABLE ricerca; DROP TABLE ricerca_righe;
         ALTER TABLE impostazioni DROP COLUMN cestino_in_ricerca;
         PRAGMA user_version = 3;",
    )
    .unwrap();
    drop(db);
    let o = Arc::clone(&p.orologio);
    p.a = Archivio::con_orologio(&p.cartella, Box::new(move || *o.lock().unwrap())).unwrap();
    assert_eq!(p.titoli("rilascio").len(), 3);
    assert!(p.titoli("lavoro").contains(&"Rossi".to_string()));
}

// ——— Estratto (DEC-95) ———

#[test]
fn l_estratto_taglia_a_parole_intere_attorno_alla_prima_parola() {
    let lungo = "Prima della riunione abbiamo parlato a lungo del budget e dei fornitori; poi abbiamo deciso di spostare il rilascio alla settimana dopo, dopo le prove sul portatile e sul telefono di tutti.";
    let (testo, [da, a]) = estratto(lungo, &["rilascio".into()]).unwrap();
    assert!(testo.starts_with('…') && testo.ends_with('…'), "{testo}");
    assert_eq!(testo.chars().skip(da).take(a - da).collect::<String>(), "rilascio");
    assert!(testo.chars().count() <= 84, "{testo}");
    assert!(!testo.contains("  "));
    // Gli accenti non spostano l'evidenza.
    let (testo, [da, a]) = estratto("Città è perché così", &["perche".into()]).unwrap();
    assert_eq!(testo.chars().skip(da).take(a - da).collect::<String>(), "perché");
    // All'inizio niente «…» davanti; la parola non c'è: None.
    assert!(!estratto("rilascio subito", &["rilascio".into()]).unwrap().0.starts_with('…'));
    assert!(estratto("niente", &["rilascio".into()]).is_none());
}

// ——— Velocità (CA-08.16, TC-78) ———

/// Con 5.000 note i risultati arrivano entro 200 ms. Si misura compilato per il rilascio:
/// `cargo test --release -- --ignored cinquemila`.
#[test]
#[ignore]
fn con_cinquemila_note_si_cerca_entro_200_ms() {
    let mut p = Prova::nuova();
    let parole = ["rilascio", "budget", "fornitore", "riunione", "preventivo", "telefono", "settimana", "cliente"];
    p.a.db.execute_batch("BEGIN").unwrap();
    for i in 0..5000 {
        let testo: String = (0..60).map(|k| parole[(i * 7 + k * 3) % parole.len()]).collect::<Vec<_>>().join(" ");
        p.a.db
            .execute(
                "INSERT INTO note (id, titolo, contenuto, creata, modificata) VALUES (?, ?, ?, ?, ?)",
                rusqlite::params![uuid::Uuid::new_v4().to_string(), format!("Nota {i}"), testo, "2026-09-01T00:00:00.000Z", format!("2026-09-{:02}T00:00:00.000Z", 1 + i % 28)],
            )
            .unwrap();
    }
    p.a.db.execute_batch("COMMIT").unwrap();
    let ids: Vec<String> = p.a.db.prepare("SELECT id FROM note LIMIT 500").unwrap().query_map([], |r| r.get(0)).unwrap().map(Result::unwrap).collect();
    for id in &ids {
        p.a.aggiungi_tag(id, "lavoro/clienti").unwrap();
    }
    for richiesta in [
        Richiesta { testo: "ri".into(), ..Default::default() },
        Richiesta { testo: "rilascio".into(), ..Default::default() },
        Richiesta { testo: "zzz".into(), ..Default::default() },
        con_tag(&["lavoro"]),
    ] {
        let inizio = std::time::Instant::now();
        let quanti = p.a.cerca(&richiesta).unwrap().len();
        let tempo = inizio.elapsed();
        println!("«{}» {:?}: {quanti} risultati in {tempo:?}", richiesta.testo, richiesta.tag);
        assert!(tempo.as_millis() < 200, "troppo lenta: {tempo:?}");
    }
}

// ——— Correzioni della revisione del codice ———

#[test]
fn una_parola_di_soli_segni_diacritici_non_rompe_la_ricerca() {
    let mut p = set_ricerca();
    assert!(p.cerca("\u{301}").is_empty());
    assert_eq!(p.titoli("rilascio \u{301}").len(), 3);
    assert!(estratto("testo", &[String::new()]).is_none());
}

#[test]
fn unendo_due_tag_doppi_l_indice_prende_il_percorso_nuovo() {
    // Come fa la sincronizzazione con due tag uguali nati su due dispositivi.
    let mut p = set_ricerca();
    let id = p.nota("Bozza", "niente", "");
    p.a.aggiungi_tag(&id, "viaggi").unwrap();
    p.a.aggiungi_tag(&id, "estate").unwrap();
    p.a.togli_tag(&id, "estate").unwrap();
    p.a.db
        .execute(
            "UPDATE note_tag SET tag = (SELECT id FROM tag WHERE chiave = 'estate')
             WHERE tag = (SELECT id FROM tag WHERE chiave = 'viaggi')",
            [],
        )
        .unwrap();
    assert_eq!(p.titoli("estate"), ["Bozza"]);
    assert!(p.titoli("viaggi").is_empty());
}

#[test]
fn una_copia_di_lavoro_con_il_primo_schema_4_rifa_l_indice() {
    let mut p = set_ricerca();
    let file = p.cartella.join(super::super::FILE_DATABASE);
    drop(std::mem::replace(&mut p.a, Archivio::con_orologio(&p.cartella.join("altra"), Box::new(Utc::now)).unwrap()));
    let db = rusqlite::Connection::open(&file).unwrap();
    // L'indice della prima versione: senza ricerca_righe, i trigger cercavano per id.
    db.execute_batch(
        "DROP TRIGGER ricerca_note_INSERT; DROP TRIGGER ricerca_note_UPDATE; DROP TRIGGER ricerca_note_DELETE;
         DROP TRIGGER ricerca_note_tag_INSERT; DROP TRIGGER ricerca_note_tag_DELETE; DROP TRIGGER ricerca_tag_UPDATE;
         DROP TRIGGER ricerca_note_tag_UPDATE; DROP TABLE ricerca_righe;
         CREATE TRIGGER ricerca_note_UPDATE AFTER UPDATE OF titolo, contenuto ON note BEGIN
           UPDATE ricerca SET titolo = NEW.titolo, contenuto = NEW.contenuto WHERE id = NEW.id;
         END;
         PRAGMA user_version = 4;",
    )
    .unwrap();
    drop(db);
    let o = Arc::clone(&p.orologio);
    p.a = Archivio::con_orologio(&p.cartella, Box::new(move || *o.lock().unwrap())).unwrap();
    assert_eq!(p.titoli("rilascio").len(), 3);
    let id = p.nota("Nuova", "con il fornitore", "");
    p.a.salva(&id, &DatiNota { titolo: None, contenuto: Some("con il cliente".into()) }).unwrap();
    assert_eq!(p.titoli("cliente"), ["Nuova"]);
    assert!(p.titoli("fornitore").is_empty());
}

#[test]
fn spenta_l_impostazione_non_compaiono_nemmeno_le_note_dentro_una_cartella_nel_cestino() {
    let mut p = set_ricerca();
    p.cartella("", "Archivio");
    p.cartella("Archivio", "Vecchio");
    p.nota("Appunti", "rilascio vecchio", "Archivio/Vecchio");
    p.a.cestina_cartella("Archivio").unwrap();
    let r = p.cerca("rilascio");
    let appunti = r.iter().find(|r| r.titolo == "Appunti").unwrap();
    assert!(appunti.nel_cestino);
    assert_eq!(appunti.cartella, "Archivio/Vecchio");
    p.a.imposta_cestino_in_ricerca(false).unwrap();
    assert!(!p.titoli("rilascio").contains(&"Appunti".to_string()));
}
