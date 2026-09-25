# DEC-28 – Note come file markdown

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Sul dispositivo l'app tiene la copia di lavoro delle note (DEC-02). Per il frammento Must A serve scegliere dove e in che formato, pensando anche a ricerca (RF-08) e sincronizzazione (RF-10), che vengono dopo.

## Opzioni valutate
A) SQLite nella parte Rust: salvataggi sicuri, ricerca a testo pieno pronta, ma note non leggibili da altri programmi.
B) File markdown in una cartella: un file per nota, le cartelle di Memodu sono cartelle vere, note leggibili da qualunque programma.
C) IndexedDB nel motore web: dati chiusi nel motore, sconsigliato.

## Decisione
Opzione B, scelta da Manuel Cucca, con questo formato:
- **Intestazione YAML** in cima al file per tag e date; il **titolo** è la prima riga (`# Titolo`).
- **Sottolineato** come `<u>testo</u>`.
- **Istanti** (creazione di sistema, modifica) in ora universale ISO 8601 (`2026-09-25T08:32:00Z`), mostrati nell'ora locale del dispositivo.
- **Date del calendario** (creazione scelta, fine validità) solo come giorno (`2026-10-01`).
- La **data di modifica** si scrive nell'intestazione a ogni salvataggio, con l'ora; non si legge dalla data del file sul disco.

## Conseguenze
- `architettura/architettura.md`: dati sul dispositivo come file markdown.
- `moduli/note/8-test.md`: risolta la domanda sul sottolineato. Rinvio su date e fusi orari: resta solo il confronto "più recente" tra dispositivi (sincronizzazione).
- Da progettare in Fase 7: nomi dei file e posizione della cartella, cestino come cartella, controllo delle modifiche fatte da altri programmi. Ricerca e sincronizzazione si appoggeranno ai file (frammento Must).
