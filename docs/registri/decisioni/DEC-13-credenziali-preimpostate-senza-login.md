# DEC-13 – Credenziali preimpostate, niente login, web rinviato

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-05 prevedeva un account con email e password e una schermata di accesso (SC-05); DEC-07 ne fissava le regole di sicurezza. Manuel Cucca vuole che l'app funzioni senza account visibile: il login resta fuori dall'esperienza. La password però faceva due lavori: autorizzare il dispositivo verso il server, raggiungibile da Internet per la versione web (DEC-04), e ricavare la chiave di cifratura end-to-end (DEC-08).

## Opzioni valutate
Modello di accesso:
A) Tutto locale, niente cloud: nessun account, ma rovescia DEC-01 e sospende RF-10.
B) Cloud senza login visibile.
C) Login mantenuto nella specifica ma non mostrato in questa versione.

Con l'opzione B, come si collega un dispositivo:
A) Chiave dell'installazione, chiesta una volta per dispositivo.
B) Credenziali preimpostate in un file di configurazione dell'app.
C) Nessuna protezione, server solo in rete privata.

Con le credenziali preimpostate, la versione web:
A) Rinviata.
B) Solo in rete protetta, già configurata.
C) Con una schermata di accesso solo per il web.

## Decisione
Cloud senza login visibile, con credenziali preimpostate e web rinviato.

- Installando il server si generano le credenziali dell'installazione: ciò che autorizza i dispositivi e la chiave di cifratura end-to-end.
- Le credenziali si scrivono nel file di configurazione dell'app desktop quando la si installa. L'utente non vede mai email, password, schermate di accesso o comandi di uscita.
- L'installazione resta personale, con un solo utente e senza registrazione (come in DEC-01 e DEC-05).
- La prima fase gira solo su Windows e macOS: la versione web non ha un file di configurazione e passa a una fase successiva (ID-19).

## Conseguenze
- DEC-04, DEC-05 e DEC-07 passano a *Superata da DEC-13*. Di DEC-05 restano valide l'installazione personale e l'assenza di registrazione; DEC-08 resta valida, con la chiave presa dalle credenziali invece che dalla password.
- RF-14 diventa "Collegamento all'installazione"; FL-08 diventa "Collegare un dispositivo"; SC-05 Accesso è eliminata; in SC-06 sparisce la sezione Account.
- RB-41, RB-42, RB-43, RB-44 e RB-50 sono superate; nasce RB-54.
- EN-05 non ha più email e password; EN-06 perde gli stati di uscita e il tipo web.
- RNF-06: solo Windows e macOS. Il breakpoint stretto (solo web) e il drawer sono rinviati con il web.
- RF-16 (Should): con credenziali uguali per tutti i dispositivi non si può far uscire un solo dispositivo; va ripensato.
- Rischio accettato: chi può leggere il file di configurazione di un dispositivo può leggere tutte le note. Dove e come si conservano le credenziali si decide in Fase 7.
- Perdere le credenziali significa perdere l'accesso ai dati: il recupero della password diventa il recupero delle credenziali.
