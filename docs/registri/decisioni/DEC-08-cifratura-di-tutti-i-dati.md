# DEC-08 – Cifratura di tutti i dati

**Data:** 2026-09-24 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
RNF-02 chiede che le note siano cifrate end-to-end, ma non dice quali dati. Titoli, nomi di cartelle e tag, date e struttura dell'albero possono rivelare molto anche senza il testo.

## Opzioni valutate
A) Tutto: testo, titoli, nomi di cartelle e tag, immagini, date e struttura dell'albero.
B) Contenuti e nomi; date e struttura leggibili dal server.
C) Solo testo e immagini.

## Decisione
Opzione A. Il server vede solo blocchi illeggibili, con la loro dimensione e l'ora della sincronizzazione.

## Conseguenze
- RNF-02: la cifratura riguarda tutti i dati di note, immagini, cartelle, tag e impostazioni.
- Ricerca (RF-08), risoluzione dei conflitti (FL-07) e ordinamento dei risultati (RB-34) avvengono solo sui dispositivi.
- In ogni entità della Fase 3, la sezione "Dati sensibili" indica che tutti gli attributi sono cifrati.
