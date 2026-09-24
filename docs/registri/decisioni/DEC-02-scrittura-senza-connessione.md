# DEC-02 – Scrittura senza connessione

**Data:** 2026-09-24 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-01 limita la prima fase alla modalità cloud. RNF-01 chiede invece che l'utente possa aprire l'app e scrivere subito, in qualsiasi momento. Bisogna stabilire cosa succede quando la connessione manca.

## Opzioni valutate
A) Scrive, poi sincronizza: l'app tiene sul dispositivo una copia di lavoro, si scrive sempre e si sincronizza quando torna la rete.
B) Solo la nota rapida offline: senza rete si creano solo nuove note rapide, che partono appena torna la connessione.
C) Niente senza rete: senza connessione l'app mostra un avviso e non si scrive.

## Decisione
Opzione A. Il cloud resta la fonte di verità e l'unico archivio. La copia sul dispositivo è solo una copia di lavoro che permette di continuare a scrivere quando la rete manca. Non è una modalità offline o solo locale, che resta parcheggiata (ID-06). È l'unica opzione che rispetta RNF-01 in ogni situazione.

## Conseguenze
- RF-10: la sincronizzazione avviene in automatico quando torna la connessione.
- RF-01: la nota rapida funziona anche senza rete.
- Vanno gestite SF-08 (connessione che cade a metà) e SF-22 (la stessa nota modificata da due dispositivi).
- Glossario: nuovo termine *Copia di lavoro*.
