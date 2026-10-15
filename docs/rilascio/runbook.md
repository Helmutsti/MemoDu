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
2. Impostazioni › box dell'account › Accedi, con email e password dell'account.
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
- **Variabili (account nel database, DEC-132):** `DATABASE_URL` (messa dall'integrazione con Neon) e `MEMODU_SEGRETO` (32 byte casuali in base64url; senza, il server non parte). Gli account stanno nel database. Per gli allegati di Brainet (DEC-135) anche `MEMODU_R2_ACCOUNT`, `MEMODU_R2_CHIAVE`, `MEMODU_R2_SEGRETO` e `MEMODU_R2_BUCKET` (vedi «Allegati di Brainet su Cloudflare R2»); senza, il resto funziona e gli allegati restano sui computer. Le altre sette `MEMODU_*` dell'utente fisso (DEC-121) servono solo alla prima partenza della versione con gli account, che ne fa il primo account (vedi «Passare agli account nel database»); dopo si tolgono.
- **Account:** li crea Manuel Cucca dalla cartella del progetto con `npm run account -w @memodu/api`, con `DATABASE_URL` di Neon nell'ambiente (o in `api/.env`): chiede email e password (almeno 12 caratteri, RB-88) e stampa una volta sola la chiave di recupero, che durante la prova conserva lui (DEC-132). `npm run account -w @memodu/api -- --elenco` mostra gli account. Senza `DATABASE_URL` il comando usa il database del server locale, che va fermato prima.
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
**Cause (DEC-132, DEC-133):** il dispositivo è stato scollegato da un altro (Dispositivi collegati), o da un cambio della password o da un recupero con «Scollega gli altri miei dispositivi»; oppure è la prima apertura dopo il passaggio agli account. L'accesso non scade.
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
Da un altro computer: Impostazioni › box dell'account › Dispositivi collegati › Scollega sul computer perso (RB-100). Al primo contatto con il server smette di sincronizzare. Cambia anche la password se poteva essere salvata lì. La copia di lavoro su quel computer resta leggibile da chi ha il computer (rischio accettato, la copia di lavoro non è cifrata sul disco).

### L'installatore è bloccato
**Sintomi:** Windows mostra SmartScreen, il browser o l'antivirus non lasciano scaricare; macOS dice che l'app non si può aprire.
**Cosa fare:** su Windows «Ulteriori informazioni» › «Esegui comunque», oppure compila l'installatore sul computer stesso (vedi sopra); su macOS tasto destro › Apri. Succede perché gli installatori non sono firmati (rinvio: prima di dare Memodu ad altre persone).

### Password persa (DEC-132)
**Sintomi:** chi prova Memodu non ricorda la password.
**Cosa fare:** dalla finestra di accesso, «Password dimenticata?»: email, chiave di recupero e password nuova (RB-99). Le note non si ricifrano. Alla fine l'app mostra una chiave di recupero nuova, una volta sola: durante la prova la persona la manda a Manuel Cucca, che tiene le chiavi di tutti; quella di prima non vale più. Se la persona non ha la chiave, gliela ridà Manuel Cucca.

Senza password e senza chiave di recupero le note sul server non si recuperano: restano solo le copie di lavoro dei dispositivi (RB-90).

### Chiave di recupero finita in mani sbagliate (DEC-132)
Dall'app: Impostazioni › Cambia password › «Usa la chiave di recupero»: con la chiave di recupero e una password nuova nasce una chiave nuova e quella vecchia smette di valere (RB-99). Accendi «Scollega gli altri miei dispositivi» se qualcuno potrebbe essersi collegato.

### Passare agli account nel database (DEC-132, una volta sola)
1. Prima del rilascio, prova la migrazione su un ramo di Neon copiato dalla produzione (TC-175): un server locale con `DATABASE_URL` del ramo e le otto variabili `MEMODU_*` di Vercel; accedi e controlla che le note ci siano.
2. Rilascia il server con gli account lasciando su Vercel le variabili dell'utente fisso: alla prima partenza lo schema 2 ne fa il primo account, con la stessa chiave dati, e gli assegna tutte le note.
3. Su ogni computer, dopo l'aggiornamento dell'app, compare una volta «Accedi di nuovo per sincronizzare»: accedi con la stessa email e la stessa password.
4. Togli da Vercel `MEMODU_EMAIL`, `MEMODU_SALE`, `MEMODU_ARGON2`, `MEMODU_IMPRONTA_ACCESSO`, `MEMODU_IMPRONTA_RECUPERO`, `MEMODU_CHIAVE_PASSWORD` e `MEMODU_CHIAVE_RECUPERO`; resta `MEMODU_SEGRETO`.
5. Crea gli account delle persone che provano con `npm run account -w @memodu/api` e conserva le loro chiavi di recupero.

### Allegati di Brainet su Cloudflare R2 (DEC-135, una volta sola)
I file allegati alle note Brainet stanno in un bucket privato di Cloudflare R2; le note restano su Neon. Il server non tocca i file: firma indirizzi di 15 minuti con cui l'app li carica e li scarica, già cifrati. Scritto dall'agente il 15/10/2026, fatto da Manuel Cucca lo stesso giorno; le voci della dashboard di Cloudflare possono avere nomi un po' diversi.

**Prima del rilascio con gli allegati** (l'invio su `main` ripubblica il server):
1. **Cloudflare, account:** accedi a dash.cloudflare.com (o crea l'account). R2 si attiva da «R2 Object Storage» e chiede una carta, anche se l'uso resta nella fascia gratuita (10 GB di file al mese).
2. **Il bucket:** R2 Object Storage › Create bucket. Nome `memodu-allegati`; posizione «Automatic» o, se c'è la scelta, Europa occidentale. Accesso pubblico: lascialo spento (è spento di default), niente dominio pubblico.
3. **La chiave per il server:** R2 Object Storage › Manage API tokens › Create API token. Permessi «Object Read & Write», solo sul bucket `memodu-allegati`, senza scadenza. Alla fine Cloudflare mostra *Access Key ID* e *Secret Access Key*: il segreto si vede una volta sola. Copiali direttamente su Vercel (passo 5), senza incollarli in chat o in file.
4. **L'Account ID:** nella pagina R2 Object Storage, a destra (è anche la prima parte dell'indirizzo `https://<account>.r2.cloudflarestorage.com`).
5. **Vercel:** progetto dell'API › Settings › Environment Variables, ambiente **Production**:
   - `MEMODU_R2_ACCOUNT` = l'Account ID;
   - `MEMODU_R2_CHIAVE` = l'Access Key ID;
   - `MEMODU_R2_SEGRETO` = il Secret Access Key, segnato come Sensitive;
   - `MEMODU_R2_BUCKET` = `memodu-allegati`.
   Le variabili valgono dal deploy successivo: quello che parte con l'invio su `main` va bene; se le metti dopo, Deployments › Redeploy.
6. **Niente CORS:** l'app carica e scarica dal nucleo, non da una pagina web: il bucket non ha bisogno di regole CORS.

**Dopo il rilascio:** su un computer con Brainet acceso allega una foto, aspetta un minuto e aprila da un altro computer (TC-222, TC-224 in produzione). In Cloudflare, nel bucket, compare una cartella per account con file dal contenuto illeggibile (cifrato).

**Se gli allegati non partono:** il server risponde `503 Allegati non configurati` quando manca una delle quattro variabili: controllale su Vercel e rifai il deploy. Se Cloudflare rifiuta (errori 403 nei log delle funzioni), la chiave non ha il permesso sul bucket o il nome del bucket è diverso: rifai la chiave del passo 3. I file aspettano sui computer e partono da soli quando il server torna a posto.

**Se la chiave finisce in mani sbagliate:** in Cloudflare revoca il token (Manage API tokens), creane uno nuovo e aggiorna `MEMODU_R2_CHIAVE` e `MEMODU_R2_SEGRETO` su Vercel, poi Redeploy. I file restano cifrati: con la sola chiave di R2 non si leggono.

