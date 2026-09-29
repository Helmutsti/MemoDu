# DEC-48 – Schema del database

**Data:** 2026-09-29 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-45, DEC-46 e DEC-47 note, cartelle, cestino e tag passano in SQLite nell'API. Lo schema traduce le entità della Fase 3 (EN-01, EN-03, EN-04) e le loro regole; si limita a ciò che serve ai frammenti Must A, B e C.

## Opzioni valutate
Uno schema proposto dall'agente, approvato da Manuel Cucca. Per il confronto dei nomi: A) il confronto senza maiuscole di SQLite, che vale solo per le lettere senza accento; B) un campo con il nome in minuscolo calcolato dall'API.

## Decisione
Schema approvato da Manuel Cucca:

| Tabella | Colonne principali | Regole |
|---|---|---|
| `note` | id, titolo, contenuto (markdown), cartella, creata, creata scelta, modificata, fine validità, eliminata il, provenienza | Una sola cartella o nessuna (RF-05); nel cestino se «eliminata il» è compilato; «provenienza» per il testo del cestino (DEC-37) |
| `cartelle` | id, nome, chiave del nome, cartella madre, eliminata il, provenienza | Nome unico tra le sorelle senza distinguere maiuscole e minuscole (RB-23); nel cestino con tutto il contenuto (RB-25) |
| `tag` | id, nome come scritto la prima volta, chiave del nome, tag padre | Unico senza distinguere maiuscole e minuscole (RB-22); un livello per tag, «lavoro/clienti» è «clienti» figlio di «lavoro» (RB-18); eliminando un tag si eliminano i sotto-tag (RB-19) |
| `note_tag` | nota, tag | Più tag per nota; un tag può restare senza note (RB-49) |

- Il confronto dei nomi usa **B**: la chiave del nome in minuscolo, calcolata dall'API, anche per le lettere accentate.
- Istanti in ora universale ISO 8601, date del calendario come giorno (formato di DEC-28).
- La versione dello schema è segnata nel database, per applicare le modifiche in ordine.

## Conseguenze
- DEC-36 è superata per le cartelle come sottocartelle del disco; il resto del frammento Must B resta valido.
- Immagini, avvisi, impostazioni e l'indice di ricerca (FTS5) si aggiungono con i loro frammenti.
- `architettura/architettura.md`: sezione dello schema.
