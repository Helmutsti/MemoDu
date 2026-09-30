# Note di rilascio

Tutte le modifiche rilevanti per chi usa il prodotto sono elencate qui, dalla più recente.
Il formato segue [Keep a Changelog](https://keepachangelog.com/it-IT/1.1.0/).

Queste note sono scritte per gli utenti. Lo storico interno della documentazione si trova in `docs/registri/storico.md`.

## [Non rilasciato]

### Cambiato
- Il titolo della nota è in alto, al centro, insieme alle cartelle che la contengono: si modifica cliccandolo, e una cartella del percorso si apre nella colonna. Ultima modifica e tag compaiono passando con il mouse sul titolo (RF-02, RF-04, RF-05)
- Memodu tiene le note sul computer e funziona anche senza il server delle note; alla prima apertura ritrova le note scritte finora
- Nuova icona dell'app
- Per ora il testo della nota è semplice, come in un editor di testo: quello che scrivi resta com'è, senza formattazione; Tab rientra, Maiusc + Tab torna indietro. La formattazione arriverà più avanti (RF-02)
- Il testo della nota è allineato a sinistra, con spazi più discreti; la barra di scorrimento è sottile e compare solo quando scorri (RF-02)
- La finestra si può ridimensionare liberamente (RF-02)
- La colonna delle note si allarga o si stringe trascinandone il bordo destro; doppio clic per tornare alla larghezza normale (RF-05)
- Le note, le cartelle e il cestino non sono più file nella cartella Documenti\Memodu: stanno in un database nella cartella dei dati di Memodu, fuori da OneDrive e iCloud. Le note scritte finora nella cartella Documenti non vengono spostate

### Aggiunto
- Ctrl + N (⌘ + N su Mac) crea una nuova nota nella finestra principale (RF-02)
- «Chiudi nota» nel menu ··· della nota, o Ctrl + W (⌘ + W su Mac): la nota si salva e la finestra resta senza nota aperta (RF-02)
- Cliccando in un punto vuoto della nota, sotto o accanto al testo, il cursore va nel testo più vicino (RF-01, RF-02)
- Nota rapida: Maiusc + Invio la salva e la chiude; accanto a Chiudi si vede la scorciatoia (RF-01)
- Dettagli della nota: dal menu ··· o con il tasto destro sulla nota si apre la finestra con la data di creazione, la fine validità e i tag; sotto il titolo della nota compaiono l'ultima modifica e i tag (RF-04, RF-06)
- Tag: si scrivono con i suggerimenti dei tag esistenti, anche a più livelli come «lavoro/clienti»; la ✕ toglie un tag dalla nota e «Elimina tag…» lo toglie da tutte le note (RF-06)
- Nota rapida: con Ctrl + Alt + N (Control + Option + N su Mac) compare una finestrella per annotare un'idea da qualsiasi programma; si salva da sola; Esc o il pulsante Chiudi la chiudono tenendo il testo, e dalla freccia accanto a Chiudi "Apri nel programma" la porta nella finestra principale (RF-01)
- Icona nella barra dei menu (Mac) o nell'area di notifica (Windows) per aprire una nota rapida o Memodu; chiudendo la finestra, Memodu resta attivo (RF-01)
- Salvataggio automatico dopo 2 secondi di pausa, senza pulsante Salva (RF-02)
- Elenco delle note con le più recenti in cima e pulsante + per crearne una nuova (RF-02)
- Cartelle: crea, rinomina e sposta le cartelle, e trascina le note non organizzate nella cartella giusta; le cartelle e le note al loro interno sono in ordine alfabetico, con il numero di note accanto (RF-05)
- «Sposta in…» dal menu ··· della nota, con la ricerca delle cartelle: la nota resta aperta (RF-05); lo stesso menu c'è anche con il tasto destro sulle note della colonna
- Una nota lasciata senza titolo né testo sparisce da sola quando passi a un'altra (RB-10)
- Cestino: le note e le cartelle eliminate restano nel cestino finché non lo svuoti; si possono ripristinare o eliminare per sempre, sempre dopo una conferma (RF-15)
- Se il server delle note non risponde, Memodu lo dice e tiene il testo finché non riesce a salvarlo (RF-01, RF-02)

### Modificato
- 

### Corretto
- Su Windows il clic sull'icona nell'area di notifica apre Memodu; il menu compare con il tasto destro (RF-01)
- L'icona nell'area di notifica è bianca con la barra delle applicazioni scura e nera con quella chiara (RF-01)
- Trascinando una nota o una cartella la pillola non ha più gli angoli neri (RF-05)
- Le note lunghe si salvano anche chiudendo la finestra subito dopo aver scritto (RF-02)
- Se il server non risponde più volte di fila, dopo Riprova si salva l'ultimo testo scritto e non uno precedente (RF-01, RF-02)
- «Esci da Memodu» e Alt + F4 sulla nota rapida salvano prima di chiudere; se il testo non si può salvare, Memodu chiede conferma (RF-01)
- Una nota rapida cancellata fino a restare vuota non lascia più una «Nota vuota» nell'elenco (RF-01)
- Unendo cartelle con sottocartelle dallo stesso nome non restano cartelle vuote, anche ripristinando dal cestino (RF-05, RF-15)
- Dopo aver creato una cartella o usato «Sposta in…» da tastiera si resta sulla riga giusta (RF-05)
- Chiudendo una nota rapida, la nota compare subito nella colonna della finestra principale (RF-01)

<!--
Modello per una versione rilasciata:

## [1.0.0] – aaaa-mm-gg

### Aggiunto
- «Chiudi nota» nel menu ··· della nota: la nota si salva e la finestra resta senza nota aperta (RF-02)
- Descrizione comprensibile per l'utente (RF-00)

### Modificato
- 

### Corretto
- 

### Rimosso
- 
-->
