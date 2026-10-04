# DEC-119 – Una sola sezione CLOUD con le note non organizzate nella radice

**Data:** 2026-10-04 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
La colonna aveva due sezioni per le note: Non organizzate (le note nella radice, per ultima modifica, RB-60) e Cartelle (l'albero, con le sottocartelle prima delle note, RB-65). Con Locale (RF-17) la colonna ha una terza sezione con i file del disco. Manuel Cucca vuole una sola sezione per le note, chiamata CLOUD, accanto a LOCALE.

## Opzioni valutate
- Il + della sezione: A) un menu con Nuova nota e Nuova cartella; B) due icone; C) solo la nota nuova.
- Note e cartelle: A) le note prima a ogni livello, anche in Locale; B) solo nella radice; C) in CLOUD a ogni livello, Locale com'è.
- Le note della radice: A) per ultima modifica, la più recente in cima; B) in ordine alfabetico come dentro le cartelle.

## Decisione
Scelte di Manuel Cucca del 04/10/2026:
- La sezione Cartelle diventa **CLOUD** e la sezione Non organizzate sparisce: le note non organizzate stanno nella radice di CLOUD.
- Il + di CLOUD apre un menu con **Nuova nota** e **Nuova cartella** (A). Ctrl + N resta la nota nuova.
- A ogni livello **prima le note, poi le cartelle** (A), anche in Locale: prima i file, poi le cartelle.
- Nella radice le note restano per **ultima modifica**, la più recente in cima (A); dentro le cartelle in ordine alfabetico.

Deduzioni dell'agente, da confermare:
- Il titolo CLOUD non ha numero (il numero delle non organizzate di RB-56 sparisce; le cartelle tengono il loro).
- In «Sposta in…» la voce della radice si chiama «CLOUD» invece di «Non organizzate».
- CLOUD vuota: «Nessuna nota. Crea con +».
- Trascinare una nota o una cartella sul titolo CLOUD la porta nella radice, come oggi sul titolo delle due sezioni.

## Conseguenze
- Supera la sezione Non organizzate di RF-05 e di CMP-14; cambiano RB-56, RB-60, RB-65 e, per Locale, RB-75.
- Libreria: CMP-14 Albero delle cartelle con la sezione CLOUD (Manuel Cucca la pubblica); poi i mockup di SC-01, SC-04, SC-06 e Locale; poi il codice (`Colonna.tsx`, `SezioneLocale.tsx`, `archivio_locale.rs`).
- Il termine «nota non organizzata» resta (glossario): è una nota nella radice.
