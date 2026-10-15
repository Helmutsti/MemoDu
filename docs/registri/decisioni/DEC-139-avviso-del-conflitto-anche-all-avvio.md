# DEC-139 – Avviso del conflitto anche all'avvio

**Data:** 2026-10-15 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
RB-39 vuole un avviso con il collegamento alla nota quando nasce una copia in conflitto. Nelle prove sul Mac del 15/10/2026, sul codice della 1.0 (TC-88, DEC-128, DEC-136), la copia nata alla prima sincronizzazione dopo l'avvio non ha dato l'avviso: il nucleo lo manda prima che la finestra ascolti, e all'avvio la finestra rilegge dallo stato solo l'accesso scaduto. È il caso di chi scrive senza rete, chiude e riapre Memodu più tardi: nessun testo va perso, ma non sa che c'è una copia.

## Opzioni valutate
A) Il nucleo tiene da parte l'ultima copia in conflitto non ancora mostrata; la finestra, appena pronta, la chiede (una volta sola) e mostra l'avviso. Come per l'accesso scaduto.
B) Rimandare la prima sincronizzazione finché la finestra non è pronta: lega la sincronizzazione alla finestra, che all'accensione del computer non si apre (DEC-91).

## Decisione
Scelta di Manuel Cucca del 15/10/2026: **A**. Quando la finestra riceve l'avviso mentre è aperta, lo segna come visto, così non si ripete alla prossima apertura. Provata sul Mac sul codice della 1.0: la copia nata 2 s dopo l'avvio dà l'avviso con Apri l'altra, e alla riapertura l'avviso non si ripete.

## Conseguenze
- `client/src-tauri/src/sincronizzazione.rs`: `ConflittoDaMostrare` e il comando `conflitto_da_mostrare`; `client/src/schermate/FinestraPrincipale.tsx` lo chiede all'avvio e a ogni avviso.
- Prove automatiche dell'interfaccia per l'avviso durante l'uso e all'avvio (`FinestraPrincipale.test.tsx`).
- TC-88 da riprovare sulla testa di `main` prima del rilascio (DEC-136).
