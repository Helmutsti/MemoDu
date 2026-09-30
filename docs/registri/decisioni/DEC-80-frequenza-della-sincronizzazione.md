# DEC-80 – Quando parte la sincronizzazione

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
RF-10 dice che la sincronizzazione parte periodicamente in background e al ritorno della rete (DEC-02); la frequenza era rinviata alla Fase 7. Finché va tutto bene è invisibile (RB-40).

## Opzioni valutate
A) All'avvio, poco dopo ogni salvataggio, ogni 30 s e al ritorno della rete.
B) Solo a intervalli regolari (ogni minuto), all'avvio e al ritorno della rete.
C) Quasi in tempo reale, con il server che avvisa i dispositivi su un collegamento sempre aperto.

## Decisione
Scelta di Manuel Cucca: **A**.
- Parte all'avvio, qualche secondo dopo ogni salvataggio, ogni 30 s per ricevere le modifiche degli altri dispositivi e quando la rete torna.
- Senza rete i tentativi si diradano: 5 s, 10 s, 20 s e così via fino a 5 minuti; un tentativo riuscito riporta al ritmo normale.

## Conseguenze
- Risolto il rinvio sulla frequenza (RF-10).
- `architettura/architettura.md`, sezione sulla sincronizzazione.
