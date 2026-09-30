# DEC-66 – Un clic nel vuoto del foglio porta il cursore nel testo

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Il cursore compariva solo cliccando su una riga di testo già scritta. Manuel Cucca: «vorrei poter cliccare in ogni area della finestra per far comparire il cursore».

## Opzioni valutate
Nessuna alternativa: richiesta di Manuel Cucca.

## Decisione
- Nel foglio (SC-03) e nella nota rapida (SC-02) un clic in un punto vuoto (sotto l'ultima riga, a destra o a sinistra del testo) mette il cursore nel punto di testo più vicino: sotto il testo sull'ultima riga, di lato sulla riga alla stessa altezza.
- Il titolo e la riga dei metadati si comportano come prima; pulsanti e controlli pure (dettaglio proposto dall'agente).

## Conseguenze
- Aggiornati SC-02 e SC-03; codice: `cursoreDalClic` in `app/src/editor/Editor.tsx`, usato da `NotaAperta` e `NotaRapida`.
