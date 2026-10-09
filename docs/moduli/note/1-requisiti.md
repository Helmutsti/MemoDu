# Note – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

La scrittura viene prima di tutto: aprire l'app e iniziare a scrivere deve essere immediato (`RNF-01`).

## RF-01 – Nota rapida da scorciatoia
**Priorità:** Must · **Origine:** — · **Fase:** 9 · **Stato:** Implementato (rilasciato fino alla 0.1.13, 07/10/2026)

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
La scorciatoia predefinita è Ctrl + Alt + N su Windows e Control + Option + N su macOS; si cambia nelle impostazioni, «Scorciatoia della nota rapida» (SC-06, DEC-91).

- **CA-01.1** *Dato* Memodu in background, *quando* premo la scorciatoia da un altro programma, *allora* entro 0,2 s compare SC-02 con il cursore nell'area di scrittura (RNF-01).
- **CA-01.2** *Dato* una nota rapida con del testo, *quando* la chiudo con Chiudi, con Maiusc + Invio o con il tasto Esc, *allora* la finestra si chiude e la nota compare in cima all'elenco del programma, nella radice (RB-01, RB-02, RB-60).
- **CA-01.3** *Dato* una nota rapida vuota, *quando* la chiudo, *allora* non nasce nessuna nota (RB-03, SF-16).
- **CA-01.4** *Dato* una nota rapida aperta, *quando* premo di nuovo la scorciatoia, *allora* la prima viene salvata e resta aperta, e ne compare un'altra spostata di 32 px a destra e in basso (RB-04, SF-01, SF-04).
- **CA-01.5** *Dato* una nota rapida con del testo e un'altra nota aperta nel programma, *quando* dalla freccia di Chiudi scelgo Apri nel programma, *allora* la nota del programma viene salvata e chiusa e al suo posto si apre la nota rapida (RB-05).
- **CA-01.6** *Dato* Memodu in background, *quando* uso l'icona nell'area di notifica (Windows) o nella barra dei menu (macOS), *allora* posso aprire la nota rapida o il programma. Su Windows il clic sinistro apre il programma e il destro il menu (DEC-72); l'icona è nera con la barra chiara e bianca con quella scura (DEC-73).
- **CA-01.7** *Dato* la copia di lavoro che non si scrive, *quando* la nota rapida prova a salvare, *allora* compare SC-07 con «Memodu non riesce a salvare le note su questo computer. Premi Riprova; se non basta, controlla lo spazio sul disco.»; sistemato il disco, Riprova salva la nota con tutto il testo (RB-61, SF-30, DEC-127).
- **CA-01.8** *Dato* del testo non salvato perché la copia di lavoro non si scrive, *quando* chiudo la finestra, *allora* compare la conferma «La nota non è salvata»; Annulla lascia la finestra aperta con il testo, Chiudi comunque la chiude (RB-62, DEC-127).

---

## RF-02 – Scrittura in markdown con formattazione minima
**Priorità:** Must · **Origine:** — · **Fase:** 1 per la bollicina del formato (DEC-131) · **Stato:** In progettazione; la vista Testo o Markdown (DEC-130) è Pronta per il rilascio con la 1.1.0; il testo puro, che diventa la vista Testo, è Implementato (rilasciato fino alla 0.1.13, 07/10/2026)

**Nella v1 (DEC-125):** testo puro; la formattazione resta sospesa con DEC-64 e si riprende dopo la v1.

Come *utente* voglio scrivere note in markdown con una formattazione minima per prendere appunti strutturati e produrre documenti formattati.

Formattazioni previste:
- corsivo;
- grassetto;
- sottolineato;
- barrato;
- titoli e sottotitoli;
- elenchi puntati, numerati e checklist.

Ogni nota si vede come Testo o come Markdown (DEC-130). In vista Markdown la nota si vede formattata mentre si scrive: i simboli markdown non si vedono, nemmeno dove c'è il cursore (DEC-58), e il testo resta markdown. La formattazione si applica scrivendo i simboli, con le scorciatoie da tastiera o con la bollicina del formato, che mostra il formato dove sta il cursore e si apre come un cassetto (DEC-131). Il menu del tasto destro resta sospeso (DEC-64).

Ogni modifica si salva da sola, senza pulsante Salva (RB-06). Il testo incollato da fuori entra come testo semplice (RB-07).

**Collegamenti:** FL-02 · FL-09 · EN-01 · SC-00

### Scenario d'uso
Scrivo una nota in Markdown: guardando la bollicina in basso a destra so se sono in un titolo o in un grassetto; con un clic la apro e trasformo la riga in una lista di caselle, oppure accendo il grassetto dal cassetto, scrivo, e lo spengo con un altro clic. Le immagini hanno il loro scenario in RF-03.

### Criteri di accettazione
Frammento Must A: senza immagini (RF-03) e senza metadati (RF-04).

- **CA-02.1** *Dato* il programma aperto, *quando* scelgo Nuova nota dal + di CLOUD, premo Ctrl + N o il pulsante Nuova nota, *allora* nasce una nota vuota in cima all'elenco, aperta con il cursore nel corpo; se la lascio vuota, sparisce (FL-09, RB-10, RB-60, DEC-39).
- **CA-02.2** *Dato* una nota in vista Markdown, *quando* scrivo la sintassi Markdown (`#`, `##`, `**`, `*`, `~~`, `-`, `1.`, `- [ ]`), *allora* il testo si formatta subito e i simboli spariscono appena riconosciuti, anche sulla riga in cui scrivo; la nota salvata contiene il Markdown con i suoi simboli (RF-02, DEC-58, DEC-130).
- **CA-02.3** (Rinviato da Manuel Cucca il 09/10/2026, DEC-131: per ora la bollicina si usa con il mouse.) *Dato* una nota in vista Markdown, *quando* premo Ctrl + B, Ctrl + I, Ctrl + U o Ctrl + Maiusc + S (⌘ su macOS), *allora* il testo diventa grassetto, corsivo, sottolineato o barrato, o lo smette se lo era già, come con un clic nel cassetto (CA-02.21); *quando* premo Ctrl + 1 o Ctrl + 2, *allora* la riga diventa titolo o sottotitolo, o torna testo normale se lo era già. Il sottolineato si salva come `<u>…</u>`; Ctrl + S resta «salva» e Ctrl + 3 non fa niente. Non ci sono altre scorciatoie di formattazione (DEC-131).
- **CA-02.4** *Dato* una nota in vista Markdown, *allora* in basso a destra del foglio c'è la bollicina del formato, che mostra il formato della riga e quelli del carattere dove sta il cursore (`H1 B`, `T B I`, `• S`; `T` sul testo normale) e si aggiorna mentre il cursore si muove; *dato* una selezione che mescola formati diversi, mostra solo quelli che valgono per tutta la selezione, con un trattino al posto del formato della riga se le righe sono diverse. In vista Testo la bollicina non c'è (CMP-10, DEC-131).
- **CA-02.5** (Rinviato da Manuel Cucca il 09/10/2026, DEC-131: per ora la bollicina si usa con il mouse.) *Dato* il cursore nel testo di una nota in vista Markdown, *quando* premo Alt + F10 (Option + F10), *allora* il cassetto della bollicina si apre con il focus sulla prima voce; le frecce passano da una voce all'altra, Invio o spazio la scelgono ed Esc torna al testo, con il cursore dove era (CMP-10, RNF-04, DEC-131).
- **CA-02.6** *(Sospeso con DEC-64; non ripreso da DEC-131: il tasto destro apre il menu del sistema.)* *Dato* del testo, *quando* uso il tasto destro, *allora* compare il menu con Taglia, Copia, Incolla, la formattazione con le scorciatoie, Titolo › ed Elenco › (RF-11).
- **CA-02.7** *Dato* una modifica, *quando* passano 2 s senza scrivere, o cambio nota, o chiudo, o la finestra perde il focus, *allora* la nota si salva senza messaggi e sale in cima all'elenco (RB-06, RB-60).
- **CA-02.8** *Dato* testo copiato da Word, dal web o da un'email, *quando* lo incollo, *allora* entra come testo semplice (RB-07, SF-06).
- **CA-02.9** *Dato* uno script o dell'HTML attivo nel testo, *quando* la nota si mostra, *allora* il codice non viene eseguito: si vede come testo o viene rimosso (RB-08, SF-36).
- **CA-02.10** *Dato* una nota senza titolo, *allora* nell'elenco compaiono le prime parole del testo; senza titolo né testo compare «Nota vuota» in grigio chiaro (RB-15).
- **CA-02.11** *Dato* una nota aperta, *quando* premo Ctrl + Z (⌘ + Z), *allora* si annulla l'ultima modifica, qualunque sia (RB-59).
- **CA-02.12** *Dato* un'interruzione improvvisa (crash o spegnimento), *quando* riapro la nota, *allora* trovo l'ultimo salvataggio e i dati non sono rovinati (RB-06, SF-10, SF-32).
- **CA-02.13** *Dato* un errore di salvataggio della copia di lavoro, *allora* valgono SC-07, il testo in memoria e la conferma alla chiusura, come in CA-01.7 e CA-01.8 (RB-61, RB-62, DEC-127).
- **CA-02.14** *Dato* una nota aperta, *quando* apro la comparsa Info dal titolo e scelgo Testo o Markdown nella riga Vista, *allora* il testo si mostra subito nella vista scelta senza che cambi il testo salvato; la scelta resta alla nota riaprendola e sugli altri computer. Le note nuove nascono in Markdown, quelle scritte prima della 1.1.0 restano in Testo; la nota rapida mostra la nota nella sua vista, senza la scelta (DEC-130).
- **CA-02.15** *Dato* una nota in vista Markdown, *quando* muovo il cursore con le frecce o il clic o seleziono, *allora* il cursore si ferma solo tra caratteri visibili e salta i simboli nascosti, come in Word (DEC-130).
- **CA-02.16** *Dato* il cursore in fondo a un pezzo formattato (per esempio una parola in grassetto), *quando* scrivo, *allora* il testo nuovo prende la stessa formattazione; *dato* il cursore subito prima del pezzo, il testo nuovo resta normale. *Quando* cancello tutte le lettere del pezzo, spariscono anche i suoi simboli; se ne cancello solo una parte, il resto resta formattato (DEC-130).
- **CA-02.17** *Dato* il cursore in fondo a un titolo, *quando* premo Invio, *allora* la riga nuova è testo normale; *dato* il cursore in una voce d'elenco (`-`, `1.`, `- [ ]`), *quando* premo Invio, *allora* nasce una voce nuova con lo stesso segno (il numero successivo per gli elenchi numerati), e su una voce vuota l'elenco finisce e la riga torna normale (DEC-130).
- **CA-02.18** *Dato* il cursore all'inizio del testo di una voce d'elenco, *quando* premo Backspace, *allora* il segno dell'elenco sparisce e il testo resta; *dato* il cursore all'inizio di un titolo, *quando* premo Backspace, *allora* la riga si unisce a quella sopra come testo normale (DEC-130).
- **CA-02.19** *Dato* del testo formattato selezionato, *quando* lo copio, *allora* negli appunti finisce il Markdown con i suoi simboli; incollare in Memodu segue CA-02.8 (DEC-130).
- **CA-02.20** *Dato* una voce della checklist in vista Markdown, *quando* clicco la casella, *allora* si spunta o si toglie la spunta, come in Word; nel testo salvato `[ ]` diventa `[x]` e viceversa, e Annulla la ripristina (DEC-130).
- **CA-02.21** *Dato* la bollicina, *quando* ci clicco, *allora* si apre come un cassetto con i formati di riga (testo normale, titolo, sottotitolo, elenco puntato, elenco numerato, casella), i formati di carattere (grassetto, corsivo, barrato, sottolineato) e «Rimuovi formattazione», con evidenziati quelli in uso; *quando* scelgo una voce, *allora* il formato si applica subito, la bollicina si aggiorna e il cassetto resta aperto; si chiude quando riprendo a scrivere, con Esc, con un clic nel testo o fuori, o con un altro clic sulla bollicina. Il cursore e la selezione restano dove erano (DEC-131).
- **CA-02.22** *Dato* del testo selezionato, *quando* scelgo un formato di carattere, *allora* vale per tutta la selezione; uno di riga vale per tutte le righe toccate. *Dato* il cursore dentro una parola senza selezione, un formato di carattere vale per quella parola; *dato* il cursore tra due parole o in fondo alla riga, il formato si accende per il testo che scrivo da lì, e scegliendolo di nuovo si spegne e torno a scrivere normale; un formato di riga vale per la riga del cursore (DEC-131).
- **CA-02.23** *Dato* del testo formattato, *quando* scelgo «Rimuovi formattazione», *allora* sparisce tutto quello che la bollicina mostra: con una selezione, il testo selezionato perde grassetto, corsivo, barrato e sottolineato e le righe toccate tornano testo normale; senza selezione, la parola sotto il cursore perde i formati di carattere e la riga torna testo normale. La bollicina mostra `T` (DEC-131).
- **CA-02.24** *Dato* l'inizio di una riga in vista Markdown, *quando* scrivo `-[]`, *allora* la riga diventa una casella da spuntare e nel testo salvato c'è `- [ ] `; `- ` e `1. ` fanno gli elenchi come in CA-02.2 (DEC-131).
- **CA-02.25** *Dato* una nota rapida o un file `.md` di Locale, *allora* c'è la stessa bollicina con lo stesso cassetto: nella nota rapida a sinistra nella fascia delle azioni, con il cassetto che si apre verso destra; nel file in basso a destra, come nelle note. I file `.txt` non l'hanno (DEC-131).

---

## RF-03 – Immagini nelle note
**Priorità:** Must · **Origine:** — · **Fase:** 6 · **Stato:** In progettazione

**Fuori dalla v1 (DEC-125):** si riprende dopo la v1, dalla Fase 6.

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
Scrivo la nota e inserisco un'immagine trascinandola nel testo, oppure premendo il pulsante degli allegati. Sull'immagine inserita posso poi aprire delle impostazioni, in stile Word. (Scenario spostato qui da RF-02 il 08/10/2026, DEC-125.)

### Criteri di accettazione
- [Da compilare]

---

## RF-04 – Metadati della nota
**Priorità:** Must · **Origine:** — · **Fase:** 9 · **Stato:** Implementato (nella finestra Info, DEC-96) (rilasciato fino alla 0.1.13, 07/10/2026)

Come *utente* voglio associare dei metadati a ogni nota per descriverla con titolo, date e tag.

| Metadato | Chi lo imposta | Note |
|---|---|---|
| Titolo | Utente | Si modifica nel campo del titolo di Info (DEC-96). Può mancare: nelle liste si mostrano allora le prime parole del testo (RB-15). Può ripetersi (RB-16) |
| Data di creazione di sistema | Sistema | Non modificabile. Si vede in Info, nel suggerimento della riga della creazione (DEC-97) |
| Data di creazione scelta dall'utente | Utente | È la data di creazione mostrata; se l'utente non la imposta, si mostra quella di sistema |
| Data di ultima modifica | Sistema | |
| Tag | Utente | Gli stessi tag di `RF-06` |
| Data di fine validità | Utente | Solo informativa: alla scadenza non succede nulla |

**Collegamenti:** FL-04 · EN-01 · EN-04 · SC-00 · RF-06

### Scenario d'uso
Scrivo la nota. Le note non ancora organizzate compaiono in cima alla sezione CLOUD della colonna e da lì le trascino nell'albero delle cartelle. Quando apro una nota, con un clic sul titolo nel percorso apro Info: lì scrivo il titolo, aggiungo tag, la sposto in un'altra cartella e cambio le date. (Aggiornato il 08/10/2026 a DEC-96 e DEC-119.)

### Criteri di accettazione
Frammento Must C (DEC-44), ridisegnato con DEC-96: titolo, date, tag e cartella in Info (CMP-24), che si apre con un clic sul titolo del percorso o dal tasto destro sulla nota. Criteri approvati da Manuel Cucca il 29/09/2026; CA-04.1, CA-04.2, CA-04.5, CA-04.7 e CA-04.8 riscritti dall'agente il 01/10/2026 per DEC-96 e approvati da Manuel Cucca lo stesso giorno; CA-04.1, CA-04.3 e CA-04.5 riscritti dall'agente il 01/10/2026 per DEC-97 e approvati da Manuel Cucca lo stesso giorno.

- **CA-04.1** *Dato* Info aperta, *allora* sotto le righe c'è «Modificata …» in sola lettura e nella riga dei tag i tag della nota e «+ Tag»; senza tag solo «+ Tag» (DEC-97). Una modifica di oggi si scrive «oggi alle 11:42», una più vecchia «il 12/09/2026 alle 10:14». Passando sul titolo non compare niente (DEC-96).
- **CA-04.2** *Dato* una nota aperta, *quando* clicco il suo titolo nel percorso, *allora* sotto il titolo si apre Info, senza velo, con il cursore nel campo del titolo; un clic fuori o Esc la chiudono e il cursore torna nel testo. *Dato* una nota nella colonna, anche non aperta, *quando* scelgo «Info» dal tasto destro, *allora* Info si apre al centro con il velo, con «Info» e la ✕ in testa e senza «Chiudi nota»; Esc, ✕ o un clic sul velo la chiudono e il focus torna sulla riga (DEC-96, DEC-81).
- **CA-04.3** *Dato* Info, *quando* clicco la riga «Creata il …», *allora* al suo posto c'è il campo con la data selezionata e sotto il calendario; scelta o scritta una data (GG/MM/AAAA) con Invio, si salva subito, la riga mostra la data scelta e a destra «Ripristina», che torna alla data di sistema; la data di sistema, che non cambia, resta nel suggerimento della riga, «Data di sistema: … alle …» (RB-21); qualsiasi data è ammessa (RB-20). Una data che non esiste, confermata con Invio, resta nel campo con sotto «Data non valida: scrivi GG/MM/AAAA» finché non è corretta; uscendo dal campo la riga torna com'era (DEC-52); senza data scelta la riga mostra quella di sistema (DEC-97).
- **CA-04.4** *Dato* Info, *quando* scelgo la fine validità o la tolgo con «Nessuna data», *allora* si salva subito; alla scadenza non succede niente.
- **CA-04.5** *Dato* Info, *allora* la riga della cartella mostra il percorso («Lavoro › Clienti»; per una nota senza cartella «Non organizzata») e un clic su di lei apre il pannello Sposta in (CMP-11, CA-05.4, DEC-97).
- **CA-04.6** *Dato* una nota, *quando* ne cambio le date o i tag, *allora* l'ultima modifica si aggiorna e la nota sale in cima all'elenco (DEC-51, RB-60).
- **CA-04.7** *Dato* Info, *quando* cambio il titolo nel campo, *allora* il titolo nel percorso e nella colonna cambia subito, senza Salva; svuotato il campo, il percorso mostra «Senza titolo» e la colonna le prime parole del testo (RB-15, DEC-96).
- **CA-04.8** *Dato* Info aperta dal titolo, *quando* scelgo «Chiudi nota» (o premo Ctrl + W, ⌘ + W su macOS), *allora* la nota si salva e l'area mostra «Nessuna nota aperta» (DEC-68, DEC-70); *quando* scelgo «Elimina», *allora* la nota va nel cestino come in CA-15.1. Dal tasto destro Info ha solo «Elimina» (DEC-96).

---

## Fuori dal modulo
Codici del registro idee esclusi da questo modulo:
- ID-01 – Note in testo semplice (parcheggiata)
- ID-07 – Impaginazione e funzioni da programma di videoscrittura (rifiutata)
- ID-08 – Scrittura a mano con penna (rifiutata)
- ID-14 – Allegati diversi dalle immagini (parcheggiata)
