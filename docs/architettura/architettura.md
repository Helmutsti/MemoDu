# Architettura

<!-- Fase 7 della guida. Ogni scelta tecnologica è una decisione nel registro. -->

## Scelte tecnologiche
| Ambito | Scelta | Decisione |
|---|---|---|
| App desktop (Windows, macOS) | Tauri 2: interfaccia web in TypeScript, parte nativa in Rust. Framework dell'interfaccia da scegliere | DEC-23 |
| Interfaccia | React con TypeScript | DEC-26 |
| Editor della nota | CodeMirror 6 con anteprima dal vivo | DEC-27 |
| Server (API) | Node con TypeScript. Framework da scegliere | DEC-24 |
| Archivio del server | File system: documenti e immagini cifrati come file | DEC-25 |
| Note | Per ora le gestisce l'API: file markdown in `Documenti\Memodu` sulla macchina di sviluppo (intestazione YAML, titolo come prima riga, date in UTC o solo giorno). Provvisorio: poi database e copia di lavoro sul dispositivo | DEC-28, DEC-29, DEC-30 |
| Hosting | Per ora la macchina di sviluppo (ambiente Locale). L'hosting definitivo è rinviato; deve avere un disco persistente (DEC-25) | — |

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
