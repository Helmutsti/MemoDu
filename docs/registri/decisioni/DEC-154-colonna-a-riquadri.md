# DEC-154 – Colonna a riquadri con la barra di tessere

**Data:** 2026-10-19 · **Stato:** Accettata · **Idea di origine:** ID-55

## Contesto
Manuel Cucca vuole una colonna più bella, anche nella versione per il telefono (ID-54): voci dentro contorni e riquadri invece che testo libero sulla colonna grigia, ispirata ad Apple ma non uguale a Note di Apple. Proposte nella pagina [Proposta · Colonna a riquadri](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ/?node-id=375-1251) del file dei mockup, ognuna sul computer e sul telefono.

## Opzioni valutate
A) Gruppi in riquadri bianchi con il titolo sopra (come Note di Apple).
B) Tessere in griglia per Brainet, con il numero grande (come Promemoria).
C) Carte impilate, una per spazio (come il Portafoglio).
D) Colonna di vetro sospesa con i segmenti degli spazi e, sul telefono, la barra delle schede di vetro (macOS e iOS 26).
E) A + B: barra di quattro tessere quadrate per Brainet e riquadri con l'intestazione dentro.
F) A + B: tessere vive (ultima pagina del Journal, iniziali delle entità, striscia della settimana nel Calendario).
G) A + B: gli spazi come linguette fuse con un unico riquadro.

## Decisione
E, scelta di Manuel Cucca, 19/10/2026, dopo che A e le tessere di B gli erano piaciute ma non le voleva identiche a Note di Apple.
- In cima alla colonna la ricerca e, sotto, Brainet come una fila di quattro tessere quadrate con icona e nome: Scrivi (piena, `sfondo-pieno`), Journal, Entità, Calendario.
- Cloud e Locale sono riquadri bianchi (`sfondo-nota`, `raggio-contenitore`) sulla colonna grigia, con l'intestazione dentro il riquadro: freccia per chiuderlo, nome, numero, +. Le righe restano quelle di oggi (CMP-06), con la pillola della riga scelta dentro il riquadro.
- In fondo il Cestino in un riquadro e, accanto, Impostazioni come un riquadro con la sola icona.
- Sul telefono: titolo grande, tessere più alte, righe alte 44, cartelle con la freccia; in basso «Nuova nota» con il tondo pieno.

## Conseguenze
- Proposte dell'agente dentro E, da confermare (in `avanzamento.md`): il riquadro chiuso mostra un riassunto («2 cartelle»); ··· sulla riga al passaggio del mouse; trascinare una nota sulla tessera Journal la sposta in Brainet; sul telefono la riga scorsa a sinistra mostra Sposta ed Elimina; il Cestino nella barra in basso del telefono e Impostazioni in alto.
- Design system da completare: tessera quadrata, riquadro con l'intestazione dentro, azioni della riga scorsa, barra in basso del telefono, stili di riga e di titolo grande per il telefono, breakpoint del telefono.
- Da allineare: SC-01 e i mockup di tutte le pagine con la colonna, CMP-06 e CMP-14, poi il codice (`Colonna.tsx`). La parte del telefono resta legata a ID-54 e ID-11, parcheggiata.
