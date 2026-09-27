# DEC-32 – Fastify per l'API

**Data:** 2026-09-27 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Il server è in Node con TypeScript (DEC-24) e per Must A deve servire le note all'app: aprire, salvare, creare, elencare (DEC-30). Restava da scegliere il framework HTTP.

## Opzioni valutate
A) Fastify: moderno e veloce, controlla i dati in ingresso e in uscita con schemi JSON, buon supporto a TypeScript.
B) Express: il più diffuso, ma senza controllo dei dati incorporato e con tipi TypeScript meno comodi.
C) Hono: leggero e recente, adatto anche a piattaforme serverless, con meno esperienza alle spalle.

## Decisione
A, scelta da Manuel Cucca: il controllo dei dati con gli schemi aiuta a restituire gli errori documentati per ogni endpoint.

## Conseguenze
- `architettura/architettura.md`: server in Node con TypeScript e Fastify.
- `architettura/api.md`: ogni endpoint ha lo schema del suo input e del suo output.
- Restano da definire gli endpoint delle note con i loro errori (Fase 7 di Must A).
