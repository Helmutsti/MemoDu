# DEC-73 – Icona dell'area di notifica nel colore del tema

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
L'icona dell'app è il logo nero su fondo trasparente. Manuel Cucca: «l'icona dell'app è nera, ma dovrebbe essere bianca in modalità dark e nera in modalità chiara».

## Opzioni valutate
Nessuna alternativa per l'area di notifica: richiesta di Manuel Cucca.

## Decisione
- Nell'area di notifica di Windows l'icona è nera con la barra delle applicazioni chiara e bianca con quella scura. Segue il colore della barra («Scegli la modalità di Windows»), non quello delle app, e cambia da sola quando cambia il tema. Senza l'impostazione vale la barra scura, quella predefinita di Windows 11.
- Su macOS l'icona della barra dei menu è un modello: il sistema la colora come le altre.
- Le due immagini sono in `client/src-tauri/icons/area-di-notifica/`, generate dal logo.

## Conseguenze
- Codice del nucleo (`lib.rs`), nuova dipendenza `winreg` solo per Windows, per leggere il tema della barra.
- L'icona del programma (barra delle applicazioni, menu Start, file .exe) su Windows non può cambiare con il tema: resta da decidere come renderla visibile su fondo scuro.
