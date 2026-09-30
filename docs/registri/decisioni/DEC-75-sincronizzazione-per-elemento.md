# DEC-75 – Sincronizzazione per elemento, con le versioni precedenti sul server

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
RF-10 chiede di sincronizzare la copia di lavoro (DEC-02, DEC-67) con il server, con la cifratura end-to-end di tutti i dati (DEC-08): il server non legge niente, quindi non può unire né ordinare. Resta da decidere cosa viaggia tra client e server. I conflitti devono salvare tutte e due le versioni (DEC-06) e seguire RB-36, RB-37, RB-38 e RB-30.

## Opzioni valutate
A) Un blocco cifrato per elemento (nota, cartella, tag, avviso), con un numero di versione.
B) Un blocco cifrato per tutto l'archivio.
C) Un registro di operazioni cifrate, riapplicate in ordine su ogni dispositivo.

## Decisione
Scelta di Manuel Cucca: **A, con le versioni precedenti tenute sul server**.
- Ogni elemento viaggia come un blocco cifrato a sé, con dentro anche i suoi collegamenti (per esempio la cartella della nota e i suoi tag). Il server conosce solo l'identificativo, la versione, la dimensione e l'ora.
- Il server tiene anche le versioni precedenti di ogni blocco: danno la storia e il ripristino che il registro di operazioni avrebbe dato da solo.
- Il confronto tra le versioni e i conflitti li risolve il client, che vede il contenuto in chiaro.

Scartate: B perché ogni modifica rimanderebbe tutto e un conflitto si risolverebbe solo scegliendo un archivio intero, contro DEC-06; C perché ogni dispositivo dovrebbe riapplicare le operazioni esattamente allo stesso modo (per esempio le unioni di cartelle di RB-31), il registro crescerebbe senza che il server possa compattarlo, e il server vedrebbe il ritmo di ogni modifica.

## Conseguenze
- `architettura/architettura.md`: sezione sulla sincronizzazione.
- Da decidere, in Fase 7: come si rilevano modifiche e conflitti (versioni, elenco delle modifiche sul server), quante versioni precedenti si tengono e per quanto, cifratura, credenziali, frequenza, soglia dell'avviso, versioni diverse di app e server.
- Il ripristino di una versione precedente è una funzione nuova per l'utente: se e come mostrarla si decide con i requisiti (per ora non è in RF-10).
