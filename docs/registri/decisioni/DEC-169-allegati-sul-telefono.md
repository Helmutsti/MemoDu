# DEC-169 – Allegati sul telefono

**Data:** 2026-10-20 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Brainet sul telefono, passo 3: gli allegati (RF-18, RB-114 … RB-121, DEC-135). Manuel Cucca il 20/10/2026 ha scelto la graffetta nella barra sopra la tastiera, con «Foto» e «File», e in più la foto incollata; un tocco su un allegato apre «Apri», «Dimensioni» (solo per le foto su una riga loro) e «Togli», senza condivisione. Il telefono deve tenere i file, sceglierli dall'app File e mostrarli con l'anteprima di iOS.

## Opzioni valutate
A) Solo librerie già presenti: le foto con `expo-image-picker`, niente «File», i file nel database; «Apri» in una vista web, che non legge Word, Excel e PowerPoint.
B) `expo-file-system`, un modulo di Expo per l'SDK 58: i file nella cartella dell'app, come `allegati/ID/nome` sul computer; «File» con la sua scelta dall'app File (`File.pickFileAsync`); «Apri» con la sua anteprima di iOS (Quick Look, `File.preview`), che legge anche i documenti di Office.
C) Come B, con `expo-document-picker` per «File» e `@react-native-documents/viewer` per l'anteprima: due dipendenze in più per cose che `expo-file-system` fa già.

## Decisione
B, proposta dell'agente del 20/10/2026, accettata da Manuel Cucca il 21/10/2026. Le foto passano da `expo-image-picker` e si riducono con `expo-image-manipulator` (DEC-167); l'impronta SHA-256 con `@noble/hashes`, già nel nucleo. Le regole sono quelle del computer (`archivio_allegati.rs`, `allegati.rs`): stessi blocchi `allegato`, stessi stati dei file, stesse richieste al server.

## Conseguenze
- `telefono/package.json`: una dipendenza nuova, `expo-file-system`; `telefono/src/nucleo/allegati.ts` e il filo degli allegati dopo ogni sincronizzazione.
- Requisiti del telefono, RF-18 (CA-18.55 … CA-18.57), SC-01 del modulo net con i mockup del telefono, componenti.
