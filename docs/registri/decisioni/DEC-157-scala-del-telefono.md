# DEC-157 – Scala del telefono

**Data:** 2026-10-19 · **Stato:** Accettata · **Idea di origine:** ID-54

## Contesto
L'app per iPhone (DEC-156) rifà in React Native i componenti del design system, che sono disegnati per il computer: righe a 13, dettagli ed etichette a 11, titolo della nota a 30. Su iPhone quelle misure si leggono piccole (le app di Apple usano 17 per le righe). La prima versione dell'app usava misure scelte dall'agente senza regola, e non somigliava ai disegni.

## Opzioni valutate
A) Le stesse misure del computer: identiche a Figma, piccole sul telefono.
B) Una scala del telefono uguale per tutti: ogni misura del computer moltiplicata per la stessa proporzione, 17/13.
C) Le misure standard di Apple (17, 15, 13, 34): aspetto da iPhone, ma i rapporti tra i testi non sono quelli del design system.

## Decisione
B, scelta di Manuel Cucca del 19/10/2026. Sul telefono ogni misura del design system si moltiplica per 17/13 (circa 1,31) e si arrotonda all'intero: 13 → 17, 11 → 14, 15 → 20, 19 → 25, 30 → 39. Vale per testi, spazi, raggi e icone, così ogni componente è il suo frame di Figma ingrandito con le stesse proporzioni; le righe toccabili restano almeno a 44, la misura minima di un tocco per Apple. Carattere Inter, come sul computer.

L'esempio dato prima della scelta diceva 30 → 34 per il titolo della nota: era un errore dell'agente; la regola scelta dà 39. Da rivedere vedendolo, se è troppo grande.

## Conseguenze
- `tokens.md`: nuova sezione «Telefono».
- `telefono/src/tema.ts` ricava le misure dai token del computer con questa regola.
- Gli stati legati al mouse (Hover, Focus da tastiera, ··· al passaggio del mouse) sul telefono diventano tocco premuto, riga che scorre e pressione lunga.
