# DEC-123 – Clic sul nome di un file di Locale: una comparsa con Chiudi file e Togli da Locale

**Data:** 2026-10-07 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con una nota aperta, un clic sul titolo apre Info (CMP-24, DEC-96), che in fondo ha le voci Chiudi nota ed Elimina. Con un file di Locale aperto (RF-17) il clic sul nome nel percorso serve solo a rinominarlo (SC-03 del modulo Locale): niente Info, tag o date. Manuel Cucca, provando la 0.1.10, si aspetta lo stesso gesto anche sui file e vuole trovarci almeno una voce per chiudere il file o toglierlo da Locale. Oggi «Togli da Locale» c'è solo nel tasto destro della colonna, per le cartelle dell'elenco e per i file aggiunti da soli (DEC-120).

## Opzioni valutate
- A) Una comparsa come Info, con il campo del nome e sotto le voci Chiudi file (sempre) e Togli da Locale (solo per un file aggiunto da solo).
- B) La stessa comparsa con la sola voce Chiudi file.
- C) La stessa comparsa con la sola voce Togli da Locale, che per un file dentro una cartella toglie la cartella intera.

## Decisione
Scelta di Manuel Cucca del 07/10/2026: **A**. Un clic sul nome del file nel percorso apre una comparsa sotto il percorso, come Info per le note, con:
- il campo del nome, per rinominare come oggi (RB-82);
- un divisore e le voci **Chiudi file**, sempre, e **Togli da Locale**, solo per un file aggiunto da solo all'elenco. Per un file dentro una cartella aggiunta la voce non c'è: si toglie la cartella intera dal tasto destro della colonna.

Niente date, tag o cartella: i file restano senza metadati (RF-17).

Deduzioni dell'agente, confermate da Manuel Cucca il 07/10/2026 con l'accettazione:
- **Chiudi file** fa come Chiudi nota: l'area resta vuota (DEC-117) e le modifiche non salvate restano in sospeso su questo computer (RB-78).
- **Togli da Locale** fa come la stessa voce del tasto destro nella colonna: il file sparisce dall'elenco, sul disco non cambia niente (RB-76), e l'area resta vuota.
- La comparsa usa la parte alta di Info (CMP-24, variante Comparsa) e le voci di menu (CMP-07) con le icone Chiudi (`x`) e una nuova per Togli da Locale; si chiude con Esc o con un clic fuori, come Info.
- Per un file nuovo mai salvato («Senza titolo», RB-81) il nome non si cambia dal campo: prende il nome al primo Ctrl + S; la comparsa ha solo Chiudi file.

## Conseguenze
- Cambia SC-03 (un file locale aperto) in `moduli/locale/4-schermate.md` e i flussi FL-11 e FL-10 per le voci nuove; nuovi criteri di RF-17.
- Libreria: la variante File di CMP-24 (o un componente nuovo, da decidere in Fase 5), l'icona di Togli da Locale; poi il mockup del file aperto con la comparsa; poi il codice del percorso dei file.
