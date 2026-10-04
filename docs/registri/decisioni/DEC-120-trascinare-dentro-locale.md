# DEC-120 – File e cartelle trascinati dentro Memodu vanno in Locale

**Data:** 2026-10-04 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con RF-17 una cartella entra in Locale solo dal + della sezione, con la finestra di scelta del sistema. Manuel Cucca vuole poter trascinare file e cartelle da Esplora file (o dal Finder) dentro Memodu e trovarli subito in Locale.

## Opzioni valutate
- Un file trascinato da solo: A) entra la sua cartella e il file si apre; B) il file entra da solo in Locale; C) si apre e basta.
- Dove si rilascia: A) ovunque nella finestra; B) solo sulla sezione LOCALE.
- Tecnica: per avere i percorsi veri Tauri deve gestire il rilascio, e su Windows questo spegne il trascinamento HTML5 nella pagina, che la colonna usava per spostare note e cartelle. A) accendere il rilascio di Tauri e riscrivere il trascinamento interno con gli eventi del puntatore; B) tenere l'HTML5 e chiedere i percorsi a WebView2 con un messaggio apposito (solo Windows).

## Decisione
Scelte di Manuel Cucca del 04/10/2026:
- Una cartella trascinata entra in Locale come cartella; un file .md o .txt trascinato **entra da solo** nella radice di Locale (B), prima delle cartelle (DEC-119).
- Si rilascia **ovunque** nella finestra (A).
- **Rilascio di Tauri acceso** (`dragDropEnabled`) e trascinamento interno riscritto con gli eventi del puntatore (A), in `client/src/componenti/trascina.ts`.

Deduzioni dell'agente, da confermare:
- Mentre si trascina da fuori, la sezione LOCALE si evidenzia come una cartella che riceve e la colonna, se è chiusa, si apre.
- Quello che non è una cartella né un file .md o .txt resta fuori, con un avviso; quello che è già in Locale (o dentro una sua cartella) non si aggiunge di nuovo.
- Un solo file trascinato si apre subito; le cartelle trascinate si aprono nella colonna.
- Un file da solo in Locale ha nel tasto destro solo «Togli da Locale»; nel percorso si legge «Locale › nome».

## Conseguenze
- Nucleo: l'elenco di Locale accetta file .md e .txt (`aggiungi_cartella_locale`), riporta tipo e modifiche in sospeso di ogni elemento (`cartelle_locali`), nuovo comando `aggiungi_percorsi_locali`.
- Interfaccia: `useLocale.ts` (rilascio e evidenza), `SezioneLocale.tsx`, `FileAperto.tsx`, `FinestraPrincipale.tsx`; colonna e Locale con `trascina.ts` al posto del trascinamento HTML5 (via `fantasma.ts`).
- RF-17, FL-10, RB-73, `architettura/api.md`; piano di test TC-122 … TC-124.
- Il trascinamento interno va riprovato a mano anche sul Mac.
