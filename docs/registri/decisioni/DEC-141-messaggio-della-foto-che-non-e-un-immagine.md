# DEC-141 – Messaggio della foto che non è un'immagine

**Data:** 2026-10-15 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
CA-18.13 vuole che, scegliendo come foto di un'entità un file che non è un'immagine, compaia «un messaggio» e niente cambi; il testo non era fissato. Nel collaudo sul Mac della testa di `main` (15/10/2026, TC-207, DEC-136) la foto restava com'era, ma compariva l'avviso generico «Non è stato possibile completare l'operazione. La colonna mostra com'è adesso.», che non dice il motivo; il nucleo aveva già «Il file non è un'immagine», non mostrato.

## Opzioni valutate
A) «Il file scelto non è un'immagine: la foto non cambia.»
B) «Come foto si possono usare solo immagini (JPG, PNG, HEIC…).»
C) Lasciare l'avviso generico.

## Decisione
Scelta di Manuel Cucca del 15/10/2026: **A**, mostrata nell'avviso della finestra al posto di quello generico.

## Conseguenze
- `client/src-tauri/src/archivio_brainet.rs`: il testo in `FOTO_NON_IMMAGINE`; `client/src/brainet/VisteBrainet.tsx`: Entità mostra il messaggio del nucleo per un errore 400 di Scegli una foto…; prove del nucleo e dell'interfaccia.
- SC di Entità in `moduli/net/4-schermate.md`.
- TC-207 da riprovare sul Mac.
