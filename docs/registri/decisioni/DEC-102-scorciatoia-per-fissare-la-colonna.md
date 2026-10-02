# DEC-102 – Scorciatoia per fissare la colonna

**Data:** 2026-10-01 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Manuel Cucca: «aggiungi Ctrl + B per fissare la sidebar». Ctrl + B è il grassetto dell'editor del markdown (tastiFormattazione, menu del tasto destro sul testo), oggi sospeso con DEC-64 ma conservato per quando la formattazione torna; le scorciatoie della finestra principale arrivano prima dell'editor.

## Opzioni valutate
A) Ctrl + \: libera, vicina al gesto di altri editor per la barra laterale.
B) Ctrl + Maiusc + B: ricorda la B, più scomoda da premere.
C) Ctrl + B solo con il cursore fuori dal testo: stesso tasto con due significati.
D) Ctrl + B ovunque, con il grassetto spostato su un'altra combinazione.

## Decisione
A, scelta da Manuel Cucca. Nella finestra principale **Ctrl + \** su Windows e **⌘ + \** su macOS fanno come la puntina: fissano la colonna, o la sbloccano se è già fissata (DEC-55), e Memodu lo ricorda. Con una finestra di dialogo o SC-07 davanti non fanno niente. Ctrl + B resta libero per il grassetto.

## Conseguenze
- SC-01, tabella delle interazioni di RF-11; codice di `FinestraPrincipale` (anche `aria-keyshortcuts` sulla puntina) e una prova.
- Il suggerimento della puntina resta «Fissa la colonna», senza la scorciatoia (Manuel Cucca).
- Sulla tastiera italiana \ è il tasto a sinistra di 1: da provare a mano su Windows e sul Mac.
