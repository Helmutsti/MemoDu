# DEC-74 – L'anello del focus solo da tastiera

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Gli stati Focus dei componenti hanno l'anello `focus-anello` di 2 px. Nel codice lo accendeva `:focus-visible`, che il browser considera vero anche con il mouse nei campi di testo e quando il codice sposta il focus dopo un'azione (per esempio chiudendo un menu). Manuel Cucca: «qualsiasi focus scatena il bordo bianco; credevo comparisse solo usando Tab e non per ogni singolo clic. Va rimosso programmaticamente dai componenti».

## Opzioni valutate
Nessuna alternativa: richiesta di Manuel Cucca.

## Decisione
- L'anello si vede solo mentre ci si muove con la tastiera: Tab, frecce, Inizio, Fine, Pagina su e giù. Un clic o un tocco lo spegne finché non si torna alla tastiera.
- Scrivendo non si accende: le frecce in un campo o nel testo della nota e Tab nel testo della nota (che scrive una tabulazione) non contano come navigazione.
- Vale per tutti i componenti con un unico meccanismo (`client/src/modalita.ts`, attributo `data-tastiera` sulla radice); l'anello di errore dei campi resta sempre.

## Conseguenze
- Design system: regola generale sugli stati Focus in `componenti.md`.
- Codice: le regole dell'anello in `base.css` e nei componenti richiedono `data-tastiera`.
