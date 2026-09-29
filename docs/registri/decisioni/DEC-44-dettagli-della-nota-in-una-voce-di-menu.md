# DEC-44 – Dettagli della nota in una voce di menu

**Data:** 2026-09-29 · **Stato:** Accettata · **Idea di origine:** ID-27

## Contesto
DEC-42 metteva sotto il titolo della nota le date di creazione e di ultima modifica, e i mockup di Must C (approvati il 29/09/2026) permettevano di modificare i tag direttamente lì, con la ✕, un campo e i suggerimenti. Le date modificabili (creazione scelta, fine validità) restavano nel pannello «Date…» del menu `···`. Manuel Cucca vuole invece la pagina della nota libera da modifiche e un solo posto per tutti gli aspetti della nota.

## Opzioni valutate
A) Dettagli sostituisce solo «Date…»; i tag si modificano sotto il titolo.
B) Dettagli sostituisce «Date…» e «Tag…»: la pagina della nota mostra e basta.
C) Dettagli si aggiunge senza sostituire niente.

## Decisione
Scelta di Manuel Cucca: **B**.
- La pagina della nota mostra sotto il titolo **solo i tag, in sola lettura, e la data di ultima modifica**.
- Date, tag e gli altri aspetti della singola nota si vedono e si modificano nella voce **«Dettagli»**, presente sia nel menu `···` della nota aperta sia nel tasto destro sulla nota nella colonna.
- «Tag…» e «Date…» escono dal menu `···`.

## Conseguenze
- DEC-42 è superata. La data di creazione di sistema, «sempre visibile nei dettagli della nota» (RF-04), si vede in Dettagli.
- I mockup di Must C con la modifica dei tag sotto il titolo vanno rifatti dentro Dettagli: la Fase 6 di Must C si riapre.
- CMP-20: la Riga dei metadati torna a tag e data di ultima modifica; la sua forma si decide con il nuovo mockup.
- Da decidere: forma di Dettagli (pagina nell'area della nota, pannello), cosa contiene oltre a date e tag, se entra tutta in Must C o in parte con RF-04.
