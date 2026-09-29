# DEC-49 – Frammento Must D «Database»

**Data:** 2026-09-29 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-45 … DEC-48 portano note, cartelle, cestino e tag in SQLite nell'API. Il codice di Must A e Must B scrive ancora file, e i tag di Must C devono salvarsi nel database. Restava da decidere a quale frammento appartiene il passaggio.

## Opzioni valutate
A) Un frammento nuovo che passa al database tutto quello che c'è, senza cambiare ciò che l'utente vede, prima di riprendere Must C.
B) Dentro Must C, insieme ai tag.

## Decisione
Scelta di Manuel Cucca: **A**, e subito. Nasce il frammento **Must D · Database**: l'API salva note, cartelle e cestino in SQLite (DEC-46, DEC-47, DEC-48) al posto dei file; comandi dell'API e comportamento dell'app restano gli stessi. Il database parte vuoto (DEC-45).

## Conseguenze
- `docs/avanzamento.md`: nuovo frammento Must D, prima di Must C.
- Requisiti coinvolti: RF-01, RF-02, RF-05, RF-15, già progettati; le Fasi 1–6 non cambiano, la Fase 7 è fatta da DEC-45 … DEC-48.
- Verifica: le prove automatiche dell'API riscritte sul database e le prove a mano già superate di Must A e Must B (TC-01 … TC-50) rifatte sul database.
- `architettura/ambienti.md`: il set di dati «Smistare» si genera nel database di prova.
