# Guida per gli utenti

<!-- Fase 9 della guida. Si scrive con il linguaggio di chi usa il prodotto. Gli scenari d'uso della Fase 1 sono un buon punto di partenza per i capitoli. -->

Questa guida descrive Memodu 0.1.13. Memodu serve a scrivere note al volo, tenerle in ordine e ritrovarle su tutti i tuoi computer. Le note sono testo semplice: i caratteri come `#` o `**` restano come li scrivi.

Su Mac, dove la guida dice Ctrl si usa ⌘ (per esempio ⌘ + N al posto di Ctrl + N). Fa eccezione la scorciatoia della nota rapida, che sul Mac è Control + Option + N.

Come si installa il server, si crea l'utente e si rimedia ai guasti è scritto nel [runbook](runbook.md).

## Primi passi

### Installare Memodu
Scarica l'installatore dalla pagina delle versioni di Memodu su GitHub («Memodu vX.Y.Z»):

- **Windows:** `Memodu_X.Y.Z_x64-setup.exe`. Gli installatori non sono firmati, perciò Windows mostra un avviso: scegli «Ulteriori informazioni» e poi «Esegui comunque».
- **Mac con processore Apple:** `Memodu_X.Y.Z_aarch64.dmg`. Trascina Memodu in Applicazioni. La prima volta il Mac la blocca: tasto destro su Memodu › Apri › Apri. Per i Mac con processore Intel non c'è una versione.

**Aggiornare.** Memodu non si aggiorna da sola. Chiudila con «Esci da Memodu» dal menu della sua icona (in basso a destra su Windows, nella barra dei menu sul Mac), poi installa la versione nuova sopra quella vecchia. Note, cartelle di Locale e accesso restano dove sono.

### Il primo avvio
Memodu si apre subito e puoi già scrivere: le note stanno su questo computer anche senza accesso. Per averle su tutti i tuoi computer accedi con l'email e la password della tua installazione (vedi [Lavorare su più computer](#lavorare-su-più-computer)).

Memodu resta attiva anche quando chiudi la finestra: la trovi nell'icona in basso a destra su Windows o nella barra dei menu sul Mac. Il menu dell'icona ha «Nuova nota rapida», «Apri Memodu» ed «Esci da Memodu». Su Windows un clic sull'icona apre Memodu, il tasto destro apre il menu.

### Com'è fatta la finestra
- **La colonna** a sinistra: in cima il campo «Cerca nelle note», poi le sezioni **CLOUD** (le tue note e cartelle) e **LOCALE** (file del disco), in fondo «Cestino» e «Impostazioni».
- **Il foglio** al centro: la nota aperta. Senza note aperte vedi «Nessuna nota aperta» e il pulsante «Nuova nota».
- **Il percorso** in alto: le cartelle in cui sta la nota e il suo titolo. Un clic su una cartella la mostra nella colonna, un clic sul titolo apre Info.

La colonna può stare fissa o comparire solo quando serve. Ctrl + \ la fissa e la sblocca. Quando non è fissata porta il mouse vicino al bordo sinistro e premi «Apri la colonna»; un clic sul foglio la richiude. Per allargarla trascina il suo bordo destro; un doppio clic sul bordo la riporta alla larghezza di partenza.

## Scrivere al volo: la nota rapida
Premi **Ctrl + Alt + N** da qualsiasi programma (Control + Option + N sul Mac): compare una piccola finestra, sempre in primo piano, con il cursore pronto. Puoi aprirla anche dal menu dell'icona, con «Nuova nota rapida».

- Scrivi. Il testo si salva da solo dopo un paio di secondi di pausa.
- **Per finire** premi «Chiudi», oppure Maiusc + Invio o Esc: la nota viene salvata e la finestra si chiude. Esc non butta via niente.
- **Per continuare nel programma** premi la freccia accanto a «Chiudi» e scegli «Apri nel programma». La nota rapida si apre nella finestra di Memodu; la nota che avevi aperta lì viene salvata e messa da parte.
- Se premi di nuovo la scorciatoia, la nota rapida aperta si salva e ne compare un'altra, un po' spostata.
- Una nota rapida chiusa senza testo non lascia niente dietro di sé.

Le note rapide finiscono in CLOUD, fuori dalle cartelle, pronte da sistemare. La scorciatoia si cambia nelle [Impostazioni](#impostazioni).

## Scrivere una nota

### Creare una nota
- **Ctrl + N**, oppure il **+** accanto a CLOUD › «Nuova nota», oppure il pulsante «Nuova nota» sul foglio vuoto: la nota nasce in CLOUD, fuori dalle cartelle.
- Tasto destro su una cartella › «Nuova nota qui»: la nota nasce in quella cartella.

La nota si apre con il cursore nel testo. Funzionano annulla (Ctrl + Z) e ripeti, Tab e Maiusc + Tab per i rientri. Il testo incollato entra come testo semplice.

### Il salvataggio
Non c'è un pulsante Salva: la nota si salva da sola dopo un paio di secondi di pausa e ogni volta che cambi nota, la chiudi o passi a un altro programma.

### Il titolo
Il titolo si scrive in Info: un clic sul titolo nel percorso, in alto, apre Info con il campo del titolo in cima. Invio lo conferma e ti riporta a scrivere.

Una nota senza titolo si legge «Senza titolo» nel percorso e con le sue prime parole nella colonna. Una nota senza titolo e senza testo si legge «Nota vuota».

### Chiudere una nota
Ctrl + W, oppure «Chiudi nota» in Info. La nota è già salvata.

Una nota lasciata vuota sparisce da sola quando la lasci: non finisce nemmeno nel cestino.

### Info: i dettagli della nota
Info si apre in due modi:

- con un clic sul titolo nel percorso: compare sotto il titolo e si chiude con Esc, con un clic fuori o con un nuovo clic sul titolo;
- con il tasto destro su una nota nella colonna › «Info»: compare al centro della finestra e si chiude con Esc o con la ✕.

Dall'alto in basso, Info contiene:

- il **titolo**;
- la **cartella** in cui sta la nota («Non organizzata» se è fuori dalle cartelle): un clic apre «Sposta in»;
- la **data di creazione**: puoi cambiarla, e «Ripristina» la riporta alla data vera;
- la **data di fine validità**: è solo un promemoria, alla scadenza non succede nulla;
- i **tag** (vedi [Tag](#tag));
- la **data dell'ultima modifica**;
- **«Chiudi nota»** ed **«Elimina»**, che manda la nota nel cestino.

Per cambiare una data fai clic sulla riga: scrivi la data come GG/MM/AAAA oppure sceglila dal calendario, che ha anche «Oggi» e «Nessuna data». Svuotando il campo e premendo Invio la data si toglie.

## Organizzare le note

### CLOUD: cartelle e note non organizzate
In CLOUD trovi prima le note fuori dalle cartelle (le **non organizzate**), dalla più recente, poi le cartelle. Dentro una cartella ci sono prima le note, poi le sottocartelle, in ordine alfabetico. Accanto a ogni cartella c'è il numero di note che contiene, sottocartelle comprese.

- **Nuova cartella:** + accanto a CLOUD › «Nuova cartella», oppure tasto destro su una cartella › «Nuova sottocartella». Scrivi il nome e premi Invio; Esc annulla.
- **Rinominare:** tasto destro › «Rinomina», oppure F2.
- Se il nome c'è già, Memodu ti chiede se **aggiungere un numero** al nome, **unire** le due cartelle o annullare.

### Spostare
- **Trascinando:** prendi una nota o una cartella e lasciala su un'altra cartella, oppure sul titolo CLOUD per portarla fuori dalle cartelle. Esc annulla il trascinamento.
- **Con «Sposta in»:** tasto destro su una nota › «Sposta in…», oppure un clic sulla cartella in Info. Scrivi per trovare la cartella, poi un clic o Invio. «CLOUD» porta la nota fuori dalle cartelle.

### Il tasto destro
- Su una nota: «Info», «Sposta in…», «Elimina».
- Su una cartella: «Nuova nota qui», «Nuova sottocartella», «Rinomina», «Elimina».

Nella colonna ti muovi anche con la tastiera: frecce su e giù per passare da una riga all'altra, destra e sinistra per aprire e chiudere le cartelle, Invio per aprire una nota.

### Tag
I tag raggruppano le note a prescindere dalla cartella. Si gestiscono in Info:

- **Aggiungere:** «+ Tag», scrivi e scegli un tag esistente oppure «Crea il tag «…»».
- **Togliere da una nota:** la ✕ sul tag.
- **Eliminare un tag da tutte le note:** mentre aggiungi un tag, tasto destro sul suggerimento › «Elimina tag…». Vengono eliminati anche i suoi sotto-tag.

I tag possono avere livelli, separati da `/`: per esempio `lavoro/clienti`. Maiuscole e minuscole non contano.

## Cercare
Premi **Ctrl + K** o fai clic su «Cerca nelle note» in cima alla colonna. Si apre una card con i filtri; scrivendo, i risultati compaiono subito, senza premere Invio.

- Memodu cerca nel titolo, nel testo e nei tag. Trova anche pezzi di parola («lascio» trova «rilascio»); maiuscole e accenti non contano. Con più parole, la nota deve contenerle tutte.
- Prima vengono le note con la parola nel titolo o nei tag, poi le altre.
- **Filtri:** «Tag» (puoi sceglierne più di uno: la nota deve averli tutti), «Creazione» e «Modifica» (oggi, ultimi 7 giorni, ultimi 30 giorni, quest'anno, oppure un giorno scelto dal calendario). Puoi filtrare anche senza scrivere niente.
- **Aprire un risultato:** un clic, oppure freccia giù e Invio. La nota che avevi aperta viene salvata.
- **Esc** chiude la ricerca e la svuota.

**Ricerca avanzata.** «Mostra tutti i risultati» in fondo alla card, oppure **Ctrl + Maiusc + K**, apre una finestra grande con i filtri sempre visibili. Si chiude con Esc o con la ✕.

**Note nel cestino.** Le note del cestino compaiono tra i risultati attenuate, con l'etichetta «nel cestino». Cliccandole puoi ripristinarle. Se non le vuoi vedere, spegni «Mostra le note del cestino nei risultati» nelle [Impostazioni](#impostazioni).

## Il cestino
**Eliminare.** Una nota si elimina con «Elimina» in Info o dal tasto destro; una cartella dal tasto destro, con tutto quello che contiene. Puoi anche trascinarle in fondo alla colonna, su «Trascina qui per eliminare». Memodu non chiede conferma, perché dal cestino si torna indietro.

**Ripristinare.** Apri «Cestino» in fondo alla colonna e premi «Ripristina» accanto all'elemento:

- una nota torna in CLOUD, fuori dalle cartelle;
- una cartella torna al primo livello, con tutto il suo contenuto. Se esiste già una cartella con lo stesso nome, scegli se aggiungere un numero o unirle.

Da lì puoi rimettere la nota o la cartella dove stava.

**Eliminare per sempre.** L'icona del cestino accanto a un elemento lo elimina per sempre; «Svuota cestino» elimina tutto. In tutti e due i casi Memodu chiede conferma. Memodu non svuota mai il cestino da sola.

Il cestino si chiude con «Chiudi cestino» o Ctrl + W.

## Lavorare su più computer
Con l'accesso, le note di CLOUD si sincronizzano tra tutti i computer su cui usi Memodu. Viaggiano e restano sul server **cifrate**: solo i tuoi computer possono leggerle.

### Accedere
Apri «Impostazioni» e, nel riquadro in cima, premi «Accedi». Scrivi l'email e la password della tua installazione e premi «Accedi». Al primo accesso su un computer arrivano tutte le note.

- L'accesso vale 30 giorni e Memodu lo rinnova da sola: se il computer si collega almeno una volta al mese non devi più accedere.
- «Non voglio usare il cloud» chiude la finestra e lascia le note solo su questo computer.
- **Esci**, nel riquadro dell'account, scollega il computer. Prima prova a mandare le ultime modifiche; le note restano comunque sul computer.

Conserva la **chiave di recupero** che hai ricevuto quando è stato creato l'utente: serve a scegliere una password nuova senza perdere le note. Se perdi sia la password sia la chiave, le note sul server non si recuperano più.

### Quando si sincronizza
Da sola: all'avvio, pochi secondi dopo ogni modifica e ogni 30 secondi. Non devi fare niente.

Senza connessione lavori come sempre: le modifiche restano sul computer e partono quando il server torna raggiungibile.

Lo stato si legge nel riquadro dell'account, nelle Impostazioni:

| Pallino | Testo | Cosa vuol dire |
|---|---|---|
| Verde | «Sincronizzata · oggi alle 14:32» | Tutto a posto |
| Grigio | «In attesa della prima sincronizzazione» | Hai appena fatto l'accesso |
| Ambra | «Server non raggiungibile: ultimo backup 14:32» | Niente rete o server fermo: le modifiche aspettano sul computer |
| Ambra | «Non riuscita: riprovo da sola» | Qualcosa non è andato; Memodu riprova |
| Rosso | «Accedi di nuovo per sincronizzare» | L'accesso è scaduto: premi «Accedi» |
| Rosso | «Memodu e il server hanno versioni diverse» | Aggiorna Memodu |

### Copie in conflitto
Se modifichi la stessa nota su due computer prima che si sincronizzino, Memodu non butta via niente: accanto alla nota nasce una seconda nota con lo stesso titolo seguito da «(copia in conflitto)». Un avviso te lo dice e con «Apri l'altra» ti porta alla copia. Tieni nell'originale quello che ti serve e manda la copia nel cestino.

### Cosa resta su un solo computer
- Locale: le cartelle aggiunte e i file.
- Il tema, «Avvia Memodu all'accensione», «Tieni Memodu in primo piano» e il nome del dispositivo.
- La colonna fissata e la sua larghezza.

Si sincronizzano invece la scorciatoia della nota rapida (una per Windows e una per Mac) e la scelta sulle note del cestino nella ricerca.

## I file del disco: Locale
Locale ti fa leggere e scrivere i file `.md` e `.txt` di una cartella del disco, per esempio gli appunti che usi anche con altri programmi. Questi file **non vanno sul server** e non hanno tag, ricerca né cestino di Memodu.

**Aggiungere una cartella.** Premi il + accanto a LOCALE e scegli la cartella, oppure trascina cartelle e file dentro la finestra di Memodu da Esplora file o dal Finder. Gli altri tipi di file restano fuori, e un avviso te lo dice.

**Lavorare sui file.** Con il tasto destro:

- su una cartella aggiunta: «Nuovo file», «Nuova cartella», «Togli da Locale»;
- su una sottocartella: «Nuovo file», «Nuova cartella», «Rinomina», «Elimina»;
- su un file: «Rinomina», «Elimina».

F2 rinomina; per spostare un file lo trascini su un'altra cartella di Locale. Tutto avviene davvero sul disco.

- **Eliminare** manda il file nel Cestino del sistema. Su un disco senza Cestino (una chiavetta, un disco di rete) Memodu chiede conferma, perché il file non si potrà recuperare.
- **«Togli da Locale»** toglie la cartella dall'elenco; sul disco non cambia niente.

**Salvare.** Qui il salvataggio è a mano: **Ctrl + S**. Finché non salvi, accanto al nome compare un pallino. Le modifiche non salvate non si perdono se cambi file o chiudi Memodu, ma il file sul disco resta quello di prima.

Un **file nuovo** si chiama «Senza titolo» e nasce sul disco al primo Ctrl + S, con il nome preso dalla prima riga.

**Il nome del file nel percorso** apre una scheda con il nome (puoi cambiarlo), «Chiudi file» (anche Ctrl + W) e, per un file aggiunto da solo, «Togli da Locale».

**Se il file cambia fuori da Memodu.** Se un altro programma cambia il file aperto, Memodu te lo dice: «Ricarica» mostra la versione del disco, «Tieni la mia versione» la sovrascrive al prossimo Ctrl + S. Se il file è sparito, «Ricrealo» lo fa rinascere al prossimo Ctrl + S.

## Impostazioni
Si aprono dalla riga «Impostazioni» in fondo alla colonna e si chiudono con «Chiudi impostazioni» o Ctrl + W. Ogni modifica vale subito.

- **Riquadro dell'account**, in cima: accesso, stato della sincronizzazione, «Esci» e il **nome del dispositivo**, che serve a riconoscere il computer.
- **Generale:**
  - **Scorciatoia della nota rapida:** fai clic sul campo e premi la combinazione nuova (almeno due tasti tra Ctrl, Alt, Maiusc e Win, più una lettera, una cifra, un tasto F o Spazio; sul Mac Control, Option, Maiusc e Command). «Ripristina» torna a quella di partenza.
  - **Avvia Memodu all'accensione:** Memodu parte da sola e la nota rapida è subito pronta.
  - **Tieni Memodu in primo piano:** la finestra resta sopra gli altri programmi.
  - **Tema:** «Sistema», «Chiaro» o «Scuro».
- **Ricerca:** «Mostra le note del cestino nei risultati».

## Scorciatoie da tastiera
| Tasti | Dove | Cosa fa |
|---|---|---|
| Ctrl + Alt + N | Ovunque | Nuova nota rapida (si può cambiare) |
| Esc, Maiusc + Invio | Nota rapida | Salva e chiude |
| Ctrl + N | Memodu | Nuova nota |
| Ctrl + W | Memodu | Chiude la nota, il file, il cestino o le impostazioni |
| Ctrl + K | Memodu | Cerca |
| Ctrl + Maiusc + K | Memodu | Ricerca avanzata |
| Ctrl + \ | Memodu | Fissa o sblocca la colonna |
| Ctrl + S | File di Locale | Salva il file |
| F2 | Colonna | Rinomina la cartella o il file selezionato |
| Frecce, Invio | Colonna | Si muove tra le righe, apre e chiude le cartelle, apre la nota |
| Esc | Finestre, menu, trascinamento | Chiude o annulla |

Su Mac, Ctrl diventa ⌘; la nota rapida è Control + Option + N.

## Domande frequenti

**Windows non mi fa installare Memodu.**
Gli installatori di Memodu non sono firmati, perciò Windows li segnala. Nell'avviso scegli «Ulteriori informazioni» e poi «Esegui comunque». Sul Mac: tasto destro su Memodu › Apri › Apri.

**Ho chiuso la finestra: Memodu è ancora aperta?**
Sì, resta attiva nell'icona in basso a destra (barra dei menu sul Mac), così la nota rapida è sempre pronta. Per chiuderla davvero usa «Esci da Memodu» dal menu dell'icona.

**Dove trovo la nota che ho scritto con la nota rapida?**
In CLOUD, fuori dalle cartelle, in cima: le note non organizzate sono in ordine dalla più recente.

**Scrivo `**grassetto**` ma non diventa grassetto.**
In questa versione le note sono testo semplice: la formattazione arriverà più avanti.

**Ho eliminato per sbaglio una nota o una cartella.**
È nel cestino: aprilo dal fondo della colonna e premi «Ripristina». La ritrovi anche cercandola, con l'etichetta «nel cestino».

**Compare «Data non valida: scrivi GG/MM/AAAA».**
La data scritta non esiste (per esempio 31/02). Scrivila come giorno/mese/anno, oppure sceglila dal calendario.

**Compare «Email o password non corrette.»**
Controlla le maiuscole e che l'email sia quella della tua installazione. Se hai dimenticato la password serve la chiave di recupero: chiedi a chi gestisce il server.

**Compare «Non riesco a raggiungere il server. Riprova tra poco.»**
Il computer non è collegato a internet o il server non risponde. Puoi continuare a scrivere: le note restano sul computer e accedi più tardi.

**Compare «Accedi di nuovo per sincronizzare».**
Il computer non si collegava da più di un mese, oppure è cambiata la password. Premi «Accedi» e rientra; intanto puoi scrivere come sempre, niente va perso.

**Compare «Il server non risponde da più di un'ora».**
Da un'ora le modifiche non arrivano al server. Restano al sicuro sul computer e partono da sole quando il server torna; l'avviso sparisce da solo. Se dura a lungo, avvisa chi gestisce il server.

**Compare «Memodu e il server hanno versioni diverse».**
Il server è stato aggiornato e Memodu no: installa l'ultima versione (vedi [Installare Memodu](#installare-memodu)).

**È comparsa una nota «(copia in conflitto)».**
Hai modificato la stessa nota su due computer prima che si sincronizzassero. Ci sono tutte e due le versioni: tieni quello che ti serve nell'originale e manda la copia nel cestino.

**Compare «Memodu non riesce a collegarsi».**
Memodu non riesce a scrivere le note sul computer, oppure la nota aperta è troppo grande (il limite è di 4 MB, circa 2.000 pagine). Premi «Riprova»; se la nota è molto lunga, dividila in più note. Se il messaggio resta, avvisa chi gestisce l'installazione.

**Un file di Locale non si apre: «Questo file è troppo grande per Memodu».**
Memodu apre file fino a 10 MB. Aprilo con un altro programma.

**Non riesco a modificare un file di Locale.**
Se compare «Questo file è in sola lettura», il file è protetto sul disco: togli la protezione dalle proprietà del file. Se compare «Non riesco a salvare…», il motivo è scritto nel messaggio (disco pieno, permessi, file aperto da un altro programma); le modifiche restano in sospeso finché non salvi.

**Ho trascinato un file dentro Memodu ma non è entrato.**
Locale prende solo cartelle e file `.md` e `.txt`; gli altri restano fuori.

**Le mie cartelle di Locale non compaiono sull'altro computer.**
È voluto: Locale lavora sul disco di questo computer e non va sul server.

**Non riesco a cambiare la scorciatoia della nota rapida: «Già usata da un altro programma».**
Un altro programma usa già quella combinazione: scegline un'altra.
