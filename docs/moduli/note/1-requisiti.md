# Note – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

La scrittura viene prima di tutto: aprire l'app e iniziare a scrivere deve essere immediato (`RNF-01`).

## RF-01 – Nota rapida da scorciatoia
**Priorità:** Must · **Origine:** — · **Stato:** In progettazione

Come *utente desktop* voglio aprire con una scorciatoia da tastiera una finestra di nota rapida per annotare un'idea senza interrompere quello che sto facendo.

Dalla nota rapida l'utente può:
- aprire l'app completa, senza perdere quanto scritto;
- salvare e tornare alle altre attività.

Il programma completo mostra una nota alla volta: se la nota rapida viene aperta nel programma completo, la nota che era aperta viene salvata e chiusa, e al suo posto compare la nota rapida.

Piattaforme:
- **Desktop (Windows, macOS):** la scorciatoia è globale, funziona da qualsiasi programma e l'utente può cambiarla (RF-11). Memodu resta attivo in background, con un'icona nell'area di notifica (Windows) o nella barra dei menu (macOS); l'avvio automatico all'accensione è opzionale.
- **Web:** la nota rapida non esiste; si usa la normale creazione di una nota.

**Collegamenti:** FL-00 · EN-00 · SC-00 · RNF-01

### Scenario d'uso
Premo la scorciatoia e compare la finestra della nota rapida. A quel punto posso decidere di aprire il programma completo senza perdere la nota, oppure salvare e chiudere la finestra. Se nel programma è già aperta un'altra nota, viene semplicemente salvata e messa da parte.

### Criteri di accettazione
- [Da compilare]

---

## RF-02 – Scrittura in markdown con formattazione minima
**Priorità:** Must · **Origine:** — · **Stato:** In progettazione

Come *utente* voglio scrivere note in markdown con una formattazione minima per prendere appunti strutturati e produrre documenti formattati.

Formattazioni previste:
- corsivo;
- grassetto;
- sottolineato;
- barrato;
- titoli e sottotitoli;
- elenchi puntati, numerati e checklist.

**Collegamenti:** FL-00 · EN-00 · SC-00

### Scenario d'uso
Scrivo la nota e inserisco un'immagine trascinandola nel testo, oppure premendo il pulsante degli allegati. Sull'immagine inserita posso poi aprire delle impostazioni, in stile Word.

### Criteri di accettazione
- [Da compilare]

---

## RF-03 – Allegati e immagini
**Priorità:** Must · **Origine:** — · **Stato:** In progettazione

Come *utente* voglio allegare file e inserire immagini nelle note per tenere insieme testo e materiali collegati.

Si inseriscono trascinando il file nel testo oppure con il pulsante degli allegati. Sulle immagini inserite si possono impostare:
- dimensione;
- allineamento (a sinistra, al centro, a destra), sempre su una riga a sé, senza testo che scorre attorno (ID-07);
- ritaglio;
- testo alternativo: di default è il nome del file, e l'utente può cambiarlo nelle impostazioni dell'immagine (RNF-04).

**Collegamenti:** FL-00 · EN-00 · SC-00 · RNF-04

### Scenario d'uso
Condiviso con RF-02: vedi lo scenario di RF-02.

### Criteri di accettazione
- [Da compilare]

---

## RF-04 – Metadati della nota
**Priorità:** Must · **Origine:** — · **Stato:** In progettazione

Come *utente* voglio associare dei metadati a ogni nota per descriverla con titolo, date e tag.

| Metadato | Chi lo imposta | Note |
|---|---|---|
| Titolo | Utente | |
| Data di creazione di sistema | Sistema | Non modificabile. Sempre visibile nei dettagli della nota |
| Data di creazione scelta dall'utente | Utente | È la data di creazione mostrata; se l'utente non la imposta, si mostra quella di sistema |
| Data di ultima modifica | Sistema | |
| Tag | Utente | Gli stessi tag di `RF-06` |
| Data di fine validità | Utente | Solo informativa: alla scadenza non succede nulla |

**Collegamenti:** FL-00 · EN-00 · SC-00 · RF-06

### Scenario d'uso
Scrivo la nota. Le note non ancora organizzate compaiono in una barra laterale e da lì le trascino nell'albero delle cartelle. Quando apro una nota, dal menu in alto a destra posso aggiungere tag, spostarla in un'altra cartella o modificarne i metadati. Il titolo è l'unico metadato che modifico direttamente nella schermata di scrittura.

### Criteri di accettazione
- [Da compilare]

---

## Fuori dal modulo
Codici del registro idee esclusi da questo modulo:
- ID-01 – Note in testo semplice (parcheggiata)
- ID-07 – Impaginazione e funzioni da programma di videoscrittura (rifiutata)
- ID-08 – Scrittura a mano con penna (rifiutata)
