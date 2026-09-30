# DEC-85 – L'API è solo il deposito della sincronizzazione

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-67 il client tiene le note nella sua copia di lavoro e con DEC-75 … DEC-84 si sincronizza con il deposito dell'API. Nell'API restava però il vecchio archivio delle note (`memodu.db`, `api/src/archivio.ts`) con le richieste `/note`, `/cartelle`, `/cestino`, `/tag`: un terzo archivio non collegato alla sincronizzazione, usato solo dall'app aperta nel browser per le prove, e con le stesse regole scritte due volte (in TypeScript e in Rust). DEC-08 vuole inoltre un server che non legge le note.

## Opzioni valutate
A) Togliere dall'API il vecchio archivio e le sue richieste: l'API resta solo il deposito della sincronizzazione.
B) Tenerlo per le prove nel browser.

## Decisione
Scelta di Manuel Cucca: **A**, su proposta dell'agente.
- L'API offre solo le richieste della sincronizzazione (`architettura/api.md`) e genera le credenziali.
- Le operazioni su note, cartelle, cestino e tag sono comandi del nucleo Rust del client, con gli stessi dati e codici di errore già descritti in `architettura/api.md`; le regole esistono una volta sola, in `client/src-tauri/src/archivio.rs`.
- L'interfaccia nel browser, senza il nucleo, non ha dati: mostra la schermata di blocco. Le prove dell'interfaccia si fanno nell'app o con dati finti nelle prove automatiche.

## Conseguenze
- Supera DEC-30 (note tramite l'API) e, per il dove, DEC-46 (SQLite nell'API: ora SQLite sta nel client e nell'indice del deposito).
- Tolti `api/src/archivio.ts` e le sue prove; il vecchio file `memodu.db` non si usa più (il client lo copia solo se trova quello di un'installazione precedente, DEC-67).
- Niente più `keepalive` nel salvataggio, che serviva solo alle richieste HTTP del browser.
- `architettura/api.md`, `architettura/architettura.md`, `architettura/ambienti.md`, AGENTS.md.
