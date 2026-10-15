# DEC-144 – Vercel resta la produzione, da `main`

**Data:** 2026-10-15 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-143 proponeva di aggiornare la produzione su Vercel solo con i tag `v`, togliendola da `main`.

## Opzioni valutate
A) Produzione con i tag (DEC-143).
B) Vercel resta la produzione e si aggiorna da sola a ogni invio su `main`, come oggi; altri ambienti verranno dopo.

## Decisione
Scelta di Manuel Cucca del 15/10/2026: **B**. «Non toccare Vercel: lasciamo che la pubblicazione avvenga in maniera naturale; poi creerò altri ambienti». Supera DEC-143.

## Conseguenze
- Nessun cambiamento su Vercel né nel flusso di rilascio; il runbook resta com'è («ripubblica da solo a ogni invio su `main`»).
- Un invio su `main` aggiorna il server vero: prima di inviare modifiche al server bisogna sapere che vanno subito in produzione.
