# DEC-27 – Editor CodeMirror con anteprima dal vivo

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
RF-02 e CMP-20 chiedono un testo formattato mentre si scrive, con i simboli markdown visibili solo sulla riga del cursore, checklist, elenchi, titoli, sottolineato e immagini; le note restano markdown (RF-13).

## Opzioni valutate
A) CodeMirror 6 con anteprima dal vivo: il testo è markdown, decorazioni nascondono i simboli fuori dalla riga del cursore e disegnano titoli, caselle e immagini.
B) TipTap (ProseMirror): molte funzioni pronte, ma nasconde sempre i simboli e converte da e verso markdown con possibili perdite.
C) Milkdown: markdown più fedele di TipTap, stesso limite sui simboli.
D) Lexical: stessi limiti di TipTap.

## Decisione
Opzione A, scelta da Manuel Cucca: è l'unica in cui il comportamento di RF-02 è naturale e il markdown resta l'originale, senza conversioni.

## Conseguenze
- `architettura/architettura.md`: editor CodeMirror 6.
- L'anteprima dal vivo (decorazioni e widget per titoli, elenchi, checklist, sottolineato, immagini) è lavoro da pianificare in Fase 8.
