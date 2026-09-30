# DEC-81 – I Dettagli si chiudono cliccando fuori

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
La finestra Dettagli (CMP-24, DEC-44) si chiudeva solo con la ✕ o con Esc; un clic sul velo non faceva niente. Manuel Cucca: «quando clicco fuori dai dettagli di una nota questo si deve chiudere».

## Opzioni valutate
Nessuna alternativa: richiesta di Manuel Cucca.

## Decisione
- Un clic sul velo, fuori dalla finestra, la chiude come la ✕. Le modifiche sono già salvate (RB-06).
- Con un menu, il calendario o la conferma di eliminazione aperti, il clic chiude prima loro (proposta dell'agente, come per Esc).

## Conseguenze
- SC-03 (riga Dettagli) e CMP-24; codice di `FinestraDettagli` e una prova.
