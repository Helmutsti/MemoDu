# API

<!-- Fase 7 della guida. Gli endpoint derivano dai flussi. -->

Server in Node con TypeScript e Fastify (DEC-24, DEC-32). Ogni endpoint ha uno schema JSON per input e output: Fastify rifiuta da solo le richieste che non lo rispettano.

> **Da DEC-85 l'API offre solo la sincronizzazione** (in fondo alla pagina). Le operazioni su note, cartelle, cestino e tag descritte qui sotto sono comandi del nucleo Rust del client (`client/src-tauri/src/comandi.rs`), con gli stessi dati e gli stessi codici di errore: la pagina ne resta il contratto.

## Note (frammento Must A)
Le note stanno nella copia di lavoro del client (DEC-67, DEC-85), in SQLite (DEC-48).

**Valgono per tutti gli endpoint delle note:**
- **Autorizzazione:** nessuna: i comandi girano dentro l'app e non passano dalla rete (DEC-85). Le credenziali dell'installazione (DEC-13, DEC-79) servono solo alla sincronizzazione.
- **Identificativo:** UUID generato dal nucleo alla creazione, sul dispositivo (DEC-67), chiave della riga nel database (DEC-48); non cambia se cambia il titolo (EN-01). Confermato da Manuel Cucca il 28/09/2026.
- **Lunghezza:** dati del comando fino a 4 MB (DEC-106): oltre, l'interfaccia risponde 413 senza chiamare il comando (`client/src/api.ts`). Circa 5.000 pagine di testo (EN-01, SF-17). Le immagini hanno il loro limite (RB-12). Scelta di Manuel Cucca, 28/09/2026.
- **Controllo dei dati:** nessuna conversione silenziosa. Un campo che non è testo o un campo in più danno 400.
- **Implementazione:** comandi del nucleo in `client/src-tauri/src/comandi.rs` sull'archivio `archivio.rs`, prove in `archivio_test.rs` (DEC-85).
- **Copia di lavoro che non risponde** (non si apre o non si scrive): lo gestisce l'app, con SC-07 e il testo tenuto in memoria (RB-61, RB-62, DEC-67).

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

## GET /note (`elenca_note`)
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
| 500 | Database non leggibile | SF-32 |

---

## GET /note/:id (`leggi_nota`)
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

## POST /note (`crea_nota`)
**Flusso:** FL-01 (prima pausa di scrittura in una nota rapida), FL-09 (+ o Nuova nota) · **Ruoli autorizzati:** —

Crea una nota nella radice (RB-01, RB-09), o nella cartella indicata con «Nuova nota qui» (RB-09, frammento Must B). La nota rapida si crea solo quando c'è del testo: chiusa vuota non chiama il nucleo (RB-03). Dal + nasce vuota; se la si lascia vuota, l'app la cancella con `DELETE /note/{id}` (RB-10, DEC-39).

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

## PUT /note/:id (`salva_nota`)
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

**Come reagisce l'app agli errori:** per 413 e 500 il testo resta nella finestra e l'app mostra SC-07 come per la copia di lavoro che non risponde (RB-61). Per 404 la nota non c'è più: se è nel cestino la risposta porta `{ "cestino": "<id>" }`, l'id dell'elemento da ripristinare (la nota o la cartella eliminata che la contiene); l'app chiude la nota e mostra l'avviso «La nota è nel cestino.» con Ripristina, oppure «La nota è stata eliminata.» (scelta di Manuel Cucca il 29/09/2026). Nessun testo dedicato per questi casi: vale la spiegazione di SC-07 anche se la causa non è il server spento. Scelta di Manuel Cucca, 28/09/2026.

---

## DELETE /note/:id (`elimina_se_vuota`)
**Flusso:** FL-09 (nota lasciata vuota, RB-10, DEC-39) · **Ruoli autorizzati:** —

Cancella per sempre la nota, senza cestino, **solo se è vuota**: titolo e contenuto senza caratteri che non siano spazi. L'app la chiama ogni volta che lascia una nota; per una nota con del testo il nucleo risponde 409 e non tocca niente.

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
Cartelle e cestino nel database (DEC-48): una cartella ha un id e una cartella madre, un elemento nel cestino ha la data di eliminazione; endpoint e identificativi in DEC-37. Valgono le regole generali delle note (autorizzazione, controllo dei dati).

**Valgono per tutti gli endpoint di cartelle e cestino:**
- **Percorso di una cartella:** i nomi dal primo livello in giù separati da `/`, per esempio `"Lavoro/Clienti"`; `""` è la radice. Viaggia nel corpo JSON. Un percorso con `..` o con una parte vuota dà 400.
- **Nomi:** il nucleo applica RB-63 (caratteri vietati nei nomi dei file sostituiti con `-`) e confronta i nomi senza distinguere maiuscole e minuscole (RB-23). Nelle risposte c'è sempre il nome come è stato scritto.
- **Nome già esistente** (RB-31, SF-19): `409` con `{ "conflitto": "Idee" }`. L'app mostra l'avviso con tre scelte e ripete la richiesta con `"seEsiste": "numero"` (diventa «Idee (2)») o `"seEsiste": "unisci"`; Annulla non chiama il nucleo. Senza `seEsiste` vale `"chiedi"`.
- **Unisci:** le note passano nella cartella di destinazione (i titoli possono ripetersi, RB-16); le sottocartelle senza omonimi passano anche loro; quelle con un omonimo restano dove sono e tornano in `daRisolvere`. L'app chiede per ognuna (RB-31) e chiama `POST /cartelle/sposta`. La cartella di partenza sparisce quando resta vuota.
- **Implementazione:** `client/src-tauri/src/archivio.rs`, prove in `archivio_test.rs` (DEC-85).

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

## GET /albero (`albero`)
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
| 500 | Database non leggibile | SF-32 |

---

## POST /cartelle (`crea_cartella`)
**Flusso:** FL-05 (+ in cima all'albero, tasto destro → Nuova sottocartella) · **Ruoli autorizzati:** —

Crea una cartella dentro `genitore`. L'app la chiama solo quando il nome è confermato con Invio: con Esc la cartella non nasce e il nucleo non viene chiamato (RB-48). Senza `nome` vale «Nuova cartella», il nome proposto, e se è già usato il nucleo aggiunge da solo un numero (RB-48); con un nome scritto, anche «Nuova cartella», un nome già usato segue RB-31 con `seEsiste`.

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

## PATCH /cartelle (`rinomina_cartella`)
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

## POST /cartelle/sposta (`sposta_cartella`)
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

## PUT /note/:id/cartella (`sposta_nota`)
**Flusso:** FL-05 (trascinamento di una nota, «Sposta in…» di Info o del tasto destro su una nota, DEC-96) · **Ruoli autorizzati:** —

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

## POST /cestino (`cestina_nota`, `cestina_cartella`)
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

## GET /cestino (`elenca_cestino`)
**Flusso:** FL-05 (SC-04) · **Ruoli autorizzati:** —

Gli elementi del cestino, l'eliminato più di recente in cima.

**Output:** un elenco di oggetti Elemento del cestino (vuoto se il cestino è vuoto).

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 500 | Cestino illeggibile | SF-32 |

---

## POST /cestino/:id/ripristina (`ripristina`)
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

## DELETE /cestino/:id (`elimina_definitivamente`)
**Flusso:** FL-05 (Elimina definitivamente, dopo la conferma, RB-55) · **Ruoli autorizzati:** —

Cancella per sempre l'elemento dal database; per una cartella anche il contenuto, tranne gli elementi eliminati a parte, che restano nel cestino. La conferma la chiede l'app prima di chiamare il comando.

**Output:** `204`.

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 400 | `id` non valido | SF-34 |
| 404 | Nessun elemento con questo `id` nel cestino | SF-32 |
| 500 | Non cancellato del tutto | SF-32 |

---

## DELETE /cestino (`svuota_cestino`)
**Flusso:** FL-05 (Svuota cestino, dopo la conferma, RB-32) · **Ruoli autorizzati:** —

Cancella per sempre tutti gli elementi del cestino.

**Output:** `204`, anche se il cestino era già vuoto.

**Errori**
| Codice | Significato | Sfiga |
|---|---|---|
| 500 | Cestino non svuotato del tutto: gli elementi rimasti restano nel cestino | SF-32 |

**Come reagisce l'app agli errori di cartelle e cestino:** per 404 e 500 l'app ricarica l'albero e mostra un avviso (CMP-15); testi definitivi in Fase 6 con i mockup. 409 apre l'avviso con tre scelte (RB-31); 422 non mostra niente, lo spostamento semplicemente non avviene (RB-24).


---

## Tag e Info (frammento Must C)
Comandi di DEC-51 per Info (CMP-24, DEC-44, DEC-96). Valgono le regole generali delle note. L'oggetto Nota ha in più:

```json
{
  "creataScelta": "2026-09-12",
  "fineValidita": null,
  "tag": ["lavoro/clienti", "riunioni"]
}
```

`creataScelta` e `fineValidita` sono giorni (`AAAA-MM-GG`) o `null` (DEC-28). `tag` sono i percorsi completi, con i livelli separati da `/` (RB-18), scritti come la prima volta (RB-22), in ordine alfabetico. Cambiare date o tag aggiorna `modificata` (DEC-51).

**Nomi dei tag:** senza distinguere maiuscole e minuscole (RB-22); i `/` all'inizio, alla fine e ripetuti si tolgono, gli spazi ai lati di ogni livello pure; un nome vuoto dà 400.

## PUT /note/:id/dettagli (`salva_dettagli`)
**Input:** `{ "creataScelta": "2026-09-12", "fineValidita": null }`; un campo assente resta com'è, `null` lo svuota. Qualsiasi data è ammessa (RB-20).
**Output:** l'oggetto Nota.
**Errori:** 400 (data non valida), 404 (nota non trovata o nel cestino, con `cestino` come per `PUT /note/:id`), 500.

## GET /tag (`elenca_tag`)
**Output:** `[{ "nome": "lavoro/clienti", "note": 3 }, …]`: tutti i tag, anche quelli senza note (RB-49), in ordine alfabetico; `note` conta le note fuori dal cestino che hanno quel tag o un suo sotto-tag, ciascuna una volta: è il numero della conferma di eliminazione (RB-19).

## POST /note/:id/tag (`aggiungi_tag`)
**Input:** `{ "nome": "Lavoro/Clienti" }`. Se il tag c'è già (senza distinguere maiuscole e minuscole) si usa quello; altrimenti nasce, con i livelli che mancano (RB-17, RB-18).
**Output:** l'oggetto Nota.
**Errori:** 400 (nome vuoto), 404, 500.

## DELETE /note/:id/tag (`togli_tag`)
**Input:** `{ "nome": "lavoro/clienti" }`. Toglie il tag dalla nota; il tag resta anche se nessuna nota lo usa più (RB-49).
**Output:** l'oggetto Nota.
**Errori:** 404 (nota o tag non trovati), 500.

## DELETE /tag (`elimina_tag`)
**Input:** `{ "nome": "lavoro/fornitori" }`. Elimina il tag e i suoi sotto-tag e li toglie da tutte le note, senza toccare altro (RB-19). La conferma con il numero di note la chiede l'app prima.
**Output:** `204`.
**Errori:** 404 (tag non trovato), 500.

---

## Ricerca (RF-08, DEC-94, DEC-95)
Comando del nucleo, sulla copia di lavoro: la ricerca non passa mai dal server. Valgono le regole generali delle note.

## cerca
**Input:**
```json
{
  "testo": "rilascio",
  "tag": ["lavoro", "lavoro/clienti"],
  "creata": { "da": "2026-09-23T22:00:00Z", "a": null },
  "modificata": null
}
```
`testo` può essere vuoto; gli spazi separano le parole, che devono esserci tutte (RB-69). `tag` sono percorsi: la nota deve avere ogni tag, o un suo sotto-tag (RB-70). `creata` e `modificata` sono intervalli in UTC, con `da` e `a` compresi e `null` per un estremo aperto; li calcola l'app nell'ora locale. Per `creata` vale `creataScelta`, se c'è, altrimenti `creata` (RF-04). Senza testo e senza filtri il risultato è vuoto: la card mostra solo i filtri (RB-33).

**Output:**
```json
[{
  "id": "3f6c1b2e-9a4d-4c8e-8f1a-2b7d5e6a9c10",
  "titolo": "Rilascio della versione 2",
  "estratto": "…il rilascio è fissato per venerdì, dopo le prove…",
  "evidenza": [4, 12],
  "cartella": "Lavoro",
  "data": "2026-09-25T09:12:00Z",
  "nelCestino": false
}]
```
- **Ordine:** prima le note con il testo nel titolo o nei tag, poi quelle con il testo solo nel contenuto (RB-34); in ogni gruppo, e senza testo, per ultima modifica, la più recente in cima (RB-70). Tutte, senza limite (RB-34).
- **Trovare:** dalla terza lettera l'indice FTS5 a trigrammi, senza maiuscole e accenti; con una o due lettere si scorrono le note (DEC-94, DEC-95). Il testo non è una query: virgolette, asterischi e operatori valgono come caratteri (RB-08).
- **`estratto`:** circa 80 caratteri attorno alla prima parola trovata nel contenuto, a parole intere, con «…» dove si taglia; `evidenza` è l'intervallo della parola, in caratteri dell'estratto, o `null`. Con la parola solo nel titolo o nei tag, o senza testo, è l'anteprima (RB-15) e `evidenza` è `null`.
- **`data`:** quella del filtro di data attivo (con tutti e due, la modifica); senza filtri di data l'ultima modifica.
- **Cestino:** le note nel cestino, o dentro una cartella nel cestino, ci sono con `nelCestino: true` se l'impostazione è accesa (RB-29); `cartella` è quella da cui venivano.
**Errori:** 400 (intervallo con `da` dopo `a`, istante non valido), 500.
**Implementazione:** `client/src-tauri/src/archivio_ricerca.rs`, comando in `comandi.rs`, prove in `archivio_ricerca_test.rs`; nell'interfaccia `client/src/componenti/Ricerca.tsx` e `RicercaAvanzata.tsx` (DEC-96).

## Impostazione delle note del cestino
Come le altre impostazioni di SC-06 (`client/src-tauri/src/impostazioni.rs`): `leggi_impostazioni` ha in più `"cestinoInRicerca": true`, e `cambia_cestino_in_ricerca` riceve `{ "attivo": false }`. Si sincronizza con l'elemento `impostazioni` (RB-52); senza un valore vale `true` (RB-29). I nomi seguono quelli dei comandi delle impostazioni già esistenti, al posto di `impostazione_ricerca` e `imposta_ricerca` proposti in DEC-95.

## Locale (RF-17, DEC-115, DEC-118)
Comandi del nucleo (`client/src-tauri/src/locale.rs`) su file e cartelle del disco; niente passa dal server. **Percorsi:** assoluti, sempre dentro una cartella dell'elenco, altrimenti 400. **Errori comuni:** 400 (percorso fuori dall'elenco, nome non valido: RB-82), 403 (il disco rifiuta: permessi, file bloccato, disco pieno; SF-37, con il motivo del sistema), 404 (non c'è più), 500.

| Comando | Input | Output | Errori in più |
|---|---|---|---|
| `cartelle_locali` | — | `[{ "percorso", "nome", "stato": "presente" \| "non trovata" \| "non accessibile", "tipo": "cartella" \| "file", "sospeso" }]`: prima i file trascinati da soli, poi le cartelle, in ordine alfabetico (RB-73, DEC-120) | — |
| `aggiungi_cartella_locale` | — (il nucleo apre la finestra di scelta del sistema) | la cartella aggiunta, `null` se si annulla | 409 già nell'elenco o dentro una cartella dell'elenco, con il percorso di quella (RB-74) |
| `aggiungi_percorsi_locali` | `{ "percorsi": ["…"] }`, quello che si è trascinato dentro Memodu (DEC-120) | `{ "aggiunti": [CartellaLocale], "gia": ["…"], "scartati": ["…"] }`: cartelle e file .md o .txt entrano, quelli già in Locale vanno in `gia`, il resto in `scartati` | — |
| `togli_cartella_locale` | `{ "percorso" }` | — | — (sul disco non cambia niente, RB-76) |
| `elenca_locale` | `{ "percorso" }` di una cartella | `[{ "nome", "percorso", "tipo": "cartella" \| "file", "sospeso": false }]`: file e poi cartelle, in ordine alfabetico (DEC-119); niente cartelle nascoste, solo .md e .txt (RB-75) | — |
| `apri_file_locale` | `{ "percorso" }` | `{ "testo", "sospeso", "codifica": "utf-8" \| "windows-1252", "solaLettura", "cambiatoFuori" }`; con modifiche in sospeso `testo` è quello in sospeso (RB-78) e `cambiatoFuori` dice se il disco è cambiato da quando si era letto (RB-85) | 413 oltre 10 MB |
| `nuovo_file_locale` | `{ "cartella" }` | `{ "percorso" }` provvisorio, dentro la cartella, finché il file non ha un nome (RB-81) | — |
| `sospendi_file_locale` | `{ "percorso", "testo" }` | — | 413 |
| `salva_file_locale` | `{ "percorso", "testo" }` | `{ "percorso", "convertitoInUtf8" }`: per un file nuovo il percorso definitivo, con il nome dalla prima riga e un numero se c'è già (RB-81) | 409 se il disco è cambiato da quando si era letto (l'interfaccia mostra l'avviso, RB-85) |
| `scarta_file_locale` | `{ "percorso" }` | — | — (Ricarica e Chiudi: la modifica in sospeso sparisce) |
| `crea_cartella_locale` | `{ "dentro", "nome" }` | `{ "percorso" }` | 409 nome già usato (RB-82) |
| `rinomina_locale` | `{ "percorso", "nome" }` | `{ "percorso" }`; la modifica in sospeso segue il file | 409 nome già usato |
| `sposta_locale` | `{ "percorso", "dentro" }` | `{ "percorso" }`; anche tra dischi diversi | 409 nome già usato nella destinazione |
| `elimina_locale` | `{ "percorso", "perSempre": false }` | — | 409 «cestino non disponibile»: l'interfaccia chiede conferma e richiama con `perSempre: true` (RB-83) |

**Evento `locale-cambiato`:** `{ "percorsi": ["…"] }`, dal nucleo all'interfaccia quando una cartella dell'elenco cambia sul disco (RB-84): l'interfaccia rilegge le cartelle aperte e, per il file aperto o con modifiche in sospeso, chiede `apri_file_locale` e mostra l'avviso se `cambiatoFuori` (RB-85).
**Implementazione:** regole e dati in `client/src-tauri/src/archivio_locale.rs` (prove in `archivio_locale_test.rs`), comandi e osservazione del disco in `locale.rs`; nell'interfaccia la cartella `client/src/locale/` (`SezioneLocale.tsx`, `FileAperto.tsx`, `useLocale.ts`, prove in `Locale.test.tsx`). In più rispetto alla tabella: `apri_file_locale` restituisce anche `nuovo`, `impronta` (del disco adesso) e `sparito`; `sospendi_file_locale` e `salva_file_locale` ricevono `impronta`, quella letta, e `salva_file_locale` restituisce la nuova; «Tieni la mia versione» è `sospendi_file_locale` con l'impronta di adesso, al posto di `tieni_versione_locale`.

---

## Sincronizzazione (RF-10, DEC-75 … DEC-84)
**Valgono per tutte le richieste della sincronizzazione:**
- **Indirizzo:** in rete l'indirizzo HTTPS di Vercel, scritto nel file `credenziali` (DEC-104, DEC-105); in locale `127.0.0.1:4317`, solo sulla macchina stessa.
- **Lunghezza:** corpo della richiesta fino a 4,4 MB (`LIMITE_RICHIESTA_BYTE`, `bodyLimit` di Fastify): Vercel non ne accetta più di 4,5 (DEC-106); oltre, `413`.
- **Chi le fa:** il nucleo Rust del client, in background (`client/src-tauri/src/sincronizzazione.rs`), non l'interfaccia.
- **Autorizzazione:** intestazione `Authorization: Bearer <gettone>` con il gettone delle credenziali dell'installazione (DEC-79); senza o sbagliato `401`, e il client mostra la schermata di blocco (RB-57).
- **Protocollo:** intestazione `Memodu-Protocollo: 1`; con una versione diversa `426`, e il client mostra l'avviso di errore e continua sulla copia di lavoro (DEC-83).
- **Blocchi:** testo opaco per il server. Oggi JSON in chiaro, `{ "formato": "chiaro", "tipo": "nota" | "cartella" | "tag" | "impostazioni", "modificato_il": "<UTC>", "eliminato": false, "campi": { … } }` (DEC-78).
- **Impostazioni:** la scorciatoia della nota rapida e le note del cestino nella ricerca (`cestino_in_ricerca`, DEC-95) viaggiano in un solo elemento di tipo `impostazioni`, con l'id fisso `00000000-0000-4000-8000-000000000001`, lo stesso su tutti i dispositivi (DEC-91, RB-52).
- **Implementazione:** `api/src/sincronizzazione.ts` (deposito in PostgreSQL: Neon in rete, PGlite in locale, DEC-105), `api/src/schema.ts` (schema e migrazioni), `api/src/rotteSincronizzazione.ts` e `api/src/servizio.ts`, prove in `api/src/sincronizzazione.test.ts`.
- **Credenziali:** `{ "indirizzo", "installazione", "gettone", "chiave" }` nel file `credenziali` della cartella dei dati di ogni dispositivo. In rete si generano con `npm run credenziali -w @memodu/api -- <indirizzo>` e il server conosce solo l'impronta del gettone (`MEMODU_IMPRONTA`, DEC-104); in locale l'API scrive il file al primo avvio, se non c'è. Il gettone non va mai nel registro.
- **Errori del server:** `500` con `{ "statusCode": 500, "message": "Errore del server" }`, senza dettagli; il dettaglio va nel registro.

## GET /sincronizzazione/modifiche?dopo=N
**Output:** `{ "modifiche": [{ "id", "versione", "ordine", "ora", "dati" }], "ultimo": M, "altre": false, "archivio": "<uuid>" }`: le versioni attuali degli elementi cambiati dopo il numero d'ordine N, in ordine, al massimo 500 e fino a 4 MB di blocchi (almeno uno, DEC-106); con `altre` si richiede da `ultimo`. `archivio` è l'identificativo dell'archivio: se cambia, il client riparte da zero (DEC-105).
**Errori:** 400 (`dopo` non è un numero), 401, 426.

## PUT /sincronizzazione/elementi/:id
**Input:** `{ "base": 7, "dati": "<blocco>" }`: il blocco nuovo e la versione da cui parte (0 per un elemento nuovo). `id` è un UUID.
**Output:** `{ "versione": 8, "ordine": 1521 }`. Il server tiene le versioni precedenti a scalare per 7 giorni (DEC-77, DEC-113).
**Errori:** 409 `{ "attuale": { "id", "versione", "ordine", "ora", "dati" } }` se l'elemento è già a un'altra versione: il client fonde e riprova (DEC-76); 400, 401, 413, 426.

## GET /salute
Controllo di salute, senza gettone né protocollo. **Output:** `200 { "stato": "ok" }` se l'archivio risponde, altrimenti `503` (DEC-105).
