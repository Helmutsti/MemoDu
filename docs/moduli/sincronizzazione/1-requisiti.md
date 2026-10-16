# Sincronizzazione – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

## RF-10 – Sincronizzazione cloud cifrata end-to-end
**Priorità:** Must · **Origine:** DEC-01, DEC-02, DEC-06, DEC-121, DEC-132 · **Fase:** 9 · **Stato:** Implementato (cifrata end-to-end con DEC-121) (rilasciato fino alla 0.1.13, 07/10/2026)

Come *utente* voglio che tutte le mie note siano sincronizzate nel cloud con cifratura end-to-end per avere l'intera struttura a disposizione su ogni dispositivo, senza che altri possano leggerla.

Il cloud è la fonte di verità. Sul dispositivo resta una copia di lavoro su cui avvengono tutte le operazioni: la sincronizzazione parte periodicamente in background. Senza connessione si continua a scrivere, e le modifiche si sincronizzano in automatico quando la rete torna (DEC-02).

Se una nota è stata modificata su un solo dispositivo, si salva la versione più aggiornata. Se la stessa nota è stata modificata su due dispositivi c'è un conflitto: il programma salva entrambe le versioni e nessun dato va perso (DEC-06): una resta la nota originale, l'altra diventa una nota indipendente nella stessa cartella, con lo stesso titolo seguito da "(copia in conflitto)" (RB-39).

Per sincronizzare il dispositivo deve aver fatto l'accesso (RF-14). La cifratura avviene sul dispositivo: le note si cifrano con la chiave dati, che si apre con la password o con la chiave di recupero; il server vede solo blocchi illeggibili (DEC-08, DEC-121). Con più utenti in prova i blocchi e le versioni di ogni utente sono separati sul server: un dispositivo legge e scrive solo quelli del suo account (DEC-132).

**Collegamenti:** FL-07 · EN-06 · EN-08 · SC-01 · RNF-02

### Scenario d'uso
Lavoro su due dispositivi e ognuno accumula modifiche e nuove note. Se entrambi hanno modificato la stessa nota c'è un conflitto: il programma salva entrambe le versioni. È una soluzione rudimentale, ma la perdita di dati è inconcepibile.

### Criteri di accettazione
Scritti dall'agente dai flussi e dalle decisioni (FL-07, DEC-75 … DEC-83). Confermati da Manuel Cucca il 04/10/2026: tutti, CA-10.1 … CA-10.11 (CA-10.4 … CA-10.6 con DEC-109, CA-10.6 con DEC-110, CA-10.7 con DEC-111, CA-10.9 con DEC-112, CA-10.11 con DEC-113).
- **CA-10.1** *Dato* due dispositivi collegati alla stessa installazione, *quando* scrivo o modifico una nota su uno, *allora* entro 30 secondi la trovo uguale sull'altro, nella stessa cartella e con gli stessi tag, senza fare niente (DEC-80, RB-40).
- **CA-10.2** *Dato* un dispositivo senza rete, *quando* creo, modifico, sposto o elimino note, cartelle e tag, *allora* tutto funziona come sempre e, appena il server torna raggiungibile, le modifiche arrivano da sole agli altri dispositivi (DEC-02, DEC-80).
- **CA-10.3** *Dato* una nota modificata su due dispositivi prima che si sincronizzino, *quando* si sincronizzano, *allora* la nota originale tiene una versione e accanto, nella stessa cartella, nasce una nota con lo stesso titolo seguito da «(copia in conflitto)» con l'altra; nessun testo va perso e compare l'avviso con il collegamento alla nota (DEC-06, RB-39).
- **CA-10.4** *Dato* una nota spostata in cartelle diverse su due dispositivi, *quando* si sincronizzano, *allora* resta nella cartella dello spostamento arrivato per ultimo al server (RB-37, DEC-109).
- **CA-10.5** *Dato* una nota eliminata su un dispositivo e modificata su un altro, *quando* si sincronizzano, *allora* vince l'azione arrivata per ultima al server: se è la modifica la nota esce dal cestino con le modifiche, se è l'eliminazione resta nel cestino con le modifiche comprese (RB-36, DEC-109).
- **CA-10.6** *Dato* una cartella rinominata in due modi su due dispositivi, *quando* si sincronizzano, *allora* prende il nome arrivato per ultimo al server, senza altri segnali (RB-38, DEC-109, DEC-110).
- **CA-10.7** *Dato* una cartella mandata nel cestino su un dispositivo, *quando* su un altro creo o sposto una nota dentro quella cartella prima di sincronizzarmi, *allora* dopo la sincronizzazione la nota è tra le non organizzate e la cartella resta nel cestino (RB-30, DEC-111).
- **CA-10.8** *Dato* un elemento modificato su un solo dispositivo, *quando* si sincronizzano, *allora* su tutti c'è la versione più aggiornata e nessuna copia in conflitto.
- **CA-10.9** *Dato* il server irraggiungibile, *quando* passa meno di un'ora dall'ultima sincronizzazione riuscita, *allora* non compare niente; oltre l'ora compare l'avviso «server irraggiungibile», che sparisce da solo quando la sincronizzazione riesce (RB-40, DEC-112).
- **CA-10.10** *Dato* una sincronizzazione che fallisce a metà o una versione del protocollo che il server non riconosce, *quando* succede, *allora* compare l'avviso «errore di sincronizzazione», la copia di lavoro resta intatta e si riprova alla sincronizzazione successiva (RB-40, SF-32, DEC-83).
- **CA-10.11** *Dato* il server, *quando* guardo il suo archivio, *allora* per ogni elemento trovo la versione attuale e le precedenti degli ultimi 7 giorni, a scalare: tutte quelle dell'ultima ora, una all'ora nell'ultimo giorno, una al giorno dopo (DEC-77, DEC-113).

**Criteri della cifratura (DEC-121):** scritti dall'agente, approvati da Manuel Cucca il 06/10/2026.
- **CA-10.12** *Dato* il server dopo una sincronizzazione, *quando* guardo i blocchi nel suo archivio, *allora* ogni blocco dichiara il formato `xchacha20poly1305` e non vi si legge nessun titolo, testo, nome di cartella o di tag, data o struttura dell'albero (DEC-08, DEC-121).
- **CA-10.13** *Dato* un dispositivo con note sincronizzate in chiaro, *quando* accedo per la prima volta con la cifratura, *allora* tutti gli elementi vengono rimandati cifrati e sul server non resta nessuna versione in chiaro, nemmeno tra le precedenti (DEC-78, condizione 3).
- **CA-10.14** *Dato* due dispositivi che hanno fatto l'accesso con lo stesso utente, *quando* scrivo una nota su uno, *allora* sull'altro arriva leggibile entro 30 secondi, come in CA-10.1: la cifratura non cambia i tempi (DEC-80).
- **CA-10.15** *Dato* un blocco alterato sul server, *quando* il dispositivo lo riceve, *allora* non lo apre, compare l'avviso «errore di sincronizzazione» e la copia di lavoro resta intatta (RB-40, SF-32).
- **CA-10.16** *Dato* un dispositivo senza accesso, *quando* guardo la copia di lavoro e il portachiavi, *allora* la chiave dati non c'è da nessuna parte; dopo l'accesso sta solo nel portachiavi del sistema, mai in un file (RB-86, RB-89).
- **CA-10.17** *Dato* due account con note diverse, *quando* sincronizzano dai loro computer, *allora* ognuno riceve solo le sue note e nessuna richiesta legge o scrive i blocchi dell'altro (DEC-132, approvato il 14/10/2026).

---

## RF-14 – Accesso all'installazione
**Priorità:** Must · **Origine:** DEC-05, DEC-121, DEC-132 · **Fase:** 9 · **Stato:** In sviluppo (account nel database, DEC-132); implementato con l'utente fisso di DEC-121 (rilasciato fino alla 0.1.13, 07/10/2026)

> DEC-132 (13/10/2026): requisito riaperto dalla Fase 1 per gli account nel database. Lo scenario d'uso è riscritto per gli account nel database (approvato da Manuel Cucca il 14/10/2026); i criteri di accettazione per gli account sono CA-14.23 … CA-14.36 (Fase 8, 14/10/2026); dei precedenti, CA-14.7, CA-14.12 e CA-14.16 sono superati.

Come *utente* voglio accedere una volta con email e password per sincronizzare le mie note cifrate, restare collegato senza ripetere l'accesso, cambiare la password, recuperare l'account se la dimentico e poter uscire da un dispositivo.

- Più utenti, per la prova: ognuno ha il suo account e sul server nessuno legge le note degli altri. Nessuna registrazione dall'app: gli account li crea Manuel Cucca con un comando del server che scrive nel database (DEC-132). L'utente fisso di oggi diventa il primo account, con la stessa chiave dati: le note non si ricifrano.
- L'accesso avviene in SC-05 con email e password (RB-86). Dalla password, sul dispositivo, si ricavano la prova per il server e la chiave che apre la chiave dati: il server non vede mai né la password né la chiave (DEC-121).
- Dopo l'accesso si resta collegati: ogni dispositivo ha il suo accesso, che non scade e dura finché si esce o finché lo si chiude a distanza (RF-16, DEC-132). Accesso e chiave dati stanno nel portachiavi del sistema.
- Senza accesso, o con l'accesso chiuso o rifiutato, Memodu si apre comunque sulla copia di lavoro e non si blocca mai: le modifiche aspettano e un avviso porta a SC-05 (RB-87). Senza rete si lavora come sempre (DEC-02). L'avvio resta istantaneo (RNF-01).
- La password ha almeno 12 caratteri, senza regole di complessità, e non può essere una delle più comuni (RB-88).
- Dall'app si cambia la password, scrivendo la password attuale oppure la chiave di recupero, più quella nuova (scelta di Manuel Cucca il 14/10/2026); con la chiave di recupero ne nasce una nuova, come nel recupero. Al cambio la persona sceglie se scollegare gli altri suoi dispositivi, che dovranno rifare l'accesso con la password nuova (scelta di Manuel Cucca il 13/10/2026). Le note non si ricifrano.
- «Esci» nel box dell'account delle impostazioni (SC-06, DEC-122) scollega il dispositivo; la copia di lavoro resta (RB-89).
- Password persa: dall'app, con la chiave di recupero stampata alla creazione dell'account, se ne sceglie una nuova senza perdere le note (RB-90, DEC-132). Al recupero nasce una chiave di recupero nuova, mostrata una volta, e quella usata smette di valere (scelta di Manuel Cucca il 13/10/2026). Anche qui la persona sceglie se scollegare gli altri dispositivi (scelta di Manuel Cucca il 14/10/2026). Durante la prova le chiavi di recupero le conserva Manuel Cucca: la chiave nuova la vede solo l'utente, che ha cura di mandarla a Manuel Cucca, e solo in questa fase di prova (scelta di Manuel Cucca il 14/10/2026).
- Nessun limite ai tentativi di accesso durante la prova (DEC-132, rischio accettato in `avanzamento.md`).

**Collegamenti:** FL-08 · EN-05 · EN-06 · SC-05 · SC-06 · RF-10 · RNF-02

### Scenario d'uso
Creo dal server l'account di una collega che vuole provare Memodu, con la sua email e una prima password: il comando mi mostra la sua chiave di recupero, che conservo io. Le mando email e password. Lei installa Memodu, accede dalle impostazioni e cambia subito la password con una sua. Vede solo le sue note, io solo le mie. Il suo computer resta collegato senza più chiederle l'accesso. Un mese dopo dimentica la password: dalla schermata di accesso sceglie di recuperare l'account, inserisce la chiave di recupero che le ridò e una password nuova; l'app le mostra una chiave nuova una sola volta e lei me la manda. Le note ci sono tutte. Più tardi perde il portatile: dal computer fisso vede l'elenco dei dispositivi collegati e chiude quello perso (RF-16).

Lo scenario precedente, per l'utente fisso di DEC-121: ~~Creo l'utente sul server con il comando, stampo la chiave di recupero e la metto al sicuro. Apro Memodu sul PC Windows: le note della copia di lavoro ci sono subito; dal box dell'account in cima alle impostazioni accedo con email e password e le note si sincronizzano cifrate. Faccio lo stesso sul Mac. Per un mese non devo più accedere; se un computer resta spento più a lungo, alla riapertura scrivo come sempre e un avviso mi chiede di accedere di nuovo.~~

### Criteri di accettazione
Scritti dall'agente dai flussi, dalle regole e dai mockup (FL-08, RB-86 … RB-90, DEC-121), approvati da Manuel Cucca il 06/10/2026. Numerati dopo quelli superati. Con DEC-122 la riga Account e la sezione Sincronizzazione diventano il box dell'account in cima a SC-06: CA-14.8, CA-14.9 e CA-14.14 si riscrivono in Fase 6, dopo i mockup nuovi.
- ~~**CA-14.7**~~ *(superato da CA-14.23, DEC-132)* *Dato* il comando che crea l'utente, *quando* gli do email e una password di almeno 12 caratteri che non sia tra le più comuni, *allora* stampa le righe delle variabili del server e, una volta sola, la chiave di recupero; con una password più corta o comune la rifiuta e dice perché. Password, prova e chiavi non finiscono mai nel registro (RB-88, RB-90).
- ~~**CA-14.8**~~ *(superato da CA-14.18, DEC-122)* *Dato* un dispositivo senza accesso, *quando* apro Memodu, *allora* la finestra si apre subito sulla copia di lavoro, senza sincronizzare e senza avvisi; nella sezione Sincronizzazione delle impostazioni la riga Account dice «Non hai fatto l'accesso» con Accedi (RB-87, DEC-84).
- ~~**CA-14.9**~~ *(superato da CA-14.19, DEC-122)* *Dato* SC-05 aperta da Accedi, *quando* inserisco email e password giuste e premo Accedi (o Invio), *allora* il pulsante va in caricamento, la finestra si chiude, la sincronizzazione parte e la riga Account mostra l'email con Esci (RB-86).
- **CA-14.10** *Dato* SC-05, *quando* sbaglio email o password, *allora* compare «Email o password non corrette.» sopra i pulsanti, l'email resta scritta e posso riprovare quante volte voglio (RB-86).
- **CA-14.11** *Dato* SC-05 e il server irraggiungibile, *quando* premo Accedi, *allora* compare sopra i pulsanti «Non riesco a raggiungere il server. Riprova tra poco.» e posso continuare a scrivere sulla copia di lavoro (DEC-02).
- ~~**CA-14.12**~~ *(superato da CA-14.25, DEC-132)* *Dato* un dispositivo che ha fatto l'accesso, *quando* chiudo e riapro Memodu, *allora* non mi chiede di accedere; quando al gettone mancano meno di 7 giorni l'app lo rinnova da sola, senza chiedere nulla (RB-86).
- **CA-14.13** *Dato* il gettone scaduto o rifiutato (per esempio dopo il cambio del segreto sul server), *quando* l'app prova a sincronizzare, *allora* la finestra non si blocca, continuo a scrivere e compare l'avviso «Accedi di nuovo per sincronizzare. Le modifiche restano su questo computer.»; Accedi apre SC-05 e, dopo l'accesso, le modifiche fatte nel frattempo arrivano sugli altri dispositivi (RB-87).
- ~~**CA-14.14**~~ *(superato da CA-14.20, DEC-122)* *Dato* un dispositivo collegato con modifiche in attesa, *quando* premo Esci, *allora* le modifiche partono, gettone e chiave dati spariscono dal portachiavi, la copia di lavoro resta e la riga Account torna a «Non hai fatto l'accesso» (RB-89).
- **CA-14.15** *Dato* SC-05 aperta dall'avviso dell'accesso scaduto, *quando* premo «Non voglio usare il cloud», *allora* il dispositivo si scollega come con Esci, le modifiche in attesa restano sulla copia di lavoro e l'avviso non torna riaprendo Memodu; con Esc invece la finestra si chiude soltanto e l'avviso torna alla riapertura (RB-89).
- ~~**CA-14.16**~~ *(superato da CA-14.28, DEC-132)* *Dato* la password persa e la chiave di recupero, *quando* rilancio il comando con la chiave di recupero e una password nuova e metto le variabili nuove sul server, *allora* accedo con la password nuova e leggo tutte le note senza che vengano ricifrate; la password vecchia è rifiutata (RB-90).
- **CA-14.17** *Dato* una richiesta di accesso, *quando* guardo cosa arriva al server e il suo registro, *allora* non ci sono mai la password, la chiave di recupero o la chiave dati in chiaro (DEC-121).

Con DEC-122 la riga Account diventa il box dell'account in cima a SC-06 (CMP-32). Criteri scritti dall'agente dai mockup approvati il 07/10/2026, approvati da Manuel Cucca il 07/10/2026; il testo del server irraggiungibile l'ha cambiato lui lo stesso giorno in «Server non raggiungibile: ultimo backup 14:32»:
- **CA-14.18** *Dato* un dispositivo senza accesso, *quando* apro Memodu, *allora* la finestra si apre subito sulla copia di lavoro, senza sincronizzare e senza avvisi; in cima alle impostazioni il box dell'account ha l'icona utente, «Non hai fatto l'accesso», «Le note restano su questo computer.» e Accedi, e non mostra il nome del dispositivo (RB-87, DEC-84, DEC-122).
- **CA-14.19** *Dato* SC-05 aperta da Accedi, *quando* inserisco email e password giuste e premo Accedi (o Invio), *allora* il pulsante va in caricamento, la finestra si chiude, la sincronizzazione parte e il box dell'account mostra il cerchio con l'iniziale dell'email, l'email, Esci, lo stato e sotto il nome del dispositivo; lo stato passa dal pallino grigio «In attesa della prima sincronizzazione» al pallino verde «Sincronizzata · oggi alle 14:32» (RB-86, DEC-122).
- **CA-14.20** *Dato* un dispositivo collegato con modifiche in attesa, *quando* premo Esci nel box dell'account, *allora* le modifiche partono, gettone e chiave dati spariscono dal portachiavi, la copia di lavoro resta e il box torna a «Non hai fatto l'accesso» senza il nome del dispositivo (RB-89, DEC-122).
- **CA-14.21** *Dato* un dispositivo collegato e il server che non risponde, *quando* guardo le impostazioni, *allora* il box mostra il pallino ambra «Server non raggiungibile: ultimo backup 14:32» (l'ora dell'ultima sincronizzazione riuscita, con la data davanti se non è di oggi) e Esci resta; con un errore del server il pallino ambra dice «Non riuscita: riprovo da sola» (DEC-112, DEC-122).
- **CA-14.22** *Dato* il gettone scaduto o rifiutato, *quando* guardo le impostazioni, *allora* il box mostra il pallino rosso «Accedi di nuovo per sincronizzare» con Accedi al posto di Esci, e Accedi apre SC-05; con versioni diverse di Memodu e del server il pallino rosso dice «Memodu e il server hanno versioni diverse» e resta Esci (RB-87, DEC-83, DEC-122).

Con DEC-132 e DEC-133: criteri scritti dall'agente dai flussi FL-08, FL-14, RB-97 … RB-100 e dai mockup approvati il 14/10/2026, approvati da Manuel Cucca il 14/10/2026. CA-14.10, CA-14.11, CA-14.13, CA-14.15, CA-14.17 … CA-14.22 restano validi, con «accesso chiuso» al posto di «gettone scaduto».
- **CA-14.23** *Dato* il comando che crea un account, *quando* gli do un'email nuova e una password di almeno 12 caratteri che non sia tra le più comuni, *allora* scrive l'account nel database e stampa una volta sola la chiave di recupero; con un'email già usata, o una password più corta o comune, rifiuta e dice perché. Password, prova e chiavi non finiscono mai nel registro (RB-88, RB-90).
- **CA-14.24** *Dato* il server con l'utente fisso e le sue note, *quando* parte la versione con gli account, *allora* l'utente fisso diventa il primo account con la stessa chiave dati: dopo un nuovo accesso su ogni computer tutte le note ci sono, senza essere ricifrate (DEC-132, DEC-133).
- **CA-14.25** *Dato* un dispositivo collegato, *quando* lo riapro dopo più di 90 giorni, *allora* non mi chiede di accedere (RB-97).
- **CA-14.26** *Dato* SC-05, *quando* premo «Password dimenticata?», *allora* la stessa finestra mostra «Recupera l'account» con l'email già scritta, la chiave di recupero, la password nuova due volte e la casella «Scollega gli altri miei dispositivi» spenta; «Torna all'accesso» torna all'accesso (RB-99).
- **CA-14.27** *Dato* il recupero, *quando* scrivo una chiave sbagliata, una password nuova troppo corta o comune, due password diverse, o il server non risponde, *allora* sopra i pulsanti compare «Chiave di recupero non corretta.», il motivo della password, «Le due password non sono uguali.» o «Non riesco a raggiungere il server. Riprova tra poco.», e non cambia niente (RB-88, RB-99).
- **CA-14.28** *Dato* email, chiave di recupero giusta e password nuova valida, *quando* premo «Recupera», *allora* compare «La tua nuova chiave di recupero» una volta sola, «Copia» diventa «Copiata» dopo il clic, e «Ho conservato la chiave» chiude la finestra con il dispositivo collegato e tutte le note leggibili; la chiave usata e la password vecchia non valgono più (RB-99).
- **CA-14.29** *Dato* la casella «Scollega gli altri miei dispositivi» accesa nel recupero o nel cambio della password, *quando* confermo, *allora* gli altri miei dispositivi, alla richiesta successiva, mostrano «Accedi di nuovo per sincronizzare» e si ricollegano con la password nuova; con la casella spenta restano collegati (RB-98, RB-99).
- **CA-14.30** *Dato* un dispositivo collegato, *quando* guardo il box dell'account, *allora* sotto lo stato ci sono «Cambia password» e «Dispositivi collegati»; senza accesso e con l'accesso chiuso non ci sono (CMP-32).
- **CA-14.31** *Dato* SC-08 aperta da «Cambia password», *quando* scrivo la password attuale giusta e la nuova due volte e premo «Cambia password», *allora* la finestra si chiude, questo dispositivo resta collegato, gli altri dispositivi accedono con la password nuova e quella vecchia è rifiutata; le note non si ricifrano (RB-98).
- **CA-14.32** *Dato* SC-08, *quando* premo «Usa la chiave di recupero», *allora* il primo campo diventa «Chiave di recupero» e il pulsante «Usa la password attuale»; con la chiave giusta, dopo il cambio compare la chiave di recupero nuova come in CA-14.28 (RB-99).
- **CA-14.33** *Dato* SC-08, *quando* la password attuale o la chiave sono sbagliate, la password nuova non va bene, le due nuove sono diverse o il server non risponde, *allora* compare il messaggio in linea sopra i pulsanti («Password attuale non corretta.», «Chiave di recupero non corretta.», il motivo, «Le due password non sono uguali.», «Non riesco a raggiungere il server. Riprova tra poco.»), il dispositivo resta collegato e non cambia niente (RB-98).
- **CA-14.34** *Dato* un cambio della password o un recupero arrivato al server, *quando* la risposta si perde e l'app ripete la richiesta, *allora* l'esito è quello riuscito e la chiave di recupero nuova si mostra solo dopo la conferma del server (SF-08, SF-10).
- **CA-14.35** *Dato* un dispositivo collegato con la rete, *quando* premo Esci, *allora* sparisce anche dall'elenco dei dispositivi degli altri computer; senza rete si scollega lo stesso e resta nell'elenco, da dove si può scollegare (RB-89, RB-100).
- **CA-14.36** *Dato* una richiesta di accesso, recupero o cambio della password, *quando* guardo cosa arriva al server, il registro e il database, *allora* non ci sono mai la password, la chiave di recupero, la chiave dati in chiaro né il gettone del dispositivo (DEC-121, DEC-133).

I criteri precedenti, scritti per il collegamento con credenziali preimpostate (DEC-13, DEC-20, DEC-79) e confermati da Manuel Cucca il 04/10/2026, sono superati da DEC-121:
- ~~**CA-14.1**~~ *(superato)* *Dato* una installazione nuova, *quando* genero le credenziali con `npm run credenziali`, *allora* il file `credenziali` da copiare su ogni dispositivo nasce una volta, non si sovrascrive, e il server conosce solo l'impronta del gettone (DEC-79, DEC-104).
- ~~**CA-14.2**~~ *(superato)* *Dato* il file `credenziali` con credenziali valide, *quando* apro Memodu, *allora* la finestra si apre subito sulla copia di lavoro e la sincronizzazione parte in background, senza schermate di accesso (RNF-01, RB-54).
- ~~**CA-14.3**~~ *(superato)* *Dato* credenziali rifiutate dal server, *quando* apro Memodu o il rifiuto arriva con l'app aperta, *allora* al posto della finestra, e della nota rapida, compare la schermata di blocco con Riprova; quello che era già scritto resta sulla copia di lavoro (RB-57, DEC-20).
- ~~**CA-14.4**~~ *(superato)* *Dato* la schermata di blocco, *quando* correggo il file `credenziali` e premo Riprova, *allora* il file si rilegge, il blocco sparisce e la sincronizzazione riparte (DEC-20).
- ~~**CA-14.5**~~ *(superato)* *Dato* credenziali valide e il server spento, *quando* apro Memodu, *allora* si lavora come sempre sulla copia di lavoro, senza blocco (DEC-20, DEC-02).
- ~~**CA-14.6**~~ *(superato)* *Dato* il file `credenziali` mancante, *quando* apro Memodu, *allora* si lavora sulla copia di lavoro senza sincronizzare e senza blocco; appena il file c'è, la sincronizzazione parte (DEC-84).

---

## RF-13 – Importazione ed esportazione delle note
**Priorità:** Should · **Origine:** ID-09 · **Fase:** 1 · **Stato:** In progettazione

Come *utente* voglio importare ed esportare le mie note in file markdown standard, con allegati e metadati, per non restare legato a Memodu e poter portare i miei dati dove voglio.

Anche se si sviluppa dopo la prima fase, il modo in cui si salvano le note deve renderla possibile fin dall'inizio.

Pillole, aree e allegati di Brainet (DEC-145, scelta di Manuel Cucca del 16/10/2026): la pillola si esporta come `[[nome]]`, l'area come `==frase==` senza gli stati, la foto come `![nome](allegati/nome)` e il documento come `[nome](allegati/nome)`, con i file nella cartella `allegati` accanto alla nota.

**Collegamenti:** FL-00 · EN-00 · SC-00 · RF-04 · RF-10

### Scenario d'uso
[Da compilare]

### Criteri di accettazione
- [Da compilare]

---

## RF-16 – Elenco dei dispositivi e uscita a distanza
**Priorità:** Must (da Should, DEC-132) · **Origine:** DEC-132 · **Fase:** 9 · **Stato:** In sviluppo

> Da ripensare (DEC-13, DEC-121): nell'architettura temporanea di DEC-121 tutti i dispositivi condividono il segreto dei gettoni e non se ne può far uscire uno solo; nell'architettura finale ognuno ha il suo gettone di rinnovo, che si può revocare. Senza web cade l'esempio del browser dimenticato aperto, e uscendo la copia di lavoro resta (RB-89).

Come *utente* voglio vedere l'elenco dei dispositivi da cui ho accesso e farne uscire uno a distanza, per chiudere un accesso dimenticato aperto, per esempio sul browser di un computer non mio (SF-26).

Nell'elenco: nome, tipo e ultima sincronizzazione di ogni dispositivo (EN-06), con il comando "Fai uscire". Al successivo contatto con il server, quel dispositivo si scollega come con «Esci»: la sincronizzazione si ferma e la copia di lavoro resta (scelta di Manuel Cucca il 14/10/2026, RB-89; RB-41 è superata).

**Collegamenti:** FL-00 · EN-06 · SC-00 · RF-14

### Scenario d'uso
Nello scenario d'uso di RF-14: chi perde il portatile vede dal computer fisso l'elenco dei dispositivi collegati e chiude quello perso (approvato da Manuel Cucca il 14/10/2026).

### Criteri di accettazione
Criteri scritti dall'agente da FL-15, RB-100 e dai mockup, approvati da Manuel Cucca il 14/10/2026.
- **CA-16.1** *Dato* più dispositivi collegati con lo stesso account, *quando* apro «Dispositivi collegati», *allora* vedo nome, tipo e ultima sincronizzazione di ognuno; questo dispositivo è il primo, segnato «questo dispositivo», senza «Scollega» (RB-100).
- **CA-16.2** *Dato* l'elenco, *quando* premo «Scollega» su un altro dispositivo, *allora* la sua riga chiede «Scollegare «nome»?» con «Annulla» e «Scollega»; «Annulla» torna alla riga, «Scollega» la toglie dall'elenco (SF-05).
- **CA-16.3** *Dato* un dispositivo scollegato a distanza, *quando* è acceso o quando lo riapro, *allora* alla prima richiesta smette di sincronizzare e compare «Accedi di nuovo per sincronizzare»; le note restano sul dispositivo (RB-89, SF-42).
- **CA-16.4** *Dato* il server irraggiungibile, *quando* apro «Dispositivi collegati», *allora* al posto dell'elenco compare «Server non raggiungibile. Riprova tra poco.» (SF-30).
- **CA-16.5** *Dato* il nome di un dispositivo cambiato nelle impostazioni, *quando* apro l'elenco da un altro computer, *allora* vedo il nome nuovo; sul server il nome sta solo cifrato (RB-51, DEC-08).
- **CA-16.6** *Dato* un dispositivo di un altro account, *quando* provo a scollegarlo con il suo identificativo, *allora* il server rifiuta e non dice che esiste (SF-34).

---

## Fuori dal modulo
Codici del registro idee esclusi da questo modulo:
- ID-03 – Modifica di file locali (parcheggiata)
- ID-05 – Più utenti sulla piattaforma (parcheggiata)
- ID-06 – Modalità offline o solo locale (parcheggiata)
