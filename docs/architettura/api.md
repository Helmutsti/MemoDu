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
- **Origini ammesse:** l'API risponde alle chiamate del browser solo dall'interfaccia dell'app (`http://localhost:1420` in sviluppo, `tauri://localhost` e `http://tauri.localhost` nell'app installata); le altre origini non ricevono l'intestazione `Access-Control-Allow-Origin`.
- **Controllo dei dati:** nessuna conversione silenziosa. Un campo che non è testo o un campo in più danno 400.
- **Implementazione:** `server/src/app.ts`, prove in `server/src/app.test.ts`.
- **API che non risponde** (server spento, SF-30): lo gestisce l'app, con SC-07 e il testo tenuto in memoria (RB-61, RB-62).

### Oggetto Nota
```json
{
  "id": "3f6c1b2e-9a4d-4c8e-8f1a-2b7d5e6a9c10",
  "titolo": "Lista della spesa",
  "contenuto": "- latte\n- pane",
  "creata": "2026-09-27T08:32:00Z",
  "modificata": "2026-09-27T08:40:12Z",
  "cartella": "Lavoro/Clienti"
}
```
`titolo` può essere vuoto (RB-15) e `contenuto` pure (RB-10). `cartella` (dal frammento Must B, DEC-37) è il percorso della cartella che contiene la nota; `""` per le non organizzate. Si cambia solo con `PUT /note/:id/cartella`. Gli istanti sono in UTC, formato ISO 8601 (DEC-28). Nel file il titolo è la prima riga `# Titolo`: l'API la compone e la separa, l'app vede solo i due campi.

---

## GET /note
**Flusso:** FL-02, FL-09 (elenco della colonna di SC-01 ridotta) · **Ruoli autorizzati:** —

Elenco delle note non organizzate (nella radice), la modificata più di recente in cima (RB-60). Dal frammento Must B le note nelle cartelle arrivano con `GET /albero`.

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
Entrambi facoltativi, ma il corpo è sempre un oggetto JSON, anche vuoto (`{}`).

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

---

## Cartelle e cestino (frammento Must B)
Cartelle come sottocartelle di Documenti/Memodu e cestino nella cartella nascosta `.cestino` (DEC-36); endpoint e identificativi in DEC-37. Valgono le regole generali delle note (indirizzo, autorizzazione, origini, controllo dei dati).

**Valgono per tutti gli endpoint di cartelle e cestino:**
- **Percorso di una cartella:** i nomi dal primo livello in giù separati da `/`, per esempio `"Lavoro/Clienti"`; `""` è la radice. Viaggia nel corpo JSON. Un percorso con `..`, con `.cestino` o con una parte vuota dà 400.
- **Nomi:** l'API applica RB-63 (caratteri vietati sostituiti con `-`, come per i file delle note) e confronta i nomi senza distinguere maiuscole e minuscole (RB-23). Nelle risposte c'è sempre il nome come è stato scritto sul disco.
- **Nome già esistente** (RB-31, SF-19): `409` con `{ "conflitto": "Idee" }`. L'app mostra l'avviso con tre scelte e ripete la richiesta con `"seEsiste": "numero"` (diventa «Idee (2)») o `"seEsiste": "unisci"`; Annulla non chiama l'API. Senza `seEsiste` vale `"chiedi"`.
- **Unisci:** le note passano nella cartella di destinazione (un nome di file già usato prende un numero, come in DEC-29); le sottocartelle senza omonimi passano anche loro; quelle con un omonimo restano dove sono e tornano in `daRisolvere`. L'app chiede per ognuna (RB-31) e chiama `POST /cartelle/sposta`. La cartella di partenza sparisce quando resta vuota.
- **Implementazione:** `server/src/app.ts` e `server/src/archivio.ts`, prove accanto.

### Oggetto Cartella
```json
{
  "nome": "Clienti",
  "percorso": "Lavoro/Clienti",
  "conteggio": 5,
  "cartelle": [],
  "note": [{ "id": "3f6c1b2e-…", "titolo": "Budget 2026", "anteprima": "…", "modificata": "2026-09-27T08:40:12Z" }]
}
```
`conteggio` sono le note della cartella e delle sottocartelle, senza quelle nel cestino (RB-56). `cartelle` in ordine alfabetico (RB-64), `note` in ordine alfabetico per titolo (RB-65); le note usano la stessa voce di `GET /note`.

### Oggetto Elemento del cestino
```json
{
  "id": "9b1e…",
  "tipo": "cartella",
  "nome": "Vecchi progetti",
  "provenienza": "Lavoro",
  "eliminato": "2026-09-28T10:02:00Z",
  "conteggio": 7
}
```
`tipo` è `"nota"` o `"cartella"`; `nome` è il titolo della nota o il nome della cartella; `provenienza` il percorso da cui veniva (`""` la radice); `conteggio` solo per le cartelle. Sul disco è la cartella `.cestino/<id>/` con dentro l'elemento e il file `elemento.json` (DEC-37).

---

## GET /albero
**Flusso:** FL-05 (colonna di SC-01) · **Ruoli autorizzati:** —

Tutta la colonna in una volta: le non organizzate e l'albero.

**Output**
```json
{
  "nonOrganizzate": { "conteggio": 3, "note": [ … ] },
  "cartelle": [ { "nome": "Lavoro", "percorso": "Lavoro", "conteggio": 12, "cartelle": [ … ], "note": [ … ] } ]
}
```
Le non organizzate sono ordinate come in `GET /note` (RB-60).

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 500 | Cartella delle note illeggibile | SF-32 |

---

## POST /cartelle
**Flusso:** FL-05 (+ in cima all'albero, tasto destro → Nuova cartella) · **Ruoli autorizzati:** —

Crea una cartella «Nuova cartella» (con un numero se c'è già, RB-48) dentro `genitore`. Il nome si cambia subito dopo con `PATCH /cartelle`.

**Input**
```json
{ "genitore": "Lavoro" }
```

**Output:** `201` con l'oggetto Cartella (vuota).

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 400 | Percorso non valido | SF-06 |
| 404 | `genitore` non esiste (per esempio tolto da fuori) | SF-32 |
| 500 | Cartella non creata | SF-32 |

---

## PATCH /cartelle
**Flusso:** FL-05 (Rinomina, e conferma del nome di una cartella nuova) · **Ruoli autorizzati:** —

Rinomina la cartella. Il nome passa per RB-63.

**Input**
```json
{ "percorso": "Lavoro/Nuova cartella", "nome": "Clienti", "seEsiste": "chiedi" }
```

**Output:** l'oggetto Cartella con nome e percorso nuovi; con `"unisci"`, `{ "cartella": { … }, "daRisolvere": ["Lavoro/Clienti/Archivio"] }`.

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 400 | Percorso non valido o nome vuoto | SF-06 |
| 404 | La cartella non esiste | SF-32 |
| 409 | Nome già esistente, con `seEsiste` = `"chiedi"` | SF-19 |
| 500 | Cartella non rinominata | SF-32 |

---

## POST /cartelle/sposta
**Flusso:** FL-05 (trascinamento di una cartella nell'albero; sottocartelle da risolvere dopo Unisci) · **Ruoli autorizzati:** —

Sposta la cartella con tutto il contenuto dentro `destinazione` (`""` per il primo livello).

**Input**
```json
{ "percorso": "Personale/Idee", "destinazione": "Lavoro", "seEsiste": "chiedi" }
```

**Output:** come `PATCH /cartelle`.

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 400 | Percorso non valido | SF-06 |
| 404 | La cartella o la destinazione non esistono | SF-32 |
| 409 | Nome già esistente nella destinazione | SF-19 |
| 422 | Destinazione uguale alla cartella o dentro una sua sottocartella: nessuna modifica (RB-24) | SF-18 |
| 500 | Cartella non spostata | SF-32 |

---

## PUT /note/:id/cartella
**Flusso:** FL-05 (trascinamento di una nota, Sposta in del menu `···`) · **Ruoli autorizzati:** —

Sposta la nota nella cartella indicata, o tra le non organizzate con `""`. Il file cambia sottocartella; se il nome del file c'è già, prende un numero (DEC-29). La data di modifica non cambia. La nota aperta resta aperta (RB-66): lo gestisce l'app.

**Input**
```json
{ "cartella": "Lavoro/Clienti" }
```

**Output:** l'oggetto Nota con la nuova `cartella`.

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 400 | `id` non è un UUID o percorso non valido | SF-06, SF-34 |
| 404 | La nota o la cartella non esistono | SF-32 |
| 500 | File non spostato: resta dov'era | SF-32 |

---

## POST /cestino
**Flusso:** FL-05 (Elimina dal menu, trascinamento sul cestino) · **Ruoli autorizzati:** —

Manda nel cestino una nota (RB-26) o una cartella con tutto il contenuto (RB-25).

**Input**
```json
{ "tipo": "nota", "id": "3f6c1b2e-…" }
```
oppure `{ "tipo": "cartella", "percorso": "Lavoro/Vecchi progetti" }`.

**Output:** `201` con l'oggetto Elemento del cestino.

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 400 | Dati non validi | SF-06, SF-34 |
| 404 | La nota o la cartella non esistono | SF-32 |
| 500 | Non spostata nel cestino: resta dov'era | SF-32 |

---

## GET /cestino
**Flusso:** FL-05 (SC-04) · **Ruoli autorizzati:** —

Gli elementi del cestino, l'eliminato più di recente in cima.

**Output:** un elenco di oggetti Elemento del cestino (vuoto se il cestino è vuoto).

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 500 | Cestino illeggibile | SF-32 |

---

## POST /cestino/:id/ripristina
**Flusso:** FL-05 (Ripristina in SC-04) · **Ruoli autorizzati:** —

Riporta l'elemento nella radice: la nota tra le non organizzate, la cartella al primo livello (RB-28). Una cartella con un nome già presente al primo livello segue RB-31, con `seEsiste`; una nota con un nome di file già usato prende un numero (DEC-29).

**Input**
```json
{ "seEsiste": "chiedi" }
```

**Output:** l'oggetto Nota o l'oggetto Cartella ripristinati (con `"unisci"`, anche `daRisolvere`).

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 400 | `id` non valido | SF-34 |
| 404 | Nessun elemento con questo `id` nel cestino | SF-32 |
| 409 | Cartella con un nome già presente al primo livello | SF-19 |
| 500 | Non ripristinato: resta nel cestino | SF-32 |

---

## DELETE /cestino/:id
**Flusso:** FL-05 (Elimina definitivamente, dopo la conferma, RB-55) · **Ruoli autorizzati:** —

Cancella per sempre l'elemento dal disco. La conferma la chiede l'app prima di chiamare l'API.

**Output:** `204`.

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 400 | `id` non valido | SF-34 |
| 404 | Nessun elemento con questo `id` nel cestino | SF-32 |
| 500 | Non cancellato del tutto | SF-32 |

---

## DELETE /cestino
**Flusso:** FL-05 (Svuota cestino, dopo la conferma, RB-32) · **Ruoli autorizzati:** —

Cancella per sempre tutti gli elementi del cestino.

**Output:** `204`, anche se il cestino era già vuoto.

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 500 | Cestino non svuotato del tutto: gli elementi rimasti restano nel cestino | SF-32 |

**Come reagisce l'app agli errori di cartelle e cestino:** per 404 e 500 l'app ricarica l'albero e mostra un avviso (CMP-15); testi definitivi in Fase 6 con i mockup. 409 apre l'avviso con tre scelte (RB-31); 422 non mostra niente, lo spostamento semplicemente non avviene (RB-24).
