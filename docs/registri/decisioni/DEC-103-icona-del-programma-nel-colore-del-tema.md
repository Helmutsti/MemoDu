# DEC-103 – Icona del programma nel colore del tema

**Data:** 2026-10-02 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-73 ha messo l'icona dell'area di notifica nel colore della barra, ma l'icona del programma (barra delle applicazioni, menu Start, file .exe) restava il logo nero, che sulla barra scura quasi non si vede (TC-06, 02/10/2026). Manuel Cucca: «Ti fornisco la versione bianca e nera e tu la devi cambiare in base al tema», con i due loghi in `#1F1F1F` e `#EDEDED`.

## Opzioni valutate
A) Il logo in un riquadro di colore, uguale con ogni tema.
B) Il logo con un contorno.
C) Due versioni del logo, scelte in base al tema.

## Decisione
C, scelta da Manuel Cucca.
- Mentre Memodu è aperto, le finestre hanno l'icona nel colore della barra delle applicazioni, come l'area di notifica: `#1F1F1F` sulle barre chiare, `#EDEDED` sulle scure; cambia da sola quando cambia il tema. Si vede nella barra delle applicazioni e in Alt + Tab.
- Le icone fisse del file, che Windows mostra con il programma chiuso (programma aggiunto alla barra, menu Start, file .exe), non possono seguire il tema: sono la versione chiara (`#EDEDED`), perché la barra predefinita di Windows 11 è scura (proposta dell'agente).
- Anche l'area di notifica usa i due loghi forniti. Su macOS non cambia niente: l'icona della barra dei menu è un modello e `icon.icns` resta com'era.

## Conseguenze
- Codice del nucleo (`lib.rs`); immagini in `client/src-tauri/icons/finestra/` e `icons/area-di-notifica/`, icone fisse di Windows rigenerate con `tauri icon` dal logo chiaro.
- Supera la conseguenza aperta di DEC-73 sull'icona del programma.
