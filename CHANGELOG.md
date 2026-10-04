# Note di rilascio

Tutte le modifiche rilevanti per chi usa il prodotto sono elencate qui, dalla più recente.
Il formato segue [Keep a Changelog](https://keepachangelog.com/it-IT/1.1.0/).

Queste note sono scritte per gli utenti. Lo storico interno della documentazione si trova in `docs/registri/storico.md`.

## [Non rilasciato]

## [0.1.6] – 2026-10-04

### Aggiunto
- Locale: nella colonna, sotto Cartelle, le cartelle del disco che aggiungi con +; i file .md e .txt si aprono e si modificano in Memodu e si salvano con Ctrl + S (⌘ + S su Mac). Le modifiche non salvate restano anche chiudendo Memodu; se un altro programma cambia il file, Memodu te lo dice. Niente va sul server (RF-17)

## [0.1.5] – 2026-10-04

### Aggiunto
- Ctrl + W (⌘ + W su Mac) chiude anche le impostazioni e il cestino e lascia l'area di destra vuota
- Con le impostazioni o il cestino aperti, la loro riga nella colonna diventa «Chiudi impostazioni» o «Chiudi cestino»

## [0.1.4] – 2026-10-04

### Cambiato
- Quando la stessa nota o cartella cambia su due computer, vince la modifica che arriva per ultima al server, anche se l'orologio di un computer è sbagliato (RF-10)
- Una cartella rinominata in due modi prende il nome arrivato per ultimo, senza creare una cartella vuota con l'altro nome
- Una nota messa in una cartella che sull'altro computer è finita nel cestino va tra le non organizzate; la cartella resta nel cestino
- L'avviso «Il server non risponde» compare dopo un'ora senza sincronizzare, non più dopo un giorno

### Corretto
- Nella nota rapida l’hover della freccia di «Chiudi» copre tutta la sua metà del pulsante
- Il bordo ridimensionabile della sidebar non copre più il menu aperto con il tasto destro su una nota
- Sul Mac la M nella barra dei menu conserva il colore adattato dal sistema, e la M nel Dock segue l’aspetto chiaro o scuro mentre Memodu è aperto (RF-01)

## [0.1.3] – 2026-10-02

### Cambiato
- Il testo della nota occupa tutta la larghezza del foglio, invece di fermarsi a una colonna stretta a sinistra

## [0.1.2] – 2026-10-02

### Aggiunto
- Sincronizzazione su internet: con il file `credenziali` Memodu si allinea con il server pubblicato, da qualsiasi computer; se il server cambia, Memodu rimanda tutto da solo (RF-10)
- Info: un clic sul titolo della nota apre, sotto di lui, titolo, cartella, date e tag, con «Chiudi nota» ed «Elimina»; dal tasto destro su una nota della colonna si apre al centro. Prende il posto del menu ··· (RF-04)
- Ricerca avanzata: «Mostra tutti i risultati» in fondo ai risultati, o Ctrl + Maiusc + K (⌘ + Maiusc + K su Mac), apre una finestra grande con i filtri sempre aperti (RF-08)
- Ctrl + \ (⌘ + \ su Mac) fissa e sblocca la colonna, come la puntina
- Nel campo di ricerca della colonna si vede la scorciatoia Ctrl + K

### Cambiato
- Una nota arriva fino a 4 MB di testo (circa 2.000 pagine), non più 10 MB
- L'icona di Memodu nella barra delle applicazioni e nell'area di notifica è chiara con la barra scura e scura con la barra chiara
- «Sposta in…» dalla riga Cartella di Info si apre sopra Info, che resta aperta e mostra subito la cartella nuova
- La barra di scorrimento sottile c'è anche nella nota rapida, nel cestino e nelle impostazioni
- Spazi più regolari nella colonna, in Info, negli avvisi e nei menu; la cartella ha la sua icona; il filtro scelto nella ricerca ha un fondo leggero

## [0.1.1] – 2026-09-30

### Cambiato
- Gli avvisi compaiono appena sotto la fascia in alto, così non coprono il titolo della nota (RF-02)
- Il titolo della nota è in alto, al centro, insieme alle cartelle che la contengono: si modifica cliccandolo, e una cartella del percorso si apre nella colonna. Ultima modifica e tag compaiono passando con il mouse sul titolo (RF-02, RF-04, RF-05)
- Memodu tiene le note sul computer e funziona anche senza il server delle note; alla prima apertura ritrova le note scritte finora
- Nuova icona dell'app
- Per ora il testo della nota è semplice, come in un editor di testo: quello che scrivi resta com'è, senza formattazione; Tab rientra, Maiusc + Tab torna indietro. La formattazione arriverà più avanti (RF-02)
- Il testo della nota è allineato a sinistra, con spazi più discreti; la barra di scorrimento è sottile e compare solo quando scorri (RF-02)
- La finestra si può ridimensionare liberamente (RF-02)
- La colonna delle note si allarga o si stringe trascinandone il bordo destro; doppio clic per tornare alla larghezza normale (RF-05)
- Le note, le cartelle e il cestino non sono più file nella cartella Documenti\Memodu: stanno in un database nella cartella dei dati di Memodu, fuori da OneDrive e iCloud. Le note scritte finora nella cartella Documenti non vengono spostate

### Aggiunto
- Ricerca: in cima alla colonna, o con Ctrl + K (⌘ + K su Mac) da qualsiasi punto, si cercano le note per titolo, testo e tag mentre si scrive, anche con parti di parola e senza badare ad accenti e maiuscole. Si filtra per tag (anche più d'uno) e per data di creazione o di modifica, anche senza scrivere niente. Le note nel cestino compaiono segnate, e dalle impostazioni si possono escludere (RF-08)
- Le impostazioni si aprono dalla riga Impostazioni, sotto il Cestino: scorciatoia della nota rapida, avvio di Memodu all'accensione, finestra sempre in primo piano, tema chiaro, scuro o come il sistema, stato della sincronizzazione e nome del dispositivo. Ogni cambio vale subito
- Sincronizzazione: con il file delle credenziali Memodu si tiene allineato con il server da solo, anche senza rete; le modifiche fatte su due dispositivi non si perdono, al massimo nasce una «copia in conflitto» (RF-10)
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
- Su Mac i pulsanti della finestra hanno più spazio sopra e a sinistra; i comandi in alto sono allineati e «Apri la colonna» resta visibile mentre ci sposti sopra il puntatore (RF-01)
- La colonna ha lo stesso margine a sinistra e a destra anche quando la stringi (RF-05)
- La barra di scorrimento sottile compare quando scorri o muovi il mouse sulla colonna o sul foglio, sparisce sfumando e si muove con la colonna quando si apre o si chiude (RF-02, RF-05)
- Sotto la riga Cestino in fondo alla colonna non si intravedono più le note che scorrono (RF-15)
- La finestra Dettagli si chiude anche cliccando fuori (RF-04)
- Il bordo del focus compare solo quando ti muovi con la tastiera, non a ogni clic
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
