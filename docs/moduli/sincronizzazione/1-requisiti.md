# Sincronizzazione – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

## RF-10 – Sincronizzazione cloud cifrata end-to-end
**Priorità:** Must · **Origine:** DEC-01, DEC-02, DEC-05, DEC-06 · **Stato:** In progettazione

Come *utente* voglio che tutte le mie note siano sincronizzate nel cloud con cifratura end-to-end per avere l'intera struttura a disposizione su ogni dispositivo, senza che altri possano leggerla.

Il cloud è la fonte di verità. Sul dispositivo resta una copia di lavoro su cui avvengono tutte le operazioni: la sincronizzazione parte periodicamente in background. Senza connessione si continua a scrivere, e le modifiche si sincronizzano in automatico quando la rete torna (DEC-02).

Se una nota è stata modificata su un solo dispositivo, si salva la versione più aggiornata. Se la stessa nota è stata modificata su due dispositivi c'è un conflitto: il programma salva entrambe le versioni e nessun dato va perso (DEC-06): una resta la nota originale, l'altra diventa una nota indipendente nella stessa cartella, con il titolo seguito da dispositivo e ora (es. "Riunione (conflitto, portatile, 24/09 10:32)").

Per sincronizzare si accede con email e password all'unico account dell'installazione (RF-14, DEC-05).

**Collegamenti:** FL-07 · EN-06 · EN-08 · SC-00 · RNF-02

### Scenario d'uso
Lavoro su due dispositivi e ognuno accumula modifiche e nuove note. Se entrambi hanno modificato la stessa nota c'è un conflitto: il programma salva entrambe le versioni. È una soluzione rudimentale, ma la perdita di dati è inconcepibile.

### Criteri di accettazione
- [Da compilare]

---

## RF-14 – Accesso all'installazione
**Priorità:** Must · **Origine:** DEC-05 · **Stato:** In progettazione

Come *utente* voglio accedere a Memodu con email e password per sincronizzare le mie note e usarle da ogni dispositivo, anche dal browser.

- L'installazione è personale: esiste un solo account, creato alla prima installazione, e non c'è registrazione pubblica (DEC-05).
- Dopo l'accesso si resta collegati su ogni dispositivo, browser compreso, finché non si esce manualmente. Così l'avvio resta istantaneo (RNF-01).
- Email e password si possono cambiare dalle impostazioni (RB-50).
- Il recupero della password è rimandato (vedi domande aperte su RF-10).

**Collegamenti:** FL-08 · EN-05 · EN-06 · SC-00 · RF-10 · RNF-02

### Scenario d'uso
Installo Memodu sul mio server e, al primo avvio, creo l'unico account con email e password. Poi apro l'app sul PC Windows, inserisco email e password e le mie note si sincronizzano; faccio lo stesso sul Mac. Quando sono su un computer non mio, apro Memodu dal browser e accedo allo stesso modo.

### Criteri di accettazione
- [Da compilare]

---

## RF-13 – Importazione ed esportazione delle note
**Priorità:** Should · **Origine:** ID-09 · **Stato:** In progettazione

Come *utente* voglio importare ed esportare le mie note in file markdown standard, con allegati e metadati, per non restare legato a Memodu e poter portare i miei dati dove voglio.

Anche se si sviluppa dopo la prima fase, il modo in cui si salvano le note deve renderla possibile fin dall'inizio.

**Collegamenti:** FL-00 · EN-00 · SC-00 · RF-04 · RF-10

### Scenario d'uso
[Da compilare]

### Criteri di accettazione
- [Da compilare]

---

## RF-16 – Elenco dei dispositivi e uscita a distanza
**Priorità:** Should · **Origine:** — · **Stato:** In progettazione

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
