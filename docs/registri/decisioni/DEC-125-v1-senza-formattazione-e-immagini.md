# DEC-125 – La v1 personale esce senza formattazione Markdown e senza immagini

**Data:** 2026-10-07 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Per arrivare alla versione 1 personale (Memodu usato da Manuel Cucca sui suoi computer, con le sue note vere) restavano aperti tre requisiti Must: RF-02 per la sola formattazione Markdown (sospesa con DEC-64: oggi il testo è puro, il codice di prima è conservato e non collegato), RF-03 Immagini nelle note (componente disegnato in parte, nessun codice, da decidere come salvare le regolazioni senza rompere l'esportazione) e RF-11 Interazioni rapide (fatto il 07/10/2026).

## Opzioni valutate
- A) RF-02 e RF-03 dentro la v1: si riprende l'editor (Tiptap o i pacchetti Markdown di CodeMirror) e si progetta e scrive RF-03 dalla Fase 6 alla 9.
- B) RF-02 e RF-03 fuori dalla v1, ripresi dopo.

## Decisione
Scelta di Manuel Cucca del 07/10/2026: **B**. La v1 personale esce con il testo puro e senza immagini:
- di RF-02 vale quello che c'è (scrivere, titolo, salvataggio, testo incollato come testo semplice); la formattazione (CA-02.2 … CA-02.6, TC-10 … TC-14) resta sospesa con DEC-64 e si riprende dopo la v1;
- RF-03 si riprende dopo la v1, dalla Fase 6.

La priorità Must resta: sono rinviati, non declassati.

## Conseguenze
- `moduli/note/1-requisiti.md`: RF-02 e RF-03 con la nota del rinvio; nella Fase 9 RF-02 passa a Implementato per la parte di testo puro, RF-03 resta In progettazione.
- `avanzamento.md`: i due rinvii nella tabella dei Rinvii, «dopo la v1».
- Le note di rilascio della 1.0.0 dicono che il testo è puro e che le immagini non ci sono ancora.
