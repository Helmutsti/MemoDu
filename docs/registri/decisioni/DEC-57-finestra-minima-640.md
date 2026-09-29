# DEC-57 – Finestra principale più piccola: minimo 640 × 480

**Data:** 2026-09-29 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Dal 25/09/2026 la finestra desktop non scende sotto 1024 × 640 (`breakpoint-medio`, `tokens.md`), perché la colonna era sempre visibile. Con il foglio unico (DEC-55) la colonna si nasconde, e Manuel Cucca ha trovato la finestra «con le dimensioni bloccate».

## Opzioni valutate
A) 640 × 480: il foglio resta comodo senza colonna, stretto ma usabile con la colonna fissata (352 px per il testo); si affianca ad altri programmi.
B) 800 × 600: più spazio con la colonna fissata, si affianca meno.
C) 480 × 320 come la nota rapida: con la colonna fissata il foglio non ci sta, servirebbe una regola in più.

## Decisione
Scelta di Manuel Cucca: **A**, minimo 640 × 480 su Windows e macOS.

## Conseguenze
- Supera la larghezza minima di 1024 px scritta in `tokens.md` il 25/09/2026.
- `app/src-tauri/tauri*.conf.json`: `minWidth` 640, `minHeight` 480.
