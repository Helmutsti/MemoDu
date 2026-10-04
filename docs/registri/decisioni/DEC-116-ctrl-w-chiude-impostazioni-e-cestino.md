# DEC-116 – Ctrl + W chiude anche impostazioni e cestino

**Data:** 2026-10-04 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Una nota si chiude con Ctrl + W o con «Chiudi nota» in Info (DEC-68, DEC-70). Impostazioni e cestino invece non si chiudevano: per liberare l'area di destra bisognava aprire qualcos'altro. Manuel Cucca vuole poter liberare l'area senza aprire altro.

## Opzioni valutate
A) Una × nella barra del percorso, accanto al titolo, per nota, impostazioni e cestino, più Ctrl + W ovunque.
B) Solo la tastiera: Ctrl + W chiude tutto.
C) Un secondo clic sulla voce già aperta nella colonna svuota l'area.

## Decisione
B per ora, scelta da Manuel Cucca il 04/10/2026: Ctrl + W (⌘ + W su Mac) chiude anche impostazioni e cestino e l'area mostra «Nessuna nota aperta», senza riaprire la nota di prima. Dove mettere un pulsante visibile per chiudere impostazioni e cestino resta da decidere (domanda aperta in `avanzamento.md`).

## Conseguenze
- Codice: `chiudiVista` in `client/src/schermate/FinestraPrincipale.tsx`, con una prova.
- Estende DEC-70.
