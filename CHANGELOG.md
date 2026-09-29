# Note di rilascio

Tutte le modifiche rilevanti per chi usa il prodotto sono elencate qui, dalla più recente.
Il formato segue [Keep a Changelog](https://keepachangelog.com/it-IT/1.1.0/).

Queste note sono scritte per gli utenti. Lo storico interno della documentazione si trova in `docs/registri/storico.md`.

## [Non rilasciato]

### Cambiato
- Le note, le cartelle e il cestino non sono più file nella cartella Documenti\Memodu: stanno in un database nella cartella dei dati di Memodu, fuori da OneDrive e iCloud. Le note scritte finora nella cartella Documenti non vengono spostate

### Aggiunto
- Dettagli della nota: dal menu ··· o con il tasto destro sulla nota si apre la finestra con la data di creazione, la fine validità e i tag; sotto il titolo della nota compaiono l'ultima modifica e i tag (RF-04, RF-06)
- Tag: si scrivono con i suggerimenti dei tag esistenti, anche a più livelli come «lavoro/clienti»; la ✕ toglie un tag dalla nota e «Elimina tag…» lo toglie da tutte le note (RF-06)
- Nota rapida: con Ctrl + Alt + N (Control + Option + N su Mac) compare una finestrella per annotare un'idea da qualsiasi programma; si salva da sola; Esc o il pulsante Chiudi la chiudono tenendo il testo, e dalla freccia accanto a Chiudi "Apri nel programma" la porta nella finestra principale (RF-01)
- Icona nella barra dei menu (Mac) o nell'area di notifica (Windows) per aprire una nota rapida o Memodu; chiudendo la finestra, Memodu resta attivo (RF-01)
- Scrittura in markdown formattata mentre scrivi: titoli, grassetto, corsivo, sottolineato, barrato, elenchi e checklist, con scorciatoie, strumenti sopra la selezione, menu con "/" e tasto destro (RF-02)
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
- Le note lunghe si salvano anche chiudendo la finestra subito dopo aver scritto (RF-02)
- Se il server non risponde più volte di fila, dopo Riprova si salva l'ultimo testo scritto e non uno precedente (RF-01, RF-02)
- «Esci da Memodu» e Alt + F4 sulla nota rapida salvano prima di chiudere; se il testo non si può salvare, Memodu chiede conferma (RF-01)
- Una nota rapida cancellata fino a restare vuota non lascia più una «Nota vuota» nell'elenco (RF-01)
- Scrivendo / e premendo Invio si va a capo invece di perdere il tasto (RF-02)
- Unendo cartelle con sottocartelle dallo stesso nome non restano cartelle vuote, anche ripristinando dal cestino (RF-05, RF-15)
- Dopo aver creato una cartella o usato «Sposta in…» da tastiera si resta sulla riga giusta (RF-05)

<!--
Modello per una versione rilasciata:

## [1.0.0] – aaaa-mm-gg

### Aggiunto
- Descrizione comprensibile per l'utente (RF-00)

### Modificato
- 

### Corretto
- 

### Rimosso
- 
-->
