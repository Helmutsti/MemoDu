# DEC-128 – La 1.0.0 esce dopo le prove sul Mac

**Data:** 2026-10-08 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Le note di rilascio della 1.0.0 la presentano per Windows e per i Mac, e il flusso «Rilascio» produce anche il `.dmg`. Sul Mac però l'ultima prova vera è sulla 0.1.8, e TC-06 (icona nella barra dei menu e nel Dock, DEC-108) è ancora in verifica. Da allora sono arrivati la sincronizzazione cifrata, l'accesso con il box dell'account e Locale, che sul Mac non sono mai stati provati. La questione è emersa nella retrospettiva della Fase 9.

## Opzioni valutate
- A) La 1.0.0 esce per tutti e due i sistemi; le prove sul Mac dopo, gli errori in una 1.0.1.
- B) Prima del tag si rifanno sul Mac i casi principali, poi la 1.0.0 esce per tutti e due.
- C) La 1.0.0 vale per Windows; il `.dmg` si pubblica dicendo nelle note di rilascio che il Mac è da provare.

## Decisione
Scelta di Manuel Cucca del 08/10/2026: **B**. «1.0.0» promette che funziona, e un errore della cifratura sul Mac toccherebbe note vere. Prima del tag `v1.0.0` si installa sul Mac l'ultima versione e si rifanno, con il Mac e il PC sullo stesso server di produzione:
- nota rapida: TC-01 e TC-02 con Control + Option + N, TC-06 (barra dei menu e Dock);
- accesso: TC-142 (accedere dal box) e TC-135 (riaprire senza chiedere l'accesso);
- sincronizzazione: TC-127 tra il Mac e il PC, che chiude anche la prova in produzione rimasta aperta; TC-87 (senza rete) e TC-88 (copia in conflitto);
- Locale: TC-112, TC-113, TC-114 (eliminare va nel Cestino del Mac) e TC-146.

Un errore trovato si corregge e si rifà la prova prima del tag.

## Conseguenze
- `avanzamento.md`: il prossimo passo è la prova sul Mac, poi il rilascio della 1.0.0.
- Nei piani di test l'esito sul Mac si aggiunge alla colonna dell'esito dei TC elencati.
- Le note di rilascio della 1.0.0 restano come sono: valgono per Windows e per i Mac.
