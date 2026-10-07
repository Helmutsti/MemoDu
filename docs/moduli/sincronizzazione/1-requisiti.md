# Sincronizzazione – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

## RF-10 – Sincronizzazione cloud cifrata end-to-end
**Priorità:** Must · **Origine:** DEC-01, DEC-02, DEC-06, DEC-121 · **Fase:** 9 (la cifratura con DEC-121: criteri e piano di test approvati il 06/10/2026, codice da fare) · **Stato:** Pronto

Come *utente* voglio che tutte le mie note siano sincronizzate nel cloud con cifratura end-to-end per avere l'intera struttura a disposizione su ogni dispositivo, senza che altri possano leggerla.

Il cloud è la fonte di verità. Sul dispositivo resta una copia di lavoro su cui avvengono tutte le operazioni: la sincronizzazione parte periodicamente in background. Senza connessione si continua a scrivere, e le modifiche si sincronizzano in automatico quando la rete torna (DEC-02).

Se una nota è stata modificata su un solo dispositivo, si salva la versione più aggiornata. Se la stessa nota è stata modificata su due dispositivi c'è un conflitto: il programma salva entrambe le versioni e nessun dato va perso (DEC-06): una resta la nota originale, l'altra diventa una nota indipendente nella stessa cartella, con lo stesso titolo seguito da "(copia in conflitto)" (RB-39).

Per sincronizzare il dispositivo deve aver fatto l'accesso (RF-14). La cifratura avviene sul dispositivo: le note si cifrano con la chiave dati, che si apre con la password o con la chiave di recupero; il server vede solo blocchi illeggibili (DEC-08, DEC-121).

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

---

## RF-14 – Accesso all'installazione
**Priorità:** Must · **Origine:** DEC-05, DEC-121 · **Fase:** 9 (criteri e piano di test approvati il 06/10/2026) · **Stato:** Pronto

Come *utente* voglio accedere una volta con email e password per sincronizzare le mie note cifrate, restare collegato senza ripetere l'accesso e poter uscire da un dispositivo.

- L'installazione è personale: un solo utente e nessuna registrazione (DEC-05, DEC-13). Per ora l'utente è fisso: lo crea, con email e password, un comando del server, e l'app non crea account (DEC-121).
- L'accesso avviene in SC-05 con email e password (RB-86). Dalla password, sul dispositivo, si ricavano la prova per il server e la chiave che apre la chiave dati: il server non vede mai né la password né la chiave (DEC-121).
- Dopo l'accesso si resta collegati: il gettone dura 30 giorni e l'app lo rinnova da sola (RB-86). Gettone e chiave dati stanno nel portachiavi del sistema.
- Senza accesso, o con il gettone scaduto o rifiutato, Memodu si apre comunque sulla copia di lavoro e non si blocca mai: le modifiche aspettano e un avviso porta a SC-05 (RB-87). Senza rete si lavora come sempre (DEC-02). L'avvio resta istantaneo (RNF-01).
- La password ha almeno 12 caratteri, senza regole di complessità, e non può essere una delle più comuni (RB-88).
- «Esci» nel box dell'account delle impostazioni (SC-06, DEC-122) scollega il dispositivo; la copia di lavoro resta (RB-89).
- Password persa: con la chiave di recupero stampata alla creazione dell'utente se ne sceglie una nuova senza perdere le note (RB-90, procedura nel runbook).
- Nessun limite ai tentativi di accesso, per ora (rinvio in `avanzamento.md`).

**Collegamenti:** FL-08 · EN-05 · EN-06 · SC-05 · SC-06 · RF-10 · RNF-02

### Scenario d'uso
Creo l'utente sul server con il comando, stampo la chiave di recupero e la metto al sicuro. Apro Memodu sul PC Windows: le note della copia di lavoro ci sono subito; dal box dell'account in cima alle impostazioni accedo con email e password e le note si sincronizzano cifrate. Faccio lo stesso sul Mac. Per un mese non devo più accedere; se un computer resta spento più a lungo, alla riapertura scrivo come sempre e un avviso mi chiede di accedere di nuovo.

### Criteri di accettazione
Scritti dall'agente dai flussi, dalle regole e dai mockup (FL-08, RB-86 … RB-90, DEC-121), approvati da Manuel Cucca il 06/10/2026. Numerati dopo quelli superati. Con DEC-122 la riga Account e la sezione Sincronizzazione diventano il box dell'account in cima a SC-06: CA-14.8, CA-14.9 e CA-14.14 si riscrivono in Fase 6, dopo i mockup nuovi.
- **CA-14.7** *Dato* il comando che crea l'utente, *quando* gli do email e una password di almeno 12 caratteri che non sia tra le più comuni, *allora* stampa le righe delle variabili del server e, una volta sola, la chiave di recupero; con una password più corta o comune la rifiuta e dice perché. Password, prova e chiavi non finiscono mai nel registro (RB-88, RB-90).
- **CA-14.8** *Dato* un dispositivo senza accesso, *quando* apro Memodu, *allora* la finestra si apre subito sulla copia di lavoro, senza sincronizzare e senza avvisi; nella sezione Sincronizzazione delle impostazioni la riga Account dice «Non hai fatto l'accesso» con Accedi (RB-87, DEC-84).
- **CA-14.9** *Dato* SC-05 aperta da Accedi, *quando* inserisco email e password giuste e premo Accedi (o Invio), *allora* il pulsante va in caricamento, la finestra si chiude, la sincronizzazione parte e la riga Account mostra l'email con Esci (RB-86).
- **CA-14.10** *Dato* SC-05, *quando* sbaglio email o password, *allora* compare «Email o password non corrette.» sopra i pulsanti, l'email resta scritta e posso riprovare quante volte voglio (RB-86).
- **CA-14.11** *Dato* SC-05 e il server irraggiungibile, *quando* premo Accedi, *allora* compare sopra i pulsanti «Non riesco a raggiungere il server. Riprova tra poco.» e posso continuare a scrivere sulla copia di lavoro (DEC-02).
- **CA-14.12** *Dato* un dispositivo che ha fatto l'accesso, *quando* chiudo e riapro Memodu, *allora* non mi chiede di accedere; quando al gettone mancano meno di 7 giorni l'app lo rinnova da sola, senza chiedere nulla (RB-86).
- **CA-14.13** *Dato* il gettone scaduto o rifiutato (per esempio dopo il cambio del segreto sul server), *quando* l'app prova a sincronizzare, *allora* la finestra non si blocca, continuo a scrivere e compare l'avviso «Accedi di nuovo per sincronizzare. Le modifiche restano su questo computer.»; Accedi apre SC-05 e, dopo l'accesso, le modifiche fatte nel frattempo arrivano sugli altri dispositivi (RB-87).
- **CA-14.14** *Dato* un dispositivo collegato con modifiche in attesa, *quando* premo Esci, *allora* le modifiche partono, gettone e chiave dati spariscono dal portachiavi, la copia di lavoro resta e la riga Account torna a «Non hai fatto l'accesso» (RB-89).
- **CA-14.15** *Dato* SC-05 aperta dall'avviso dell'accesso scaduto, *quando* premo «Non voglio usare il cloud», *allora* il dispositivo si scollega come con Esci, le modifiche in attesa restano sulla copia di lavoro e l'avviso non torna riaprendo Memodu; con Esc invece la finestra si chiude soltanto e l'avviso torna alla riapertura (RB-89).
- **CA-14.16** *Dato* la password persa e la chiave di recupero, *quando* rilancio il comando con la chiave di recupero e una password nuova e metto le variabili nuove sul server, *allora* accedo con la password nuova e leggo tutte le note senza che vengano ricifrate; la password vecchia è rifiutata (RB-90).
- **CA-14.17** *Dato* una richiesta di accesso, *quando* guardo cosa arriva al server e il suo registro, *allora* non ci sono mai la password, la chiave di recupero o la chiave dati in chiaro (DEC-121).

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

**Collegamenti:** FL-00 · EN-00 · SC-00 · RF-04 · RF-10

### Scenario d'uso
[Da compilare]

### Criteri di accettazione
- [Da compilare]

---

## RF-16 – Elenco dei dispositivi e uscita a distanza
**Priorità:** Should · **Origine:** — · **Fase:** 1 · **Stato:** In progettazione

> Da ripensare (DEC-13, DEC-121): nell'architettura temporanea di DEC-121 tutti i dispositivi condividono il segreto dei gettoni e non se ne può far uscire uno solo; nell'architettura finale ognuno ha il suo gettone di rinnovo, che si può revocare. Senza web cade l'esempio del browser dimenticato aperto, e uscendo la copia di lavoro resta (RB-89).

Come *utente* voglio vedere l'elenco dei dispositivi da cui ho accesso e farne uscire uno a distanza, per chiudere un accesso dimenticato aperto, per esempio sul browser di un computer non mio (SF-26).

Nell'elenco: nome, tipo e ultima sincronizzazione di ogni dispositivo (EN-06), con il comando "Fai uscire". Al successivo contatto con il server, quel dispositivo esce e cancella la copia di lavoro (RB-41).

**Collegamenti:** FL-00 · EN-06 · SC-00 · RF-14

### Scenario d'uso
[Da compilare]

### Criteri di accettazione
- [Da compilare]

---

## Fuori dal modulo
Codici del registro idee esclusi da questo modulo:
- ID-03 – Modifica di file locali (parcheggiata)
- ID-05 – Più utenti sulla piattaforma (parcheggiata)
- ID-06 – Modalità offline o solo locale (parcheggiata)
