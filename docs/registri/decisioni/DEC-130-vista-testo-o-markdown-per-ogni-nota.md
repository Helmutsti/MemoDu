# DEC-130 – Ogni nota si vede come Testo o come Markdown

**Data:** 2026-10-08 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-64 la formattazione di RF-02 è stata sospesa: l'editor costruito con i simboli nascosti (DEC-58), la pillola degli strumenti, il menu «/», il menu del tasto destro e le scorciatoie non si comportava come un normale programma di scrittura. Con DEC-125 e DEC-129 il Markdown è il contenuto della 1.1.0. Manuel Cucca vuole reintrodurlo un passo alla volta, partendo dalla sola resa.

## Opzioni valutate
Per l'impostazione generale nessuna alternativa: è la richiesta di Manuel Cucca. Per i simboli in vista Markdown:
- A) visibili e attenuati, con l'evidenziazione pronta della libreria;
- B) nascosti tranne sulla riga in cui si scrive;
- C) nascosti sempre, anche sulla riga in cui si scrive, come in DEC-58.

## Decisione
Scelte di Manuel Cucca del 08/10/2026:
- **Una vista per ogni nota: Testo o Markdown.** Il testo salvato è sempre lo stesso, Markdown vero con i suoi simboli; cambia solo come l'editor lo mostra. In Testo i simboli si vedono come caratteri normali; in Markdown il testo appare già formattato.
- **La vista si salva con la nota**, e quindi la segue sugli altri computer. Cambiarla non è una modifica: non aggiorna «Modificata» e non sposta la nota nell'elenco.
- **Le note nuove nascono in Markdown; quelle scritte prima della 1.1.0 restano in Testo**, così nessuna nota già scritta cambia aspetto senza che lo si chieda.
- **La nota rapida (SC-02) mostra la nota nella sua vista**, come la finestra principale, ma senza la scelta: la vista si cambia dalla finestra principale.
- **I file di Locale prendono la vista dall'estensione:** `.md` in Markdown, `.txt` in Testo, senza scelta nella comparsa del file; la resa non cambia mai il contenuto del file.
- **Si sceglie nella comparsa Info** che si apre dal titolo della nota (CMP-24), con la Scelta a segmenti già usata per il tema (CMP-28).
- **L'editor resta quello di oggi** (CMP-20): in vista Markdown gli si aggiunge solo la resa.
- **Per i simboli: C**, nascosti sempre, come in DEC-58.
- **La scrittura funziona come in Word** (CA-02.15 … CA-02.19): il cursore si muove solo sui caratteri visibili; il testo scritto in fondo a un pezzo formattato ne prende la formattazione, quello scritto subito prima no; un pezzo formattato svuotato perde i suoi simboli; Invio dopo un titolo dà testo normale e in un elenco continua l'elenco o, su una voce vuota, lo chiude; Backspace all'inizio di una voce d'elenco toglie il segno e all'inizio di un titolo unisce la riga a quella sopra come testo; si copia il Markdown con i suoi simboli; la casella della checklist si spunta con un clic (CA-02.20). Sono comportamenti della scrittura, non comandi: restano escluse le scorciatoie di formattazione.
- **Solo la resa e basta:** niente pillola degli strumenti, niente menu «/», niente menu del tasto destro di Memodu, niente scorciatoie di formattazione né comandi della tastiera in più. CA-02.3 … CA-02.6 restano sospesi e si ridefiniscono dopo.

## Conseguenze
- Supera DEC-64 per la parte del testo puro: il testo puro diventa la vista Testo.
- `moduli/note/1-requisiti.md`: CA-02.2 torna valido per la vista Markdown; criterio nuovo per la scelta della vista.
- Nella copia di lavoro un campo nuovo della nota, sincronizzato come gli altri campi non di testo (DEC-109); il server non cambia. Il nome non può essere `formato`, che nei blocchi indica la cifratura (DEC-78).
- Il codice conservato in `client/src/editor/` (`anteprima.ts`) si riprende per la resa, senza la pillola, il menu «/» e le scorciatoie.
- `avanzamento.md`: il rinvio del Markdown lascia la tabella dei Rinvii e diventa il ciclo della 1.1.0.
