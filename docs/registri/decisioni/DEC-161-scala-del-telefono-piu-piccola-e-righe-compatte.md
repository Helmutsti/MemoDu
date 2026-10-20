# DEC-161 – Scala del telefono più piccola e righe compatte

**Data:** 2026-10-20 · **Stato:** Accettata · **Idea di origine:** ID-54

## Contesto
Con la scala di DEC-157 (17/13) sull'iPhone testi, righe e pulsanti sembrano troppo grandi. Le cause: la scala porta il testo delle righe da 13 a 17; Inter a parità di misura sembra più grande del carattere di sistema dell'iPhone (più largo, minuscole più alte); le righe dei riquadri hanno spazio-elemento tra l'una e l'altra, quindi una riga occupa 49 punti contro i 44 di Note di Apple.

## Opzioni valutate
A) Scala 15/13: tutto più piccolo in proporzione, righe ancora a 44.
B) Scala 17/13 ma righe compatte: niente spazio tra le righe.
C) Scala 15/13 e righe compatte.

## Decisione
C, scelta di Manuel Cucca del 20/10/2026. Sul telefono ogni misura del design system si moltiplica per 15/13 (circa 1,15) e si arrotonda all'intero: 11 → 13, 13 → 15, 15 → 17, 19 → 22, 30 → 35; spazi 4 → 5, 8 → 9, 12 → 14, 16 → 18, 24 → 28; `raggio-contenitore` 20 → 23. Le righe toccabili restano almeno a 44; le icone restano a 20, la misura della libreria più vicina. Nei riquadri della colonna (Cloud, Brainet, dentro le cartelle, risultati della ricerca) le righe stanno attaccate, senza spazio-elemento tra l'una e l'altra.

## Conseguenze
- Supera DEC-157 (la regola resta la stessa, cambia la proporzione).
- `tokens.md`, sezione «Telefono»; `telefono/src/tema.ts`.
- Il file dei mockup (pagina Telefono) e la pagina «Componenti telefono» del design system vanno riportati alla nuova scala.
