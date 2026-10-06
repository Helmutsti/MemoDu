# DEC-114 – Credenziali perse: se ne generano di nuove

**Data:** 2026-10-04 · **Stato:** Superata da DEC-121 · **Idea di origine:** —

## Contesto
Il recupero delle credenziali perse era rinviato a prima della Definition of Ready di RF-10 e RF-14. Il server conosce solo l'impronta del gettone (DEC-79) e, finché manca la cifratura, le note sul server sono in chiaro (DEC-78, DEC-104): perso il file `credenziali` non si perde nessuna nota.

## Opzioni valutate
A) Si generano credenziali nuove e si cambia l'impronta sul server; la chiave di cifratura si decide con la cifratura.
B) Alla generazione si obbliga a salvare una copia di riserva del file.
C) Rinviare tutto alla cifratura.

## Decisione
A, scelta da Manuel Cucca il 04/10/2026. La procedura è nel runbook (`rilascio/runbook.md`) e vale anche per credenziali finite in mani sbagliate. Il recupero della chiave di cifratura torna nel rinvio della cifratura.

## Conseguenze
- Nessun codice nuovo: si usa `npm run credenziali` (DEC-104).
- Rinvio «Recupero delle credenziali» chiuso; la chiave entra nel rinvio della cifratura in `avanzamento.md`.
- RF-14 in `moduli/sincronizzazione/1-requisiti.md`.
