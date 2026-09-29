# DEC-54 – Barra del titolo dello stesso colore dell'app su Windows

**Data:** 2026-09-29 · **Stato:** Superata da DEC-55 · **Idea di origine:** —

## Contesto
Su Windows la barra del titolo della finestra principale prende il colore principale del sistema (blu o viola, se l'utente l'ha attivato), che stacca dall'app. Manuel Cucca vuole che resti con i pulsanti del sistema (_ [] X) e cambi solo colore: lo stesso dello sfondo dell'app, che segue il tema chiaro o scuro.

## Opzioni valutate
A) Colorare la barra con l'attributo di Windows 11 `DWMWA_CAPTION_COLOR` (e `DWMWA_TEXT_COLOR` per il titolo), chiamato dal nucleo Rust con la libreria `windows`, la stessa versione (0.62) che Tauri usa già.
B) Togliere la barra (`decorations: false`) e ridisegnare i pulsanti, con una libreria come `tauri-plugin-decorum` o con componenti nuovi del design system.
C) Lasciare la barra del sistema.

## Decisione
Proposta dell'agente: **A**. Tiene i pulsanti e i comportamenti del sistema (aggancio, doppio clic, trascinamento), non aggiunge componenti al design system e non scarica codice nuovo: `windows` c'è già tra le dipendenze di Tauri, qui diventa diretta solo per Windows.
- Il colore è quello di `sfondo-nota`, lo sfondo della pagina, con il testo del titolo in `testo-primario`: l'app li legge dai token e li manda al nucleo all'avvio e a ogni cambio di tema.
- Solo Windows 11: su Windows 10 l'attributo non esiste e la barra resta quella del sistema. macOS da decidere a parte.

## Conseguenze
- `app/src-tauri/Cargo.toml`: dipendenza `windows` per Windows; comando `colora_barra` nel nucleo; `coloraBarraColTema` in `app/src/finestra.ts`.
- SC-01: la barra del titolo segue lo sfondo e il tema.
