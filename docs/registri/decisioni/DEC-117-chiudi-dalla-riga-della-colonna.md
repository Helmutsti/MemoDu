# DEC-117 – Impostazioni e cestino si chiudono dalla loro riga nella colonna

**Data:** 2026-10-04 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-116 impostazioni e cestino si chiudono con Ctrl + W, ma manca un pulsante visibile. Le varianti sono nel file Mockup, pagina «Proposta · Chiudi impostazioni e cestino».

## Opzioni valutate
A) Una × accanto al titolo «Impostazioni» o «Cestino», con il suggerimento «Chiudi … (Ctrl + W)».
B) Una pillola con la × accanto ai pulsanti della finestra in alto a destra: due × vicine, rischio di chiudere Memodu.
C) La riga della colonna diventa l'azione: con le impostazioni aperte «Impostazioni» diventa «Chiudi impostazioni» con la ×; lo stesso «Chiudi cestino».

## Decisione
C, scelta da Manuel Cucca il 04/10/2026. La riga resta selezionata; al posto dell'icona c'è la × (Icona/Chiudi), il testo diventa «Chiudi impostazioni» o «Chiudi cestino» (senza il numero degli elementi) e un clic chiude: l'area mostra «Nessuna nota aperta», come con Ctrl + W. Con la colonna non fissata la riga si vede quando la colonna si apre.

## Conseguenze
- Codice: `RigaCestino` e `RigaImpostazioni` in `client/src/componenti/RigaColonna.tsx`, `onChiudiVista` in `Colonna.tsx`; una prova.
- CMP-06 e CMP-30 in `componenti.md`. In Figma la libreria (Riga della colonna, Tipo Cestino e Impostazioni) non ha ancora lo stato «Chiudi»: da aggiungere e ripubblicare, poi da aggiornare i mockup di SC-04 e SC-06.
- Chiude la domanda aperta di DEC-116.
