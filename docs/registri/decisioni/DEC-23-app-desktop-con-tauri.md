# DEC-23 – App desktop con Tauri

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
La prima fase è un'app desktop per Windows e macOS (DEC-13, RNF-06). Deve essere pronta a scrivere entro 2 s dall'avvio e mostrare la nota rapida entro 0,2 s dalla scorciatoia (RNF-01), con un editor che formatta il markdown mentre si scrive (RF-02). La versione web è solo rinviata (ID-19).

## Opzioni valutate
A) Tauri 2: interfaccia web (HTML, CSS, TypeScript) nel motore del sistema, parte nativa in Rust. Leggera e veloce all'avvio; editor e design system dall'ecosistema web, riusabili per il web. Due motori da provare (WebView2 su Windows, WebKit su macOS).
B) Electron: interfaccia web con un Chromium incluso. Un solo motore, ma pesante in dimensione, memoria e avvio.
C) .NET (Avalonia o MAUI): interfaccia nativa in C#. Pochi editor markdown maturi, niente riuso per il web.

## Decisione
Opzione A, scelta da Manuel Cucca: rispetta RNF-01 con meno sforzo e tiene aperta la strada al web.

## Conseguenze
- `architettura/architettura.md`: frontend Tauri 2.
- Rinviati alla Fase 7: framework dell'interfaccia (React, Svelte, Vue…), editor markdown, cosa sta nella parte Rust e cosa nell'interfaccia, database locale e ricerca (vedi `docs/avanzamento.md`).
