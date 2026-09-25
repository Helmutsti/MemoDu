# Sincronizzazione – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

## RF-10 – Sincronizzazione cloud cifrata end-to-end
**Priorità:** Must · **Origine:** DEC-01, DEC-02, DEC-06, DEC-13 · **Fase:** 4 · **Stato:** In progettazione

Come *utente* voglio che tutte le mie note siano sincronizzate nel cloud con cifratura end-to-end per avere l'intera struttura a disposizione su ogni dispositivo, senza che altri possano leggerla.

Il cloud è la fonte di verità. Sul dispositivo resta una copia di lavoro su cui avvengono tutte le operazioni: la sincronizzazione parte periodicamente in background. Senza connessione si continua a scrivere, e le modifiche si sincronizzano in automatico quando la rete torna (DEC-02).

Se una nota è stata modificata su un solo dispositivo, si salva la versione più aggiornata. Se la stessa nota è stata modificata su due dispositivi c'è un conflitto: il programma salva entrambe le versioni e nessun dato va perso (DEC-06): una resta la nota originale, l'altra diventa una nota indipendente nella stessa cartella, con il titolo seguito da dispositivo e ora (es. "Riunione (conflitto, portatile, 24/09 10:32)").

Per sincronizzare il dispositivo usa le credenziali preimpostate dell'installazione, senza login (RF-14, DEC-13).

**Collegamenti:** FL-07 · EN-06 · EN-08 · SC-00 · RNF-02

### Scenario d'uso
Lavoro su due dispositivi e ognuno accumula modifiche e nuove note. Se entrambi hanno modificato la stessa nota c'è un conflitto: il programma salva entrambe le versioni. È una soluzione rudimentale, ma la perdita di dati è inconcepibile.

### Criteri di accettazione
- [Da compilare]

---

## RF-14 – Collegamento all'installazione
**Priorità:** Must · **Origine:** DEC-05, DEC-13 · **Fase:** 4 · **Stato:** In progettazione

Come *utente* voglio che Memodu si colleghi da solo alla mia installazione per sincronizzare le note senza dover mai accedere.

- L'installazione è personale: un solo utente e nessuna registrazione pubblica (DEC-05, DEC-13).
- Installando il server si generano le credenziali dell'installazione; si scrivono nel file di configurazione dell'app quando la si installa (RB-54).
- Non esistono schermate di accesso, email, password né comandi di uscita. L'avvio resta istantaneo (RNF-01).
- Il recupero delle credenziali perse è rimandato (vedi domande aperte su RF-10).

**Collegamenti:** FL-08 · EN-05 · EN-06 · SC-00 · RF-10 · RNF-02

### Scenario d'uso
Installo Memodu sul mio server e ottengo le credenziali dell'installazione. Installo l'app sul PC Windows con quelle credenziali: la apro e le mie note si sincronizzano, senza accedere. Faccio lo stesso sul Mac.

### Criteri di accettazione
- [Da compilare]

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

> Da ripensare (DEC-13): con credenziali uguali per tutti i dispositivi non si può far uscire un solo dispositivo, e senza web cade l'esempio del browser dimenticato aperto.

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
