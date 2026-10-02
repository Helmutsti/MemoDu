# DEC-105 – Server su Vercel con l'archivio in Neon

**Data:** 2026-10-02 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-104 il server va in rete. Manuel Cucca ha scelto Vercel. Le funzioni di Vercel non hanno un disco che resta tra una richiesta e l'altra, quindi l'archivio di DEC-25 (blocchi come file e indice SQLite) non può restare; più istanze della funzione possono girare insieme; una richiesta o una risposta non supera 4,5 MB.

## Opzioni valutate
A) Neon (PostgreSQL) per tutto: indice, versioni e blocchi.
B) Neon per indice e versioni, Vercel Blob per i blocchi.
C) Turso (libSQL, compatibile con SQLite).

## Decisione
A, scelta da Manuel Cucca dopo il confronto con Turso.
- Il server Fastify gira su Vercel senza configurazione: l'ingresso è `api/src/index.ts`. Regione vicina all'Italia (Francoforte) per Vercel e per Neon (proposta dell'agente).
- **Archivio:** una tabella `versioni` con identificativo, versione, numero d'ordine, ora, dimensione e blocco, e una tabella `stato`. Una scrittura (controllo della versione, numero d'ordine, sfoltimento di DEC-77) è una transazione sola: niente più file e indice che non coincidono dopo un errore.
- **Una scrittura alla volta:** un blocco consultivo di Postgres mette in fila le scritture, così i numeri d'ordine si vedono nell'ordine giusto anche con più istanze. Per un solo utente basta (proposta dell'agente).
- **Schema con un numero di versione** e migrazioni applicate all'avvio (`api/src/schema.ts`).
- **Identificativo dell'archivio:** l'archivio ha un identificativo suo, che il server manda con le modifiche; se cambia (server nuovo o ricreato), il client riparte da zero e rimanda tutto (proposta dell'agente).
- **In locale** e nelle prove l'archivio è PGlite (Postgres dentro il processo), nella cartella dei dati o in memoria: nessun account serve per sviluppare.
- Registro di Fastify acceso in rete (senza le intestazioni, quindi senza il gettone), errori 500 senza dettagli interni, controllo di salute `GET /salute`.

## Conseguenze
- Supera DEC-25 (archivio su file system); DEC-24 e DEC-32 (Node e Fastify) restano. Chiude il rinvio sull'hosting definitivo.
- Backup: il ripristino a un momento di Neon (6 ore nel piano gratuito); il resto va nel runbook.
- `architettura/architettura.md`, `architettura/api.md`, `architettura/ambienti.md`, `rilascio/runbook.md`.
