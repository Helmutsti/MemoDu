# DEC-110 – Rinomina in conflitto senza cartella vuota

**Data:** 2026-10-04 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con RB-38 una cartella rinominata in due modi su due dispositivi prendeva un nome e accanto nasceva una cartella vuota con l'altro, come segnale del conflitto. Confermando CA-10.6 Manuel Cucca ha riaperto la scelta.

## Opzioni valutate
A) Il nome arrivato per ultimo e la cartella vuota con l'altro.
B) Solo il nome arrivato per ultimo (DEC-109): l'altro nome resta nelle versioni precedenti sul server (DEC-77).

## Decisione
B, scelta da Manuel Cucca il 04/10/2026. Nessun avviso: il conflitto di nome si risolve in silenzio.

## Conseguenze
- Codice: tolta la cartella vuota dalla fusione in `client/src-tauri/src/archivio_sinc.rs`.
- RB-38 e FL-07 in `moduli/sincronizzazione/2-flussi.md`, CA-10.6, TC-91; in `moduli/organizzazione/3-entita.md` il sistema non crea più cartelle.
