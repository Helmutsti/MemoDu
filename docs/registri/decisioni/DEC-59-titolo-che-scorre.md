# DEC-59 – Il titolo scorre insieme alla pagina

**Data:** 2026-09-29 · **Stato:** Superata da DEC-60 (solo lo sfondo della fascia in alto) · **Idea di origine:** —

## Contesto
In SC-03 titolo e riga dei metadati restavano fissi e scorreva il solo corpo della nota. Manuel Cucca ha notato che il titolo non scorre insieme a tutta la pagina: «dovrebbe».

## Opzioni valutate
A) Titolo e metadati fissi, scorre il corpo (come prima).
B) Scorre tutta la pagina: titolo, metadati e testo insieme.

## Decisione
Scelta di Manuel Cucca: **B**. La barra di scorrimento discreta (DEC-58) è quella della pagina. La fascia in alto (DEC-55) prende lo sfondo del foglio (`sfondo-nota`), così il testo che scorre le passa sotto senza sovrapporsi a ··· e ai pulsanti della finestra (dettaglio proposto dall'agente).

## Conseguenze
- Aggiornata SC-03 (`note/4-schermate.md`); codice di `NotaAperta` e della fascia in alto.
