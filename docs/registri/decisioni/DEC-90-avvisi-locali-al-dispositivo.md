# DEC-90 – Gli avvisi restano sul dispositivo

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
RB-53, decisa il 24/09/2026 rispondendo a una domanda su EN-08, vuole gli avvisi sincronizzati: compaiono su tutti i dispositivi e, visti su uno, spariscono da tutti. Con la sincronizzazione progettata (DEC-75 … DEC-84) Manuel Cucca ha chiesto perché dovrebbero sincronizzarsi.

## Opzioni valutate
A) Tenere RB-53: gli avvisi diventano un tipo di elemento della sincronizzazione.
B) Avvisi locali al dispositivo.

## Decisione
Scelta di Manuel Cucca: **B**, su proposta dell'agente.
- «Server irraggiungibile» ed «errore di sincronizzazione» riguardano solo il dispositivo che ha il problema; EN-08 già notava che il primo non può sincronizzarsi finché il server non torna.
- La nota in conflitto arriva comunque su tutti i dispositivi come nota, nella stessa cartella, con «(copia in conflitto)» nel titolo (RB-39, DEC-06): l'avviso serve solo a farla notare dove il conflitto si risolve.
- Gli avvisi non si sincronizzano: compaiono sul dispositivo in cui nascono e spariscono quando li si chiude.

## Conseguenze
- RB-53 è superata; EN-08 diventa uno stato locale del dispositivo.
- `sincronizzazione/2-flussi.md`, `3-entita.md`, `4-schermate.md`, CMP-15 in `componenti.md`.
- Il codice lo fa già: gli avvisi della sincronizzazione sono solo nella finestra del dispositivo.
