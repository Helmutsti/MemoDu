# DEC-24 – Server con API in Node

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Il server personale (DEC-01, DEC-13) autorizza i dispositivi e conserva blocchi cifrati che non sa leggere (DEC-08); dice a ogni dispositivo cosa è cambiato. Ha pochissima logica.

## Opzioni valutate
A) Node con TypeScript: lo stesso linguaggio dell'interfaccia dell'app (DEC-23), tipi dei messaggi condivisi.
B) Rust: condivide il codice con la parte nativa dell'app, ma è un secondo linguaggio per chi scrive il server.
C) .NET: maturo, ma un terzo linguaggio senza vantaggi per un server così piccolo.

## Decisione
Opzione A, scelta da Manuel Cucca.

## Conseguenze
- `architettura/architettura.md`: backend Node con TypeScript.
- Rinviati alla Fase 7: framework HTTP, forma delle API e protocollo di sincronizzazione (con i rinvii già aperti su frequenza e versioni di app e server).
