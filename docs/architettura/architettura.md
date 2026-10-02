# Architettura

<!-- Fase 7 della guida. Ogni scelta tecnologica è una decisione nel registro. -->

## Scelte tecnologiche
| Ambito | Scelta | Decisione |
|---|---|---|
| App desktop (Windows, macOS) | Tauri 2: interfaccia web in TypeScript, parte nativa in Rust | DEC-23 |
| Interfaccia | React con TypeScript | DEC-26 |
| Editor della nota | CodeMirror 6. Per ora testo puro: l'anteprima dal vivo del markdown è sospesa | DEC-27, DEC-64 |
| Barra di scorrimento | OverlayScrollbars (`overlayscrollbars`, `overlayscrollbars-react`) per la barra sottile sovrapposta al contenuto (CMP-25) | DEC-89 |
| Icone e carattere | `lucide-react` per le icone Lucide; Inter incorporato nell'app con `@fontsource-variable/inter`, così non dipende dai caratteri installati | DEC-15, tokens.md |
| Token nel codice | Variabili CSS in `client/src/stili/token.css`, stili di testo come classi in `client/src/stili/base.css`; il modo chiaro o scuro segue il sistema | DEC-21, DEC-22 |
| Server (API) | Node con TypeScript e Fastify | DEC-24, DEC-32 |
| Archivio del server | File system: i blocchi della sincronizzazione come file, per ora in chiaro (DEC-78) | DEC-25 |
| Copia di lavoro nel client | Note, tag, cartelle e cestino in un database SQLite nel nucleo Rust del client (rusqlite), file `copia-di-lavoro.db` nella cartella dei dati delle applicazioni; l'interfaccia lo legge e scrive con comandi Tauri, uno per endpoint descritto in `api.md`, con gli stessi dati e codici di errore. Il client funziona senza API. Alla prima apertura parte da una copia di `memodu.db` dell'API, se c'è nella stessa cartella | DEC-67 (proposta) |
| Server (deposito della sincronizzazione) | L'API non gestisce più le note: conserva solo i blocchi della sincronizzazione come file, con un indice SQLite, e genera le credenziali (DEC-75, DEC-79, DEC-85) | DEC-85 |
| Hosting | Per ora la macchina di sviluppo (ambiente Locale). L'hosting definitivo è rinviato; deve avere un disco persistente (DEC-25) | — |

## Struttura del repository
Un solo repository con workspace npm (DEC-33); client e API si avviano separatamente (DEC-67):

| Cartella | Contenuto |
|---|---|
| `client` | App desktop: interfaccia React in `src`, nucleo Rust di Tauri in `src-tauri` con la copia di lavoro (DEC-67). Si avvia con `npm run client` |
| `api` | API in Fastify. Si avvia da sola con `npm run api` |
| `condiviso` | Tipi dei dati dei comandi del nucleo (per esempio la Nota), indirizzo dell'API e limite delle richieste |

Prove con Vitest, controllo del codice con ESLint e Prettier.

## Schema del database (DEC-48)
SQLite nella copia di lavoro del client (DEC-67, DEC-85; prima nell'API, DEC-46, DEC-47). Qui le tabelle di Must A, B e C; sincronizzazione (schema 2), impostazioni (schema 3 e 4) e indice di ricerca (schema 5, sotto) hanno le loro sezioni; immagini e avvisi arrivano con i loro frammenti.

| Tabella | Colonne principali | Regole |
|---|---|---|
| `note` | id, titolo, contenuto (markdown), cartella, creata, creata scelta, modificata, fine validità, eliminata il, provenienza | Una sola cartella o nessuna (RF-05); nel cestino se «eliminata il» è compilato (DEC-37) |
| `cartelle` | id, nome, chiave del nome, cartella madre, eliminata il, provenienza | Nome unico tra le sorelle senza maiuscole (RB-23); nel cestino con tutto il contenuto (RB-25) |
| `tag` | id, nome come scritto la prima volta, chiave del nome, tag padre | Unico senza maiuscole (RB-22); un livello per tag (RB-18); i sotto-tag seguono il padre (RB-19) |
| `note_tag` | nota, tag | Un tag può restare senza note (RB-49) |

- La chiave del nome è il nome in minuscolo calcolato dal nucleo, perché il confronto di SQLite ignora le maiuscole solo senza accenti.
- Istanti in ora universale ISO 8601, date del calendario come giorno. La versione dello schema è segnata nel database.

## Indice di ricerca (RF-08, DEC-94, DEC-95)
- **Dove:** schema 5 della copia di lavoro (lo schema 4 aggiunge l'impostazione), tabella virtuale FTS5 `ricerca` con il tokenizzatore `trigram remove_diacritics 1` (SQLite 3.50, incluso in rusqlite con FTS5). Colonne: `id` della nota (non indicizzata), `titolo`, `contenuto`, `tag` (i percorsi completi dei tag della nota, separati da a capo).
- **Aggiornamento:** trigger su `note`, `note_tag` e `tag`, che valgono anche per le modifiche ricevute dalla sincronizzazione (compresa l'unione di due tag doppi); la tabella `ricerca_righe` lega ogni nota alla sua riga dell'indice, così un salvataggio non scorre tutto l'indice; il trigger sui tag scatta solo se nome o padre cambiano davvero; i percorsi li dà la funzione SQL `tag_della_nota`, registrata da Rust. Alla migrazione l'indice si riempie con le note che ci sono.
- **Ricerca:** dalla terza lettera l'indice, con ogni parola tra virgolette (il testo non è mai una query, RB-08); con una o due lettere si scorrono le note con la funzione SQL `normalizza` (minuscole, senza accenti). Filtri, ordine ed estratto in Rust (`client/src-tauri/src/archivio_ricerca.rs`).
- **Impostazione:** colonna `cestino_in_ricerca` della tabella `impostazioni`, sincronizzata (RB-52).

## Regole dei dati (frammento Must D, DEC-49)
Le regole stanno solo nella copia di lavoro del client (`client/src-tauri/src/archivio.rs`, file `copia-di-lavoro.db`, DEC-67, DEC-85): l'API non ha più un archivio delle note. Nella copia di lavoro ogni operazione è una transazione.

- **Nomi delle cartelle** (RB-63): i caratteri vietati nei nomi dei file (`< > : " / \ | ? *` e i caratteri di controllo) diventano `-`, senza punti e spazi finali, al massimo 100 caratteri; i nomi riservati di Windows (`CON`, `PRN`, `AUX`, `NUL`, `COM1`…, `LPT1`…) ricevono un `-` in fondo. Maiuscole e minuscole non contano (RB-23). Confermato da Manuel Cucca il 28/09/2026.
- **Titoli delle note:** si ripetono liberamente (RB-16); non servono più numeri per distinguere i file.
- **Anteprima nell'elenco** (RB-15): le prime parole del contenuto senza simboli markdown, al massimo 80 caratteri. Confermato da Manuel Cucca il 28/09/2026.
- **Cestino** (DEC-37, DEC-48): eliminare segna «eliminata il» sulla nota o sulla cartella; una cartella eliminata porta con sé tutto il contenuto, che non si apre più finché non torna. Ripristinare la riporta nella radice (RB-28); eliminare per sempre cancella la riga e, per una cartella, tutto il contenuto, tranne gli elementi eliminati a parte, che restano nel cestino. Quando un'unione svuota una cartella, la cartella sparisce anche se nel cestino ci sono elementi che venivano da lì: si staccano e restano ripristinabili nella radice.
- **Riconnessione:** ogni operazione dell'archivio passa da un'unica funzione (`con_riconnessione`): se SQLite risponde che il file è in sola lettura, la connessione si riapre e l'operazione si riprova una volta, così quando il file torna scrivibile non serve riavviare l'app. Scelta di Manuel Cucca il 29/09/2026.
- **Dove:** la cartella dei dati delle applicazioni (DEC-46); la variabile d'ambiente `MEMODU_CARTELLA` la sostituisce (prove e sviluppo).

## Sincronizzazione (RF-10, Fase 7 completa, codice del 30/09/2026)
- **Codice:** server in `api/src/sincronizzazione.ts`; client in `client/src-tauri/src/sincronizzazione.rs` (il filo in background) e `archivio_sinc.rs` (blocchi, fusione e conflitti); schema 2 della copia di lavoro con i trigger che segnano gli elementi modificati. Se una modifica ricevuta cambia la nota aperta mentre la finestra ha ancora il testo vecchio, il testo della finestra va in una copia in conflitto e non la sovrascrive (DEC-06).
- **Unità:** un blocco per elemento (nota, cartella, tag, impostazioni; gli avvisi restano sul dispositivo, DEC-90, DEC-91), con dentro i suoi collegamenti; il server conosce solo identificativo, versione, dimensione e ora, e tiene anche le versioni precedenti di ogni blocco. Confronti e conflitti li risolve il client (DEC-75).
- **Modifiche e conflitti:** versione per blocco e numero d'ordine globale sul server; il dispositivo tiene la base di ogni elemento e confronta campo per campo; nei conflitti di RB-36 … RB-38 vince l'istante UTC più tardo della modifica sul dispositivo; le eliminazioni definitive diventano blocchi «eliminato» (DEC-76).
- **Versioni precedenti:** a scalare per 30 giorni (tutte nell'ultima ora, una all'ora nell'ultimo giorno, una al giorno fino a 30); la versione attuale resta sempre (DEC-77).
- **Cifratura:** per ora i blocchi viaggiano in chiaro, con l'intestazione del formato pronta; il server resta solo in locale finché non si accende; al passaggio si rimanda tutto cifrato e si cancellano le versioni in chiaro (DEC-78).
- **Credenziali:** nel file `credenziali` della cartella dei dati, letto a ogni avvio; il server genera identificativo, gettone e chiave e conserva solo l'impronta del gettone; gettone sbagliato: 401 e schermata di blocco (DEC-79).
- **Quando:** all'avvio, qualche secondo dopo ogni salvataggio, ogni 30 s e al ritorno della rete; senza rete i tentativi si diradano da 5 s fino a 5 minuti (DEC-80).
- **Avviso:** «server irraggiungibile» dopo 24 ore senza sincronizzazioni riuscite (RB-40, DEC-82).
- **Versioni di app e server:** ogni richiesta porta la versione del protocollo; se incompatibile, avviso «errore di sincronizzazione» e si continua sulla copia di lavoro (DEC-83).

## Schema generale
```mermaid
flowchart LR
    U[Utente] --> F[Interfaccia React]
    F -- comandi Tauri --> N[Nucleo Rust]
    N --> C[(Copia di lavoro SQLite)]
    N -- sincronizzazione --> A[API]
    A --> D[(Deposito: blocchi e indice)]
```

## Sicurezza
- **Autenticazione:** 
- **Autorizzazione per ruolo:** 
- **Protezione dei dati sensibili:** 

## Integrazioni
| Sistema esterno | Cosa si scambia | Se non risponde | Duplicati |
|---|---|---|---|
| | | | |
