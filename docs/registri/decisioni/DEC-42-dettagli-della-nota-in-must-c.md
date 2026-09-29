# DEC-42 – Posto dei dettagli della nota nel frammento Must C

**Data:** 2026-09-29 · **Stato:** Superata da DEC-44 · **Idea di origine:** —

## Contesto
DEC-41 lascia da decidere se i dettagli della nota entrano in Must C. RF-04 vuole la data di creazione di sistema «sempre visibile nei dettagli della nota», ma nessuna schermata ha un posto per i dettagli (domanda aperta di RF-04, SC-03). La Fase 6 di Must C disegna la riga sotto il titolo, dove vanno i tag: decidere i tag senza i dettagli rischia di far ridisegnare la riga subito dopo.

## Opzioni valutate
A) Dentro Must C, solo il posto: si decide dove stanno i dettagli e si mostrano le date che i file hanno già (creazione e ultima modifica).
B) Dentro Must C, tutto RF-04: anche data di creazione scelta e fine validità, con il calendario.
C) Fuori: Must C disegna solo i tag, i dettagli si risolvono con RF-04.

## Decisione
Scelta di Manuel Cucca: **A**. In Must C si decide il posto dei dettagli della nota e vi si mostrano data di creazione e ultima modifica, che i file delle note hanno già (DEC-28). Data di creazione scelta, fine validità e calendario restano a RF-04.

## Conseguenze
- `docs/avanzamento.md`: Must C comprende RF-06 e la parte di RF-04 che mostra creazione e ultima modifica.
- La domanda aperta sui dettagli della nota (`moduli/note/8-test.md`) si risolve nel mockup di Must C.
