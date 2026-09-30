# DEC-88 – La barra di scorrimento è quella del sistema, sottile

**Data:** 2026-09-30 · **Stato:** Superata da DEC-89 · **Idea di origine:** —

## Contesto
Con DEC-58 la barra del sistema era nascosta e al suo posto un cursore disegnato in JavaScript (CMP-25) stava sopra il contenuto senza occupare spazio. Quel cursore doveva inseguire da solo scorrimento, aperture e chiusure della colonna e ricaricamenti della pagina: ha dato una barra doppia, un cursore fermo a metà schermo e uno che restava dopo la chiusura della colonna. Manuel Cucca: «se non funziona vuol dire che è progettato male, non che c'è un bug da correggere. Niente workaround».

## Opzioni valutate
A) Tenere il cursore in JavaScript e correggerlo ancora.
B) Usare la barra di scorrimento del sistema, resa sottile solo con CSS.

## Decisione
**B**, proposta dall'agente sulla richiesta di Manuel Cucca di togliere il meccanismo invece di correggerlo.
- Nelle aree che scorrono (colonna e foglio) la barra è quella del sistema: larga 6 (`misura-barra-scorrimento`), tonda, senza binario, cursore in `icona-tenue` al 50 % con il mouse sopra l'area e all'80 % sul cursore o mentre lo si trascina; senza il mouse sopra non si vede.
- È la barra dell'area stessa: si muove e sparisce con lei, senza codice.
- Occupa 6 px; lo spazio è riservato ai due lati (`scrollbar-gutter: stable both-edges`), così nella colonna i margini restano 16 per lato (DEC-87).

## Conseguenze
- Supera DEC-58 per la barra di scorrimento (il cursore sopra il contenuto che non occupa spazio); il resto di DEC-58 resta valido.
- Tolti `client/src/componenti/BarraScorrimento.ts`, il suo CSS e le sue prove; le regole stanno in `base.css`.
- CMP-25 in `componenti.md`. Mentre si scorre da tastiera senza il mouse sopra, il cursore non si vede.
