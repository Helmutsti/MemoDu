# DEC-160 – Colonna del telefono con ricerca e penna in basso

**Data:** 2026-10-20 · **Stato:** Accettata · **Idea di origine:** ID-55

## Contesto
Nella prima colonna del telefono (DEC-154) la ricerca e le tessere di Brainet stavano in cima, lontane dal pollice, e il Cestino aveva un riquadro suo in fondo con Impostazioni accanto. Manuel Cucca ha chiesto il Cestino unito alle cartelle e i comandi usati spesso in basso, alla portata del pollice. Disegni nel file dei mockup, pagina Telefono, blocchi «Proposta · Comandi in basso» e «Proposta · Brainet e Impostazioni».

## Opzioni valutate
A) Barra a schede in basso con Note, Journal, Entità, Calendario e Impostazioni.
B) Un tondo in basso che apre un foglio con Brainet e Impostazioni.
C) Brainet come riquadro della lista, Impostazioni come tondo accanto alla ricerca.

## Decisione
C con due cambi, scelta di Manuel Cucca del 20/10/2026:
- Impostazioni non sta in basso ma in cima, a destra, come tondo da 44 su `sfondo-campo` (quello del tasto indietro): si usa di rado e non deve rubare spazio alle note.
- Il riquadro Brainet (Journal, Entità, Calendario come righe con icona) sta sotto Cloud.

In fondo restano solo la ricerca (CMP-03 su `sfondo-flottante`) e accanto il tondo pieno di Nuova nota con la matita, entrambi con `ombra-flottante`, sopra le note; con la tastiera aperta salgono sopra la tastiera. Il Cestino è l'ultima riga del riquadro Cloud, staccato dalle cartelle da un filo `bordo-divisore-tenue`, con il numero degli elementi.

Proposte dell'agente, da confermare: ricerca e penna alte 52 (40 × 17/13); le righe di Brainet restano disabilitate finché le schermate di Brainet non arrivano sul telefono.

## Conseguenze
- Sul computer Brainet resta in cima, sotto la ricerca (DEC-154): questa decisione vale solo per il telefono.
- Supera nella colonna del telefono il Fondo della colonna (CMP-30) e la barra delle tessere (CMP-49); CMP-54 Barra in basso diventa ricerca e penna.
- docs/moduli/telefono/1-requisiti.md, 4-schermate.md; componenti.md (componenti del telefono).
