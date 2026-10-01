# DEC-98 – Righe di Info senza spazi ai lati

**Data:** 2026-10-01 · **Stato:** Superata da DEC-100 · **Idea di origine:** —

## Contesto
Con DEC-97 le righe di Info (cartella, creazione, fine validità, tag), «Modificata» e l'intestazione della Finestra avevano `spazio-controllo` (12) ai lati, dentro il margine di 8 del contenitore. Manuel Cucca ha notato che in CMP-24 questi pezzi interni, insieme al contenitore, fanno un doppio margine.

## Opzioni valutate
A) Togliere il margine solo a «Modificata» e all'intestazione, che non si evidenziano; le righe restano pillole con 12 dentro.
B) Togliere il margine ai lati a tutte le righe, a «Modificata» e all'intestazione: partono a 8, dal margine del contenitore; il campo del titolo e le voci tengono il loro, da componenti.
C) Margine di 20 sul contenitore e niente dentro, pillole comprese.

## Decisione
B, scelta di Manuel Cucca, 01/10/2026. In Info l'unico margine ai lati è quello del contenitore (`spazio-flottante`, 8): icone delle righe, «Modificata» e «Info» partono a 8. Il campo del titolo (CMP-03) e le voci (CMP-07) sono componenti e tengono `spazio-controllo` dentro la loro pillola, quindi il loro testo parte a 20.

## Conseguenze
- Supera, per Info, la regola 2 di DEC-97 sulle righe: la riga di Info non è più una pillola con 12 dentro. Le altre righe a pillola (voce di menu, campo, risultato) restano come in DEC-97.
- Passandoci sopra la riga si evidenzia ancora, a tutta larghezza, con l'icona sul bordo dell'evidenziazione.
- CMP-24 in libreria e nel codice (`Info.css`), `componenti.md` (Spazi dei contenitori e CMP-24).
