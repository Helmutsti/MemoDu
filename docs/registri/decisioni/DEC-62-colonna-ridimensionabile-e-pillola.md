# DEC-62 – Colonna ridimensionabile e tasti in una pillola

**Data:** 2026-09-29 · **Stato:** Superata da DEC-63 (solo la pillola unica di ··· e dei pulsanti della finestra) e da DEC-87 (solo il contenuto che non si deforma) · **Idea di origine:** —

## Contesto
La colonna (DEC-55) aveva la larghezza fissa di 288 px; i tasti in alto a destra stavano in un rettangolo arrotondato con i pulsanti quadrati (DEC-60, eccezione a CMP-01 di DEC-55). Manuel Cucca: «voglio poter ridimensionare la sidebar quando è aperta; il suo contenuto non deve cambiare, deve rimanere inflessibile sotto una certa larghezza utile; posso ridimensionarla fino a 10 px e anche di più del normale». E: «i tasti a destra sono poco pillolosi, solo un rettangolo molto arrotondato: deve essere allineato a tutto lo stile».

## Opzioni valutate
Nessuna alternativa: richieste di Manuel Cucca; i dettagli sono proposte dell'agente.

## Decisione
Scelte di Manuel Cucca:
- La colonna aperta o fissata si ridimensiona trascinando il suo bordo destro, da 10 px a più della larghezza normale.
- Sotto la larghezza normale (288) il contenuto non si deforma: resta largo come sempre e il bordo lo taglia. Sopra, le righe si allargano.
- ··· e i pulsanti della finestra stanno in una pillola nello stile dell'app: alta 32, 4 px di margine e tra i pulsanti, pulsanti tondi da 24 (`misura-controllo-piccolo`) in `icona-tenue`, a 8 px sia dal bordo in alto sia da destra; Chiudi rosso al passaggio. L'eccezione del ··· quadrato 46 × 32 non c'è più. (Alta 40 come CMP-10 era troppo grossa e più vicina al bordo in alto che a destra: corretta su indicazione di Manuel Cucca.)

Proposte dell'agente, da confermare:
- larghezza massima: la finestra meno 48 px lasciati al foglio;
- Memodu ricorda la larghezza; doppio clic sulla maniglia per tornare a 288;
- la maniglia (8 px, una linea di 2 px in `bordo-divisore` al passaggio) si raggiunge con Tab e si sposta con le frecce di 16 px.

## Conseguenze
- Superate l'eccezione a CMP-01 (DEC-55) e la forma del gruppo di DEC-60.
- Aggiornati SC-01, CMP-01 in `componenti.md`; codice della colonna, della fascia in alto e dei pulsanti della finestra. Mockup da aggiornare.
