# DEC-83 – Versioni diverse di app e server

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
SF-33: l'app e il server possono avere versioni diverse, per esempio dopo aver aggiornato solo uno dei due. Un'app vecchia non deve scrivere blocchi che una nuova non capisce, né il contrario. RNF-01 chiede che si possa scrivere sempre.

## Opzioni valutate
A) La sincronizzazione si ferma con l'avviso «errore di sincronizzazione» e si continua a lavorare sulla copia di lavoro.
B) Schermata di blocco, come per le credenziali rifiutate (RB-57).

## Decisione
Scelta di Manuel Cucca: **A**.
- Ogni richiesta di sincronizzazione porta la versione del protocollo; il server risponde se la conosce. Con versioni incompatibili la sincronizzazione si ferma e compare l'avviso «errore di sincronizzazione» (RB-40), con l'indicazione di aggiornare l'app o il server.
- Si continua a scrivere sulla copia di lavoro; appena le versioni tornano compatibili la sincronizzazione riparte da sola, senza perdere niente.

## Conseguenze
- FL-07: SF-33 gestita. Il testo dell'avviso si scrive con gli altri testi definitivi (Fase 6).
- Con DEC-75 … DEC-83 la Fase 7 della sincronizzazione è completa.
