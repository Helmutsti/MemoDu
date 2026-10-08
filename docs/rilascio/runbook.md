# Runbook

<!-- Fase 9 della guida. Per chi gestisce il sistema. -->

Memodu ha tre pezzi: l'app sui computer (Windows e macOS, Tauri), il server della sincronizzazione su Vercel (`https://memodu-api.vercel.app`, cartella `api`, regione fra1) e il database su Neon (PostgreSQL, us-east-1). Le note stanno in ogni computer, nella copia di lavoro; il server tiene solo blocchi cifrati che non sa leggere (DEC-121). Scritto dall'agente e approvato da Manuel Cucca il 07/10/2026.

## Installazione e aggiornamento

### Pubblicare una versione
Se esiste il ramo `rilascio/X.Y` della versione, tutti i passi si fanno lì e ogni correzione si riporta su `main` (DEC-129); altrimenti su `main`.

1. Nella cartella del progetto porta la versione al numero nuovo in `client/package.json`, `client/src-tauri/tauri.conf.json`, `client/src-tauri/Cargo.toml` (e quindi `Cargo.lock`) e `package-lock.json`; scrivi la voce nuova in `CHANGELOG.md`.
2. Commit «Versione X.Y.Z», tag `vX.Y.Z` (uguale alla versione di `tauri.conf.json`), invia il commit e poi il tag.
3. Il tag fa partire su GitHub il flusso «Rilascio» (`.github/workflows/rilascio.yml`): prove, poi gli installatori per Windows (`Memodu_X.Y.Z_x64-setup.exe`, `.msi`) e macOS Apple Silicon (`.dmg`, `.app.tar.gz`) nella release «Memodu vX.Y.Z». Dura una ventina di minuti.

### Installare o aggiornare su Windows
1. Chiudi Memodu dall'icona nell'area di notifica: «Esci da Memodu».
2. Avvia `Memodu_X.Y.Z_x64-setup.exe`. Gli installatori non sono firmati: se compare SmartScreen, «Ulteriori informazioni» › «Esegui comunque».
3. L'aggiornamento si installa sopra la versione di prima, nella stessa cartella: note, Locale e accesso restano.

Se il download dalla release è bloccato (fiducia del browser o dell'antivirus), si compila sul computer stesso: nella cartella `client` `npx tauri build --bundles nsis`; l'installatore è in `client/src-tauri/target/release/bundle/nsis/` e si installa anche senza finestre con `Memodu_X.Y.Z_x64-setup.exe /S`. Dopo, cancella `client/src-tauri/target/release` (sono gigabyte, e non deve restare una seconda copia di Memodu).

### Installare o aggiornare su macOS
1. Chiudi Memodu dalla barra dei menu: «Esci da Memodu».
2. Apri `Memodu_X.Y.Z_aarch64.dmg` e trascina Memodu in Applicazioni, sostituendo quella di prima.
3. Alla prima apertura macOS la blocca (non è firmata): tasto destro su Memodu › Apri › Apri.

### Collegare un computer nuovo
1. Installa Memodu come sopra.
2. Impostazioni › box dell'account › Accedi, con email e password dell'utente.
3. Al primo accesso arrivano tutte le note; nel box il pallino passa da grigio a verde «Sincronizzata». Dai al computer un nome nel box («Nome del dispositivo»).
4. Locale non si sincronizza: le cartelle si aggiungono di nuovo su ogni computer.

### Dove stanno le cose
| Cosa | Windows | macOS |
|---|---|---|
| Copia di lavoro (tutte le note, impostazioni, elenco di Locale) | `%LOCALAPPDATA%\Memodu\copia-di-lavoro.db` | `~/Library/Application Support/Memodu/copia-di-lavoro.db` |
| Sessione (gettone e chiave dati) | Gestione credenziali di Windows, voce `sessione.Memodu` | Portachiavi, servizio `Memodu` |
| Programma | `%LOCALAPPDATA%\Memodu\memodu.exe` | `/Applications/Memodu.app` |

Il vecchio `memodu.db` e il file `credenziali` nella stessa cartella vengono dalle versioni fino alla 0.1.8 e non servono più.

### Server
- **Vercel**, progetto dell'API (Root Directory `api`): ripubblica da solo a ogni invio su `main`; dopo un cambio delle variabili si rifà il deploy a mano (Deployments › Redeploy).
- **Variabili:** `DATABASE_URL` (messa dall'integrazione con Neon) e le otto `MEMODU_*` dell'utente fisso stampate da `npm run utente -w @memodu/api` (`MEMODU_EMAIL`, `MEMODU_SALE`, `MEMODU_ARGON2`, `MEMODU_IMPRONTA_ACCESSO`, `MEMODU_IMPRONTA_RECUPERO`, `MEMODU_CHIAVE_PASSWORD`, `MEMODU_CHIAVE_RECUPERO`, `MEMODU_SEGRETO`). Senza utente fisso il server non parte.
- **Neon:** il database lo crea e lo aggiorna il server da solo (schema in `api/src/schema.ts`); non ci sono passi a mano.

## Backup e ripristino
**In sospeso** (scelta di Manuel Cucca del 07/10/2026): manca una copia periodica del database e la sua procedura di ripristino (rinvio in `avanzamento.md`).

Cosa protegge oggi:
- **Ogni computer ha tutte le note** nella sua copia di lavoro. Se il server perde tutto, un computer collegato a un archivio nuovo rimanda tutto da solo (vedi «Il server è stato ricreato»).
- **Neon** permette di riportare il database a un momento delle ultime 6 ore (piano gratuito), dalla sua console.
- **La cronologia del server:** per ogni nota le versioni precedenti restano 7 giorni (DEC-77, DEC-113), ma oggi l'app non le mostra.

## Monitoraggio
| Cosa si controlla | Soglia di allarme | Chi viene avvisato |
|---|---|---|
| `https://memodu-api.vercel.app/vivo` | Non risponde `200` | Manuel Cucca, controllo a mano |
| `https://memodu-api.vercel.app/salute` | `503` (l'archivio non risponde) o più di 8 secondi | Manuel Cucca, controllo a mano |
| Box dell'account in Impostazioni | Pallino ambra o rosso | Chi usa quel computer |
| Avviso «Il server non risponde da più di un'ora: le modifiche restano su questo computer.» | Compare | Chi usa quel computer |
| Spazio e calcolo su Neon | Vicino al limite del piano gratuito | Manuel Cucca, dalle email di Neon |
| Errori delle funzioni su Vercel | Errori 500 ripetuti nei log | Manuel Cucca, dalla dashboard di Vercel |

## Se succede X, fai Y

### Il server non risponde
**Sintomi:** nel box il pallino ambra «Server non raggiungibile: ultimo backup …»; dopo un'ora l'avviso «Il server non risponde da più di un'ora: le modifiche restano su questo computer.».
**Cosa fare:**
1. Niente è perso: si scrive come sempre e le modifiche restano sul computer (DEC-02).
2. Apri `https://memodu-api.vercel.app/vivo`: se non risponde, il problema è Vercel (stato su vercel-status.com, oppure un deploy fallito: Deployments, poi Redeploy dell'ultimo buono).
3. Se `/vivo` risponde ma `/salute` dà `503`, il problema è Neon: guarda la console di Neon (progetto sospeso, limite superato, password del database cambiata: allora aggiorna `DATABASE_URL` e rifai il deploy).
4. Quando il server torna, le modifiche partono da sole e l'avviso sparisce.

### «La sincronizzazione non è riuscita: riprovo da sola»
**Sintomi:** pallino ambra con quel testo, o l'avviso con lo stesso testo.
**Cosa fare:** si riprova da solo, a intervalli che crescono fino a 5 minuti. Se dura, guarda i log delle funzioni su Vercel: un errore 500 ripetuto è un difetto del server da correggere.

### «Memodu e il server hanno versioni diverse»
**Sintomi:** pallino rosso con quel testo; risposta 426 del server.
**Cosa fare:** aggiorna Memodu su quel computer all'ultima versione (vedi sopra). Succede quando il server è più nuovo dell'app.

### «Accedi di nuovo per sincronizzare»
**Sintomi:** pallino rosso e Accedi al posto di Esci; avviso in alto.
**Cause:** il computer non si è collegato per più di 30 giorni, oppure è cambiato `MEMODU_SEGRETO` o la password.
**Cosa fare:** Impostazioni › Accedi. Le modifiche fatte nel frattempo partono dopo l'accesso.

### Il server è stato ricreato (database nuovo o perso)
**Sintomi:** un database Neon nuovo, vuoto, dopo un problema o uno spostamento.
**Cosa fare:**
1. Metti `DATABASE_URL` del database nuovo su Vercel e rifai il deploy.
2. Apri Memodu prima sul computer con le note più complete e aspetta che nel box sia verde: il computer si accorge che l'archivio è nuovo e rimanda tutto, una volta sola (TC-103).
3. Poi apri gli altri computer: rimandano quello che hanno e ricevono il resto.

### Note «(copia in conflitto)»
**Sintomi:** accanto a una nota ne compare una con lo stesso titolo seguito da «(copia in conflitto)» e l'avviso «Una nota è stata modificata su due dispositivi».
**Cosa fare:** è voluto, nessun testo è perso (DEC-06). Apri le due note, tieni nell'originale quello che serve e manda la copia nel cestino.

### Computer perso o rubato
Vedi «Dispositivo perso» qui sotto: si cambia `MEMODU_SEGRETO`, e la copia di lavoro su quel computer resta leggibile da chi ha il computer (rischio accettato, la copia di lavoro non è cifrata sul disco).

### L'installatore è bloccato
**Sintomi:** Windows mostra SmartScreen, il browser o l'antivirus non lasciano scaricare; macOS dice che l'app non si può aprire.
**Cosa fare:** su Windows «Ulteriori informazioni» › «Esegui comunque», oppure compila l'installatore sul computer stesso (vedi sopra); su macOS tasto destro › Apri. Succede perché gli installatori non sono firmati (rinvio: prima di dare Memodu ad altre persone).

### Password persa (DEC-121)
**Sintomi:** non ricordi la password dell'utente fisso.
**Cosa fare:**
1. Prendi il foglio con la chiave di recupero.
2. Dalla cartella del progetto, con `api/.env` attuale o le variabili di Vercel nell'ambiente: `npm run utente -w @memodu/api -- --recupero`; chiede la chiave di recupero e la password nuova (almeno 12 caratteri, RB-88) e riusa la stessa chiave dati, quindi le note non si ricifrano.
3. Su Vercel, progetto dell'API › Settings › Environment Variables: metti i valori nuovi e rifai il deploy.
4. Su ogni dispositivo compare «Accedi di nuovo per sincronizzare»: accedi con la password nuova.

Senza il foglio e senza la password le note sul server non si recuperano: restano solo le copie di lavoro dei dispositivi (RB-90).

### Dispositivo perso, o chiave di recupero finita in mani sbagliate (DEC-121)
**Cosa fare:**
1. Dispositivo perso: cambia `MEMODU_SEGRETO` su Vercel e rifai il deploy; tutti i gettoni smettono di valere e ogni dispositivo rifà l'accesso. Cambia anche la password se poteva essere salvata su quel dispositivo.
2. Chiave di recupero in mani sbagliate: `npm run utente -w @memodu/api -- --nuovo-recupero` chiede la password e stampa una chiave di recupero nuova e le variabili; aggiornale, stampa la chiave nuova e distruggi il foglio vecchio.
