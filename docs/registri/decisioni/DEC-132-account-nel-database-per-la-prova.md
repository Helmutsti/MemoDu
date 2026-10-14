# DEC-132 – Account nel database, per più persone in prova

**Data:** 2026-10-13 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-121 l'accesso funziona con un utente fisso, i cui dati stanno nelle variabili d'ambiente del server (architettura temporanea); sincronizzazione e cifratura end-to-end sono già quelle definitive. Manuel Cucca vuole far provare Memodu ad altre persone, ognuna con il suo account, e passare all'accesso definitivo con gli account nel database. Restano il database Neon di oggi e il server su Vercel: nessun ambiente di produzione separato per ora. DEC-13 (un solo utente, senza registrazione) e il rinvio del limite ai tentativi «prima di dare Memodu ad altre persone» (DEC-121) vanno rivisti.

## Opzioni valutate
Come nascono gli account:
A) Li crea Manuel Cucca con un comando che scrive nel database.
B) Invito con un codice, e la persona si iscrive dall'app.
C) Iscrizione libera dall'app.

Recupero della password dimenticata:
A) Chiave di recupero dell'utente, come in DEC-121.
B) Recupero da un dispositivo già collegato.
C) Chiave tenuta dal server, con recupero via email: chi gestisce il server potrebbe leggere le note.
D) Nessun recupero.

Limite ai tentativi di accesso:
A) Blocco crescente per email. B) Blocco fisso. C) Nessun limite durante la prova.

## Decisione
Scelte di Manuel Cucca del 13/10/2026:
- **Più utenti, solo per la prova**, sul database Neon e sul server di oggi. Niente iscrizione dall'app: gli account li crea Manuel Cucca con un comando che scrive nel database (A).
- **Architettura finale di DEC-121** per tutto il resto: una riga per utente in una tabella degli utenti, con gli stessi dati che oggi stanno nelle variabili d'ambiente; l'utente fisso di oggi diventa la prima riga, con la stessa chiave dati, quindi le sue note non si ricifrano. Ogni dispositivo ha il suo gettone di rinnovo, conservato solo come impronta e revocabile da solo. Sul server i blocchi di ogni utente sono separati e nessuno legge quelli degli altri.
- **L'accesso di un dispositivo non scade** (supera i 90 giorni di DEC-121): dura finché si esce o finché lo si chiude a distanza.
- **Recupero con la chiave di recupero** (A), come in DEC-121. Durante la prova Manuel Cucca conserva le chiavi di recupero di tutti: con quelle potrebbe leggere le loro note, e chi prova l'app lo sa.
- **Nessun limite ai tentativi di accesso durante la prova** (C): rischio accettato, da rivedere prima di un uso vero.
- **Dall'app** l'utente può: cambiare la password, recuperare l'account con la chiave di recupero scegliendo una password nuova, vedere i propri dispositivi collegati e chiuderne uno. RF-16 rientra nel lavoro.

## Conseguenze
- Supera DEC-13 per il solo utente (resta: niente registrazione, solo Windows e macOS, web rinviato) e DEC-121 per l'architettura temporanea, la durata dei gettoni e il comando dell'utente fisso.
- Requisiti da riaprire dalla Fase 1: RF-14 (cambio della password e recupero dall'app), RF-16 (elenco dei dispositivi e uscita a distanza, da Should a Must per la prova); da rivedere RF-10 per gli utenti separati sul server.
- Da aggiornare: EN-05 (utente), EN-06 (dispositivo), SC-05, SC-06, `architettura/architettura.md`, `architettura/api.md`, `rilascio/runbook.md` (creare un account, recupero, dispositivo perso), `generale/visione.md`, guida per gli utenti.
- Schema del deposito sul server: tabelle degli utenti e dei gettoni di rinnovo, blocchi e versioni legati all'utente.
- `avanzamento.md`: rischi accettati (nessun limite ai tentativi con più persone; Manuel Cucca tiene le chiavi di recupero di tutti, nessun backup completo del database che contiene anche le note vere di Manuel Cucca).
