# DEC-37 – API di cartelle e cestino sul file system

**Data:** 2026-09-28 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Il frammento Must B (DEC-36) tiene le cartelle come sottocartelle di Documenti/Memodu e il cestino nella cartella nascosta `.cestino`. L'app passa sempre dall'API, unica a scrivere sul disco (DEC-30). Servono gli endpoint per albero, cartelle, spostamento delle note e cestino, e un modo per riconoscere cartelle ed elementi del cestino.

## Opzioni valutate
Come si riconosce una cartella:
A) Dal percorso relativo alla radice («Lavoro/Clienti»): è già scritto sul disco, nessun dato in più.
B) Da un identificativo salvato in un file nascosto dentro ogni cartella: stabile anche se il nome cambia, ma un file in più per cartella.

Come si conserva un elemento nel cestino:
A) Spostato così com'è in `.cestino`, con un numero se il nome c'è già: si perdono provenienza e data di eliminazione, che SC-04 mostra.
B) In `.cestino/<id>/`, con accanto un file `elemento.json` (tipo, nome, provenienza, data di eliminazione): ogni elemento ha un identificativo e i nomi non si scontrano.

«Unisci» con sottocartelle omonime (RB-31): A) l'API si ferma alla prima e chiede; B) l'API unisce tutto ciò che non si scontra e restituisce le sottocartelle da risolvere, una per una.

## Decisione
Proposte dall'agente; Manuel Cucca ha lasciato la scelta all'agente il 28/09/2026 («mi fido di te»).
- Cartelle riconosciute dal **percorso** (A): una sola persona, un solo dispositivo, nessuna modifica concorrente finché non c'è la sincronizzazione. Il percorso viaggia nel corpo JSON, non nell'indirizzo, perché contiene `/`.
- Cestino con **cartella per elemento e `elemento.json`** (B).
- «Unisci» **unisce il possibile e restituisce le sottocartelle da risolvere** (B): l'app mostra l'avviso di RB-31 per ognuna e richiama lo spostamento.
- I conflitti di nome rispondono `409` con il nome in conflitto; la richiesta ripetuta con `seEsiste` = `numero` o `unisci` applica la scelta. Annulla non chiama l'API.

## Conseguenze
- `architettura/api.md`: endpoint di albero, cartelle, note e cestino.
- `architettura/architettura.md`: struttura di `.cestino`.
- Con la sincronizzazione o il database definitivo (rinvio di DEC-29) le cartelle avranno un identificativo stabile: il percorso va rivisto.
