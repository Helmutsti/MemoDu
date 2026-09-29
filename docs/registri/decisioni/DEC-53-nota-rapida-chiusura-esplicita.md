# DEC-53 – Nota rapida: si chiude solo con Chiudi o Esc

**Data:** 2026-09-29 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
RB-02, DEC-34 e DEC-50 chiudono la nota rapida anche con un clic altrove. Provando in Tauri su Windows il 29/09/2026, con più note rapide aperte il clic su un altro programma chiudeva solo quella che aveva il focus e lasciava aperte le altre; in generale la nota rapida si chiudeva da sola mentre si faceva altro.

## Opzioni valutate
A) Come prima: il clic altrove chiude la nota rapida che aveva il focus.
B) Il clic su un altro programma chiude tutte le note rapide aperte.
C) Il clic altrove non chiude: la nota rapida si chiude solo con un gesto esplicito.

## Decisione
Scelta di Manuel Cucca: **C**. «La chiusura deve essere esplicita con il tasto o con Esc: non può chiudersi da sola mentre faccio altro.»
- La nota rapida si chiude solo con **Chiudi**, con il tasto **Esc** o con la chiusura della finestra dal sistema (Alt + F4), oltre che con «Apri nel programma».
- Perdendo il focus la nota rapida **si salva** (RB-06) e resta aperta, in primo piano.
- Il resto di DEC-34 e DEC-50 resta valido.

## Conseguenze
- DEC-50 è superata per il clic altrove; DEC-34 lo era già per il pulsante Esc per chiudere e il nome Salva.
- Aggiornati RB-02, RB-62, FL-01, CA-01.2, SC-02, TC-02 e il diagramma di navigazione in `interfaccia/4-schermate.md`; codice della nota rapida da cambiare.
