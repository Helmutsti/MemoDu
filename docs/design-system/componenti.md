# Componenti

<!-- Fase 5 della guida. Copia il blocco per ogni componente. -->

I componenti vivono nel file Figma [Memodu – Design system](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE), che diventa la libreria: pagina **Componenti base** (CMP-01 … CMP-08) e pagina **Componenti composti** (CMP-09 … CMP-21). Ogni componente usa solo token semantici (vedi `tokens.md`) e ha un'anteprima in modo scuro.

| Codice | Componente | Tipo | Stato |
|---|---|---|---|
| CMP-01 | Pulsante | base | Disegnato |
| CMP-02 | Icona | base | Primo nucleo (3 icone) |
| CMP-03 | Campo di testo | base | Da disegnare |
| CMP-04 | Interruttore | base | Da disegnare |
| CMP-05 | Tag | base | Da disegnare |
| CMP-06 | Riga della colonna | base | Da disegnare |
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
- Libreria **Lucide** (DEC-15), icone di linea. Si usano a 16 px (`misura-icona`) con tratto 1,5 (`tratto-icona`), colore `icona-tenue` o `icona-su-pieno`.
- Ogni icona è un componente `Icona/<nome>` con la fonte Lucide nella descrizione. Si scambiano nei componenti con la proprietà Icona, non con varianti.
- Primo nucleo: **più** (`plus`), **altro** (`ellipsis`), **caricamento** (`loader-circle`). Le altre si aggiungono quando servono ai componenti.

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
