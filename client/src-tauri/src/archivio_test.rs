// Prove dell'archivio, portate da `api/src/archivio.test.ts`, `cartelle.test.ts`, `tag.test.ts`
// e dai casi di `app.test.ts` che verificano regole dell'archivio (codici, conflitto, cestino).
// Ogni prova lavora in una cartella temporanea sua, cancellata alla fine.

use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use chrono::{DateTime, Duration, Utc};

use super::*;

// ——— Appoggio ———

/// Cartella temporanea, orologio finto e archivio aperto; alla fine si chiude tutto e la
/// cartella sparisce.
struct Prova {
    cartella: PathBuf,
    orologio: Arc<Mutex<DateTime<Utc>>>,
    archivio: Option<Archivio>,
}

impl Prova {
    fn nuova(inizio: &str) -> Self {
        let cartella = std::env::temp_dir().join(format!("memodu-{}", uuid::Uuid::new_v4()));
        let orologio = Arc::new(Mutex::new(inizio.parse::<DateTime<Utc>>().unwrap()));
        let mut prova = Prova { cartella, orologio, archivio: None };
        prova.archivio = Some(prova.apri(&prova.cartella.clone()));
        prova
    }

    fn apri(&self, dove: &Path) -> Archivio {
        self.prova_ad_aprire(dove).expect("l'archivio si apre")
    }

    fn prova_ad_aprire(&self, dove: &Path) -> Esito<Archivio> {
        let orologio = Arc::clone(&self.orologio);
        Archivio::con_orologio(dove, Box::new(move || *orologio.lock().unwrap()))
    }

    fn a(&mut self) -> &mut Archivio {
        self.archivio.as_mut().expect("archivio aperto")
    }

    fn chiudi(&mut self) {
        self.archivio = None;
    }

    fn riapri(&mut self) {
        self.archivio = Some(self.apri(&self.cartella.clone()));
    }

    fn passa(&self, secondi: i64) {
        let mut adesso = self.orologio.lock().unwrap();
        *adesso += Duration::seconds(secondi);
    }

    fn file(&self) -> PathBuf {
        self.cartella.join(FILE_DATABASE)
    }

    /// Crea una cartella e ne dà il percorso.
    fn cartella(&mut self, genitore: &str, nome: &str) -> String {
        self.a().crea_cartella(genitore, Some(nome), SeEsiste::Chiedi).unwrap().cartella.percorso
    }

    /// Crea le cartelle date come percorsi completi, nell'ordine.
    fn cartelle(&mut self, percorsi: &[&str]) {
        for p in percorsi {
            self.cartella(&padre(p), p.rsplit('/').next().unwrap());
        }
    }

    fn radice(&mut self) -> Vec<Cartella> {
        self.a().albero().unwrap().cartelle
    }

    fn crea(&mut self, titolo: &str, contenuto: &str, cartella: &str) -> Nota {
        self.a().crea(&nota(titolo, contenuto, cartella)).unwrap()
    }
}

impl Drop for Prova {
    fn drop(&mut self) {
        self.archivio = None;
        let _ = std::fs::remove_dir_all(&self.cartella);
    }
}

fn prova() -> Prova {
    Prova::nuova("2026-09-28T08:00:00Z")
}

fn nota(titolo: &str, contenuto: &str, cartella: &str) -> DatiNuovaNota {
    DatiNuovaNota {
        titolo: Some(titolo.into()),
        contenuto: Some(contenuto.into()),
        cartella: Some(cartella.into()),
    }
}

fn titolo(titolo: &str) -> DatiNota {
    DatiNota { titolo: Some(titolo.into()), contenuto: None }
}

fn contenuto(contenuto: &str) -> DatiNota {
    DatiNota { titolo: None, contenuto: Some(contenuto.into()) }
}

fn nomi(cartelle: &[Cartella]) -> Vec<String> {
    cartelle.iter().map(|c| c.nome.clone()).collect()
}

fn titoli(voci: &[VoceElenco]) -> Vec<String> {
    voci.iter().map(|v| v.titolo.clone()).collect()
}

/// L'albero dei soli nomi, come `{ nome: [figlie] }` nelle prove TypeScript.
fn forma(cartelle: &[Cartella]) -> String {
    cartelle
        .iter()
        .map(|c| format!("{}[{}]", c.nome, forma(&c.cartelle)))
        .collect::<Vec<_>>()
        .join(",")
}

fn nota_ripristinata(esito: Ripristinato) -> Nota {
    match esito {
        Ripristinato::Nota(n) => n,
        altro => panic!("atteso una nota, arrivato {altro:?}"),
    }
}

fn cartella_ripristinata(esito: Ripristinato) -> EsitoCartella {
    match esito {
        Ripristinato::Cartella(c) => c,
        altro => panic!("attesa una cartella, arrivato {altro:?}"),
    }
}

/// L'errore come arriva all'interfaccia.
fn json(errore: &Errore) -> serde_json::Value {
    serde_json::to_value(errore).unwrap()
}

// ——— Database (DEC-46, DEC-48) ———

#[test]
fn crea_il_file_del_database_e_la_cartella_se_non_esiste() {
    let p = prova();
    let sotto = p.cartella.join("sotto");
    let _a = p.apri(&sotto);
    assert!(sotto.join(FILE_DATABASE).exists());
}

#[test]
fn segna_la_versione_dello_schema() {
    let mut p = prova();
    p.chiudi();
    let db = Connection::open(p.file()).unwrap();
    let versione: i64 = db.pragma_query_value(None, "user_version", |r| r.get(0)).unwrap();
    // Schema 4: sincronizzazione (DEC-75, DEC-76), impostazioni (DEC-91) e indice di ricerca (DEC-95).
    assert_eq!(versione, 4);
}

#[test]
fn una_copia_di_lavoro_con_lo_schema_2_riceve_le_impostazioni() {
    let mut p = prova();
    p.chiudi();
    let db = Connection::open(p.file()).unwrap();
    db.execute_batch(
        "DROP TRIGGER sinc_impostazioni_INSERT; DROP TRIGGER sinc_impostazioni_UPDATE;
         DROP TRIGGER sinc_impostazioni_DELETE; DROP TABLE impostazioni; DROP TABLE dispositivo;
         DROP TRIGGER ricerca_note_INSERT; DROP TRIGGER ricerca_note_UPDATE; DROP TRIGGER ricerca_note_DELETE;
         DROP TRIGGER ricerca_note_tag_INSERT; DROP TRIGGER ricerca_note_tag_DELETE; DROP TRIGGER ricerca_tag_UPDATE;
         DROP TABLE ricerca;
         PRAGMA user_version = 2;",
    )
    .unwrap();
    drop(db);
    let mut a = p.apri(&p.cartella.clone());
    a.imposta_scorciatoia(super::impostazioni::Sistema::Windows, Some("Control+Shift+KeyM")).unwrap();
    assert_eq!(
        a.scorciatoia(super::impostazioni::Sistema::Windows).unwrap().as_deref(),
        Some("Control+Shift+KeyM")
    );
    assert_eq!(a.da_inviare().unwrap().iter().filter(|b| b.id == super::impostazioni::ID).count(), 1);
}

#[test]
fn tornato_scrivibile_il_file_riprende_a_salvare_senza_riavviare_riconnessione() {
    let mut p = prova();
    p.chiudi();
    let file = p.file();
    let permessi = |sola_lettura: bool| {
        let mut permessi = std::fs::metadata(&file).unwrap().permissions();
        #[allow(clippy::permissions_set_readonly_false)]
        permessi.set_readonly(sola_lettura);
        std::fs::set_permissions(&file, permessi).unwrap();
    };
    permessi(true);
    let aperto = p.prova_ad_aprire(&p.cartella.clone());
    let esito = aperto.map(|mut a| {
        let rifiuto = a.crea(&nota("non entra", "", ""));
        (a, rifiuto)
    });
    permessi(false);
    let (mut a, rifiuto) = esito.expect("in sola lettura l'archivio si apre comunque");
    match rifiuto {
        Err(Errore::Database(errore)) => assert!(sola_lettura(&errore), "{errore}"),
        altro => panic!("atteso SQLITE_READONLY, arrivato {altro:?}"),
    }
    assert_eq!(a.crea(&nota("entra", "", "")).unwrap().titolo, "entra");
}

#[test]
fn ritrova_le_note_riaprendo_il_database() {
    let mut p = prova();
    let nota = p.crea("Lista della spesa", "- <u>pane</u>", "");
    p.chiudi();
    p.riapri();
    assert_eq!(p.a().leggi(&nota.id).unwrap(), nota);
}

// ——— Creazione (RB-01, RB-10) ———

#[test]
fn crea_una_nota_vuota_con_id_uuid_e_le_date_uguali() {
    let mut p = prova();
    let nota = p.a().crea(&DatiNuovaNota::default()).unwrap();
    assert!(Regex::new(r"^[0-9a-f-]{36}$").unwrap().is_match(&nota.id));
    assert_eq!(nota.titolo, "");
    assert_eq!(nota.contenuto, "");
    assert_eq!(nota.creata, nota.modificata);
    assert_eq!(nota.cartella, "");
}

#[test]
fn ammette_titoli_ripetuti_rb_16() {
    let mut p = prova();
    p.crea("Idee", "", "");
    p.crea("Idee", "", "");
    assert_eq!(titoli(&p.a().elenca().unwrap()), ["Idee", "Idee"]);
}

// ——— Nomi delle cartelle (RB-63) ———

#[test]
fn sostituisce_i_caratteri_vietati_e_rende_validi_i_nomi_riservati() {
    assert_eq!(base_nome("Piano: a/b \"c\"?"), "Piano- a-b -c--");
    assert_eq!(base_nome("fine. "), "fine");
    assert_eq!(base_nome("CON"), "CON-");
    assert_eq!(base_nome("   "), "Senza titolo");
    assert_eq!(base_nome(&"x".repeat(300)).chars().count(), 100);
    let con_razzo = format!("{}🚀", "a".repeat(99));
    assert_eq!(base_nome(&con_razzo), con_razzo);
    assert_eq!(base_nome("📁 Progetti 🚀"), "📁 Progetti 🚀");
}

// ——— Salvataggio (RB-06) ———

#[test]
fn aggiorna_contenuto_e_data_di_modifica_non_la_data_di_creazione() {
    let mut p = prova();
    let nota = p.crea("T", "uno", "");
    p.passa(5);
    let salvata = p.a().salva(&nota.id, &contenuto("due")).unwrap();
    assert_eq!(salvata.titolo, "T");
    assert_eq!(salvata.contenuto, "due");
    assert_eq!(salvata.creata, nota.creata);
    assert_eq!(salvata.modificata, "2026-09-28T08:00:05.000Z");
    assert_eq!(p.a().leggi(&nota.id).unwrap(), salvata);
}

#[test]
fn cambia_il_titolo_senza_cambiare_l_id() {
    let mut p = prova();
    let nota = p.crea("Bozza", "", "");
    let salvata = p.a().salva(&nota.id, &titolo("Definitiva")).unwrap();
    assert_eq!(salvata.id, nota.id);
    assert_eq!(salvata.titolo, "Definitiva");
}

#[test]
fn segnala_una_nota_che_non_esiste() {
    let mut p = prova();
    assert!(matches!(
        p.a().salva("manca", &contenuto("x")),
        Err(Errore::NotaNonTrovata { .. })
    ));
    assert!(matches!(p.a().leggi("manca"), Err(Errore::NotaNonTrovata { .. })));
}

// ——— Elenco (RB-60, RB-15) ———

#[test]
fn ordina_per_ultima_modifica_la_piu_recente_in_cima() {
    let mut p = prova();
    let a = p.crea("A", "", "");
    p.passa(1);
    p.crea("B", "", "");
    p.passa(1);
    p.a().salva(&a.id, &contenuto("modificata")).unwrap();
    assert_eq!(titoli(&p.a().elenca().unwrap()), ["A", "B"]);
}

#[test]
fn da_le_prime_parole_senza_simboli_markdown() {
    assert_eq!(
        anteprima("## Titolo\n- [ ] **comprare** il <u>latte</u>\n1. ~~pane~~"),
        "Titolo comprare il latte pane"
    );
    assert!(anteprima(&"parola ".repeat(30)).chars().count() <= 80);
}

#[test]
fn e_vuoto_con_un_database_nuovo() {
    let mut p = prova();
    assert_eq!(p.a().elenca().unwrap(), []);
}

// ——— Albero (RB-56, RB-64, RB-65) ———

#[test]
fn mette_sottocartelle_e_note_in_ordine_alfabetico_e_conta_le_note_delle_sottocartelle() {
    let mut p = prova();
    p.cartella("", "Lavoro");
    p.cartella("Lavoro", "progetti");
    p.cartella("Lavoro", "Clienti");
    p.crea("budget", "", "Lavoro");
    p.crea("Agenda", "", "Lavoro");
    p.crea("Rossi", "", "Lavoro/Clienti");
    p.crea("Radice", "", "");

    let albero = p.a().albero().unwrap();
    assert_eq!(albero.non_organizzate.conteggio, 1);
    let lavoro = &albero.cartelle[0];
    assert_eq!(nomi(&lavoro.cartelle), ["Clienti", "progetti"]);
    assert_eq!(lavoro.cartelle[0].percorso, "Lavoro/Clienti");
    assert_eq!(lavoro.cartelle[0].conteggio, 1);
    assert_eq!(titoli(&lavoro.note), ["Agenda", "budget"]);
    assert_eq!(lavoro.conteggio, 3);
}

#[test]
fn non_conta_le_note_eliminate() {
    let mut p = prova();
    p.cartella("", "Lavoro");
    let nota = p.crea("Via", "", "Lavoro");
    p.a().cestina_nota(&nota.id).unwrap();
    let albero = p.a().albero().unwrap();
    assert_eq!(nomi(&albero.cartelle), ["Lavoro"]);
    assert_eq!(albero.cartelle[0].conteggio, 0);
    assert_eq!(albero.cestino, 1);
}

#[test]
fn l_elenco_resta_sulle_sole_non_organizzate() {
    let mut p = prova();
    p.cartella("", "Lavoro");
    p.crea("Dentro", "", "Lavoro");
    p.crea("Fuori", "", "");
    assert_eq!(titoli(&p.a().elenca().unwrap()), ["Fuori"]);
}

// ——— Note nelle cartelle ———

#[test]
fn crea_la_nota_nella_sottocartella_e_la_ritrova_per_id_rb_09() {
    let mut p = prova();
    p.cartella("", "Lavoro");
    let nota = p.crea("Budget", "", "Lavoro");
    assert_eq!(nota.cartella, "Lavoro");
    let letta = p.a().leggi(&nota.id).unwrap();
    assert_eq!((letta.titolo.as_str(), letta.cartella.as_str()), ("Budget", "Lavoro"));
    let salvata = p.a().salva(&nota.id, &titolo("Budget 2026")).unwrap();
    assert_eq!(salvata.cartella, "Lavoro");
}

#[test]
fn trova_la_cartella_senza_distinguere_le_maiuscole() {
    let mut p = prova();
    p.cartella("", "Lavoro");
    let dati = DatiNuovaNota { cartella: Some("lavoro".into()), ..Default::default() };
    assert_eq!(p.a().crea(&dati).unwrap().cartella, "Lavoro");
}

#[test]
fn rifiuta_una_cartella_che_non_esiste() {
    let mut p = prova();
    let dati = DatiNuovaNota { cartella: Some("Manca".into()), ..Default::default() };
    assert!(matches!(p.a().crea(&dati), Err(Errore::CartellaNonTrovata(_))));
}

#[test]
fn sposta_la_nota_senza_cambiare_la_data_di_modifica_anche_con_un_titolo_gia_presente() {
    let mut p = prova();
    p.cartella("", "Lavoro");
    p.crea("Idee", "", "Lavoro");
    let nota = p.crea("Idee", "", "");
    p.passa(10);
    let spostata = p.a().sposta_nota(&nota.id, "Lavoro").unwrap();
    assert_eq!(spostata.cartella, "Lavoro");
    assert_eq!(spostata.modificata, nota.modificata);
    assert_eq!(titoli(&p.radice()[0].note), ["Idee", "Idee"]);
    p.a().sposta_nota(&nota.id, "").unwrap();
    assert_eq!(p.a().leggi(&nota.id).unwrap().cartella, "");
}

// ——— Cartelle (RB-23, RB-24, RB-31, RB-48, RB-63) ———

#[test]
fn da_il_nome_nuova_cartella_con_un_numero_se_c_e_gia() {
    let mut p = prova();
    let prima = p.a().crea_cartella("", None, SeEsiste::Chiedi).unwrap();
    assert_eq!(prima.cartella.nome, "Nuova cartella");
    let seconda = p.a().crea_cartella("", None, SeEsiste::Chiedi).unwrap();
    assert_eq!(seconda.cartella.nome, "Nuova cartella (2)");
    // Scritto a mano non è più il nome proposto: con un omonimo compare la finestra (CA-05.7).
    assert!(matches!(
        p.a().crea_cartella("", Some("Nuova cartella"), SeEsiste::Chiedi),
        Err(Errore::NomeEsistente(_))
    ));
}

#[test]
fn sostituisce_i_caratteri_vietati_e_rifiuta_un_nome_vuoto() {
    let mut p = prova();
    assert_eq!(p.cartella("", "Idee: 2026?"), "Idee- 2026-");
    assert!(matches!(
        p.a().crea_cartella("", Some("  "), SeEsiste::Chiedi),
        Err(Errore::PercorsoNonValido(_))
    ));
}

#[test]
fn chiede_se_il_nome_esiste_gia_anche_con_maiuscole_diverse_e_lettere_accentate() {
    let mut p = prova();
    p.cartella("", "Clienti");
    match p.a().crea_cartella("", Some("clienti"), SeEsiste::Chiedi) {
        Err(Errore::NomeEsistente(conflitto)) => assert_eq!(conflitto, "Clienti"),
        altro => panic!("atteso NomeEsistente, arrivato {altro:?}"),
    }
    let numerata = p.a().crea_cartella("", Some("clienti"), SeEsiste::Numero).unwrap();
    assert_eq!(numerata.cartella.nome, "clienti (2)");
    p.cartella("", "Èventi");
    assert!(matches!(
        p.a().crea_cartella("", Some("èventi"), SeEsiste::Chiedi),
        Err(Errore::NomeEsistente(_))
    ));
}

#[test]
fn rinomina_anche_cambiando_solo_maiuscole_e_minuscole() {
    let mut p = prova();
    p.cartella("", "idee");
    p.crea("Una", "", "idee");
    p.a().rinomina_cartella("idee", "Idee", SeEsiste::Chiedi).unwrap();
    assert_eq!(nomi(&p.radice()), ["Idee"]);
    let esito = p.a().rinomina_cartella("Idee", "Progetti", SeEsiste::Chiedi).unwrap();
    assert_eq!(esito.cartella.nome, "Progetti");
    assert_eq!(esito.cartella.percorso, "Progetti");
    assert_eq!(esito.cartella.conteggio, 1);
}

#[test]
fn sposta_una_cartella_con_il_contenuto() {
    let mut p = prova();
    p.cartella("", "Lavoro");
    p.cartella("", "Personale");
    p.cartella("Personale", "Idee");
    p.crea("Una", "", "Personale/Idee");
    let esito = p.a().sposta_cartella("Personale/Idee", "Lavoro", SeEsiste::Chiedi, false).unwrap();
    assert_eq!(esito.cartella.percorso, "Lavoro/Idee");
    assert_eq!(esito.cartella.conteggio, 1);
    let radice = p.radice();
    let personale = radice.iter().find(|c| c.nome == "Personale").unwrap();
    assert_eq!(personale.cartelle, []);
}

#[test]
fn non_sposta_una_cartella_dentro_se_stessa_o_una_sua_sottocartella() {
    let mut p = prova();
    p.cartella("", "Lavoro");
    p.cartella("Lavoro", "Clienti");
    assert!(matches!(
        p.a().sposta_cartella("Lavoro", "Lavoro/Clienti", SeEsiste::Chiedi, false),
        Err(Errore::SpostamentoImpossibile)
    ));
    assert!(matches!(
        p.a().sposta_cartella("Lavoro", "lavoro", SeEsiste::Chiedi, false),
        Err(Errore::SpostamentoImpossibile)
    ));
}

#[test]
fn unisce_note_insieme_sottocartelle_omonime_da_risolvere_origine_tolta_se_vuota() {
    let mut p = prova();
    p.cartella("", "A");
    p.cartella("A", "Archivio");
    p.cartella("A", "Solo in A");
    p.crea("Nota", "", "A");
    p.cartella("", "B");
    p.cartella("B", "archivio");
    p.crea("Nota", "", "B");

    let esito = p.a().rinomina_cartella("A", "b", SeEsiste::Unisci).unwrap();
    assert_eq!(esito.cartella.percorso, "B");
    assert_eq!(esito.da_risolvere, ["A/Archivio"]);
    assert_eq!(nomi(&esito.cartella.cartelle), ["archivio", "Solo in A"]);
    assert_eq!(titoli(&esito.cartella.note), ["Nota", "Nota"]);

    // L'app risolve la sottocartella rimasta: con da_unione, «A» sparisce quando si svuota.
    let secondo = p.a().sposta_cartella("A/Archivio", "B", SeEsiste::Unisci, true).unwrap();
    assert_eq!(secondo.da_risolvere, Vec::<String>::new());
    assert_eq!(nomi(&p.radice()), ["B"]);
}

#[test]
fn unendo_l_origine_sparisce_anche_se_ha_elementi_nel_cestino_che_restano_ripristinabili() {
    let mut p = prova();
    p.cartella("", "A");
    p.cartella("", "B");
    let via = p.crea("Via", "", "A");
    p.crea("Resta", "", "A");
    p.a().cestina_nota(&via.id).unwrap();
    p.a().rinomina_cartella("A", "B", SeEsiste::Unisci).unwrap();
    let radice: Vec<String> =
        p.radice().iter().map(|c| format!("{} {}", c.nome, c.conteggio)).collect();
    assert_eq!(radice, ["B 1"]);
    let cestino: Vec<String> = p.a().elenca_cestino().unwrap().into_iter().map(|e| e.nome).collect();
    assert_eq!(cestino, ["Via"]);
    let ripristinata = nota_ripristinata(p.a().ripristina(&via.id, SeEsiste::Chiedi).unwrap());
    assert_eq!(ripristinata.cartella, "");
}

#[test]
fn ripristinando_con_unisci_non_resta_la_cartella_di_appoggio_numerata() {
    let mut p = prova();
    p.cartella("", "Clienti");
    p.cartella("Clienti", "Archivio");
    let vecchia = p.crea("Vecchia", "", "Clienti/Archivio");
    p.a().cestina_nota(&vecchia.id).unwrap();
    let c = p.a().cestina_cartella("Clienti").unwrap();
    p.cartella("", "clienti");
    p.cartella("clienti", "Archivio");
    let esito = cartella_ripristinata(p.a().ripristina(&c.id, SeEsiste::Unisci).unwrap());
    assert_eq!(esito.da_risolvere, ["Clienti (2)/Archivio"]);
    p.a().sposta_cartella("Clienti (2)/Archivio", "clienti", SeEsiste::Unisci, true).unwrap();
    assert_eq!(nomi(&p.radice()), ["clienti"]);
}

#[test]
fn rifiuta_percorsi_non_validi() {
    let mut p = prova();
    for percorso in ["../fuori", "a//b", "a/./b"] {
        assert!(
            matches!(
                p.a().crea_cartella(percorso, Some("x"), SeEsiste::Chiedi),
                Err(Errore::PercorsoNonValido(_))
            ),
            "{percorso}"
        );
    }
    assert!(matches!(
        p.a().rinomina_cartella("", "x", SeEsiste::Chiedi),
        Err(Errore::PercorsoNonValido(_))
    ));
}

#[test]
fn segnala_una_cartella_eliminata_nel_frattempo() {
    let mut p = prova();
    p.cartella("", "Lavoro");
    p.a().cestina_cartella("Lavoro").unwrap();
    assert!(matches!(
        p.a().rinomina_cartella("Lavoro", "X", SeEsiste::Chiedi),
        Err(Errore::CartellaNonTrovata(_))
    ));
}

// ——— Cestino (RB-25 … RB-28, RB-32, RB-55) ———

#[test]
fn elenca_con_provenienza_e_data_il_piu_recente_in_cima() {
    let mut p = prova();
    p.cartella("", "Lavoro");
    p.cartella("Lavoro", "Clienti");
    let nota = p.crea("Riunione", "", "Lavoro/Clienti");
    p.crea("Dentro", "", "Lavoro/Clienti");
    p.a().cestina_nota(&nota.id).unwrap();
    p.passa(60);
    p.a().cestina_cartella("Lavoro/Clienti").unwrap();

    let elementi = p.a().elenca_cestino().unwrap();
    assert_eq!(elementi.len(), 2);
    let cartella = &elementi[0];
    assert_eq!(
        (cartella.tipo, cartella.nome.as_str(), cartella.provenienza.as_str(), cartella.conteggio),
        ("cartella", "Clienti", "Lavoro", Some(1))
    );
    let nota = &elementi[1];
    assert_eq!(
        (nota.tipo, nota.nome.as_str(), nota.provenienza.as_str()),
        ("nota", "Riunione", "Lavoro/Clienti")
    );
    assert_eq!(nota.eliminato, "2026-09-28T08:00:00.000Z");
    assert_eq!(p.radice()[0].cartelle, []);
}

#[test]
fn una_nota_non_trovata_perche_nel_cestino_dice_quale_elemento_ripristinare() {
    let mut p = prova();
    p.cartella("", "Lavoro");
    p.cartella("Lavoro", "Clienti");
    let sola = p.crea("Sola", "", "");
    let dentro = p.crea("Dentro", "", "Lavoro/Clienti");
    p.a().cestina_nota(&sola.id).unwrap();
    let clienti = p.a().cestina_cartella("Lavoro/Clienti").unwrap();
    match p.a().salva(&sola.id, &contenuto("x")) {
        Err(Errore::NotaNonTrovata { cestino, .. }) => assert_eq!(cestino, Some(sola.id.clone())),
        altro => panic!("atteso NotaNonTrovata, arrivato {altro:?}"),
    }
    match p.a().salva(&dentro.id, &contenuto("x")) {
        Err(Errore::NotaNonTrovata { cestino, .. }) => assert_eq!(cestino, Some(clienti.id)),
        altro => panic!("atteso NotaNonTrovata, arrivato {altro:?}"),
    }
    p.a().elimina_definitivamente(&sola.id).unwrap();
    match p.a().leggi(&sola.id) {
        Err(Errore::NotaNonTrovata { cestino, .. }) => assert_eq!(cestino, None),
        altro => panic!("atteso NotaNonTrovata, arrivato {altro:?}"),
    }
}

#[test]
fn le_note_di_una_cartella_eliminata_non_si_aprono_piu() {
    let mut p = prova();
    p.cartella("", "Lavoro");
    let nota = p.crea("Dentro", "", "Lavoro");
    p.a().cestina_cartella("Lavoro").unwrap();
    assert!(matches!(p.a().leggi(&nota.id), Err(Errore::NotaNonTrovata { .. })));
}

#[test]
fn ripristina_nella_radice_la_nota_tra_le_non_organizzate_la_cartella_al_primo_livello() {
    let mut p = prova();
    p.cartella("", "Lavoro");
    p.cartella("Lavoro", "Clienti");
    let nota = p.crea("Riunione", "", "Lavoro");
    let n = p.a().cestina_nota(&nota.id).unwrap();
    let c = p.a().cestina_cartella("Lavoro/Clienti").unwrap();

    let ripristinata = nota_ripristinata(p.a().ripristina(&n.id, SeEsiste::Chiedi).unwrap());
    assert_eq!((ripristinata.id, ripristinata.cartella), (nota.id, String::new()));
    let cartella = cartella_ripristinata(p.a().ripristina(&c.id, SeEsiste::Chiedi).unwrap());
    assert_eq!(cartella.cartella.percorso, "Clienti");
    assert_eq!(p.a().elenca_cestino().unwrap(), []);
}

#[test]
fn ripristinando_una_cartella_con_un_nome_gia_usato_segue_rb_31() {
    let mut p = prova();
    p.cartella("", "Clienti");
    p.crea("Vecchia", "", "Clienti");
    let c = p.a().cestina_cartella("Clienti").unwrap();
    p.cartella("", "clienti");
    assert!(matches!(p.a().ripristina(&c.id, SeEsiste::Chiedi), Err(Errore::NomeEsistente(_))));
    let esito = cartella_ripristinata(p.a().ripristina(&c.id, SeEsiste::Unisci).unwrap());
    assert_eq!(esito.cartella.percorso, "clienti");
    assert_eq!(esito.cartella.conteggio, 1);
    assert_eq!(nomi(&p.radice()), ["clienti"]);
    assert_eq!(p.a().elenca_cestino().unwrap(), []);
}

#[test]
fn elimina_per_sempre_un_elemento_e_svuota_il_cestino() {
    let mut p = prova();
    let a = p.crea("A", "", "");
    let a = p.a().cestina_nota(&a.id).unwrap();
    let b = p.crea("B", "", "");
    p.a().cestina_nota(&b.id).unwrap();
    p.a().elimina_definitivamente(&a.id).unwrap();
    let cestino: Vec<String> = p.a().elenca_cestino().unwrap().into_iter().map(|e| e.nome).collect();
    assert_eq!(cestino, ["B"]);
    p.a().svuota_cestino().unwrap();
    assert_eq!(p.a().elenca_cestino().unwrap(), []);
    assert!(matches!(p.a().elimina_definitivamente(&a.id), Err(Errore::ElementoNonTrovato(_))));
}

#[test]
fn cancellando_per_sempre_una_cartella_gli_elementi_eliminati_a_parte_restano_nel_cestino() {
    let mut p = prova();
    p.cartella("", "Lavoro");
    p.cartella("Lavoro", "Clienti");
    let sola = p.crea("Sola", "", "Lavoro");
    let dentro = p.crea("Dentro", "", "Lavoro");
    p.a().cestina_nota(&sola.id).unwrap();
    p.a().cestina_cartella("Lavoro/Clienti").unwrap();
    let lavoro = p.a().cestina_cartella("Lavoro").unwrap();
    p.a().elimina_definitivamente(&lavoro.id).unwrap();

    let mut cestino: Vec<String> =
        p.a().elenca_cestino().unwrap().into_iter().map(|e| e.nome).collect();
    cestino.sort();
    assert_eq!(cestino, ["Clienti", "Sola"]);
    assert!(matches!(p.a().leggi(&dentro.id), Err(Errore::NotaNonTrovata { .. })));
    let ripristinata = nota_ripristinata(p.a().ripristina(&sola.id, SeEsiste::Chiedi).unwrap());
    assert_eq!(ripristinata.cartella, "");
}

// ——— Note vuote (RB-10, DEC-39) ———

#[test]
fn cancella_per_sempre_una_nota_vuota_non_una_con_del_testo() {
    let mut p = prova();
    let vuota = p.crea("  ", "\n", "");
    let piena = p.crea("", "x", "");
    p.a().elimina_se_vuota(&vuota.id).unwrap();
    assert!(matches!(p.a().elimina_se_vuota(&piena.id), Err(Errore::NotaNonVuota)));
    let ids: Vec<String> = p.a().elenca().unwrap().into_iter().map(|v| v.id).collect();
    assert_eq!(ids, [piena.id]);
    assert_eq!(p.a().elenca_cestino().unwrap(), []);
}

// ——— Unione su più livelli (RB-31, CA-05.7, CA-15.5) ———

#[test]
fn spostando_e_unendo_livello_per_livello_non_restano_cartelle_di_partenza_vuote() {
    let mut p = prova();
    p.cartelle(&["A", "A/X", "A/X/Y", "B", "B/A", "B/A/X", "B/A/X/Y", "Vuota"]);
    p.crea("n", "t", "A/X/Y");
    let esito = p.a().sposta_cartella("A", "B", SeEsiste::Unisci, false).unwrap();
    assert_eq!(esito.da_risolvere, ["A/X"]);
    let esito = p.a().sposta_cartella("A/X", "B/A", SeEsiste::Unisci, true).unwrap();
    assert_eq!(esito.da_risolvere, ["A/X/Y"]);
    p.a().sposta_cartella("A/X/Y", "B/A/X", SeEsiste::Unisci, true).unwrap();
    assert_eq!(forma(&p.radice()), "B[A[X[Y[]]]],Vuota[]");
}

#[test]
fn ripristinando_con_unisci_non_resta_la_cartella_provvisoria_vuota() {
    let mut p = prova();
    p.cartelle(&["I", "I/Ar", "I/Ar/25"]);
    let elemento = p.a().cestina_cartella("I").unwrap();
    p.cartelle(&["I", "I/Ar", "I/Ar/25"]);
    let esito = cartella_ripristinata(p.a().ripristina(&elemento.id, SeEsiste::Unisci).unwrap());
    let passo =
        p.a().sposta_cartella(&esito.da_risolvere[0], "I", SeEsiste::Unisci, true).unwrap();
    let passo =
        p.a().sposta_cartella(&passo.da_risolvere[0], "I/Ar", SeEsiste::Unisci, true).unwrap();
    assert_eq!(passo.da_risolvere, Vec::<String>::new());
    assert_eq!(forma(&p.radice()), "I[Ar[25[]]]");
}

#[test]
fn la_cartella_che_conteneva_quella_spostata_resta_anche_se_vuota() {
    let mut p = prova();
    p.cartelle(&["Progetti", "Progetti/X", "Altro", "Altro/X"]);
    p.a().sposta_cartella("Progetti/X", "Altro", SeEsiste::Unisci, false).unwrap();
    assert_eq!(forma(&p.radice()), "Altro[X[]],Progetti[]");
}

// ——— Nomi fatti solo di caratteri vietati (RB-63, CA-05.6) ———

#[test]
fn tre_punti_di_domanda_diventano_tre_trattini_non_senza_titolo() {
    let mut p = prova();
    p.cartella("", "Idee");
    let esito = p.a().rinomina_cartella("Idee", "???", SeEsiste::Chiedi).unwrap();
    assert_eq!(esito.cartella.nome, "---");
}

// ——— Nomi dei tag (RB-18, RB-22) ———

fn prova_tag() -> Prova {
    Prova::nuova("2026-09-29T08:00:00Z")
}

#[test]
fn toglie_i_barra_superflui_e_gli_spazi_ai_lati_di_ogni_livello() {
    assert_eq!(livelli_tag("  /viaggi//estate 🏖️/ ").unwrap(), ["viaggi", "estate 🏖️"]);
    assert_eq!(livelli_tag("lavoro / clienti").unwrap(), ["lavoro", "clienti"]);
}

#[test]
fn rifiuta_un_nome_di_tag_vuoto() {
    assert!(matches!(livelli_tag(" / "), Err(Errore::PercorsoNonValido(_))));
}

// ——— Tag delle note (RB-17, RB-18, RB-22, RB-49) ———

fn voce_tag(nome: &str, note: usize) -> VoceTag {
    VoceTag { nome: nome.into(), note }
}

fn nomi_tag(voci: &[VoceTag]) -> Vec<String> {
    voci.iter().map(|t| t.nome.clone()).collect()
}

#[test]
fn una_nota_nuova_non_ha_tag_ne_date_scelte() {
    let mut p = prova_tag();
    let nota = p.crea("A", "", "");
    assert_eq!(nota.tag, Vec::<String>::new());
    assert_eq!(nota.creata_scelta, None);
    assert_eq!(nota.fine_validita, None);
}

#[test]
fn aggiunge_un_tag_nuovo_con_i_livelli_che_mancano_scritti_come_la_prima_volta() {
    let mut p = prova_tag();
    let nota = p.crea("A", "", "");
    p.passa(5);
    let con = p.a().aggiungi_tag(&nota.id, "Lavoro/Clienti").unwrap();
    assert_eq!(con.tag, ["Lavoro/Clienti"]);
    assert_eq!(con.modificata, "2026-09-29T08:00:05.000Z");
    assert_eq!(
        p.a().elenca_tag().unwrap(),
        [voce_tag("Lavoro", 1), voce_tag("Lavoro/Clienti", 1)]
    );
}

#[test]
fn usa_il_tag_esistente_senza_distinguere_maiuscole_e_minuscole() {
    let mut p = prova_tag();
    let a = p.crea("A", "", "");
    let b = p.crea("B", "", "");
    p.a().aggiungi_tag(&a.id, "lavoro").unwrap();
    let con = p.a().aggiungi_tag(&b.id, "LAVORO/Clienti").unwrap();
    assert_eq!(con.tag, ["lavoro/Clienti"]);
    assert_eq!(nomi_tag(&p.a().elenca_tag().unwrap()), ["lavoro", "lavoro/Clienti"]);
}

#[test]
fn toglie_il_tag_dalla_nota_e_il_tag_resta_rb_49() {
    let mut p = prova_tag();
    let nota = p.crea("A", "", "");
    p.a().aggiungi_tag(&nota.id, "riunioni").unwrap();
    let senza = p.a().togli_tag(&nota.id, "Riunioni").unwrap();
    assert_eq!(senza.tag, Vec::<String>::new());
    assert_eq!(p.a().elenca_tag().unwrap(), [voce_tag("riunioni", 0)]);
    assert!(matches!(p.a().togli_tag(&nota.id, "manca"), Err(Errore::TagNonTrovato(_))));
}

#[test]
fn non_conta_le_note_nel_cestino() {
    let mut p = prova_tag();
    let nota = p.crea("A", "", "");
    p.a().aggiungi_tag(&nota.id, "riunioni").unwrap();
    p.a().cestina_nota(&nota.id).unwrap();
    assert_eq!(p.a().elenca_tag().unwrap(), [voce_tag("riunioni", 0)]);
}

// ——— Eliminare un tag (RB-19) ———

#[test]
fn conta_le_note_distinte_che_usano_il_tag_o_un_sotto_tag() {
    let mut p = prova_tag();
    let a = p.crea("A", "", "");
    let b = p.crea("B", "", "");
    p.a().aggiungi_tag(&a.id, "lavoro").unwrap();
    p.a().aggiungi_tag(&a.id, "lavoro/fornitori").unwrap();
    p.a().aggiungi_tag(&b.id, "lavoro/fornitori").unwrap();
    let tag = p.a().elenca_tag().unwrap();
    assert_eq!(tag.iter().find(|t| t.nome == "lavoro").map(|t| t.note), Some(2));
}

#[test]
fn toglie_il_tag_e_i_sotto_tag_da_tutte_le_note_senza_cambiarle_altrimenti() {
    let mut p = prova_tag();
    let a = p.crea("A", "", "");
    let b = p.crea("B", "", "");
    p.a().aggiungi_tag(&a.id, "lavoro").unwrap();
    p.a().aggiungi_tag(&b.id, "lavoro/fornitori").unwrap();
    p.a().aggiungi_tag(&b.id, "riunioni").unwrap();
    let prima = p.a().leggi(&b.id).unwrap().modificata;
    p.passa(60);
    p.a().elimina_tag("Lavoro").unwrap();
    assert_eq!(p.a().leggi(&a.id).unwrap().tag, Vec::<String>::new());
    let letta = p.a().leggi(&b.id).unwrap();
    assert_eq!(letta.tag, ["riunioni"]);
    assert_eq!(letta.modificata, prima);
    assert_eq!(nomi_tag(&p.a().elenca_tag().unwrap()), ["riunioni"]);
    assert!(matches!(p.a().elimina_tag("lavoro"), Err(Errore::TagNonTrovato(_))));
}

// ——— Dettagli (RF-04, RB-20, RB-21) ———

#[test]
fn salva_data_scelta_e_fine_validita_aggiorna_l_ultima_modifica_non_la_creazione() {
    let mut p = prova_tag();
    let nota = p.crea("A", "", "");
    p.passa(10);
    let dati = DatiDettagli {
        creata_scelta: Some(Some("2020-01-01".into())),
        fine_validita: Some(Some("2026-01-31".into())),
    };
    let salvata = p.a().salva_dettagli(&nota.id, &dati).unwrap();
    assert_eq!(salvata.creata_scelta.as_deref(), Some("2020-01-01"));
    assert_eq!(salvata.fine_validita.as_deref(), Some("2026-01-31"));
    assert_eq!(salvata.creata, nota.creata);
    assert_eq!(salvata.modificata, "2026-09-29T08:00:10.000Z");
    let tolta = p
        .a()
        .salva_dettagli(&nota.id, &DatiDettagli { creata_scelta: None, fine_validita: Some(None) })
        .unwrap();
    assert_eq!(tolta.creata_scelta.as_deref(), Some("2020-01-01"));
    assert_eq!(tolta.fine_validita, None);
}

#[test]
fn rifiuta_un_giorno_che_non_esiste() {
    let mut p = prova_tag();
    let nota = p.crea("A", "", "");
    for giorno in ["2026-02-30", "29/09/2026", "2026-9-1"] {
        let dati = DatiDettagli { creata_scelta: Some(Some(giorno.into())), fine_validita: None };
        assert!(
            matches!(p.a().salva_dettagli(&nota.id, &dati), Err(Errore::DataNonValida(_))),
            "{giorno}"
        );
    }
}

// ——— Regole dell'archivio viste dall'interfaccia (da app.test.ts) ———

#[test]
fn risponde_404_a_una_nota_che_non_esiste() {
    let mut p = prova();
    let id = "3f6c1b2e-9a4d-4c8e-8f1a-2b7d5e6a9c10";
    assert_eq!(p.a().leggi(id).unwrap_err().stato(), Some(404));
    assert_eq!(p.a().salva(id, &DatiNota::default()).unwrap_err().stato(), Some(404));
}

#[test]
fn crea_rinomina_e_sposta_cartelle_la_nota_porta_la_sua_cartella() {
    let mut p = prova();
    p.cartella("", "Lavoro");
    p.cartella("Lavoro", "Clienti");
    let nota = p.crea("A", "", "Lavoro");
    assert_eq!(nota.cartella, "Lavoro");
    let spostata = p.a().sposta_nota(&nota.id, "Lavoro/Clienti").unwrap();
    assert_eq!(spostata.cartella, "Lavoro/Clienti");
    let rinominata = p.a().rinomina_cartella("Lavoro", "Ufficio", SeEsiste::Chiedi).unwrap();
    assert_eq!(rinominata.cartella.percorso, "Ufficio");
    assert_eq!(rinominata.cartella.conteggio, 1);
    assert_eq!(rinominata.da_risolvere, Vec::<String>::new());
    let radice = p.radice();
    assert_eq!(nomi(&radice), ["Ufficio"]);
    assert_eq!(nomi(&radice[0].cartelle), ["Clienti"]);
}

#[test]
fn risponde_409_con_il_nome_in_conflitto_422_dentro_se_stessa_404_e_400() {
    let mut p = prova();
    p.cartella("", "Clienti");
    p.cartella("Clienti", "Sotto");
    let doppia = p.a().crea_cartella("", Some("clienti"), SeEsiste::Chiedi).unwrap_err();
    assert_eq!(doppia.stato(), Some(409));
    assert_eq!(json(&doppia)["conflitto"], "Clienti");
    let dentro =
        p.a().sposta_cartella("Clienti", "Clienti/Sotto", SeEsiste::Chiedi, false).unwrap_err();
    assert_eq!(dentro.stato(), Some(422));
    let manca = p.a().rinomina_cartella("Manca", "X", SeEsiste::Chiedi).unwrap_err();
    assert_eq!(manca.stato(), Some(404));
    let fuori = p.a().crea_cartella("../fuori", Some("X"), SeEsiste::Chiedi).unwrap_err();
    assert_eq!(fuori.stato(), Some(400));
}

#[test]
fn cestina_elenca_ripristina_ed_elimina() {
    let mut p = prova();
    let nota = p.crea("Via", "", "");
    let elemento = p.a().cestina_nota(&nota.id).unwrap();
    let cestino = p.a().elenca_cestino().unwrap();
    assert_eq!(cestino.len(), 1);
    assert_eq!(
        (cestino[0].id.as_str(), cestino[0].tipo, cestino[0].nome.as_str()),
        (elemento.id.as_str(), "nota", "Via")
    );
    let ripristinata = nota_ripristinata(p.a().ripristina(&elemento.id, SeEsiste::Chiedi).unwrap());
    assert_eq!((ripristinata.id.as_str(), ripristinata.cartella.as_str()), (nota.id.as_str(), ""));
    let di_nuovo = p.a().cestina_nota(&nota.id).unwrap();
    p.a().elimina_definitivamente(&di_nuovo.id).unwrap();
    assert_eq!(p.a().elimina_definitivamente(&di_nuovo.id).unwrap_err().stato(), Some(404));
    p.a().svuota_cestino().unwrap();
}

#[test]
fn salvando_una_nota_nel_cestino_risponde_404_con_l_elemento_da_ripristinare() {
    let mut p = prova();
    let nota = p.crea("Via", "", "");
    p.a().cestina_nota(&nota.id).unwrap();
    let errore = p.a().salva(&nota.id, &contenuto("x")).unwrap_err();
    assert_eq!(errore.stato(), Some(404));
    assert_eq!(json(&errore)["cestino"], nota.id.as_str());
}

#[test]
fn cancella_una_nota_vuota_e_risponde_409_se_non_e_vuota() {
    let mut p = prova();
    let vuota = p.a().crea(&DatiNuovaNota::default()).unwrap();
    let piena = p.crea("", "x", "");
    p.a().elimina_se_vuota(&vuota.id).unwrap();
    assert_eq!(p.a().elimina_se_vuota(&piena.id).unwrap_err().stato(), Some(409));
    assert_eq!(p.a().elimina_se_vuota(&vuota.id).unwrap_err().stato(), Some(404));
}

#[test]
fn aggiunge_e_toglie_tag_elenca_elimina_e_salva_i_dettagli() {
    let mut p = prova();
    let nota = p.crea("A", "", "");
    let con_tag = p.a().aggiungi_tag(&nota.id, "lavoro/clienti").unwrap();
    assert_eq!(con_tag.tag, ["lavoro/clienti"]);
    assert_eq!(
        p.a().elenca_tag().unwrap(),
        [voce_tag("lavoro", 1), voce_tag("lavoro/clienti", 1)]
    );
    let tolto = p.a().togli_tag(&nota.id, "lavoro/clienti").unwrap();
    assert_eq!(tolto.tag, Vec::<String>::new());
    p.a().elimina_tag("lavoro").unwrap();
    assert_eq!(p.a().elimina_tag("lavoro").unwrap_err().stato(), Some(404));
    let dettagli = DatiDettagli {
        creata_scelta: Some(Some("2020-01-01".into())),
        fine_validita: Some(None),
    };
    let salvata = p.a().salva_dettagli(&nota.id, &dettagli).unwrap();
    assert_eq!(salvata.creata_scelta.as_deref(), Some("2020-01-01"));
    assert_eq!(salvata.fine_validita, None);
    let sbagliata =
        DatiDettagli { creata_scelta: Some(Some("2026-02-30".into())), fine_validita: None };
    assert_eq!(p.a().salva_dettagli(&nota.id, &sbagliata).unwrap_err().stato(), Some(400));
    assert_eq!(p.a().aggiungi_tag(&nota.id, " / ").unwrap_err().stato(), Some(400));
}
