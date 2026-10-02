# Organizzazione – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

L'organizzazione è un effetto secondario della scrittura: l'utente ha piena libertà su come organizzare le proprie note.

## RF-05 – Struttura di cartelle
**Priorità:** Must · **Origine:** ID-15 · **Fase:** 9 (frammento Must B; RB-29 con la ricerca) · **Stato:** Pronto

Come *utente* voglio organizzare le note in un albero di cartelle per dare loro una collocazione fisica.

- Ogni nota sta in una sola cartella; per appartenere a più gruppi si usano i tag (RF-06).
- Una nota può anche stare fuori da qualsiasi cartella, nella radice. Le note nella radice sono le "note non organizzate": compaiono nella barra laterale e ne escono appena vengono spostate in una cartella, anche se non hanno tag.
- Accanto a ogni cartella e alla sezione Non organizzate si vede quante note contiene (RB-56, ID-15).

**Collegamenti:** FL-05 · FL-09 · EN-01 · EN-03 · SC-00

### Scenario d'uso
Condiviso con RF-04 e RF-06: Scrivo la nota. Le note non ancora organizzate compaiono in una barra laterale e da lì le trascino nell'albero delle cartelle. Quando apro una nota, dal menu in alto a destra posso aggiungere tag, spostarla in un'altra cartella o modificarne i metadati. Il titolo è l'unico metadato che modifico direttamente nella schermata di scrittura.

### Criteri di accettazione
Frammento Must B «Smistare» (DEC-36): cartelle come sottocartelle di Documenti/Memodu; dal frammento Must D stanno nel database (DEC-48). I tag arrivano con il loro requisito (RF-06); il menu `···` non c'è più (DEC-96).

- **CA-05.1** *Dato* l'albero con cartelle, sottocartelle e note, *quando* apro una cartella, *allora* compaiono prima le sottocartelle e poi le sue note, ognuna in ordine alfabetico senza distinguere maiuscole e minuscole, con il titolo delle note allineato al nome delle sottocartelle (RB-64, RB-65, CMP-14).
- **CA-05.2** *Dato* l'albero, *allora* accanto a ogni cartella e alle Non organizzate c'è il numero di note contenute, sottocartelle comprese e senza quelle nel cestino, e si aggiorna subito dopo ogni spostamento o eliminazione (RB-56).
- **CA-05.3** *Dato* una nota non organizzata, *quando* la trascino su una cartella, *allora* durante il trascinamento la cartella si evidenzia, al rilascio la nota esce dalle non organizzate e compare nella cartella, e nel database la nota è nella cartella (FL-05, DEC-36, DEC-48).
- **CA-05.4** *Dato* una nota aperta, *quando* scelgo «Sposta in…» in Info (o dal tasto destro sulla nota) e poi una cartella o «Non organizzate», *allora* la nota si sposta, resta aperta, e nella colonna la cartella di destinazione si apre con la nota selezionata; nel pannello la cartella attuale ha la spunta e scrivendo nel campo l'albero si filtra (RB-66, CMP-11).
- **CA-05.5** *Dato* l'albero, *quando* premo il + delle Cartelle o «Nuova sottocartella» dal tasto destro su una cartella, *allora* compare al suo posto in ordine alfabetico il campo con «Nuova cartella» selezionato (con un numero se esiste già); Invio crea la cartella con il nome scritto, Esc la annulla e non nasce niente (RB-48).
- **CA-05.6** *Dato* una cartella, *quando* scelgo «Rinomina» dal tasto destro o premo F2 e confermo con Invio, *allora* la cartella cambia nome in Memodu e nel database; Esc riporta il nome di prima; i caratteri vietati (`< > : " / \ | ? *`) diventano `-` senza avvisi (RB-48, RB-63).
- **CA-05.7** *Dato* un nome che nella destinazione esiste già, anche con maiuscole diverse, *quando* creo, rinomino o sposto una cartella, *allora* compare la finestra «Esiste già «‹nome›» in ‹cartella›» con Annulla (nessuna modifica), Unisci (il contenuto si unisce e per ogni sottocartella omonima la finestra ricompare) e Aggiungi un numero («‹nome› (2)») (RB-23, RB-31, SF-19).
- **CA-05.8** *Dato* una cartella, *quando* la trascino dentro sé stessa o dentro una sua sottocartella, *allora* la destinazione non si evidenzia e al rilascio non cambia niente (RB-24, SF-18).
- **CA-05.9** *Dato* una cartella, *quando* scelgo «Nuova nota qui» dal tasto destro, *allora* nasce una nota vuota in quella cartella, aperta con il cursore nel corpo; il + delle Non organizzate invece crea sempre nella radice (RB-09).
- **CA-05.10** *Dato* una cartella o una nota che non c'è più (per esempio eliminata da un'altra finestra di Memodu; confermato da Manuel Cucca il 29/09/2026, DEC-45), *quando* provo a spostarla, rinominarla o eliminarla, *allora* compare l'avviso «Non è stato possibile completare l'operazione. La colonna mostra com'è adesso.» e la colonna si ricarica (SF-32, DEC-37).
- **CA-05.11** *Dato* il solo uso della tastiera, *allora* nella colonna le frecce su e giù passano da una riga all'altra, destra e sinistra aprono e chiudono le cartelle, Invio apre la nota e F2 rinomina la cartella in focus; chiuso il campo nome, con Invio o con Esc, il focus torna sulla riga della cartella; se con Esc una cartella nuova non nasce, torna da dove si era partiti: la cartella madre («Nuova sottocartella») o il + delle Cartelle; un lettore di schermo annuncia la colonna come albero, con livello e stato aperta o chiusa (CMP-06, CMP-14, RNF-04).
- **CA-05.12** *Dato* nessuna cartella, *allora* sotto il titolo Cartelle compare «Nessuna cartella. Creane una con +» (SF-16).

---

## RF-06 – Tag
**Priorità:** Must · **Origine:** — · **Fase:** 9 (frammento Must C; trovare le note per tag con la ricerca, RF-08) · **Stato:** Pronto

Come *utente* voglio assegnare tag alle note per raggrupparle in modo trasversale alle cartelle.

- I tag sono gerarchici e i livelli si separano con `/` (es. `lavoro/clienti/rossi`) (RB-18).
- Un tag nasce scrivendolo, con i tag esistenti come suggerimento (RB-17).
- Maiuscole e minuscole non contano; spazi, accenti ed emoji sono ammessi (RB-22).
- Eliminare un tag lo toglie dalle note che lo usano, senza toccare altro, dopo una conferma (RB-19).
- Cercando un tag si trovano anche le note con i suoi sotto-tag (RF-08).

**Collegamenti:** FL-04 · EN-04 · SC-00 · RF-04 · RF-08

### Scenario d'uso
Condiviso con RF-04 e RF-05: vedi lo scenario di RF-05.

### Criteri di accettazione
Frammento Must C (DEC-41, DEC-44): i tag si modificano in Info (DEC-96); trovare le note per tag arriva con la ricerca (RF-08). Criteri approvati da Manuel Cucca il 29/09/2026; CA-06.1 e CA-06.6 riscritti dall'agente il 01/10/2026 per DEC-97 e approvati da Manuel Cucca lo stesso giorno.

- **CA-06.1** *Dato* Info, *quando* premo «+ Tag» e scrivo nel campo «Aggiungi un tag», *allora* sopra Info compaiono i tag esistenti che contengono il testo e «Crea il tag «…»» se non esiste; con Invio o un clic il tag si assegna e compare in Info (RB-17).
- **CA-06.2** *Dato* il tag «lavoro», *quando* scrivo «Lavoro/Clienti», *allora* si usa «lavoro» e sotto nasce «Clienti» (RB-18, RB-22).
- **CA-06.3** *Dato* un tag della nota, *quando* premo la sua ✕, *allora* il tag esce dalla nota e resta tra i suggerimenti (RB-49).
- **CA-06.4** *Dato* un tag tra i suggerimenti, *quando* scelgo «Elimina tag…» dal tasto destro, *allora* compare «Eliminare il tag «…»?» con il numero di note; confermando il tag e i suoi sotto-tag spariscono da tutte le note, Annulla non cambia niente (RB-19). Con una sola nota: «Lo usa 1 nota: resterà intatta, solo senza questo tag.»; con nessuna: «Nessuna nota lo usa.»; sempre seguiti da «Vengono eliminati anche i suoi sotto-tag.» (confermato il 29/09/2026).
- **CA-06.5** *Dato* il campo dei tag, *allora* spazi, accenti ed emoji sono ammessi, i `/` all'inizio, alla fine o doppi si correggono da soli e un nome vuoto non crea niente (RB-22).
- **CA-06.6** *Dato* il solo uso della tastiera, *allora* Tab raggiunge i tag e Canc o Backspace toglie quello in focus (CMP-05) e il focus passa al campo, se è aperto, o a «+ Tag» (DEC-97); nel campo le frecce scorrono i suggerimenti, Invio sceglie, Esc chiude prima i suggerimenti e poi Info.

---

## RF-15 – Cestino
**Priorità:** Must · **Origine:** — · **Fase:** 9 (frammento Must B; RB-29 con la ricerca) · **Stato:** Pronto

Come *utente* voglio che le note e le cartelle eliminate finiscano in un cestino per poterle recuperare se ho sbagliato.

- Nel cestino finiscono sia le note sia le cartelle, con tutto il loro contenuto (RB-25, RB-26).
- Gli elementi restano nel cestino finché l'utente non lo svuota o non li elimina uno per uno, sempre dopo una conferma: Memodu non cancella mai dati da solo (RB-27, RB-55, DEC-17).
- Un elemento ripristinato torna sempre nella radice: una nota diventa non organizzata, una cartella torna al primo livello dell'albero (RB-28).
- Le note nel cestino compaiono nella ricerca, segnalate come "nel cestino"; una preferenza nelle impostazioni permette di escluderle (RB-29).

**Collegamenti:** FL-05 · EN-01 · EN-03 · SC-00 · RF-05 · RF-08

### Scenario d'uso
Sistemando l'albero elimino per errore la cartella "Clienti", con dentro note e sottocartelle. Apro il cestino, la trovo con tutto il suo contenuto e la ripristino: torna al primo livello dell'albero e la trascino di nuovo dov'era. Ogni tanto svuoto il cestino a mano; finché non lo faccio, le note eliminate restano recuperabili e le ritrovo anche cercandole, segnate come "nel cestino".

### Criteri di accettazione
Frammento Must B «Smistare» (DEC-36): cestino nella cartella nascosta `.cestino`; dal frammento Must D è nel database (DEC-48). Le note nel cestino nella ricerca (RB-29) arrivano con la ricerca (RF-08).

- **CA-15.1** *Dato* una nota aperta, *quando* scelgo «Elimina» in Info (o dal tasto destro sulla nota), *allora* la nota va nel cestino senza conferma, sparisce dalla colonna e l'area della nota mostra «Nessuna nota aperta» (RB-26, RB-67).
- **CA-15.2** *Dato* una cartella, *quando* scelgo «Elimina» dal tasto destro, *allora* va nel cestino con tutte le note e le sottocartelle, senza conferma; se dentro c'era la nota aperta, l'area della nota mostra lo stato vuoto (RB-25, RB-67).
- **CA-15.3** *Dato* un trascinamento di una nota o di una cartella, *allora* in fondo alla colonna compare «Trascina qui per eliminare»; sopra diventa rosso con «Rilascia per spostare nel cestino», e al rilascio l'elemento va nel cestino (CMP-14, RB-25, RB-26).
- **CA-15.4** *Dato* il cestino con elementi, *quando* lo apro dalla riga «Cestino» in fondo alla colonna, che ne mostra il numero di elementi (DEC-40), *allora* vedo gli elementi dal più recente, ognuno con nome, tipo, provenienza e data («Nota · da Lavoro › Clienti · eliminata il 24/09/2026»), Ripristina ed Elimina definitivamente (SC-04, CMP-17).
- **CA-15.5** *Dato* un elemento nel cestino, *quando* premo Ripristina, *allora* sparisce dal cestino e torna nella radice: la nota tra le non organizzate, la cartella al primo livello con tutto il contenuto; se al primo livello c'è già una cartella con quel nome compare la finestra con tre scelte (RB-28, RB-31).
- **CA-15.6** *Dato* un elemento nel cestino, *quando* premo Elimina definitivamente, *allora* compare «Eliminare per sempre «‹nome›»?»; Annulla lo lascia nel cestino, «Elimina definitivamente» lo cancella dal database: non si recupera più da Memodu. Il testo può restare leggibile nel file del database finché SQLite non riusa lo spazio (rischio accettato fino alla cifratura; scelta di Manuel Cucca il 29/09/2026) (RB-55, DEC-17).
- **CA-15.7** *Dato* il cestino con elementi, *quando* premo «Svuota cestino», *allora* compare «Svuotare il cestino?» con il numero di elementi; confermando il cestino si svuota e mostra «Il cestino è vuoto», senza il pulsante Svuota cestino (RB-32).
- **CA-15.8** *Dato* elementi nel cestino, *quando* chiudo e riapro Memodu o passa del tempo, *allora* sono ancora tutti lì: Memodu non cancella mai niente da solo (RB-27).

---

## RF-07 – Workspace multipli
**Priorità:** Should · **Origine:** DEC-01 · **Fase:** 1 · **Stato:** In progettazione

Come *utente* voglio creare più workspace per separare ambiti diversi (per esempio lavoro e vita privata) e non avere tutte le note mischiate.

Nella prima fase la separazione tra ambiti si ottiene con le cartelle principali (per esempio "Lavoro" e "Personale"); i workspace arrivano dopo, anche se la persona usa Memodu sia per lavoro sia per la vita privata.

**Collegamenti:** FL-00 · EN-00 · SC-00

### Scenario d'uso
[Da compilare]

### Criteri di accettazione
- [Da compilare]

---

## RF-08 – Ricerca e filtro
**Priorità:** Must · **Origine:** — · **Fase:** 8 (completa; sviluppo fatto, restano le prove con il secondo dispositivo) · **Stato:** Pronto

Come *utente* voglio cercare e filtrare le note per trovare subito quella che mi serve.

La ricerca agisce su titolo, testo della nota e nomi dei tag; i filtri su:
- tag, sotto-tag compresi (RF-06): con più tag escono le note che li hanno tutti;
- date dei metadati: creazione e ultima modifica (RF-04). Il filtro sulla fine validità per ora non c'è (DEC-94).

Le date si cercano solo con i filtri. Una parola si trova anche dentro le altre parole, maiuscole e accenti non contano, con più parole servono tutte. Si può filtrare anche senza scrivere niente (DEC-94).

La ricerca sta in cima alla colonna; Ctrl + K (⌘ + K su macOS) la apre anche con la colonna chiusa (DEC-94).

Con la cifratura end-to-end (RF-10) il server non legge le note: la ricerca nel testo avviene sul dispositivo.

Le note nel cestino compaiono tra i risultati, segnalate come "nel cestino"; si possono escludere con una preferenza nelle impostazioni (RB-29).

**Collegamenti:** FL-06 · EN-01 · EN-04 · EN-07 · SC-00 · RF-04 · RF-06 · RF-10

### Scenario d'uso
Inizio a scrivere nella barra di ricerca dell'interfaccia e i risultati compaiono in sovraimpressione, in una card a discesa.

### Criteri di accettazione
Scritti dall'agente da FL-06, DEC-94 e DEC-95; approvati da Manuel Cucca il 30/09/2026, con la soglia di 200 ms di CA-08.16.
- **CA-08.1** *Dato* la colonna chiusa, *quando* premo Ctrl + K (⌘ + K su macOS), *allora* la colonna si apre, il cursore è nel campo di ricerca e la card mostra solo i filtri Tag, Creazione e Modifica; con un clic nel campo succede lo stesso (RB-71, RB-33).
- **CA-08.2** *Dato* il campo di ricerca, *quando* scrivo «rilascio», *allora* dopo una breve pausa, senza Invio, la card mostra tutte le note con la parola nel titolo, nel testo o nei nomi dei tag: prima quelle con la parola nel titolo o nei tag, poi quelle con la parola solo nel testo, ciascun gruppo per ultima modifica; ogni risultato mostra titolo, la frase con la parola evidenziata, cartella e data (RB-33, RB-34, RB-69).
- **CA-08.3** *Dato* delle note con «rilascio» e «perché», *quando* cerco «lascio», «PERCHE» o «ri», *allora* le trovo: la parola si trova anche dentro le altre, maiuscole e accenti non contano, e anche con una o due lettere; cercando «rilascio venerdì» escono solo le note che hanno tutte e due le parole (RB-69).
- **CA-08.4** *Dato* una nota con il tag «lavoro/clienti» e senza la parola nel testo, *quando* cerco «lavoro», *allora* la trovo (RB-69, RF-06).
- **CA-08.5** *Dato* la card aperta, *quando* nel filtro Tag scelgo «lavoro» e «clienti», *allora* la pillola diventa «Tag: 2» ed escono solo le note che hanno tutti e due i tag, ciascuno anche con i suoi sotto-tag; «Togli il filtro» li toglie (RB-70, CMP-09).
- **CA-08.6** *Dato* il campo vuoto, *quando* scelgo il filtro Tag «lavoro», *allora* escono le note con «lavoro» o un suo sotto-tag, per ultima modifica, con l'inizio del testo al posto della frase (RB-70, DEC-95).
- **CA-08.7** *Dato* il filtro Modifica, *quando* scelgo «Ultimi 7 giorni», *allora* escono solo le note modificate negli ultimi 7 giorni secondo l'ora di questo computer e la pillola mostra il periodo; con «Scegli le date…» il periodo si sceglie sul calendario; per la Creazione vale la data scelta in Info, se c'è; ogni risultato mostra la data del filtro attivo (RF-04, DEC-95).
- **CA-08.8** *Dato* una ricerca senza risultati, *allora* la card resta aperta con i filtri e mostra «Nessuna nota trovata» e «Prova con un'altra parola o togli un filtro.» (RB-35).
- **CA-08.9** *Dato* una nota nel cestino, o dentro una cartella nel cestino, che contiene la parola cercata, *quando* cerco, *allora* compare attenuata con l'etichetta «nel cestino» e aprendola si vede che è nel cestino e si può ripristinare; spento «Mostra le note del cestino nei risultati» in SC-06 non compare più, anche sull'altro dispositivo dopo la sincronizzazione (RB-29, RB-28, RB-52).
- **CA-08.10** *Dato* dei risultati, *quando* ne apro uno con un clic o con Invio, *allora* la nota si apre al posto di quella aperta, già salvata, la card si chiude e testo e filtri si svuotano; se la colonna l'aveva aperta Ctrl + K si richiude, se era fissata o aperta a mano resta com'era (RB-06, RB-71, RB-72).
- **CA-08.11** *Dato* la card aperta, *quando* premo Esc, *allora* la card si chiude senza aprire niente e la ricerca si svuota; se la colonna l'aveva aperta Ctrl + K si richiude e il cursore torna dov'era nel foglio (RB-71, RB-72).
- **CA-08.12** *Dato* la card aperta, *quando* un risultato viene modificato o eliminato altrove (per esempio dalla sincronizzazione), *allora* i risultati restano quelli della ricerca e aprendolo si vede la versione aggiornata (RB-45, SF-20).
- **CA-08.13** *Dato* il computer senza rete, *quando* cerco, *allora* la ricerca funziona come sempre (SF-08, DEC-02).
- **CA-08.14** *Dato* il solo uso della tastiera, *allora* dal campo freccia giù entra nei risultati, su e giù si muovono, Invio apre, Tab raggiunge i filtri (CMP-13, RNF-04).
- **CA-08.15** *Dato* un testo come `"a*" OR b`, *quando* lo cerco, *allora* non c'è nessun errore e si cercano quei caratteri così come sono (RB-08, DEC-95).
- **CA-08.16** *Dato* una copia di lavoro con 5.000 note, *quando* scrivo nel campo, *allora* i risultati compaiono entro 200 ms dalla fine della pausa (RNF-01).

Ricerca avanzata (DEC-96, CMP-29): scritti dall'agente e approvati da Manuel Cucca il 01/10/2026.
- **CA-08.17** *Dato* la card con dei risultati, *allora* in fondo c'è «Mostra tutti i risultati (n)», con n il numero di note trovate; *quando* la scelgo o premo Ctrl + Maiusc + K (⌘ + Maiusc + K su macOS), *allora* la card si chiude e al centro, con il velo, si apre la ricerca avanzata con lo stesso testo e gli stessi filtri. Con la card chiusa Ctrl + Maiusc + K la apre vuota, con il cursore nel campo.
- **CA-08.18** *Dato* la ricerca avanzata, *allora* a sinistra i filtri Tag, Creazione e Modifica sono sempre aperti, con le voci dei loro menu; *quando* spunto dei tag o scelgo un periodo, *allora* i risultati cambiano subito: con più tag escono le note che li hanno tutti (come CA-08.5), per le date vale un periodo solo e «Scegli le date…» apre il calendario (come CA-08.7).
- **CA-08.19** *Dato* la ricerca avanzata, *allora* a destra il conteggio (««rilascio» con il tag lavoro · 4 note») e i risultati con lo stesso ordine e le stesse regole della card (CA-08.2, CA-08.9); senza risultati «Nessuna nota trovata» e il suggerimento (CA-08.8).
- **CA-08.20** *Dato* dei risultati nella ricerca avanzata, *quando* ne apro uno con un clic o con Invio, *allora* la finestra si chiude e la nota si apre come in CA-08.10, con testo e filtri svuotati; *quando* premo Esc, la ✕ o clicco sul velo, *allora* la finestra si chiude senza aprire niente e torna la card con lo stesso testo e gli stessi filtri, con il cursore nel campo.
- **CA-08.21** *Dato* il solo uso della tastiera, *allora* all'apertura il cursore è nel campo; freccia giù entra nei risultati, su e giù si muovono, Invio apre; Tab passa dal campo ai filtri e ai risultati, e nei filtri Invio o Spazio sceglie una voce (CMP-29, RNF-04).

---

## RF-09 – Blocco con password di workspace e note
**Priorità:** Should · **Origine:** DEC-01 · **Fase:** 1 · **Stato:** In progettazione

Come *utente* voglio proteggere con una password un workspace o una singola nota per impedirne la lettura a chi usa il mio dispositivo.

**Collegamenti:** FL-00 · EN-00 · SC-00 · RNF-02

### Scenario d'uso
[Da compilare]

### Criteri di accettazione
- [Da compilare]

---

## Fuori dal modulo
Codici del registro idee esclusi da questo modulo:
- ID-02 – Vault come cassaforte (rifiutata: coperta da RF-09)
- ID-04 – Link interni tra note (parcheggiata)
