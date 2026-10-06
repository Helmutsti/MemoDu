# DEC-104 – Server in rete prima della cifratura

**Data:** 2026-10-02 · **Stato:** Superata in parte da DEC-121 · **Idea di origine:** —

## Contesto
DEC-78 (condizione 2) tiene il server solo in locale finché la cifratura end-to-end è spenta. Manuel Cucca vuole rendere pronta l'API e pubblicarla, «dietro token statico per il momento», per usarla da più dispositivi prima della cifratura.

## Opzioni valutate
A) Pubblicare con HTTPS: il server in rete solo dietro HTTPS e gettone, le note in chiaro sul server come rischio accettato fino alla cifratura.
B) Prima la cifratura: preparare l'API ma pubblicarla solo dopo.
C) Pubblicare solo per prova, con note di prova.

## Decisione
A, scelta da Manuel Cucca. Supera la condizione 2 di DEC-78; le altre condizioni restano.
- Il server risponde solo in HTTPS (lo dà Vercel, DEC-105) e ogni richiesta della sincronizzazione porta il gettone dell'installazione (DEC-79).
- Il gettone è **statico**: si genera una volta con `npm run credenziali -w @memodu/api -- <indirizzo>`, che scrive il file `credenziali` da copiare nella cartella dei dati di ogni dispositivo e stampa solo l'impronta. Il server conosce solo l'impronta, nella variabile d'ambiente `MEMODU_IMPRONTA`; il gettone non passa mai dal registro.
- Cambiare il gettone vuol dire generarne uno nuovo, cambiare la variabile e rimettere il file sui dispositivi; la rotazione e il recupero restano rinviati (DEC-79).

## Conseguenze
- **Rischio accettato:** finché la cifratura è spenta, chi ha accesso al database del server (Neon) o al progetto su Vercel legge le note. Da rivedere quando si accende la cifratura (DEC-78, condizione 3).
- DEC-78 resta valida tranne la condizione 2; `architettura/architettura.md`, `architettura/api.md`, `avanzamento.md` (rinvii e rischi).
