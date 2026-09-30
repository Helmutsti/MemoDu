# API

<!-- Fase 7 della guida. Gli endpoint derivano dai flussi. -->

Server in Node con TypeScript e Fastify (DEC-24, DEC-32). Ogni endpoint ha uno schema JSON per input e output: Fastify rifiuta da solo le richieste che non lo rispettano.

## Note (frammento Must A)
Le note passano dall'API, che è l'unica a scrivere i dati (DEC-30), nel database SQLite (DEC-45, DEC-46, DEC-48). Il protocollo di sincronizzazione e il resto delle API arrivano con il frammento Must.

**Valgono per tutti gli endpoint delle note:**
- **Indirizzo:** l'API ascolta solo sulla macchina stessa (`127.0.0.1`), perché per ora gira sulla macchina di sviluppo (ambiente Locale). Confermato da Manuel Cucca il 27/09/2026.
- **Autorizzazione:** nessuna nel frammento Must A: l'API non è raggiungibile da fuori. Le credenziali preimpostate (DEC-13, RB-57) entrano con la sincronizzazione, e sono obbligatorie appena l'API si sposta fuori dalla macchina. Confermato da Manuel Cucca il 27/09/2026.
- **Identificativo:** UUID generato dall'API alla creazione, chiave della riga nel database (DEC-48); non cambia se cambia il titolo (EN-01). Confermato da Manuel Cucca il 28/09/2026.
- **Lunghezza:** corpo della richiesta fino a 10 MB (`bodyLimit` di Fastify; il valore di default è 1 MB), circa 5.000 pagine di testo (EN-01, SF-17). Le immagini hanno il loro limite (RB-12). Scelta di Manuel Cucca, 28/09/2026.
- **Origini ammesse:** l'API risponde alle chiamate del browser solo dall'interfaccia dell'app (`http://localhost:1420` in sviluppo, `tauri://localhost` e `http://tauri.localhost` nell'app installata); le altre origini non ricevono l'intestazione `Access-Control-Allow-Origin`.
- **Controllo dei dati:** nessuna conversione silenziosa. Un campo che non è testo o un campo in più danno 400.
- **Implementazione:** `api/src/app.ts`, prove in `api/src/app.test.ts`. Nell'app le stesse operazioni sono comandi del nucleo Rust sulla copia di lavoro, con gli stessi dati e codici di errore (`client/src-tauri/src/comandi.rs`, DEC-67).
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
`titolo` può essere vuoto (RB-15) e `contenuto` pure (RB-10). `cartella` (dal frammento Must B, DEC-37) è il percorso della cartella che contiene la nota; `""` per le non organizzate. Si cambia solo con `PUT /note/:id/cartella`. Gli istanti sono in UTC, formato ISO 8601 (DEC-28).

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
| 404 | Nessuna nota con questo `id`, o nota dentro una cartella nel cestino | SF-32 |
| 500 | Database non leggibile | SF-32 |

---

## POST /note
**Flusso:** FL-01 (prima pausa di scrittura in una nota rapida), FL-09 (+ o Nuova nota) · **Ruoli autorizzati:** —

Crea una nota nella radice (RB-01, RB-09), o nella cartella indicata con «Nuova nota qui» (RB-09, frammento Must B). La nota rapida si crea solo quando c'è del testo: chiusa vuota non chiama l'API (RB-03). Dal + nasce vuota; se la si lascia vuota, l'app la cancella con `DELETE /note/{id}` (RB-10, DEC-39).

**Input**
```json
{ "titolo": "", "contenuto": "", "cartella": "Lavoro" }
```
Tutti facoltativi, ma il corpo è sempre un oggetto JSON, anche vuoto (`{}`). Senza `cartella`, o con `""`, la nota nasce nella radice.

**Output:** `201` con l'oggetto Nota, `id` e date compresi.

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 400 | Campi non di tipo testo o percorso non valido | SF-06 |
| 404 | La `cartella` non esiste | SF-32 |
| 413 | Contenuto oltre il limite del server | SF-17 |
| 500 | Database non scritto | SF-32 |

---

## PUT /note/:id
**Flusso:** FL-02 (salvataggio dopo 2 s di pausa, alla chiusura, al cambio di nota, alla perdita del focus, RB-06), FL-01 (RB-02, RB-04, RB-05) · **Ruoli autorizzati:** —

Salva titolo e contenuto e aggiorna `modificata`. Il database scrive tutto o niente (RB-06). Se cambia il titolo l'`id` resta lo stesso.

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
| 500 | Database non scritto: la versione precedente resta intatta (RB-06) | SF-32 |

**Come reagisce l'app agli errori:** per 413 e 500 il testo resta nella finestra e l'app mostra SC-07 come per l'API che non risponde (RB-61). Per 404 la nota non c'è più: se è nel cestino la risposta porta `{ "cestino": "<id>" }`, l'id dell'elemento da ripristinare (la nota o la cartella eliminata che la contiene); l'app chiude la nota e mostra l'avviso «La nota è nel cestino.» con Ripristina, oppure «La nota è stata eliminata.» (scelta di Manuel Cucca il 29/09/2026). Nessun testo dedicato per questi casi: vale la spiegazione di SC-07 anche se la causa non è il server spento. Scelta di Manuel Cucca, 28/09/2026.

---

## DELETE /note/:id
**Flusso:** FL-09 (nota lasciata vuota, RB-10, DEC-39) · **Ruoli autorizzati:** —

Cancella per sempre la nota, senza cestino, **solo se è vuota**: titolo e contenuto senza caratteri che non siano spazi. L'app la chiama ogni volta che lascia una nota; per una nota con del testo l'API risponde 409 e non tocca niente.

**Output:** `204`.

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 400 | `id` non è un UUID | SF-34 |
| 404 | Nessuna nota con questo `id` | SF-32 |
| 409 | La nota non è vuota: resta com'è | — |
| 500 | Nota non cancellata | SF-32 |

---

## Cartelle e cestino (frammento Must B)
Cartelle e cestino nel database (DEC-48): una cartella ha un id e una cartella madre, un elemento nel cestino ha la data di eliminazione; endpoint e identificativi in DEC-37. Valgono le regole generali delle note (indirizzo, autorizzazione, origini, controllo dei dati).

**Valgono per tutti gli endpoint di cartelle e cestino:**
- **Percorso di una cartella:** i nomi dal primo livello in giù separati da `/`, per esempio `"Lavoro/Clienti"`; `""` è la radice. Viaggia nel corpo JSON. Un percorso con `..` o con una parte vuota dà 400.
- **Nomi:** l'API applica RB-63 (caratteri vietati nei nomi dei file sostituiti con `-`) e confronta i nomi senza distinguere maiuscole e minuscole (RB-23). Nelle risposte c'è sempre il nome come è stato scritto.
- **Nome già esistente** (RB-31, SF-19): `409` con `{ "conflitto": "Idee" }`. L'app mostra l'avviso con tre scelte e ripete la richiesta con `"seEsiste": "numero"` (diventa «Idee (2)») o `"seEsiste": "unisci"`; Annulla non chiama l'API. Senza `seEsiste` vale `"chiedi"`.
- **Unisci:** le note passano nella cartella di destinazione (i titoli possono ripetersi, RB-16); le sottocartelle senza omonimi passano anche loro; quelle con un omonimo restano dove sono e tornano in `daRisolvere`. L'app chiede per ognuna (RB-31) e chiama `POST /cartelle/sposta`. La cartella di partenza sparisce quando resta vuota.
- **Implementazione:** `api/src/app.ts` e `api/src/archivio.ts`, prove accanto; nel client `client/src-tauri/src/archivio.rs` (DEC-67).

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
`tipo` è `"nota"` o `"cartella"`; `nome` è il titolo della nota o il nome della cartella; `provenienza` il percorso da cui veniva (`""` la radice); `conteggio` solo per le cartelle. `id` è l'id della nota o della cartella eliminata (DEC-48).

---

## GET /albero
**Flusso:** FL-05 (colonna di SC-01) · **Ruoli autorizzati:** —

Tutta la colonna in una volta: le non organizzate e l'albero.

**Output**
```json
{
  "nonOrganizzate": { "conteggio": 3, "note": [ … ] },
  "cartelle": [ { "nome": "Lavoro", "percorso": "Lavoro", "conteggio": 12, "cartelle": [ … ], "note": [ … ] } ],
  "cestino": 3
}
```
Le non organizzate sono ordinate come in `GET /note` (RB-60). `cestino` è il numero di elementi nel cestino, mostrato nella riga Cestino in fondo alla colonna (DEC-40).

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 500 | Cartella delle note illeggibile | SF-32 |

---

## POST /cartelle
**Flusso:** FL-05 (+ in cima all'albero, tasto destro → Nuova sottocartella) · **Ruoli autorizzati:** —

Crea una cartella dentro `genitore`. L'app la chiama solo quando il nome è confermato con Invio: con Esc la cartella non nasce e l'API non viene chiamata (RB-48). Senza `nome` vale «Nuova cartella», il nome proposto, e se è già usato l'API aggiunge da sola un numero (RB-48); con un nome scritto, anche «Nuova cartella», un nome già usato segue RB-31 con `seEsiste`.

**Input**
```json
{ "genitore": "Lavoro", "nome": "Clienti", "seEsiste": "chiedi" }
```

**Output:** `201` con `{ "cartella": { … }, "daRisolvere": [] }`, come `PATCH /cartelle`.

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 400 | Percorso non valido | SF-06 |
| 404 | `genitore` non esiste (per esempio tolto da fuori) | SF-32 |
| 409 | Nome già esistente, con `seEsiste` = `"chiedi"` | SF-19 |
| 500 | Cartella non creata | SF-32 |

---

## PATCH /cartelle
**Flusso:** FL-05 (Rinomina dal tasto destro o con F2) · **Ruoli autorizzati:** —

Rinomina la cartella. Il nome passa per RB-63.

**Input**
```json
{ "percorso": "Lavoro/Nuova cartella", "nome": "Clienti", "seEsiste": "chiedi" }
```

**Output:** `{ "cartella": { … }, "daRisolvere": [] }`, con l'oggetto Cartella con nome e percorso nuovi; con `"unisci"`, `daRisolvere` elenca le sottocartelle rimaste da risolvere, per esempio `["Personale/Idee/Archivio"]`.

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
{ "percorso": "Personale/Idee", "destinazione": "Lavoro", "seEsiste": "chiedi", "daUnione": false }
```
`daUnione` è `true` quando l'app risolve una sottocartella di `daRisolvere`: dopo lo spostamento, la cartella che la conteneva viene tolta se è rimasta vuota (era l'origine di un'unione).

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

Sposta la nota nella cartella indicata, o tra le non organizzate con `""`. La data di modifica non cambia. La nota aperta resta aperta (RB-66): lo gestisce l'app.

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
| 500 | Nota non spostata: resta dov'era | SF-32 |

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

Riporta l'elemento nella radice: la nota tra le non organizzate, la cartella al primo livello (RB-28). Una cartella con un nome già presente al primo livello segue RB-31, con `seEsiste`.

**Input**
```json
{ "seEsiste": "chiedi" }
```

**Output:** per una nota l'oggetto Nota; per una cartella `{ "cartella": { … }, "daRisolvere": [ … ] }`, come `PATCH /cartelle`.

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

Cancella per sempre l'elemento dal database; per una cartella anche il contenuto, tranne gli elementi eliminati a parte, che restano nel cestino. La conferma la chiede l'app prima di chiamare l'API.

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


---

## Tag e dettagli (frammento Must C)
Comandi di DEC-51 per la finestra Dettagli (CMP-24, DEC-44). Valgono le regole generali delle note. L'oggetto Nota ha in più:

```json
{
  "creataScelta": "2026-09-12",
  "fineValidita": null,
  "tag": ["lavoro/clienti", "riunioni"]
}
```

`creataScelta` e `fineValidita` sono giorni (`AAAA-MM-GG`) o `null` (DEC-28). `tag` sono i percorsi completi, con i livelli separati da `/` (RB-18), scritti come la prima volta (RB-22), in ordine alfabetico. Cambiare date o tag aggiorna `modificata` (DEC-51).

**Nomi dei tag:** senza distinguere maiuscole e minuscole (RB-22); i `/` all'inizio, alla fine e ripetuti si tolgono, gli spazi ai lati di ogni livello pure; un nome vuoto dà 400.

## PUT /note/:id/dettagli
**Input:** `{ "creataScelta": "2026-09-12", "fineValidita": null }`; un campo assente resta com'è, `null` lo svuota. Qualsiasi data è ammessa (RB-20).
**Output:** l'oggetto Nota.
**Errori:** 400 (data non valida), 404 (nota non trovata o nel cestino, con `cestino` come per `PUT /note/:id`), 500.

## GET /tag
**Output:** `[{ "nome": "lavoro/clienti", "note": 3 }, …]`: tutti i tag, anche quelli senza note (RB-49), in ordine alfabetico; `note` conta le note fuori dal cestino che hanno quel tag o un suo sotto-tag, ciascuna una volta: è il numero della conferma di eliminazione (RB-19).

## POST /note/:id/tag
**Input:** `{ "nome": "Lavoro/Clienti" }`. Se il tag c'è già (senza distinguere maiuscole e minuscole) si usa quello; altrimenti nasce, con i livelli che mancano (RB-17, RB-18).
**Output:** l'oggetto Nota.
**Errori:** 400 (nome vuoto), 404, 500.

## DELETE /note/:id/tag
**Input:** `{ "nome": "lavoro/clienti" }`. Toglie il tag dalla nota; il tag resta anche se nessuna nota lo usa più (RB-49).
**Output:** l'oggetto Nota.
**Errori:** 404 (nota o tag non trovati), 500.

## DELETE /tag
**Input:** `{ "nome": "lavoro/fornitori" }`. Elimina il tag e i suoi sotto-tag e li toglie da tutte le note, senza toccare altro (RB-19). La conferma con il numero di note la chiede l'app prima.
**Output:** `204`.
**Errori:** 404 (tag non trovato), 500.

---

## Sincronizzazione (RF-10, DEC-75 … DEC-84)
**Valgono per tutte le richieste della sincronizzazione:**
- **Chi le fa:** il nucleo Rust del client, in background (`client/src-tauri/src/sincronizzazione.rs`), non l'interfaccia.
- **Autorizzazione:** intestazione `Authorization: Bearer <gettone>` con il gettone delle credenziali dell'installazione (DEC-79); senza o sbagliato `401`, e il client mostra la schermata di blocco (RB-57).
- **Protocollo:** intestazione `Memodu-Protocollo: 1`; con una versione diversa `426`, e il client mostra l'avviso di errore e continua sulla copia di lavoro (DEC-83).
- **Blocchi:** testo opaco per il server. Oggi JSON in chiaro, `{ "formato": "chiaro", "tipo": "nota" | "cartella" | "tag", "modificato_il": "<UTC>", "eliminato": false, "campi": { … } }` (DEC-78).
- **Implementazione:** `api/src/sincronizzazione.ts` (deposito: file dei blocchi e indice `sincronizzazione/indice.db`) e `api/src/rotteSincronizzazione.ts`, prove in `api/src/sincronizzazione.test.ts`.
- **Credenziali:** al primo avvio l'API genera identificativo, gettone e chiave, conserva solo l'impronta del gettone e scrive `{ "indirizzo", "installazione", "gettone", "chiave" }` nel file `credenziali` della cartella dei dati, se non c'è (sulla stessa macchina è quello dell'app); le mostra una volta nel terminale.

## GET /sincronizzazione/modifiche?dopo=N
**Output:** `{ "modifiche": [{ "id", "versione", "ordine", "ora", "dati" }], "ultimo": M, "altre": false }`: le versioni attuali degli elementi cambiati dopo il numero d'ordine N, in ordine, al massimo 500; con `altre` si richiede da `ultimo`.
**Errori:** 400 (`dopo` non è un numero), 401, 426.

## PUT /sincronizzazione/elementi/:id
**Input:** `{ "base": 7, "dati": "<blocco>" }`: il blocco nuovo e la versione da cui parte (0 per un elemento nuovo). `id` è un UUID.
**Output:** `{ "versione": 8, "ordine": 1521 }`. Il server tiene le versioni precedenti a scalare per 30 giorni (DEC-77).
**Errori:** 409 `{ "attuale": { "id", "versione", "ordine", "ora", "dati" } }` se l'elemento è già a un'altra versione: il client fonde e riprova (DEC-76); 400, 401, 413, 426.
