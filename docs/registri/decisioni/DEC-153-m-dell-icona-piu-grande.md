# DEC-153 – La m dell'icona di macOS più grande

**Data:** 2026-10-17 · **Stato:** Proposta · **Idea di origine:** —

## Contesto
Vista l'icona della 1.1.2 installata sul Mac, Manuel Cucca: «la M dovrebbe essere leggermente più grande». DEC-151 voleva la M larga il 55% del riquadro; nel catalogo della 1.1.2 era larga il 44%, perché Icon Composer misura sull'intero quadro di 1024 px e non sul riquadro.

## Opzioni valutate
A) Riportarla al 55%, come il disegno in Figma.
B) Portarla al 60% del riquadro, poco più del disegno.

## Decisione
B (proposta dell'agente, per una M un po' più grande sia dell'icona installata sia del disegno). In `Memodu.icon` l'immagine della M è larga 614 px su 1024; frame in Figma aggiornato. Supera la misura di DEC-151; il resto resta.

## Conseguenze
- `Assets.car` e `icon.icns` ricompilati come da DEC-152.
