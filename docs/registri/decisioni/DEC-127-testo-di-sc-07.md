# DEC-127 – Il testo di SC-07 parla della copia sul computer, non del server

**Data:** 2026-10-08 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
SC-07 «Memodu non riesce a collegarsi» diceva ancora «Il server delle note non risponde. Avvialo e premi Riprova.», un testo del frammento Must A (DEC-30) superato da DEC-85: il server delle note non c'è più. Oggi SC-07 compare in due casi: la copia di lavoro non si apre o non si scrive (disco pieno, permessi), oppure una nota supera 4 MB (DEC-106). Nel secondo caso SC-07 copre la nota, Riprova fallisce sempre e resta solo «Chiudi comunque», che perde il testo.

## Opzioni valutate
- A) Solo un testo nuovo, valido per tutti e due i casi; la nota oltre 4 MB diventa un'idea per dopo la v1.
- B) Testo nuovo e, per la nota oltre 4 MB, un avviso che lascia la nota modificabile: design, codice e prova prima del rilascio.

## Decisione
Scelta di Manuel Cucca del 08/10/2026: **A**. Il testo di SC-07 diventa «Memodu non riesce a salvare le note su questo computer. Premi Riprova; se non basta, controlla lo spazio sul disco.». La nota oltre 4 MB è ID-36: incollare 2.000 pagine nell'uso personale è quasi impossibile.

## Conseguenze
- `client/src/schermate/Blocco.tsx` e la sua prova con il testo nuovo.
- SC-07, RB-61, SF-30, CA-01.7, CA-01.8 e CA-02.13 con il testo nuovo e senza il rimando al server delle note; chiusa la domanda aperta su SC-07.
- `registri/idee.md`: ID-36.
