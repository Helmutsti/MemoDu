# DEC-143 – La produzione si aggiorna con i tag

**Data:** 2026-10-15 · **Stato:** Proposta · **Idea di origine:** —

## Contesto
Il server su Vercel ripubblica in produzione a ogni invio su `main` (runbook, «Server»). Con il tronco unico (DEC-136) su `main` arriva anche il lavoro in corso: il 14/10/2026 un invio ha messo in produzione gli account e la 1.0 non si è più sincronizzata; il 15/10/2026 sono andati in produzione gli allegati di Brainet prima del rilascio. Le app pubblicate e il server devono andare insieme.

## Opzioni valutate
A) Su Vercel `main` va solo nelle anteprime (ambiente di prova, con un ramo di Neon e le sue variabili); la produzione si pubblica da un flusso di GitHub che parte con i tag `v*` (`vercel deploy --prod` con un gettone di Vercel nei segreti del repository). Server e app escono insieme, con lo stesso tag.
B) Un ramo `produzione` che si sposta solo al rilascio, impostato su Vercel come ramo di produzione. Semplice, ma è un ramo da tenere allineato (contro DEC-136).
C) Lasciare com'è e ricordarsi di non inviare su `main` cose che il server non deve ancora avere.

## Decisione
Proposta dell'agente: **A**. Da confermare da Manuel Cucca; serve un gettone di Vercel per il flusso e la modifica delle impostazioni del progetto su Vercel, che fa Manuel Cucca.

## Conseguenze
- `.github/workflows/rilascio.yml`: un passo che pubblica il server con il tag.
- Vercel: produzione non più legata a `main`; anteprime con un database di prova.
- `rilascio/runbook.md`, «Server» e «Pubblicare una versione».
