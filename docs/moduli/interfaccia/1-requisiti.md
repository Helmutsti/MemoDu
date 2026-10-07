# Interfaccia – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

L'interfaccia deve essere semplice e intuitiva (`RNF-08`) e favorire velocità e produttività.

## RF-11 – Interazioni rapide
**Priorità:** Must · **Origine:** — · **Fase:** 9 · **Stato:** Pronto

Come *utente* voglio usare trascinamento, menu del tasto destro e scorciatoie da tastiera per lavorare sulle note senza passare da menu e finestre di dialogo.

Le scorciatoie interne sono fisse e documentate. Solo la scorciatoia globale della nota rapida (RF-01) si può cambiare, per evitare conflitti con altri programmi.

**Collegamenti:** FL-01 · FL-03 · FL-05 · EN-07 · SC-00 · RF-01

### Scenario d'uso
Trascino con il mouse le note da organizzare dalla barra laterale all'albero delle cartelle (vedi lo scenario di RF-05).

### Criteri di accettazione
Scritti dall'agente il 07/10/2026 dai flussi (tabella di RF-11 in `2-flussi.md`) e da quello che l'app fa, approvati da Manuel Cucca il 07/10/2026 con il piano di test TC-150 … TC-157. Su macOS ⌘ al posto di Ctrl. Fuori da qui, perché sospesi con DEC-64 o legati a RF-03: le scorciatoie della formattazione, il tasto destro sul testo e il trascinamento delle immagini.
- **CA-11.1** *Dato* la finestra principale, con una nota, un file di Locale, il cestino o le impostazioni aperti, anche con la colonna chiusa, *quando* premo Ctrl + N, *allora* nasce una nota nuova nella radice di CLOUD, aperta e pronta per scrivere (DEC-69).
- **CA-11.2** *Dato* aperto qualcosa nell'area (una nota, anche con Info aperta sotto il titolo, un file di Locale, il cestino o le impostazioni), *quando* premo Ctrl + W, *allora* si chiude e l'area resta vuota; con l'area già vuota non succede niente (DEC-70, DEC-116, DEC-117).
- **CA-11.3** *Dato* la finestra principale, *quando* premo Ctrl + K, *allora* la colonna si apre se era chiusa e il cursore è nel campo della ricerca; con Esc torno dove ero e la colonna aperta da Ctrl + K si richiude; Ctrl + Maiusc + K apre la ricerca avanzata (DEC-94, DEC-96, RB-71).
- **CA-11.4** *Dato* la finestra principale, *quando* premo Ctrl + \, *allora* la colonna si fissa aperta, e premendolo ancora torna a scomparsa (DEC-102).
- **CA-11.5** *Dato* aperta una finestra al centro con il velo (conferma, accesso, Info dal tasto destro), *quando* premo Ctrl + N, Ctrl + W, Ctrl + K o Ctrl + \, *allora* non succede niente dietro; Esc o un clic sul velo chiudono la finestra (DEC-81, DEC-124).
- **CA-11.6** *Dato* la colonna, *quando* faccio clic con il tasto destro, *allora* compare il menu giusto: su una nota Info, Sposta in… ed Elimina; su una cartella di CLOUD Nuova nota qui, Nuova sottocartella, Rinomina ed Elimina; su una cartella o un file di Locale le voci di FL-12 con Togli da Locale; su un tag nei suggerimenti di Info Elimina tag…. Il menu si usa anche da tastiera (frecce, Invio, Esc) e si chiude con un clic fuori (CMP-09, DEC-96).
- **CA-11.7** *Dato* la colonna, *quando* trascino una nota o una cartella su un'altra cartella, sul titolo CLOUD o sulla riga Cestino, *allora* durante il trascinamento la destinazione si evidenzia e, rilasciando, la nota o la cartella è spostata lì o nel cestino; con Esc il trascinamento si annulla e non cambia niente; una cartella non si sposta dentro sé stessa (RB-65, DEC-119, DEC-120).
- **CA-11.8** *Dato* le scorciatoie fisse, *quando* le guardo nei menu e nelle voci, *allora* vedo la stessa combinazione che funziona (per esempio Chiudi nota e Chiudi file con Ctrl + W); solo la scorciatoia globale della nota rapida si cambia, nelle impostazioni (RF-01, RB-52).

---

## RF-12 – Finestre multiple e sganciabili (desktop)
**Priorità:** Should · **Origine:** DEC-01 · **Fase:** 1 · **Stato:** In progettazione

Come *utente desktop* voglio aprire più note in finestre affiancate, sganciarle dall'applicazione principale e ricollegarle per consultare e scrivere più note contemporaneamente.

Le note sganciate anticipate da DEC-92 sono state tolte (DEC-93); resta, dalle impostazioni, «Tieni Memodu in primo piano» (SC-06).

**Collegamenti:** FL-00 · EN-00 · SC-00

### Scenario d'uso
[Da compilare]

### Criteri di accettazione
- [Da compilare]

---

## Fuori dal modulo
Codici del registro idee esclusi da questo modulo:
- 
