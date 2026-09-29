# DEC-60 – Il testo passa sotto i tasti, che restano flottanti

**Data:** 2026-09-29 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-59 la pagina scorre tutta e la fascia in alto aveva lo sfondo del foglio, proposta dell'agente. Manuel Cucca: «fai passare il testo sotto i tasti e falli flottanti».

## Opzioni valutate
Nessuna alternativa: richiesta di Manuel Cucca.

## Decisione
- La fascia in alto è trasparente: il testo che scorre le passa sotto. Resta la zona da cui si trascina la finestra.
- ··· e i pulsanti della finestra stanno in un gruppo flottante, 8 px dal bordo in alto e da destra, con `sfondo-flottante`, `ombra` e `raggio-interno` (valori proposti dall'agente, da confermare). Dentro il gruppo il ··· resta quadrato come i pulsanti della finestra su Windows (DEC-55).

## Conseguenze
- DEC-59 superata per lo sfondo della fascia.
- Aggiornata SC-01; codice della fascia in alto. Mockup da aggiornare.
