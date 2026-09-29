# DEC-51 – API di tag e dettagli della nota

**Data:** 2026-09-29 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Il frammento Must C (DEC-41, DEC-44) porta i tag e la finestra Dettagli. I tag hanno le loro tabelle (`tag`, `note_tag`, DEC-48); mancavano i comandi dell'API che l'app userà, ricavati dai mockup approvati e da RB-17, RB-18, RB-19, RB-22, RB-49.

## Opzioni valutate
Un insieme di comandi proposto dall'agente. Per l'ultima modifica: A) cambiare date o tag la aggiorna; B) la aggiornano solo titolo e testo.

## Decisione
Approvato da Manuel Cucca:
- **Oggetto Nota** con tre campi in più: `creataScelta` e `fineValidita` (giorno `AAAA-MM-GG` o `null`) e `tag` (percorsi completi come scritti, per esempio `"lavoro/clienti"`).
- `PUT /note/:id/dettagli`: cambia data di creazione scelta e fine validità.
- `GET /tag`: tutti i tag, anche senza note (RB-49), con il numero di note che li usano.
- `POST /note/:id/tag`: aggiunge un tag alla nota; se non esiste lo crea con i livelli mancanti (RB-17, RB-18), senza distinguere maiuscole e minuscole (RB-22).
- `DELETE /note/:id/tag`: toglie il tag dalla nota; il tag resta (RB-49).
- `DELETE /tag`: elimina un tag e i suoi sotto-tag da tutte le note (RB-19).
- Opzione **A**: cambiare date o tag aggiorna l'ultima modifica; spostare la nota no (FL-05).

## Conseguenze
- `architettura/api.md`: sezione dei comandi di tag e dettagli.
- `condiviso`: tipi della nota e dei tag.
