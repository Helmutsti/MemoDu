# DEC-109 – Nei conflitti vince la modifica arrivata per ultima al server

**Data:** 2026-10-04 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-76 nei conflitti di RB-36 (eliminata e modificata), RB-37 (spostata in due posti) e RB-38 (rinominata in due modi) vinceva l'ora più tarda della modifica sul dispositivo. Con l'orologio di un dispositivo sbagliato poteva vincere la modifica sbagliata (rischio accettato in DEC-76). Confermando CA-10.4 Manuel Cucca ha riaperto la scelta.

## Opzioni valutate
A) L'ora della modifica sul dispositivo (DEC-76): vince chi ha modificato dopo, se gli orologi sono giusti.
B) L'ordine di arrivo al server: vince la modifica che arriva per ultima. Niente orologi; ma un dispositivo rimasto a lungo senza rete vince quando si ricollega, anche se ha modificato prima.

## Decisione
B, scelta da Manuel Cucca il 04/10/2026, per RB-36, RB-37 e RB-38. Supera la parte di DEC-76 su «più recente»; il resto di DEC-76 resta. Il conflitto lo risolve il dispositivo che arriva per secondo, quindi nella fusione vince sempre la sua modifica. Il testo cambiato da tutte e due le parti tiene ancora le due versioni (DEC-06, RB-39).

## Conseguenze
- Codice: `client/src-tauri/src/archivio_sinc.rs`, funzione `fondi`; prove in `archivio_sinc_test.rs` con ora e arrivo che si contraddicono.
- L'ora della modifica (`modificato_il`) resta nel blocco: serve a capire se l'elemento è cambiato mentre si inviava.
- Cade il rischio dell'orologio sbagliato di DEC-76; al suo posto: la modifica di un dispositivo rimasto senza rete vince anche se è più vecchia.
- RB-36 … RB-38 e FL-07 in `moduli/sincronizzazione/2-flussi.md`, CA-10.4 … CA-10.6, TC-89 … TC-91, `architettura/architettura.md`.
