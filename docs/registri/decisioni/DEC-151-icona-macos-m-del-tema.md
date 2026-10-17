# DEC-151 – Icona di macOS: la m del tema nel suo riquadro

**Data:** 2026-10-17 · **Stato:** Proposta · **Idea di origine:** —

## Contesto
Manuel Cucca, il 17/10/2026, sul Mac con la 1.1.0 installata: «quando chiudo l'app torna l'icona nera. sembra essere installata male». Mentre Memodu è aperto, il Dock mostra la M nel colore del tema impostata dal programma (DEC-108); da chiuso mostra `icon.icns`, la M chiara su fondo trasparente, senza riquadro, che DEC-103 e DEC-108 avevano lasciato com'era. Le versioni recenti di macOS mettono le icone senza il riquadro di Apple in un riquadro generico scuro. Manuel Cucca: «deve esserci la m del tema sempre come icona». Un'icona senza riquadro non è possibile: macOS lo aggiunge sempre.

## Opzioni valutate
A) Riquadro chiaro fisso con la M scura, uguale con ogni tema.
B) Catalogo di icone di Apple (Icon Composer) con la versione chiara e quella scura, scelta da macOS secondo il tema anche con il programma chiuso.
C) Come B, ma con il programma aperto la sola M senza riquadro, come oggi.

## Decisione
B, scelta da Manuel Cucca. Tra quattro proposte disegnate dall'agente in Figma ha scelto la più sobria («A · riquadro del tema, m al centro»): [frame](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE/Memodu-%E2%80%93-Design-system?node-id=420-3).
- Tema chiaro: riquadro bianco, M `#1F1F1F`; tema scuro: riquadro `#1F1F1F`, M `#EDEDED`, come le due versioni del logo di DEC-103. La M, ricavata come vettore dal logo, è larga il 55% del riquadro, al centro; niente vetro, ombre interne né trasparenza (dettagli dell'agente).
- Sorgente: `client/src-tauri/icons/macos/Memodu.icon`, che Tauri compila in `Assets.car` con Xcode 26 o più recente. `icon.icns` è la versione chiara, per i sistemi più vecchi e per le compilazioni senza Xcode 26.
- Il programma non cambia più l'icona del Dock: si vede sempre quella del pacchetto, aperto o chiuso. Supera DEC-108 per il Dock; la barra dei menu resta un modello (DEC-73). Windows non cambia (DEC-103).

## Conseguenze
- Tolti `icone_macos.rs` e le dipendenze dirette `objc2`, `objc2-app-kit`, `objc2-foundation` (restano indirette tramite Tauri).
- Il rilascio su GitHub sceglie Xcode 26 o più recente sul Mac, se c'è, prima di compilare.
- SC-01 (icone macOS), TC-06: da rivedere sul Mac l'icona nel Dock e nel Finder, con il programma aperto e chiuso, in tema chiaro e scuro.
