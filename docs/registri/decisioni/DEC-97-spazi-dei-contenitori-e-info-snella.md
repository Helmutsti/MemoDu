# DEC-97 – Spazi dei contenitori e Info più snella

**Data:** 2026-10-01 · **Stato:** Accettata; le regole degli spazi superate da DEC-100 (restano Info proposta C e «Ripristina») · **Idea di origine:** —

## Contesto
Manuel Cucca ha chiesto di ridisegnare Info (CMP-24, DEC-96) più chiara da leggere, più snella e meno lunga, e ha notato che i margini sopra e sotto non tornavano. Nelle proposte l'agente aveva messo margini su più livelli (8 sul pannello, 12 nel corpo, 0 sopra) e li usava per allargare i pezzi dove serviva: lo stesso succedeva nella libreria e nel codice, dove menu, pannelli e card avevano margini sui pezzi interni e valori diversi tra un componente e l'altro. Proposte nella pagina [Proposta · Info più snella](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=157-3644) del file dei mockup.

## Opzioni valutate
Per Info: A) una tabella con le etichette a sinistra e i valori a destra; B) una testata con il titolo e le informazioni come pillole; C) un elenco di righe, ognuna con la sua icona e la frase intera («Creata il 12/09/2026»), che si aprono con un clic.
Per gli spazi: correggere componente per componente, oppure due regole generali, uguali per tutti, con il valore del margine dei contenitori flottanti a 8 o a 12.

## Decisione
Scelte di Manuel Cucca, 01/10/2026:
- **Info proposta C**, con «Ripristina» a destra della data di creazione quando è stata cambiata: torna alla data di sistema.
- **Due regole per gli spazi**, nella libreria e nel codice, con il minimo di modifiche:
  1. **Il contenitore flottante** (menu, pannello, calendario, card dei risultati, Info, ricerca avanzata) ha `spazio-flottante` su tutti i lati e tra i blocchi. I pezzi dentro non hanno margini propri e riempiono la larghezza.
  2. **La riga a pillola** (voce di menu, campo, riga di Info, risultato) ha `spazio-controllo` (12) a sinistra e a destra, solo dentro la pillola.
- **`spazio-flottante` = 8.** In ogni contenitore le pillole stanno a 8 dal bordo e testi e icone partono a 20.

Proposte dell'agente, confermate da Manuel Cucca il 01/10/2026: la data di sistema completa («Data di sistema: 12/09/2026 alle 10:14») è nel suggerimento della riga della creazione; «Nessuna fine validità» in testo tenue; aperta una riga di data il focus va nel campo con il testo selezionato, il calendario si apre sotto e si raggiunge con ↓; Esc chiude la riga con il calendario e il focus torna sulla riga; dopo Canc su un tag il focus va su «+ Tag»; i divisori dei contenitori stanno dentro il margine, rientrati di 8 come le pillole.

## Conseguenze
- Regola generale nuova in `componenti.md` («Spazi dei contenitori»); `spazio-flottante` in `tokens.md` vale per tutti i contenitori flottanti.
- CMP-24 Info ridisegnata: supera i gruppi con titolo (Date, Tag, Cartella), le etichette sopra i campi, la riga «Creata il … alle …» sotto il campo e il pulsante «Sposta in…» accanto alla cartella di DEC-96.
- CMP-07 Voce di menu senza margini propri; CMP-09, CMP-11, CMP-12, CMP-13 e CMP-29 con il margine 8 su tutti i lati; i divisori non vanno più da lato a lato. Il calendario (CMP-12) prende il focus solo quando serve (aperto sotto un campo dove si scrive, no).
- Criteri CA-04.1, CA-04.3, CA-04.5, CA-06.1 e CA-06.6 riscritti; casi di prova TC-51, TC-53, TC-55 da rifare.
- Restano da guardare con le stesse regole: Avviso (CMP-15), Elemento del cestino (CMP-17), Riga della colonna (CMP-06) e la freccia del pulsante diviso (CMP-01).
