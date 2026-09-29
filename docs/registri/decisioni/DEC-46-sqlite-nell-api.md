# DEC-46 – SQLite nell'API Node

**Data:** 2026-09-29 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-45 porta note, tag, cartelle e cestino in un database. Oggi le note passano dall'API Node sulla stessa macchina (DEC-30); l'installazione è personale, per un solo utente, su Windows e macOS (DEC-13). Il database deve reggere la ricerca nel testo (RF-08), la cifratura (RNF-02) e, più avanti, la copia sul dispositivo nel nucleo Rust (DEC-02).

## Opzioni valutate
Dove: A) nell'API Node, al posto dei file; B) nel nucleo Rust dell'app.
Motore: A) SQLite, un file unico senza servizi da installare, ricerca a testo pieno (FTS5), disponibile anche in Rust; B) PostgreSQL, un servizio a parte; C) un database a documenti incorporato (LMDB, LevelDB), con indici e ricerca da costruire a mano.

## Decisione
Scelte di Manuel Cucca:
- Il database sta **per ora nell'API Node**, al posto dei file. L'app non cambia; la copia sul dispositivo arriva con la sincronizzazione.
- Il motore è **SQLite**. Il testo delle note resta markdown in una colonna di testo; un indice a testo pieno copre titolo e contenuto.
- Limiti verificati sulla documentazione di SQLite (sqlite.org/limits.html): un testo fino a 1 miliardo di byte con le impostazioni predefinite, un database fino a circa 281 TB. Con un solo utente le scritture una alla volta non sono un limite.

## Conseguenze
- `architettura/architettura.md`: archivio dell'API in SQLite.
- Da decidere: la libreria per usare SQLite da Node, lo schema, dove sta il file del database, la cifratura a riposo, il passaggio delle note già scritte come file.
- Le immagini (RF-03) si decideranno con il loro frammento: nel database o come file con il riferimento in tabella.
