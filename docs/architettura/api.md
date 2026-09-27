# API

<!-- Fase 7 della guida. Gli endpoint derivano dai flussi. -->

Server in Node con TypeScript e Fastify (DEC-24, DEC-32). Ogni endpoint ha uno schema JSON per input e output: Fastify rifiuta da solo le richieste che non lo rispettano.

## Note (frammento Must A)
Per Must A le note passano dall'API, che è l'unica a scrivere i file (DEC-30); formato e cartella dei file sono in DEC-28 e DEC-29. Il protocollo di sincronizzazione e il resto delle API arrivano con il frammento Must.

**Valgono per tutti gli endpoint delle note:**
- **Indirizzo:** l'API ascolta solo sulla macchina stessa (`127.0.0.1`), perché per ora gira sulla macchina di sviluppo (ambiente Locale). Confermato da Manuel Cucca il 27/09/2026.
- **Autorizzazione:** nessuna nel frammento Must A: l'API non è raggiungibile da fuori. Le credenziali preimpostate (DEC-13, RB-57) entrano con la sincronizzazione, e sono obbligatorie appena l'API si sposta fuori dalla macchina. Confermato da Manuel Cucca il 27/09/2026.
- **Identificativo:** UUID generato dall'API alla creazione, scritto nell'intestazione YAML del file (DEC-29); non cambia se cambia il titolo (EN-01). Confermato da Manuel Cucca il 28/09/2026.
- **Lunghezza:** corpo della richiesta fino a 10 MB (`bodyLimit` di Fastify; il valore di default è 1 MB), circa 5.000 pagine di testo (EN-01, SF-17). Le immagini hanno il loro limite (RB-12). Scelta di Manuel Cucca, 28/09/2026.
- **API che non risponde** (server spento, SF-30): lo gestisce l'app, con SC-07 e il testo tenuto in memoria (RB-61, RB-62).

### Oggetto Nota
```json
{
  "id": "3f6c1b2e-9a4d-4c8e-8f1a-2b7d5e6a9c10",
  "titolo": "Lista della spesa",
  "contenuto": "- latte\n- pane",
  "creata": "2026-09-27T08:32:00Z",
  "modificata": "2026-09-27T08:40:12Z"
}
```
`titolo` può essere vuoto (RB-15) e `contenuto` pure (RB-10). Gli istanti sono in UTC, formato ISO 8601 (DEC-28). Nel file il titolo è la prima riga `# Titolo`: l'API la compone e la separa, l'app vede solo i due campi.

---

## GET /note
**Flusso:** FL-02, FL-09 (elenco della colonna di SC-01 ridotta) · **Ruoli autorizzati:** —

Elenco delle note, la modificata più di recente in cima (RB-60).

**Input:** nessuno.

**Output**
```json
[
  { "id": "3f6c1b2e-…", "titolo": "Lista della spesa", "anteprima": "latte pane", "modificata": "2026-09-27T08:40:12Z" }
]
```
`anteprima` sono le prime parole del contenuto, per le note senza titolo (RB-15); con titolo e contenuto vuoti l'app mostra "Nota vuota".

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 500 | Cartella delle note illeggibile | SF-32 |

---

## GET /note/:id
**Flusso:** FL-02, FL-01 (Apri nel programma, RB-05) · **Ruoli autorizzati:** —

**Input:** `id` nel percorso.

**Output:** l'oggetto Nota.

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 400 | `id` non è un UUID | SF-34 |
| 404 | Nessuna nota con questo `id` (per esempio file tolto da fuori, rischio accettato di DEC-29) | SF-32 |
| 500 | File illeggibile | SF-32 |

---

## POST /note
**Flusso:** FL-01 (prima pausa di scrittura in una nota rapida), FL-09 (+ o Nuova nota) · **Ruoli autorizzati:** —

Crea una nota nella radice (RB-01). La nota rapida si crea solo quando c'è del testo: chiusa vuota non chiama l'API (RB-03). Dal + nasce vuota e resta (RB-10).

**Input**
```json
{ "titolo": "", "contenuto": "" }
```
Entrambi facoltativi.

**Output:** `201` con l'oggetto Nota, `id` e date compresi.

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 400 | Campi non di tipo testo | SF-06 |
| 413 | Contenuto oltre il limite del server | SF-17 |
| 500 | File non scritto | SF-32 |

---

## PUT /note/:id
**Flusso:** FL-02 (salvataggio dopo 2 s di pausa, alla chiusura, al cambio di nota, alla perdita del focus, RB-06), FL-01 (RB-02, RB-04, RB-05) · **Ruoli autorizzati:** —

Salva titolo e contenuto e aggiorna `modificata`. Il file si scrive in modo sicuro, prima un file temporaneo e poi lo scambio (RB-06). Se cambia il titolo cambia anche il nome del file (DEC-29), non l'`id`.

**Input**
```json
{ "titolo": "Lista della spesa", "contenuto": "- latte\n- pane\n- uova" }
```

**Output:** l'oggetto Nota aggiornato.

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 400 | `id` non è un UUID o campi non di tipo testo | SF-06, SF-34 |
| 404 | Nessuna nota con questo `id` | SF-32 |
| 413 | Contenuto oltre il limite del server | SF-17 |
| 500 | File non scritto: il file precedente resta intatto (RB-06) | SF-32 |

**Come reagisce l'app agli errori:** per 404, 413 e 500 il testo resta nella finestra e l'app mostra SC-07 come per l'API che non risponde (RB-61). Nessun testo dedicato per questi casi: vale la spiegazione di SC-07 anche se la causa non è il server spento. Scelta di Manuel Cucca, 28/09/2026.
