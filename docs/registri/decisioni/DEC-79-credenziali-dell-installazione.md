# DEC-79 – Credenziali dell'installazione: come nascono e dove stanno

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-13 e RB-54 stabiliscono che installando il server si generano le credenziali, che autorizzano i dispositivi e contengono la chiave di cifratura, e che si scrivono nel file di configurazione dell'app. Restavano da decidere come si generano, come le usa il server e dove le tiene il dispositivo (EN-05).

## Opzioni valutate
Dove le tiene il dispositivo: A) nel file di configurazione, letto a ogni avvio; B) nel portachiavi del sistema, con il file usato solo per l'installazione.

## Decisione
Scelta di Manuel Cucca: **A**. Le credenziali stanno nel file `credenziali` della cartella dei dati di Memodu (DEC-46; `MEMODU_CARTELLA` la sostituisce per le prove), letto a ogni avvio; Riprova lo rilegge (DEC-20).

Proposte dell'agente, da confermare:
- **Generazione:** al primo avvio il server crea l'identificativo dell'installazione, un gettone casuale di 256 bit per autorizzare e una chiave casuale di 256 bit per la cifratura (per ora non usata, DEC-78). Li mostra una volta come un'unica riga di testo da copiare nel file dell'app.
- **Sul server:** si conserva solo l'impronta del gettone, mai il gettone né la chiave.
- **Richieste:** il gettone viaggia nell'intestazione di ogni richiesta di sincronizzazione; un gettone mancante o sbagliato riceve 401 e il client mostra la schermata di blocco (RB-57).

## Conseguenze
- EN-05: dove stanno le credenziali. Il cambio delle credenziali e il portachiavi del sistema si rivalutano quando si accende la cifratura.
- Rischio già accettato in DEC-13: chi legge il file legge tutte le note.
- `architettura/architettura.md`, `architettura/api.md` (autorizzazione).
