# DEC-156 – App per iPhone in React Native

**Data:** 2026-10-19 · **Stato:** Proposta · **Idea di origine:** ID-11, ID-54

## Contesto
Il prototipo del telefono (`prototipi/telefono/`, pagina web su Vercel) ha mostrato che in una pagina web su iPhone i gesti non sono affidabili: con la tastiera aperta la pagina scorre al contrario del dito, la riga da far scorrere e il foglio di Info vanno scritti a mano, i rimbalzi si perdono e lo stile si stacca da quello del computer perché l'interfaccia è una seconda copia scritta a mano. Manuel Cucca vuole un'interfaccia che non scatti, animazioni pulite e un tocco «a prova di bomba», e non ha esperienza di interfacce touch. DEC-13 limitava la prima fase a Windows e macOS.

## Opzioni valutate
A) Correggere il prototipo web: i gesti restano un'imitazione scritta a mano.
B) Tauri per iOS: la stessa interfaccia React dentro il motore di Safari; gli stessi problemi di tastiera e gesti.
C) SwiftUI nativo: il tocco di Apple al 100%, interfaccia da riscrivere in Swift, linguaggio nuovo per Manuel Cucca.
D) React Native: componenti nativi di iPhone (liste, scorrimento, tastiera, fogli, gesti nativi, animazioni fuori da JavaScript), scritto in React e TypeScript; si riusano la logica in TypeScript e i token, non i componenti HTML e CSS di oggi; strada aperta per Android.

## Decisione
D, scelta di Manuel Cucca del 19/10/2026: l'app per iPhone si scrive in React Native. Il computer resta su Tauri. Il server della sincronizzazione su Vercel resta lo stesso; il prototipo web smette di essere usato.

Proposte dell'agente, da decidere nel modulo `telefono`:
- Expo, con una build di sviluppo installata dal Mac con l'account Apple gratuito (Manuel Cucca, 19/10/2026): l'app va reinstallata ogni 7 giorni; per usarla ogni giorno senza Mac servirà l'Apple Developer Program e TestFlight.
- Copia di lavoro, sincronizzazione e cifratura: riusare il nucleo Rust del computer dentro l'app, oppure riscriverli in TypeScript con le stesse regole e gli stessi byte (`api/src/chiavi.ts`, `client/src-tauri/src/cifratura.rs`).
- Editor della nota: un editor nativo oppure il solo editor in una vista web dentro l'app.
- Componenti di sistema dove esistono (navigazione, fogli dal basso, azioni della riga scorsa, tastiera), seguendo le linee guida di Apple.

## Conseguenze
- Supera in parte DEC-13 (solo Windows e macOS): si aggiunge iPhone. ID-11 e ID-54 tornano in valutazione (lo stato delle idee lo cambia Manuel Cucca).
- Nuovo modulo `docs/moduli/telefono/`, che parte dalla Fase 1.
- Nuovo pacchetto del workspace npm per l'app (nome da decidere), che usa `condiviso`.
- Il design system ha bisogno di una scala per il telefono (testi, misure dei tocchi, breakpoint), decisa prima dei mockup.
