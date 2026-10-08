# Componenti

<!-- Fase 5 della guida. Copia il blocco per ogni componente. -->

I componenti vivono nel file Figma [Memodu – Design system](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE), che diventa la libreria: pagina **Componenti base** (CMP-01 … CMP-08 e CMP-28) e pagina **Componenti composti** (CMP-09 … CMP-27 e CMP-29 … CMP-32). Ogni componente usa solo token semantici, anche per gli spazi (regola 12, vedi `tokens.md`) e ha un'anteprima in modo scuro.

| Codice | Componente | Tipo | Stato |
|---|---|---|---|
| CMP-01 | Pulsante (con la variante Diviso, DEC-34) | base | Disegnato |
| CMP-02 | Icona | base | 42 icone, 4 dimensioni |
| CMP-03 | Campo di testo | base | Disegnato |
| CMP-04 | Interruttore | base | Disegnato |
| CMP-05 | Tag | base | Disegnato |
| CMP-06 | Riga della colonna | base | Disegnato |
| CMP-07 | Voce di menu | base | Disegnato |
| CMP-08 | Suggerimento | base | Disegnato |
| CMP-09 | Menu (tasto destro, inserimento con `/`, suggerimenti dei tag) | composto | Disegnato |
| CMP-10 | Pillola degli strumenti | composto | Disegnato |
| CMP-11 | Pannello a comparsa | composto | Disegnato |
| CMP-12 | Date picker | composto | Disegnato |
| CMP-13 | Ricerca con card dei risultati e filtri | composto | Disegnato |
| CMP-14 | Albero delle cartelle | composto | Disegnato |
| CMP-15 | Avviso | composto | Disegnato |
| CMP-16 | Finestra di conferma | composto | Disegnato |
| CMP-17 | Elemento del cestino | composto | Disegnato |
| CMP-18 | Riga di impostazione | composto | Disegnato |
| CMP-19 | Stato vuoto | composto | Disegnato |
| CMP-20 | Testo della nota (campo titolo e stili dell'editor) | composto | Disegnato |
| CMP-21 | Immagine nel testo e area di trascinamento | composto | Disegnato |
| CMP-22 | Modulo di accesso (finestra sopra le note, DEC-121) | composto | Disegnato |
| CMP-23 | Nota rapida | composto | Disegnato |
| CMP-24 | Info (comparsa sotto il titolo e finestra al centro, DEC-96; righe con l'icona, DEC-97; Info del file, DEC-123) | composto | Disegnato |
| CMP-25 | Barra di scorrimento | composto | Disegnato |
| CMP-26 | Percorso (titolo della nota con le cartelle, DEC-71) | composto | Disegnato |
| CMP-27 | Comparsa dei metadati (DEC-71) | composto | Superato da CMP-24 (DEC-96) |
| CMP-28 | Scelta a segmenti (tema, DEC-91) | base | Disegnato |
| CMP-29 | Ricerca avanzata (DEC-96) | composto | Disegnato |
| CMP-30 | Fondo della colonna (Cestino e Impostazioni, ombra quando il contenuto scorre sotto) | composto | Disegnato |
| CMP-31 | Gruppo di impostazioni (titolo e righe in un riquadro, DEC-122) | composto | Disegnato |
| CMP-32 | Box dell'account (in cima alle impostazioni, DEC-122) | composto | Disegnato |

L'icona nell'area di notifica (Windows) o nella barra dei menu (macOS) è un'icona di sistema e non è un componente.

### Parti interne
Nella sezione **Parti interne** della pagina Componenti composti ci sono i pezzi con cui sono costruiti i composti: non si usano da soli, si modificano lì e cambiano ovunque. Strumento e Divisore della pillola (CMP-10), Giorno del calendario (CMP-12), Filtro e Risultato della ricerca (CMP-13), Campo nome nell'albero e Cestino di trascinamento (CMP-14), Casella della checklist e Riga dei metadati (CMP-20), Segmento del percorso (CMP-26).

### Stato Focus
L'anello `focus-anello` degli stati Focus si vede solo mentre ci si muove con la tastiera (Tab e frecce fuori dal testo); un clic lo spegne (DEC-74). L'anello di errore dei campi resta sempre.

### Cursore (DEC-124)
Su tutto ciò che si clicca il cursore è la manina: pulsanti, voci di menu, righe della colonna e dell'albero, segmenti del percorso, righe delle impostazioni, scelte a segmenti, tag, filtri, risultati della ricerca, interruttori, caselle della checklist. Nei campi e nel testo della nota resta il cursore del testo; sugli elementi disabilitati la freccia.

### Forma dell'evidenziazione
Tutto ciò che è alto una riga ha la pillola (regola 1). I blocchi su più righe dentro un contenitore (risultati della ricerca, elementi del cestino, righe di impostazione) hanno il rettangolo con `raggio-interno` (12), concentrico al contenitore (20 − 8 di margine): una pillola alta più righe diventerebbe un ovale.

### Spazi dei contenitori (DEC-100)
Il margine di un contenitore dipende dal suo **ruolo**, non dal componente né dal fatto che galleggi:

| Ruolo | Quando | Margine su tutti i lati | Distanze dentro |
|---|---|---|---|
| **Elenco** | Ogni riga si evidenzia ed è il contenuto: menu, suggerimenti, Sposta in, card dei risultati, calendario | `spazio-elenco` (8): le pillole sono concentriche con gli angoli (20 − 8 = 12) | Voci attaccate (0): l'evidenziazione passa da una all'altra |
| **Pannello** | Contenuto da leggere e modificare: Info, colonna, avvisi, ricerca avanzata | `spazio-pannello` (16) | Righe a `spazio-elemento` (4), così le pillole non si toccano; blocchi a `spazio-blocco` (16) |
| **Finestra** | Un messaggio che interrompe, al centro con il velo: finestre di conferma | `spazio-finestra` (24) | Come il pannello |

- **Ogni riga è una pillola alta 32 con `spazio-controllo` (12) dentro**, interattiva o no: righe della colonna, cartelle comprese; righe di Info, «Modificata», intestazione; voci, campi. Il 12 non è un margine in più ma l'anatomia della riga: in un pannello tutto parte a 28 dal bordo (16 + 12), in un elenco a 20 (8 + 12).
- **Un contenitore misto** prende il margine del suo ruolo; un elenco dentro un pannello (le voci in fondo a Info, i filtri della ricerca avanzata) è un blocco a tutta larghezza, senza margine suo.
- **Albero:** rientro di `spazio-rientro` (24) per livello, uguale a icona 16 + `spazio-icona` 8: l'icona di una sottocartella parte sotto il nome della cartella che la contiene, e i nomi dello stesso livello, note e cartelle, sono allineati.
- Nessun pezzo prende un margine suo per allargarsi o stringersi; prima di mostrare un componente si misurano da script le distanze dal bordo, sopra, sotto e ai lati.

### Come si decidono padding e gap (DEC-100)
Il **padding** appartiene a chi ha un **bordo** (fondo, contorno, evidenziazione o raggio); il **gap** appartiene alla **relazione** tra due pezzi vicini. Per ogni pezzo, tre domande in quest'ordine:
1. **Ha un bordo?** No: niente padding, sta dove lo mette il suo contenitore. Sì: il padding del suo ruolo.
2. **Che ruolo ha il contenitore?** Elenco, pannello o finestra: ne viene il margine (tabella sopra).
3. **Che legame c'è tra i pezzi vicini?** Ne viene il gap, dalla scala qui sotto.

| Chi ha il bordo | Padding |
|---|---|
| Pillola alta 32 (riga, voce, campo) | `spazio-controllo` 12, ai lati |
| Pillola alta 24 (tag, filtro) | `spazio-controllo-piccolo` 8, ai lati |
| Segmento della Scelta a segmenti (CMP-28), alto 24 | `spazio-controllo` 12, ai lati, come nella libreria e nel codice (eccezione alla riga sopra) |
| Pulsante | `spazio-pulsante` 16, ai lati |
| Contenitore elenco · pannello · finestra | `spazio-elenco` 8 · `spazio-pannello` 16 · `spazio-finestra` 24, su tutti i lati |

| Legame tra pezzi vicini | Esempio | Gap |
|---|---|---|
| Condividono un'evidenziazione che scorre | voci di un menu | 0 |
| Stessa cosa, ripetuta | righe della colonna e di Info, tag | `spazio-elemento` 4 |
| Pezzi diversi che si leggono come uno | icona e testo, titolo e descrizione | `spazio-icona` 8 (`spazio-icona-piccola` 4 nei controlli alti 24) |
| Blocchi diversi dello stesso contenitore | titolo, righe e voci di Info | `spazio-blocco` 16 |
| Sezioni con un titolo proprio | «CLOUD» e «LOCALE» | `spazio-gruppo` 24 |

Controlli:
- **Fuori non meno che dentro:** in un contenitore il gap tra i blocchi non supera il suo margine (pannello: 16 e 16), così si legge come un'unità. Le pillole fanno eccezione: le separa il loro fondo, non lo spazio.
- **Al massimo due spazi tra il bordo e il primo testo:** quello del contenitore e quello della pillola (16 + 12 = 28); un terzo è di troppo.
- **I bordi si allineano ai bordi, i contenuti ai contenuti:** pillole, campi e pulsanti stanno sul margine del contenitore; testi e icone partono dopo il padding della pillola.
- **Il padding non serve ad allineare:** due pezzi si allineano perché hanno la stessa anatomia.
- **Si misura:** prima di mostrare un componente si leggono da script le distanze dal bordo e tra i blocchi e si confrontano con queste tabelle.

### Superfici su cui compare ogni componente
Ogni componente si verifica su tutte le superfici in cui può comparire, in chiaro e in scuro (regola visiva 11, tabella "Fondi dei controlli sulle superfici" in `tokens.md`). I componenti flottanti hanno la propria superficie, `sfondo-flottante`, e si staccano dal resto con l'ombra.

| Componente | Nota | Colonna | Flottante | Fondi propri |
|---|---|---|---|---|
| CMP-01 Pulsante | ✓ (cestino, stati vuoti) | ✓ (+, riquadri delle impostazioni) | ✓ (finestre di conferma, pannelli) | campo, hover, premuto, pieno |
| CMP-02 Icona | ✓ | ✓ | ✓ | — |
| CMP-03 Campo di testo | | ✓ (ricerca, riquadri delle impostazioni) | ✓ (pannelli, menu, Info, accesso) | campo |
| CMP-04 Interruttore | | ✓ (riquadri delle impostazioni) | | hover, pieno |
| CMP-05 Tag | | | ✓ (Info, filtri della ricerca) | campo, hover, pieno |
| CMP-06 Riga della colonna | | ✓ | | hover, pieno; numero di note in testo tenue (RB-56) |
| CMP-07 Voce di menu | | | ✓ | hover, errore |
| CMP-08 Suggerimento | ✓ | ✓ | ✓ | pieno (flottante lui stesso) |
| CMP-14 Albero delle cartelle | | ✓ | | hover, pieno, campo, errore (cestino di trascinamento) |
| CMP-17 Elemento del cestino | ✓ | | | hover |
| CMP-18 Riga di impostazione | ✓ (titolo di gruppo) | ✓ (nei riquadri di CMP-31 e CMP-32) | | hover, campo |
| CMP-19 Stato vuoto | ✓ | ✓ (riga) | ✓ (card dei risultati) | pieno (pulsante) |
| CMP-20 Testo della nota | ✓ | | | pieno (casella spuntata), evidenziazione |
| CMP-21 Immagine nel testo | ✓ | | | campo (segnaposto), pieno (selezione) |
| CMP-25 Barra di scorrimento | ✓ | ✓ | ✓ (Info, card dei risultati, ricerca avanzata, Sposta in) | nessuno: `icona-tenue` al 50 % o all'80 % |
| CMP-26 Percorso | ✓ (fascia in alto) | | | hover |
| CMP-27 Comparsa dei metadati (superata) | sopra la nota | | è la superficie | flottante, con ombra; dentro: tag |
| CMP-28 Scelta a segmenti | | ✓ (riquadri delle impostazioni) | | campo, hover, pieno |
| CMP-31 Gruppo di impostazioni · CMP-32 Box dell'account | ✓ (il riquadro è `sfondo-colonna` su `sfondo-nota`) | | | i fondi delle righe, dei campi, degli interruttori e dei pulsanti stanno su `sfondo-colonna`; pieno (iniziale), stati (pallino) |
| CMP-09 Menu · CMP-10 Pillola · CMP-11 Pannello · CMP-12 Date picker · CMP-13 Card dei risultati · CMP-15 Avviso · CMP-16 Finestra di conferma · CMP-22 Modulo di accesso · CMP-24 Info · CMP-29 Ricerca avanzata | sopra la nota | sopra la colonna | sono la superficie | flottante, con ombra; dentro: hover, pieno, campo |

**Verifica per ogni componente nuovo:** prima di segnarlo come Disegnato, (1) elencare le superfici su cui compare in questa tabella; (2) controllare nella tabella dei token che ogni suo fondo sia sopra la soglia su quelle superfici, in entrambi i modi; (3) controllarlo a occhio nell'anteprima scura, meglio se dentro un menu o un pannello, dove i grigi sono più vicini.

---

## CMP-01 – Pulsante
**Tipo:** base · **Usato in:** SC-01, SC-02, SC-03, SC-04, SC-06, SC-07 · **Figma:** [Pulsante](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=20-170)

**Scopo:** far partire un'azione con un clic o con Invio.
**Quando usarlo:** per un'azione esplicita (Ripristina, Svuota cestino, Annulla, +).
**Quando non usarlo:** per andare in un altro punto dell'app da una lista (si usa la riga della colonna, CMP-06) o per un'impostazione acceso/spento (interruttore, CMP-04).

### Varianti e dimensioni
- **Primario:** sfondo `sfondo-pieno`, testo `testo-su-pieno`. L'azione principale della zona, al massimo uno (es. "Svuota" nella finestra di conferma).
- **Secondario:** sfondo `sfondo-campo`, testo `testo-primario`. Azioni di supporto accanto al primario (Annulla).
- **Tenue:** senza sfondo, testo `testo-tenue`. Azioni minori in liste e pannelli (Ripristina nel cestino).
- **Solo icona:** 32 × 32, icona `icona-tenue`. Azioni ripetute con un'icona chiara (+ di CLOUD e di LOCALE, ✕ delle finestre). Il ··· della fascia in alto di SC-01 non c'è più: le azioni della nota stanno in Info (CMP-24, DEC-96).
- **Solo icona piccolo:** 24 × 24 (`misura-controllo-piccolo`), tondo (`raggio-pillola`), margini 4 (`spazio-elemento`), icona 16 in `icona-tenue`; stessi stati del solo icona da 32 (in Figma `Tipo=Solo icona piccolo`). Solo dentro la pillola flottante in alto a destra di SC-01: i pulsanti della finestra _ [] X (DEC-62, DEC-63; il ··· non c'è più, DEC-96). L'anello di focus è largo 32. Chiudi, sotto il mouse e premuto, è rosso (`rosso-500`) con la croce bianca (`grigio-0`), in chiaro e in scuro, come su Windows: usa i primitivi, perché nessun token semantico ha questo ruolo.
- **Diviso** (DEC-34): solo primario. Può mostrare la scorciatoia dell'azione accanto all'etichetta con le icone dei tasti, 12 px, `icona-su-pieno` al 70 %, 8 px dopo il testo e 4 tra le icone (DEC-65, in SC-02: ⇧ ↵). A sinistra l'azione (Chiudi nella nota rapida, margini 16 e 12), a destra la freccia ▾ (`chevron-down`, `icona-su-pieno`, margini 8 e 12) che apre un menu (CMP-09) con le azioni collegate; tra le due un divisore di 1 × 16 in `sfondo-pieno-hover`. Hover separato sulle due metà (`sfondo-pieno-hover`); con il menu aperto la freccia è `sfondo-pieno-premuto`; l'anello di focus segue la pillola intera. La freccia ha il nome accessibile e il suggerimento «Altre azioni» (CMP-08). In Figma è il componente [Pulsante diviso](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=136-703), con le proprietà Etichetta, **Mostra scorciatoia** (spenta di default, e allora il pulsante non cambia) e **Tasto 1** e **Tasto 2** per scambiare le icone dei tasti (di default Maiusc e Invio). Usato in SC-02.
- Una sola dimensione, a parte il solo icona piccolo: alto 32 (`misura-riga`), pillola (`raggio-pillola`), margini laterali 16 (8 per il solo icona), distanza tra icona e testo 8, testo Interfaccia/Controllo attivo.
- Proprietà: **Etichetta** (testo), **Mostra icona** (icona a sinistra del testo, spenta di default), **Icona** (una qualsiasi icona di CMP-02).

### Stati
| Stato | Descrizione |
|---|---|
| Default | Come nelle varianti |
| Hover | Primario: `sfondo-pieno-hover`. Secondario, tenue e solo icona: `sfondo-hover`; il testo del tenue passa a `testo-primario` (regola 7) |
| Focus | Anello `focus-anello` di 2 px (`focus-spessore`), staccato 2 px (`focus-distanza`), con la forma del pulsante. Solo da tastiera |
| Attivo | Premuto: primario `sfondo-pieno-premuto`, gli altri `sfondo-premuto` |
| Disabilitato | Tutto il pulsante a opacità 40% (`opacita-disabilitato`); non riceve clic né focus |
| Errore | Non previsto: l'errore si mostra nel messaggio vicino al pulsante, non sul pulsante |
| Caricamento | L'icona lascia il posto a quella di caricamento, che gira; l'etichetta resta, il pulsante non riceve altri clic |

### Accessibilità
- **Tastiera:** si raggiunge con Tab, si attiva con Invio o Spazio. Nelle finestre di conferma il focus parte dal pulsante secondario (Annulla), per non confermare per errore un'azione non reversibile.
- **Lettori di schermo:** ruolo "pulsante" con il nome dell'etichetta. Il solo icona ha sempre un nome accessibile e un suggerimento (CMP-08) con lo stesso testo (es. "Nuova nota"). In caricamento si annuncia "in corso".
- **Contrasti:** testo su tutti gli sfondi ≥ 4,5:1, icone ≥ 3:1 (verificati in `tokens.md`); l'area cliccabile del solo icona è 32 × 32 (24 × 24 il piccolo, dentro la pillola alta 32).

### Esempi
- ✅ Corretto: nella finestra "Svuotare il cestino?" un primario "Svuota" a destra e un secondario "Annulla" a sinistra.
- ❌ Scorretto: due pulsanti primari affiancati, o un solo icona senza suggerimento.

---

## CMP-02 – Icona
**Tipo:** base · **Usato in:** tutte le schermate · **Figma:** pagina Componenti base, in alto

**Scopo:** riconoscere un'azione o un oggetto a colpo d'occhio.
**Quando usarlo:** accanto o al posto di un'etichetta, quando il simbolo è chiaro.
**Quando non usarlo:** da sola, per azioni poco comuni: serve anche il testo.

### Varianti e dimensioni
- Libreria **Lucide** (DEC-15), icone di linea, colore `icona-tenue` o `icona-su-pieno`.
- Variante **Dimensione**: 12, 16 (default, `misura-icona`), 20 e 24 px. Il tratto resta 1,5 (`tratto-icona`) a tutte le dimensioni, così le icone piccole non diventano sottili e le grandi non diventano pesanti.
- Ogni icona è un set di componenti `Icona/<nome>` con la fonte Lucide nella descrizione. Nei componenti si scambia con la proprietà Icona e si sceglie la dimensione con la variante, senza ridimensionare l'istanza.
- Le icone restano fatte di più tracciati, come in Lucide. Se in un'istanza si cambia icona dopo averla colorata, il colore non passa alla nuova: si ricolorano tutti i tracciati insieme (in Figma, dal pannello "Colori della selezione").
- Primo nucleo: **più** (`plus`), **altro** (`ellipsis`), **caricamento** (`loader-circle`), **cerca** (`search`), **calendario** (`calendar`), **chiudi** (`x`), **errore** (`circle-alert`), **freccia destra** (`chevron-right`), **freccia giù** (`chevron-down`), **titolo** (`heading-1`), **sottotitolo** (`heading-2`), **elenco puntato** (`list`), **elenco numerato** (`list-ordered`), **checklist** (`list-checks`), **immagine** (`image`), **elimina** (`trash-2`), **tag** (`tag`), **sposta** (`folder-input`), **impostazioni** (`settings`), **grassetto** (`bold`), **corsivo** (`italic`), **sottolineato** (`underline`), **barrato** (`strikethrough`), **spunta** (`check`), **freccia sinistra** (`chevron-left`), **cartella** (`folder`), **cartella aperta** (`folder-open`, per la colonna, DEC-99), **utente** (`user`, per il box dell'account senza accesso, DEC-122), **togli da locale** (`folder-minus`, per Togli da Locale nella comparsa del file, DEC-123), **nota** (`file-text`), **avviso** (`triangle-alert`), **informazione** (`info`), **mostra** (`eye`), **rinomina** (`pencil`), **taglia** (`scissors`), **copia** (`copy`), **incolla** (`clipboard`), **apri colonna** (`panel-left-open`), **chiudi colonna** (`panel-left-close`) e **puntina** (`pin`) per la colonna del foglio unico (DEC-55), **maiusc** (`arrow-big-up`) e **invio** (`corner-down-left`) per la scorciatoia di Chiudi nella nota rapida (DEC-65). Le altre si aggiungono quando servono ai componenti.

### Stati
| Stato | Descrizione |
|---|---|
| Default | `icona-tenue` |
| Hover · Focus · Attivo · Disabilitato | Li gestisce il componente che contiene l'icona |
| Caricamento | L'icona `caricamento` gira |

### Accessibilità
- **Tastiera:** l'icona da sola non riceve il focus; lo riceve il pulsante che la contiene.
- **Lettori di schermo:** decorativa se c'è un'etichetta accanto; altrimenti il nome accessibile sta sul componente che la contiene.

### Esempi
- ✅ Corretto: `+` accanto a "CLOUD" con suggerimento "Aggiungi".
- ❌ Scorretto: disegnare un'icona a mano quando Lucide ne ha una equivalente.

---

## CMP-03 – Campo di testo
**Tipo:** base · **Usato in:** SC-01 (ricerca della colonna e ricerca avanzata, «Cerca un tag», «Cerca una cartella»), SC-01 e SC-03 (titolo e tag in Info, CMP-24), SC-06 (scorciatoia, nome del dispositivo) · **Figma:** [Campo di testo](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=25-270)

**Scopo:** scrivere una riga di testo: un nome, una data, una ricerca; nel caso della scorciatoia, registrare una combinazione di tasti.
**Quando usarlo:** quando il valore si scrive; con l'icona a destra quando c'è anche un modo alternativo di sceglierlo (il calendario per le date).
**Quando non usarlo:** per il testo della nota (editor, CMP-20), per scegliere tra poche opzioni fisse (interruttore CMP-04 o menu CMP-09), per il nome di una cartella direttamente nell'albero (campo nome, dentro CMP-14).

### Varianti e dimensioni
- **Normale:** solo il testo.
- **Ricerca:** icona cerca a sinistra; quando è compilata compare ✕ per cancellare. Proprietà **Mostra scorciatoia**, spenta di base: accesa solo nel campo della colonna, mostra a destra «Ctrl + K» (⌘ + K su macOS) in Interfaccia/Dettaglio e `testo-tenue` finché il campo è vuoto (DEC-101).
- **Password:** il valore si vede come pallini; l'icona a occhio a destra lo mostra e lo nasconde. Serve al modulo di accesso (CMP-22), attivo con DEC-121.
- **Con icona:** icona a destra (di default il calendario), che apre la scelta alternativa. Proprietà **Icona** per cambiarla.
- **Campo della scorciatoia** (SC-06, RB-52): è un campo normale con testi suoi ("Nessuna scorciatoia", al focus "Premi i tasti…"). Non scrive testo ma registra la prima combinazione premuta, che diventa il valore (es. "Ctrl + Alt + N"). Non è una variante: l'aspetto è lo stesso, cambia solo il comportamento.
- Una sola dimensione: alto 32 (`misura-riga`), pillola, sfondo `sfondo-campo`, margini 12, distanza 8 tra icone e testo, testo Interfaccia/Controllo. La larghezza la decide chi lo usa (240 negli esempi).
- Segnaposto in `testo-tenue`, valore in `testo-primario`. Il testo troppo lungo finisce con i puntini.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Vuoto, con il segnaposto |
| Hover | Nessun cambiamento visivo, cambia solo il cursore: scurire il fondo porterebbe il segnaposto sotto 4,5:1 |
| Focus | Anello `focus-anello` di 2 px staccato 2 px e cursore lampeggiante dopo il testo. Si vede anche con il mouse, perché si sta scrivendo lì |
| Compilato | Il valore in `testo-primario` |
| Disabilitato | Tutto il campo a opacità 40% |
| Errore | Anello in `icona-errore` e, sotto il campo, icona errore con il messaggio in `testo-errore` (Interfaccia/Dettaglio), 8 px sotto l'anello e allineato al testo del campo (12 px dal bordo); un messaggio lungo va a capo. La ricerca non ha errore |
| Caricamento | Non previsto: la ricerca è sul dispositivo (DEC-08) e risponde mentre si scrive |

### Accessibilità
- **Tastiera:** si raggiunge con Tab. Esc cancella la ricerca; nel campo della scorciatoia Esc annulla la registrazione e Backspace toglie la combinazione.
- **Lettori di schermo:** ogni campo ha un'etichetta accessibile anche quando si vede solo il segnaposto (es. "Cerca nelle note"). Il messaggio di errore è collegato al campo e si annuncia quando compare. L'icona a destra è un pulsante con il suo nome (es. "Scegli dal calendario").
- **Contrasti:** segnaposto `testo-tenue` su `sfondo-campo` 4,61:1 in chiaro e 4,65:1 in scuro; messaggio di errore su `sfondo-nota` ≥ 6:1.

### Esempi
- ✅ Corretto: "Data non valida" sotto il campo, con il campo che resta modificabile.
- ❌ Scorretto: usare il segnaposto al posto dell'etichetta per spiegare cosa scrivere in un modulo con più campi.

---

## CMP-04 – Interruttore
**Tipo:** base · **Usato in:** SC-06 (avvio all'accensione, «Tieni Memodu in primo piano», note del cestino nei risultati) · **Figma:** [Interruttore](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=30-296)

**Scopo:** accendere o spegnere un'impostazione, con effetto immediato.
**Quando usarlo:** per un'impostazione con due valori che si applica subito, senza pulsante Salva.
**Quando non usarlo:** per scegliere tra più di due opzioni (menu, CMP-09) o per un'azione che parte al clic (pulsante, CMP-01).

### Varianti e dimensioni
- **Spento:** pista con solo il contorno in `icona-tenue` (tratto 1,5) e pallino di 8 px in `icona-tenue`, a sinistra.
- **Acceso:** pista piena in `sfondo-pieno` e pallino di 12 px in `icona-su-pieno`, a destra.
- Una sola dimensione: 28 × 16, pillola. Nella riga di impostazione (CMP-18) si clicca su tutta la riga, non solo sull'interruttore.
- Senza etichetta propria: il nome è l'etichetta della riga di impostazione.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Come nelle varianti |
| Hover | Spento: la pista si riempie di `sfondo-hover`. Acceso: `sfondo-pieno-hover` |
| Focus | Anello `focus-anello` di 2 px staccato 2 px |
| Attivo | Al clic il pallino scorre dall'altra parte (`movimento-durata-breve`, 120 ms) |
| Disabilitato | Opacità 40% |
| Errore | Non previsto: il cambio vale subito; se non si può salvare, compare un avviso (CMP-15) |
| Caricamento | Non previsto: le impostazioni sono sulla copia di lavoro |

### Accessibilità
- **Tastiera:** si raggiunge con Tab e si cambia con Spazio.
- **Lettori di schermo:** ruolo "interruttore", con stato attivo o disattivo e il nome dell'etichetta della riga.
- **Contrasti:** contorno e pallino da spento ≥ 3:1 su `sfondo-nota` e `sfondo-colonna` in entrambi i modi (4,99:1 il più basso); acceso, pista su sfondo e pallino su pista ≥ 14:1. Il valore si riconosce anche senza colore, dalla posizione e dalla dimensione del pallino.

### Esempi
- ✅ Corretto: "Avvia Memodu all'accensione" con l'interruttore a destra della riga.
- ❌ Scorretto: un interruttore che chiede conferma o che va salvato con un pulsante.

---

## CMP-05 – Tag
**Tipo:** base · **Usato in:** SC-01 e SC-03 (tag della nota in Info, CMP-24), SC-01 (filtri nella card dei risultati) · **Figma:** [Tag](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=31-319)

**Scopo:** mostrare un tag di una nota e permettere di toglierlo, o di usarlo come filtro nella ricerca.
**Quando usarlo:** per i tag della nota aperta e per i filtri per tag della ricerca (FL-04, FL-06).
**Quando non usarlo:** per la cartella di una nota (è un testo nel risultato) o per etichette di stato (si usa l'avviso, CMP-15).

### Varianti e dimensioni
- Pillola alta 24 (`misura-controllo-piccolo`), margini 8, testo Interfaccia/Controllo in `testo-primario` su `sfondo-campo`.
- Proprietà **Nome** (il testo del tag) e **Rimovibile** (mostra la ✕ di 12 px per togliere il tag dalla nota). Nei filtri della ricerca la ✕ non c'è.
- Il tag si mostra come scritto dall'utente, senza "#" davanti.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Come sopra |
| Hover | `sfondo-hover`; il testo resta `testo-primario` (regola 7) |
| Focus | Anello `focus-anello` di 2 px staccato 2 px |
| Attivo | Selezionato: filtro attivo nella ricerca, `sfondo-hover` come l'hover, con testo in `testo-primario` (DEC-35) |
| Disabilitato | Opacità 40% |
| Errore | Non previsto: un nome non valido si segnala nel campo in cui si scrive il tag (RB-22) |
| Caricamento | Non previsto |

### Accessibilità
- **Tastiera:** i tag si raggiungono con Tab; Canc o Backspace toglie il tag in focus (se rimovibile); nei filtri Spazio lo seleziona o lo deseleziona.
- **Lettori di schermo:** la ✕ è un pulsante con nome "Togli il tag lavoro"; un filtro è un pulsante con stato premuto o non premuto.
- **Contrasti:** testo su `sfondo-campo` 13,83:1 in chiaro e 10,66:1 in scuro, su `sfondo-hover` ≥ 9,88:1; la ✕ in `icona-tenue` ≥ 4,16:1.

### Esempi
- ✅ Corretto: nella riga dei tag, "lavoro ✕" e "clienti ✕" affiancati con 4 px di distanza.
- ❌ Scorretto: usare un tag per mostrare un'informazione che non si può togliere o filtrare.

---

## CMP-06 – Riga della colonna
**Tipo:** base · **Usato in:** SC-01 (colonna sinistra: non organizzate, albero delle cartelle, titoli di sezione) · **Figma:** [Riga della colonna](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=38-444)

**Scopo:** mostrare una nota, una cartella o il titolo di una sezione nella colonna sinistra, e aprirla con un clic.
**Quando usarlo:** in ogni lista della colonna sinistra; l'albero delle cartelle (CMP-14) è fatto di queste righe.
**Quando non usarlo:** per i risultati della ricerca (hanno anche frase trovata, cartella e data, CMP-13) o per le voci di un menu (CMP-07).

### Varianti e dimensioni
- **Nota:** solo il titolo, in `testo-primario`, margine 12. Una nota senza titolo mostra "Nota vuota" in `testo-tenue` (RB-15).
- **Cartella chiusa / aperta:** icona della cartella chiusa (`folder`) o aperta (`folder-open`), 16 px in `icona-tenue`, al posto della freccia (DEC-99), nome e, a destra, il numero di note che contiene, sottocartelle comprese (Interfaccia/Dettaglio in `testo-tenue`; primario in hover; RB-56, ID-15). Le note restano senza icona: la cartella basta a dividerle (DEC-99).
- **Sezione aperta / chiusa:** freccia di 12 px, titolo in Interfaccia/Titolo di sezione (maiuscolo Semi Bold, spaziatura 6%) in `testo-tenue`, e il + per creare (in CLOUD apre il menu Aggiungi con Nuova nota e Nuova cartella, in LOCALE Aggiungi cartella). Accanto al titolo della sezione non c'è il numero di note (DEC-119).
- Alta 32 (`misura-riga`), pillola con `spazio-controllo` (12) ai lati (`spazio-controllo-piccolo`, 8, a destra nei titoli di sezione, che finiscono con il +), `spazio-icona` (8) tra icona (o freccia) e testo (DEC-100). Il testo troppo lungo finisce con i puntini.
- **Tra una riga e l'altra**, e tra il titolo della sezione e la prima riga: `spazio-elemento` (4), così le pillole dell'hover e della selezione non si toccano.
- **Rientro:** `spazio-rientro` (24) per ogni livello (DEC-100).
- **Cestino** (DEC-40): icona `trash-2` (16) al posto della freccia, «Cestino» e il numero di elementi nel cestino; fissa in fondo alla colonna. Hover e Selezionata come le altre righe (selezionata quando il cestino è aperto).
- **Impostazioni** (DEC-91): come il cestino, sotto di lui, con l'icona `settings` e «Impostazioni», senza numero; selezionata quando la pagina delle impostazioni è aperta.
- **File** (Locale, RF-17): come la nota, il nome con l'estensione (`riunione.txt`), senza icona (scelta di Manuel Cucca il 04/10/2026). **File non salvato:** a destra, al posto del numero, un pallino da 6 in `icona-tenue` (RB-77). **File nuovo:** «Senza titolo» in `testo-tenue`, come una nota senza titolo, con il pallino. **Cartella non trovata:** icona della cartella chiusa e nome in `testo-tenue`, a destra «non trovata» in Interfaccia/Dettaglio `testo-tenue` al posto del numero.
- **Chiudi cestino** e **Chiudi impostazioni** (DEC-117): solo Selezionata. Con il cestino o le impostazioni aperti la loro riga diventa l'azione per chiuderli: icona `x` (Icona/Chiudi, 16), «Chiudi cestino» o «Chiudi impostazioni», senza numero.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Senza sfondo, sulla colonna |
| Hover | `sfondo-hover`; tutto il testo passa a `testo-primario`, anche l'etichetta della sezione e il numero (regola 7) |
| Focus | Anello `focus-anello` di 2 px staccato 2 px |
| Attivo | Selezionata: la nota aperta nella colonna; `sfondo-hover` come l'hover, con testo Interfaccia/Controllo attivo in `testo-primario`: la distingue dall'hover il peso del testo (DEC-35) |
| Trascinamento sopra | Solo cartella: mentre si trascina una nota o una cartella, quella che la riceverebbe ha `sfondo-hover` e un contorno di 1,5 in `icona-tenue` |
| Trascinata | Sotto il puntatore segue una copia della riga come pillola: `sfondo-hover`, `raggio-pillola`, opacità 80 %, sopra tutto (`z-avviso`), senza ricevere eventi. La disegna l'app al posto dell'immagine del sistema, che su Windows rende neri gli angoli arrotondati. Proposta dell'agente |
| Disabilitato | Non previsto |
| Errore | Non previsto: gli errori di spostamento si mostrano con un avviso (CMP-15) |
| Caricamento | Non previsto: la colonna al primo accesso usa lo stato di caricamento di SC-01 |

### Accessibilità
- **Tastiera:** frecce su e giù per passare da una riga all'altra; freccia destra apre una cartella chiusa, freccia sinistra la chiude; Invio apre la nota o chiude e riapre la sezione. Il + è un pulsante raggiungibile con Tab.
- **Lettori di schermo:** la colonna è un albero: le cartelle hanno lo stato aperta o chiusa e il livello; la nota aperta è "selezionata". Il + ha un nome ("Nuova nota", "Nuova cartella").
- **Contrasti:** testo primario ≥ 12,49:1 su colonna e hover; etichetta della sezione in `testo-tenue` su `sfondo-colonna` 4,99:1 in chiaro e 6,53:1 in scuro; frecce, icone e contorno del trascinamento ≥ 3:1.

### Esempi
- ✅ Corretto: "Lavoro" con la cartella aperta e, sotto, "Clienti" con la cartella chiusa e 24 px di rientro: l'icona di "Clienti" sotto il nome "Lavoro".
- ❌ Scorretto: usare il grigio tenue per il titolo di una nota in hover.

---

## CMP-07 – Voce di menu
**Tipo:** base · **Usato in:** menu del tasto destro, Info (CMP-24), Sposta in (CMP-11), «Mostra tutti i risultati» della card (CMP-13), ricerca avanzata (CMP-29), menu di inserimento con `/`, suggerimenti dei tag (tutti in CMP-09) · **Figma:** [Voce di menu](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=39-502)

**Scopo:** una scelta dentro un menu.
**Quando usarlo:** solo dentro un menu (CMP-09).
**Quando non usarlo:** fuori da un menu: nella colonna si usa la riga della colonna (CMP-06), in una schermata un pulsante (CMP-01).

### Varianti e dimensioni
- **Normale:** etichetta Interfaccia/Controllo in `testo-primario`, su `sfondo-flottante`.
- **Distruttiva:** per le azioni che eliminano (Elimina, Svuota cestino), in `testo-errore` e `icona-errore`. È l'unico uso del colore di uno stato per un'azione: avvisa che non si torna indietro (DEC-14). L'azione chiede comunque conferma (CMP-16).
- **Separatore:** linea di 1 px in `bordo-divisore-tenue`, alta 9 in tutto, tra gruppi di voci, larga quanto le voci (regola 4: le linee solo dove servono).
- La voce non ha margini propri: è la pillola alta 32 (`misura-riga`), larga quanto il contenuto del menu, con il testo a 12 px dal bordo (`spazio-controllo`), come le note nella colonna; gli 8 px dal bordo del menu sono del menu (DEC-100). Distanza 8 tra icona, testo e scorciatoia.
- **Icona:** nei menu di azioni tutte le voci la mostrano, Elimina compresa (in `icona-errore`); nelle liste di valori nessuna (vedi CMP-09).
- Proprietà: **Etichetta**, **Mostra icona** + **Icona** (Lucide 16), **Mostra scorciatoia** + **Scorciatoia** (Interfaccia/Dettaglio in `testo-tenue`, es. "Ctrl + B"), **Sottomenu** (freccia a destra).

### Stati
| Stato | Descrizione |
|---|---|
| Default | Come nelle varianti |
| Hover | Evidenziata: `sfondo-hover` e tutto il testo, scorciatoia compresa, in `testo-primario` (regola 7). La distruttiva si evidenzia su `sfondo-errore` |
| Focus | Uguale a Evidenziata: nei menu il focus da tastiera si mostra così, non con l'anello |
| Attivo | Al clic il menu si chiude e l'azione parte |
| Disabilitato | Opacità 40%; si salta con le frecce |
| Errore | Non previsto |
| Caricamento | Non previsto |

### Accessibilità
- **Tastiera:** frecce su e giù tra le voci (i separatori si saltano), Invio attiva, Esc chiude il menu, freccia destra apre il sottomenu e freccia sinistra lo chiude.
- **Lettori di schermo:** ruolo "voce di menu"; la scorciatoia si annuncia come tasti di scelta rapida; il sottomenu come "ha un sottomenu".
- **Contrasti:** testo su `sfondo-flottante` ≥ 12,87:1; scorciatoia in `testo-tenue` 5,49:1 in chiaro e 5,61:1 in scuro; distruttiva 6,06:1 (chiaro) e 5,19:1 (scuro), evidenziata su `sfondo-errore` 5,48:1 e 5,44:1.

### Esempi
- ✅ Corretto: nel menu della nota, un separatore e poi "Elimina" in rosso con il cestino, allineata alle altre voci con la loro icona.
- ❌ Scorretto: mettere in rosso un'azione che si annulla (Sposta in) o usare l'icona "+" come decorazione su ogni voce.

---

## CMP-08 – Suggerimento
**Tipo:** base · **Usato in:** tutte le schermate, sui pulsanti solo icona e sulle icone senza etichetta · **Figma:** [Suggerimento](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=40-542)

**Scopo:** dire cosa fa un controllo che mostra solo un'icona.
**Quando usarlo:** sempre sui pulsanti solo icona (+, ✕), con lo stesso testo del nome accessibile. Il testo non mostra la scorciatoia, nemmeno quando l'azione ne ha una («Nuova nota», «Fissa la colonna»): le scorciatoie stanno nei menu e in `aria-keyshortcuts` (scelta di Manuel Cucca il 01/10/2026, DEC-102).
**Quando non usarlo:** per spiegazioni lunghe o informazioni necessarie (vanno nel testo della schermata) e sui controlli che hanno già un'etichetta.

### Varianti e dimensioni
- Una sola: pillola alta 24 (`misura-controllo-piccolo`), margini 8, testo Interfaccia/Dettaglio in `testo-su-pieno` su `sfondo-pieno`, `ombra`, livello 20 (`z-comparsa`).
- Compare 8 px sopra il controllo, centrata; se non c'è spazio sopra, sotto.
- Proprietà: **Testo**.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Visibile |
| Hover · Focus | Compare quando il mouse si ferma sul controllo o quando il controllo riceve il focus da tastiera; sparisce quando lo si lascia o con Esc |
| Attivo · Disabilitato · Errore · Caricamento | Non previsti: il suggerimento non si clicca |

Compare e sparisce con `movimento-durata-breve` (120 ms). Compare dopo 500 ms di sosta sul controllo (al focus da tastiera subito).

### Accessibilità
- **Tastiera:** non riceve il focus; Esc lo nasconde senza spostare il focus.
- **Lettori di schermo:** il testo è anche la descrizione del controllo, quindi si legge una volta sola.
- **Contrasti:** 16,48:1 in chiaro e 16,75:1 in scuro.

### Esempi
- ✅ Corretto: "Aggiungi" sopra il + di CLOUD.
- ❌ Scorretto: un suggerimento su un pulsante che dice già "Nuova nota".

---

## CMP-09 – Menu
**Tipo:** composto (usa CMP-07) · **Usato in:** SC-01 (tasto destro su una nota e su una cartella, filtri della ricerca), SC-02 (freccia di Chiudi), SC-03 (tasto destro sul testo, inserimento con `/`, cartelle nascoste del percorso), SC-01 e SC-03 (suggerimenti dei tag in Info) · **Figma:** pagina Componenti composti, [Menu](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=42-982)

**Scopo:** offrire le azioni possibili in quel punto, senza spostarsi (RF-11).
**Quando usarlo:** per più di due azioni legate a un oggetto (la nota, una cartella, il testo selezionato) o per scegliere cosa inserire.
**Quando non usarlo:** per una sola azione (pulsante, CMP-01) o per scegliere una data o una cartella (pannello a comparsa, CMP-11). Eccezione: il menu della freccia del pulsante diviso può avere una sola voce (Apri nel programma in SC-02, DEC-34).

### Varianti e dimensioni
- **Aggiungi** (DEC-119): il + del titolo CLOUD; Nuova nota e Nuova cartella, con le loro icone.
- Contenitore `sfondo-flottante`, `raggio-contenitore` (20), margine `spazio-elenco` (8) su tutti i lati (ruolo elenco, DEC-100), `ombra`, livello 20 (`z-comparsa`). Largo 236 negli esempi; si allarga fino alla voce più lunga.
- La pillola dell'evidenziazione sta a 8 px dai lati (margine del menu); i divisori stanno dentro lo stesso margine e sono leggeri (`bordo-divisore-tenue`) (DEC-100, prima da lato a lato). Scelta tra sei alternative (divisori rientrati o da lato a lato, pieni o leggeri; margine 8 o 12; pillola, rettangolo con raggio 12 o fascia a tutta larghezza): la pillola resta per coerenza con colonna, pulsanti e tag.
- **Icone:** tutte le voci dei menu di azioni (nota, cartella, testo, inserimento) hanno la loro icona, così i testi restano allineati ed Elimina si riconosce anche dal cestino, non solo dal rosso. Le liste di valori (suggerimenti dei tag, filtri) restano senza: sono nomi o periodi, non azioni; fa eccezione Crea il tag con il +. Scelta tra cinque alternative (nessuna icona, icone su tutte, solo Elimina a sinistra, a destra o con spazio riservato); il confronto resta nella pagina Prove.
- **Nota** (tasto destro su una nota della colonna, anche non aperta): Info (informazione, apre CMP-24 come finestra al centro), Sposta in… (sposta) · Elimina (elimina) (DEC-96). Il menu `···` della nota aperta non c'è più: le sue voci stanno in Info, sotto il titolo del percorso (DEC-96). Il Cestino non è nel menu: si apre dalla riga in fondo alla colonna (DEC-40).
- **Cartella** (tasto destro): Nuova nota qui (nota), Nuova sottocartella (cartella), Rinomina (rinomina) · Elimina (elimina).
- **Testo** (tasto destro): Taglia, Copia, Incolla · Grassetto, Corsivo, Sottolineato, Barrato, con le scorciatoie · Titolo ›, Elenco › (elenco puntato); ogni voce con l'icona del suo nome.
- **Inserimento** (`/` su una riga vuota): Titolo, Sottotitolo, Elenco puntato, Elenco numerato, Checklist · Immagine, ognuna con la sua icona.
- **Tag** (sotto il campo dei tag): i tag che corrispondono a ciò che si scrive, · Crea il tag "…". Il tasto destro su un suggerimento apre "Elimina tag…" (RB-19).
- **Filtro tag** (dalla pillola Tag della ricerca, CMP-13): campo "Cerca un tag", divisore, i tag con la spunta su quelli scelti (si possono sceglierne più d'uno), divisore, "Togli il filtro".
- **Filtro data** (dalle pillole Creazione e Modifica; Fine validità per ora non c'è, DEC-94): Qualsiasi data, Oggi, Ultimi 7 giorni, Ultimi 30 giorni, Quest'anno, con la spunta sulla scelta attiva · Scegli le date… (apre il calendario, CMP-12, per scegliere un giorno, DEC-126).
- I puntini "…" indicano che la voce apre un pannello o una conferma; la freccia › un sottomenu.
- Le scorciatoie sono quelle di Windows; su macOS Ctrl diventa ⌘ e Maiusc ⇧.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Aperto, nessuna voce evidenziata; con la tastiera la prima voce è evidenziata |
| Hover · Focus · Attivo · Disabilitato | Li gestiscono le voci (CMP-07) |
| Errore | Non previsto |
| Caricamento | Non previsto: le voci non dipendono dalla rete |

Compare con `movimento-durata-breve` (120 ms) e `movimento-spostamento` (4 px). Si chiude con Esc, con un clic fuori o scegliendo una voce. Se non c'è spazio sotto si apre sopra.

### Accessibilità
- **Tastiera:** come in CMP-07. Nel menu di inserimento si continua a scrivere per filtrare le voci (es. "/tit"), e Invio senza una voce evidenziata chiude il menu e va a capo; negli altri menu Invio senza voce evidenziata chiude soltanto; nei suggerimenti dei tag le frecce scelgono e Invio conferma.
- **Lettori di schermo:** ruolo "menu" con il nome di ciò che lo ha aperto (es. "Menu della nota"); alla chiusura il focus torna dove era.
- **Contrasti:** vedi CMP-07.

### Esempi
- ✅ Corretto: il tasto destro sul testo con le scorciatoie accanto, per impararle usandole.
- ❌ Scorretto: un menu con una sola voce, o voci che cambiano posto a seconda della nota.

---

## CMP-10 – Pillola degli strumenti
**Tipo:** composto (con le parti interne "Strumento della pillola" e "Divisore della pillola") · **Usato in:** SC-03 (sopra la selezione o il punto del clic sul vuoto) · **Figma:** pagina Componenti composti, [Pillola degli strumenti](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=52-504)

**Scopo:** formattare il testo selezionato o inserire un elemento senza una barra fissa sopra la nota.
**Quando usarlo:** con testo selezionato (formattazione) o con un clic sul vuoto (inserimento). Una sola pillola alla volta.
**Quando non usarlo:** come barra permanente, o per azioni sulla nota intera (sono in Info, CMP-24).

### Varianti e dimensioni
- **Formattazione:** grassetto, corsivo, sottolineato, barrato · titolo, sottotitolo.
- **Inserimento:** titolo, sottotitolo · elenco puntato, elenco numerato, checklist · immagine.
- Pillola su `sfondo-flottante` (bianca in chiaro, scura in scuro), `ombra`, margini 4, alta 40, livello 20.
- 4 px (`spazio-elemento`) tra uno strumento e l'altro: passando con il mouse, il cerchio dell'hover non tocca mai quello dello strumento attivo.
- Tra i gruppi, il **divisore della pillola**: linea di 1 px in `bordo-divisore-tenue` a tutta altezza (da bordo a bordo della pillola), con 4 px ai lati. È lo stesso segno leggero dei divisori dei menu. Scelta tra solo spazio, linea corta leggera, linea corta visibile, linea a tutta altezza e puntino.
- **Strumento della pillola:** pulsante tondo 32 × 32 con icona Lucide 16 in `icona-tenue`; proprietà **Icona**.
- Compare 8 px sopra la selezione o il punto del clic, centrata; se non c'è spazio sopra, sotto. Sparisce quando si riprende a scrivere, con Esc o con un clic altrove.
- Inizialmente la pillola era scura (`sfondo-pieno`); è stata invertita perché in mezzo al testo era troppo pesante. Ora parla come menu e colonna. Dal 28/09/2026 anche ciò che è attivo non è più scuro: ha il colore dell'hover (DEC-35).

### Stati
| Stato | Descrizione |
|---|---|
| Default | Strumento senza sfondo, icona `icona-tenue` |
| Hover | `sfondo-hover` |
| Focus | Anello interno di 2 px in `focus-anello` |
| Attivo | Formato già applicato alla selezione (es. il testo è in grassetto): cerchio `sfondo-hover` come l'hover, con icona in `testo-primario`, come la riga selezionata (DEC-35) |
| Disabilitato | Opacità 40% (es. titoli dentro una checklist, se non ammessi) |
| Errore | Non previsto |
| Caricamento | Non previsto |

### Accessibilità
- **Tastiera:** la pillola non ruba il focus mentre si scrive; si raggiunge con Alt + F10 (Option + F10 su macOS), lo standard degli editor per la barra degli strumenti e poi con le frecce sinistra e destra tra gli strumenti; Esc torna al testo. Le scorciatoie di formattazione restano sempre valide (CMP-09).
- **Lettori di schermo:** barra degli strumenti con nome ("Formattazione" o "Inserimento"); ogni strumento è un pulsante con nome e, per la formattazione, stato premuto o non premuto; ogni strumento ha il suggerimento (CMP-08).
- **Contrasti:** icone `icona-tenue` su `sfondo-flottante` 5,49:1 in chiaro e 5,61:1 in scuro, su `sfondo-hover` ≥ 4,16:1; attivo 16,48:1.

### Esempi
- ✅ Corretto: selezionare "spostare" e vedere la pillola sopra la parola con il grassetto già attivo.
- ❌ Scorretto: lasciare la pillola visibile mentre si continua a scrivere.

---

## CMP-11 – Pannello a comparsa
**Tipo:** composto (usa CMP-03 e CMP-07) · **Usato in:** SC-01 e SC-03 (Sposta in… dalla riga Cartella di Info e dal tasto destro su una nota della colonna; il tipo Date non si usa più: le date stanno nella finestra Info, CMP-24, DEC-44) · **Figma:** pagina Componenti composti, [Pannello a comparsa](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=60-1780)

**Scopo:** modificare un'informazione della nota che ha bisogno di più di una voce di menu: una data, una cartella.
**Quando usarlo:** quando la scelta richiede un campo, una ricerca o un albero, aperto dalla voce con "…" del menu.
**Quando non usarlo:** per una scelta tra poche azioni (menu, CMP-09) o per chiedere conferma (finestra di conferma, CMP-16).

### Varianti e dimensioni
- **Stesso aspetto del menu** (CMP-09), pur restando un componente separato: `sfondo-flottante`, `raggio-contenitore` (20), `ombra`, livello 20, largo 236, margine `spazio-elenco` (8) su tutti i lati (DEC-100). Si apre sotto la riga Cartella di Info (DEC-97) o accanto alla nota del tasto destro (DEC-96).
- **Date** (FL-04): "Data di creazione" e "Fine validità" con etichetta Interfaccia/Etichetta in `testo-tenue` e campo con il calendario (CMP-03, con icona). Etichette e note partono a 12 px, allineate al testo dei campi, come il testo delle voci di menu. Sotto la data di creazione, in Interfaccia/Dettaglio, quella di sistema, che non cambia (RB-21). Nessun avviso sulle combinazioni di date (RB-20).
- **Sposta in**: campo di ricerca ("Cerca una cartella"), divisore, poi le cartelle come **voci di menu** (CMP-07): come icona la cartella chiusa (`folder`) o aperta (`folder-open`), come nella colonna (DEC-99), e `spazio-rientro` (24) per livello, come nella colonna (DEC-100). Un clic sull'icona di una cartella con sottocartelle la apre o la chiude; un clic sul resto della voce la sceglie. "Non organizzate" (la radice) lascia vuoto lo spazio dell'icona, così i nomi restano allineati. La **cartella attuale** ha la spunta a destra (`check`), non la pillola scura: nel menu la pillola indica l'hover.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Aperto, con i valori attuali |
| Hover · Focus · Errore | Li gestiscono i campi (CMP-03) e le voci (CMP-07) |
| Attivo | Date: la modifica si salva subito (RB-06). Sposta in: il clic su una cartella sposta la nota e chiude il pannello |
| Disabilitato | Non previsto |
| Caricamento | Non previsto: tutto è sulla copia di lavoro |

Si chiude con Esc, con un clic fuori o (Sposta in) scegliendo una cartella. Compare con `movimento-durata-breve` e `movimento-spostamento`.

### Accessibilità
- **Tastiera:** all'apertura il focus va sul primo campo (Date) o sulla ricerca (Sposta in); Tab tra i campi; in Sposta in, scrivendo si filtra l'albero, le frecce scelgono la cartella e Invio sposta. Esc chiude e riporta il focus dove il pannello era stato aperto: il titolo del percorso (da Info sotto il titolo) o la riga della nota nella colonna.
- **Lettori di schermo:** finestra non modale con titolo ("Date", "Sposta in"); la cartella attuale è annunciata come "attuale".
- **Contrasti:** etichette in `testo-tenue` su `sfondo-flottante` 5,49:1 in chiaro e 5,61:1 in scuro; campi e voci come in CMP-03 e CMP-07.

### Esempi
- ✅ Corretto: aprire Sposta in e trovare subito la cartella attuale selezionata, già visibile.
- ❌ Scorretto: chiedere conferma per spostare una nota: lo spostamento si annulla spostandola di nuovo.

---

## CMP-12 – Date picker
**Tipo:** composto (con la parte interna "Giorno del calendario"; usa CMP-01 e il separatore di CMP-07) · **Usato in:** SC-01 e SC-03 (righe di data di Info, CMP-24), SC-01 («Scegli le date…» dei filtri della ricerca, CMP-13 e CMP-29) · **Figma:** pagina Componenti composti, [Date picker](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=65-763)

**Scopo:** scegliere una data con il mouse, in alternativa a scriverla nel campo.
**Quando usarlo:** si apre dall'icona calendario di un campo data (CMP-03, con icona).
**Quando non usarlo:** da solo, senza campo: la data si può sempre anche scrivere.

### Varianti e dimensioni
- Stesso guscio di menu e pannello: `sfondo-flottante`, `raggio-contenitore` (20), `ombra`, livello 20, margine `spazio-elenco` (8) su tutti i lati (ruolo elenco, DEC-100). Largo **240** invece di 236: 7 giorni da 32 px richiedono 224 px di contenuto.
- **Intestazione:** mese e anno (Interfaccia/Titolo) e due pulsanti solo icona ‹ › (CMP-01) per il mese precedente e successivo.
- **Giorni della settimana:** L M M G V S D, dal lunedì, in Interfaccia/Etichetta `testo-tenue`.
- **Giorni:** sempre 6 righe, così l'altezza non cambia da un mese all'altro. Ogni giorno è un cerchio di 32 × 32 (parte interna "Giorno del calendario").
- **Piede:** separatore, dentro il margine (DEC-100), poi i pulsanti tenui "Oggi" e "Nessuna data" (svuota il campo, utile per la fine validità).
- Si apre 8 px sotto il campo, sopra il pannello; se non c'è spazio sotto, sopra.

### Stati (del giorno)
| Stato | Descrizione |
|---|---|
| Default | Numero Interfaccia/Controllo in `testo-primario` |
| Altro mese | Giorni del mese prima e dopo in `testo-tenue`; si possono scegliere |
| Oggi | Numero Interfaccia/Controllo attivo e un puntino di 4 px sotto: non si confonde con focus e selezione |
| Hover | `sfondo-hover` |
| Focus | Anello interno di 2 px in `focus-anello` |
| Attivo | Selezionato: `sfondo-hover` come l'hover, con numero in `testo-primario` (DEC-35) |
| Disabilitato | Non previsto: nessuna data è vietata (RB-20) |
| Errore · Caricamento | Non previsti |

Scegliere un giorno scrive la data nel campo, salva (RB-06) e chiude il calendario.

### Accessibilità
- **Tastiera:** all'apertura il focus va sul giorno selezionato (o su oggi); frecce per muoversi tra i giorni, Pagina su e Pagina giù per cambiare mese, Invio sceglie, Esc chiude e riporta il focus sul campo.
- **Lettori di schermo:** griglia con il nome del mese; ogni giorno si legge per intero ("giovedì 24 settembre 2026, selezionato"); oggi è annunciato come "oggi".
- **Contrasti:** numeri ≥ 12,87:1; mesi vicini in `testo-tenue` 5,49:1 (chiaro) e 5,61:1 (scuro); selezionato ≥ 12,87:1.

### Esempi
- ✅ Corretto: aprire il calendario dal campo e trovare il mese della data già scritta, con il giorno selezionato.
- ❌ Scorretto: obbligare a usare il calendario, senza poter scrivere la data.

---

## CMP-13 – Ricerca · card dei risultati
**Tipo:** composto (con le parti interne "Filtro della ricerca" e "Risultato della ricerca"; usa il campo di ricerca CMP-03 e il separatore di CMP-07) · **Usato in:** SC-01 · **Figma:** pagina Componenti composti, [Card dei risultati](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=66-2423)

**Scopo:** mostrare mentre si scrive le note che corrispondono alla ricerca, con i filtri per tag e date (RF-08, FL-06).
**Quando usarlo:** sotto il campo di ricerca della colonna, appena si entra nel campo, anche prima di scrivere (RB-33, DEC-94).
**Quando non usarlo:** per scegliere una cartella (Sposta in, CMP-11) o per suggerire tag (menu dei tag, CMP-09).

### Varianti e dimensioni
- Stesso guscio del menu: `sfondo-flottante`, raggio 20, ombra, livello 20, margine `spazio-elenco` (8) su tutti i lati (ruolo elenco, DEC-100). Larga **480**, più della colonna: copre la nota senza velo, perché non blocca niente.
- **Filtri** in cima: Tag, Creazione, Modifica (FL-06; Fine validità per ora non c'è, DEC-94). Con il campo vuoto e nessun filtro la card mostra solo la fila dei filtri (RB-33). Ognuno è una pillola alta 24 come il tag, con una freccia giù, `spazio-elemento` (4) tra l'una e l'altra come i tag, 12 px sopra e sotto la fila. Apre un menu (CMP-09, filtro tag o filtro data) 8 px sotto la pillola. Attivo: `sfondo-hover` con `testo-primario` (DEC-35), con il valore ("Tag: lavoro"; con più tag, "Tag: 2").
- Divisore, dentro il margine (DEC-100), poi i **risultati** per pertinenza (RB-34), tutti, scorrendo la card: titolo (Interfaccia/Titolo), la frase in cui compare la parola con la parola in `testo-primario` Medium, cartella e data (Interfaccia/Dettaglio).
- **Nel cestino:** titolo e frase attenuati, etichetta "nel cestino" (RB-29); non compaiono se la preferenza li esclude.
- **Nessun risultato:** filtri, divisore, "Nessuna nota trovata" e un suggerimento; la card resta aperta (RB-35).
- **Mostra tutti i risultati** (DEC-96): con dei risultati, in fondo, dopo un divisore, una voce di menu (CMP-07) con l'icona Cerca, «Mostra tutti i risultati (n)» e la scorciatoia Ctrl + Maiusc + K. Apre la ricerca avanzata (CMP-29) con lo stesso testo e gli stessi filtri.
- **Hover dei blocchi su più righe:** rettangolo con raggio 12, concentrico al contenitore (20 − 8). Una pillola alta tre righe diventerebbe un ovale pesante; la pillola resta per tutto ciò che è alto una riga.

### Stati (del risultato)
| Stato | Descrizione |
|---|---|
| Default | Come sopra |
| Hover | `sfondo-hover`, raggio 12 |
| Focus | Anello interno di 2 px in `focus-anello` |
| Attivo | Clic: la nota si apre al posto di quella aperta, già salvata (RB-06), e la card si chiude |
| Disabilitato | Non previsto |
| Errore | Non previsto: la ricerca è sul dispositivo |
| Caricamento | Non previsto: i risultati arrivano mentre si scrive; la card non si aggiorna mentre è aperta (RB-45) |

### Accessibilità
- **Tastiera:** dal campo, freccia giù entra nei risultati; frecce su e giù tra i risultati, Invio apre, Esc chiude la card e svuota la ricerca (RB-72): il focus torna nel campo, o nel foglio se la colonna l'aveva aperta Ctrl + K e si richiude (RB-71); Tab raggiunge i filtri; Ctrl + Maiusc + K apre la ricerca avanzata (CMP-29).
- **Lettori di schermo:** il campo annuncia il numero di risultati; ogni risultato si legge con titolo, cartella, data e, se serve, "nel cestino".
- **Contrasti:** titolo ≥ 12,87:1; frase e dettagli in `testo-tenue` 5,49:1 (chiaro) e 5,61:1 (scuro); filtri come il tag (CMP-05).

### Esempi
- ✅ Corretto: scrivere "rilascio" e vedere prima le note con la parola nel titolo, poi quelle con la parola solo nel testo.
- ❌ Scorretto: aprire la ricerca in una schermata a parte, perdendo la nota aperta.

---

## CMP-14 – Albero delle cartelle
**Tipo:** composto (usa CMP-06; parti interne "Campo nome nell'albero" e "Cestino di trascinamento") · **Usato in:** SC-01 · **Figma:** pagina Componenti composti, [Albero delle cartelle](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=69-1788)

**Scopo:** la colonna sinistra: le note non organizzate e l'albero delle cartelle (RF-05, FL-05).
**Quando usarlo:** una sola volta, nella colonna di SC-01.
**Quando non usarlo:** per scegliere una cartella in un pannello (Sposta in, CMP-11, che usa le voci di menu).

### Varianti e dimensioni
- Righe CMP-06 su `sfondo-colonna`, larghe 256, dentro la colonna larga `misura-colonna` (288) con `spazio-pannello` (16) ai lati e in cima (ruolo pannello, DEC-100), `spazio-blocco` (16) tra la ricerca e l'albero; `spazio-elemento` (4) tra le righe, `spazio-gruppo` (24) tra le sezioni. Titoli di sezione in maiuscolo grassetto: scelta 6 tra sette alternative (spazio, maiuscolo, grassetto, linea), confronto nella pagina Prove. Una sola sezione **CLOUD** (DEC-119, al posto di Non organizzate e Cartelle): nella radice prima le note non organizzate, per ultima modifica (la nota aperta è selezionata, RB-60), poi le cartelle con il numero di note accanto (RB-56); il titolo non ha numero e il suo + apre il menu Aggiungi (CMP-09: Nuova nota, Nuova cartella). `spazio-rientro` (24) per livello. Una cartella aperta mostra prima le sue note come righe Nota, poi le sottocartelle, tutte in ordine alfabetico (RB-64, RB-65). Il titolo di una nota si allinea al nome delle sottocartelle sorelle: 12 + 24 per livello + 24 (icona e distanza), cioè 60 al primo livello dal bordo della riga (DEC-100). Sotto Cartelle la sezione **Locale** (RF-17): titolo di sezione senza numero, con il + che aggiunge una cartella; le cartelle dell'elenco e dentro sottocartelle e file (CMP-06 File, File non salvato, File nuovo, Cartella non trovata), con le stesse regole di rientro. Vuota: una riga «Nessuna cartella. Aggiungine una con +» come Stato vuoto della colonna (CMP-19). Nella libreria il componente non ha ancora la sezione: si aggiunge con i mockup (Fase 6).
- **Nuova cartella:** il campo nome compare sul posto, con l'icona della cartella chiusa (DEC-99), su `sfondo-campo` con l'anello di focus e il nome "Nuova cartella" già selezionato (RB-48). Invio conferma, Esc annulla.
- **Trascinamento:** la cartella che riceverebbe è evidenziata (CMP-06, trascinamento sopra) e in fondo alla colonna compare il **cestino di trascinamento** (`sfondo-campo`, icona elimina, "Trascina qui per eliminare").
- **Trascinamento sul cestino:** il cestino diventa `sfondo-errore` con testo e icona in `testo-errore` e `icona-errore` ("Rilascia per spostare nel cestino").

### Stati
| Stato | Descrizione |
|---|---|
| Default · Hover · Focus · Attivo | Li gestiscono le righe (CMP-06) |
| Trascinamento | Come sopra; una cartella non si può trascinare dentro sé stessa (RB-24): la riga non si evidenzia |
| Disabilitato · Errore · Caricamento | Non previsti; un nome già esistente apre la finestra con tre scelte (CMP-16, RB-31) |

### Accessibilità
- **Tastiera:** come CMP-06; F2 rinomina la cartella in focus con il campo nome; chiuso il campo con Invio o con Esc il focus torna sulla riga della cartella; lo spostamento da tastiera passa da Sposta in (CMP-11), non dal trascinamento.
- **Lettori di schermo:** albero con i livelli; il cestino di trascinamento si annuncia quando compare.
- **Contrasti:** come CMP-06; cestino di trascinamento in `testo-tenue` su `sfondo-campo` 4,61:1 e 4,65:1; sopra, `testo-errore` su `sfondo-errore` 5,48:1 e 5,44:1.

### Esempi
- ✅ Corretto: trascinare una nota su "Clienti" e vedere la cartella evidenziata prima di rilasciare.
- ❌ Scorretto: mostrare il cestino di trascinamento sempre (è ID-18, ancora da valutare).

---

## CMP-15 – Avviso
**Tipo:** composto (usa CMP-01 e CMP-02) · **Usato in:** tutte le schermate, in cima all'area della nota · **Figma:** pagina Componenti composti, [Avviso](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=70-2614)

**Scopo:** dire qualcosa che conta senza bloccare (RB-39, RB-40).
**Quando usarlo:** per i problemi di sincronizzazione e le note in conflitto; resta finché non lo si chiude, solo sul dispositivo in cui nasce (DEC-90).
**Quando non usarlo:** per chiedere conferma (CMP-16) o per confermare un'azione riuscita: il successo di solito non si mostra (RB-40).

### Varianti e dimensioni
- **Errore**, **Avviso**, **Informazione**, **Successo** (DEC-14): fondo `sfondo-<stato>`, icona Lucide 16 in `icona-<stato>` (`circle-alert`, `triangle-alert`, `info`, `check`), testo Interfaccia/Messaggio in `testo-primario`, a destra «Ho capito» (pulsante tenue) e, con la proprietà **Mostra azione**, un'azione tenue prima di lui (es. «Ripristina», «Apri l'altra»). Per i file locali (RF-17, RB-85) i due pulsanti diventano le due scelte: «Ricarica» e «Tieni la mia versione», «Ricrealo» e «Chiudi». Per l'accesso scaduto (RB-87): tipo Avviso con l'azione «Accedi», che apre SC-05.
- Largo 480, raggio 20, ruolo pannello: `spazio-pannello` (16) su tutti i lati, con «Ho capito» e l'azione sul margine come ogni pulsante (DEC-100), `ombra`, livello 50, uno alla volta, al centro dell'area della nota, 8 sotto la fascia in alto (a 48 dal bordo): non copre il percorso (CMP-26, DEC-86). Il testo va a capo.
- I testi sono esempi nel tono di voce; quelli definitivi si scrivono in Fase 6.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Visibile |
| Hover · Focus | Li gestisce il pulsante |
| Attivo | "Ho capito" lo segna come visto; "Apri l'altra" apre la nota in conflitto |
| Disabilitato · Errore · Caricamento | Non previsti |

### Accessibilità
- **Tastiera:** non ruba il focus; si raggiunge con Tab.
- **Lettori di schermo:** annunciato senza interrompere, con il tipo ("Errore", "Avviso"…).
- **Contrasti:** testo primario su `sfondo-<stato>` ≥ 15:1 in chiaro e ≥ 12,6:1 in scuro; icone ≥ 4,72:1 in chiaro e ≥ 5,44:1 in scuro; pulsante tenue ≥ 4,5:1. In scuro il fondo è il gradino 800 (DEC-16).

### Esempi
- ✅ Corretto: «Non riesco a sincronizzare da più di un'ora. Le modifiche restano qui.»
- ❌ Scorretto: «Ops! Qualcosa è andato storto».

---

## CMP-16 – Finestra di conferma
**Tipo:** composto (usa CMP-01) · **Usato in:** SC-01, SC-03, SC-04 · **Figma:** pagina Componenti composti, [Finestra di conferma](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=71-2091)

**Scopo:** fermare l'utente prima di un'azione che non si annulla o che ha più esiti.
**Quando usarlo:** svuotare il cestino (RB-32), eliminare per sempre un elemento del cestino (RB-55: «Eliminare «Riunione di lunedì» per sempre?» · Annulla · Elimina), eliminare un tag (RB-19), nome di cartella già presente (RB-31).
**Quando non usarlo:** per azioni che si annullano (spostare, eliminare una nota: va nel cestino) o per informare (avviso, CMP-15).

### Varianti e dimensioni
- **Conferma:** titolo, testo, Annulla (secondario) e l'azione (primario), es. «Svuotare il cestino?» · «3 elementi verranno eliminati per sempre.» · Annulla · Svuota.
- **Tre scelte:** Annulla, Unisci (secondario) e Aggiungi un numero (primario, la scelta che non tocca niente), per RB-31.
- Guscio dei flottanti: `sfondo-flottante`, raggio 20, `ombra`, largo 400, margine `spazio-finestra` (24) su tutti i lati (ruolo finestra, DEC-100). Titolo Interfaccia/Titolo in `testo-primario`, testo Interfaccia/Messaggio in `testo-tenue`. Pulsanti a destra, 8 px tra loro.
- Al centro della finestra, livello 40, con il `velo` sul resto; un avviso (livello 50) resta visibile sopra.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Aperta, focus su Annulla |
| Hover · Focus · Attivo · Disabilitato | Li gestiscono i pulsanti |
| Errore · Caricamento | Non previsti |

### Accessibilità
- **Tastiera:** il focus parte da Annulla e resta dentro la finestra; Esc equivale ad Annulla; Invio attiva il pulsante in focus. Anche un clic sul velo equivale ad Annulla, se comincia e finisce sul velo (DEC-124).
- **Lettori di schermo:** finestra modale con titolo; il testo è la descrizione.
- **Contrasti:** titolo ≥ 12,87:1, testo tenue 5,49:1 e 5,61:1; pulsanti come CMP-01.

### Esempi
- ✅ Corretto: il numero di elementi nel testo («3 elementi»), così si sa cosa si perde.
- ❌ Scorretto: chiedere conferma per spostare una nota.

---

## CMP-17 – Elemento del cestino
**Tipo:** composto (usa CMP-01 e CMP-02) · **Usato in:** SC-04 · **Figma:** pagina Componenti composti, [Elemento del cestino](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=72-2212)

**Scopo:** mostrare cosa c'è nel cestino e ripristinarlo (RF-15).
**Quando usarlo:** solo nell'elenco del cestino.
**Quando non usarlo:** per le note nei risultati della ricerca, anche se sono nel cestino (CMP-13).

### Varianti e dimensioni
- **Nota** e **Cartella**: icona Lucide 16 (`file-text` o `folder`) in `icona-tenue`, nome Interfaccia/Titolo, sotto tipo, provenienza e data di eliminazione (Interfaccia/Dettaglio, `testo-tenue`; per le cartelle anche il numero di note). A destra Ripristina (pulsante tenue) ed **Elimina definitivamente** (pulsante solo icona con il cestino e il suggerimento "Elimina definitivamente", DEC-17): chiede conferma (CMP-16, RB-55).
- Largo 560, su `sfondo-nota`. Blocco su due righe: hover con `raggio-interno`. Spazi (DEC-100): `spazio-controllo` (12) a sinistra, `spazio-controllo-piccolo` (8) a destra, perché finisce con i pulsanti, e sopra e sotto, come ogni riga su più linee; `spazio-icona` (8) tra icona e testi, `spazio-blocco` (16) tra i testi e i pulsanti, `spazio-icona` (8) tra Ripristina ed Elimina definitivamente.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Come sopra |
| Hover | `sfondo-hover`; tutto il testo, dettagli e Ripristina compresi, in `testo-primario` (regola 7) |
| Focus | Anello interno 2 px |
| Attivo | Ripristina: l'elemento sparisce dall'elenco e torna nella radice (RB-28), senza messaggio. Elimina definitivamente: conferma, poi l'elemento sparisce (RB-55) |
| Disabilitato · Errore · Caricamento | Non previsti |

### Accessibilità
- **Tastiera:** frecce tra gli elementi; Tab raggiunge Ripristina ed Elimina definitivamente; Maiusc + Canc elimina definitivamente l'elemento in focus (sempre con conferma).
- **Lettori di schermo:** nome, tipo, provenienza e data; Ripristina porta il nome dell'elemento ("Ripristina Riunione di lunedì").
- **Contrasti:** nome ≥ 12,49:1; dettagli 5,49:1 e 7,30:1; in hover tutto ≥ 9,88:1.

### Esempi
- ✅ Corretto: "Cartella con 12 note · da Personale · eliminata il 20/09/2026".
- ❌ Scorretto: chiedere conferma per ripristinare.

---

## CMP-18 – Riga di impostazione
**Tipo:** composto (usa CMP-01, CMP-03, CMP-04 e CMP-28) · **Usato in:** SC-06, dentro CMP-31 e CMP-32 · **Figma:** pagina Componenti composti, [Riga di impostazione](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=74-2255)

**Scopo:** una preferenza, con il suo controllo.
**Quando usarlo:** in SC-06, una riga per impostazione, dentro il riquadro di una sezione (CMP-31: Generale, Ricerca) o del box dell'account (CMP-32: Nome del dispositivo; DEC-122).
**Quando non usarlo:** per azioni (pulsante); le informazioni non modificabili usano la variante Informazione.

### Varianti e dimensioni
- **Interruttore:** etichetta (Interfaccia/Controllo) e descrizione (Interfaccia/Dettaglio, `testo-tenue`) a sinistra, interruttore (CMP-04) a destra; tutta la riga si clicca.
- **Campo:** come sopra, con un campo (CMP-03, largo 200) a destra, es. la scorciatoia della nota rapida o il nome del dispositivo.
- **Azione:** etichetta e valore (in `testo-tenue`) a sinistra, pulsante secondario (CMP-01) a destra, es. «Cambia». Si attiva solo il pulsante, come il campo. La riga Account di DEC-121 non c'è più: l'account sta nel box CMP-32 (DEC-122).
- **Titolo di gruppo:** Interfaccia/Titolo di sezione (Semi Bold 11, maiuscolo, spaziatura 6 %) in `testo-tenue`, come i titoli CLOUD e LOCALE della colonna, alto 32 (DEC-122; prima Interfaccia/Titolo di gruppo). Sta sopra il riquadro di CMP-31.
- **Scelta:** etichetta e descrizione a sinistra, scelta a segmenti (CMP-28) a destra, es. il tema Sistema · Chiaro · Scuro (DEC-91). Si attiva solo la scelta.
- **Scorciatoia:** come Campo, con il campo della combinazione e a destra il pulsante tenue «Ripristina», che torna al valore di default. Si clicca il campo e si preme la combinazione nuova; se un altro programma la usa già, l'errore è nel campo e resta la vecchia (DEC-91).
- **Informazione:** etichetta e valore in `testo-tenue`, senza controllo e senza hover, es. «Stato · Sincronizzata alle 14:32» (DEC-91).
- A tutta larghezza nel riquadro, su `sfondo-colonna` (DEC-122). Spazi (DEC-100): `spazio-controllo` (12) a sinistra; a destra `spazio-controllo-piccolo` (8) quando la riga finisce con un controllo (interruttore, campo, scelta, pulsante), `spazio-controllo` (12) senza controllo (Informazione); `spazio-controllo-piccolo` (8) sopra e sotto; `spazio-blocco` (16) tra testo e controllo.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Come sopra |
| Hover | Solo con l'interruttore: `sfondo-hover` con `raggio-interno`, descrizione in `testo-primario` (regola 7) |
| Focus | Anello interno 2 px sulla riga (interruttore) o sul campo |
| Attivo | Il cambio vale subito (RB-06), senza pulsante Salva |
| Disabilitato | Opacità 40% (es. avvio all'accensione se il sistema non lo permette) |
| Errore | Nel campo (CMP-03), es. combinazione già usata dal sistema |

### Accessibilità
- **Tastiera:** Tab tra le righe; Spazio cambia l'interruttore.
- **Lettori di schermo:** l'etichetta è il nome del controllo, la descrizione ne è la descrizione.
- **Contrasti:** come CMP-03, CMP-04 e la regola 7.

### Esempi
- ✅ Corretto: "Avvia Memodu all'accensione" con la spiegazione di cosa cambia; il tema con la scelta a tre, non con un menu a tendina.
- ❌ Scorretto: un'impostazione che si applica solo dopo "Salva".

---

## CMP-19 – Stato vuoto
**Tipo:** composto (usa CMP-01 e CMP-02) · **Usato in:** SC-01, SC-03, SC-04, SC-07 · **Figma:** pagina Componenti composti, [Stato vuoto](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=75-2292)

**Scopo:** spiegare perché non c'è niente e cosa fare, al posto di un'area vuota (SF-16).
**Quando usarlo:** nessuna nota aperta, cestino vuoto, nessuna cartella.
**Quando non usarlo:** per la ricerca senza risultati (è nella card, CMP-13) o per gli errori che non bloccano (avviso, CMP-15).

### Varianti e dimensioni
- **Nota:** icona `file-text` 24, «Nessuna nota aperta», spiegazione e il pulsante primario «Nuova nota».
- **Cestino:** icona elimina 24, «Il cestino è vuoto», spiegazione, senza azioni (niente Svuota cestino).
- **Colonna:** una riga Interfaccia/Dettaglio in `testo-tenue`: in CLOUD «Nessuna nota. Crea con +», in LOCALE «Nessuna cartella. Aggiungine una con +» (DEC-119).
- **Blocco:** al posto della finestra quando la copia di lavoro non si apre o non si scrive (SC-07, DEC-67); non più per le credenziali (DEC-121). Icona errore 24 in `icona-errore`, «Memodu non riesce a collegarsi», cosa correggere e il pulsante primario «Riprova».
- Icona in `icona-tenue`, titolo Interfaccia/Titolo, testo Interfaccia/Messaggio in `testo-tenue`, centrati, largo 320, 8 px di distanza.
- I testi sono esempi nel tono di voce; quelli definitivi si scrivono in Fase 6.

### Stati
Nessuno proprio: il pulsante ha i suoi (CMP-01).

### Accessibilità
- **Tastiera:** il pulsante si raggiunge con Tab.
- **Lettori di schermo:** titolo e spiegazione si leggono come testo; l'icona è decorativa.
- **Contrasti:** titolo ≥ 12,87:1, testo tenue ≥ 4,99:1.

### Esempi
- ✅ Corretto: dire cosa succede dopo («la nota si salva da sola»).
- ❌ Scorretto: un'illustrazione grande che spinge l'azione fuori dalla vista.

---

## CMP-20 – Testo della nota
**Tipo:** composto (parte interna "Casella della checklist") · **Usato in:** SC-02, SC-03 · **Figma:** pagina Componenti composti, [Testo della nota](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=76-2351)

**Scopo:** come appare il testo della nota mentre si scrive (RF-02).
**Quando usarlo:** nella nota aperta e nella nota rapida.
**Quando non usarlo:** per il testo dell'interfaccia (stili Interfaccia/…).

### Varianti e dimensioni
- **Riga dei metadati** (parte interna), sotto il titolo, su due righe larghe quanto la nota (DEC-44): in alto la data di ultima modifica in Interfaccia/Dettaglio e `testo-tenue` (es. «Modificata oggi alle 11:42»); sotto i tag in sola lettura (CMP-05 senza ✕, `spazio-elemento` tra l'uno e l'altro), che vanno a capo. Date e tag si modificano nella finestra Info (CMP-24). Sta `spazio-icona` (8) sotto il titolo e `spazio-blocco` (16) sopra il testo; tra le due righe `spazio-icona` (8) (DEC-58, anche nel componente in Figma). Proprietà **Data** e **Mostra tag**; nella nota nuova niente tag e "Creata ora". Il componente ha la proprietà **Mostra metadati** per nasconderla dove non c'è il titolo (nota rapida, SC-02) e **Mostra titolo**: nella nota aperta sono spenti tutti e due, perché il titolo sta nel percorso (CMP-26, DEC-71) e ultima modifica e tag in Info (CMP-24, DEC-96).
- **Testo puro** (DEC-64, la variante in uso finché non torna il markdown): titolo, riga dei metadati e un solo paragrafo in Nota/Corpo, dove `#`, `-`, `**` e le tabulazioni si vedono come caratteri, senza formattazione. In Figma è la variante `Tipo=Testo puro`.
- **Con testo:** titolo (Nota/Titolo), riga dei metadati, corpo (Nota/Corpo), sottotitolo (Nota/Sottotitolo), checklist, elenco puntato, elenco numerato; `spazio-blocco` (16) tra i blocchi, `spazio-elemento` (4) tra le voci, `spazio-gruppo` (24) tra intestazione e testo. Il testo occupa tutta la larghezza del foglio, con `spazio-gruppo` (24) ai lati (DEC-107; prima la larghezza di lettura 640 di DEC-58).
- **Simboli markdown:** non si vedono mai, nemmeno sulla riga del cursore (DEC-58).
- **Elenchi:** segni (•, 1.) in `testo-tenue`, in una colonna di 16 px.
- **Checklist:** casella tonda di 16, coerente con le pillole: vuota con contorno `icona-tenue` 1,5; spuntata `sfondo-pieno` con spunta `icona-su-pieno`; la voce spuntata va in `testo-tenue` barrato.
- **Selezione:** `evidenziazione-selezione` dietro il testo.
- **Nota nuova:** inviti «Titolo» e «Scrivi qualcosa…» in `testo-tenue`, con il cursore nel corpo.

### Stati (della casella)
| Stato | Descrizione |
|---|---|
| Default | Vuota |
| Hover | `sfondo-hover` dentro il cerchio |
| Focus | Anello 2 px staccato 2 px |
| Attivo | Spuntata |
| Disabilitato · Errore · Caricamento | Non previsti |

### Accessibilità
- **Tastiera:** le scorciatoie di formattazione (CMP-09); Ctrl + Invio spunta la voce della checklist in cui si trova il cursore. Tab porta una voce di elenco un livello più dentro, altrove scrive una tabulazione; Maiusc + Tab torna indietro. Per uscire dal testo da tastiera: Esc e poi Tab (ID-26).
- **Lettori di schermo:** titoli come intestazioni, elenchi come elenchi, voci della checklist come caselle di controllo.
- **Contrasti:** testo primario ≥ 16,48:1 su `sfondo-nota`; simboli e segni in `testo-tenue` 5,49:1 e 7,30:1; voce spuntata 5,49:1.

### Esempi
- ✅ Corretto: il `##` che sparisce appena il markdown lo riconosce, anche sulla riga dove si sta scrivendo (DEC-58).
- ❌ Scorretto: mostrare i simboli markdown della nota.

---

## CMP-21 – Immagine nel testo e area di trascinamento
**Tipo:** composto (usa CMP-02) · **Usato in:** SC-03 · **Figma:** pagina Componenti composti, [Immagine nel testo](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=77-2364) e [Area di trascinamento](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=77-2365)

**Scopo:** mostrare le immagini dentro il testo e accogliere quelle trascinate (RF-03, FL-03).
**Quando usarlo:** nella nota, per le immagini inserite o trascinate.
**Quando non usarlo:** per altri file (fuori dalla prima fase, ID-14).

### Varianti e dimensioni
- **Normale:** blocco con `raggio-contenitore` (20); qui un segnaposto su `sfondo-campo` con l'icona immagine 24 in `icona-tenue`.
- **Selezionata:** contorno 2 px in `sfondo-pieno`, staccato 2 px. Dal tasto destro si aprono le impostazioni (dimensione, allineamento, ritaglio, rotazione, testo alternativo, RB-14); il pannello si disegna con i mockup.
- **In arrivo:** segnaposto con l'icona di caricamento e «Immagine in arrivo» (Interfaccia/Dettaglio, `testo-tenue`), mentre l'immagine si sincronizza.
- **Rifiutata:** messaggio in linea accanto al punto di inserimento, icona errore e testo in `testo-errore` (RB-11, RB-12), non bloccante.
- **Area di trascinamento:** mentre si trascina un file, tutta l'area della nota si copre di un bordo tratteggiato (`icona-tenue`, `tratto-icona`, raggio 20) con icona, «Rilascia qui l'immagine» (Interfaccia/Titolo) e «Solo immagini, fino a 25 MB» (Interfaccia/Dettaglio); livello 30.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Normale |
| Hover | Nessun cambiamento: il cursore diventa una mano |
| Focus | Come Selezionata |
| Attivo | Selezionata |
| Disabilitato | Non previsto |
| Errore | Rifiutata |
| Caricamento | In arrivo |

### Accessibilità
- **Tastiera:** l'immagine si seleziona con le frecce come un carattere; Canc la elimina; il menu del tasto destro si apre con il tasto menu o Maiusc + F10.
- **Lettori di schermo:** il testo alternativo (di default il nome del file, RNF-04).
- **Contrasti:** messaggio di errore 6,06:1 e 6,75:1; testi dell'area come CMP-19.

### Esempi
- ✅ Corretto: «Si possono inserire solo immagini, fino a 25 MB.» accanto al punto in cui si è rilasciato il file.
- ❌ Scorretto: una finestra che blocca per dire che il file non è un'immagine.

---

## CMP-22 – Modulo di accesso
**Tipo:** composto (usa CMP-01 e CMP-03) · **Usato in:** SC-05 · **Figma:** pagina Componenti composti, [Modulo di accesso](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=86-2910)

**Scopo:** accedere con email e password per sincronizzare le note (DEC-121).
**Quando usarlo:** in SC-05, aperta da «Accedi» nel box dell'account di SC-06 (DEC-122) o dall'avviso dell'accesso scaduto (RB-87).
**Quando non usarlo:** per creare l'account (lo crea il comando del server, DEC-121) o per uscire («Esci» nel box dell'account di SC-06, CMP-32).

### Varianti e dimensioni
- **Accesso:** titolo «Accedi a Memodu» (Interfaccia/Titolo), sottotitolo in `testo-tenue`, campi Email (CMP-03 normale) e Password (CMP-03 password) con etichette Interfaccia/Etichetta; a destra «Non voglio usare il cloud» (secondario), che scollega come «Esci» (RB-89), e «Accedi» (primario), 8 px tra loro.
- **Errore:** messaggio in linea sopra i pulsanti, icona errore e testo `testo-errore` («Email o password non corrette.»).
- Guscio della finestra di conferma (CMP-16): `sfondo-flottante`, `raggio-contenitore` (20), `ombra`, largo 400, `spazio-finestra` (24) su tutti i lati, `spazio-blocco` (16) tra i blocchi, figli a tutta larghezza. Al centro della finestra, livello 40, con il `velo` sul resto.
- I testi sono esempi; quelli definitivi in Fase 6. Il primo avvio non c'è più (DEC-121).

### Stati
| Stato | Descrizione |
|---|---|
| Default | Aperta, focus sul campo Email |
| Hover · Focus | Li gestiscono campi e pulsanti |
| Attivo | Accedi: il pulsante in caricamento mentre il dispositivo calcola Argon2id e il server risponde; poi la finestra si chiude e la sincronizzazione parte |
| Errore | Email o password errate, o server irraggiungibile: messaggio in linea sopra i pulsanti |
| Disabilitato | Non previsto |
| Caricamento | Il pulsante Accedi in caricamento (CMP-01) |

### Accessibilità
- **Tastiera:** focus sul campo Email all'apertura; Invio da qualsiasi campo invia il modulo; Esc chiude soltanto la finestra, senza scollegare (scelta di Manuel Cucca il 06/10/2026); un clic sul velo fa lo stesso, tranne mentre l'accesso è in corso (DEC-124).
- **Lettori di schermo:** il messaggio di errore è collegato ai campi e si annuncia quando compare; il pulsante con l'occhio ha il nome "Mostra la password".
- **Contrasti:** come CMP-01 e CMP-03.

### Esempi
- ✅ Corretto: un solo messaggio per email o password sbagliate, senza dire quale delle due.
- ❌ Scorretto: svuotare il campo Email dopo un errore.

---

## CMP-23 – Nota rapida
**Tipo:** composto (usa CMP-01 tenue e diviso, CMP-09, CMP-20) · **Usato in:** SC-02 · **Figma:** pagina Componenti composti, [Nota rapida](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=140-3837)

**Scopo:** la finestra per annotare un'idea da qualsiasi programma (RF-01, FL-01).
**Quando usarlo:** solo per SC-02, una finestra per ogni nota rapida.
**Quando non usarlo:** per scrivere nel programma completo (SC-03, con CMP-20).

### Varianti e dimensioni
- **Vuota:** «Scrivi qui…» in `testo-tenue`. **Con testo:** il testo della nota in Nota/Corpo, `testo-primario`.
- Finestra senza cornice 480 × 320 (ridimensionabile), `sfondo-nota`, `raggio-contenitore`, `ombra`; `spazio-finestra` (24) ai bordi, `spazio-blocco` (16) tra testo e azioni. Nessun titolo (RB-15), nessuna barra, nessun divisore.
- In basso a destra **Chiudi** (CMP-01 diviso), con la scorciatoia ⇧ ↵ accanto (Maiusc + Invio, DEC-65): salva e chiude; nel menu della freccia **Apri nel programma** (DEC-34, DEC-50). Nessuna ✕ e nessun altro pulsante.
- Il margine in alto non si vede e serve a trascinare la finestra. Nell'app gli angoli sono squadrati (scostamento accettato, vedi SC-02).

### Stati
| Stato | Descrizione |
|---|---|
| Default | Vuota o con testo |
| Hover · Focus · Attivo | Li gestiscono i pulsanti |
| Errore | Se la copia di lavoro non si apre o non si scrive compare SC-07 sopra la finestra (DEC-67, DEC-85); chiudendo, la finestra di conferma (CMP-16, RB-61, RB-62) |
| Disabilitato · Caricamento | Non previsti: la finestra compare già pronta (RNF-01) |

### Accessibilità
- **Tastiera:** il cursore è nel testo all'apertura; Esc salva e chiude; Tab raggiunge Chiudi e la freccia «Altre azioni».
- **Lettori di schermo:** la freccia si annuncia come «Altre azioni», con un menu.
- **Contrasti:** come CMP-01 e CMP-20.

### Esempi
- ✅ Corretto: scrivere un'idea e premere Esc: la nota è salvata tra le non organizzate.
- ❌ Scorretto: aggiungere una ✕ in alto: la chiusura c'è già in basso (DEC-34).

---

## CMP-24 – Info
**Tipo:** composto (usa CMP-01 solo icona, CMP-03, CMP-05, CMP-07 e il separatore; suggerimenti CMP-09, calendario CMP-12 e pannello Sposta in CMP-11 sopra) · **Usato in:** SC-03 (Comparsa, dal titolo del percorso), SC-01 (Finestra, dal tasto destro su una nota della colonna), SC-03 del modulo Locale (Info del file, dal nome del file nel percorso) · **Figma:** pagina Componenti composti, sezione CMP-24 Info

**Scopo:** tutto ciò che riguarda la nota in un punto solo: titolo, date, tag, cartella, chiudere ed eliminare (DEC-96, RF-04, RF-06). Supera la finestra dei dettagli di DEC-44 e la comparsa dei metadati (CMP-27).
**Quando usarlo:** con un clic sul titolo nel percorso (CMP-26) per la nota aperta; da «Info» nel tasto destro su una nota della colonna, anche non aperta.
**Quando non usarlo:** per azioni non reversibili senza conferma (finestra di conferma, CMP-16) o per scegliere la cartella (Sposta in, CMP-11, che si apre dalla riga della cartella).

### Varianti e dimensioni
- **Comparsa:** sotto il titolo del percorso, centrata su di lui, 8 sotto; livello 20, senza velo, come i menu. In fondo, dopo un divisore, «Chiudi nota» (Ctrl + W) ed «Elimina» (voce distruttiva).
- **Info del file** (componente a parte nella sezione, DEC-123): con un clic sul nome di un file di Locale nel percorso, come la Comparsa (posizione, livello, spazi, larghezza) ma solo con il campo del nome (rinomina, RB-82), il divisore e le voci «Chiudi file» (Ctrl + W) e, solo per un file aggiunto da solo all'elenco, «Togli da Locale» con l'icona togli da locale (voce normale, non distruttiva: sul disco non cambia niente, RB-76). Varianti Voci = Chiudi e Togli, Solo Chiudi (file dentro una cartella aggiunta, o file nuovo mai salvato: il nome lo prende al primo Ctrl + S, RB-81). Niente cartella, date, tag o «Modificata» (RF-17).
- **Finestra:** al centro, livello 30 (`z-overlay`) con il velo; le finestre di conferma stanno sopra, a 40. In testa «Info» (Interfaccia/Titolo) e la ✕ (CMP-01 solo icona). In fondo solo «Elimina»: la nota non è aperta, non c'è niente da chiudere.
- Larga 360; `sfondo-flottante`, `raggio-contenitore`, `ombra`. Ruolo **pannello** (DEC-100): margine `spazio-pannello` (16) su tutti i lati; `spazio-blocco` (16) tra i blocchi (titolo, righe, «Modificata», divisore, voci); `spazio-elemento` (4) tra le righe. Righe, «Modificata», intestazione, campo del titolo e voci sono pillole con `spazio-controllo` (12) dentro: pillole a 16 dal bordo, icone e testi a 28. La ✕ dell'intestazione sta sul bordo della pillola, a 16.
- **Titolo:** il campo (CMP-03) largo quanto Info, senza etichetta; una nota senza titolo ha il campo vuoto con «Senza titolo» come segnaposto.
- **Righe** (proposta C, DEC-97), ognuna con l'icona Lucide 16 in `icona-tenue` e la frase intera in Interfaccia/Controllo; passandoci sopra la riga prende `sfondo-hover`, a tutta larghezza:
  - **Cartella** (`folder`): «Lavoro › Clienti» o «Non organizzata»; un clic apre il pannello Sposta in (CMP-11) accanto alla riga.
  - **Creazione** (`calendar`): «Creata il 12/09/2026»; il suggerimento della riga dà la data di sistema, «Data di sistema: 12/09/2026 alle 10:14» (RB-21). Se la data è stata cambiata, a destra «Ripristina» in `testo-tenue` (in `testo-primario` passandoci sopra) torna a quella di sistema.
  - **Fine validità** (`calendar`): «Fine validità il …» o, in `testo-tenue`, «Nessuna fine validità»; il suggerimento è «Solo un promemoria: alla scadenza non succede nulla» (RF-04).
  - **Tag** (`tag`): i tag (CMP-05 rimovibili, vanno a capo) e «+ Tag», pillola alta 24 con il bordo tratteggiato; un clic la sostituisce con il campo «Aggiungi un tag» (largo 132), che lasciato vuoto torna «+ Tag».
- **Riga di data aperta:** con un clic, al posto della frase c'è il campo con la data selezionata (GG/MM/AAAA, senza fondo suo: la pillola resta evidenziata) e sotto la riga il calendario (CMP-12).
- **«Modificata oggi alle 11:42»** in Interfaccia/Dettaglio e `testo-tenue`, allineata alle righe (pillola con `spazio-controllo` dentro, DEC-100), in sola lettura. Poi il divisore e le voci (CMP-07).

### Stati
| Stato | Descrizione |
|---|---|
| Default | Come sopra; ogni modifica vale subito, senza Salva (RB-06) |
| Hover · Focus · Attivo | Li gestiscono i controlli |
| Suggerimenti e calendario | Si aprono sopra Info (regola degli elementi di livello 20 aperti da un overlay) e si chiudono con lei |
| Errore | Solo nelle righe delle date: una data che non esiste, confermata con Invio, dà alla pillola l'anello `icona-errore` e sotto, nella riga, «Data non valida: scrivi GG/MM/AAAA» finché non è corretta; uscendo dal campo la riga si chiude con la data di prima (DEC-52) |
| Disabilitato · Caricamento | Non previsti per ora |

### Accessibilità
- **Tastiera:** all'apertura il focus va sul campo del titolo; Tab passa da un controllo all'altro (righe, tag, «+ Tag», «Ripristina») fino a Chiudi nota ed Elimina. Invio o spazio aprono una riga; nella riga di data Invio conferma, ↓ passa al calendario (dove Esc torna nel campo), Esc chiude la riga con il calendario e il focus torna sulla riga. Esc fuori dalle righe chiude (prima un suggerimento aperto, poi Info) e il focus torna dove era. La Comparsa si chiude anche con un clic fuori; la Finestra con un clic sul velo, dopo aver chiuso menu, calendario o conferma aperti (DEC-81).
- **Lettori di schermo:** ruolo «dialog» con il nome «Info di ‹titolo›»; le righe sono pulsanti con il nome intero («Cartella Lavoro › Clienti: Sposta in…», «Data di creazione: Creata il 12/09/2026», «Fine validità: Nessuna fine validità»); la ✕ si chiama «Chiudi».
- **Contrasti:** come CMP-03, CMP-05, CMP-07 sulla superficie flottante.

### Esempi
- ✅ Corretto: clic sul titolo, cambiare la fine validità e togliere un tag: la nota è aggiornata subito, Info resta aperta.
- ❌ Scorretto: aggiungere Salva e Annulla: ogni modifica vale subito, come nel resto dell'app.

---

## CMP-25 – Barra di scorrimento
**Tipo:** composto · **Usato in:** SC-01 (la colonna), SC-02 (la nota rapida), SC-03 (il foglio), SC-04 (il cestino), SC-06 (le impostazioni), Info (CMP-24), card dei risultati (CMP-13), ricerca avanzata (CMP-29) e Sposta in (CMP-11) · **Figma:** pagina Componenti composti, [Barra di scorrimento](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=182-5587)

**Scopo:** mostrare dove si è in un contenuto che scorre e permettere di spostarsi trascinando, senza togliere spazio al testo (DEC-58).
**Quando usarlo:** in ogni area che scorre: il foglio della nota (tutta la pagina, DEC-59), la colonna, la nota rapida, il cestino, le impostazioni e i pannelli che scorrono. Nessuna area mostra la barra del sistema.
**Quando non usarlo:** nei menu e nei pannelli corti, che non scorrono.

### Varianti e dimensioni
- Barra sovrapposta al contenuto di OverlayScrollbars (DEC-89): cursore largo 6, tondo (`raggio-pillola`), in `icona-tenue`, a 2 px dal bordo destro e dai bordi in alto e in basso dell'area; nessun binario; non occupa spazio. L'altezza segue la parte visibile del contenuto, almeno 24.
- Sta nell'area che scorre: si muove e sparisce con lei.

### Stati
| Stato | Descrizione |
|---|---|
| Nascosta | Default: non si vede |
| Visibile | Compare scorrendo o muovendo il mouse sull'area; opacità 50 %. Sparisce dopo 0,8 s con la dissolvenza della libreria |
| Trascinata · sotto il mouse | Opacità 80 %; trascinandola il contenuto scorre |
| Focus · Disabilitato · Errore · Caricamento | Non previsti |

### Accessibilità
- **Tastiera:** non si raggiunge con Tab: il contenuto scorre con le frecce, Pagina su e giù, Inizio e Fine come sempre.
- **Lettori di schermo:** è solo visiva, nascosta ai lettori di schermo; l'area che scorre resta quella nativa.
- **Contrasti:** è un indicatore non essenziale e non ha una soglia; `icona-tenue` al 50 % resta visibile sui fondi della nota e della colonna, in chiaro e in scuro.

### Esempi
- ✅ Corretto: scorrendo una nota lunga il cursore compare a destra sopra il testo e sparisce poco dopo.
- ❌ Scorretto: una barra sempre visibile che restringe il testo, o un binario colorato sotto il cursore.

---

## CMP-26 – Percorso
**Tipo:** composto (parte interna "Segmento del percorso") · **Usato in:** SC-03 · **Figma:** pagina Componenti composti, sezione CMP-26 Percorso

**Scopo:** mostrare dove sta la nota aperta e il suo titolo, al posto del titolo grande nel foglio (DEC-71).
**Quando usarlo:** al centro della fascia in alto della nota aperta, una sola volta.
**Quando non usarlo:** nella nota rapida (SC-02), che non ha titolo, e come navigazione in altre schermate.

### Varianti e dimensioni
- **Livelli:** Radice (solo il titolo, nota non organizzata), Una cartella, Due cartelle, Lungo (con più di due cartelle quelle di mezzo diventano «…»).
- Segmenti alti 24 (`misura-controllo-piccolo`), pillole con margini `spazio-controllo-piccolo` (8); tra un segmento e l'altro la freccia destra 12 in `icona-tenue`, senza spazio in più.
- **Cartella:** Interfaccia/Controllo in `testo-tenue`. **Titolo:** Interfaccia/Controllo attivo in `testo-primario`. **Senza titolo:** «Senza titolo» in Interfaccia/Controllo attivo e `testo-tenue`. **Cartelle nascoste:** «…» come una cartella.
- Centrato nella fascia in alto del foglio, a 12 dal bordo, alla stessa altezza dei tasti flottanti (DEC-60). Ha il fondo `sfondo-nota` con `raggio-pillola`: il testo che scorre gli passa sotto senza sovrapporsi (proposta dell'agente).
- Il titolo è un pulsante largo quanto il suo testo; vuoto mostra «Senza titolo». Un clic apre Info (CMP-24, tipo Comparsa) sotto di lui: lì si cambia il titolo (DEC-96).
- **Non salvato** (proprietà, Locale, RF-17): un pallino da 6 in `icona-tenue`, 8 dopo il nome del file, finché il file ha modifiche non salvate (RB-77). Per un file locale il primo segmento è «Locale», poi le cartelle e il nome del file; un clic sul nome lo rinomina (FL-12).

### Stati (di ogni segmento)
| Stato | Descrizione |
|---|---|
| Default | Senza sfondo |
| Hover | `sfondo-hover`; il testo di una cartella passa a `testo-primario` |
| Focus | Anello `focus-anello` di 2 px staccato 2 px |
| Attivo | Titolo: Info aperta sotto di lui, il segmento resta in hover finché Info è aperta (DEC-96). Cartella: la apre nella colonna |
| Disabilitato · Errore · Caricamento | Non previsti |

### Accessibilità
- **Tastiera:** i segmenti sono pulsanti in fila; Tab passa da uno all'altro, Invio apre la cartella o, sul titolo, Info (CMP-24).
- **Lettori di schermo:** elenco con il nome «Percorso della nota»; l'ultimo elemento è il titolo, con `aria-current`.
- **Contrasti:** come la riga della colonna: `testo-tenue` 5,49:1 e `testo-primario` 16,48:1 su `sfondo-nota`.

### Esempi
- ✅ Corretto: «Lavoro › Clienti › Rossi» per una nota nella cartella Clienti.
- ❌ Scorretto: ripetere il titolo anche in cima al foglio.

---

## CMP-27 – Comparsa dei metadati
**SUPERATO (DEC-96):** passando sul titolo non compare più niente; con un clic sul titolo si apre Info (CMP-24), che mostra e modifica anche ultima modifica e tag. Il codice è tolto il 01/10/2026; la scheda resta finché ci sono i mockup superati che la usano.

**Tipo:** composto · **Usato in:** SC-03 · **Figma:** pagina Componenti composti, sezione CMP-27 Comparsa dei metadati

**Scopo:** mostrare ultima modifica e tag della nota aperta senza occupare il foglio (DEC-71).
**Quando usarlo:** sotto il titolo del percorso (CMP-26), passando con il mouse o con il focus sul titolo.
**Quando non usarlo:** per modificare date e tag, che si cambiano da Info (CMP-24).

### Varianti e dimensioni
- **Tag:** Con tag, Senza tag (solo la data).
- `sfondo-flottante`, `raggio-interno` (12), margini `spazio/12`, `ombra`, livello 20 (`z-comparsa`); 8 sotto il percorso, centrata sul titolo.
- Dentro la Riga dei metadati (CMP-20) larga 296: la data di ultima modifica in Interfaccia/Dettaglio e `testo-tenue`, sotto i tag in sola lettura (CMP-05 senza ✕) che vanno a capo.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Visibile |
| Hover · Focus | Compare dopo 500 ms di sosta sul titolo, subito con il focus da tastiera; resta mentre il mouse è sul titolo; sparisce lasciandolo, cliccandolo o con Esc |
| Attivo · Disabilitato · Errore · Caricamento | Non previsti: non si clicca |

Compare e sparisce con `movimento-durata-breve` (120 ms).

### Accessibilità
- **Tastiera:** non riceve il focus; Esc la nasconde senza spostare il focus.
- **Lettori di schermo:** il testo è la descrizione del titolo nel percorso («Modificata oggi alle 11:42, tag riunioni, lavoro/clienti»).
- **Contrasti:** data in `testo-tenue` su `sfondo-flottante` come nei menu; tag come CMP-05 sulla superficie flottante.

### Esempi
- ✅ Corretto: passando sul titolo compaiono data e tag.
- ❌ Scorretto: mettere nella comparsa pulsanti o campi da modificare.

---

## CMP-28 – Scelta a segmenti
**Tipo:** base · **Usato in:** SC-06 (tema, CMP-18 Scelta) · **Figma:** pagina Componenti base, sezione CMP-28 Scelta a segmenti

**Scopo:** scegliere uno tra pochi valori, vedendoli tutti (DEC-91).
**Quando usarlo:** da due a quattro valori brevi che si escludono, es. Sistema · Chiaro · Scuro.
**Quando non usarlo:** per acceso o spento (interruttore, CMP-04), per molti valori o valori lunghi (un menu, CMP-09).

### Varianti e dimensioni
- Contenitore pillola alto 32 (`misura-riga`) su `sfondo-campo`, margine interno 4; dentro i segmenti, larghi quanto il testo, alti 24, margini 12, testo Interfaccia/Controllo in `testo-primario`.
- Parte interna **Segmento** con la proprietà Testo e gli stati sotto.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Senza sfondo |
| Hover | `sfondo-hover` sul segmento |
| Focus | Anello `focus-anello` di 2 px staccato 2 px sul segmento scelto, solo da tastiera |
| Attivo | Selezionato: `sfondo-pieno` con testo Interfaccia/Controllo attivo in `testo-su-pieno`; il cambio vale subito (RB-06) |
| Disabilitato | Opacità 40% su tutta la scelta |
| Errore · Caricamento | Non previsti |

### Accessibilità
- **Tastiera:** un solo arresto di Tab, sul segmento scelto; frecce sinistra e destra cambiano la scelta.
- **Lettori di schermo:** gruppo di pulsanti di opzione con il nome dell'impostazione («Tema»); ogni segmento è un'opzione, selezionata o no.
- **Contrasti:** testo primario su `sfondo-campo` come CMP-03; selezionato come il pulsante primario (CMP-01).

### Esempi
- ✅ Corretto: Sistema · Chiaro · Scuro, con Sistema scelto di default.
- ❌ Scorretto: usarla per un'azione («Esporta» · «Importa»): i segmenti sono valori, non comandi.

---

## CMP-29 – Ricerca avanzata
**Tipo:** composto (usa CMP-01 solo icona, CMP-03 ricerca, CMP-07 e la parte interna Risultato della ricerca di CMP-13; calendario CMP-12 sopra) · **Usato in:** SC-01 · **Figma:** pagina Componenti composti, sezione CMP-29 Ricerca avanzata

**Scopo:** cercare e filtrare quando i risultati non stanno nella card, vedendo tutti i filtri insieme (DEC-96, ID-33, RF-08).
**Quando usarlo:** da «Mostra tutti i risultati» in fondo alla card (CMP-13) o con Ctrl + Maiusc + K, anche a card chiusa.
**Quando non usarlo:** per le ricerche veloci, che restano nella card sotto il campo della colonna.

### Varianti e dimensioni
- Finestra al centro, livello 30 con il velo; larga 1040, alta 820; `sfondo-flottante`, `raggio-contenitore`, `ombra`.
- **Barra:** il campo di ricerca (CMP-03, tipo Ricerca) largo quanto la finestra e la ✕; margine `spazio-pannello` (16) su tutti i lati, come le colonne dei filtri e dei risultati (ruolo pannello, DEC-100); tra il campo e la ✕ `spazio-icona` (8); sotto un divisore `bordo-divisore`.
- **Filtri sempre aperti**, a sinistra, larghi 260, con un divisore verticale: titoli di gruppo Tag, Creazione e Modifica; sotto le stesse voci dei menu dei filtri (CMP-09), come voci di menu (CMP-07) con la spunta a destra: i tag con più scelte, i periodi con una sola («Qualsiasi data», «Oggi», «Ultimi 7 giorni», «Ultimi 30 giorni», «Quest'anno», «Scegli le date…», che apre il calendario per scegliere un giorno, DEC-126).
- **Risultati**, a destra: il conteggio in Interfaccia/Messaggio e `testo-tenue` (es. «"rilascio" con il tag lavoro · 4 note»), poi i risultati come nella card, con lo stesso ordine (RB-34) e le note del cestino attenuate (RB-29).
- Testo e filtri arrivano dalla card e tornano alla card quando la finestra si chiude.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Come sopra |
| Hover · Focus · Attivo | Li gestiscono le voci e i risultati; una scelta nei filtri vale subito |
| Nessun risultato | Al posto dei risultati «Nessuna nota trovata» e il suggerimento, come nella card (RB-35) |
| Disabilitato · Errore · Caricamento | Non previsti: la ricerca è sul dispositivo |

### Accessibilità
- **Tastiera:** all'apertura il focus va nel campo; freccia giù entra nei risultati, Invio apre la nota e chiude la finestra; Tab passa dal campo ai filtri e ai risultati; Esc chiude e il focus torna dove era.
- **Lettori di schermo:** ruolo «dialog» con il nome «Ricerca avanzata»; i filtri sono gruppi con il nome del gruppo; il campo annuncia il numero di risultati.
- **Contrasti:** come CMP-07 e CMP-13 sulla superficie flottante.

### Esempi
- ✅ Corretto: dalla card con «rilascio» scritto, «Mostra tutti i risultati», poi spuntare il tag lavoro senza aprire menu.
- ❌ Scorretto: aprire la ricerca avanzata vuota, perdendo quello che si era scritto nella card.

---

## CMP-30 – Fondo della colonna
**Tipo:** composto (usa CMP-06 Cestino e Impostazioni) · **Usato in:** SC-01, SC-03, SC-04, SC-06 (in fondo alla colonna) · **Figma:** pagina Componenti composti, sezione CMP-30 Fondo della colonna

**Scopo:** tenere Cestino e Impostazioni sempre raggiungibili in fondo alla colonna, anche mentre note e cartelle scorrono (DEC-40, DEC-91).
**Quando usarlo:** solo in fondo alla colonna.
**Quando non usarlo:** per altre azioni della colonna, che stanno nelle sezioni (CMP-06).

### Varianti e dimensioni
- Largo quanto la colonna, su `sfondo-colonna`, fermo sul fondo mentre la colonna scorre. Ruolo pannello (DEC-100): `spazio-pannello` (16) su tutti i lati, così sopra Cestino c'è lo stesso spazio che sotto Impostazioni; `spazio-elemento` (4) tra le due righe.
- **Contenuto sotto = No:** nessuna ombra, quando tutto il contenuto sta sopra di lui.
- **Contenuto sotto = Sì:** quando note e cartelle gli scorrono sotto, l'ombra verso l'alto `ombra-sopra` (0 −4 12, colore `ombra-flottante`) lo stacca dal contenuto.
- Durante il trascinamento la riga Cestino diventa il cestino di trascinamento (CMP-14).
- Con il cestino o le impostazioni aperti la loro riga, selezionata, diventa l'azione per chiuderli: icona Chiudi (×) e testo «Chiudi cestino» o «Chiudi impostazioni», senza numero; un clic lascia l'area vuota (DEC-117).

### Stati
| Stato | Descrizione |
|---|---|
| Default | Come nelle varianti; l'ombra dipende da cosa c'è sotto |
| Hover · Focus · Attivo | Li gestiscono le righe (CMP-06) |
| Errore · Disabilitato · Caricamento | Non previsti |

### Accessibilità
- **Tastiera e lettori di schermo:** come le righe Cestino e Impostazioni (CMP-06); l'ombra è solo visiva.
- **Contrasti:** come CMP-06 su `sfondo-colonna`.

### Esempi
- ✅ Corretto: colonna lunga, scorsa in cima: il fondo ha l'ombra e le note gli passano sotto; scorsa fino in fondo: l'ombra sparisce.
- ❌ Scorretto: l'ombra sempre accesa, anche quando sotto non c'è niente.

---

## CMP-31 – Gruppo di impostazioni
**Tipo:** composto (usa CMP-18) · **Usato in:** SC-06 · **Figma:** pagina Componenti composti, [Gruppo di impostazioni](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=305-4254)

**Scopo:** dare a ogni sezione delle impostazioni un titolo marcato e un confine, così si vede dove finisce una sezione e comincia l'altra (DEC-122).
**Quando usarlo:** in SC-06, una volta per sezione: Generale (scorciatoia della nota rapida, avvio all'accensione, primo piano, tema) e Ricerca.
**Quando non usarlo:** per l'account e il nome del dispositivo, che stanno nel box dell'account (CMP-32).

### Varianti e dimensioni
- Largo quanto il contenuto di SC-06 (560 nella libreria), su `sfondo-nota`.
- **Intestazione:** il titolo di gruppo di CMP-18, con `spazio-elenco` (8) ai lati come il riquadro: il titolo parte a 20 dal bordo, allineato ai testi delle righe (stessa anatomia, 8 + 12).
- **Riquadro:** `sfondo-colonna`, `raggio-contenitore` (20), ruolo elenco: `spazio-elenco` (8) su tutti i lati. Le righe di CMP-18 vanno a tutta larghezza, con l'hover a `raggio-interno` (12) concentrico agli angoli; testi a 20 dal bordo, controlli a 16 (8 + 8).
- Tra una riga e l'altra un divisore di 1 px in `bordo-divisore-tenue` a tutta larghezza, con `spazio-elemento` (4) sopra e sotto.
- `spazio-icona` (8) tra intestazione e riquadro; tra due gruppi `spazio-gruppo` (24).

### Stati
| Stato | Descrizione |
|---|---|
| Default | Come sopra |
| Hover · Focus · Attivo · Disabilitato · Errore | Li gestiscono le righe (CMP-18) |
| Caricamento · Vuoto | Non previsti: le impostazioni sono sulla copia di lavoro |

### Accessibilità
- **Lettori di schermo:** il titolo è l'intestazione del gruppo (ruolo `group` con `aria-labelledby` sul titolo); il riquadro e i divisori sono solo visivi.
- **Contrasti:** il titolo in `testo-tenue` su `sfondo-nota` come i titoli della colonna; le righe come CMP-18, su `sfondo-colonna` (tabella dei fondi in `tokens.md`).

### Esempi
- ✅ Corretto: Generale con quattro righe nel suo riquadro, Ricerca in un riquadro a parte sotto.
- ❌ Scorretto: righe di sezioni diverse nello stesso riquadro, o una riga fuori dal riquadro.

---

## CMP-32 – Box dell'account
**Tipo:** composto (usa CMP-01, CMP-02, CMP-18) · **Usato in:** SC-06, in cima · **Figma:** pagina Componenti composti, [Box dell'account](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=305-4403)

**Scopo:** mettere in evidenza chi ha fatto l'accesso e se la sincronizzazione va, nel primo posto che si guarda (DEC-122).
**Quando usarlo:** solo in cima a SC-06, sotto il titolo Impostazioni e prima dei gruppi.
**Quando non usarlo:** per avvisare di un problema mentre si lavora: quello è l'avviso (CMP-15, RB-87).

### Varianti e dimensioni
- Lo stesso riquadro di CMP-31 (`sfondo-colonna`, `raggio-contenitore`, `spazio-elenco`) con in più il bordo di 1 px in `bordo-divisore`, dentro, per stare in evidenza.
- **Intestazione:** `spazio-controllo` (12) a sinistra, sopra e sotto, `spazio-controllo-piccolo` (8) a destra come le righe che finiscono con un controllo; `spazio-blocco` (16) tra le parti. Cerchio da 40 (`raggio-pillola`); testi con `spazio-elemento` (4) tra loro: in alto Interfaccia/Titolo in `testo-primario`, sotto Interfaccia/Dettaglio in `testo-tenue`; pulsante a destra.
- **Stato = Senza accesso:** cerchio `sfondo-campo` con l'icona utente da 20 in `icona-tenue`; «Non hai fatto l'accesso», sotto «Le note restano su questo computer.»; Accedi primario, apre SC-05. Niente nome del dispositivo.
- **Stato = Sincronizzata:** cerchio `sfondo-pieno` con l'iniziale dell'email in maiuscolo (Interfaccia/Titolo di schermata, `testo-su-pieno`); email; pallino da 8 in `icona-successo` a `spazio-icona` (8) da «Sincronizzata · oggi alle 14:32»; Esci secondario.
- **Stato = Non raggiungibile:** come Sincronizzata, pallino `icona-avviso` e «Server non raggiungibile: ultimo backup 14:32» (l'ora dell'ultima sincronizzazione riuscita, con la data davanti se non è di oggi: «05/10/2026 14:32»); «Non riuscita: riprovo da sola» con un errore del server. Stato = Sincronizzata con il pallino `icona-tenue` per «In attesa della prima sincronizzazione»; Accesso scaduto con «Memodu e il server hanno versioni diverse» ed Esci per il protocollo diverso (DEC-122).
- **Stato = Accesso scaduto:** come Sincronizzata, pallino `icona-errore`, «Accedi di nuovo per sincronizzare» e Accedi primario al posto di Esci (RB-87).
- Dopo l'accesso, sotto un divisore come in CMP-31, la riga Campo di CMP-18 «Nome del dispositivo» (RB-51). Testi a 20 dal bordo, pulsante e campo a 16.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Le quattro varianti sopra |
| Hover · Focus · Premuto | Del pulsante (CMP-01) e del campo (CMP-03) |
| Caricamento | Non previsto: la sincronizzazione in corso non ha un suo stato, resta l'ultimo (DEC-122) |
| Errore | Gli stati Non raggiungibile e Accesso scaduto; gli errori dell'accesso stanno in SC-05 |

### Accessibilità
- **Lettori di schermo:** il box è una regione «Account»; lo stato si legge come testo, il pallino è solo visivo (il colore non è l'unica informazione, DEC-14). Il cerchio con l'iniziale è decorativo.
- **Tastiera:** Tab raggiunge il pulsante, poi il campo del nome.
- **Contrasti:** testi come CMP-18 su `sfondo-colonna`; pallini `icona-<stato>` su `sfondo-colonna` da 4,66:1 (successo in chiaro) a 6,95:1, sopra 3:1; `testo-tenue` su `sfondo-colonna` 4,99:1 in chiaro e 6,53:1 in scuro; iniziale `testo-su-pieno` su `sfondo-pieno` come il pulsante primario.

### Esempi
- ✅ Corretto: aprendo le impostazioni si vede subito l'email e il pallino verde con l'ora dell'ultima sincronizzazione.
- ❌ Scorretto: lo stato della sincronizzazione in una sezione separata dall'account, o il pallino senza il testo.
