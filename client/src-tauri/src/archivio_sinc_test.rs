// Prove della sincronizzazione della copia di lavoro: due dispositivi e un server finto in
// memoria, che fa quello che fa il server vero (versioni, numero d'ordine, 409 con la versione
// attuale). I criteri sono quelli di RF-10 (CA-10.1 … CA-10.8).

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use chrono::{DateTime, Duration, Utc};

use super::super::{Archivio, DatiNota, DatiNuovaNota, SeEsiste};
use super::{DaInviare, Ricevuta};

#[derive(Default)]
struct Server {
    attuali: HashMap<String, (i64, String, i64)>,
    ordine: i64,
}

impl Server {
    fn modifiche_dopo(&self, dopo: i64) -> (Vec<Ricevuta>, i64) {
        let mut m: Vec<(i64, Ricevuta)> = self
            .attuali
            .iter()
            .filter(|(_, (_, _, o))| *o > dopo)
            .map(|(id, (v, d, o))| (*o, Ricevuta { id: id.clone(), versione: *v, dati: d.clone() }))
            .collect();
        m.sort_by_key(|(o, _)| *o);
        (m.into_iter().map(|(_, r)| r).collect(), self.ordine)
    }

    fn scrivi(&mut self, b: &DaInviare) -> Result<i64, Ricevuta> {
        let attuale = self.attuali.get(&b.id).map(|(v, _, _)| *v).unwrap_or(0);
        if attuale != b.versione {
            let (v, d, _) = self.attuali[&b.id].clone();
            return Err(Ricevuta { id: b.id.clone(), versione: v, dati: d });
        }
        self.ordine += 1;
        self.attuali.insert(b.id.clone(), (attuale + 1, b.dati.clone(), self.ordine));
        Ok(attuale + 1)
    }
}

struct Dispositivo {
    cartella: PathBuf,
    orologio: Arc<Mutex<DateTime<Utc>>>,
    a: Archivio,
    visto: i64,
}

impl Dispositivo {
    fn nuovo(inizio: &str) -> Self {
        let cartella = std::env::temp_dir().join(format!("memodu-sinc-{}", uuid::Uuid::new_v4()));
        let orologio = Arc::new(Mutex::new(inizio.parse::<DateTime<Utc>>().unwrap()));
        let o = Arc::clone(&orologio);
        let a = Archivio::con_orologio(&cartella, Box::new(move || *o.lock().unwrap())).unwrap();
        Dispositivo { cartella, orologio, a, visto: 0 }
    }

    fn passa(&self, secondi: i64) {
        *self.orologio.lock().unwrap() += Duration::seconds(secondi);
    }

    /// Come il motore vero: prima si riceve, poi si invia, fondendo i 409.
    fn sincronizza(&mut self, s: &mut Server) {
        let (ricevute, ultimo) = s.modifiche_dopo(self.visto);
        self.a.ricevi(&ricevute).unwrap();
        self.visto = ultimo;
        for _ in 0..3 {
            let blocchi = self.a.da_inviare().unwrap();
            if blocchi.is_empty() {
                break;
            }
            let mut superati = Vec::new();
            for b in blocchi {
                match s.scrivi(&b) {
                    Ok(v) => self.a.inviato(&b, v).unwrap(),
                    Err(r) => superati.push(r),
                }
            }
            if superati.is_empty() {
                break;
            }
            self.a.ricevi(&superati).unwrap();
        }
    }

    fn titoli(&mut self) -> Vec<String> {
        let mut t: Vec<String> = self.a.elenca().unwrap().into_iter().map(|v| v.titolo).collect();
        for c in self.a.albero().unwrap().cartelle {
            t.extend(c.note.into_iter().map(|v| v.titolo));
        }
        t.sort();
        t
    }
}

impl Drop for Dispositivo {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.cartella);
    }
}

const INIZIO: &str = "2026-09-30T08:00:00Z";

fn due() -> (Dispositivo, Dispositivo, Server) {
    (Dispositivo::nuovo(INIZIO), Dispositivo::nuovo(INIZIO), Server::default())
}

fn nota(d: &mut Dispositivo, titolo: &str, contenuto: &str, cartella: Option<&str>) -> String {
    d.a.crea(&DatiNuovaNota {
        titolo: Some(titolo.into()),
        contenuto: Some(contenuto.into()),
        cartella: cartella.map(str::to_string),
    })
    .unwrap()
    .id
}

/// Come la finestra: apre (legge) la nota e ci scrive.
fn scrivi(d: &mut Dispositivo, id: &str, contenuto: &str) {
    d.a.leggi(id).unwrap();
    salva_senza_rileggere(d, id, contenuto);
}

fn salva_senza_rileggere(d: &mut Dispositivo, id: &str, contenuto: &str) {
    d.a.salva(id, &DatiNota { titolo: None, contenuto: Some(contenuto.into()) }).unwrap();
}

#[test]
fn una_nota_scritta_su_un_dispositivo_arriva_uguale_sull_altro() {
    // CA-10.1, CA-10.8
    let (mut a, mut b, mut s) = due();
    a.a.crea_cartella("", Some("Lavoro"), SeEsiste::Chiedi).unwrap();
    let id = nota(&mut a, "Riunione", "ordine del giorno", Some("Lavoro"));
    a.a.aggiungi_tag(&id, "lavoro/clienti").unwrap();
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    let arrivata = b.a.leggi(&id).unwrap();
    assert_eq!(arrivata.contenuto, "ordine del giorno");
    assert_eq!(arrivata.cartella, "Lavoro");
    assert_eq!(arrivata.tag, vec!["lavoro/clienti"]);
    // Niente da inviare di nuovo, niente copie.
    assert!(b.a.da_inviare().unwrap().is_empty());
    b.passa(10);
    scrivi(&mut b, &id, "ordine del giorno, rivisto");
    b.sincronizza(&mut s);
    a.sincronizza(&mut s);
    assert_eq!(a.a.leggi(&id).unwrap().contenuto, "ordine del giorno, rivisto");
    assert_eq!(a.titoli(), vec!["Riunione"]);
}

#[test]
fn il_testo_cambiato_su_due_dispositivi_tiene_tutte_e_due_le_versioni() {
    // CA-10.3, DEC-06, RB-39
    let (mut a, mut b, mut s) = due();
    let id = nota(&mut a, "Budget", "base", None);
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    scrivi(&mut a, &id, "versione di A");
    b.passa(5);
    scrivi(&mut b, &id, "versione di B");
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    a.sincronizza(&mut s);
    let conflitti = b.a.prendi_conflitti();
    assert_eq!(conflitti.len(), 1);
    for d in [&mut a, &mut b] {
        assert_eq!(d.titoli(), vec!["Budget", "Budget (copia in conflitto)"]);
        let contenuti: Vec<String> = d
            .a
            .elenca()
            .unwrap()
            .into_iter()
            .map(|v| d.a.leggi(&v.id).unwrap().contenuto)
            .collect();
        assert!(contenuti.contains(&"versione di A".to_string()));
        assert!(contenuti.contains(&"versione di B".to_string()));
    }
}

#[test]
fn una_nota_spostata_in_due_posti_resta_nello_spostamento_arrivato_per_ultimo() {
    // CA-10.4, RB-37, DEC-109: conta l'arrivo al server, non l'ora dei dispositivi.
    let (mut a, mut b, mut s) = due();
    for nome in ["Uno", "Due"] {
        a.a.crea_cartella("", Some(nome), SeEsiste::Chiedi).unwrap();
    }
    let id = nota(&mut a, "N", "", None);
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    b.a.sposta_nota(&id, "Due").unwrap();
    a.passa(60);
    a.a.sposta_nota(&id, "Uno").unwrap();
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    a.sincronizza(&mut s);
    assert_eq!(a.a.leggi(&id).unwrap().cartella, "Due");
    assert_eq!(b.a.leggi(&id).unwrap().cartella, "Due");
}

#[test]
fn nel_cestino_e_modificata_vince_l_azione_arrivata_per_ultima() {
    // CA-10.5, RB-36, DEC-109
    let (mut a, mut b, mut s) = due();
    let id = nota(&mut a, "N", "prima", None);
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    a.passa(30);
    a.a.cestina_nota(&id).unwrap();
    scrivi(&mut b, &id, "modificata dopo");
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    a.sincronizza(&mut s);
    for d in [&mut a, &mut b] {
        let n = d.a.leggi(&id).expect("la modifica arrivata per ultima la fa uscire dal cestino");
        assert_eq!(n.contenuto, "modificata dopo");
    }
}

#[test]
fn una_cartella_rinominata_in_due_modi_prende_il_nome_arrivato_per_ultimo() {
    // CA-10.6, RB-38, DEC-109, DEC-110
    let (mut a, mut b, mut s) = due();
    a.a.crea_cartella("", Some("Idee"), SeEsiste::Chiedi).unwrap();
    let id = nota(&mut a, "Dentro", "", Some("Idee"));
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    a.passa(20);
    a.a.rinomina_cartella("Idee", "Progetti", SeEsiste::Chiedi).unwrap();
    b.a.rinomina_cartella("Idee", "Lavori", SeEsiste::Chiedi).unwrap();
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    a.sincronizza(&mut s);
    for d in [&mut a, &mut b] {
        let mut nomi: Vec<String> = d.a.albero().unwrap().cartelle.into_iter().map(|c| c.nome).collect();
        nomi.sort();
        assert_eq!(nomi, vec!["Lavori"], "niente cartella vuota con il nome che ha perso");
        assert_eq!(d.a.leggi(&id).unwrap().cartella, "Lavori");
    }
}

#[test]
fn una_nota_spostata_in_una_cartella_cestinata_altrove_va_tra_le_non_organizzate() {
    // CA-10.7, RB-30, DEC-111
    let (mut a, mut b, mut s) = due();
    a.a.crea_cartella("", Some("Archivio"), SeEsiste::Chiedi).unwrap();
    let id = nota(&mut a, "N", "", None);
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    a.a.cestina_cartella("Archivio").unwrap();
    b.a.sposta_nota(&id, "Archivio").unwrap();
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    a.sincronizza(&mut s);
    for d in [&mut a, &mut b] {
        assert_eq!(d.a.leggi(&id).unwrap().cartella, "", "la nota è tra le non organizzate");
        assert_eq!(d.a.elenca_cestino().unwrap().len(), 1, "la cartella resta nel cestino");
        assert!(d.a.da_inviare().unwrap().is_empty());
    }
}

#[test]
fn i_tag_aggiunti_da_tutte_e_due_le_parti_restano() {
    let (mut a, mut b, mut s) = due();
    let id = nota(&mut a, "N", "", None);
    a.a.aggiungi_tag(&id, "comune").unwrap();
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    a.a.aggiungi_tag(&id, "di-a").unwrap();
    b.a.aggiungi_tag(&id, "di-b").unwrap();
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    a.sincronizza(&mut s);
    assert_eq!(a.a.leggi(&id).unwrap().tag, vec!["comune", "di-a", "di-b"]);
    assert_eq!(b.a.leggi(&id).unwrap().tag, vec!["comune", "di-a", "di-b"]);
}

#[test]
fn una_nota_eliminata_per_sempre_sparisce_anche_dall_altro() {
    let (mut a, mut b, mut s) = due();
    let id = nota(&mut a, "N", "", None);
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    a.a.cestina_nota(&id).unwrap();
    a.a.elimina_definitivamente(&id).unwrap();
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    assert!(b.a.leggi(&id).is_err());
    assert!(b.a.elenca_cestino().unwrap().is_empty());
}

#[test]
fn il_testo_della_nota_aperta_non_sovrascrive_una_modifica_ricevuta() {
    // DEC-06: la finestra aveva la nota vecchia; il suo salvataggio va nella copia.
    let (mut a, mut b, mut s) = due();
    let id = nota(&mut a, "Aperta", "comune", None);
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    b.a.leggi(&id).unwrap();
    scrivi(&mut a, &id, "da A");
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    // La finestra di B non ha riletto: salva il testo che aveva.
    salva_senza_rileggere(&mut b, &id, "comune, scritto in B");
    let conflitti = b.a.prendi_conflitti();
    assert_eq!(conflitti.len(), 1);
    assert!(conflitti[0].scrivendo);
    // Anche i salvataggi successivi della stessa finestra vanno nella copia.
    salva_senza_rileggere(&mut b, &id, "comune, scritto in B e continuato");
    let anteprime: Vec<(String, String)> =
        b.a.elenca().unwrap().into_iter().map(|v| (v.id, v.anteprima)).collect();
    assert!(anteprime.contains(&(id.clone(), "da A".to_string())));
    assert!(anteprime.contains(&(conflitti[0].copia.clone(), "comune, scritto in B e continuato".to_string())));
}

// ——— Impostazioni (DEC-91, RB-52) ———

use super::super::impostazioni::Sistema;

#[test]
fn la_scorciatoia_arriva_sugli_altri_dispositivi_separata_per_sistema() {
    let (mut a, mut b, mut s) = due();
    assert_eq!(b.a.scorciatoia(Sistema::Windows).unwrap(), None);
    a.a.imposta_scorciatoia(Sistema::Windows, Some("Control+Shift+Space")).unwrap();
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    assert_eq!(b.a.scorciatoia(Sistema::Windows).unwrap().as_deref(), Some("Control+Shift+Space"));
    assert_eq!(b.a.scorciatoia(Sistema::Macos).unwrap(), None);
    // Cambiate insieme su due sistemi diversi: restano tutte e due.
    a.passa(10);
    b.passa(10);
    a.a.imposta_scorciatoia(Sistema::Windows, Some("Control+Alt+KeyM")).unwrap();
    b.a.imposta_scorciatoia(Sistema::Macos, Some("Super+Alt+KeyM")).unwrap();
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    a.sincronizza(&mut s);
    for d in [&mut a, &mut b] {
        assert_eq!(d.a.scorciatoia(Sistema::Windows).unwrap().as_deref(), Some("Control+Alt+KeyM"));
        assert_eq!(d.a.scorciatoia(Sistema::Macos).unwrap().as_deref(), Some("Super+Alt+KeyM"));
    }
    // «Ripristina» torna al default anche altrove.
    a.passa(10);
    a.a.imposta_scorciatoia(Sistema::Windows, None).unwrap();
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    assert_eq!(b.a.scorciatoia(Sistema::Windows).unwrap(), None);
}

#[test]
fn tema_e_nome_del_dispositivo_restano_sul_dispositivo() {
    let (mut a, mut b, mut s) = due();
    a.a.imposta_valore_dispositivo("tema", Some("scuro")).unwrap();
    a.a.imposta_valore_dispositivo("nome", Some("Portatile di lavoro")).unwrap();
    assert!(a.a.da_inviare().unwrap().is_empty());
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    assert_eq!(b.a.valore_dispositivo("tema").unwrap(), None);
    assert_eq!(a.a.valore_dispositivo("tema").unwrap().as_deref(), Some("scuro"));
    a.a.imposta_valore_dispositivo("tema", None).unwrap();
    assert_eq!(a.a.valore_dispositivo("tema").unwrap(), None);
}

#[test]
fn la_scelta_sul_cestino_nella_ricerca_arriva_sugli_altri_dispositivi() {
    // RB-29, RB-52, DEC-95 (TC-71 per la parte del nucleo).
    let (mut a, mut b, mut s) = due();
    a.a.imposta_cestino_in_ricerca(false).unwrap();
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    assert!(!b.a.cestino_in_ricerca().unwrap());
    b.passa(10);
    b.a.imposta_cestino_in_ricerca(true).unwrap();
    b.sincronizza(&mut s);
    a.sincronizza(&mut s);
    assert!(a.a.cestino_in_ricerca().unwrap());
}

#[test]
fn le_note_ricevute_si_trovano_con_la_ricerca() {
    // DEC-95: l'indice segue anche le modifiche ricevute.
    let (mut a, mut b, mut s) = due();
    let id = nota(&mut a, "Rilascio", "venerdì dopo le prove", None);
    a.a.aggiungi_tag(&id, "lavoro/clienti").unwrap();
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    let cerca = |d: &mut Dispositivo, testo: &str| {
        d.a.cerca(&super::super::ricerca::Richiesta { testo: testo.into(), ..Default::default() })
            .unwrap()
            .len()
    };
    assert_eq!(cerca(&mut b, "venerdì"), 1);
    assert_eq!(cerca(&mut b, "clienti"), 1);
    a.passa(10);
    a.a.salva(&id, &DatiNota { titolo: None, contenuto: Some("sabato mattina".into()) }).unwrap();
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    assert_eq!(cerca(&mut b, "venerdì"), 0);
    assert_eq!(cerca(&mut b, "sabato"), 1);
}

#[test]
fn le_impostazioni_senza_il_campo_del_cestino_non_lo_azzerano() {
    // Revisione del codice: un dispositivo con la versione di prima rimanda le impostazioni senza
    // cestino_in_ricerca; qui la scelta resta.
    let (mut a, mut b, mut s) = due();
    a.a.imposta_cestino_in_ricerca(false).unwrap();
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    let id = super::super::impostazioni::ID;
    let (versione, dati, _) = s.attuali[id].clone();
    let mut blocco: serde_json::Value = serde_json::from_str(&dati).unwrap();
    blocco["campi"].as_object_mut().unwrap().remove("cestino_in_ricerca");
    blocco["campi"]["scorciatoia_windows"] = serde_json::json!("Control+Shift+KeyM");
    blocco["modificato_il"] = serde_json::json!("2026-09-30T09:00:00.000Z");
    s.ordine += 1;
    let ordine = s.ordine;
    s.attuali.insert(id.to_string(), (versione + 1, blocco.to_string(), ordine));
    b.sincronizza(&mut s);
    assert!(!b.a.cestino_in_ricerca().unwrap());
    assert_eq!(
        b.a.scorciatoia(super::super::impostazioni::Sistema::Windows).unwrap().as_deref(),
        Some("Control+Shift+KeyM")
    );
}

#[test]
fn con_un_server_nuovo_si_riparte_da_zero_senza_copie() {
    // DEC-105: l'archivio del server è cambiato, i dispositivi rimandano tutto.
    let (mut a, mut b, mut vecchio) = due();
    let id = nota(&mut a, "Riunione", "ordine del giorno", None);
    a.sincronizza(&mut vecchio);
    b.sincronizza(&mut vecchio);
    b.passa(10);
    scrivi(&mut b, &id, "ordine del giorno, rivisto");
    b.sincronizza(&mut vecchio);
    a.sincronizza(&mut vecchio);

    let mut nuovo = Server::default();
    for d in [&mut a, &mut b] {
        d.a.azzera_sinc().unwrap();
        d.visto = 0;
    }
    a.sincronizza(&mut nuovo);
    b.sincronizza(&mut nuovo);
    a.sincronizza(&mut nuovo);
    assert!(nuovo.attuali.contains_key(&id));
    for d in [&mut a, &mut b] {
        assert_eq!(d.titoli(), vec!["Riunione"]);
        assert_eq!(d.a.leggi(&id).unwrap().contenuto, "ordine del giorno, rivisto");
        assert!(d.a.da_inviare().unwrap().is_empty());
    }
}

#[test]
fn con_un_server_nuovo_gli_elementi_solo_ricevuti_partono_una_volta_sola() {
    // TC-103 (07/10/2026): un elemento nato sull'altro dispositivo e solo ricevuto qui non ha
    // l'ora della modifica locale; dopo l'azzeramento partiva a ogni giro, senza fine.
    let (mut a, mut b, mut vecchio) = due();
    b.a.crea_cartella("", Some("Offline"), SeEsiste::Chiedi).unwrap();
    let id = nota(&mut b, "Nata su B", "testo", Some("Offline"));
    b.a.aggiungi_tag(&id, "senza-rete").unwrap();
    b.sincronizza(&mut vecchio);
    a.sincronizza(&mut vecchio);

    let mut nuovo = Server::default();
    for d in [&mut a, &mut b] {
        d.a.azzera_sinc().unwrap();
        d.visto = 0;
    }
    a.sincronizza(&mut nuovo);
    b.sincronizza(&mut nuovo);
    a.sincronizza(&mut nuovo);
    let versioni: Vec<i64> = nuovo.attuali.values().map(|(v, _, _)| *v).collect();
    for d in [&mut a, &mut b] {
        assert!(d.a.da_inviare().unwrap().is_empty());
        assert_eq!(d.titoli(), vec!["Nata su B"]);
    }
    // Un altro giro non manda niente: le versioni sul server restano quelle.
    a.sincronizza(&mut nuovo);
    b.sincronizza(&mut nuovo);
    assert_eq!(nuovo.attuali.values().map(|(v, _, _)| *v).collect::<Vec<_>>(), versioni);
}

#[test]
fn il_primo_giro_cifrato_rimanda_tutto_una_volta_sola() {
    // CA-10.13: al primo accesso cifrato ogni elemento riparte, anche quelli solo ricevuti, e
    // dopo l'invio non resta niente da mandare (niente giri senza fine).
    let (mut a, mut b, mut s) = due();
    a.a.crea_cartella("", Some("Lavoro"), SeEsiste::Chiedi).unwrap();
    let id = nota(&mut a, "Riunione", "testo", Some("Lavoro"));
    a.a.aggiungi_tag(&id, "lavoro").unwrap();
    a.sincronizza(&mut s);
    b.sincronizza(&mut s);
    let sul_server = s.attuali.len();
    b.a.segna_tutto_da_inviare().unwrap();
    assert_eq!(b.a.da_inviare().unwrap().len(), sul_server);
    b.sincronizza(&mut s);
    assert!(b.a.da_inviare().unwrap().is_empty());
    assert!(s.attuali.values().all(|(v, _, _)| *v == 2));
    a.sincronizza(&mut s);
    assert_eq!(a.a.leggi(&id).unwrap().contenuto, "testo");
    assert!(a.a.da_inviare().unwrap().is_empty());
}
