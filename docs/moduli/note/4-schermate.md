# Note – Schermate

<!-- Fasi 4 e 6 della guida. Wireframe e mockup restano nello strumento di design: qui si mettono i link. -->

L'impostazione generale (desktop-first, breakpoint, scala z-index, inventario dei componenti) è in `moduli/interfaccia/4-schermate.md`.

## SC-02 – Nota rapida
**Flussi:** FL-01 · **Componenti:** editor markdown, stato vuoto

- **Wireframe:** [finestra singola](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=2-2) · [più finestre a cascata](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=2-14)
- **Esportazioni:** `immagini/SC-02.png`, `immagini/SC-02-cascata.png`
- **Mockup:** [Fase 6]

Finestra di sistema, solo su desktop (RF-01). Niente cromatura dell'applicazione: nessuna colonna, nessun albero, nessuna ricerca. Compare entro 0,2 s (RNF-01), già pronta alla scrittura, con il cursore nel testo.

### Ingombri e contenuto
| Elemento | Nota |
|---|---|
| Area di scrittura | Occupa quasi tutta la finestra. Nessun campo titolo: il titolo si mette dopo, nel programma completo (RB-15) |
| **Apri nel programma** | Testo tenue in basso a destra. Salva e chiude la nota aperta nel programma, e ci porta questa (RB-05) |
| Chiusura (✕ tenue in alto a destra, `Esc`, clic altrove) | Salva e chiude (RB-02). Nessun pulsante Salva e chiudi: sarebbe un doppione. In basso a sinistra un suggerimento tenue: "Esc per chiudere" |

**Nessuna cornice:** niente barra del titolo, niente divisori, niente bordo. La finestra è una superficie bianca con ombra. Si trascina dalla fascia in alto, che non si vede; ✕ e azioni sono tenui e si scuriscono al passaggio del mouse.

Dimensione iniziale piccola (circa un quarto di schermo), ridimensionabile. Resta in primo piano rispetto agli altri programmi finché non si chiude.

### Più note rapide aperte insieme (SF-04) — rinvio risolto
Ogni finestra è indipendente e si chiude per conto suo (RB-02, RB-04). Le finestre si dispongono **a cascata**: ognuna compare spostata di circa 32 px verso destra e verso il basso rispetto all'ultima aperta, sullo schermo dove si trova il puntatore. Arrivata al bordo dello schermo, la cascata riparte dalla posizione iniziale. Nessun affiancamento automatico e nessun limite al numero di finestre: chi ne apre molte le sposta a mano.

### Scorciatoia globale di default (EN-07) — rinvio risolto
| Sistema | Combinazione |
|---|---|
| Windows | `Ctrl + Alt + N` |
| macOS | `Control + Option + N` |

Stessi tasti fisici sui due sistemi, libere nelle configurazioni di default di entrambi. Restano modificabili dalle impostazioni, proprio perché il conflitto con un altro programma non si può escludere (RF-11).

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | Finestra appena aperta, nessun testo | Invito alla scrittura nell'area vuota; testo definitivo in Fase 6 |
| Caricamento | Non previsto: la finestra compare già pronta (RNF-01) | — |
| Errore | Non previsto: la nota rapida non dipende dalla rete (SF-08) | — |
| Successo | Non previsto: la chiusura è la conferma. Chiusa vuota, non crea nulla e non lo dice (RB-03) | — |
| Contenuto lungo | Il testo scorre dentro la finestra, che non cresce da sola | — |

### Messaggi di errore
| Sfiga | Testo definitivo |
|---|---|
| — | Nessun messaggio previsto in questa schermata |

---

## SC-03 – Schermata di scrittura
**Flussi:** FL-02 · FL-03 · FL-04 · FL-09 · **Componenti:** campo titolo, editor markdown, pillola degli strumenti, menu di inserimento, menu della nota, menu del tasto destro, immagine inline, stato vuoto

- **Wireframe:** [immagine selezionata](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=2-36) · [nota nuova vuota](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=2-66) · [testo selezionato e riga vuota](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=15-96) · [clic sul vuoto](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=15-180)
- **Esportazioni:** `immagini/SC-03.png`, `immagini/SC-03-vuoto.png`, `immagini/SC-03-selezione.png`, `immagini/SC-03-pillola.png`
- **Mockup:** [Fase 6]

È l'area della nota dentro `SC-01`. Nessun pulsante Salva: ogni modifica si salva da sola dopo una pausa di scrittura (RB-06), e non c'è nessun indicatore permanente di salvataggio — sarebbe rumore su un'azione che non fallisce sul dispositivo.

### Zone e gerarchia
| Ordine di lettura | Zona | Contenuto |
|---|---|---|
| 1 | Corpo della nota | Testo formattato mentre si scrive; i simboli markdown si vedono solo sulla riga del cursore (RF-02) |
| 2 | Campo titolo | In cima, stessa larghezza del testo, più grande. Può restare vuoto (RB-15) |
| 3 | Strumenti di formattazione | Nessuna barra fissa: compaiono solo quando servono (livello 20), vedi sotto |
| 4 | Menu `···` | In alto a destra: sopra tag, date, sposta, elimina (FL-04); sotto le voci del programma. Dettaglio in `interfaccia/4-schermate.md` |

### Scrittura, tasto destro e immagini (FL-02, FL-03)
- **Wireframe:** [tasto destro sul testo](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=30-67) · [simboli markdown sulla riga del cursore](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=30-144) · [trascinamento di un'immagine](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=30-244)
- **Esportazioni:** `immagini/SC-03-tasto-destro.png`, `immagini/SC-03-markdown.png`, `immagini/SC-03-trascinamento.png`

| Cosa | Come |
|---|---|
| Tasto destro sul testo | Taglia, Copia, Incolla; poi grassetto, corsivo, sottolineato, barrato con le scorciatoie accanto; poi Titolo ▸ ed Elenco ▸ (RF-11) |
| Simboli markdown | Si vedono in grigio solo sulla riga del cursore (es. `## ` davanti a un titolo); sulle altre righe il testo è solo formattato (RF-02) |
| Trascinamento di un'immagine | Tutta l'area della nota si copre di un bordo tratteggiato con "Rilascia qui l'immagine" e i limiti (solo immagini, fino a 25 MB). File non validi: messaggio in linea (RB-11, RB-12) |

### Metadati (FL-04)
- **Wireframe:** [tag con suggerimenti](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=27-39) · [tasto destro su un tag](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=27-105) · [conferma eliminazione tag](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=27-175) · [date](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=27-238) · [sposta in](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=27-291)
- **Esportazioni:** `immagini/SC-03-tag.png`, `immagini/SC-03-tag-tasto-destro.png`, `immagini/SC-03-tag-elimina.png`, `immagini/SC-03-date.png`, `immagini/SC-03-sposta.png`

| Cosa | Dove | Come |
|---|---|---|
| Tag | Nella riga sotto il titolo | I tag diventano modificabili: × per toglierli, un campo per aggiungerne con i suggerimenti sotto (livello 20) e "Crea il tag «…»" per uno nuovo (RB-17, RB-18, RB-22). "Tag…" nel menu `···` porta il cursore nel campo |
| Eliminare un tag del tutto | Tasto destro su un suggerimento | "Elimina tag…", poi finestra di conferma con il numero di note coinvolte (RB-19) |
| Date | Pannello sotto il `···` (livello 20) | Data di creazione scelta e fine validità, con calendario. Sotto la data di creazione compare quella di sistema, che non cambia (RB-21). Nessun avviso sulle combinazioni (RB-20) |
| Sposta in | Pannello sotto il `···` (livello 20) | Campo per cercare una cartella, poi la radice e l'albero; la cartella attuale è evidenziata. Clic su una cartella: la nota si sposta e il pannello si chiude |

Il calendario è un componente (date picker) che si disegna in Fase 5.

### Strumenti di formattazione
Nessuna barra fissa sopra il testo. Una sola **pillola degli strumenti** compare solo quando serve, **sopra il punto dell'evento** (la selezione o il punto del clic), e cambia contenuto in base al contesto:

| Situazione | Contenuto della pillola |
|---|---|
| Testo selezionato | Formattazione: grassetto, corsivo, sottolineato, barrato, titoli |
| Clic sul vuoto, senza selezione | Inserimento: titoli, elenchi, checklist, immagine |

La pillola sparisce quando si riprende a scrivere. In più, `/` su una riga vuota apre il menu di inserimento.

Restano sempre le scorciatoie da tastiera, la sintassi markdown (RF-02) e il menu del tasto destro (RF-11). Niente + a margine.

Il testo ha una larghezza massima di lettura anche su schermi larghi: oltre una certa misura le righe diventano difficili da seguire. Lo spazio restante resta vuoto.

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto (nessuna nota aperta) | Primo utilizzo o nota appena eliminata: invito a scrivere più pulsante per creare la prima nota | Testo definitivo in Fase 6 |
| Vuoto (nota nuova) | Nota creata e ancora senza testo: titolo e corpo vuoti con il loro invito. La nota esiste già e resta (RB-10) | Testo definitivo in Fase 6 |
| Caricamento | Non previsto: la nota arriva dalla copia di lavoro sul dispositivo | — |
| Errore | Immagine rifiutata: messaggio accanto al punto di inserimento, non bloccante (RB-11, RB-12) | Testo definitivo in Fase 6 |
| Successo | Non previsto: il salvataggio è silenzioso (RB-06) | — |
| Contenuto parziale | Immagine in arrivo da un altro dispositivo non ancora sincronizzata: segnaposto tratteggiato al suo posto ([wireframe](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=32-103), `immagini/SC-03-immagine-in-arrivo.png`) | Testo definitivo in Fase 6 |
| Contenuto lungo | Nota molto lunga: scorre il solo corpo, il titolo resta fisso | — |
| Immagine selezionata | Maniglie sull'immagine e pannello impostazioni (dimensione, allineamento, ritaglio, rotazione, testo alternativo) al livello 20 | — |
| Nota in conflitto | Nota nata da un conflitto (DEC-06): stesso titolo seguito da "(copia in conflitto)", nella stessa cartella; all'arrivo compare un avviso con il collegamento (RB-39) ([wireframe](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=32-147), `immagini/SC-03-conflitto.png`) | Testo definitivo in Fase 6 |

### Messaggi di errore
| Sfiga | Testo definitivo |
|---|---|
| SF-21 File non immagine o corrotto | Fase 6 (RB-11) |
| SF-17 Immagine oltre 25 MB | Fase 6 (RB-12) |
