// Prove di Locale (RF-17, CA-17.1 … CA-17.18): una copia di lavoro e una cartella del disco in
// cartelle temporanee.

use std::fs;
use std::path::{Path, PathBuf};

use super::super::{Archivio, Errore};

struct Prova {
    dati: PathBuf,
    disco: PathBuf,
    a: Archivio,
}

impl Prova {
    fn nuova() -> Self {
        let base = std::env::temp_dir().join(format!("memodu-locale-{}", uuid::Uuid::new_v4()));
        let dati = base.join("dati");
        let disco = base.join("disco");
        fs::create_dir_all(disco.join("prove-locale").join("appunti")).unwrap();
        fs::create_dir_all(disco.join("prove-locale").join("progetto-x")).unwrap();
        fs::create_dir_all(disco.join("prove-locale").join(".git")).unwrap();
        fs::create_dir_all(disco.join("fuori")).unwrap();
        let a = Archivio::apri(&dati).unwrap();
        Prova { dati, disco, a }
    }

    fn radice(&self) -> PathBuf {
        self.disco.join("prove-locale")
    }

    fn file(&self, relativo: &str, byte: &[u8]) -> String {
        let p = self.radice().join(relativo);
        fs::write(&p, byte).unwrap();
        p.display().to_string()
    }

    fn aggiungi(&mut self) {
        let r = self.radice();
        self.a.aggiungi_cartella_locale(&r).unwrap();
    }

    fn nomi(&mut self, cartella: &Path) -> Vec<String> {
        self.a.elenca_locale(&cartella.display().to_string()).unwrap().into_iter().map(|v| v.nome).collect()
    }
}

impl Drop for Prova {
    fn drop(&mut self) {
        if let Some(base) = self.dati.parent() {
            let _ = fs::remove_dir_all(base);
        }
    }
}

#[test]
fn una_cartella_aggiunta_mostra_sottocartelle_non_nascoste_e_solo_md_e_txt() {
    // CA-17.1, RB-73, RB-75
    let mut p = Prova::nuova();
    p.file("idee.md", b"idee");
    p.file("riunione.txt", b"riunione");
    p.file("foto.jpg", b"jpg");
    p.file(".nascosto.md", b"x");
    p.aggiungi();
    let cartelle = p.a.cartelle_locali().unwrap();
    assert_eq!(cartelle.len(), 1);
    assert_eq!(cartelle[0].nome, "prove-locale");
    assert_eq!(cartelle[0].stato, "presente");
    let r = p.radice();
    assert_eq!(p.nomi(&r), vec!["idee.md", "riunione.txt", "appunti", "progetto-x"]);
}

#[test]
fn una_cartella_gia_in_locale_o_dentro_non_si_aggiunge_due_volte() {
    // CA-17.2, RB-74
    let mut p = Prova::nuova();
    p.aggiungi();
    let r = p.radice();
    assert!(matches!(p.a.aggiungi_cartella_locale(&r), Err(Errore::GiaInLocale(_))));
    assert!(matches!(p.a.aggiungi_cartella_locale(&r.join("appunti")), Err(Errore::GiaInLocale(_))));
    assert_eq!(p.a.cartelle_locali().unwrap().len(), 1);
}

#[test]
fn togliere_una_cartella_non_tocca_il_disco_e_una_cartella_sparita_e_non_trovata() {
    // CA-17.3, CA-17.4, RB-76
    let mut p = Prova::nuova();
    p.file("idee.md", b"idee");
    p.aggiungi();
    let r = p.radice();
    let spostata = p.disco.join("altrove");
    fs::rename(&r, &spostata).unwrap();
    assert_eq!(p.a.cartelle_locali().unwrap()[0].stato, "non trovata");
    fs::rename(&spostata, &r).unwrap();
    assert_eq!(p.a.cartelle_locali().unwrap()[0].stato, "presente");
    p.a.togli_cartella_locale(&r.display().to_string()).unwrap();
    assert!(p.a.cartelle_locali().unwrap().is_empty());
    assert!(r.join("idee.md").exists());
}

#[test]
fn si_salva_solo_con_ctrl_s_e_le_modifiche_restano_in_sospeso_anche_riaprendo() {
    // CA-17.5, CA-17.6, RB-77, RB-78, RB-79
    let mut p = Prova::nuova();
    let f = p.file("idee.md", b"prima");
    p.aggiungi();
    let aperto = p.a.apri_file_locale(&f).unwrap();
    assert_eq!(aperto.testo, "prima");
    assert!(!aperto.sospeso);
    p.a.sospendi_file_locale(&f, "dopo", aperto.impronta.as_deref()).unwrap();
    assert_eq!(fs::read_to_string(&f).unwrap(), "prima");
    let cartella = p.radice();
    assert!(p.a.elenca_locale(&cartella.display().to_string()).unwrap().iter().any(|v| v.nome == "idee.md" && v.sospeso));
    // Chiudere e riaprire Memodu.
    let dati = p.dati.clone();
    p.a = Archivio::apri(&dati).unwrap();
    let riaperto = p.a.apri_file_locale(&f).unwrap();
    assert!(riaperto.sospeso);
    assert_eq!(riaperto.testo, "dopo");
    assert!(!riaperto.cambiato_fuori);
    let salvato = p.a.salva_file_locale(&f, "dopo", aperto.impronta.as_deref()).unwrap();
    assert!(!salvato.convertito_in_utf8);
    assert_eq!(fs::read_to_string(&f).unwrap(), "dopo");
    assert!(!p.a.apri_file_locale(&f).unwrap().sospeso);
}

#[test]
fn a_capo_di_windows_e_bom_restano_come_erano() {
    // CA-17.7, RB-79
    let mut p = Prova::nuova();
    let crlf = p.file("windows-crlf.txt", b"uno\r\ndue\r\n");
    let bom = p.file("con-bom.md", b"\xEF\xBB\xBFtitolo\n");
    p.aggiungi();
    let a = p.a.apri_file_locale(&crlf).unwrap();
    assert_eq!(a.testo, "uno\ndue\n");
    p.a.salva_file_locale(&crlf, "uno\ndue\ntre\n", a.impronta.as_deref()).unwrap();
    assert_eq!(fs::read(&crlf).unwrap(), b"uno\r\ndue\r\ntre\r\n");
    let b = p.a.apri_file_locale(&bom).unwrap();
    assert_eq!(b.testo, "titolo\n");
    p.a.salva_file_locale(&bom, "titolo nuovo\n", b.impronta.as_deref()).unwrap();
    assert_eq!(fs::read(&bom).unwrap(), b"\xEF\xBB\xBFtitolo nuovo\n");
}

#[test]
fn un_file_in_windows_1252_si_legge_giusto_e_si_salva_in_utf_8() {
    // CA-17.8, RB-80
    let mut p = Prova::nuova();
    // «Città & Società» in Windows-1252.
    let f = p.file("vecchio-elenco.txt", b"Citt\xE0 & Societ\xE0");
    p.aggiungi();
    let a = p.a.apri_file_locale(&f).unwrap();
    assert_eq!(a.testo, "Città & Società");
    assert_eq!(a.codifica, "windows-1252");
    let s = p.a.salva_file_locale(&f, "Città & Società", a.impronta.as_deref()).unwrap();
    assert!(s.convertito_in_utf8);
    assert_eq!(fs::read_to_string(&f).unwrap(), "Città & Società");
    let di_nuovo = p.a.apri_file_locale(&f).unwrap();
    assert_eq!(di_nuovo.codifica, "utf-8");
}

#[test]
fn un_file_nuovo_nasce_al_primo_salvataggio_con_il_nome_dalla_prima_riga() {
    // CA-17.9, RB-81
    let mut p = Prova::nuova();
    p.aggiungi();
    let appunti = p.radice().join("appunti");
    let cartella = appunti.display().to_string();
    let nuovo = p.a.nuovo_file_locale(&cartella).unwrap().percorso;
    assert_eq!(p.nomi(&appunti), vec!["Senza titolo"]);
    assert_eq!(fs::read_dir(&appunti).unwrap().count(), 0, "prima del Ctrl + S il file non c'è");
    p.a.sospendi_file_locale(&nuovo, "# Lista per il trasloco\n- scatoloni", None).unwrap();
    let s = p.a.salva_file_locale(&nuovo, "# Lista per il trasloco\n- scatoloni", None).unwrap();
    assert!(s.percorso.ends_with("Lista per il trasloco.md"));
    let secondo = p.a.nuovo_file_locale(&cartella).unwrap().percorso;
    let s2 = p.a.salva_file_locale(&secondo, "Lista per il trasloco", None).unwrap();
    assert!(s2.percorso.ends_with("Lista per il trasloco 2.md"));
    assert_eq!(p.nomi(&appunti), vec!["Lista per il trasloco 2.md", "Lista per il trasloco.md"]);
    // Un file nuovo vuoto, scartato, sparisce.
    let terzo = p.a.nuovo_file_locale(&cartella).unwrap().percorso;
    p.a.scarta_file_locale(&terzo).unwrap();
    assert_eq!(p.nomi(&appunti).len(), 2);
}

#[test]
fn creare_rinominare_e_spostare_rifiutano_nomi_vietati_o_gia_usati() {
    // CA-17.10, RB-82
    let mut p = Prova::nuova();
    let f = p.file("idee.md", b"idee");
    p.file("spesa.md", b"spesa");
    p.aggiungi();
    let r = p.radice().display().to_string();
    assert!(matches!(p.a.crea_cartella_locale(&r, "a:b"), Err(Errore::PercorsoNonValido(_))));
    assert!(matches!(p.a.crea_cartella_locale(&r, "Appunti"), Err(Errore::NomeEsistente(_))));
    assert!(matches!(p.a.crea_cartella_locale(&r, "con"), Err(Errore::PercorsoNonValido(_))));
    let nuova = p.a.crea_cartella_locale(&r, "archivio").unwrap().percorso;
    assert!(Path::new(&nuova).is_dir());
    assert!(matches!(p.a.rinomina_locale(&f, "SPESA.md"), Err(Errore::NomeEsistente(_))));
    assert!(matches!(p.a.rinomina_locale(&f, "idee.jpg"), Err(Errore::PercorsoNonValido(_))));
    // Le modifiche in sospeso seguono il file rinominato e spostato.
    p.a.sospendi_file_locale(&f, "idee nuove", None).unwrap();
    let rinominato = p.a.rinomina_locale(&f, "Idee.txt").unwrap().percorso;
    let spostato = p.a.sposta_locale(&rinominato, &nuova).unwrap().percorso;
    assert!(Path::new(&spostato).exists());
    let aperto = p.a.apri_file_locale(&spostato).unwrap();
    assert!(aperto.sospeso);
    assert_eq!(aperto.testo, "idee nuove");
}

#[test]
fn una_cartella_non_si_sposta_dentro_se_stessa_e_le_cartelle_di_locale_non_si_toccano() {
    // CA-17.10, RB-76
    let mut p = Prova::nuova();
    p.aggiungi();
    let r = p.radice();
    let appunti = r.join("appunti").display().to_string();
    fs::create_dir(r.join("appunti").join("dentro")).unwrap();
    let dentro = r.join("appunti").join("dentro").display().to_string();
    assert!(matches!(p.a.sposta_locale(&appunti, &dentro), Err(Errore::SpostamentoImpossibile)));
    let radice = r.display().to_string();
    assert!(matches!(p.a.rinomina_locale(&radice, "altro"), Err(Errore::PercorsoNonValido(_))));
    assert!(matches!(p.a.elimina_locale(&radice, true), Err(Errore::PercorsoNonValido(_))));
}

#[test]
fn eliminare_per_sempre_toglie_anche_le_modifiche_in_sospeso() {
    // CA-17.11, RB-83
    let mut p = Prova::nuova();
    let f = p.file("spesa.md", b"spesa");
    p.aggiungi();
    p.a.sospendi_file_locale(&f, "spesa nuova", None).unwrap();
    p.a.elimina_locale(&f, true).unwrap();
    assert!(!Path::new(&f).exists());
    fs::write(&f, b"di nuovo").unwrap();
    assert!(!p.a.apri_file_locale(&f).unwrap().sospeso);
}

#[test]
fn solo_i_dischi_fissi_hanno_il_cestino() {
    // RB-83, TC-114
    assert!(super::cestino_per_tipo(3));
    for tipo in [0, 1, 2, 4, 5, 6] {
        assert!(!super::cestino_per_tipo(tipo), "tipo {tipo}");
    }
    let p = Prova::nuova();
    assert!(super::ha_cestino(&p.radice()));
}

#[cfg(windows)]
#[test]
fn su_un_disco_di_rete_eliminare_chiede_prima_di_cancellare_per_sempre() {
    // RB-83, TC-114: la cartella temporanea vista dalla condivisione amministrativa del disco.
    let mut p = Prova::nuova();
    let locale = p.radice().display().to_string();
    let Some((lettera, resto)) = locale.split_once(":\\") else { return };
    let rete = PathBuf::from(format!(r"\\localhost\{lettera}$\{resto}"));
    if fs::metadata(&rete).is_err() {
        eprintln!("condivisione amministrativa non raggiungibile: prova saltata");
        return;
    }
    assert!(!super::ha_cestino(&rete));
    p.a.aggiungi_cartella_locale(&rete).unwrap();
    let f = rete.join("appunti").join("spesa.md");
    fs::write(&f, b"spesa").unwrap();
    let f = f.display().to_string();
    assert!(matches!(p.a.elimina_locale(&f, false), Err(Errore::CestinoNonDisponibile)));
    assert!(Path::new(&f).exists());
    p.a.elimina_locale(&f, true).unwrap();
    assert!(!Path::new(&f).exists());
}

#[test]
fn un_cambio_fatto_fuori_si_scopre_e_non_si_scrive_sopra_senza_scegliere() {
    // CA-17.13, RB-85
    let mut p = Prova::nuova();
    let f = p.file("riunione.txt", b"mia");
    p.aggiungi();
    let letto = p.a.apri_file_locale(&f).unwrap();
    p.a.sospendi_file_locale(&f, "mia, modificata", letto.impronta.as_deref()).unwrap();
    fs::write(&f, b"di Blocco note").unwrap();
    let riaperto = p.a.apri_file_locale(&f).unwrap();
    assert!(riaperto.cambiato_fuori);
    assert!(matches!(
        p.a.salva_file_locale(&f, "mia, modificata", letto.impronta.as_deref()),
        Err(Errore::CambiatoFuori)
    ));
    assert_eq!(fs::read_to_string(&f).unwrap(), "di Blocco note");
    // Tieni la mia versione: l'impronta di adesso diventa quella letta, e Ctrl + S scrive.
    p.a.sospendi_file_locale(&f, "mia, modificata", riaperto.impronta.as_deref()).unwrap();
    assert!(!p.a.apri_file_locale(&f).unwrap().cambiato_fuori);
    p.a.salva_file_locale(&f, "mia, modificata", riaperto.impronta.as_deref()).unwrap();
    assert_eq!(fs::read_to_string(&f).unwrap(), "mia, modificata");
}

#[test]
fn un_file_sparito_con_modifiche_in_sospeso_si_puo_ricreare() {
    // CA-17.14, RB-85
    let mut p = Prova::nuova();
    let f = p.file("riunione.txt", b"mia");
    p.aggiungi();
    let letto = p.a.apri_file_locale(&f).unwrap();
    p.a.sospendi_file_locale(&f, "mia, modificata", letto.impronta.as_deref()).unwrap();
    fs::remove_file(&f).unwrap();
    let riaperto = p.a.apri_file_locale(&f).unwrap();
    assert!(riaperto.sparito);
    assert_eq!(riaperto.testo, "mia, modificata");
    assert!(matches!(
        p.a.salva_file_locale(&f, "mia, modificata", letto.impronta.as_deref()),
        Err(Errore::FileNonTrovato(_))
    ));
    // Ricrealo.
    p.a.salva_file_locale(&f, "mia, modificata", None).unwrap();
    assert_eq!(fs::read_to_string(&f).unwrap(), "mia, modificata");
}

#[test]
fn un_file_oltre_10_mb_non_si_apre() {
    // CA-17.15, SF-17
    let mut p = Prova::nuova();
    let f = p.file("grande.txt", &vec![b'a'; 10 * 1024 * 1024 + 1]);
    p.aggiungi();
    assert!(matches!(p.a.apri_file_locale(&f), Err(Errore::TroppoGrande(_))));
}

#[test]
fn un_file_in_sola_lettura_non_si_scrive_e_resta_intatto() {
    // CA-17.15, CA-17.16, SF-37
    let mut p = Prova::nuova();
    let f = p.file("sola-lettura.md", b"intatto");
    p.aggiungi();
    let mut permessi = fs::metadata(&f).unwrap().permissions();
    permessi.set_readonly(true);
    fs::set_permissions(&f, permessi.clone()).unwrap();
    let aperto = p.a.apri_file_locale(&f).unwrap();
    assert!(aperto.sola_lettura);
    assert!(matches!(
        p.a.salva_file_locale(&f, "cambiato", aperto.impronta.as_deref()),
        Err(Errore::DiscoRifiuta(_))
    ));
    assert_eq!(fs::read_to_string(&f).unwrap(), "intatto");
    #[allow(clippy::permissions_set_readonly_false)]
    permessi.set_readonly(false);
    fs::set_permissions(&f, permessi).unwrap();
}

#[test]
fn i_percorsi_fuori_da_locale_si_rifiutano() {
    // CA-17.17, DEC-118
    let mut p = Prova::nuova();
    fs::write(p.disco.join("fuori").join("segreto.md"), b"segreto").unwrap();
    p.aggiungi();
    let con_punti = p.radice().join("..").join("fuori").join("segreto.md").display().to_string();
    let fuori = p.disco.join("fuori").join("segreto.md").display().to_string();
    for percorso in [con_punti, fuori] {
        assert!(matches!(p.a.apri_file_locale(&percorso), Err(Errore::PercorsoNonValido(_))));
        assert!(matches!(p.a.salva_file_locale(&percorso, "x", None), Err(Errore::PercorsoNonValido(_))));
        assert!(matches!(p.a.elimina_locale(&percorso, true), Err(Errore::PercorsoNonValido(_))));
    }
    assert!(matches!(p.a.elenca_locale("relativo"), Err(Errore::PercorsoNonValido(_))));
    #[cfg(unix)]
    {
        let collegamento = p.radice().join("collegamento.md");
        std::os::unix::fs::symlink(p.disco.join("fuori").join("segreto.md"), &collegamento).unwrap();
        assert!(matches!(
            p.a.apri_file_locale(&collegamento.display().to_string()),
            Err(Errore::PercorsoNonValido(_))
        ));
    }
    assert_eq!(fs::read_to_string(p.disco.join("fuori").join("segreto.md")).unwrap(), "segreto");
}

#[test]
fn niente_di_locale_va_al_server() {
    // CA-17.18, DEC-115
    let mut p = Prova::nuova();
    let f = p.file("idee.md", b"idee");
    p.aggiungi();
    let letto = p.a.apri_file_locale(&f).unwrap();
    p.a.sospendi_file_locale(&f, "idee nuove", letto.impronta.as_deref()).unwrap();
    let r = p.radice().display().to_string();
    let nuovo = p.a.nuovo_file_locale(&r).unwrap().percorso;
    p.a.salva_file_locale(&nuovo, "Nuovo", None).unwrap();
    assert!(p.a.da_inviare().unwrap().is_empty());
}

#[test]
fn trascinare_aggiunge_cartelle_e_file_md_e_txt_da_soli() {
    // DEC-120: una cartella entra come cartella, un file .md o .txt da solo, il resto no.
    let mut p = Prova::nuova();
    fs::write(p.disco.join("fuori").join("lettera.txt"), b"cara").unwrap();
    fs::write(p.disco.join("fuori").join("foto.jpg"), b"jpg").unwrap();
    let r = p.radice();
    let esito = p
        .a
        .aggiungi_percorsi_locali(&[
            r.clone(),
            p.disco.join("fuori").join("lettera.txt"),
            p.disco.join("fuori").join("foto.jpg"),
            r.join("appunti"),
        ])
        .unwrap();
    assert_eq!(esito.aggiunti.len(), 2);
    assert_eq!(esito.scartati.len(), 1);
    assert_eq!(esito.gia, vec![r.display().to_string()], "appunti sta dentro prove-locale");
    let elenco = p.a.cartelle_locali().unwrap();
    // Prima i file, poi le cartelle (DEC-119).
    assert_eq!(
        elenco.iter().map(|c| (c.nome.as_str(), c.tipo)).collect::<Vec<_>>(),
        vec![("lettera.txt", "file"), ("prove-locale", "cartella")]
    );
    // Il file da solo si apre e si salva; il suo vicino no.
    let lettera = p.disco.join("fuori").join("lettera.txt").display().to_string();
    let aperto = p.a.apri_file_locale(&lettera).unwrap();
    p.a.sospendi_file_locale(&lettera, "cara Anna", aperto.impronta.as_deref()).unwrap();
    assert!(p.a.cartelle_locali().unwrap()[0].sospeso);
    p.a.salva_file_locale(&lettera, "cara Anna", aperto.impronta.as_deref()).unwrap();
    assert_eq!(fs::read_to_string(&lettera).unwrap(), "cara Anna");
    let vicino = p.disco.join("fuori").join("foto.jpg").display().to_string();
    assert!(matches!(p.a.elimina_locale(&vicino, true), Err(Errore::PercorsoNonValido(_))));
    // Sparito il file, resta «non trovata».
    fs::remove_file(&lettera).unwrap();
    assert_eq!(p.a.cartelle_locali().unwrap()[0].stato, "non trovata");
}
