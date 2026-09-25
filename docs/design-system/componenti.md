# Componenti

<!-- Fase 5 della guida. Copia il blocco per ogni componente. -->

I componenti vivono nel file Figma [Memodu – Design system](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE), che diventa la libreria: pagina **Componenti base** (CMP-01 … CMP-08) e pagina **Componenti composti** (CMP-09 … CMP-21). Ogni componente usa solo token semantici (vedi `tokens.md`) e ha un'anteprima in modo scuro.

| Codice | Componente | Tipo | Stato |
|---|---|---|---|
| CMP-01 | Pulsante | base | Disegnato |
| CMP-02 | Icona | base | 30 icone, 4 dimensioni |
| CMP-03 | Campo di testo | base | Disegnato |
| CMP-04 | Interruttore | base | Disegnato |
| CMP-05 | Tag | base | Disegnato |
| CMP-06 | Riga della colonna | base | Disegnato |
| CMP-07 | Voce di menu | base | Disegnato |
| CMP-08 | Suggerimento | base | Disegnato |
| CMP-09 | Menu (`···`, tasto destro, inserimento con `/`, suggerimenti dei tag) | composto | Disegnato |
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
| CMP-22 | Modulo di accesso (progettato, non attivo: DEC-19) | composto | Disegnato |

L'icona nell'area di notifica (Windows) o nella barra dei menu (macOS) è un'icona di sistema e non è un componente.

### Parti interne
Nella sezione **Parti interne** della pagina Componenti composti ci sono i pezzi con cui sono costruiti i composti: non si usano da soli, si modificano lì e cambiano ovunque. Strumento e Divisore della pillola (CMP-10), Giorno del calendario (CMP-12), Filtro e Risultato della ricerca (CMP-13), Campo nome nell'albero e Cestino di trascinamento (CMP-14), Casella della checklist (CMP-20).

### Forma dell'evidenziazione
Tutto ciò che è alto una riga ha la pillola (regola 1). I blocchi su più righe dentro un contenitore (risultati della ricerca, elementi del cestino, righe di impostazione) hanno il rettangolo con `raggio-interno` (12), concentrico al contenitore (20 − 8 di margine): una pillola alta più righe diventerebbe un ovale.

### Superfici su cui compare ogni componente
Ogni componente si verifica su tutte le superfici in cui può comparire, in chiaro e in scuro (regola visiva 11, tabella "Fondi dei controlli sulle superfici" in `tokens.md`). I componenti flottanti hanno la propria superficie, `sfondo-flottante`, e si staccano dal resto con l'ombra.

| Componente | Nota | Colonna | Flottante | Fondi propri |
|---|---|---|---|---|
| CMP-01 Pulsante | ✓ (cestino, impostazioni, stati vuoti) | ✓ (+) | ✓ (finestre di conferma, pannelli) | campo, hover, premuto, pieno |
| CMP-02 Icona | ✓ | ✓ | ✓ | — |
| CMP-03 Campo di testo | ✓ (tag, impostazioni) | ✓ (ricerca) | ✓ (pannelli, menu) | campo |
| CMP-04 Interruttore | ✓ (impostazioni) | | | hover, pieno |
| CMP-05 Tag | ✓ (riga dei tag) | | ✓ (filtri della ricerca) | campo, hover, pieno |
| CMP-06 Riga della colonna | | ✓ | | hover, pieno; numero di note in testo tenue (RB-56) |
| CMP-07 Voce di menu | | | ✓ | hover, errore |
| CMP-08 Suggerimento | ✓ | ✓ | ✓ | pieno (flottante lui stesso) |
| CMP-14 Albero delle cartelle | | ✓ | | hover, pieno, campo, errore (cestino di trascinamento) |
| CMP-17 Elemento del cestino | ✓ | | | hover |
| CMP-18 Riga di impostazione | ✓ | | | hover, campo |
| CMP-19 Stato vuoto | ✓ | ✓ (riga) | ✓ (card dei risultati) | pieno (pulsante) |
| CMP-20 Testo della nota | ✓ | | | pieno (casella spuntata), evidenziazione |
| CMP-21 Immagine nel testo | ✓ | | | campo (segnaposto), pieno (selezione) |
| CMP-09 Menu · CMP-10 Pillola · CMP-11 Pannello · CMP-12 Date picker · CMP-13 Card dei risultati · CMP-15 Avviso · CMP-16 Finestra di conferma | sopra la nota | sopra la colonna | sono la superficie | flottante, con ombra; dentro: hover, pieno, campo |

**Verifica per ogni componente nuovo:** prima di segnarlo come Disegnato, (1) elencare le superfici su cui compare in questa tabella; (2) controllare nella tabella dei token che ogni suo fondo sia sopra la soglia su quelle superfici, in entrambi i modi; (3) controllarlo a occhio nell'anteprima scura, meglio se dentro un menu o un pannello, dove i grigi sono più vicini.

---

## CMP-01 – Pulsante
**Tipo:** base · **Usato in:** SC-01, SC-03, SC-04, SC-06 · **Figma:** [Pulsante](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=20-170)

**Scopo:** far partire un'azione con un clic o con Invio.
**Quando usarlo:** per un'azione esplicita (Ripristina, Svuota cestino, Annulla, +, ···).
**Quando non usarlo:** per andare in un altro punto dell'app da una lista (si usa la riga della colonna, CMP-06) o per un'impostazione acceso/spento (interruttore, CMP-04).

### Varianti e dimensioni
- **Primario:** sfondo `sfondo-pieno`, testo `testo-su-pieno`. L'azione principale della zona, al massimo uno (es. "Svuota" nella finestra di conferma).
- **Secondario:** sfondo `sfondo-campo`, testo `testo-primario`. Azioni di supporto accanto al primario (Annulla).
- **Tenue:** senza sfondo, testo `testo-tenue`. Azioni minori in liste e pannelli (Ripristina nel cestino).
- **Solo icona:** 32 × 32, icona `icona-tenue`. Azioni ripetute con un'icona chiara (+ delle non organizzate, ···).
- Una sola dimensione: alto 32 (`misura-riga`), pillola (`raggio-pillola`), margini laterali 16 (8 per il solo icona), distanza tra icona e testo 8, testo Interfaccia/Media.
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
- **Contrasti:** testo su tutti gli sfondi ≥ 4,5:1, icone ≥ 3:1 (verificati in `tokens.md`); l'area cliccabile del solo icona è 32 × 32.

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
- Primo nucleo: **più** (`plus`), **altro** (`ellipsis`), **caricamento** (`loader-circle`), **cerca** (`search`), **calendario** (`calendar`), **chiudi** (`x`), **errore** (`circle-alert`), **freccia destra** (`chevron-right`), **freccia giù** (`chevron-down`), **titolo** (`heading-1`), **sottotitolo** (`heading-2`), **elenco puntato** (`list`), **elenco numerato** (`list-ordered`), **checklist** (`list-checks`), **immagine** (`image`), **elimina** (`trash-2`), **tag** (`tag`), **sposta** (`folder-input`), **impostazioni** (`settings`), **grassetto** (`bold`), **corsivo** (`italic`), **sottolineato** (`underline`), **barrato** (`strikethrough`), **spunta** (`check`), **freccia sinistra** (`chevron-left`), **cartella** (`folder`), **nota** (`file-text`), **avviso** (`triangle-alert`), **informazione** (`info`), **mostra** (`eye`). Le altre si aggiungono quando servono ai componenti.

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
- ✅ Corretto: `+` accanto a "Non organizzate" con suggerimento "Nuova nota".
- ❌ Scorretto: disegnare un'icona a mano quando Lucide ne ha una equivalente.

---

## CMP-03 – Campo di testo
**Tipo:** base · **Usato in:** SC-01 (ricerca, nome di cartella), SC-03 (date, tag), SC-06 (scorciatoia, nome del dispositivo) · **Figma:** [Campo di testo](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=25-270)

**Scopo:** scrivere una riga di testo: un nome, una data, una ricerca; nel caso della scorciatoia, registrare una combinazione di tasti.
**Quando usarlo:** quando il valore si scrive; con l'icona a destra quando c'è anche un modo alternativo di sceglierlo (il calendario per le date).
**Quando non usarlo:** per il testo della nota (editor, CMP-20), per scegliere tra poche opzioni fisse (interruttore CMP-04 o menu CMP-09), per il nome di una cartella direttamente nell'albero (campo nome, dentro CMP-14).

### Varianti e dimensioni
- **Normale:** solo il testo.
- **Ricerca:** icona cerca a sinistra; quando è compilata compare ✕ per cancellare.
- **Password:** il valore si vede come pallini; l'icona a occhio a destra lo mostra e lo nasconde. Serve al modulo di accesso (CMP-22), progettato ma non attivo (DEC-19).
- **Con icona:** icona a destra (di default il calendario), che apre la scelta alternativa. Proprietà **Icona** per cambiarla.
- **Campo della scorciatoia** (SC-06, RB-52): è un campo normale con testi suoi ("Nessuna scorciatoia", al focus "Premi i tasti…"). Non scrive testo ma registra la prima combinazione premuta, che diventa il valore (es. "Ctrl + Alt + N"). Non è una variante: l'aspetto è lo stesso, cambia solo il comportamento.
- Una sola dimensione: alto 32 (`misura-riga`), pillola, sfondo `sfondo-campo`, margini 12, distanza 8 tra icone e testo, testo Interfaccia/Normale. La larghezza la decide chi lo usa (240 negli esempi).
- Segnaposto in `testo-tenue`, valore in `testo-primario`. Il testo troppo lungo finisce con i puntini.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Vuoto, con il segnaposto |
| Hover | Nessun cambiamento visivo, cambia solo il cursore: scurire il fondo porterebbe il segnaposto sotto 4,5:1 |
| Focus | Anello `focus-anello` di 2 px staccato 2 px e cursore lampeggiante dopo il testo. Si vede anche con il mouse, perché si sta scrivendo lì |
| Compilato | Il valore in `testo-primario` |
| Disabilitato | Tutto il campo a opacità 40% |
| Errore | Anello in `icona-errore` e, sotto il campo, icona errore con il messaggio in `testo-errore` (Interfaccia/Piccola), 8 px sotto l'anello e allineato al testo del campo (12 px dal bordo); un messaggio lungo va a capo. La ricerca non ha errore |
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
**Tipo:** base · **Usato in:** SC-06 (avvio all'accensione, note del cestino nei risultati) · **Figma:** [Interruttore](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=30-296)

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
**Tipo:** base · **Usato in:** SC-03 (riga dei tag della nota), SC-01 (filtri nella card dei risultati) · **Figma:** [Tag](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=31-319)

**Scopo:** mostrare un tag di una nota e permettere di toglierlo, o di usarlo come filtro nella ricerca.
**Quando usarlo:** per i tag della nota aperta e per i filtri per tag della ricerca (FL-04, FL-06).
**Quando non usarlo:** per la cartella di una nota (è un testo nel risultato) o per etichette di stato (si usa l'avviso, CMP-15).

### Varianti e dimensioni
- Pillola alta 24 (`misura-controllo-piccolo`), margini 8, testo Interfaccia/Normale in `testo-primario` su `sfondo-campo`.
- Proprietà **Nome** (il testo del tag) e **Rimovibile** (mostra la ✕ di 12 px per togliere il tag dalla nota). Nei filtri della ricerca la ✕ non c'è.
- Il tag si mostra come scritto dall'utente, senza "#" davanti.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Come sopra |
| Hover | `sfondo-hover`; il testo resta `testo-primario` (regola 7) |
| Focus | Anello `focus-anello` di 2 px staccato 2 px |
| Attivo | Selezionato: filtro attivo nella ricerca, `sfondo-pieno` con testo e ✕ in `testo-su-pieno` e `icona-su-pieno` |
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
- **Cartella chiusa / aperta:** freccia ▸ o ▾ (16 px), nome e, a destra, il numero di note che contiene, sottocartelle comprese (Interfaccia/Piccola in `testo-tenue`; primario in hover, su pieno se selezionata; RB-56, ID-15). Margine 8. Niente icona di cartella: la direzione C tiene la colonna pulita (DEC-12).
- **Sezione aperta / chiusa:** freccia di 12 px, etichetta Interfaccia/Etichetta in `testo-tenue`, il numero di note e il + per creare (nuova nota o nuova cartella). Il numero si mostra per Non organizzate; nel titolo Cartelle si nasconde.
- Alta 32 (`misura-riga`), pillola, distanza 4 tra freccia e testo. Il testo troppo lungo finisce con i puntini.
- **Rientro:** per le sottocartelle si mostra il livello "rientro" e lo si allarga di 16 px per ogni livello.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Senza sfondo, sulla colonna |
| Hover | `sfondo-hover`; tutto il testo passa a `testo-primario`, anche l'etichetta della sezione e il numero (regola 7) |
| Focus | Anello `focus-anello` di 2 px staccato 2 px |
| Attivo | Selezionata: la nota aperta nella colonna, o la cartella attuale (in Sposta in, CMP-11); `sfondo-pieno` con testo Interfaccia/Media in `testo-su-pieno` |
| Trascinamento sopra | Solo cartella: mentre si trascina una nota o una cartella, quella che la riceverebbe ha `sfondo-hover` e un contorno di 1,5 in `icona-tenue` |
| Disabilitato | Non previsto |
| Errore | Non previsto: gli errori di spostamento si mostrano con un avviso (CMP-15) |
| Caricamento | Non previsto: la colonna al primo accesso usa lo stato di caricamento di SC-01 |

### Accessibilità
- **Tastiera:** frecce su e giù per passare da una riga all'altra; freccia destra apre una cartella chiusa, freccia sinistra la chiude; Invio apre la nota o chiude e riapre la sezione. Il + è un pulsante raggiungibile con Tab.
- **Lettori di schermo:** la colonna è un albero: le cartelle hanno lo stato aperta o chiusa e il livello; la nota aperta è "selezionata". Il + ha un nome ("Nuova nota", "Nuova cartella").
- **Contrasti:** testo primario ≥ 12,49:1 su colonna e hover; etichetta della sezione in `testo-tenue` su `sfondo-colonna` 4,99:1 in chiaro e 6,53:1 in scuro; frecce e contorno del trascinamento ≥ 3:1.

### Esempi
- ✅ Corretto: "Lavoro" con la freccia ▾ e, sotto, "Clienti" con 16 px di rientro.
- ❌ Scorretto: usare il grigio tenue per il titolo di una nota in hover.

---

## CMP-07 – Voce di menu
**Tipo:** base · **Usato in:** menu `···`, menu del tasto destro, menu di inserimento con `/`, suggerimenti dei tag (tutti in CMP-09) · **Figma:** [Voce di menu](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=39-502)

**Scopo:** una scelta dentro un menu.
**Quando usarlo:** solo dentro un menu (CMP-09).
**Quando non usarlo:** fuori da un menu: nella colonna si usa la riga della colonna (CMP-06), in una schermata un pulsante (CMP-01).

### Varianti e dimensioni
- **Normale:** etichetta Interfaccia/Normale in `testo-primario`, su `sfondo-flottante`.
- **Distruttiva:** per le azioni che eliminano (Elimina, Svuota cestino), in `testo-errore` e `icona-errore`. È l'unico uso del colore di uno stato per un'azione: avvisa che non si torna indietro (DEC-14). L'azione chiede comunque conferma (CMP-16).
- **Separatore:** linea di 1 px in `bordo-divisore-tenue`, alta 9 in tutto, tra gruppi di voci, da lato a lato del menu (regola 4: le linee solo dove servono).
- La voce è larga quanto il menu (236 negli esempi) con 8 px di margine trasparente ai lati; dentro c'è la pillola alta 32 (`misura-riga`) con il testo a 12 px dal bordo, come le note nella colonna. Distanza 8 tra icona, testo e scorciatoia.
- Proprietà: **Etichetta**, **Mostra icona** + **Icona** (Lucide 16), **Mostra scorciatoia** + **Scorciatoia** (Interfaccia/Piccola in `testo-tenue`, es. "Ctrl + B"), **Sottomenu** (freccia a destra).

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
- ✅ Corretto: nel menu della nota, un separatore e poi "Elimina" in rosso come ultima voce.
- ❌ Scorretto: mettere in rosso un'azione che si annulla (Sposta in) o usare l'icona "+" come decorazione su ogni voce.

---

## CMP-08 – Suggerimento
**Tipo:** base · **Usato in:** tutte le schermate, sui pulsanti solo icona e sulle icone senza etichetta · **Figma:** [Suggerimento](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=40-542)

**Scopo:** dire cosa fa un controllo che mostra solo un'icona.
**Quando usarlo:** sempre sui pulsanti solo icona (+, ···, ✕), con lo stesso testo del nome accessibile; se l'azione ha una scorciatoia, la si aggiunge al testo ("Nuova nota · Ctrl + Alt + N").
**Quando non usarlo:** per spiegazioni lunghe o informazioni necessarie (vanno nel testo della schermata) e sui controlli che hanno già un'etichetta.

### Varianti e dimensioni
- Una sola: pillola alta 24 (`misura-controllo-piccolo`), margini 8, testo Interfaccia/Piccola in `testo-su-pieno` su `sfondo-pieno`, `ombra-flottante`, livello 20 (`z-comparsa`).
- Compare 8 px sopra il controllo, centrata; se non c'è spazio sopra, sotto.
- Proprietà: **Testo**.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Visibile |
| Hover · Focus | Compare quando il mouse si ferma sul controllo o quando il controllo riceve il focus da tastiera; sparisce quando lo si lascia o con Esc |
| Attivo · Disabilitato · Errore · Caricamento | Non previsti: il suggerimento non si clicca |

Compare e sparisce con `movimento-durata-breve` (120 ms). Il ritardo prima della comparsa si fissa in Fase 7.

### Accessibilità
- **Tastiera:** non riceve il focus; Esc lo nasconde senza spostare il focus.
- **Lettori di schermo:** il testo è anche la descrizione del controllo, quindi si legge una volta sola.
- **Contrasti:** 16,48:1 in chiaro e 16,75:1 in scuro.

### Esempi
- ✅ Corretto: "Nuova nota" sopra il + delle non organizzate.
- ❌ Scorretto: un suggerimento su un pulsante che dice già "Nuova nota".

---

## CMP-09 – Menu
**Tipo:** composto (usa CMP-07) · **Usato in:** SC-01 (menu `···`, tasto destro su una cartella), SC-03 (tasto destro sul testo, inserimento con `/`, suggerimenti dei tag) · **Figma:** pagina Componenti composti, [Menu](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=42-982)

**Scopo:** offrire le azioni possibili in quel punto, senza spostarsi (RF-11).
**Quando usarlo:** per più di due azioni legate a un oggetto (la nota, una cartella, il testo selezionato) o per scegliere cosa inserire.
**Quando non usarlo:** per una sola azione (pulsante, CMP-01) o per scegliere una data o una cartella (pannello a comparsa, CMP-11).

### Varianti e dimensioni
- Contenitore `sfondo-flottante`, `raggio-contenitore` (20), margini 8 sopra e sotto e 0 ai lati, `ombra-flottante`, livello 20 (`z-comparsa`). Largo 236 negli esempi; si allarga fino alla voce più lunga.
- La pillola dell'evidenziazione sta a 8 px dai lati (margine della voce); i divisori vanno da lato a lato e sono leggeri (`bordo-divisore-tenue`). Scelta tra sei alternative (divisori rientrati o da lato a lato, pieni o leggeri; margine 8 o 12; pillola, rettangolo con raggio 12 o fascia a tutta larghezza): la pillola resta per coerenza con colonna, pulsanti e tag.
- **Nota** (`···`): Tag…, Date…, Sposta in… · Elimina · Cestino, Impostazioni. Senza una nota aperta resta solo l'ultimo gruppo.
- **Cartella** (tasto destro): Nuova nota qui, Nuova sottocartella, Rinomina · Elimina.
- **Testo** (tasto destro): Taglia, Copia, Incolla · Grassetto, Corsivo, Sottolineato, Barrato, con le scorciatoie · Titolo ›, Elenco ›.
- **Inserimento** (`/` su una riga vuota): Titolo, Sottotitolo, Elenco puntato, Elenco numerato, Checklist · Immagine. È l'unico menu con icone: aiutano a riconoscere cosa si inserisce.
- **Tag** (sotto il campo dei tag): i tag che corrispondono a ciò che si scrive, · Crea il tag "…". Il tasto destro su un suggerimento apre "Elimina tag…" (RB-19).
- **Filtro tag** (dalla pillola Tag della ricerca, CMP-13): campo "Cerca un tag", divisore, i tag con la spunta su quelli scelti (si possono sceglierne più d'uno), divisore, "Togli il filtro".
- **Filtro data** (dalle pillole Creazione, Modifica, Fine validità): Qualsiasi data, Oggi, Ultimi 7 giorni, Ultimi 30 giorni, Quest'anno, con la spunta sulla scelta attiva · Scegli le date… (apre il calendario, CMP-12).
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
- **Tastiera:** come in CMP-07. Nel menu di inserimento si continua a scrivere per filtrare le voci (es. "/tit"); nei suggerimenti dei tag le frecce scelgono e Invio conferma.
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
**Quando non usarlo:** come barra permanente, o per azioni sulla nota intera (sono nel menu `···`, CMP-09).

### Varianti e dimensioni
- **Formattazione:** grassetto, corsivo, sottolineato, barrato · titolo, sottotitolo.
- **Inserimento:** titolo, sottotitolo · elenco puntato, elenco numerato, checklist · immagine.
- Pillola su `sfondo-flottante` (bianca in chiaro, scura in scuro), `ombra-flottante`, margini 4, alta 40, livello 20.
- 4 px (`spazio-4`) tra uno strumento e l'altro: passando con il mouse, il cerchio dell'hover non tocca mai quello dello strumento attivo.
- Tra i gruppi, il **divisore della pillola**: linea di 1 px in `bordo-divisore-tenue` a tutta altezza (da bordo a bordo della pillola), con 4 px ai lati. È lo stesso segno leggero dei divisori dei menu. Scelta tra solo spazio, linea corta leggera, linea corta visibile, linea a tutta altezza e puntino.
- **Strumento della pillola:** pulsante tondo 32 × 32 con icona Lucide 16 in `icona-tenue`; proprietà **Icona**.
- Compare 8 px sopra la selezione o il punto del clic, centrata; se non c'è spazio sopra, sotto. Sparisce quando si riprende a scrivere, con Esc o con un clic altrove.
- Inizialmente la pillola era scura (`sfondo-pieno`); è stata invertita perché in mezzo al testo era troppo pesante. Ora parla come menu e colonna: l'unica cosa scura è ciò che è attivo.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Strumento senza sfondo, icona `icona-tenue` |
| Hover | `sfondo-hover` |
| Focus | Anello interno di 2 px in `focus-anello` |
| Attivo | Formato già applicato alla selezione (es. il testo è in grassetto): cerchio `sfondo-pieno` con icona `icona-su-pieno`, come la riga selezionata |
| Disabilitato | Opacità 40% (es. titoli dentro una checklist, se non ammessi) |
| Errore | Non previsto |
| Caricamento | Non previsto |

### Accessibilità
- **Tastiera:** la pillola non ruba il focus mentre si scrive; si raggiunge con una scorciatoia (da fissare in Fase 7) e poi con le frecce sinistra e destra tra gli strumenti; Esc torna al testo. Le scorciatoie di formattazione restano sempre valide (CMP-09).
- **Lettori di schermo:** barra degli strumenti con nome ("Formattazione" o "Inserimento"); ogni strumento è un pulsante con nome e, per la formattazione, stato premuto o non premuto; ogni strumento ha il suggerimento (CMP-08).
- **Contrasti:** icone `icona-tenue` su `sfondo-flottante` 5,49:1 in chiaro e 5,61:1 in scuro, su `sfondo-hover` ≥ 4,16:1; attivo 16,48:1.

### Esempi
- ✅ Corretto: selezionare "spostare" e vedere la pillola sopra la parola con il grassetto già attivo.
- ❌ Scorretto: lasciare la pillola visibile mentre si continua a scrivere.

---

## CMP-11 – Pannello a comparsa
**Tipo:** composto (usa CMP-03 e CMP-07) · **Usato in:** SC-03 (voci Date… e Sposta in… del menu `···`) · **Figma:** pagina Componenti composti, [Pannello a comparsa](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=60-1780)

**Scopo:** modificare un'informazione della nota che ha bisogno di più di una voce di menu: una data, una cartella.
**Quando usarlo:** quando la scelta richiede un campo, una ricerca o un albero, aperto dalla voce con "…" del menu.
**Quando non usarlo:** per una scelta tra poche azioni (menu, CMP-09) o per chiedere conferma (finestra di conferma, CMP-16).

### Varianti e dimensioni
- **Stesso aspetto del menu** (CMP-09), pur restando un componente separato: `sfondo-flottante`, `raggio-contenitore` (20), `ombra-flottante`, livello 20, largo 236, margini 8 sopra e sotto e 0 ai lati, contenuti rientrati di 8 dai lati. Si apre sotto il `···`, allineato a destra.
- **Date** (FL-04): "Data di creazione" e "Fine validità" con etichetta Interfaccia/Etichetta in `testo-tenue` e campo con il calendario (CMP-03, con icona). Etichette e note partono a 12 px, allineate al testo dei campi, come il testo delle voci di menu. Sotto la data di creazione, in Interfaccia/Piccola, quella di sistema, che non cambia (RB-21). Nessun avviso sulle combinazioni di date (RB-20).
- **Sposta in**: campo di ricerca ("Cerca una cartella"), divisore da lato a lato, poi le cartelle come **voci di menu** (CMP-07): la freccia ▸/▾ al posto dell'icona e 16 px di rientro per livello. "Non organizzate" (la radice) lascia vuoto lo spazio della freccia, così i nomi restano allineati. La **cartella attuale** ha la spunta a destra (`check`), non la pillola scura: nel menu la pillola indica l'hover. Eccezione nota ai token: il rientro delle sottocartelle si ottiene allargando il margine della voce (12 + 16 = 28 px per il primo livello), un valore senza token proprio.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Aperto, con i valori attuali |
| Hover · Focus · Errore | Li gestiscono i campi (CMP-03) e le righe (CMP-06) |
| Attivo | Date: la modifica si salva subito (RB-06). Sposta in: il clic su una cartella sposta la nota e chiude il pannello |
| Disabilitato | Non previsto |
| Caricamento | Non previsto: tutto è sulla copia di lavoro |

Si chiude con Esc, con un clic fuori o (Sposta in) scegliendo una cartella. Compare con `movimento-durata-breve` e `movimento-spostamento`.

### Accessibilità
- **Tastiera:** all'apertura il focus va sul primo campo (Date) o sulla ricerca (Sposta in); Tab tra i campi; in Sposta in, scrivendo si filtra l'albero, le frecce scelgono la cartella e Invio sposta. Esc chiude e riporta il focus sul `···`.
- **Lettori di schermo:** finestra non modale con titolo ("Date", "Sposta in"); la cartella attuale è annunciata come "attuale".
- **Contrasti:** etichette in `testo-tenue` su `sfondo-flottante` 5,49:1 in chiaro e 5,61:1 in scuro; campi e voci come in CMP-03 e CMP-07.

### Esempi
- ✅ Corretto: aprire Sposta in e trovare subito la cartella attuale selezionata, già visibile.
- ❌ Scorretto: chiedere conferma per spostare una nota: lo spostamento si annulla spostandola di nuovo.

---

## CMP-12 – Date picker
**Tipo:** composto (con la parte interna "Giorno del calendario"; usa CMP-01 e il separatore di CMP-07) · **Usato in:** SC-03 (pannello Date, CMP-11) · **Figma:** pagina Componenti composti, [Date picker](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=65-763)

**Scopo:** scegliere una data con il mouse, in alternativa a scriverla nel campo.
**Quando usarlo:** si apre dall'icona calendario di un campo data (CMP-03, con icona).
**Quando non usarlo:** da solo, senza campo: la data si può sempre anche scrivere.

### Varianti e dimensioni
- Stesso guscio di menu e pannello: `sfondo-flottante`, `raggio-contenitore` (20), `ombra-flottante`, livello 20, margini 8 sopra e sotto, contenuti rientrati di 8. Largo **240** invece di 236: 7 giorni da 32 px richiedono 224 px di contenuto.
- **Intestazione:** mese e anno (Interfaccia/Media) e due pulsanti solo icona ‹ › (CMP-01) per il mese precedente e successivo.
- **Giorni della settimana:** L M M G V S D, dal lunedì, in Interfaccia/Etichetta `testo-tenue`.
- **Giorni:** sempre 6 righe, così l'altezza non cambia da un mese all'altro. Ogni giorno è un cerchio di 32 × 32 (parte interna "Giorno del calendario").
- **Piede:** separatore da lato a lato, poi i pulsanti tenui "Oggi" e "Nessuna data" (svuota il campo, utile per la fine validità).
- Si apre 8 px sotto il campo, sopra il pannello; se non c'è spazio sotto, sopra.

### Stati (del giorno)
| Stato | Descrizione |
|---|---|
| Default | Numero Interfaccia/Normale in `testo-primario` |
| Altro mese | Giorni del mese prima e dopo in `testo-tenue`; si possono scegliere |
| Oggi | Numero Interfaccia/Media e un puntino di 4 px sotto: non si confonde con focus e selezione |
| Hover | `sfondo-hover` |
| Focus | Anello interno di 2 px in `focus-anello` |
| Attivo | Selezionato: `sfondo-pieno` con numero in `testo-su-pieno` (se è anche oggi, il puntino diventa chiaro) |
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
**Quando usarlo:** sotto il campo di ricerca della colonna, appena si scrive (RB-33).
**Quando non usarlo:** per scegliere una cartella (Sposta in, CMP-11) o per suggerire tag (menu dei tag, CMP-09).

### Varianti e dimensioni
- Stesso guscio del menu: `sfondo-flottante`, raggio 20, ombra, livello 20, margini 8 sopra e sotto, contenuti rientrati di 8. Larga **480**, più della colonna: copre la nota senza velo, perché non blocca niente.
- **Filtri** in cima: Tag, Creazione, Modifica, Fine validità (FL-06). Ognuno è una pillola alta 24 come il tag, con una freccia giù, 8 px tra l'una e l'altra, 12 px sopra e sotto la fila. Apre un menu (CMP-09, filtro tag o filtro data) 8 px sotto la pillola. Attivo: pieno scuro con il valore ("Tag: lavoro"; con più tag, "Tag: 2").
- Divisore da lato a lato, poi i **risultati** per pertinenza (RB-34), tutti, scorrendo la card: titolo (Interfaccia/Media), la frase in cui compare la parola con la parola in `testo-primario` Medium, cartella e data (Interfaccia/Piccola).
- **Nel cestino:** titolo e frase attenuati, etichetta "nel cestino" (RB-29); non compaiono se la preferenza li esclude.
- **Nessun risultato:** filtri, divisore, "Nessuna nota trovata" e un suggerimento; la card resta aperta (RB-35).
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
- **Tastiera:** dal campo, freccia giù entra nei risultati; frecce su e giù tra i risultati, Invio apre, Esc chiude la card e torna al campo; Tab raggiunge i filtri.
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
- Righe CMP-06 su `sfondo-colonna`, larghe 240; 8 px tra le sezioni. Sezione **Non organizzate** con le note e il loro numero (la nota aperta è selezionata), sezione **Cartelle** con l'albero e il numero di note accanto a ogni cartella (RB-56); 16 px di rientro per livello.
- **Nuova cartella:** il campo nome compare sul posto, su `sfondo-campo` con l'anello di focus e il nome "Nuova cartella" già selezionato (RB-48). Invio conferma, Esc annulla.
- **Trascinamento:** la cartella che riceverebbe è evidenziata (CMP-06, trascinamento sopra) e in fondo alla colonna compare il **cestino di trascinamento** (`sfondo-campo`, icona elimina, "Trascina qui per eliminare").
- **Trascinamento sul cestino:** il cestino diventa `sfondo-errore` con testo e icona in `testo-errore` e `icona-errore` ("Rilascia per spostare nel cestino").

### Stati
| Stato | Descrizione |
|---|---|
| Default · Hover · Focus · Attivo | Li gestiscono le righe (CMP-06) |
| Trascinamento | Come sopra; una cartella non si può trascinare dentro sé stessa (RB-24): la riga non si evidenzia |
| Disabilitato · Errore · Caricamento | Non previsti; un nome già esistente apre la finestra con tre scelte (CMP-16, RB-31) |

### Accessibilità
- **Tastiera:** come CMP-06; F2 rinomina la cartella in focus con il campo nome; lo spostamento da tastiera passa da Sposta in (CMP-11), non dal trascinamento.
- **Lettori di schermo:** albero con i livelli; il cestino di trascinamento si annuncia quando compare.
- **Contrasti:** come CMP-06; cestino di trascinamento in `testo-tenue` su `sfondo-campo` 4,61:1 e 4,65:1; sopra, `testo-errore` su `sfondo-errore` 5,48:1 e 5,44:1.

### Esempi
- ✅ Corretto: trascinare una nota su "Clienti" e vedere la cartella evidenziata prima di rilasciare.
- ❌ Scorretto: mostrare il cestino di trascinamento sempre (è ID-18, ancora da valutare).

---

## CMP-15 – Avviso
**Tipo:** composto (usa CMP-01 e CMP-02) · **Usato in:** tutte le schermate, in cima all'area della nota · **Figma:** pagina Componenti composti, [Avviso](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=70-2614)

**Scopo:** dire qualcosa che conta senza bloccare (RB-39, RB-40).
**Quando usarlo:** per i problemi di sincronizzazione e le note in conflitto; resta finché non si vede e, visto su un dispositivo, sparisce da tutti (RB-53).
**Quando non usarlo:** per chiedere conferma (CMP-16) o per confermare un'azione riuscita: il successo di solito non si mostra (RB-40).

### Varianti e dimensioni
- **Errore**, **Avviso**, **Informazione**, **Successo** (DEC-14): fondo `sfondo-<stato>`, icona Lucide 16 in `icona-<stato>` (`circle-alert`, `triangle-alert`, `info`, `check`), testo Interfaccia/Normale in `testo-primario`, azione a pulsante tenue ("Ho capito", "Apri l'altra").
- Largo 480, raggio 20, margini 16 a sinistra e 8 a destra, 8 sopra e sotto, `ombra-flottante`, livello 50, uno alla volta, in cima all'area della nota. Il testo va a capo.
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
- ✅ Corretto: «Non riesco a sincronizzare da 24 ore. Le modifiche restano qui.»
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
- Guscio dei flottanti: `sfondo-flottante`, raggio 20, `ombra-flottante`, largo 400, margini 24. Titolo Interfaccia/Media in `testo-primario`, testo Interfaccia/Normale in `testo-tenue`. Pulsanti a destra, 8 px tra loro.
- Al centro della finestra, livello 40, con il `velo` sul resto; un avviso (livello 50) resta visibile sopra.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Aperta, focus su Annulla |
| Hover · Focus · Attivo · Disabilitato | Li gestiscono i pulsanti |
| Errore · Caricamento | Non previsti |

### Accessibilità
- **Tastiera:** il focus parte da Annulla e resta dentro la finestra; Esc equivale ad Annulla; Invio attiva il pulsante in focus.
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
- **Nota** e **Cartella**: icona Lucide 16 (`file-text` o `folder`) in `icona-tenue`, nome Interfaccia/Media, sotto tipo, provenienza e data di eliminazione (Interfaccia/Piccola, `testo-tenue`; per le cartelle anche il numero di note). A destra Ripristina (pulsante tenue) ed **Elimina definitivamente** (pulsante solo icona con il cestino e il suggerimento "Elimina definitivamente", DEC-17): chiede conferma (CMP-16, RB-55).
- Largo 560, margini 12 a sinistra, 8 a destra, 8 sopra e sotto, su `sfondo-nota`. Blocco su due righe: hover con `raggio-interno`.

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
**Tipo:** composto (usa CMP-03 e CMP-04) · **Usato in:** SC-06 · **Figma:** pagina Componenti composti, [Riga di impostazione](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=74-2255)

**Scopo:** una preferenza, con il suo controllo.
**Quando usarlo:** in SC-06, una riga per impostazione, raggruppate sotto un titolo (Generale, Ricerca, Dispositivo).
**Quando non usarlo:** per azioni (pulsante) o per informazioni non modificabili.

### Varianti e dimensioni
- **Interruttore:** etichetta (Interfaccia/Normale) e descrizione (Interfaccia/Piccola, `testo-tenue`) a sinistra, interruttore (CMP-04) a destra; tutta la riga si clicca.
- **Campo:** come sopra, con un campo (CMP-03, largo 200) a destra, es. la scorciatoia della nota rapida o il nome del dispositivo.
- **Titolo di gruppo:** Interfaccia/Etichetta in `testo-tenue`, alto 32.
- Largo 560, margini 12, 16 tra testo e controllo, su `sfondo-nota`.

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
- ✅ Corretto: "Avvia Memodu all'accensione" con la spiegazione di cosa cambia.
- ❌ Scorretto: un'impostazione che si applica solo dopo "Salva".

---

## CMP-19 – Stato vuoto
**Tipo:** composto (usa CMP-01 e CMP-02) · **Usato in:** SC-01, SC-03, SC-04 · **Figma:** pagina Componenti composti, [Stato vuoto](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=75-2292)

**Scopo:** spiegare perché non c'è niente e cosa fare, al posto di un'area vuota (SF-16).
**Quando usarlo:** nessuna nota aperta, cestino vuoto, nessuna cartella.
**Quando non usarlo:** per la ricerca senza risultati (è nella card, CMP-13) o per gli errori (avviso, CMP-15).

### Varianti e dimensioni
- **Nota:** icona `file-text` 24, «Nessuna nota aperta», spiegazione e il pulsante primario «Nuova nota».
- **Cestino:** icona elimina 24, «Il cestino è vuoto», spiegazione, senza azioni (niente Svuota cestino).
- **Colonna:** una riga Interfaccia/Piccola in `testo-tenue`, «Nessuna cartella. Creane una con +».
- Icona in `icona-tenue`, titolo Interfaccia/Media, testo Interfaccia/Normale in `testo-tenue`, centrati, largo 320, 8 px di distanza.
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
- **Con testo:** titolo (Nota/Titolo), corpo (Nota/Corpo), sottotitolo (Nota/Sottotitolo), checklist, elenco puntato, elenco numerato; 16 px tra i blocchi, 4–8 px tra le voci. Larghezza di lettura 640 (la misura massima definitiva si fissa in Fase 7).
- **Simboli markdown:** in `testo-tenue`, solo sulla riga del cursore (es. `##` davanti al sottotitolo).
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
- **Tastiera:** le scorciatoie di formattazione (CMP-09); Ctrl + Invio spunta la voce della checklist in cui si trova il cursore.
- **Lettori di schermo:** titoli come intestazioni, elenchi come elenchi, voci della checklist come caselle di controllo.
- **Contrasti:** testo primario ≥ 16,48:1 su `sfondo-nota`; simboli e segni in `testo-tenue` 5,49:1 e 7,30:1; voce spuntata 5,49:1.

### Esempi
- ✅ Corretto: il `##` visibile solo sulla riga dove si sta scrivendo.
- ❌ Scorretto: mostrare tutti i simboli markdown della nota.

---

## CMP-21 – Immagine nel testo e area di trascinamento
**Tipo:** composto (usa CMP-02) · **Usato in:** SC-03 · **Figma:** pagina Componenti composti, [Immagine nel testo](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=77-2364) e [Area di trascinamento](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=77-2365)

**Scopo:** mostrare le immagini dentro il testo e accogliere quelle trascinate (RF-03, FL-03).
**Quando usarlo:** nella nota, per le immagini inserite o trascinate.
**Quando non usarlo:** per altri file (fuori dalla prima fase, ID-14).

### Varianti e dimensioni
- **Normale:** blocco con `raggio-contenitore` (20); qui un segnaposto su `sfondo-campo` con l'icona immagine 24 in `icona-tenue`.
- **Selezionata:** contorno 2 px in `sfondo-pieno`, staccato 2 px. Dal tasto destro si aprono le impostazioni (dimensione, allineamento, ritaglio, rotazione, testo alternativo, RB-14); il pannello si disegna con i mockup.
- **In arrivo:** segnaposto con l'icona di caricamento e «Immagine in arrivo» (Interfaccia/Piccola, `testo-tenue`), mentre l'immagine si sincronizza.
- **Rifiutata:** messaggio in linea accanto al punto di inserimento, icona errore e testo in `testo-errore` (RB-11, RB-12), non bloccante.
- **Area di trascinamento:** mentre si trascina un file, tutta l'area della nota si copre di un bordo tratteggiato (`icona-tenue`, `tratto-icona`, raggio 20) con icona, «Rilascia qui l'immagine» (Interfaccia/Media) e «Solo immagini, fino a 25 MB» (Interfaccia/Piccola); livello 30.

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
**Tipo:** composto (usa CMP-01 e CMP-03) · **Usato in:** SC-05 (progettata, non attiva) · **Figma:** pagina Componenti composti, [Modulo di accesso](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE?node-id=86-2910)

**Scopo:** entrare in Memodu con email e password, o creare l'account al primo avvio.
**Quando usarlo:** quando l'accesso verrà attivato (per esempio con il web, ID-19). Nella prima versione non compare: i dispositivi si collegano con le credenziali preimpostate (DEC-13, DEC-19).
**Quando non usarlo:** per cambiare email o password (sezione Account di SC-06, con righe di impostazione).

### Varianti e dimensioni
- **Accesso:** nome Memodu (Nota/Sottotitolo), sottotitolo in `testo-tenue`, campi Email (CMP-03 normale) e Password (CMP-03 password) con etichette Interfaccia/Etichetta, pulsante primario «Accedi» a tutta larghezza.
- **Primo avvio:** stesso modulo, sottotitolo «Crea l'account di questa installazione.» e pulsante «Crea l'account».
- **Errore:** messaggio in linea sopra il pulsante, icona errore e testo `testo-errore` («Email o password non corrette.»).
- Largo 320, 16 px tra i blocchi, al centro di una finestra vuota su `sfondo-nota`.
- I testi sono esempi; le regole dell'accesso (tentativi, requisiti e recupero della password) si decidono quando lo si attiva.

### Stati
| Stato | Descrizione |
|---|---|
| Default | Accesso o primo avvio |
| Hover · Focus | Li gestiscono campi e pulsante |
| Attivo | Accedi: SC-01 in caricamento mentre arriva la copia di lavoro |
| Errore | Credenziali errate: messaggio in linea sopra il pulsante |
| Disabilitato | Non previsto |
| Caricamento | Il pulsante in caricamento (CMP-01) |

### Accessibilità
- **Tastiera:** focus sul campo Email all'apertura; Invio da qualsiasi campo invia il modulo.
- **Lettori di schermo:** il messaggio di errore è collegato ai campi e si annuncia quando compare; il pulsante con l'occhio ha il nome "Mostra la password".
- **Contrasti:** come CMP-01 e CMP-03.

### Esempi
- ✅ Corretto: un solo messaggio per email o password sbagliate, senza dire quale delle due.
- ❌ Scorretto: svuotare il campo Email dopo un errore.

