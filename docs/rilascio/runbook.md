# Runbook

<!-- Fase 9 della guida. Per chi gestisce il sistema. -->

## Installazione e aggiornamento
[Da compilare]

## Backup e ripristino
[Da compilare]

## Monitoraggio
| Cosa si controlla | Soglia di allarme | Chi viene avvisato |
|---|---|---|
| | | |

## Se succede X, fai Y
### Password persa (DEC-121, quando il codice c'è)
**Sintomi:** non ricordi la password dell'utente fisso.
**Cosa fare:**
1. Prendi il foglio con la chiave di recupero.
2. Rilancia il comando dell'API che crea l'utente, con la chiave di recupero e la password nuova (almeno 12 caratteri, RB-88): riusa la stessa chiave dati, quindi le note non si ricifrano.
3. Su Vercel, progetto dell'API › Settings › Environment Variables: metti i valori nuovi e rifai il deploy.
4. Su ogni dispositivo compare «Accedi di nuovo per sincronizzare»: accedi con la password nuova.

Senza il foglio e senza la password le note sul server non si recuperano: restano solo le copie di lavoro dei dispositivi (RB-90).

### Dispositivo perso, o chiave di recupero finita in mani sbagliate (DEC-121, quando il codice c'è)
**Cosa fare:**
1. Dispositivo perso: cambia `MEMODU_SEGRETO` su Vercel e rifai il deploy; tutti i gettoni smettono di valere e ogni dispositivo rifà l'accesso. Cambia anche la password se poteva essere salvata su quel dispositivo.
2. Chiave di recupero in mani sbagliate: rilancia il comando per creare una chiave di recupero nuova e aggiorna le variabili; stampa la chiave nuova e distruggi il foglio vecchio.

### Credenziali perse, o finite in mani sbagliate (procedura di oggi, superata da DEC-121)
**Sintomi:** il file `credenziali` non c'è più su nessun dispositivo, oppure qualcuno che non deve ne ha una copia (DEC-114).
**Cause probabili:** dispositivi persi o reinstallati; file copiato in un posto condiviso, incollato in una chat o in un repository.
**Cosa fare:**
1. Dalla cartella del progetto genera le credenziali nuove, in un file che non esiste ancora: `npm run credenziali -w @memodu/api -- https://memodu-api.vercel.app <file>`. Il comando stampa la riga `MEMODU_IMPRONTA=…`.
2. Su Vercel, progetto dell'API › Settings › Environment Variables: metti il valore nuovo in `MEMODU_IMPRONTA` e rifai il deploy. Da qui le credenziali vecchie ricevono 401.
3. Su ogni dispositivo chiudi Memodu e metti il file nuovo al posto di `credenziali`: su Windows in `%LOCALAPPDATA%\Memodu\`, su macOS in `~/Library/Application Support/Memodu/`. Se Memodu era aperto mostra la schermata di blocco: metti il file e premi Riprova.
4. Controlla che le note arrivino; le modifiche fatte nel frattempo sono rimaste sulla copia di lavoro e partono da sole.
5. Non mettere il file né il gettone nel repository o in una chat: conserva una copia in un gestore di password.

Vale finché il codice usa il file `credenziali`; con DEC-121 il file sparisce e valgono le due procedure qui sopra.
