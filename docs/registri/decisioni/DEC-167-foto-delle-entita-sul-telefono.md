# DEC-167 – Foto delle entità sul telefono

**Data:** 2026-10-20 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con il passo 2 di Brainet sul telefono, «Scegli una foto…» mette la foto a un'entità come sul computer (CA-18.13): un'immagine ridotta a 256 px di lato, in JPEG, che viaggia nel blocco dell'entità. Il telefono deve far scegliere una foto e ridurla.

## Opzioni valutate
A) Niente foto dal telefono: si sceglie solo dal computer.
B) `expo-image-picker` per scegliere dalle foto del telefono e `expo-image-manipulator` per ridurla e salvarla in JPEG, i moduli di Expo per l'SDK 58.

## Decisione
B, proposta dell'agente, approvata nel disegno da Manuel Cucca il 20/10/2026 («sì, vai avanti»). La scelta usa il selettore di iOS, che non chiede il permesso per leggere le foto; l'app dichiara comunque perché le userebbe («Memodu usa le tue foto solo per la foto di un'entità di Brainet, quando la scegli tu.»). Fotocamera e microfono non si usano.

## Conseguenze
- `telefono/package.json`, `telefono/app.json` (plugin di expo-image-picker); `telefono/src/componenti/AzioniEntita.tsx`.
