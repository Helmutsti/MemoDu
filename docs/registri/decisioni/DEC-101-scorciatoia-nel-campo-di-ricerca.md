# DEC-101 – Scorciatoia nel campo di ricerca della colonna

**Data:** 2026-10-01 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Ctrl + K (⌘ + K su macOS) porta il cursore nel campo di ricerca della colonna (RB-71, DEC-94), ma il campo non lo diceva. Manuel Cucca ha chiesto di mostrare la scorciatoia a destra del campo. Nella libreria il campo di ricerca (CMP-03, tipo Ricerca) aveva la scorciatoia in tutte le sue istanze, anche in «Cerca un tag» e «Cerca una cartella», dove non c'entra.

## Opzioni valutate
A) La scorciatoia in ogni campo di ricerca.
B) La scorciatoia solo nel campo della colonna, con una proprietà del componente spenta di base.

## Decisione
B, approvata da Manuel Cucca il 01/10/2026. Il campo della colonna mostra a destra «Ctrl + K» (Interfaccia/Dettaglio, `testo-tenue`, a `spazio-controllo` dal bordo) finché è vuoto; scrivendo lascia il posto alla ✕ che cancella. Nella libreria è la proprietà **Mostra scorciatoia** del campo di ricerca, accesa solo nella colonna. La card dei risultati resta com'è: si apre entrando nel campo, con i filtri anche prima di scrivere (RB-33), così si può filtrare senza scrivere niente.

## Conseguenze
- CMP-03 in `componenti.md`; il campo annuncia la scorciatoia ai lettori di schermo (`aria-keyshortcuts`).
- Codice: `Ricerca.tsx` e `Ricerca.css`, con una prova automatica.
