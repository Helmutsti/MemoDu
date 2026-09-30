# DEC-87 – Margini uguali ai due lati della colonna

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-62 la colonna si stringe trascinando il bordo; sotto i 288 px il contenuto non si deformava: restava largo come sempre e il bordo lo tagliava, togliendo prima il margine di destra e poi quello di sinistra. Manuel Cucca ha notato che la colonna non ha lo stesso margine ai due lati: a 278 px erano 16 a sinistra e 6 a destra.

## Opzioni valutate
A) Lo stesso margine ai due lati a ogni larghezza: sono le righe a stringersi.
B) Come DEC-62.

## Decisione
Scelta di Manuel Cucca: **A**. La colonna ha 16 (`spazio-contenitore`) a sinistra e a destra a qualsiasi larghezza; stringendola si stringono le righe, i titoli lunghi finiscono con «…» e i numeri restano allineati a destra. Sotto i 32 px i due margini scendono insieme.

## Conseguenze
- Supera DEC-62 per il contenuto che non si deforma; il resto di DEC-62 (colonna ridimensionabile, pillola) resta valido.
- SC-01 in `interfaccia/4-schermate.md`; codice di `FinestraPrincipale.css`.
