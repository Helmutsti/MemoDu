# DEC-64 – Per ora il testo della nota è puro: il markdown torna dopo

**Data:** 2026-09-29 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
RF-02 chiede la scrittura in markdown con formattazione minima; DEC-27 l'ha realizzata con CodeMirror, un editor di codice, aggiungendo a mano l'anteprima dal vivo, i simboli nascosti (DEC-58), la pillola, il menu «/», il menu del tasto destro e i comandi di Tab. Provandolo, Manuel Cucca ha trovato comportamenti che non funzionano come in un normale programma di scrittura («vorrei che le funzioni di scrittura funzionassero sempre senza dovermele ricordare o correggere a mano»).

## Opzioni valutate
A) Cambiare motore con un editor nato per la scrittura (per esempio Tiptap su ProseMirror) e tenere il markdown.
B) Restare su CodeMirror con i suoi pacchetti già pronti per il markdown.
C) Per ora testo puro con CodeMirror e i soli comandi standard; il markdown si integra dopo.

## Decisione
Scelta di Manuel Cucca: **C**. «Per ora vorrei rendere l'applicazione come code editor, con testo puro; poi integriamo il markdown dopo.»
- Quello che si scrive resta com'è: `#`, `**`, `-` sono caratteri normali, niente formattazione né simboli nascosti.
- Solo comandi standard di CodeMirror: Tab inserisce una tabulazione o rientra le righe selezionate, Maiusc + Tab toglie il rientro della riga; annulla, ripeti, selezione, taglia, copia e incolla (solo testo); Esc e poi Tab escono dall'editor.
- Niente pillola degli strumenti, niente menu «/», niente menu del tasto destro di Memodu: il tasto destro apre quello del sistema.
- Il codice del markdown resta nel repository, non collegato (`app/src/editor/EditorMarkdown.tsx`, `anteprima.ts`, `comandi.ts`, `formati.ts`, con le loro prove).

## Conseguenze
- Sospesi fino al ritorno del markdown: CA-02.2 … CA-02.6, TC-10 … TC-14, e con loro le parti di DEC-27, DEC-58 (markdown nascosto) e ID-26 (Tab sugli elenchi) che riguardano il markdown. Le note già scritte con il markdown mostrano i simboli in chiaro.
- Invito del testo vuoto: «Scrivi qui…», come nella nota rapida (il menu «/» non c'è più).
- Rinvio in `avanzamento.md`: integrare il markdown, scegliendo allora tra le opzioni A e B.
