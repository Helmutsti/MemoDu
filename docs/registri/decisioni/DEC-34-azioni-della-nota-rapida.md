# DEC-34 – Azioni della nota rapida: Esc per chiudere e Salva diviso

**Data:** 2026-09-28 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Dalla revisione dei wireframe del 25/09/2026 la nota rapida (SC-02) si chiudeva con ✕ tenue in alto a destra, Esc o clic altrove, con il suggerimento «Esc per chiudere» in basso a sinistra e «Apri nel programma» come pulsante tenue in basso a destra. Un pulsante Salva e chiudi era stato escluso perché doppione della chiusura. Provando l'app, Manuel Cucca trova la ✕ ridondante accanto al suggerimento di Esc, e vuole un'azione di salvataggio esplicita.

## Opzioni valutate
Forma di Salva con Apri nel programma:
A) Pulsante diviso: Salva, e accanto una freccia ▾ che apre un menu con Apri nel programma.
B) Pulsante Salva con sotto il testo tenue Apri nel programma.
C) Un solo pulsante «Salva ▾» che apre il menu con Salva e Apri nel programma.

Significato di Esc: annullare (scartare il testo) oppure «ho finito, puoi chiudere».

## Decisione
Scelte di Manuel Cucca:
- Via la ✕.
- «Esc per chiudere» diventa un pulsante tenue: salva e chiude, come il tasto Esc. Esc non annulla e non cancella: vuol dire «ho finito». Per cancellare una nota rapida si entra nel programma e la si elimina.
- Opzione A: pulsante primario diviso «Salva» (salva e chiude) con la freccia ▾ che apre un menu con «Apri nel programma».

Salva ed Esc per chiudere fanno la stessa cosa: Salva è l'azione in evidenza per chi usa il mouse, Esc per chiudere ricorda il tasto. Si accetta il doppione che la scelta del 25/09/2026 voleva evitare.

## Conseguenze
- Nuova variante del pulsante (CMP-01): **Diviso**, componente «Pulsante diviso» nel file Design system.
- Il menu della freccia ha una sola voce: eccezione alla regola di CMP-09 «non per una sola azione».
- Aggiornati SC-02, FL-01, RB-02, RB-62, CA-01.2, CA-01.5, TC-02, TC-05, wireflow di SC-01; mockup di SC-02 da aggiornare dopo la pubblicazione della libreria.
- Il clic altrove e la scorciatoia premuta di nuovo restano come prima (RB-02, RB-04).
