# DEC-47 – Libreria better-sqlite3 per SQLite

**Data:** 2026-09-29 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-46 l'API Node salva i dati in SQLite. Per usarlo da Node serve una libreria, che diventa una dipendenza dell'API; la ricerca nel testo (RF-08) richiede l'estensione FTS5.

## Opzioni valutate
A) better-sqlite3: la più diffusa, stabile da anni, modulo compilato.
B) `node:sqlite`, integrato in Node: nessuna dipendenza, ma nella documentazione di Node 26 ancora «release candidate» e senza FTS5 documentato; il progetto usa Node 24.

## Decisione
Scelta di Manuel Cucca: **A**, better-sqlite3. Verificato nella sua documentazione (`docs/compilation.md`): il SQLite incluso è compilato con `SQLITE_ENABLE_FTS5`.

## Conseguenze
- Nuova dipendenza di `server` quando si scrive il codice del database.
- Da verificare all'installazione su Windows e macOS che non serva compilare il modulo sulla macchina.
- `node:sqlite` si può rivalutare quando sarà stabile, se si vuole togliere la dipendenza.
