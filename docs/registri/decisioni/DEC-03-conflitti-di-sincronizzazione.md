# DEC-03 – Conflitti di sincronizzazione

**Data:** 2026-09-24 · **Stato:** Superata da DEC-06 · **Idea di origine:** —

## Contesto
Con DEC-02 si può scrivere anche senza connessione, quindi la stessa nota può essere modificata su due dispositivi prima della sincronizzazione (SF-22). Con la cifratura end-to-end (RF-10) il server non legge il contenuto e non può unire le versioni.

## Opzioni valutate
A) Tieni entrambe le versioni: vince l'ultima modifica, l'altra si salva come copia di conflitto e l'utente viene avvisato.
B) Chiedi all'utente: l'app mostra le due versioni e l'utente sceglie o le unisce.
C) Unione automatica (CRDT).
D) Vince l'ultima modifica, senza avvisi.

## Decisione
Opzione D, solo per la prima fase. La modifica più recente sovrascrive l'altra. È la soluzione più semplice e permette di arrivare prima a un prodotto usabile.

## Conseguenze
- RF-10: la regola "vince l'ultima modifica" è documentata nel requisito.
- Rischio accettato: se due dispositivi modificano la stessa nota prima di sincronizzarsi, la modifica meno recente va persa senza avviso. Questo va in tensione con la "fiducia nell'applicazione" di RNF-01.
- ID-10: una gestione dei conflitti senza perdita di testo è parcheggiata, da rivalutare a fine prima fase.
