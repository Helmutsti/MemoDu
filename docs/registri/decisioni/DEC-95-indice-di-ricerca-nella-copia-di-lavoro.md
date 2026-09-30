# DEC-95 – Indice di ricerca nella copia di lavoro e comando «cerca»

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
RF-08 cerca sul dispositivo, perché con la cifratura il server non legge le note (RF-10). DEC-94 ha fissato come si trovano le parole (anche dentro le altre, senza maiuscole e accenti, con più parole tutte) e ha proposto un indice a trigrammi FTS5 dalla terza lettera. Restavano da decidere come si tiene aggiornato l'indice, cosa riceve e restituisce il comando del nucleo, come si calcolano estratto e date, e dove sta l'impostazione delle note del cestino.

## Opzioni valutate
Aggiornamento dell'indice: A) trigger su note, tag e collegamenti, come per la sincronizzazione; B) codice Rust in ogni operazione che scrive.
Periodi dei filtri: calcolati dall'interfaccia nell'ora locale; calcolati dal nucleo.
Estratto: funzione `snippet` di FTS5; calcolato in Rust.

## Decisione
Proposta dell'agente, accettata da Manuel Cucca il 30/09/2026:
- **Indice:** schema 4 della copia di lavoro con la tabella virtuale FTS5 `ricerca` (tokenizzatore `trigram remove_diacritics 1`, SQLite 3.50 incluso in rusqlite) e le colonne `id` (non indicizzata), `titolo`, `contenuto`, `tag`. In `tag` ci sono i percorsi completi dei tag della nota («lavoro/clienti»), così cercando un tag si trovano anche i sotto-tag. Alla migrazione l'indice si riempie con le note che ci sono.
- **A:** l'indice si aggiorna con i trigger su `note`, `note_tag` e `tag`, quindi anche con le modifiche ricevute dalla sincronizzazione. I percorsi dei tag li dà una funzione SQL registrata da Rust (`tag_della_nota`), perché i trigger di SQLite non ammettono query ricorsive.
- **Una o due lettere:** niente indice, si scorrono le note con la funzione SQL `normalizza` (minuscole, senza accenti).
- **Comando `cerca`:** riceve il testo e i filtri `tag` (percorsi), `creata` e `modificata` (intervalli `da`/`a` in UTC). Gli intervalli li calcola l'interfaccia nell'ora locale («Oggi» dalla mezzanotte locale). La creazione è la data scelta, o quella di sistema se manca (RF-04). Legge da solo l'impostazione delle note del cestino.
- **Risultati:** `id`, `titolo`, `estratto` con l'intervallo da evidenziare, `cartella`, `data`, `nelCestino`. Prima le note con la parola nel titolo o nei tag, poi solo nel testo (RB-34); in ogni gruppo, e con i soli filtri, per ultima modifica (RB-70).
- **Estratto:** calcolato in Rust, circa 80 caratteri attorno alla prima parola trovata, a parole intere; con i soli filtri è l'anteprima della colonna (RB-15).
- **Data mostrata:** quella del filtro di data attivo; senza, l'ultima modifica.
- **Pausa prima di cercare (RB-33):** 150 ms dall'ultimo tasto, nell'interfaccia.
- **Impostazione:** colonna `cestino_in_ricerca` della tabella `impostazioni`, sincronizzata con l'elemento «impostazioni» (RB-52); vuota vale acceso (RB-29). Comandi `impostazione_ricerca` e `imposta_ricerca`.

Scartate: B perché ogni via di scrittura (compresa la sincronizzazione) dovrebbe ricordarsi dell'indice; `snippet` perché con `remove_diacritics` le posizioni dei trigrammi non coincidono sempre con il testo mostrato e il risultato con le sole date non ha una parola da evidenziare.

## Conseguenze
- `architettura/api.md`: sezione «Ricerca (RF-08)»; `architettura/architettura.md`: schema 4 e indice.
- `client/src-tauri/src/archivio.rs`: schema 4, funzioni SQL, trigger; nuovo modulo per la ricerca; comandi in `comandi.rs`.
- `archivio_sinc.rs`: il campo `cestino_in_ricerca` nell'elemento «impostazioni». Un dispositivo con la versione di prima non conosce il campo: ricevendolo lo ignora; se poi rimanda le impostazioni, il campo torna vuoto (acceso). Rischio accettato con un solo utente.
