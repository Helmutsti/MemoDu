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
Frammento Must B «Smistare» (DEC-36): cartelle come sottocartelle di Documenti/Memodu. I tag e il menu `···` completo arrivano con i loro requisiti.

- **CA-05.1** *Dato* l'albero con cartelle, sottocartelle e note, *quando* apro una cartella, *allora* compaiono prima le sottocartelle e poi le sue note, ognuna in ordine alfabetico senza distinguere maiuscole e minuscole, con il titolo delle note allineato al nome delle sottocartelle (RB-64, RB-65, CMP-14).
- **CA-05.2** *Dato* l'albero, *allora* accanto a ogni cartella e alle Non organizzate c'è il numero di note contenute, sottocartelle comprese e senza quelle nel cestino, e si aggiorna subito dopo ogni spostamento o eliminazione (RB-56).
- **CA-05.3** *Dato* una nota non organizzata, *quando* la trascino su una cartella, *allora* durante il trascinamento la cartella si evidenzia, al rilascio la nota esce dalle non organizzate e compare nella cartella, e sul disco il file è nella sottocartella con lo stesso nome (FL-05, DEC-36).
- **CA-05.4** *Dato* una nota aperta, *quando* scelgo «Sposta in…» dal menu `···` e poi una cartella o «Non organizzate», *allora* la nota si sposta, resta aperta, e nella colonna la cartella di destinazione si apre con la nota selezionata; nel pannello la cartella attuale ha la spunta e scrivendo nel campo l'albero si filtra (RB-66, CMP-11).
- **CA-05.5** *Dato* l'albero, *quando* premo il + delle Cartelle o «Nuova sottocartella» dal tasto destro su una cartella, *allora* compare al suo posto in ordine alfabetico il campo con «Nuova cartella» selezionato (con un numero se esiste già); Invio crea la cartella con il nome scritto, Esc la annulla e non nasce niente (RB-48).
- **CA-05.6** *Dato* una cartella, *quando* scelgo «Rinomina» dal tasto destro o premo F2 e confermo con Invio, *allora* la cartella cambia nome in Memodu e sul disco; Esc riporta il nome di prima; i caratteri vietati (`< > : " / \ | ? *`) diventano `-` senza avvisi (RB-48, RB-63).
- **CA-05.7** *Dato* un nome che nella destinazione esiste già, anche con maiuscole diverse, *quando* creo, rinomino o sposto una cartella, *allora* compare la finestra «Esiste già «‹nome›» in ‹cartella›» con Annulla (nessuna modifica), Unisci (il contenuto si unisce e per ogni sottocartella omonima la finestra ricompare) e Aggiungi un numero («‹nome› (2)») (RB-23, RB-31, SF-19).
- **CA-05.8** *Dato* una cartella, *quando* la trascino dentro sé stessa o dentro una sua sottocartella, *allora* la destinazione non si evidenzia e al rilascio non cambia niente (RB-24, SF-18).
- **CA-05.9** *Dato* una cartella, *quando* scelgo «Nuova nota qui» dal tasto destro, *allora* nasce una nota vuota in quella cartella, aperta con il cursore nel corpo; il + delle Non organizzate invece crea sempre nella radice (RB-09).
- **CA-05.10** *Dato* una cartella o una nota tolta dal disco da fuori Memodu, *quando* provo a spostarla, rinominarla o eliminarla, *allora* compare l'avviso «Non è stato possibile completare l'operazione. La colonna mostra com'è adesso.» e la colonna si ricarica (SF-32, DEC-37).
- **CA-05.11** *Dato* il solo uso della tastiera, *allora* nella colonna le frecce su e giù passano da una riga all'altra, destra e sinistra aprono e chiudono le cartelle, Invio apre la nota e F2 rinomina la cartella in focus; un lettore di schermo annuncia la colonna come albero, con livello e stato aperta o chiusa (CMP-06, CMP-14, RNF-04).
- **CA-05.12** *Dato* nessuna cartella, *allora* sotto il titolo Cartelle compare «Nessuna cartella. Creane una con +» (SF-16).

---

## RF-06 – Tag
**Priorità:** Must · **Origine:** — · **Fase:** 6 · **Stato:** In progettazione

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
- [Da compilare]

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
Frammento Must B «Smistare» (DEC-36): cestino nella cartella nascosta `.cestino`. Le note nel cestino nella ricerca (RB-29) arrivano con la ricerca (RF-08).

- **CA-15.1** *Dato* una nota aperta, *quando* scelgo «Elimina» dal menu `···`, *allora* la nota va nel cestino senza conferma, sparisce dalla colonna e l'area della nota mostra «Nessuna nota aperta» (RB-26, RB-67).
- **CA-15.2** *Dato* una cartella, *quando* scelgo «Elimina» dal tasto destro, *allora* va nel cestino con tutte le note e le sottocartelle, senza conferma; se dentro c'era la nota aperta, l'area della nota mostra lo stato vuoto (RB-25, RB-67).
- **CA-15.3** *Dato* un trascinamento di una nota o di una cartella, *allora* in fondo alla colonna compare «Trascina qui per eliminare»; sopra diventa rosso con «Rilascia per spostare nel cestino», e al rilascio l'elemento va nel cestino (CMP-14, RB-25, RB-26).
- **CA-15.4** *Dato* il cestino con elementi, *quando* lo apro da «Cestino» nel menu `···`, *allora* vedo gli elementi dal più recente, ognuno con nome, tipo, provenienza e data («Nota · da Lavoro › Clienti · eliminata il 24/09/2026»), Ripristina ed Elimina definitivamente (SC-04, CMP-17).
- **CA-15.5** *Dato* un elemento nel cestino, *quando* premo Ripristina, *allora* sparisce dal cestino e torna nella radice: la nota tra le non organizzate, la cartella al primo livello con tutto il contenuto; se al primo livello c'è già una cartella con quel nome compare la finestra con tre scelte (RB-28, RB-31).
- **CA-15.6** *Dato* un elemento nel cestino, *quando* premo Elimina definitivamente, *allora* compare «Eliminare per sempre «‹nome›»?»; Annulla lo lascia nel cestino, «Elimina definitivamente» lo cancella dal disco (RB-55, DEC-17).
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
**Priorità:** Must · **Origine:** — · **Fase:** 6 · **Stato:** In progettazione

Come *utente* voglio cercare e filtrare le note per trovare subito quella che mi serve.

La ricerca e il filtro agiscono su:
- titolo;
- testo della nota;
- tag, sotto-tag compresi (RF-06);
- date dei metadati: creazione, ultima modifica, fine validità (RF-04).

Con la cifratura end-to-end (RF-10) il server non legge le note: la ricerca nel testo avviene sul dispositivo.

Le note nel cestino compaiono tra i risultati, segnalate come "nel cestino"; si possono escludere con una preferenza nelle impostazioni (RB-29).

**Collegamenti:** FL-06 · EN-01 · EN-04 · EN-07 · SC-00 · RF-04 · RF-06 · RF-10

### Scenario d'uso
Inizio a scrivere nella barra di ricerca dell'interfaccia e i risultati compaiono in sovraimpressione, in una card a discesa.

### Criteri di accettazione
- [Da compilare]

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
