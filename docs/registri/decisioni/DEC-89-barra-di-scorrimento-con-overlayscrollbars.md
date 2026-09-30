# DEC-89 – Barra di scorrimento con OverlayScrollbars

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-58 vuole una barra sottile sopra il contenuto, che compare scorrendo o con il mouse sull'area e sparisce con una dissolvenza. Il cursore scritto da noi in JavaScript ha dato una barra doppia e un cursore fermo a metà schermo; la barra del sistema resa sottile con CSS (DEC-88) compare solo la prima volta, perché Chromium non la ridisegna quando cambia il «mouse sopra», e non ha la dissolvenza.

## Opzioni valutate
A) La libreria OverlayScrollbars, fatta apposta per le barre sovrapposte al contenuto.
B) Un nostro componente, progettato da capo.
C) La barra del sistema sempre visibile.

## Decisione
Scelta di Manuel Cucca: **A** (`overlayscrollbars` 2.16 e `overlayscrollbars-react` 0.5, licenza MIT).
- Le aree che scorrono (colonna e foglio) sono un componente `AreaScorrevole` che usa la libreria; la barra è della libreria e sta nell'area, quindi si muove e sparisce con lei.
- Comportamento: compare scorrendo o muovendo il mouse sull'area, sparisce dopo 0,8 s con la dissolvenza della libreria; si trascina; non occupa spazio.
- Aspetto dal nostro tema (`os-theme-memodu`): cursore largo 6, tondo, in `icona-tenue` al 50 % e all'80 % sotto il mouse o trascinato, nessun binario.

## Conseguenze
- Supera DEC-88. DEC-58 torna valida anche per la barra di scorrimento, realizzata con la libreria.
- Nuova dipendenza del client; `architettura/architettura.md`.
- CMP-25 in `componenti.md`; codice in `client/src/componenti/AreaScorrevole.tsx`.
