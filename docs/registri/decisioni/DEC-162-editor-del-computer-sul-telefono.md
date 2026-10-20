# DEC-162 – Sul telefono l'editor del computer

**Data:** 2026-10-20 · **Stato:** Proposta · **Idea di origine:** ID-54

## Contesto
Sull'iPhone il testo della nota stava in un campo di testo nativo di iOS (DEC-156): il markdown si vedeva con i simboli (#, **, - [ ]), mentre sul computer la vista Markdown (DEC-130) li nasconde e mostra il testo formattato. Manuel Cucca ha chiesto di implementare il markdown sul telefono (20/10/2026).

## Opzioni valutate
A) Un editor di testo ricco nativo per React Native: un'altra libreria, con regole di formattazione da riscrivere e da tenere uguali al computer.
B) Mostrare il testo formattato solo fuori dalla scrittura e i simboli mentre si scrive: diverso dal computer (DEC-58).
C) Lo stesso editor del computer (CodeMirror con `anteprima.ts`, `scrittura.ts`, `formati.ts`) dentro un componente DOM di Expo («use dom»), che gira in una vista web dell'app, impacchettata nell'app e senza rete.

## Decisione
C, proposta dell'agente. Il telefono usa i file di `client/src/editor` senza copiarli: un solo comportamento per il markdown, le stesse prove. Titolo e testo stanno nella stessa vista web; la bollicina dei formati (CMP-10) resta nativa sopra la tastiera e manda all'editor le voci del cassetto. Le misure sono quelle della scala del telefono (DEC-161, `telefono/src/editor/editor-nota.css`), i colori i token del computer.

Dipendenze nuove, solo JavaScript: `@expo/metro-runtime` e `react-native-web`, che servono ai componenti DOM di Expo 58; la vista web (`@expo/dom-webview`) c'era già con Expo. `telefono/metro.config.js` fa vedere a Metro i file del computer e le librerie della radice, con una sola copia di React.

## Conseguenze
- Sostituisce il campo di testo nativo indicato in DEC-156 per il testo della nota; `telefono/src/dati/formati.ts` non serve più.
- CMP-20 sul telefono; docs/moduli/telefono/1-requisiti.md.
- Da provare a mano sul telefono: scrittura, tastiera, bollicina, caselle da spuntare, annulla.
