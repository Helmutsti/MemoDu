# DEC-131 – La bollicina del formato

**Data:** 2026-10-09 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-130 la vista Markdown mostra il testo formattato, ma la formattazione si applica solo scrivendo i simboli a mano; nelle prove a mano (TC-10) il testo scritto subito dopo i simboli di chiusura resta nel formato, e Manuel Cucca ha deciso che si risolve con il cambio del formato. La pillola degli strumenti (CMP-10), che compariva sopra la selezione, è sospesa da DEC-64. Manuel Cucca vuole uno strumento per cambiare il formato che si veda solo in vista Markdown.

## Opzioni valutate
Per lo strumento:
- A) barra fissa, sempre visibile;
- B) una scelta nelle Impostazioni tra barra fissa e pillola;
- C) uno strumento che compare solo quando serve, senza impostazione.

Per cosa mostra la bollicina sul cursore in una parola in grassetto dentro un titolo:
- A) solo il formato della riga (`H1`);
- B) riga e carattere insieme (`H1 B`);
- C) il formato più specifico (`B`).

Per dove sta: A) fissa in basso a destra del foglio; B) nella riga del percorso; C) a sinistra della riga del cursore.

## Decisione
Scelte di Manuel Cucca del 09/10/2026:
- **Niente barra fissa né impostazione (C).** Lo strumento è una **bollicina** che sostituisce la pillola degli strumenti di CMP-10: c'è solo in vista Markdown, e così fa anche da segno della vista (se c'è, la nota è in Markdown).
- **Mostra il formato dove sta il cursore, riga e carattere insieme (B):** `H1 B`, `T B I`, `• S`; sul testo normale `T`, mai vuota. Con una selezione che mescola formati diversi mostra quello che vale per tutta la selezione (proposta dell'agente, nei criteri).
- **Con un clic si apre come un cassetto** con i formati di riga (testo normale, titolo, sottotitolo, elenco puntato, elenco numerato, casella), i formati di carattere (grassetto, corsivo, barrato, sottolineato) e «Rimuovi formattazione». Resta aperto finché si riprende a scrivere, con Esc, con un clic nel testo o fuori, o con un altro clic sulla bollicina.
- **Il sottolineato c'è, con la lettera U,** e si salva come `<u>…</u>`, anche se non è Markdown standard.
- **Senza selezione funziona come in Word:** un formato di carattere vale per la parola sotto il cursore; tra due parole o in fondo alla riga si accende o si spegne per il testo che si scrive dopo. I formati di riga valgono per la riga del cursore.
- **«Rimuovi formattazione» toglie tutto quello che la bollicina mostra:** la riga torna testo normale e il testo perde grassetto, corsivo, barrato e sottolineato (nella selezione, o nella parola sotto il cursore).
- **Dove:** fissa in basso a destra del foglio, galleggiante, con il cassetto che si apre verso sinistra (A). Nella nota rapida a sinistra nella fascia delle azioni, con il cassetto verso destra. Anche nei file `.md` di Locale.
- **Tastiera:** Ctrl + B grassetto, Ctrl + I corsivo, Ctrl + U sottolineato, Ctrl + Maiusc + S barrato (Ctrl + S resta «salva»), Ctrl + 1 titolo, Ctrl + 2 sottotitolo; si accendono e si spengono. Alt + F10 porta al cassetto. Sul Mac ⌘ al posto di Ctrl. Nessun'altra scorciatoia.
- **Scrivendo a inizio riga:** `- ` e `1. ` fanno gli elenchi, come già oggi; `-[]` fa la casella e si salva come `- [ ] `.
- **Il titolo di livello 3 non c'è per ora:** Ctrl + 3 non fa niente.

## Conseguenze
- Supera la parte di DEC-130 «niente pillola degli strumenti, niente scorciatoie di formattazione».
- `moduli/note/1-requisiti.md`: CA-02.3, CA-02.4 e CA-02.5 riscritti per la bollicina, le scorciatoie e il cassetto da tastiera; nuovi criteri per il cassetto, il caso senza selezione, «Rimuovi formattazione», `-[]`, la selezione mista e le superfici. CA-02.6 (menu del tasto destro) resta sospeso.
- `design-system/componenti.md`: CMP-10 diventa la bollicina del formato, da ridisegnare in Figma (Fase 5).
- Resta valido il comportamento di TC-10 senza la bollicina: i simboli scritti a mano tengono nel formato il testo che segue; con la bollicina o con le scorciatoie si spegne il formato.

## Aggiornamento del 09/10/2026
Scelte di Manuel Cucca durante la Fase 7: «l'importante è che la bolla funzioni e il vecchio editor per il txt anche».
- **L'editor resta CodeMirror:** la vista Testo e i file `.txt` non cambiano; i comandi della bollicina si scrivono sopra la libreria, appoggiati al riconoscimento del Markdown che c'è già, con le prove automatiche dei criteri. Scartati un editor nato per la scrittura formattata (Tiptap: riscrive il Markdown salvato, sottolineato come `++`) e i pacchetti di terzi (nessuno copre cassetto, formati di riga e «Rimuovi formattazione»).
- **Le scorciatoie sono rinviate:** Ctrl + B, I, U, Ctrl + Maiusc + S, Ctrl + 1, 2 e Alt + F10 (CA-02.3, CA-02.5). La bollicina funziona tutta con il mouse; da tastiera si arriva alla bollicina con Esc e poi Tab, come a ogni pulsante. I suggerimenti delle voci mostrano solo il nome.
