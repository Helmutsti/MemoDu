# DEC-158 – Argon2id nativo e caratteri fissi sul telefono

**Data:** 2026-10-19 · **Stato:** Proposta · **Idea di origine:** —

## Contesto
Sull'iPhone l'accesso caricava all'infinito: Argon2id con 64 MiB (DEC-121) in TypeScript puro (@noble) gira nell'interprete di Hermes; sul Mac senza compilatore veloce ci mette 26,5 s, sul telefono minuti. Inoltre l'app ingrandiva i caratteri con le dimensioni del testo di iOS: con il testo grande «Cerca nelle note» andava a capo e i pulsanti si deformavano, mentre il design system ha misure fisse (DEC-157).

## Opzioni valutate
Argon2id:
A) Restare in TypeScript: minuti a ogni accesso.
B) react-native-argon2 o react-native-libsodium: non si compilano con React Native 0.88 (legacy bridge).
C) Un modulo Expo locale (`telefono/modules/memodu-argon2`) in Swift che chiama `crypto_pwhash` di libsodium 1.0.21, già compilata e firmata nel pacchetto react-native-libsodium (escluso dall'autolinking).

Caratteri:
A) Seguire le dimensioni del testo di iOS (accessibilità), ridisegnando i componenti perché reggano testi più grandi.
B) Caratteri fissi alle misure del design system, come sul computer.

## Decisione
Proposta dell'agente del 19/10/2026, da confermare da Manuel Cucca: C per Argon2id (stessi byte del server, provato con il vettore di prova del computer nell'app e con libsodium in `argon2.test.ts`; 107 ms nel simulatore) e B per i caratteri (`allowFontScaling` spento su testi e campi).

## Conseguenze
- Nuove dipendenze del telefono: react-native-libsodium (solo per la libreria compilata) e libsodium-wrappers-sumo (solo nelle prove).
- Con B chi usa il testo grande di iOS non lo vede nell'app: da rivedere con l'accessibilità (RNF).
