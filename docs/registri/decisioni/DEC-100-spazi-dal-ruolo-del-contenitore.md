# DEC-100 – Spazi dal ruolo del contenitore

**Data:** 2026-10-01 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-97 e DEC-98 gli spazi erano coerenti dentro ogni famiglia ma non tra una famiglia e l'altra. Il criterio era «flottante o no»: menu, Info e ricerca avanzata avevano 8, la colonna e gli avvisi 16, le finestre di conferma 24. Così Info, che è un pannello di contenuto e nella variante Finestra sta al centro con il velo come una conferma, aveva i bordi stretti di un menu, mentre la colonna aveva un bordo più armonioso. Manuel Cucca ha chiesto di fissare la semantica e le regole grafiche.

## Opzioni valutate
Per il criterio: A) dal ruolo, su tre livelli (elenco, pannello, finestra); B) dal ruolo, su due livelli (elenco e tutto il resto); C) un solo margine per tutti i contenitori.
Per i nomi dei token: rinominarli sui ruoli, oppure tenerli e cambiare solo le descrizioni.
Per le righe dentro un pannello: pillole con 12 dentro come nella colonna, oppure senza spazi come in DEC-98.
Per la colonna: righe delle cartelle a 12 come le note e rientro di 20; solo 12; lasciarla com'è. Poi, per la distanza tra icona e testo (4 nella colonna, 8 nelle voci): 8 ovunque e rientro 24, oppure 4 nella colonna e rientro 20.
Per le distanze: come la colonna, dal ruolo; righe a 4 e blocchi a 8; lasciarle come sono.

## Decisione
Scelte di Manuel Cucca, 01/10/2026 (tutte le raccomandazioni dell'agente):
1. **Il margine del contenitore dipende dal suo ruolo**, non dal componente né dal fatto che galleggi:
   - **Elenco** (ogni riga si evidenzia ed è il contenuto: menu, suggerimenti, Sposta in, card dei risultati, calendario): `spazio-elenco` = 8; le pillole sono concentriche con gli angoli (20 − 8 = 12, `raggio-interno`).
   - **Pannello** (contenuto da leggere e modificare: Info, colonna, avvisi, ricerca avanzata): `spazio-pannello` = 16.
   - **Finestra** (un messaggio che interrompe, al centro con il velo: finestre di conferma): `spazio-finestra` = 24.
   Un contenitore misto prende il margine del suo ruolo; un elenco dentro un pannello è un blocco a tutta larghezza.
2. **I token si chiamano come i ruoli:** `spazio-elenco` (prima `spazio-flottante`), `spazio-pannello` (prima `spazio-contenitore`), `spazio-finestra` resta.
3. **Ogni riga è una pillola alta 32 con `spazio-controllo` (12) dentro**, interattiva o no: righe della colonna (cartelle comprese), righe di Info, «Modificata», intestazione, voci, campi. Il 12 non è un margine in più: è l'anatomia della riga. Così in un pannello tutto parte a 28 dal bordo (16 + 12), come le note nella colonna.
4. **Albero: `spazio-icona` (8) tra icona e testo in tutte le righe e rientro di 24 per livello** (`spazio-rientro`, uguale a icona 16 + 8), nella colonna e in Sposta in: l'icona di una sottocartella parte esattamente sotto il nome della cartella che la contiene, e i nomi dello stesso livello sono allineati. Il primo rientro proposto, 20, valeva solo con i 4 della colonna e in Sposta in lasciava 4 px di scarto: Manuel Cucca ha scelto 8 e 24 dopo averlo visto in Figma.
5. **Distanze dal ruolo:** nel pannello righe a `spazio-elemento` (4), così le pillole non si toccano, e blocchi a `spazio-blocco` (16); nell'elenco voci attaccate (0), perché l'evidenziazione passa da una voce all'altra.

## Conseguenze
- Supera DEC-98 e, di DEC-97, le due regole degli spazi; di DEC-97 restano Info proposta C e «Ripristina».
- Token: `spazio-elenco`, `spazio-pannello` e `spazio-rientro` (sul primitivo `spazio-24`) in `tokens.md`, nella libreria e in `client/src/stili/token.css`.
- Libreria: Info (CMP-24) a 16 con le righe a pillola e le distanze 4 e 16; ricerca avanzata (CMP-29) a 16; riga della colonna (CMP-06) con tutte le righe a 12, icona e testo a 8 e rientro 24; Sposta in (CMP-11) con rientro 24; i nomi dei token in tutti i componenti.
- Da allineare dopo la libreria: `componenti.md` componente per componente, i mockup e il codice (`Info.css`, `RicercaAvanzata.css`, `Colonna.css`, `PannelloSpostaIn.tsx`, i token).
