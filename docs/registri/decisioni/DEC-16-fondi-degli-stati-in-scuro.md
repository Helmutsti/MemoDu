# DEC-16 – Fondi degli stati in modo scuro

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
In modo scuro `sfondo-<stato>` usava il gradino 950 delle scale semantiche (DEC-14). Contro `sfondo-nota` scuro (#141414) il rapporto era 1,00–1,02: gli avvisi (CMP-15) si confondevano con il fondo, contro la regola visiva 11. Decisione che riguarda solo il design system.

## Opzioni valutate
A) Gradino 950 (com'era).
B) Gradino 800.
C) Gradino 700.
D) In scuro, guscio neutro (`sfondo-flottante`) con solo l'icona colorata.

## Decisione
Opzione B, scelta da Manuel Cucca guardando il confronto nella pagina Prove: il fondo si stacca (1,24–1,33 su `sfondo-nota`), il testo resta ≥ 12,6:1, l'icona ≥ 5,4:1 e il pulsante tenue ≥ 5,5:1. La C scendeva sotto 4,5:1 con il pulsante tenue; la D faceva capire lo stato solo dall'icona.

## Conseguenze
- `design-system/tokens.md`: `sfondo-<stato>` in scuro = `<scala>-800`; contrasti e tabella dei fondi sulle superfici aggiornati.
- Cambiano in scuro anche la voce di menu distruttiva evidenziata (CMP-07) e il cestino di trascinamento (CMP-14), che usano `sfondo-errore`.
