# DEC-45 – Note e dati in un database al posto dei file

**Data:** 2026-09-29 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Le note sono file markdown in Documenti\Memodu (DEC-28), con cartelle e cestino come cartelle del disco (DEC-29, DEC-36): una soluzione dichiarata provvisoria. Con i tag (Must C) serve un elenco che vive anche senza note (RB-49), e i requisiti in arrivo chiedono dati cifrati (RNF-02), ricerca (RF-08) e sincronizzazione (RF-10). Manuel Cucca ha fermato Must C per ragionare sul database prima di scegliere dove salvare i tag.

## Opzioni valutate
A) Tutto nel database (note, tag, cartelle, cestino); le note si portano fuori con l'esportazione in markdown (RF-13).
B) I file restano la fonte e il database fa solo da indice per ricerca e tag; la cifratura sul disco non è possibile.

## Decisione
Scelta di Manuel Cucca: **A**. Note, tag, cartelle e cestino stanno in un database; le note non sono più file leggibili da altri programmi.

## Conseguenze
- DEC-28 e DEC-29 sono superate per dove e come si conservano le note. Di DEC-28 restano validi il formato del testo (markdown, titolo come prima riga, sottolineato come `<u>`) e quello delle date (istanti in ora universale ISO 8601, date del calendario come giorno), che valgono dentro il database e nell'esportazione. DEC-36 (cartelle come sottocartelle del disco) va rivista con lo schema del database.
- Il codice di Must A e Must B, che scrive file, andrà portato sul database, con il passaggio delle note già scritte.
- L'esportazione in markdown (RF-13) diventa l'unico modo per leggere le note fuori da Memodu: da valutare se anticiparla.
- Da decidere: dove sta il database (oggi le note passano dall'API, DEC-30), quale motore, lo schema, la cifratura a riposo.
