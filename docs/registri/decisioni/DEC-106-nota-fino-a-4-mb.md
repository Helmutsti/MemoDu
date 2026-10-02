# DEC-106 – Nota fino a 4 MB

**Data:** 2026-10-02 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Una nota arrivava fino a 10 MB di testo (EN-01, SF-17). Vercel non accetta richieste né risposte oltre 4,5 MB (DEC-105), e una pagina delle modifiche poteva contenere fino a 500 blocchi.

## Opzioni valutate
A) Nota fino a 4 MB, con lo stesso controllo e lo stesso avviso di oggi.
B) Tenere 10 MB, caricando le note grandi a pezzi o in un archivio di file.

## Decisione
A, scelta da Manuel Cucca.
- Una nota arriva fino a **4 MB** (circa 4 milioni di caratteri), misurati sui dati che l'interfaccia manda al nucleo; oltre, 413 come prima (`LIMITE_CORPO_BYTE`).
- Il server accetta richieste fino a 4,4 MB (`LIMITE_RICHIESTA_BYTE`): una nota al limite ci sta con il resto del blocco.
- Una pagina delle modifiche si ferma prima di 4 MB di blocchi (`LIMITE_PAGINA_BYTE`), con almeno un elemento; con `altre` il client chiede il resto.

## Conseguenze
- EN-01, SF-17, `architettura/api.md`, `condiviso/src/api.ts`.
- Rischio residuo: un testo fatto quasi solo di virgolette o di a capo cresce viaggiando dentro il blocco e potrebbe superare 4,4 MB anche sotto i 4 MB; la sincronizzazione di quella nota darebbe errore. Da rivedere se capita.
