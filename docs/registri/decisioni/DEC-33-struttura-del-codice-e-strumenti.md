# DEC-33 – Struttura del codice e strumenti di sviluppo

**Data:** 2026-09-28 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Per iniziare il codice di Must A (attività 1) restavano da scegliere l'organizzazione del repository, il gestore dei pacchetti, il framework delle prove e gli strumenti per l'ordine del codice. App (Tauri 2 con React, DEC-23, DEC-26) e server (Node con Fastify, DEC-24, DEC-32) sono entrambi in TypeScript.

## Opzioni valutate
Organizzazione: A) un solo repository con le cartelle `app`, `server` e `condiviso` (workspace npm); B) repository separati; C) un solo pacchetto.
Gestore dei pacchetti: A) npm, già installato; B) pnpm; C) Yarn.
Prove: A) Vitest; B) Jest.
Ordine del codice: A) ESLint e Prettier; B) Biome.

## Decisione
Tutte le opzioni A, scelte da Manuel Cucca: un repository con workspace npm, dove `condiviso` contiene i tipi dei dati usati da app e server (per esempio la Nota dell'API); Vitest per le prove; ESLint per gli errori e Prettier per la formattazione.

## Conseguenze
- `AGENTS.md`: comandi di installazione, avvio, test e lint.
- `architettura/architettura.md`: struttura del repository.
