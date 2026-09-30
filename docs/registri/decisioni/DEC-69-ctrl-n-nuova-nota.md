# DEC-69 – Ctrl + N crea una nuova nota

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
FL-09 prevede una scorciatoia da tastiera per creare una nota nel programma completo (RF-11), ma non diceva quale. Manuel Cucca: «Ctrl + N deve aprire una nuova nota».

## Opzioni valutate
Nessuna alternativa: richiesta di Manuel Cucca.

## Decisione
- Nella finestra principale **Ctrl + N** su Windows e **⌘ + N** su macOS (proposta dell'agente, come le altre scorciatoie del Mac) creano una nuova nota come il + delle non organizzate: la nota aperta si salva, quella nuova nasce nella radice e si apre (FL-09, RB-09, RB-10).
- Funziona anche mentre si scrive nella nota. Con una finestra di dialogo o SC-07 davanti non fa niente. Tenendo premuto non crea più note.
- La scorciatoia globale della nota rapida resta Ctrl + Alt + N (RF-01).

## Conseguenze
- FL-09 e la tabella delle interazioni di RF-11; codice di `FinestraPrincipale` e una prova.
- La nota nasce nella radice anche se c'è una cartella aperta: per la «cartella selezionata» di FL-09 vale solo il tasto destro su una cartella.
