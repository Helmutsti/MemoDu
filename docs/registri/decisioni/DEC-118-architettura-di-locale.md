# DEC-118 – Architettura di Locale

**Data:** 2026-10-04 · **Stato:** Accettata · **Idea di origine:** ID-03

## Contesto
RF-17 (DEC-115) porta in Memodu file e cartelle del disco, senza sincronizzazione. Restano da scegliere dove sta il codice, come si osservano i cambi fatti da altri programmi, come si leggono le codifiche e come si elimina nel Cestino del sistema.

## Opzioni valutate
Per i cambi fatti fuori (RB-84): A) osservare il disco con il crate `notify`; B) rileggere a richiesta (ritorno in primo piano, apertura, salvataggio, ogni 30 s), senza dipendenze ma con avvisi in ritardo.

## Decisione
A, scelta da Manuel Cucca il 04/10/2026, insieme alla proposta dell'agente per il resto, approvata lo stesso giorno:
- Tutto nel nucleo Rust (`client/src-tauri/src/locale.rs`), come le note (DEC-67): l'interfaccia non tocca mai il disco da sola.
- Ogni comando accetta solo percorsi dentro le cartelle dell'elenco: il nucleo risolve il percorso vero (anche dietro un collegamento simbolico) e rifiuta quelli che escono.
- Elenco delle cartelle e modifiche in sospeso nella copia di lavoro, tabelle `locale_cartelle` e `locale_sospesi` (schema 6), senza trigger di sincronizzazione.
- Dipendenze nuove: `tauri-plugin-dialog` (scelta della cartella), `notify` con il debouncer (cambi sul disco), `sha2` (impronta del contenuto letto), `encoding_rs` (Windows-1252), `trash` (Cestino di Windows e del Mac).
- A capo e BOM si rilevano alla lettura e si rimettono uguali al salvataggio. Il salvataggio scrive un file temporaneo nella stessa cartella e poi lo sostituisce, così un errore a metà lascia intatto il file di prima (SF-37).
- Nell'interfaccia un componente `FileAperto` accanto a `NotaAperta`, con lo stesso editor, e lo stato di Locale in un modulo suo.

## Conseguenze
- `architettura/architettura.md` (scelte, schema, sicurezza) e `architettura/api.md` (comandi ed evento di Locale).
- Rischio accettato: una copia del testo non salvato resta nella copia di lavoro, non cifrata, come le note (rischi accettati in `avanzamento.md`).
