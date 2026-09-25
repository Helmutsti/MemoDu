# DEC-14 – Colori semantici degli stati

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
La direzione C (DEC-12) usa solo grigi neutri e il nero come unico accento. Gli avvisi (RB-39, RB-40, EN-08) e i messaggi di errore però devono distinguere a colpo d'occhio un errore da un avviso o da un'informazione, anche per chi usa il modo scuro.

## Opzioni valutate
A) Solo grigi: gli stati si distinguono da icona e testo.
B) Quattro scale semantiche (rosso, ambra, verde, blu) con la stessa luminosità dei grigi a parità di gradino.

## Decisione
Opzione B, scelta da Manuel Cucca guardando le scale complete nel file Figma (pagina Token). Ogni scala ha 11 gradini, da 50 a 950; il 500 su bianco e il 400 su grigio-950 superano sempre 4,5:1. Il colore compare solo quando comunica uno stato: tutto il resto dell'interfaccia resta neutro, come in DEC-12, che resta valida.

## Conseguenze
- `design-system/tokens.md`: nuovi primitivi `grigio-300`, `grigio-600` e le scale `rosso`, `ambra`, `verde`, `blu`; nuovi semantici `sfondo-`, `testo-` e `icona-` per errore, avviso, successo e informazione.
- Contrasti verificati per testo e icone degli stati su sfondo dello stato e sulla nota, in chiaro e in scuro.
- I componenti "avviso" e "messaggio in linea" della Fase 5 usano questi token.
