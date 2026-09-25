# Componenti

<!-- Fase 5 della guida. Copia il blocco per ogni componente. -->

I componenti vivono nel file Figma [Memodu – Design system](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE), che diventa la libreria: pagina **Componenti base** (CMP-01 … CMP-08) e pagina **Componenti composti** (CMP-09 … CMP-21). Ogni componente usa solo token semantici (vedi `tokens.md`) e ha un'anteprima in modo scuro.

| Codice | Componente | Tipo | Stato |
|---|---|---|---|
| CMP-01 | Pulsante | base | Disegnato |
| CMP-02 | Icona | base | 24 icone, 4 dimensioni |
| CMP-03 | Campo di testo | base | Disegnato |
| CMP-04 | Interruttore | base | Disegnato |
| CMP-05 | Tag | base | Disegnato |
| CMP-06 | Riga della colonna | base | Disegnato |
| CMP-07 | Voce di menu | base | Disegnato |
| CMP-08 | Suggerimento | base | Disegnato |
| CMP-09 | Menu (`···`, tasto destro, inserimento con `/`, suggerimenti dei tag) | composto | Disegnato |
| CMP-10 | Pillola degli strumenti | composto | Disegnato |
| CMP-11 | Pannello a comparsa | composto | Disegnato |
| CMP-12 | Date picker | composto | Da disegnare |
| CMP-13 | Ricerca con card dei risultati e filtri | composto | Da disegnare |
| CMP-14 | Albero delle cartelle | composto | Da disegnare |
| CMP-15 | Avviso | composto | Da disegnare |
| CMP-16 | Finestra di conferma | composto | Da disegnare |
| CMP-17 | Elemento del cestino | composto | Da disegnare |
| CMP-18 | Riga di impostazione | composto | Da disegnare |
| CMP-19 | Stato vuoto | composto | Da disegnare |
| CMP-20 | Testo della nota (campo titolo e stili dell'editor) | composto | Da disegnare |
| CMP-21 | Immagine nel testo e area di trascinamento | composto | Da disegnare |

L'icona nell'area di notifica (Windows) o nella barra dei menu (macOS) è un'icona di sistema e non è un componente.

### Superfici su cui compare ogni componente
Ogni componente si verifica su tutte le superfici in cui può comparire, in chiaro e in scuro (regola visiva 11, tabella "Fondi dei controlli sulle superfici" in `tokens.md`). I componenti flottanti hanno la propria superficie, `sfondo-flottante`, e si staccano dal resto con l'ombra.

| Componente | Nota | Colonna | Flottante | Fondi propri |
|---|---|---|---|---|
| CMP-01 Pulsante | ✓ (cestino, impostazioni, stati vuoti) | ✓ (+) | ✓ (finestre di conferma, pannelli) | campo, hover, premuto, pieno |
| CMP-02 Icona | ✓ | ✓ | ✓ | — |
| CMP-03 Campo di testo | ✓ (tag, impostazioni) | ✓ (ricerca) | ✓ (pannelli, menu) | campo |
| CMP-04 Interruttore | ✓ (impostazioni) | | | hover, pieno |
| CMP-05 Tag | ✓ (riga dei tag) | | ✓ (filtri della ricerca) | campo, hover, pieno |
| CMP-06 Riga della colonna | | ✓ | | hover, pieno |
| CMP-07 Voce di menu | | | ✓ | hover, errore |
| CMP-08 Suggerimento | ✓ | ✓ | ✓ | pieno (flottante lui stesso) |
| CMP-09 Menu · CMP-10 Pillola · CMP-11 Pannello | sopra la nota | sopra la colonna | sono la superficie | flottante, con ombra |

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
- Primo nucleo: **più** (`plus`), **altro** (`ellipsis`), **caricamento** (`loader-circle`), **cerca** (`search`), **calendario** (`calendar`), **chiudi** (`x`), **errore** (`circle-alert`), **freccia destra** (`chevron-right`), **freccia giù** (`chevron-down`), **titolo** (`heading-1`), **sottotitolo** (`heading-2`), **elenco puntato** (`list`), **elenco numerato** (`list-ordered`), **checklist** (`list-checks`), **immagine** (`image`), **elimina** (`trash-2`), **tag** (`tag`), **sposta** (`folder-input`), **impostazioni** (`settings`), **grassetto** (`bold`), **corsivo** (`italic`), **sottolineato** (`underline`), **barrato** (`strikethrough`), **spunta** (`check`). Le altre si aggiungono quando servono ai componenti.

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
- **Cartella chiusa / aperta:** freccia ▸ o ▾ (16 px) e nome, margine 8. Niente icona di cartella: la direzione C tiene la colonna pulita (DEC-12).
- **Sezione aperta / chiusa:** freccia di 12 px, etichetta Interfaccia/Etichetta in `testo-tenue`, il + per creare (nuova nota o nuova cartella) e, da chiusa, il numero di elementi.
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
- **Contrasti:** testo su `sfondo-flottante` ≥ 12,87:1; scorciatoia in `testo-tenue` 5,49:1 in chiaro e 5,61:1 in scuro; distruttiva 6,06:1 (chiaro) e 5,19:1 (scuro), evidenziata su `sfondo-errore` 5,48:1 e 6,86:1.

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
- **Sposta in**: campo di ricerca ("Cerca una cartella"), divisore da lato a lato, poi le cartelle come **voci di menu** (CMP-07): la freccia ▸/▾ al posto dell'icona e 16 px di rientro per livello. "Non organizzate" (la radice) lascia vuoto lo spazio della freccia, così i nomi restano allineati. La **cartella attuale** ha la spunta a destra (`check`), non la pillola scura: nel menu la pillola indica l'hover.

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

