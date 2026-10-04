# Organizzazione – Flussi

<!-- Fase 2 della guida. I diagrammi si scrivono in Mermaid. -->

## FL-05 – Organizzare nelle cartelle
**Requisiti:** RF-05, RF-15 · **Attori:** Utente · **Interazioni rapide:** trascinamento, menu del tasto destro (RF-11)

```mermaid
flowchart TD
    A{Cosa faccio?} -- Sposto una nota --> B[Trascino la nota dalla barra laterale o dall'albero su una cartella, oppure uso Sposta in… in Info o dal tasto destro sulla nota - DEC-96]
    B --> Z[La nota è nella nuova cartella; se era non organizzata esce dalla barra laterale]
    A -- Creo una cartella --> C[Tasto destro nell'albero o pulsante + in cima all'albero]
    C --> N{Il nome esiste già lì?}
    A -- Rinomino una cartella --> D[Tasto destro, Rinomina]
    D --> N
    A -- Sposto una cartella --> E[La trascino nell'albero]
    E --> F{La destinazione è dentro la cartella stessa?}
    F -- Sì --> G[Spostamento impedito - RB-24]
    F -- No --> N
    N -- No --> Y[Operazione eseguita]
    N -- Sì --> H[Avviso con tre scelte - RB-31]
    H -- Aggiungi un numero --> Y
    H -- Unisci --> Y
    H -- Annulla --> X[Nessuna modifica]
    A -- Elimino --> I[Nota o cartella con tutto il contenuto vanno nel cestino - RB-25, RB-26]
    A -- Ripristino dal cestino --> J[L'elemento torna nella radice - RB-28]
    A -- Svuoto il cestino --> K[Conferma, poi eliminazione definitiva - RB-27, RB-32]
    A -- Elimino per sempre un elemento del cestino --> L[Conferma, poi eliminazione definitiva di quell'elemento - RB-55]
```

### Percorsi alternativi
- **Tornare al primo livello trascinando:** una nota trascinata sul titolo «Non organizzate» torna tra le non organizzate; una cartella trascinata sul titolo «Cartelle» va al primo livello.
- **Nuova cartella dal tasto destro:** su una cartella crea una sottocartella; sullo spazio vuoto dell'albero crea una cartella al primo livello.
- **Nuova nota dal tasto destro su una cartella:** vedi FL-09.
- **Elemento ritrovato con la ricerca mentre è nel cestino:** è segnalato come "nel cestino" (RB-29).
- **Eliminare per sempre un solo elemento:** dal cestino, con Elimina definitivamente accanto a Ripristina; chiede conferma (RB-55, DEC-17). Una cartella si elimina con tutto il suo contenuto.

### Sfighe gestite
| Sfiga | Rilevamento | Comunicazione | Via d'uscita |
|---|---|---|---|
| SF-05 Cambio idea | Nota o cartella eliminata per errore | Nessun messaggio: l'elemento è nel cestino | Si ripristina dal cestino, nella radice (RB-28) |
| SF-18 Valori limite | Cartella trascinata dentro sé stessa o una sua sottocartella | Lo spostamento non avviene | Nessuna modifica (RB-24) |
| SF-19 Duplicati | Nome di cartella già presente nella destinazione | Avviso con le scelte: aggiungi un numero, unisci, annulla | L'utente sceglie (RB-31) |
| SF-32 Errore del server a metà operazione | La copia di lavoro risponde che la nota o la cartella non esiste più (per esempio tolta da un'altra finestra di Memodu) o che non ha scritto (DEC-85) | Avviso (CMP-15), testo definitivo in Fase 6 | L'app ricarica la colonna: si vede lo stato vero e si riprova (DEC-37) |
| SF-20 Riferimenti spariti | Nota creata o spostata, su un altro dispositivo, in una cartella finita nel cestino | Nessun messaggio | La nota va tra le non organizzate, la cartella resta nel cestino (RB-30) |
| SF-17 Troppo | Cestino con moltissimi elementi | Nessun messaggio | Resta finché l'utente non lo svuota (RB-27) |
| SF-16 Vuoto | Nessuna cartella | Sotto il titolo Cartelle: «Nessuna cartella. Creane una con +» (CA-05.12) | Il + accanto al titolo crea la prima cartella |

### Sfighe considerate e scartate
- SF-01 Doppio invio, SF-02 Abbandono: ogni operazione è immediata e salvata (RB-06).
- SF-08 Connessione che cade a metà: le operazioni avvengono sulla copia di lavoro (DEC-02).
- SF-22 Modifica simultanea (per esempio la stessa cartella rinominata su due dispositivi): gestita in FL-07.
- Le altre sfighe non riguardano cartelle e cestino: nessuna data, file, permesso o sistema esterno coinvolto.

---

## FL-06 – Cercare e filtrare
**Requisiti:** RF-08, RF-15 · **Attori:** Utente

```mermaid
flowchart TD
    Z[Clic sul campo di ricerca o Ctrl + K - DEC-94] --> Y[La card si apre con i soli filtri - RB-33]
    Y --> X{Scrivo o scelgo un filtro?}
    X -- Scrivo --> A[Scrivo nel campo]
    A --> B[Dopo una brevissima pausa la ricerca parte sul dispositivo - RB-33]
    B --> C[Cerca in titolo, testo e nomi dei tag, anche dentro le parole - RB-69]
    C --> D{Aggiungo filtri su tag o date?}
    D -- Sì --> E[Applico i filtri - RB-70]
    E --> F
    D -- No --> F{Ci sono risultati?}
    X -- Filtro --> E
    F -- No --> G[La card mostra: Nessuna nota trovata - RB-35]
    F -- Sì --> H[La card a discesa mostra tutti i risultati per pertinenza, scorrendo - RB-34]
    H --> I{Le note nel cestino sono incluse nelle impostazioni?}
    H -- Mostra tutti i risultati o Ctrl + Maiusc + K --> R[Ricerca avanzata al centro: stesso testo e filtri, sempre aperti - DEC-96]
    R --> L
    I -- Sì --> J[Compaiono segnalate come nel cestino - RB-29]
    I -- No --> K[Non compaiono]
    J --> L[Clic su un risultato]
    K --> L
    L --> M[La nota si apre al posto di quella aperta, già salvata - RB-06]
    M --> N[La card si chiude; la colonna aperta da Ctrl + K si richiude - RB-71]
```

### Percorsi alternativi
- **Ricerca per tag:** cercando un tag si trovano anche le note con i suoi sotto-tag (RF-06). Maiuscole e minuscole non contano (RB-22).
- **Filtri:** tag e date dei metadati (creazione, ultima modifica); il filtro sulla fine validità per ora non c'è (DEC-94). Con il campo vuoto e almeno un filtro i risultati sono in ordine di ultima modifica (RB-70).
- **Esc:** chiude la card senza aprire niente; la colonna aperta da Ctrl + K si richiude e il cursore torna dov'era nel foglio (RB-71).
- **Risultato nel cestino:** aprendolo si vede che è nel cestino; si può ripristinare (RB-28).
- **Ricerca avanzata:** «Mostra tutti i risultati» in fondo alla card, o Ctrl + Maiusc + K, apre la ricerca avanzata al centro con il velo, con lo stesso testo e i filtri sempre aperti (DEC-96, CA-08.17 … CA-08.21).

### Sfighe gestite
| Sfiga | Rilevamento | Comunicazione | Via d'uscita |
|---|---|---|---|
| SF-06 Input strani | Maiuscole, accenti, spazi nella ricerca | Nessun messaggio | Maiuscole, minuscole e accenti non contano; gli spazi separano le parole (RB-22, RB-69) |
| SF-08 Connessione che cade a metà | Assenza di rete | Nessun messaggio: la ricerca avviene sul dispositivo | Cerca nella copia di lavoro (DEC-02) |
| SF-16 Vuoto | Nessun risultato | "Nessuna nota trovata" (testo definitivo in Fase 6) | Si cambia la ricerca o i filtri (RB-35) |
| SF-17 Troppo | Molti risultati | La card si scorre | Tutti i risultati, per pertinenza (RB-34) |
| SF-20 Riferimenti spariti | Il risultato viene eliminato, spostato o modificato mentre la card è aperta | I risultati restano quelli della ricerca | Cliccando si apre la versione aggiornata della nota (RB-45) |

### Sfighe considerate e scartate
- SF-01 Doppio invio: la ricerca parte da sola, non c'è invio (RB-33).
- SF-02 Abbandono: chiudere la card non modifica nulla.
- SF-36 Input malevolo: la ricerca non esegue il testo cercato (RB-08).
- Le altre sfighe non riguardano la ricerca: nessuna scrittura, file, permesso o sistema esterno coinvolto.
- Nota: con la cifratura end-to-end la ricerca richiede un indice sul dispositivo; le prestazioni sul web sono un'assunzione della visione.

---

## Diagrammi a stati

### Nota e cartella – Posizione
```mermaid
stateDiagram-v2
    [*] --> Radice: nota rapida, Ctrl + N o il + - DEC-69
    [*] --> InCartella: Nuova nota qui, dal tasto destro su una cartella - DEC-69
    Radice --> InCartella: sposto
    InCartella --> InCartella: sposto
    InCartella --> Radice: sposto nella radice
    Radice --> Cestino: elimino
    InCartella --> Cestino: elimino
    Cestino --> Radice: ripristino
    Cestino --> [*]: svuoto il cestino
```

| Transizione | Chi può attivarla | Regola |
|---|---|---|
| Elimino | Utente | RB-25, RB-26 |
| Ripristino | Utente | RB-28 |
| Svuoto il cestino | Solo l'utente | RB-27 |

---

## Regole di business
| Codice | Regola | Usata in |
|---|---|---|
| RB-23 | Nella stessa cartella non possono esserci due cartelle con lo stesso nome; maiuscole e minuscole non contano («Idee» e «idee» sono lo stesso nome), come per il disco su macOS e Windows (DEC-36) | FL-05 |
| RB-24 | Le cartelle si annidano senza limiti di profondità; una cartella non si può spostare dentro sé stessa o dentro una sua sottocartella | FL-05 |
| RB-25 | Eliminare una cartella la manda nel cestino insieme a tutto il suo contenuto (note e sottocartelle) | FL-05 |
| RB-26 | Eliminare una nota la manda nel cestino | FL-05 |
| RB-27 | Gli elementi restano nel cestino finché l'utente non lo svuota o non li elimina uno per uno per sempre (RB-55); Memodu non cancella mai dati da solo | FL-05 |
| RB-28 | Un elemento ripristinato dal cestino torna sempre nella radice: la nota diventa non organizzata, la cartella torna al primo livello dell'albero | FL-05 |
| RB-29 | Le note nel cestino compaiono nella ricerca, segnalate come "nel cestino"; una preferenza nelle impostazioni permette di escluderle | FL-05, FL-06 |
| RB-30 | Se durante la sincronizzazione una nota risulta creata o spostata in una cartella che un altro dispositivo ha mandato nel cestino (o dentro una sua sottocartella), la nota va tra le non organizzate e la cartella resta nel cestino (DEC-111) | FL-05, FL-07, FL-09 |
| RB-31 | Se creando, rinominando o spostando una cartella il nome esiste già nella destinazione, compare un avviso con tre scelte: aggiungere un numero (es. "Idee (2)"), unire le due cartelle o annullare. Unendo due cartelle, per ogni sottocartella con lo stesso nome ricompare lo stesso avviso | FL-05 |
| RB-32 | Svuotare il cestino chiede una conferma prima dell'eliminazione definitiva | FL-05 |
| RB-55 | Nel cestino un singolo elemento si può eliminare per sempre con "Elimina definitivamente"; prima si chiede conferma, indicando il nome e, per una cartella, quante note contiene (DEC-17) | FL-05 |
| RB-56 | Accanto a ogni cartella e alla sezione Non organizzate si mostra il numero di note che contiene, sottocartelle comprese; le note nel cestino non contano. Il numero si aggiorna subito (ID-15) | FL-05 |
| RB-60 | Nella sezione Non organizzate le note si ordinano per ultima modifica: la più recente in cima | FL-05, FL-09 |
| RB-63 | Nata con le cartelle sul file system (DEC-36) e rimasta con il database (DEC-48). Creando o rinominando una cartella, i caratteri vietati si sostituiscono con `-` senza avvisi, con le stesse regole dei nomi dei file delle note (DEC-29, `architettura.md`) | FL-05 |
| RB-64 | Nell'albero le cartelle di ogni livello si ordinano alfabeticamente, dalla A alla Z, senza distinguere maiuscole e minuscole | FL-05 |
| RB-65 | Le note di una cartella si vedono nell'albero: aprendo la cartella compaiono prima le sottocartelle (RB-64), poi le note, in ordine alfabetico per titolo, dalla A alla Z, senza distinguere maiuscole e minuscole | FL-05 |
| RB-66 | Spostare la nota aperta (Sposta in o trascinamento) non la chiude: si continua a scrivere, e nella colonna la cartella di destinazione si apre per mostrare la nota selezionata | FL-05 |
| RB-67 | Se la nota aperta finisce nel cestino (eliminata da Info o dal tasto destro, trascinata sul cestino o dentro una cartella eliminata), l'area della nota mostra lo stato vuoto «Nessuna nota aperta» (CMP-19); nessun'altra nota si apre da sola | FL-05 |
| RB-33 | La ricerca parte mentre si scrive, dopo una brevissima pausa, senza premere Invio. La card si apre appena si entra nel campo, con i soli filtri, anche prima di scrivere (DEC-94) | FL-06 |
| RB-69 | Il testo cercato si trova in titolo, testo e nomi dei tag, anche dentro le altre parole («lascio» trova «rilascio»); maiuscole e accenti non contano; con più parole la nota deve contenerle tutte. Le date non si cercano con il testo, solo con i filtri (DEC-94) | FL-06 |
| RB-70 | I filtri si sommano: con più tag nel filtro Tag escono le note che li hanno tutti, ciascuno con i suoi sotto-tag; con i filtri di data, le note nel periodo scelto. Con il campo vuoto e almeno un filtro i risultati sono in ordine di ultima modifica, la più recente in cima (DEC-94) | FL-06 |
| RB-71 | Ctrl + K (⌘ + K su macOS) apre la colonna, se è chiusa, e porta il cursore nel campo di ricerca. Se la colonna l'ha aperta Ctrl + K, aprendo un risultato o premendo Esc si richiude, e con Esc il cursore torna dov'era nel foglio; fissata o aperta a mano resta com'era (DEC-94) | FL-06 |
| RB-72 | Chiudendo la card il testo cercato e i filtri si svuotano: ogni ricerca riparte da zero (DEC-94) | FL-06 |
| RB-34 | I risultati si ordinano per pertinenza: prima le note con la parola nel titolo o nei tag, poi quelle con la parola solo nel testo. La card a discesa li mostra tutti e si scorre | FL-06 |
| RB-35 | Senza risultati la card resta aperta con il messaggio "Nessuna nota trovata" | FL-06 |
| RB-45 | Mentre la card è aperta i risultati non si aggiornano; cliccando un risultato si apre sempre la versione aggiornata della nota | FL-06 |
| RB-48 | Una nuova cartella nasce con il nome "Nuova cartella" (con un numero se il nome esiste già, RB-23), già selezionato per essere cambiato. Invio o un clic altrove confermano il nome; Esc o un nome vuoto annullano la creazione e la cartella non nasce. Rinominando una cartella esistente, Esc riporta il nome di prima | FL-05 |
| RB-49 | Un tag continua a esistere anche quando nessuna nota lo usa più, e resta tra i suggerimenti finché l'utente non lo elimina (RB-19) | FL-04 |
