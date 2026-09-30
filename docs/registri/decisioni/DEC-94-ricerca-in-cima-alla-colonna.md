# DEC-94 – Ricerca in cima alla colonna, con Ctrl + K e filtri anche senza testo

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
RF-08 e FL-06 chiedono di cercare e filtrare le note; il wireframe e CMP-13 mettono il campo in cima alla colonna, con la card dei risultati larga 480. Con il foglio unico (DEC-55) la colonna di solito è chiusa, quindi la ricerca non si vede. Restavano da decidere anche come si combinano più tag, se si può filtrare senza scrivere (RB-33 apre la card solo scrivendo) e come le parole cercate trovano le note.

## Opzioni valutate
Dove sta la ricerca: A) in cima alla colonna, con una scorciatoia che la apre; B) in una finestra al centro del foglio, stile Spotlight; C) tutte e due.
Scorciatoia: Ctrl + K, Ctrl + F, Ctrl + Maiusc + F.
Aprendo un risultato con la colonna aperta dalla scorciatoia: si richiude; resta aperta (DEC-56).
Più tag nel filtro: con tutti i tag; con almeno uno.
Campo vuoto: card con i filtri appena si entra nel campo; card solo scrivendo.
Parole: dall'inizio della parola; anche dentro la parola.
Filtro Fine validità: periodi in avanti; gli stessi periodi delle altre date; per ora niente.

## Decisione
Scelte di Manuel Cucca:
- **A:** la ricerca sta in cima alla colonna, sotto la riga della puntina; la card (CMP-13) si apre sopra il foglio.
- **Ctrl + K** (⌘ + K su macOS) apre la colonna, se è chiusa, e porta il cursore nel campo. Ctrl + F resta libero per una futura ricerca dentro la nota.
- Se la colonna l'ha aperta Ctrl + K, aprendo un risultato si richiude; fissata o aperta a mano resta com'era.
- Più tag nel filtro: escono le note che li hanno **tutti**, ciascuno con i suoi sotto-tag.
- La card si apre **appena si entra nel campo**, con i soli filtri: si può filtrare senza scrivere (supera RB-33 per l'apertura della card).
- Una parola si trova **anche dentro le altre parole** («lascio» trova «rilascio»); maiuscole e accenti non contano; con più parole servono tutte.
- Il filtro **Fine validità per ora non c'è**: i filtri sono Tag, Creazione e Modifica.

Proposte dell'agente, accettate da Manuel Cucca il 30/09/2026 con il riepilogo:
- Dalla terza lettera la ricerca usa un indice a trigrammi (FTS5 di SQLite) nella copia di lavoro; con una o due lettere scorre direttamente le note.
- Le date si cercano solo con i filtri: il testo scritto nel campo non cerca le date.
- Con il campo vuoto e almeno un filtro, i risultati sono in ordine di ultima modifica, la più recente in cima; con del testo vale la pertinenza (RB-34).
- Esc chiude la card; se la colonna l'aveva aperta Ctrl + K si richiude anche lei e il cursore torna dov'era nel foglio.
- Chiudendo la card il testo cercato e i filtri si svuotano: ogni ricerca riparte da zero.
- SC-06 ha la sezione **Ricerca** con l'interruttore «Mostra le note del cestino nei risultati», acceso di default (RB-29); si sincronizza come la scorciatoia (RB-52).

## Conseguenze
- RF-08: la ricerca non agisce sulla fine validità e le date passano solo dai filtri; rinvio del filtro Fine validità.
- RB-33 superata per l'apertura della card; FL-06 con il campo vuoto e i filtri da soli.
- SC-01 (zone, card dei risultati, scorciatoie), SC-06 (sezione Ricerca), EN-07 (preferenza sincronizzata), CMP-13 e CMP-09 (niente Fine validità, card vuota con i soli filtri).
- Copia di lavoro: tabella virtuale FTS5 con il tokenizzatore trigram, aggiornata con i trigger; nuovo schema.
- Da disegnare nei mockup: campo di ricerca in cima alla colonna, card con i soli filtri, risultati, nessun risultato, sezione Ricerca di SC-06.
