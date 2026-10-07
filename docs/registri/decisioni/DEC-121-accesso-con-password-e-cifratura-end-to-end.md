# DEC-121 – Accesso con password e cifratura end-to-end

**Data:** 2026-10-06 · **Stato:** Accettata; la riga Account di SC-06 superata da DEC-122 · **Idea di origine:** —

## Contesto
Oggi il server autorizza i dispositivi con un gettone statico scritto nel file `credenziali` (DEC-79, DEC-104), non c'è login (DEC-13, SC-05 progettata e non attiva per DEC-19) e la sincronizzazione è in chiaro (DEC-78): chi ha accesso a Neon o al progetto su Vercel legge le note. Manuel Cucca vuole aggiungere al server l'accesso con login e la cifratura, per ora con un solo utente fisso e credenziali fisse, senza salvare gli utenti nel database. Ha scelto:
- per la cifratura, quella end-to-end nel client di DEC-08 (non la cifratura del server a riposo);
- per l'accesso, la schermata di accesso SC-05 con email e password;
- di definire insieme l'architettura finale e quella temporanea, con un gettone (JWT) restituito dal server dopo il login.

Login e cifratura risolvono due problemi diversi: chi può parlare con il server e chi può leggere le note. La password serve a tutti e due, ma il server non deve mai poterne ricavare la chiave.

## Opzioni valutate
Da dove viene la chiave che cifra le note:
A) Dalla password, sul dispositivo, con una chiave dati casuale avvolta e conservata sul server.
B) Dalla password, direttamente: cambiare password vuol dire ricifrare tutte le note.
C) Dal file `credenziali` (DEC-79): la password serve solo a entrare, chi legge il file legge le note.

Recupero se si perde la password:
A) Chiave di recupero da stampare, che avvolge una seconda copia della chiave dati.
B) Nessun recupero: restano solo le copie di lavoro dei dispositivi.

Gettone dopo il login:
A) JWT breve di accesso più gettone di rinnovo opaco, revocabile.
B) Solo JWT lungo: niente revoca se non cambiando il segreto.
C) Gettone opaco di sessione, controllato nel database a ogni richiesta.

## Decisione
Proposta dell'agente, accettata da Manuel Cucca il 06/10/2026: **A** per la chiave, **A** per il recupero, **A** per i gettoni nell'architettura finale e **B** in quella temporanea.

**Architettura finale**
1. **Dalla password, sul dispositivo:** Argon2id(password, sale) con il sale dato dal server prima dell'accesso; dal risultato, con HKDF, due valori separati: la **prova di accesso**, che va al server, e la **chiave della cassaforte**, che non lascia il dispositivo.
2. **Chiave dati:** le note si cifrano con una chiave dati casuale; sul server sta solo **avvolta** con la chiave della cassaforte. Cambiare password vuol dire riavvolgere la chiave dati, non ricifrare le note.
3. **Chiave di recupero** (scelta di Manuel Cucca il 06/10/2026): quando si crea l'utente nasce una chiave casuale di 256 bit, mostrata una volta in gruppi di caratteri da stampare. Da questa, con HKDF, si ricavano una prova di recupero e una seconda chiave che avvolge la stessa chiave dati. Con la chiave di recupero si sceglie una password nuova senza perdere le note; Argon2id non serve, perché la chiave è casuale e non indovinabile.
4. **Il server** conserva solo email, sale e parametri di Argon2id, impronta della prova di accesso, impronta della prova di recupero e le due copie avvolte della chiave dati: con questi non legge nulla.
5. **Gettoni:** dopo l'accesso il server restituisce un JWT di accesso breve, firmato HS256 con un segreto del server, che si verifica senza leggere il database (adatto a Vercel, DEC-105), e un gettone di rinnovo opaco, conservato in Neon solo come impronta, ruotato a ogni uso e revocabile.
6. **Sul dispositivo:** gettone di rinnovo e chiave dati nel portachiavi del sistema (Credential Manager di Windows, Portachiavi di macOS), così non si rifà l'accesso a ogni avvio e il file `credenziali` in chiaro sparisce.

**Architettura temporanea (utente fisso)**
- La stessa struttura; cambia solo dove stanno i dati dell'utente: email, sale, impronte delle prove di accesso e di recupero e le due copie avvolte della chiave dati sono variabili d'ambiente del server, generate da un comando dell'API a partire da email e password, come oggi `npm run credenziali` (DEC-104). Il comando stampa anche la chiave di recupero, una volta sola. Nessuna tabella degli utenti.
- Senza tabella il server non può salvare una password nuova: con la chiave di recupero si rilancia il comando, che riusa la stessa chiave dati, e si cambiano le variabili.
- Niente gettone di rinnovo: un solo JWT di durata più lunga; per revocarlo si cambia il segreto.
- Il client è già quello definitivo: SC-05, Argon2, cifratura, portachiavi.
- Passare all'architettura finale vuol dire spostare quei dati in una riga della tabella degli utenti e aggiungere il gettone di rinnovo: le note non si ricifrano, quindi il passaggio dal formato in chiaro a quello cifrato (DEC-78, condizione 3) avviene una volta sola.

**Limite ai tentativi di accesso:** rinviato da Manuel Cucca il 06/10/2026. Fino ad allora nessun limite; il blocco temporaneo crescente con una tabella `tentativi` in Neon resta la proposta dell'agente.

**Durata dei gettoni** (scelta di Manuel Cucca il 06/10/2026, su proposta dell'agente):
- Temporanea: JWT di 30 giorni, rinnovato in silenzio dall'app quando ne mancano meno di 7.
- Finale: JWT di accesso di 15 minuti; gettone di rinnovo di 90 giorni, che ripartono a ogni rinnovo perché il gettone ruota a ogni uso.

**Senza un gettone valido la finestra non si blocca mai** (scelta di Manuel Cucca il 06/10/2026, su proposta dell'agente):
- Mai fatto l'accesso: come DEC-84, Memodu si apre sulla copia di lavoro e non sincronizza; nella sezione Sincronizzazione delle impostazioni «Accedi per sincronizzare» apre SC-05.
- Gettone scaduto o rifiutato (per esempio dopo il cambio del segreto): si continua a scrivere, le modifiche aspettano e un avviso (CMP-07) «Accedi di nuovo per sincronizzare» apre SC-05; dopo l'accesso si sincronizza tutto.
- Il blocco non proteggerebbe nulla, perché la copia di lavoro sul disco è comunque in chiaro: SC-07 non compare più per le credenziali e resta solo quando la copia di lavoro non si apre o non si scrive (DEC-67, DEC-85).

**Requisiti sulla password** (scelta di Manuel Cucca il 06/10/2026, su proposta dell'agente): almeno 12 caratteri, nessuna regola di complessità, rifiuto delle password più comuni da un elenco breve incluso nel programma. Li controlla il comando che crea l'utente fisso e, nell'architettura finale, anche il cambio della password. Servono perché chi ottiene una copia del database può provare password sul suo computer, senza passare dal server: lì frenano solo la lunghezza e Argon2id.

**Uscita dal dispositivo** (scelta di Manuel Cucca il 06/10/2026, su proposta dell'agente):
- «Esci» sta nella sezione Sincronizzazione delle impostazioni (SC-06): manda le modifiche in attesa, poi toglie gettone e chiave dati dal portachiavi; da lì il dispositivo lavora in locale senza sincronizzare, come prima del primo accesso.
- La copia di lavoro resta sul dispositivo: l'uscita scollega, non nasconde le note, che sul disco sono comunque in chiaro.
- Dispositivo perso: nell'architettura temporanea si cambia il segreto dei JWT e tutti i dispositivi rifanno l'accesso; in quella finale si revoca il suo gettone di rinnovo.

**Algoritmi e librerie** (scelta di Manuel Cucca il 06/10/2026, su proposta dell'agente):
- Sul dispositivo, nel nucleo Rust, librerie RustCrypto (solo Rust, niente codice C da compilare su Windows e macOS):
  - blocchi cifrati con XChaCha20-Poly1305 (crate `chacha20poly1305`), con un nonce casuale di 192 bit per blocco: nessun contatore da tenere fra i dispositivi. Ogni blocco dichiara `xchacha20poly1305` nel campo del formato che oggi dice «in chiaro» (DEC-78, condizione 1);
  - Argon2id (crate `argon2`) con 64 MiB di memoria, 3 passaggi e 1 filo, circa mezzo secondo per accesso su un PC normale. I parametri stanno con il sale, così si possono alzare senza rompere nulla;
  - HKDF-SHA256 (crate `hkdf`) per ricavare le chiavi separate;
  - portachiavi del sistema con il crate `keyring`.
- Sul server nessuna dipendenza nuova: le prove di accesso e di recupero sono già casuali da 256 bit, quindi basta l'impronta SHA-256 che il server usa oggi per il gettone; i JWT HS256 si firmano e si verificano con `node:crypto`.

## Conseguenze
- Supera DEC-13 (niente login, credenziali preimpostate) e DEC-19 (accesso progettato e non attivo, SC-05 si attiva); supera DEC-79 e DEC-104 per il gettone statico e il file `credenziali`, DEC-114 per il recupero, DEC-20 per le credenziali rifiutate (RB-57 si toglie, SC-07 resta solo per la copia di lavoro); accende la cifratura rinviata da DEC-78. DEC-08 resta valida, con la chiave ricavata dalla password come in DEC-07. Di DEC-13 restano un solo utente senza registrazione, solo Windows e macOS e il web rinviato; di DEC-104 il server in rete solo in HTTPS.
- **Rischi da accettare:** persi sia la password sia il foglio con la chiave di recupero, le note sul server non si recuperano e restano solo nelle copie di lavoro dei dispositivi; chi trova il foglio con la chiave di recupero può leggere tutte le note; finché il limite ai tentativi è rinviato, chi raggiunge il server può provare password all'infinito, frenato solo da Argon2id.
- Nuove dipendenze del client: `chacha20poly1305`, `argon2`, `hkdf`, `sha2`, `keyring`.
- Aggiornati: RF-10, RF-14, FL-08, EN-05, EN-06, SC-05, SC-07, RB-54, RB-57, `architettura/architettura.md`, `architettura/api.md`, `rilascio/runbook.md`, rinvii e rischi in `avanzamento.md`.
