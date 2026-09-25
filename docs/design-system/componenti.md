# Componenti

<!-- Fase 5 della guida. Copia il blocco per ogni componente. -->

I componenti vivono nel file Figma [Memodu – Design system](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE), che diventa la libreria: pagina **Componenti base** (CMP-01 … CMP-08) e pagina **Componenti composti** (CMP-09 … CMP-21). Ogni componente usa solo token semantici (vedi `tokens.md`) e ha un'anteprima in modo scuro.

| Codice | Componente | Tipo | Stato |
|---|---|---|---|
| CMP-01 | Pulsante | base | Disegnato |
| CMP-02 | Icona | base | Primo nucleo (9 icone, 4 dimensioni) |
| CMP-03 | Campo di testo | base | Disegnato |
| CMP-04 | Interruttore | base | Disegnato |
| CMP-05 | Tag | base | Disegnato |
| CMP-06 | Riga della colonna | base | Disegnato |
| CMP-07 | Voce di menu | base | Da disegnare |
| CMP-08 | Suggerimento | base | Da disegnare |
| CMP-09 | Menu (`···`, tasto destro, inserimento con `/`, suggerimenti dei tag) | composto | Da disegnare |
| CMP-10 | Pillola degli strumenti | composto | Da disegnare |
| CMP-11 | Pannello a comparsa | composto | Da disegnare |
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
- Primo nucleo: **più** (`plus`), **altro** (`ellipsis`), **caricamento** (`loader-circle`), **cerca** (`search`), **calendario** (`calendar`), **chiudi** (`x`), **errore** (`circle-alert`), **freccia destra** (`chevron-right`), **freccia giù** (`chevron-down`). Le altre si aggiungono quando servono ai componenti.

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
- **Contrasti:** segnaposto `testo-tenue` su `sfondo-campo` 4,61:1 in chiaro e 5,61:1 in scuro; messaggio di errore su `sfondo-nota` ≥ 6:1.

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
- **Contrasti:** testo su `sfondo-campo` 13,83:1 in chiaro e 12,87:1 in scuro, su `sfondo-hover` ≥ 9,88:1; la ✕ in `icona-tenue` ≥ 4,16:1.

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
| Attivo | Selezionata (solo nota): la nota aperta, `sfondo-pieno` con testo Interfaccia/Media in `testo-su-pieno` |
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

