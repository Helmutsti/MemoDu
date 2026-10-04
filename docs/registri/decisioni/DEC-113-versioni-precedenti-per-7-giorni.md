# DEC-113 – Versioni precedenti per 7 giorni

**Data:** 2026-10-04 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-77 il server teneva le versioni precedenti di ogni elemento a scalare per 30 giorni. L'archivio è in Neon (DEC-105), con 0,5 GB nel piano gratuito, e ripristinare una versione dall'app non è ancora deciso. Confermando CA-10.11 Manuel Cucca ha chiesto meno storia.

## Opzioni valutate
A) 1 giorno. B) 7 giorni. C) 14 giorni. Sempre a scalare: tutte nell'ultima ora, una all'ora nell'ultimo giorno, una al giorno dopo.

## Decisione
B, scelta da Manuel Cucca il 04/10/2026. Supera i 30 giorni di DEC-77; la scala resta.

## Conseguenze
- Codice: `GIORNI_STORIA` in `api/src/sincronizzazione.ts`; prova in `sincronizzazione.test.ts`.
- Le versioni di un elemento si sfoltiscono quando l'elemento si scrive di nuovo: quelle di un elemento che non cambia più restano finché non cambia (come con DEC-77).
- Un errore scoperto dopo più di 7 giorni si recupera solo dal ripristino a un momento di Neon (6 ore nel piano gratuito) o dal backup, non ancora fatto (Rinvii).
- CA-10.11, TC-96, `architettura/architettura.md`, `architettura/api.md`.
