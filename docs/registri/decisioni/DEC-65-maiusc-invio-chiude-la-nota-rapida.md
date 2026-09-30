# DEC-65 – Maiusc + Invio chiude la nota rapida

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
La nota rapida (SC-02) si chiude con Chiudi, Esc o Alt + F4 (RB-02, DEC-53). Manuel Cucca: «non posso cliccare il tasto in modo rapido; accanto a Chiudi deve esserci la scorciatoia (Shift + Enter) con icone e deve funzionare; per ora Apri nel programma non deve avere una scorciatoia».

## Opzioni valutate
Nessuna alternativa: richiesta di Manuel Cucca.

## Decisione
- **Maiusc + Invio** salva e chiude la nota rapida come Chiudi; con SC-07 davanti chiede conferma come Esc (RB-62). Nella nota rapida non va a capo.
- Accanto all'etichetta «Chiudi» le icone dei tasti ⇧ e ↵ (Lucide arrow-big-up e corner-down-left, 12 px, `icona-su-pieno` al 70 %, proposte dell'agente); per i lettori di schermo il pulsante dichiara la scorciatoia (`aria-keyshortcuts`).
- «Apri nel programma» resta senza scorciatoia.
- CMP-01 Diviso può mostrare una scorciatoia accanto all'etichetta; senza, non cambia.

## Conseguenze
- Aggiornati RB-02, CA-01.2, TC-02, SC-02, CMP-01, CMP-23; codice del pulsante diviso e della nota rapida. In Figma da aggiornare CMP-01 Diviso, CMP-23 e i mockup di SC-02; le icone arrow-big-up e corner-down-left vanno aggiunte al design system.
