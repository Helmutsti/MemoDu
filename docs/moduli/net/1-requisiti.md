# Brainet – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

## RF-18 – Brainet, la rete delle note
**Priorità:** Must · **Origine:** ID-39, DEC-134, DEC-145 · **Fase:** Sviluppo (fasi 1 … 8 riscritte dall'agente il 16/10/2026 e approvate da Manuel Cucca lo stesso giorno, con DEC-146) · **Stato:** In sviluppo (riscritto per DEC-145 il 16/10/2026; la versione con note proprie è uscita nella 1.0.0, spenta all'inizio, DEC-142)

Come *utente* voglio collegare quello che scrivo nelle mie note a persone, oggetti, eventi e argomenti, per ritrovare tutto quello che ho pensato su ognuno di loro nel tempo, senza dover creare e ordinare file.

Brainet non ha note sue: funziona dentro le note di CLOUD e nella colonna mostra le viste per leggerle (DEC-145, scelta di Manuel Cucca del 16/10/2026: «voglio che brainet funzioni su tutte le note cloud […] mettiamo tutto il mondo brainet nell'editor md. e poi lasciamo le visualizzazioni nella sidebar»). Prima, dal 14/10/2026, Brainet era un diario con note proprie, sul modello di Reflect o Mem (DEC-134).

### Dove si scrive
- **Nelle note di CLOUD in vista Markdown** (DEC-145). In vista Testo Brainet non c'è: `@` è un carattere normale e la selezione non apre il menu delle aree.
- **Una nota con pillole, aree o allegati resta in Markdown:** in Info la scelta «Testo» è spenta, con la riga «Questa nota usa Brainet: si vede solo in Markdown»; togliendo tutte le pillole, le aree e gli allegati torna disponibile (proposta dell'agente, approvata da Manuel Cucca il 16/10/2026).
- Proposte dell'agente: nella nota rapida Brainet non c'è, e arriva quando la nota si apre nel programma completo; nei file di Locale non c'è.

### La colonna e le Impostazioni
- Nella colonna la sezione **Brainet**, sotto CLOUD e sopra Locale, senza il +; sotto, in quest'ordine, **Entità** (icona del cervello) e **Calendario** (DEC-145; il + e il Database sono spariti il 16/10/2026, scelta di Manuel Cucca: «sparisce»).
- **Impostazioni:** un gruppo Brainet con l'interruttore «Usa Brainet»; finché è spento non si vede nient'altro, né nelle impostazioni né nella colonna. Acceso, sotto compaiono gli «Stati delle evidenziature» (scelte di Manuel Cucca del 14/10/2026; «Mostra il Database» sparito il 16/10/2026).
- **Spegnere Brainet non cancella niente** e non chiede conferma: sparisce la sezione, `@` e la selezione non aprono i menu di Brainet; pillole, aree e allegati restano nelle note e si vedono; entità e stati restano; riaccendendo torna tutto. Vale per tutti i computer dell'account (proposta dell'agente, approvata da Manuel Cucca il 16/10/2026).

### Collegamenti, aree e stati
- **Come nasce un collegamento:** scrivendo `@` si apre il menu dei suggerimenti e funziona come i destinatari di Gmail: si filtra scrivendo, si sceglie un'entità che esiste o se ne crea una nuova, e diventa una pillola (scelta di Manuel Cucca del 14/10/2026). Il menu ha un titolo sopra ogni sezione: Persone, Argomenti, Eventi, Oggetti, Senza tipo; «Crea «…»» e «Allega un file…» in fondo; frecce e Invio per scegliere, Esc per chiudere, Backspace subito dopo una pillola la toglie tutta.
- **Un'entità nuova:** «Crea «…»» fa nascere subito la pillola, senza tipo; il tipo si assegna dopo in Entità (scelte di Manuel Cucca del 14 e 15/10/2026).
- **I collegamenti** sono pillole con i colori di informazione del design system e il nome; con la foto dell'entità, se c'è, tonda a sinistra (Manuel Cucca, 14/10/2026). Proposta dell'agente: un clic su una pillola apre la pagina della sua entità.
- **Aree:** parti del testo evidenziate, come con un evidenziatore, e associate a una o più entità e a uno o più stati. Si creano selezionando la frase e scegliendo dal menu, che ha in cima la sezione «Stati» con il pallino del colore (scelte di Manuel Cucca del 14/10/2026).
  - le entità nominate con una pillola non hanno un'area: compaiono nella nota come citazione; un'area che contiene una pillola prende da sola anche l'entità citata;
  - gli stati non sono entità: un elenco breve, nelle Impostazioni, ognuno con uno dei quattro colori di stato del design system (avviso, informazione, successo, errore);
  - passando sopra un'area compaiono il riquadro e la linguetta con il pallino del primo stato e i nomi separati da «·»; la freccia apre lo stesso menu con le voci già scelte spuntate; togliendo tutte le voci l'area sparisce e la frase torna testo normale (idea e scelte di Manuel Cucca del 14/10/2026).
- **Togliere uno stato:** Memodu propone di cambiarlo con un altro; se lo togli sparisce da tutte le aree, e un'area sparisce solo se era il suo ultimo legame (scelte di Manuel Cucca del 14/10/2026).

### Le entità
- **Entità** nella colonna: l'elenco di persone, oggetti, eventi, argomenti e di quelle senza tipo, con quante volte sono nominate (citazioni e aree), l'ultima volta e il tipo. Contano solo le note di CLOUD fuori dal Cestino (proposta dell'agente).
- **Il tipo** si cambia con un clic sulla pillola del tipo della riga: Persona, Argomento, Evento, Oggetto e, dopo una linea, «Senza tipo», con la spunta sul tipo attuale (scelte di Manuel Cucca del 15/10/2026).
- **Unire due entità:** tasto destro su una riga › «Unisci a…»: scegli l'altra entità; resta il nome dell'entità scelta e le citazioni e le aree passano a lei, anche nel testo delle note (scelta di Manuel Cucca del 14/10/2026).
- **La foto:** tasto destro › «Scegli una foto…», un'immagine dal disco.

### La pagina dell'entità
La prima vista per leggere la knowledge base (proposta dell'agente del 16/10/2026, accettata da Manuel Cucca: «andiamo avanti fino allo sviluppo»): risponde a «ritrovare tutto quello che ho pensato su ognuno di loro» e fa vedere come il pensiero su una cosa cambia giorno dopo giorno. Proposte dell'agente con i mockup:
- si apre con un clic su una riga di Entità, o su una pillola in una nota;
- in cima la foto, il nome, la pillola del tipo e «Nominata N volte · l'ultima il …»;
- sotto, i **passaggi**: ogni paragrafo di una nota di CLOUD che cita l'entità con una pillola o la lega con un'area, con la pillola o l'area evidenziata e i pallini degli stati dell'area;
- i passaggi sono raggruppati per giorno, dal più recente; il giorno è quello di creazione della nota, come nel Calendario; sopra ogni passaggio il titolo della nota (o le prime parole) e l'ora;
- i passaggi si leggono soltanto; un clic su un passaggio apre la nota, con il cursore su quel paragrafo;
- per tornare all'elenco, «Entità» in cima alla pagina o Esc;
- un'entità che nessuna nota nomina più: «Nessuna nota parla ancora di «…».».

### Il Calendario
I mesi con **un pallino solo per ogni giorno** in cui è stata creata almeno una nota di CLOUD con una pillola o un'area, non uno per nota (scelta di Manuel Cucca del 16/10/2026); conta il giorno di creazione. Oggi è evidenziato, i giorni dopo tenui, le frecce cambiano mese; un clic su un giorno per ora non fa niente (proposte dell'agente, approvate).

### Allegati
In vista Markdown si allega solo con gli allegati di Brainet, che prendono il posto di RF-03 (DEC-145, scelta di Manuel Cucca: «va bene»). Deduzione dell'agente, confermata da Manuel Cucca il 16/10/2026: si allega anche con Brainet spento, trascinando o incollando il file, perché è l'unico modo di allegare; «Allega un file…» sta nel menu di `@`, quindi solo con Brainet acceso.
- Si allega in tre modi: trascinando il file nel testo, incollandolo (Ctrl + V) e da @ › «Allega un file…» (scelte di Manuel Cucca del 15/10/2026).
- Fino a 25 MB, solo JPG, PNG, PDF, Word, Excel, PowerPoint e testo; un file diverso non entra e un avviso dice perché. I file viaggiano a parte rispetto alle note, cifrati come loro.
- Un documento si mostra come la pillola di una persona, con l'icona del tipo di file e il nome. Una foto dentro un paragrafo scritto è una bolla; su una riga sua arriva piccola e si ingrandisce con «Dimensioni» › Piccola, Media, Grande.
- Un clic su un allegato apre il menu: «Apri» (con il programma del computer), «Mostra nella cartella», «Dimensioni» (solo per le foto fuori dal paragrafo) e «Togli». Il file sparisce dal server e dagli altri computer quando nessuna nota lo usa più, anche nel Cestino.
- Un allegato si scarica sul computer la prima volta che serve; senza rete una foto non ancora scaricata mostra un riquadro vuoto con il nome.

### Ricerca, sincronizzazione, esportazione
- **Ricerca:** la ricerca della colonna legge tutte le note, anche quelle con pillole e aree, e trova il nome della pillola come testo; per ora nessun filtro per entità (proposta dell'agente, approvata da Manuel Cucca il 16/10/2026).
- **Sincronizzazione:** le note con pillole, aree e allegati si sincronizzano come le altre note; entità, stati e allegati si sincronizzano e si cifrano come le note, con lo stesso account (RF-10).
- **Esportazione** (RF-13): la pillola diventa `[[nome]]`, l'area `==frase==` (gli stati si perdono), la foto `![nome](allegati/nome)` e il documento `[nome](allegati/nome)`, con i file nella cartella `allegati` accanto alla nota (proposta dell'agente, approvata da Manuel Cucca il 16/10/2026).

### Il passaggio dalla 1.0.0
- All'aggiornamento ogni nota Brainet diventa una nota di CLOUD in vista Markdown, senza titolo e fuori dalle cartelle, con pillole, aree e allegati, con le date in cui era stata scritta; quelle nel Cestino di Brainet vanno nel Cestino di CLOUD; entità e stati restano (scelta di Manuel Cucca del 16/10/2026: «migra tutto su md»; dove vanno quelle senza cartella e quelle nel Cestino è proposta dell'agente).
- Una nota Brainet che arriva da un computer ancora con la 1.0.0 fa lo stesso passaggio appena arriva (proposta dell'agente).

### Scenario d'uso
Scritto dall'agente il 16/10/2026 per DEC-145, approvato da Manuel Cucca lo stesso giorno.

Nelle Impostazioni accendo «Usa Brainet», e nella colonna compare la sezione Brainet tra CLOUD e LOCALE, con Entità e Calendario. Dopo una telefonata creo una nota in CLOUD con Ctrl + N, come sempre. Scrivo «Chiamata con @lu», dal menu scelgo Luca Bianchi e il nome diventa una pillola. Continuo: «il preventivo della serra arriva venerdì». Seleziono la frase e, dal menu che compare, scelgo lo stato «Importante» e l'oggetto Serra: la frase resta evidenziata. Trascino nella nota il PDF del preventivo e compare la sua pillola. Una settimana dopo, in un'altra nota, scrivo che il preventivo è arrivato e la lego di nuovo a Serra. Apro Entità, faccio clic su Serra e vedo i due passaggi, uno sotto l'altro con il loro giorno: com'era la cosa una settimana fa e com'è oggi. Faccio clic sul primo e si apre la nota della telefonata. La sera, nel Calendario, i due giorni hanno il loro pallino. Cercando «serra» con Ctrl + K trovo tutte e due le note.

### Punti aperti
- Altri modi di leggere la knowledge base, dopo la pagina dell'entità: la rete dei collegamenti, un giorno del Calendario, le aree per stato (Manuel Cucca, 14/10/2026: «da studiare»).

### Criteri di accettazione
Riscritti dall'agente il 16/10/2026 per DEC-145 (Fase 8), approvati da Manuel Cucca lo stesso giorno. Restano con il loro codice i criteri della 1.0.0 che valgono ancora, con il contesto aggiornato (una nota di CLOUD in vista Markdown al posto del foglio Brainet); quelli tolti sono segnati; i nuovi partono da CA-18.32.

- **CA-18.1** Tolto (DEC-145): sostituito da CA-18.32.
- **CA-18.2** Tolto (DEC-145): il + accanto a Brainet non c'è più.
- **CA-18.3** *Dato* una nota di CLOUD in vista Markdown e Brainet acceso, *quando* scrivo @ e qualche lettera, *allora* si apre il menu con le entità che corrispondono, divise per tipo con il titolo sopra e «Crea «…»» in fondo; frecce e Invio scelgono, Esc chiude; scelta un'entità, le lettere diventano la sua pillola, con la foto se c'è (RB-104).
- **CA-18.4** *Dato* il menu di @ con un nome che non c'è, *quando* premo «Crea «…»», *allora* nasce l'entità senza tipo, la pillola entra nel testo e continuo a scrivere senza altre finestre (RB-105).
- **CA-18.5** *Dato* il cursore subito dopo una pillola, in un paragrafo, in un titolo o in una voce di elenco, *quando* premo Backspace, *allora* la pillola sparisce tutta; le frecce la saltano come un carattere solo; Canc subito prima la toglie tutta (RB-104, DEC-146).
- **CA-18.6** *Dato* una frase selezionata in una nota in vista Markdown, *quando* scelgo dal menu uno o più stati ed entità, *allora* la frase resta evidenziata e legata a tutte le voci scelte; se la frase contiene una pillola, l'area è legata anche a quell'entità (RB-107).
- **CA-18.7** *Dato* un'area, *quando* ci passo sopra con il mouse, *allora* compaiono il riquadro e la linguetta con il pallino del primo stato e i nomi separati da «·»; la freccia apre il menu con le voci dell'area spuntate; togliendo una spunta il legame sparisce, togliendo l'ultima sparisce l'area (RB-109).
- **CA-18.8** *Dato* una nota con pillole e aree, *quando* aggiungo o cancello parole prima e dentro, anche con il grassetto e i titoli, *allora* pillole e aree restano sulle stesse parole, anche dopo averla chiusa e riaperta e sull'altro computer.
- **CA-18.9** Tolto (DEC-145): il Database non c'è più; una nota con Brainet si modifica e si elimina come le altre note.
- **CA-18.10** Tolto (DEC-145): «Mostra il Database» non c'è più.
- **CA-18.11** *Dato* Entità, *allora* vedo tutte le entità con quante volte sono nominate nelle note di CLOUD fuori dal Cestino, l'ultima volta e il tipo («Senza tipo» se non ce l'ha); le citazioni e le aree contano tutte e due (RB-127).
- **CA-18.12** *Dato* due entità, *quando* faccio tasto destro › Unisci a… e ne scelgo un'altra, *allora* la conferma dice quante citazioni e aree si spostano; con «Unisci» resta solo l'entità scelta, con il suo nome, e tutte le pillole e le aree dell'altra mostrano lei; con «Annulla» non cambia niente (RB-108).
- **CA-18.13** *Dato* un'entità, *quando* faccio tasto destro › Scegli una foto… e scelgo un'immagine, *allora* la foto compare nelle sue pillole e nella sua riga, anche sull'altro computer; un file che non è un'immagine dà un messaggio e non cambia niente.
- **CA-18.14** Tolto (DEC-145): sostituito da CA-18.33.
- **CA-18.15** *Dato* l'elenco degli stati, *quando* aggiungo uno stato con nome e colore, *allora* compare nel menu dell'area; un nome già usato è rifiutato; *quando* tolgo uno stato usato, *allora* Memodu propone di cambiarlo con un altro; se lo tolgo, sparisce da tutte le aree delle note, anche nel Cestino, e un'area sparisce solo se era il suo ultimo legame (RB-110).
- **CA-18.16** *Dato* due computer con lo stesso account, *quando* scrivo una pillola, unisco, cambio una foto o uno stato su uno, *allora* entro 30 s l'altro ha tutto uguale; sul server le note, le entità e gli stati sono cifrati (RF-10).
- **CA-18.17** *Dato* la stessa nota con Brainet cambiata su due computer senza rete, *quando* torna la rete, *allora* una versione resta e l'altra va in una copia in conflitto con le sue pillole e aree, come per le note (DEC-06).
- **CA-18.18** Tolto (DEC-145): sostituito da CA-18.34.
- **CA-18.19** Tolto (DEC-145): sostituito da CA-18.35.
- **CA-18.20** Tolto (DEC-145): «Importa in Brainet» non c'è più.
- **CA-18.21** Tolto (DEC-145): sostituito da CA-18.36.
- **CA-18.22** *Dato* una nota in vista Markdown, *quando* trascino un PDF nel testo, lo incollo con Ctrl + V o lo scelgo con @ › «Allega un file…», *allora* nel punto giusto compare la pillola con l'icona del tipo e il nome del file (RB-114, RB-116).
- **CA-18.23** *Dato* un file di 26 MB, o un file .zip, *quando* lo allego, *allora* non entra e un avviso dice perché; il testo non cambia (RB-115).
- **CA-18.24** *Dato* una foto, *quando* la metto dentro una frase, *allora* è una bolla alta come la riga; *quando* la metto su una riga vuota, *allora* arriva piccola su una riga sua (RB-117).
- **CA-18.25** *Dato* una foto fuori dal paragrafo, *quando* la clicco e scelgo Dimensioni › Media o Grande, *allora* cambia grandezza e la spunta segue la scelta; il menu di una bolla e di un documento non ha Dimensioni (RB-119, RB-120).
- **CA-18.26** *Dato* un allegato, *quando* lo clicco e scelgo «Apri», *allora* si apre con il programma del computer; con «Mostra nella cartella» si apre Esplora file o il Finder sul file (RB-119).
- **CA-18.27** *Dato* un allegato in una nota, *quando* scelgo «Togli», *allora* sparisce dalla nota; Ctrl + Z lo rimette; quando nessuna nota, nemmeno nel Cestino, lo usa più, il file sparisce dal computer, dal server e dagli altri computer (RB-121).
- **CA-18.28** *Dato* due computer con lo stesso account, *quando* allego una foto e un PDF su uno, *allora* sull'altro le pillole e la foto compaiono dopo la sincronizzazione, e il file si scarica la prima volta che serve; sul server il file è cifrato (RB-118).
- **CA-18.29** *Dato* un computer senza rete, *quando* apro una nota con una foto non ancora scaricata, *allora* vedo il riquadro con il nome; tornata la rete, la foto compare da sola; «Apri» senza rete dice che manca la rete (RB-118).
- **CA-18.30** *Dato* un file di 25 MB, *quando* lo allego e intanto scrivo e sincronizzo altre note, *allora* le note arrivano sull'altro computer senza aspettare il file; un caricamento interrotto riparte da solo (RB-118).
- **CA-18.31** *Dato* un'entità «Senza tipo» in Entità, *quando* clicco la sua pillola del tipo, *allora* si apre l'elenco Persona, Argomento, Evento, Oggetto, «Senza tipo» con la spunta su «Senza tipo»; *quando* scelgo Persona, *allora* la riga mostra «Persona», nel menu di @ sta tra le Persone e sull'altro computer è uguale; scegliendo «Senza tipo» torna senza tipo (RB-122).
- **CA-18.32** *Dato* «Usa Brainet» spento, *quando* apro Memodu, *allora* nella colonna non c'è la sezione Brainet e nelle Impostazioni il gruppo Brainet ha solo l'interruttore; *quando* lo accendo, *allora* la sezione compare tra CLOUD e LOCALE, senza +, con Entità e Calendario, e nelle Impostazioni compaiono gli stati delle evidenziature, senza «Mostra il Database» (RB-106).
- **CA-18.33** *Dato* il Calendario e due note con pillole create oggi e una nota senza pillole né aree creata ieri, *allora* oggi ha un pallino solo e ieri nessuno; una nota con pillole messa nel Cestino non conta; oggi è evidenziato, i giorni dopo tenui, le frecce cambiano mese, un clic su un giorno non fa niente (RB-113, RB-127).
- **CA-18.34** *Dato* un computer con la 1.0.0 e uno aggiornato con lo stesso account, *quando* sul primo scrivo una nota Brainet, *allora* sul secondo arriva come nota di CLOUD in vista Markdown, senza titolo, nel giorno in cui è stata scritta, con pillole e aree; il primo continua a sincronizzare senza errori (RB-125, SF-33).
- **CA-18.35** *Dato* Brainet acceso e una nota con pillole, aree e un allegato, *quando* spengo «Usa Brainet», *allora* non compare nessuna conferma, la sezione sparisce, nella nota pillole, aree e allegato si vedono ancora e @ e la selezione non aprono menu; sull'altro computer succede lo stesso; *quando* lo riaccendo, *allora* ritrovo entità e stati com'erano (RB-111).
- **CA-18.36** *Dato* una nota con la pillola «Luca Bianchi» e l'area «il preventivo della serra», *quando* cerco «luca» o «preventivo» con Ctrl + K, *allora* la ricerca trova la nota; *quando* cerco «cita» o un pezzo di un codice, *allora* non la trova per i segni (RB-126).
- **CA-18.37** *Dato* una nota con una pillola, *quando* apro Info, *allora* il segmento «Testo» è spento e sotto la riga Vista c'è «Questa nota usa Brainet: si vede solo in Markdown»; *quando* tolgo la pillola, *allora* il segmento torna disponibile; una nota senza segni passa a Testo come prima (RB-123).
- **CA-18.38** *Dato* una nota in vista Testo, *quando* scrivo @ o seleziono una frase, *allora* non si apre nessun menu di Brainet e @ resta un carattere (RB-123).
- **CA-18.39** *Dato* l'entità Serra citata in due note create in giorni diversi e legata a un'area in una terza, *quando* faccio clic su Serra in Entità, *allora* si apre la sua pagina con la testata (nome, tipo, «Nominata 3 volte · l'ultima il …») e i tre passaggi raggruppati per giorno dal più recente, ognuno con il titolo della nota (o le prime parole) e l'ora, la pillola o l'area evidenziata e i pallini degli stati; due pillole nello stesso paragrafo danno un passaggio solo (RB-124).
- **CA-18.40** *Dato* la pagina di un'entità, *quando* faccio clic su un passaggio, *allora* si apre la nota con il cursore all'inizio di quel paragrafo; *quando* premo «Entità» o Esc, *allora* torno all'elenco (RB-124).
- **CA-18.41** *Dato* un'entità che nessuna nota fuori dal Cestino nomina, *quando* apro la sua pagina, *allora* vedo «Mai nominata», «Nessuna nota parla ancora di «…».» e «Scrivi @ in una nota per citarla.» (RB-127).
- **CA-18.42** *Dato* una pillola in una nota, *quando* ci faccio clic, *allora* si apre la pagina della sua entità.
- **CA-18.43** *Dato* una copia di lavoro della 1.0.0 con tre note Brainet, una nel Cestino, con pillole, aree e un allegato, *quando* apro la versione nuova, *allora* in CLOUD ci sono due note nuove senza titolo in vista Markdown, con le date delle note Brainet, pillole, aree e allegato, e la terza è nel Cestino di CLOUD; entità e stati sono quelli di prima; sull'altro computer arrivano le stesse note, una volta sola (RB-125).

---

## Fuori dal modulo
Codici del registro idee esclusi da questo modulo:
- 
