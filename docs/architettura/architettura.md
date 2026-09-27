# Architettura

<!-- Fase 7 della guida. Ogni scelta tecnologica è una decisione nel registro. -->

## Scelte tecnologiche
| Ambito | Scelta | Decisione |
|---|---|---|
| App desktop (Windows, macOS) | Tauri 2: interfaccia web in TypeScript, parte nativa in Rust. Framework dell'interfaccia da scegliere | DEC-23 |
| Interfaccia | React con TypeScript | DEC-26 |
| Editor della nota | CodeMirror 6 con anteprima dal vivo | DEC-27 |
| Server (API) | Node con TypeScript e Fastify | DEC-24, DEC-32 |
| Archivio del server | File system: documenti e immagini cifrati come file | DEC-25 |
| Note | Per ora le gestisce l'API: file markdown in `Documenti\Memodu` sulla macchina di sviluppo (intestazione YAML, titolo come prima riga, date in UTC o solo giorno). Provvisorio: poi database e copia di lavoro sul dispositivo | DEC-28, DEC-29, DEC-30 |
| Hosting | Per ora la macchina di sviluppo (ambiente Locale). L'hosting definitivo è rinviato; deve avere un disco persistente (DEC-25) | — |

## Struttura del repository
Un solo repository con workspace npm (DEC-33):

| Cartella | Contenuto |
|---|---|
| `app` | App desktop: interfaccia React in `src`, nucleo Rust di Tauri in `src-tauri` |
| `server` | API in Fastify |
| `condiviso` | Tipi dei dati usati da app e server (per esempio la Nota dell'API) e indirizzo dell'API |

Prove con Vitest, controllo del codice con ESLint e Prettier.

## Schema generale
```mermaid
flowchart LR
    U[Utente] --> F[Frontend]
    F --> A[API]
    A --> D[(Database)]
    A --> E[Servizi esterni]
```

## Sicurezza
- **Autenticazione:** 
- **Autorizzazione per ruolo:** 
- **Protezione dei dati sensibili:** 

## Integrazioni
| Sistema esterno | Cosa si scambia | Se non risponde | Duplicati |
|---|---|---|---|
| | | | |
