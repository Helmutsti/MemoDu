# DEC-15 – Icone dalla libreria Lucide

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
I componenti della Fase 5 hanno bisogno di icone di linea a 16 px (regola visiva 8, `misura-icona`, `tratto-icona`). Le prime tre, per il pulsante (CMP-01), erano state disegnate a mano come segnaposto.

## Opzioni valutate
A) Icone disegnate su misura per Memodu.
B) Una libreria open source di icone di linea (Lucide).

## Decisione
Opzione B, scelta da Manuel Cucca: Lucide (lucide.dev, licenza ISC). Le icone sono di linea con estremità tonde, coerenti con la direzione C (DEC-12), e la stessa libreria esiste per il codice. In Memodu si usano a 16 px con tratto 1,5.

## Conseguenze
- CMP-02: ogni icona è un componente `Icona/<nome>` nel file Memodu – Design system, con il nome Lucide e la versione nella descrizione (primo nucleo da lucide-static 1.48.0).
- Si disegna a mano solo un'icona che Lucide non ha, con la stessa griglia e lo stesso tratto.
- Fase 7: nel codice si usa il pacchetto Lucide della tecnologia scelta, alla stessa versione.
