# DEC-107 – Testo della nota su tutta la larghezza

**Data:** 2026-10-02 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-58 il testo della nota si fermava a una misura di lettura di 640 px, allineato a sinistra con 24 px dal bordo: su una finestra larga restava vuota la parte destra del foglio. Manuel Cucca: «le note non prendono l'intera larghezza dello spazio dedicato a loro».

## Opzioni valutate
A) Tutta la larghezza del foglio, con lo stesso margine ai due lati.
B) La misura di lettura, ma al centro del foglio.
C) Più larga, fino a un massimo (per esempio 960 px).

## Decisione
A, scelta da Manuel Cucca. Il testo occupa tutta la larghezza del foglio, con `spazio-gruppo` (24) a sinistra e a destra; resta allineato a sinistra. Supera la misura di lettura di DEC-58; il resto di DEC-58 resta.

## Conseguenze
- Codice: `client/src/schermate/NotaAperta.css`; tolto il token `misura-lettura`.
- CMP-20 in `componenti.md`, `tokens.md`. In Figma i mockup di SC-03 e la nota aperta di SC-01 sono ancora larghi 640: da aggiornare.
