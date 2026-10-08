# DEC-129 – Un ramo per la 1.0.0, main verso la 1.1.0

**Data:** 2026-10-08 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Per DEC-128 la 1.0.0 esce dopo le prove sul Mac, che non sono ancora fatte. Manuel Cucca vuole intanto portare avanti la 1.1.0, con la formattazione Markdown di RF-02 sospesa con DEC-64 e rinviata dopo la v1 con DEC-125. Le due versioni non devono mescolarsi: la 1.0.0 non deve contenere il Markdown.

## Opzioni valutate
- A) Un ramo `rilascio/1.0` dal commit `e4faad9` (fine della Fase 9): le prove sul Mac, le correzioni, il cambio di versione e il tag `v1.0.0` si fanno lì; `main` va verso la 1.1.0.
- B) Rilasciare subito la 1.0.0 su `main` e provare il Mac dopo, rivedendo DEC-128.
- C) Nessun ramo: la 1.1.0 su `main` e il tag `v1.0.0` messo dopo sul commit `e4faad9`.

## Decisione
Scelta di Manuel Cucca del 08/10/2026: **A**. DEC-128 resta valida.
- Sul ramo `rilascio/1.0` entrano solo le correzioni trovate con le prove sul Mac, il cambio di versione a 1.0.0, `[Non rilasciato]` che diventa `[1.0.0]` nel CHANGELOG e il tag `v1.0.0`, come nel runbook.
- Ogni correzione fatta sul ramo si riporta subito su `main`.
- Su `main` il CHANGELOG apre una nuova sezione `[Non rilasciato]` per la 1.1.0 sopra quella della 1.0.0.
- Dopo il tag `v1.0.0` il ramo resta per eventuali 1.0.x, poi si chiude.

## Conseguenze
- `avanzamento.md`: la 1.0.0 in attesa delle prove sul Mac sul ramo `rilascio/1.0`; il ciclo della 1.1.0 su `main`.
- `rilascio/runbook.md`: il rilascio di una versione si fa dal ramo `rilascio/X.Y` quando esiste.
