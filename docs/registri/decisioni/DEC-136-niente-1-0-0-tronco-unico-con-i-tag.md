# DEC-136 – Niente 1.0.0: un tronco unico con i tag

**Data:** 2026-10-15 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Le prove della 1.0.0 sul Mac (DEC-128) si sono fatte il 15/10/2026 sul ramo `rilascio/1.0`, con due app e il server in locale: il server in produzione ha gli account dal 14/10/2026 e non parla più con la 1.0. Sono passate la nota rapida, l'accesso, Locale e la sincronizzazione, con tre correzioni della sincronizzazione che valgono anche per `main`. Intanto `main` è andato avanti con la 1.1.0, la 1.2.0 e Brainet, e tenere più rami di rilascio vuol dire riportare ogni correzione più volte (DEC-129).

## Opzioni valutate
- A) Rilasciare la 1.0.0 dal ramo e poi la 1.1.0 e la 1.2.0, riportando le correzioni a cascata.
- B) Niente 1.0.0: un tronco unico (`main`) con i tag; il prossimo rilascio parte dalla testa e si riprova sul Mac.

## Decisione
Scelta di Manuel Cucca del 15/10/2026: **B**. La 1.0.0 non esce; DEC-128 e DEC-129 sono superate. Le tre correzioni del Mac si riportano su `main`; il prossimo rilascio è quello della testa di `main`, da riprovare sul Mac prima del tag. Non provati sul Mac: la chiavetta (disco senza Cestino) e il passaggio diretto tra il Mac e il PC.

## Conseguenze
- `avanzamento.md`: niente coda 1.0.0 → 1.1.0 → 1.2.0; un solo prossimo rilascio dalla testa.
- I rami `rilascio/1.0` e `rilascio/1.1` non si usano più per i rilasci.
- `rilascio/runbook.md`: il rilascio si fa da `main` con il tag.
