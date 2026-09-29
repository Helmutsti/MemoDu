# DEC-52 – Data scritta che non esiste: messaggio sotto il campo

**Data:** 2026-09-29 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Nella finestra Dettagli (CMP-24) le date si possono scrivere nel campo (GG/MM/AAAA). Con CA-04.3, confermato il 29/09/2026, una data che non esiste («31/02/2021», «abc») tornava quella di prima senza dire niente. CMP-03 prevede uno stato di errore con un messaggio sotto il campo, ma per le date mancava il testo.

## Opzioni valutate
A) Lasciare così: la data torna com'era e basta.
B) Mostrare sotto il campo «Data non valida: scrivi GG/MM/AAAA», finché non la si corregge o si esce dal campo.

## Decisione
Scelta di Manuel Cucca: **B**. Confermando con Invio una data che non esiste, il testo resta nel campo, l'anello diventa rosso e sotto compare «Data non valida: scrivi GG/MM/AAAA» (stato Errore di CMP-03). Il messaggio sparisce appena il testo è una data valida o vuoto. Uscendo dal campo con una data che non esiste, torna quella di prima e il messaggio sparisce. Il messaggio è collegato al campo e si annuncia quando compare.

## Conseguenze
- `moduli/note/1-requisiti.md`: CA-04.3.
- `moduli/note/8-test.md`: TC-53.
- `design-system/componenti.md`: CMP-24, stato Errore.
