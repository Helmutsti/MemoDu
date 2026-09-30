# DEC-70 – Ctrl + W chiude la nota

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
«Chiudi nota» è nel menu `···` della nota aperta (DEC-68). Manuel Cucca: «aggiungi Ctrl + W per chiudere la nota».

## Opzioni valutate
Nessuna alternativa: richiesta di Manuel Cucca.

## Decisione
- Nella finestra principale **Ctrl + W** su Windows e **⌘ + W** su macOS fanno come «Chiudi nota» (DEC-68). Senza una nota aperta, con una finestra di dialogo o SC-07 davanti non fanno niente; la finestra non si chiude.
- Nel menu `···` la voce «Chiudi nota» mostra la scorciatoia accanto all'etichetta, come le voci del tasto destro sul testo.

## Conseguenze
- SC-01, tabella delle interazioni di RF-11; codice di `FinestraPrincipale` e una prova.
- Su macOS ⌘ + W è anche «Chiudi finestra» nel menu del sistema, che potrebbe riceverla prima della pagina: da verificare sul Mac.
