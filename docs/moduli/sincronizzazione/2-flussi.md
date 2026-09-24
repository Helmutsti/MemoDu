# Sincronizzazione – Flussi

<!-- Fase 2 della guida. I diagrammi si scrivono in Mermaid. -->

## FL-07 – Sincronizzare
**Requisito:** RF-10 · **Attori:** Utente, Sistema (sincronizzazione in background)

```mermaid
flowchart TD
    A[Lavoro sulla copia di lavoro: tutte le operazioni sono locali - DEC-02] --> B[Periodicamente parte la sincronizzazione in background]
    B --> C{Il server è raggiungibile?}
    C -- No --> D{Da quanto non si sincronizza?}
    D -- Poco --> A
    D -- Oltre la soglia --> W[Avviso: modifiche non sincronizzate - RB-40]
    W --> A
    C -- Sì --> E{L'accesso è valido?}
    E -- No --> V[Avviso: accesso scaduto o revocato - RB-40]
    E -- Sì --> F[Invio le modifiche cifrate e ricevo quelle degli altri dispositivi]
    F --> G{Errore di sincronizzazione?}
    G -- Sì --> U[Avviso: errore di sincronizzazione - RB-40]
    G -- No --> H{Lo stesso elemento è cambiato su due dispositivi?}
    H -- No --> I[Si tiene la versione più aggiornata]
    H -- Sì --> J{Che tipo di conflitto?}
    J -- Testo della nota --> K[Nasce una nota in conflitto nella stessa cartella + avviso - DEC-06, RB-39]
    J -- Eliminata e modificata --> L[Vince l'azione più recente - RB-36]
    J -- Nota spostata --> M[Vince la posizione più recente - RB-37]
    J -- Cartella rinominata --> N[Nome più recente + cartella vuota con l'altro nome - RB-38]
    J -- Nota finita in una cartella eliminata --> O[La cartella torna dal cestino - RB-30]
    I --> A
    K --> A
    L --> A
    M --> A
    N --> A
    O --> A
```

### Percorsi alternativi
- **Senza rete:** si continua a scrivere; le modifiche partono appena la rete torna (DEC-02).
- **Nessun problema:** la sincronizzazione è invisibile, non c'è nessun indicatore (RB-40).

### Sfighe gestite
| Sfiga | Rilevamento | Comunicazione | Via d'uscita |
|---|---|---|---|
| SF-08 Connessione che cade a metà | La sincronizzazione non si completa | Nessun messaggio, se dura poco | Riprova alla sincronizzazione successiva (DEC-02) |
| SF-20 Riferimenti spariti | Nota creata o spostata in una cartella eliminata altrove | Nessun messaggio | La cartella torna dal cestino (RB-30) |
| SF-22 Modifica simultanea | Lo stesso elemento cambiato su due dispositivi | Avviso solo per le note in conflitto (RB-39) | DEC-06, RB-36, RB-37, RB-38 |
| SF-25 Accesso revocato | Il server rifiuta l'accesso | Avviso (RB-40) | Nuovo accesso (FL-08) |
| SF-30 Servizio esterno fuori uso | Server irraggiungibile oltre la soglia | Avviso (RB-40) | Le modifiche restano sulla copia di lavoro finché il server non torna |
| SF-31 Notifiche perse | Un conflitto avviene mentre l'utente non guarda | L'avviso resta finché non viene visto | La nota in conflitto resta nella cartella, riconoscibile dal titolo (DEC-06) |
| SF-32 Errore a metà operazione | Errore durante l'invio o la ricezione | Avviso (RB-40) | Riprova alla sincronizzazione successiva; la copia di lavoro resta intatta |

### Sfighe considerate e scartate
- SF-01 … SF-07: la sincronizzazione non richiede azioni dell'utente.
- SF-12 Sessione scaduta: si resta collegati (RF-14); un accesso non più valido è SF-25.
- SF-14 Fusi orari: il confronto "più recente" tra dispositivi in fusi diversi si risolve in Fase 7.
- SF-33 Versioni diverse di app e server: si risolve in Fase 7.
- SF-34 … SF-36: il contenuto viaggia cifrato end-to-end (RNF-02); l'accesso è trattato in FL-08.

---

## FL-08 – Accedere
**Requisito:** RF-14 · **Attori:** Utente

```mermaid
flowchart TD
    A{Primo avvio dell'installazione?} -- Sì --> B[Creo l'unico account con email e password - DEC-05, RB-43]
    B --> E
    A -- No --> C[Apro Memodu su un dispositivo]
    C --> D{Sono già collegato?}
    D -- Sì --> F[Le note sono subito disponibili - RNF-01]
    D -- No --> E[Inserisco email e password]
    E --> G{Credenziali corrette?}
    G -- No --> E
    G -- Sì --> H[Resto collegato finché non esco - RF-14]
    H --> F
    F --> I{Esco?}
    I -- No --> F
    I -- Sì --> J{Ci sono modifiche non sincronizzate?}
    J -- No --> K[La copia di lavoro sul dispositivo viene cancellata - RB-41]
    J -- Sì --> L[Esco subito; la copia resta cifrata finché le modifiche non si sincronizzano, poi si cancella - RB-44]
```

### Percorsi alternativi
- **Password errata:** si può riprovare senza limiti (RB-42).
- **Password dimenticata:** il recupero è rimandato (domanda aperta su RF-10).
- **Cambio di email o password:** dalle impostazioni, inserendo la password attuale; cambiando password gli altri dispositivi devono accedere di nuovo (RB-50).

### Sfighe gestite
| Sfiga | Rilevamento | Comunicazione | Via d'uscita |
|---|---|---|---|
| SF-07 Dimenticanze | Password dimenticata | Da definire | Rimandato: blocca la Definition of Ready di RF-14 |
| SF-08 Connessione che cade a metà | Uscita senza rete | Nessun messaggio | La copia resta cifrata finché non si sincronizza (RB-44) |
| SF-25 Accesso revocato | Il server rifiuta l'accesso | Avviso (RB-40) | Nuovo accesso |
| SF-26 Accesso via link diretto | Computer non proprio lasciato collegato | Nessun messaggio | Uscire cancella la copia di lavoro (RB-41) |
| SF-35 Tentativi ripetuti | Molti tentativi con password sbagliata | Nessun messaggio | Nessuna protezione: rischio accettato (DEC-07) |

### Sfighe considerate e scartate
- SF-01 Doppio invio: accedere due volte non crea nulla di diverso.
- SF-12 Sessione scaduta: si resta collegati finché non si esce (RF-14).
- SF-19 Duplicati, SF-27 Account non verificato: esiste un solo account, senza registrazione pubblica (DEC-05).
- SF-36 Input malevolo: le credenziali non vengono eseguite né mostrate (RB-08).
- Le altre sfighe non riguardano l'accesso.

---

## Regole di business
| Codice | Regola | Usata in |
|---|---|---|
| RB-36 | Se una nota è stata eliminata su un dispositivo e modificata su un altro, vince l'azione più recente: se è la modifica, la nota esce dal cestino con le modifiche; se è l'eliminazione, la nota resta nel cestino con le modifiche comprese | FL-07 |
| RB-37 | Se una nota è stata spostata in cartelle diverse su due dispositivi, resta nella posizione più recente | FL-07 |
| RB-38 | Se una cartella è stata rinominata in modo diverso su due dispositivi, prende il nome più recente; accanto nasce una cartella vuota con l'altro nome, come segnale del conflitto | FL-07 |
| RB-39 | Quando nasce una nota in conflitto (DEC-06) compare un avviso con il collegamento alla nota. La nota in conflitto ha lo stesso titolo seguito da "(copia in conflitto)" | FL-07 |
| RB-40 | La sincronizzazione è invisibile finché va tutto bene. Compare un avviso solo per: errore di sincronizzazione (subito), accesso scaduto o revocato (subito), server irraggiungibile oltre una soglia (valore indicativo 24 ore, da fissare in Fase 7) | FL-07 |
| RB-41 | Uscendo (logout), le modifiche in attesa vengono sincronizzate e poi la copia di lavoro su quel dispositivo viene cancellata | FL-08 |
| RB-42 | Non c'è limite ai tentativi di accesso con password sbagliata (rischio accettato, DEC-07) | FL-08 |
| RB-43 | La password non ha requisiti di lunghezza o complessità (rischio accettato, DEC-07) | FL-08 |
| RB-44 | Se all'uscita ci sono modifiche non sincronizzate, l'uscita avviene subito ma la copia di lavoro resta, cifrata e illeggibile senza password, finché le modifiche non si sincronizzano; poi si cancella. Sul web la sincronizzazione può riprendere solo quando Memodu viene riaperto in quel browser | FL-08 |
| RB-50 | Email e password si cambiano dalle impostazioni inserendo la password attuale. Cambiando password le note vengono ricifrate e gli altri dispositivi devono accedere di nuovo | FL-08 |
| RB-51 | Il nome di un dispositivo viene preso dal sistema (es. nome del PC, "Chrome su Windows") e si può cambiare dalle impostazioni | FL-07, FL-08 |
| RB-53 | Gli avvisi si sincronizzano: compaiono su tutti i dispositivi e, visti su uno, non si mostrano più su nessuno | FL-07 |
