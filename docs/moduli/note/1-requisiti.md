# Note – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

La scrittura viene prima di tutto: aprire l'app e iniziare a scrivere deve essere immediato (`RNF-01`).

## RF-01 – Nota rapida da scorciatoia
**Priorità:** Must · **Origine:** — · **Fase:** 9 · **Stato:** Pronto

Come *utente desktop* voglio aprire con una scorciatoia da tastiera una finestra di nota rapida per annotare un'idea senza interrompere quello che sto facendo.

Dalla nota rapida l'utente può:
- aprire l'app completa, senza perdere quanto scritto;
- salvare e tornare alle altre attività.

Il programma completo mostra una nota alla volta: se la nota rapida viene aperta nel programma completo, la nota che era aperta viene salvata e chiusa, e al suo posto compare la nota rapida.

Piattaforme:
- **Desktop (Windows, macOS):** la scorciatoia è globale, funziona da qualsiasi programma e l'utente può cambiarla (RF-11). Memodu resta attivo in background, con un'icona nell'area di notifica (Windows) o nella barra dei menu (macOS); l'avvio automatico all'accensione è opzionale.
- **Web:** rinviato (ID-19). Quando arriverà, la nota rapida non esisterà e si userà la normale creazione di una nota.

**Collegamenti:** FL-01 · EN-01 · EN-07 · SC-00 · RNF-01

### Scenario d'uso
Premo la scorciatoia e compare la finestra della nota rapida. A quel punto posso decidere di aprire il programma completo senza perdere la nota, oppure salvare e chiudere la finestra. Se nel programma è già aperta un'altra nota, viene semplicemente salvata e messa da parte.

### Criteri di accettazione
Frammento Must A: la scorciatoia è fissa (Ctrl + Alt + N su Windows, Control + Option + N su macOS); cambiarla dalle impostazioni (RF-11, SC-06) arriva con il frammento Must.

- **CA-01.1** *Dato* Memodu in background, *quando* premo la scorciatoia da un altro programma, *allora* entro 0,2 s compare SC-02 con il cursore nell'area di scrittura (RNF-01).
- **CA-01.2** *Dato* una nota rapida con del testo, *quando* la chiudo con Chiudi, con il tasto Esc o con un clic fuori, *allora* la finestra si chiude e la nota compare in cima all'elenco del programma, nella radice (RB-01, RB-02, RB-60).
- **CA-01.3** *Dato* una nota rapida vuota, *quando* la chiudo, *allora* non nasce nessuna nota (RB-03, SF-16).
- **CA-01.4** *Dato* una nota rapida aperta, *quando* premo di nuovo la scorciatoia, *allora* la prima viene salvata e resta aperta, e ne compare un'altra spostata di 32 px a destra e in basso (RB-04, SF-01, SF-04).
- **CA-01.5** *Dato* una nota rapida con del testo e un'altra nota aperta nel programma, *quando* dalla freccia di Chiudi scelgo Apri nel programma, *allora* la nota del programma viene salvata e chiusa e al suo posto si apre la nota rapida (RB-05).
- **CA-01.6** *Dato* Memodu in background, *quando* uso l'icona nell'area di notifica (Windows) o nella barra dei menu (macOS), *allora* posso aprire la nota rapida o il programma.
- **CA-01.7** *Dato* il server spento, *quando* la nota rapida prova a salvare, *allora* compare SC-07 con «Il server delle note non risponde. Avvialo e premi Riprova.»; avviato il server, Riprova salva la nota con tutto il testo (RB-61, SF-30).
- **CA-01.8** *Dato* del testo non salvato perché il server non risponde, *quando* chiudo la finestra, *allora* compare la conferma «La nota non è salvata»; Annulla lascia la finestra aperta con il testo, Chiudi comunque la chiude (RB-62).

---

## RF-02 – Scrittura in markdown con formattazione minima
**Priorità:** Must · **Origine:** — · **Fase:** 9 · **Stato:** Pronto

Come *utente* voglio scrivere note in markdown con una formattazione minima per prendere appunti strutturati e produrre documenti formattati.

Formattazioni previste:
- corsivo;
- grassetto;
- sottolineato;
- barrato;
- titoli e sottotitoli;
- elenchi puntati, numerati e checklist.

La nota si vede formattata mentre si scrive: i simboli markdown compaiono solo dove c'è il cursore, e il testo resta markdown. La formattazione si applica scrivendo i simboli, con le scorciatoie da tastiera, con la barra degli strumenti o con il menu del tasto destro.

Ogni modifica si salva da sola, senza pulsante Salva (RB-06). Il testo incollato da fuori entra come testo semplice (RB-07).

**Collegamenti:** FL-02 · FL-09 · EN-01 · SC-00

### Scenario d'uso
Scrivo la nota e inserisco un'immagine trascinandola nel testo, oppure premendo il pulsante degli allegati. Sull'immagine inserita posso poi aprire delle impostazioni, in stile Word.

### Criteri di accettazione
Frammento Must A: senza immagini (RF-03), senza menu `···` e senza riga dei metadati (RF-04).

- **CA-02.1** *Dato* il programma aperto, *quando* premo il + della sezione Note o Nuova nota, *allora* nasce una nota vuota in cima all'elenco, aperta con il cursore nel corpo; se la lascio vuota, sparisce (FL-09, RB-10, RB-60, DEC-39).
- **CA-02.2** *Dato* una nota aperta, *quando* scrivo la sintassi markdown (`#`, `##`, `**`, `*`, `~~`, `-`, `1.`, `- [ ]`), *allora* il testo si formatta subito e i simboli si vedono solo sulla riga del cursore (RF-02).
- **CA-02.3** *Dato* del testo selezionato, *quando* premo Ctrl + B, I, U o Ctrl + Maiusc + X (⌘ su macOS), *allora* diventa grassetto, corsivo, sottolineato o barrato; il sottolineato si salva come `<u>…</u>` (DEC-28).
- **CA-02.4** *Dato* del testo selezionato, *allora* 8 px sopra compare la pillola di formattazione; *dato* un clic sul vuoto, compare quella di inserimento; *dato* `/` su una riga vuota, si apre il menu di inserimento. In nessuno c'è la voce Immagine; la pillola sparisce riprendendo a scrivere, con Esc o con un clic altrove (CMP-10, CMP-09).
- **CA-02.5** *Dato* il cursore nel testo, *quando* premo Alt + F10 (Option + F10), *allora* il focus va sulla pillola; le frecce passano da uno strumento all'altro ed Esc torna al testo (CMP-10, RNF-04).
- **CA-02.6** *Dato* del testo, *quando* uso il tasto destro, *allora* compare il menu con Taglia, Copia, Incolla, la formattazione con le scorciatoie, Titolo › ed Elenco › (RF-11).
- **CA-02.7** *Dato* una modifica, *quando* passano 2 s senza scrivere, o cambio nota, o chiudo, o la finestra perde il focus, *allora* la nota si salva senza messaggi e sale in cima all'elenco (RB-06, RB-60).
- **CA-02.8** *Dato* testo copiato da Word, dal web o da un'email, *quando* lo incollo, *allora* entra come testo semplice (RB-07, SF-06).
- **CA-02.9** *Dato* uno script o dell'HTML attivo nel testo, *quando* la nota si mostra, *allora* il codice non viene eseguito: si vede come testo o viene rimosso (RB-08, SF-36).
- **CA-02.10** *Dato* una nota senza titolo, *allora* nell'elenco compaiono le prime parole del testo; senza titolo né testo compare «Nota vuota» in grigio chiaro (RB-15).
- **CA-02.11** *Dato* una nota aperta, *quando* premo Ctrl + Z (⌘ + Z), *allora* si annulla l'ultima modifica, qualunque sia (RB-59).
- **CA-02.12** *Dato* un'interruzione improvvisa (crash o spegnimento), *quando* riapro la nota, *allora* trovo l'ultimo salvataggio e i dati non sono rovinati (RB-06, SF-10, SF-32).
- **CA-02.13** *Dato* il server spento o un errore di salvataggio, *allora* valgono SC-07, il testo in memoria e la conferma alla chiusura, come in CA-01.7 e CA-01.8 (RB-61, RB-62).

---

## RF-03 – Immagini nelle note
**Priorità:** Must · **Origine:** — · **Fase:** 6 · **Stato:** In progettazione

Come *utente* voglio inserire immagini nelle note per tenere insieme testo e materiali collegati.

Nella prima fase si possono allegare solo immagini, fino a 25 MB ciascuna; gli altri tipi di file sono parcheggiati (ID-14). Si inseriscono trascinando il file nel testo oppure con il pulsante degli allegati, e si mostrano con l'orientamento salvato nel file. Sulle immagini inserite si possono impostare:
- dimensione;
- allineamento (a sinistra, al centro, a destra), sempre su una riga a sé, senza testo che scorre attorno (ID-07);
- ritaglio;
- rotazione di 90° a sinistra o a destra;
- testo alternativo: di default è il nome del file, e l'utente può cambiarlo nelle impostazioni dell'immagine (RNF-04).

Ritaglio e rotazione sono reversibili: l'immagine originale resta intatta (RB-14).

**Collegamenti:** FL-03 · EN-02 · SC-00 · RNF-04

### Scenario d'uso
Condiviso con RF-02: vedi lo scenario di RF-02.

### Criteri di accettazione
- [Da compilare]

---

## RF-04 – Metadati della nota
**Priorità:** Must · **Origine:** — · **Fase:** 6 · **Stato:** In progettazione

Come *utente* voglio associare dei metadati a ogni nota per descriverla con titolo, date e tag.

| Metadato | Chi lo imposta | Note |
|---|---|---|
| Titolo | Utente | Si modifica direttamente nella schermata di scrittura. Può mancare: nelle liste si mostrano allora le prime parole del testo (RB-15). Può ripetersi (RB-16) |
| Data di creazione di sistema | Sistema | Non modificabile. Sempre visibile nei dettagli della nota |
| Data di creazione scelta dall'utente | Utente | È la data di creazione mostrata; se l'utente non la imposta, si mostra quella di sistema |
| Data di ultima modifica | Sistema | |
| Tag | Utente | Gli stessi tag di `RF-06` |
| Data di fine validità | Utente | Solo informativa: alla scadenza non succede nulla |

**Collegamenti:** FL-04 · EN-01 · EN-04 · SC-00 · RF-06

### Scenario d'uso
Scrivo la nota. Le note non ancora organizzate compaiono in una barra laterale e da lì le trascino nell'albero delle cartelle. Quando apro una nota, dal menu in alto a destra posso aggiungere tag, spostarla in un'altra cartella o modificarne i metadati. Il titolo è l'unico metadato che modifico direttamente nella schermata di scrittura.

### Criteri di accettazione
Frammento Must C (DEC-44): sotto il titolo l'ultima modifica e i tag in sola lettura; date, tag e cartella nella finestra Dettagli (CMP-24). Criteri approvati da Manuel Cucca il 29/09/2026.

- **CA-04.1** *Dato* una nota aperta, *allora* sotto il titolo compaiono «Modificata …» e i suoi tag in sola lettura; senza tag solo la data. Una modifica di oggi si scrive «Modificata oggi alle 11:42», una più vecchia «Modificata il 12/09/2026 alle 10:14» (DEC-44).
- **CA-04.2** *Dato* una nota, *quando* scelgo «Dettagli» dal menu `···` o dal tasto destro sulla nota nella colonna, *allora* si apre la finestra al centro con il velo (CMP-24); Esc o ✕ la chiudono e il focus torna dove era.
- **CA-04.3** *Dato* la finestra Dettagli, *quando* scelgo la data di creazione con il calendario, *allora* si salva subito e sotto resta «Creata il … alle …», la data di sistema, che non cambia (RB-21); qualsiasi data è ammessa (RB-20). La data si può anche scrivere nel campo (GG/MM/AAAA); una data che non esiste, confermata con Invio, resta nel campo con sotto «Data non valida: scrivi GG/MM/AAAA» finché non è corretta; uscendo dal campo torna quella di prima (DEC-52); senza data scelta il campo mostra in grigio quella di sistema (confermato il 29/09/2026).
- **CA-04.4** *Dato* la finestra Dettagli, *quando* scelgo la fine validità o la tolgo con «Nessuna data», *allora* si salva subito; alla scadenza non succede niente.
- **CA-04.5** *Dato* la finestra Dettagli, *allora* la cartella si vede in sola lettura («Lavoro › Clienti»); per una nota senza cartella «Non organizzata».
- **CA-04.6** *Dato* una nota, *quando* ne cambio le date o i tag, *allora* l'ultima modifica si aggiorna e la nota sale in cima all'elenco (DEC-51, RB-60).

---

## Fuori dal modulo
Codici del registro idee esclusi da questo modulo:
- ID-01 – Note in testo semplice (parcheggiata)
- ID-07 – Impaginazione e funzioni da programma di videoscrittura (rifiutata)
- ID-08 – Scrittura a mano con penna (rifiutata)
- ID-14 – Allegati diversi dalle immagini (parcheggiata)
