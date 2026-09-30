# DEC-84 – Senza credenziali si lavora in locale

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** ID-06

## Contesto
DEC-20 blocca la finestra con credenziali mancanti o rifiutate. Con la copia di lavoro nel client (DEC-67) Manuel Cucca aveva chiesto che il client funzioni anche senza API; con DEC-20 il client si bloccherebbe finché il file `credenziali` (DEC-79) non esiste.

## Opzioni valutate
A) Senza il file `credenziali` il client lavora solo sulla copia di lavoro e non sincronizza.
B) Schermata di blocco, come DEC-20.

## Decisione
Scelta di Manuel Cucca: **A**.
- Senza il file `credenziali` Memodu si apre e funziona sulla copia di lavoro, senza provare a sincronizzare e senza avvisi. Appena il file c'è, la sincronizzazione parte.
- Il blocco resta solo per le credenziali **rifiutate** dal server (RB-57).

## Conseguenze
- Supera DEC-20 per le credenziali mancanti; DEC-20 resta valida per quelle rifiutate.
- RB-57, FL-08 e CA-14.3 aggiornati.
- È un primo passo verso la modalità solo locale (ID-06, parcheggiata), limitato all'assenza delle credenziali.
