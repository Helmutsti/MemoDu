# DEC-39 – Le note lasciate vuote si cancellano da sole

**Data:** 2026-09-28 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
RB-10 diceva che una nota creata nel programma completo e lasciata vuota resta, e si elimina a mano. Provando l'app, Manuel Cucca trova una nota vuota nell'elenco e si aspetta che le note vuote spariscano da sole, come la nota rapida chiusa vuota (RB-03).

## Opzioni valutate
A) Quando la si lascia, la nota vuota si cancella per sempre, senza passare dal cestino.
B) Quando la si lascia, va nel cestino da sola.
C) Resta, come in RB-10.

## Decisione
A, scelta da Manuel Cucca: una nota senza titolo e senza testo non ha niente da recuperare, e il cestino non si riempie di note vuote.

## Conseguenze
- RB-10 riscritta: una nota senza titolo né testo (solo spazi contano come vuoto) si cancella per sempre quando la si lascia: aprendo un'altra nota, creandone una nuova, aprendo il cestino o chiudendo la finestra.
- CA-02.1 e TC-09 aggiornati.
- Nuovo endpoint `DELETE /note/:id`: cancella la nota solo se è vuota, altrimenti risponde 409 e non tocca niente.
- Le note vuote già esistenti spariscono la prima volta che si aprono e si lasciano.
