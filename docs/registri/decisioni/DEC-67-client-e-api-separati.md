# DEC-67 – Client e API separati, copia di lavoro nel nucleo Rust

**Data:** 2026-09-30 · **Stato:** Proposta · **Idea di origine:** —

## Contesto
Le note passano dall'API Node (DEC-30), che tiene il database SQLite (DEC-46): senza l'API avviata il client mostra SC-07 e non si scrive. DEC-02 chiede invece una copia di lavoro sul dispositivo, così si scrive sempre. Inoltre, quando l'API andrà nel cloud, non potrà tenere lo schema di oggi: con DEC-08 il server vede solo blocchi cifrati, mentre oggi conosce titoli, cartelle e tag in chiaro. Manuel Cucca ha chiesto di separare client e API in due cartelle avviabili ciascuna da sola, con il client che funziona anche senza API.

## Opzioni valutate
Dove sta la copia di lavoro:
A) Nel nucleo Rust del client, con SQLite (rusqlite) e le regole di `archivio.ts` riscritte in Rust; l'interfaccia usa comandi Tauri al posto dell'HTTP.
B) Nell'interfaccia TypeScript, con il plugin SQL di Tauri: si riusa `archivio.ts`, ma il plugin non garantisce le transazioni su più comandi e ogni finestra avrebbe la sua copia della logica.
C) Il client si porta dietro l'API Node e la avvia in locale: poco codice da cambiare, ma l'installazione include Node e l'API di oggi resta incompatibile con DEC-08.

## Decisione
Scelta di Manuel Cucca: **A**.
- Due cartelle: `client` (app Tauri) e `api` (Fastify). Si avviano separatamente: `npm run client` e `npm run api`. `condiviso` resta per i tipi dei dati usati da tutte e due.
- La copia di lavoro è un database SQLite nel nucleo Rust, con lo schema di DEC-48, nel file `copia-di-lavoro.db` della cartella dei dati di DEC-46 (`MEMODU_CARTELLA` la sostituisce). Finestra principale e note rapide passano tutte dal nucleo, un'operazione alla volta, ciascuna in una transazione.
- I comandi del nucleo hanno gli stessi dati e gli stessi codici di errore degli endpoint dell'API (architettura/api.md), così le schermate non cambiano.
- Alla prima apertura, se nella stessa cartella c'è il database dell'API (`memodu.db`), la copia di lavoro parte da una sua copia; l'originale non si tocca. Deduzione dell'agente, da confermare.
- Nel browser usato per le prove non c'è il nucleo: l'interfaccia chiama l'API locale come prima.

## Conseguenze
- Supera DEC-30 (note tramite l'API) e, per il dove, DEC-46 (SQLite nell'API): da segnare quando questa decisione è accettata.
- `architettura/architettura.md`, `architettura/ambienti.md`, `architettura/api.md`, AGENTS.md: nuove cartelle, nuovi comandi, copia di lavoro nel nucleo.
- Per ora le stesse regole dei dati esistono due volte, in `api/src/archivio.ts` e in `client/src-tauri/src/archivio.rs`. Con la sincronizzazione (RF-10) l'API diventa il deposito dei blocchi cifrati e le regole restano solo nel client.
- Gli id delle note nascono sul dispositivo: la sincronizzazione ne ha bisogno per creare note senza rete.
- SC-07 nel client ora compare solo se la copia di lavoro non si apre o non si scrive; il testo «Il server delle note non risponde» va rivisto (domanda aperta su SC-07).
- La sincronizzazione tra copia di lavoro e API non esiste ancora: resta il frammento di RF-10.
