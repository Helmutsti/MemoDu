# DEC-26 – Interfaccia in React

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
L'app è Tauri 2 con l'interfaccia web in TypeScript (DEC-23): serve il framework con cui scrivere schermate, menu e pannelli. Il pezzo più difficile è l'editor della nota (RF-02).

## Opzioni valutate
A) React: il più diffuso, più librerie ed esempi, integrazioni mature con gli editor.
B) Svelte: leggero e compatto, ecosistema più piccolo.
C) Vue: via di mezzo, buon ecosistema.
D) Solid: velocissimo, pochi editor pronti.

## Decisione
Opzione A, scelta da Manuel Cucca: la scelta più ampia di librerie per l'editor e per un agente che scrive il codice; la differenza di velocità non si sente in un'app di note.

## Conseguenze
- `architettura/architettura.md`: interfaccia in React con TypeScript.
