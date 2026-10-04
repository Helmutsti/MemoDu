# DEC-112 – Avviso «server irraggiungibile» dopo un'ora

**Data:** 2026-10-04 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-82 l'avviso «server irraggiungibile» compariva dopo 24 ore senza sincronizzazioni riuscite. Con il server in rete su Vercel (DEC-105) un server giù va notato in giornata. Confermando CA-10.9 Manuel Cucca ha chiesto una soglia più corta.

## Opzioni valutate
A) 15 minuti. B) 1 ora. C) 4 ore.

## Decisione
B, scelta da Manuel Cucca il 04/10/2026: un'ora dall'ultima sincronizzazione riuscita (o dal primo tentativo). Supera la soglia di DEC-82.

## Conseguenze
- Codice: `SOGLIA_IRRAGGIUNGIBILE_ORE` in `client/src-tauri/src/sincronizzazione.rs`; testo dell'avviso «Il server non risponde da più di un'ora: le modifiche restano su questo computer.».
- Rischio accettato: con il portatile senza rete per più di un'ora l'avviso compare anche se il server sta bene.
- RB-40, SF-30 e FL-07 in `moduli/sincronizzazione/2-flussi.md`, `4-schermate.md`, CA-10.9, TC-94, `architettura/architettura.md`, esempio in `design-system/componenti.md`.
