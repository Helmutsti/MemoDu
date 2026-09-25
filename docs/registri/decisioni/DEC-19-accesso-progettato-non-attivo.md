# DEC-19 – Accesso progettato ma non attivo

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-13 ha tolto il login dalla prima versione: i dispositivi si collegano con credenziali preimpostate. Tra le conseguenze c'erano l'eliminazione di SC-05 Accesso e della sezione Account di SC-06, e un rinvio per togliere quelle schermate dai wireframe. Rivedendo i pacchetti in viaggio, Manuel Cucca ha precisato di non voler togliere l'accesso: vuole portarlo avanti fino al design.

## Opzioni valutate
A) Il login torna nel prodotto: una nuova decisione supera DEC-13 e si riprendono requisiti, flussi, entità e regole.
B) Il login resta fuori dalla prima versione ma si progetta fino al design, pronto per quando servirà.

## Decisione
Opzione B. DEC-13 resta valida per il prodotto della prima versione (credenziali preimpostate, niente login, web rinviato). L'accesso (SC-05, sezione Account di SC-06) resta nei wireframe e si porta nel design system: modulo di accesso e campo password.

## Conseguenze
- `moduli/sincronizzazione/4-schermate.md`: SC-05 torna, segnata come progettata e non attiva.
- `moduli/interfaccia/4-schermate.md`: la sezione Account di SC-06 torna, segnata come non attiva.
- Cade il rinvio "togliere SC-05 e la sezione Account dai wireframe".
- `design-system/componenti.md`: nuovo CMP-22 Modulo di accesso e variante Password di CMP-03.
- Requisiti, flussi ed entità non cambiano: l'accesso non è un comportamento della prima versione. Le sue regole (tentativi, requisiti e recupero della password) si decidono quando lo si attiva; nuovo rinvio in `avanzamento.md`.
