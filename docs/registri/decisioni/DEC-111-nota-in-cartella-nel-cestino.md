# DEC-111 – Nota finita in una cartella nel cestino: va tra le non organizzate

**Data:** 2026-10-04 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con RB-30 una nota creata o spostata su un dispositivo in una cartella che un altro dispositivo aveva mandato nel cestino faceva uscire dal cestino la cartella, con le cartelle madri, e la nota restava dentro. Confermando CA-10.7 Manuel Cucca ha riaperto la scelta.

## Opzioni valutate
A) La cartella esce dal cestino e torna com'era, con la nota dentro.
B) La cartella resta nel cestino; la nota va tra le non organizzate.

## Decisione
B, scelta da Manuel Cucca il 04/10/2026. Vale anche se nel cestino c'è una cartella madre. Nessun messaggio.

## Conseguenze
- Codice: `client/src-tauri/src/archivio_sinc.rs`, `togli_dalla_cartella_nel_cestino` al posto di `riporta_fuori_le_cartelle`; lo spostamento tra le non organizzate va al server come una modifica qualsiasi.
- Una cartella non torna più dal cestino da sola: ne esce solo con il ripristino (RB-28).
- RB-30, SF-20 e il diagramma degli stati in `moduli/organizzazione/2-flussi.md`, `moduli/organizzazione/3-entita.md`, SF-20 in `moduli/note/2-flussi.md` e in `moduli/sincronizzazione/2-flussi.md`, CA-10.7, TC-92.
