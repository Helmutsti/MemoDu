# DEC-108 – Icone macOS nella barra dei menu e nel Dock

**Data:** 2026-10-04 · **Stato:** Proposta · **Idea di origine:** —

## Contesto
Manuel Cucca richiede il logo M chiaro in scuro e scuro in chiaro sia nella barra dei menu sia nel Dock. DEC-73 prevede il template nella barra; DEC-103 lasciava invariato il Dock su macOS. Il codice sostituisce l'immagine della barra dopo averla marcata come template, perdendo il flag.

## Opzioni valutate
A) Correggere solo il flag della barra: non copre il Dock.
B) Aggiungere un catalogo di icone Apple con varianti.
C) Conservare il flag template a ogni aggiornamento della barra e scegliere nel Dock i PNG della M già presenti in `icons/finestra`, tramite l'API pubblica NSApplication.

## Decisione
Richiesta di Manuel Cucca: entrambe le icone seguono il tema, con la M esistente. Proposta tecnica C per la verifica: aggiungere solo su macOS le dipendenze dirette objc2, objc2-app-kit e objc2-foundation, già presenti indirettamente tramite Tauri. Aggiornare il Dock all'avvio e quando cambia il tema della finestra principale; usa le versioni già fornite in #1F1F1F e #EDEDED.

## Conseguenze
- Estende a macOS durante l'esecuzione il cambio di colore del programma richiesto in DEC-103; non modifica la vecchia decisione finché questa proposta tecnica non è accettata dal team.
- Conserva DEC-73 e il comportamento Windows.
- Le icone statiche del pacchetto nel Finder restano quelle esistenti.
- Verificare i due PNG e la scelta per i due temi, poi il cambio visivo con Memodu aperto e nascosto (TC-06).
