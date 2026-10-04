# DEC-115 – File locali nella prima fase

**Data:** 2026-10-04 · **Stato:** Accettata · **Idea di origine:** ID-03

## Contesto
Con DEC-01 la prima fase è solo cloud, e ID-03 (modificare file locali senza sincronizzarli) era parcheggiata fino alla fine della prima fase. Il 04/10/2026 Manuel Cucca ha proposto una voce «Locale» nella colonna che mostra file e cartelle del disco: un nuovo nucleo che li legge e li salva, senza sincronizzare niente, con Memodu usato come editor.

## Opzioni valutate
A) Riaprire ID-03 nella prima fase.
B) Scrivere idea e requisiti subito, sviluppare dopo il rilascio dei Must.
C) Parlarne prima e decidere dopo.

## Decisione
A, scelta da Manuel Cucca il 04/10/2026. Modifica DEC-01: oltre alle note sincronizzate, la prima fase comprende un editor di file locali che non si sincronizzano. Un solo utente e niente modalità offline delle note (ID-06 resta parcheggiata).

## Conseguenze
- ID-03 diventa Accettata, nel nuovo requisito RF-17 in `moduli/locale/1-requisiti.md`, Must, da progettare dopo i Must aperti.
- `generale/visione.md` e il perimetro in `avanzamento.md` vanno aggiornati quando RF-17 è scritto.
