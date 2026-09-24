# DEC-05 – Installazione personale e accesso

**Data:** 2026-09-24 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-01 stabilisce che il database non prevede più utenti, ma non dice se il servizio è aperto al pubblico. La sincronizzazione cloud (RF-10) e la versione web (DEC-04) richiedono comunque che il server riconosca l'utente.

## Opzioni valutate
Modello di servizio:
A) Installazione personale: un solo account, creato alla prima installazione, senza registrazione pubblica.
B) Servizio pubblico: chiunque si registra e ha il proprio spazio.

Accesso:
A) Email e password.
B) Account esterno (Google, Microsoft, Apple).

## Decisione
Installazione personale con accesso tramite email e password. È coerente con DEC-01: un solo account e nessuna registrazione aperta.

## Conseguenze
- Destinatari: l'unico ruolo, *Utente*, corrisponde al proprietario dell'installazione.
- RF-10: la sincronizzazione richiede l'accesso con email e password.
- Restano rimandati il recupero della password e il rapporto tra password di accesso e chiave di cifratura (domanda aperta su RF-10).
- Da gestire nei flussi: SF-07 (dimenticanze), SF-26 (accesso via link diretto), SF-35 (tentativi ripetuti).
