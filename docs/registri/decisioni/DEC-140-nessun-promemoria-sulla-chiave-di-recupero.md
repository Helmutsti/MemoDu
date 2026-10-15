# DEC-140 – Nessun promemoria sulla chiave di recupero

**Data:** 2026-10-15 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-132, dopo un recupero o un cambio della password con la chiave, SC-05 mostra la chiave nuova e sotto il promemoria «Durante la prova mandala a Manuel Cucca, che conserva le chiavi di tutti.», ripetuto nella guida per gli utenti. Nel collaudo sul Mac della testa di `main` (15/10/2026, DEC-136), che uscirà come versione pubblica, il testo è risultato pensato per la fase di prova: invita a mandare a qualcuno la chiave che apre tutte le note.

## Opzioni valutate
A) Togliere il promemoria: resta «La vedi solo adesso. Conservala: ti serve se dimentichi la password. Quella di prima non vale più.».
B) Sostituirlo con un invito a conservarla lontano dal computer.
C) Lasciarlo.

## Decisione
Scelta di Manuel Cucca del 15/10/2026: **A**, nessun messaggio; durante la prova la consegna della chiave si gestisce a voce. Supera DEC-132 solo per il testo sotto la chiave; il resto (chi conserva le chiavi durante la prova, RB-99) non cambia.

## Conseguenze
- `client/src/componenti/FinestraAccount.tsx` senza il promemoria; tolta la classe `modulo-accesso-promemoria`.
- SC-05 (`moduli/sincronizzazione/4-schermate.md`), CMP-35 (`design-system/componenti.md`), FL-14 e RB-99 (`2-flussi.md`), guida per gli utenti.
- Il mockup della chiave nuova nello strumento di design va allineato.
