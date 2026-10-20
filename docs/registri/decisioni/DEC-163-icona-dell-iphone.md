# DEC-163 – Icona dell'app per iPhone

**Data:** 2026-10-20 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
L'app per iPhone (DEC-156) aveva l'icona di prova di Expo. Manuel Cucca ha chiesto la stessa icona disegnata per il Mac (DEC-151): la «m» del tema, chiara o scura come il sistema.

## Opzioni valutate
A) Un'immagine fissa da 1024 per l'iPhone.
B) La stessa sorgente del Mac, `client/src-tauri/icons/macos/Memodu.icon`, valida anche per iOS.

## Decisione
B, richiesta di Manuel Cucca del 20/10/2026. Il file dell'icona dichiara le piattaforme quadrate «condivise» (Mac e iPhone); `telefono/app.json` lo indica in `ios.icon`. Su iPhone si vede in chiaro, in scuro e tinta, come le icone di sistema.

## Conseguenze
- Una sola sorgente per le due icone; il catalogo già compilato del Mac (DEC-152) va ricompilato solo se la sorgente cambia.
