# DEC-72 – Il clic sull'icona dell'area di notifica apre Memodu

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Cliccando l'icona di Memodu nell'area di notifica di Windows si apriva il menu (Nuova nota rapida, Apri Memodu, Esci). Manuel Cucca: «vorrei che si aprisse l'app. Il menu mi rallenta: deve apparire solo quando clicco col destro».

## Opzioni valutate
Nessuna alternativa: richiesta di Manuel Cucca.

## Decisione
- Su Windows il clic sinistro sull'icona apre la finestra principale; il menu compare solo con il clic destro.
- Su macOS il menu resta sul clic, come per le altre icone della barra dei menu (proposta dell'agente).

## Conseguenze
- CA-01.6; codice del nucleo (`lib.rs`).
