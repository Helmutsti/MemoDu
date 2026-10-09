# Note – Schermate

<!-- Fasi 4 e 6 della guida. Wireframe e mockup restano nello strumento di design: qui si mettono i link. -->

L'impostazione generale (desktop-first, breakpoint, scala z-index, inventario dei componenti) è in `moduli/interfaccia/4-schermate.md`.

## SC-02 – Nota rapida
**Flussi:** FL-01 · FL-02 · **Componenti:** CMP-23 Nota rapida (con CMP-01, CMP-09, CMP-20, CMP-10 Bollicina del formato)

- **Wireframe:** [finestra singola](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=2-2) · [più finestre a cascata](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=2-14)
- **Esportazioni:** `immagini/SC-02.png`, `immagini/SC-02-cascata.png`
- **Mockup (frammento Must A, approvati da Manuel Cucca il 27/09/2026):** [vuota](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=20-316) · [con testo](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=20-346) · [più note a cascata](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=20-371)
- **Esportazioni mockup:** `immagini/SC-02-mockup.png`, `immagini/SC-02-testo-mockup.png`, `immagini/SC-02-cascata-mockup.png`, esportate di nuovo il 09/10/2026 con la bollicina del formato (CMP-23 aggiornato, DEC-131)
- **Mockup della bollicina (DEC-131, approvati da Manuel Cucca il 09/10/2026):** [cassetto aperto](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=242-3104): nella nota rapida il cassetto si apre verso destra, su due righe verso l'alto, con Testo normale evidenziato; la nota rapida vuota e quella con testo mostrano la bollicina chiusa con T; esportazione `immagini/SC-02-cassetto-mockup.png`

Finestra di sistema, solo su desktop (RF-01). Niente cromatura dell'applicazione: nessuna colonna, nessun albero, nessuna ricerca. Compare entro 0,2 s (RNF-01), già pronta alla scrittura, con il cursore nel testo.

### Ingombri e contenuto
| Elemento | Nota |
|---|---|
| Area di scrittura | Occupa quasi tutta la finestra; un clic nel vuoto porta il cursore nel testo (DEC-66). Nessun campo titolo: il titolo si mette dopo, nel programma completo (RB-15) |
| **Bollicina del formato** (DEC-131) | A sinistra nella fascia in basso, sulla stessa linea di Chiudi: la nota rapida nasce in Markdown (DEC-130), quindi la bollicina c'è sempre. Il cassetto si apre verso destra fino a Chiudi; se non ci sta su una riga, va su due, verso l'alto (vedi SC-03, «Bollicina del formato») |
| **Chiudi** | Pulsante primario diviso in basso a destra (CMP-01, variante Diviso), l'unico della finestra, con accanto all'etichetta le icone della scorciatoia ⇧ ↵ (Maiusc + Invio, DEC-65). Salva e chiude, come il tasto `Esc`; un clic altrove salva ma non chiude (RB-02, DEC-53); la freccia ▾ apre un menu con **Apri nel programma**, che salva e chiude la nota aperta nel programma, e ci porta questa (RB-05). Esc vuol dire «ho finito», non annulla: per cancellare una nota rapida si entra nel programma. Nessuna ✕ (DEC-34, DEC-50) |

**Nessuna cornice:** niente barra del titolo, niente divisori, niente bordo. La finestra è una superficie bianca con ombra. Si trascina dal margine in alto, che non si vede.

Dimensione iniziale 480 × 320, ridimensionabile. La finestra è il componente composto CMP-23 Nota rapida del design system, costruito con token (`sfondo-nota`, `raggio-contenitore`, `spazio-finestra`, `ombra-flottante`), un pulsante diviso per Chiudi e un menu (CMP-09) con la sola voce Apri nel programma. Nell'app la finestra ha angoli squadrati e l'ombra del sistema: arrotondarli richiederebbe l'API privata di macOS (scostamento accettato da Manuel Cucca il 28/09/2026).

Icona nella barra dei menu (macOS) o nell'area di notifica (Windows), con il menu «Nuova nota rapida», «Apri Memodu», «Esci da Memodu». Chiudendo la finestra principale Memodu resta attivo: la finestra si nasconde e torna da «Apri Memodu» (RF-01). Resta in primo piano rispetto agli altri programmi finché non si chiude.

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
| Vuoto | Finestra appena aperta, nessun testo | "Scrivi qui…" nell'area vuota; in basso "Chiudi" |
| Caricamento | Non previsto: la finestra compare già pronta (RNF-01) | — |
| Errore | L'API delle note non risponde o non salva: SC-07 al posto del contenuto, il testo resta in memoria e chiudendo compare la conferma (RB-61, RB-62) (superato da DEC-85; da riscrivere con i testi definitivi di SC-07) | Vedi SC-07 |
| Successo | Non previsto: la chiusura è la conferma. Chiusa vuota, non crea nulla e non lo dice (RB-03) | — |
| Contenuto lungo | Il testo scorre dentro la finestra, che non cresce da sola | — |

### Messaggi di errore
| Sfiga | Testo definitivo |
|---|---|
| — | Nessun messaggio previsto in questa schermata |

---

## SC-03 – Schermata di scrittura
**Flussi:** FL-02 · FL-03 · FL-04 · FL-09 · **Componenti:** percorso (CMP-26), editor markdown (CMP-20), bollicina del formato (CMP-10, DEC-131), menu di inserimento (sospeso), Info (CMP-24), menu del tasto destro (sospeso), immagine inline, stato vuoto

- **Wireframe:** [immagine selezionata](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=2-36) · [nota nuova vuota](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=2-66) · [testo selezionato e riga vuota](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=15-96) · [clic sul vuoto](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=15-180)
- **Esportazioni:** `immagini/SC-03.png`, `immagini/SC-03-vuoto.png`, `immagini/SC-03-selezione.png`, `immagini/SC-03-pillola.png`
- **Mockup (frammento Must A, approvati da Manuel Cucca il 27/09/2026):** [nota nuova vuota](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=18-311) · [simboli markdown sulla riga del cursore](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=18-322) · [testo selezionato con la pillola di formattazione](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=18-333) · [clic sul vuoto con la pillola di inserimento](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=18-344) · [menu `/`](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=18-355) · [tasto destro sul testo](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=18-366)
- **Esportazioni mockup:** `immagini/SC-03-vuoto-mockup.png`, `immagini/SC-03-markdown-mockup.png`, `immagini/SC-03-selezione-mockup.png`, `immagini/SC-03-pillola-mockup.png`, `immagini/SC-03-inserimento-mockup.png`, `immagini/SC-03-tasto-destro-mockup.png`
- **Perimetro del frammento Must A:** si disegnano solo le parti di RF-01 e RF-02: scrittura, titolo, simboli markdown, pillola di formattazione e di inserimento (senza la voce Immagine), menu `/`, tasto destro, stati vuoti. Immagini, metadati e nota in conflitto si disegnano con il frammento Must

È l'area della nota dentro `SC-01`. Nessun pulsante Salva: ogni modifica si salva da sola dopo una pausa di scrittura (RB-06), e non c'è nessun indicatore permanente di salvataggio — sarebbe rumore su un'azione che non fallisce sul dispositivo.

### Zone e gerarchia
| Ordine di lettura | Zona | Contenuto |
|---|---|---|
| 1 | Corpo della nota | Testo formattato mentre si scrive; in vista Markdown i simboli markdown non si vedono mai, nemmeno sulla riga del cursore (RF-02, DEC-58); in vista Testo sono caratteri normali (DEC-130). Testo allineato a sinistra con spazi discreti; barra di scorrimento sottile e a scomparsa, che non occupa spazio (DEC-58). Un clic in un punto vuoto del foglio porta il cursore nel testo più vicino (DEC-66) |
| 2 | Percorso con il titolo (DEC-71) | Al centro della fascia in alto: le cartelle che contengono la nota e il titolo (CMP-26). Un clic sul titolo apre Info (CMP-24) sotto di lui, dove il titolo si modifica; può restare vuoto e allora si legge «Senza titolo» (RB-15). Passando sul titolo non compare niente (DEC-96). Nel foglio non c'è più il campo titolo |
| 3 | Bollicina del formato | Solo in vista Markdown: in basso a destra del foglio, galleggiante (livello 20), con il formato dove sta il cursore; nessuna barra fissa (DEC-131), vedi sotto |

### Scrittura, tasto destro e immagini (FL-02, FL-03)
- **Wireframe:** [tasto destro sul testo](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=30-67) · [simboli markdown sulla riga del cursore](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=30-144) · [trascinamento di un'immagine](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=30-244)
- **Esportazioni:** `immagini/SC-03-tasto-destro.png`, `immagini/SC-03-markdown.png`, `immagini/SC-03-trascinamento.png`

| Cosa | Come |
|---|---|
| Tasto destro sul testo | Taglia, Copia, Incolla; poi grassetto, corsivo, sottolineato, barrato con le scorciatoie accanto; poi Titolo ▸ ed Elenco ▸ (RF-11). Sospeso con DEC-64: per ora il tasto destro apre il menu del sistema |
| Simboli markdown | In vista Markdown non si vedono mai: si scrivono (es. `## ` davanti a un titolo) e spariscono appena riconosciuti; le frecce li saltano e la scrittura segue Word (RF-02, DEC-58, DEC-130). In vista Testo sono caratteri normali |
| Trascinamento di un'immagine | Tutta l'area della nota si copre di un bordo tratteggiato con "Rilascia qui l'immagine" e i limiti (solo immagini, fino a 25 MB). File non validi: messaggio in linea (RB-11, RB-12) |

### Metadati (FL-04)
- **Wireframe:** [tag con suggerimenti](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=27-39) · [tasto destro su un tag](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=27-105) · [conferma eliminazione tag](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=27-175) · [date](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=27-238) · [sposta in](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=27-291)
- **Esportazioni:** `immagini/SC-03-tag.png`, `immagini/SC-03-tag-tasto-destro.png`, `immagini/SC-03-tag-elimina.png`, `immagini/SC-03-date.png`, `immagini/SC-03-sposta.png`
- **Mockup (frammento Must C, approvati da Manuel Cucca il 29/09/2026, superati da DEC-44 per la modifica dei tag):** [con tag](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=50-3033) · [senza tag](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=51-4255) · [menu ··· con Tag…](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=51-4396) · [aggiungere un tag](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=51-4478) · [tasto destro su un suggerimento](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=51-4694) · [conferma di eliminazione](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=51-4966); esportazioni `immagini/SC-03-tag-mockup.png`, `immagini/SC-03-senza-tag-mockup.png`, `immagini/SC-03-menu-tag-mockup.png`, `immagini/SC-03-tag-aggiungi-mockup.png`, `immagini/SC-03-tag-tasto-destro-mockup.png`, `immagini/SC-03-tag-elimina-mockup.png`. Testi della conferma ripresi dal wireframe e approvati con i mockup. Il campo per aggiungere un tag è il campo di testo (CMP-03, alto 32) accanto ai tag alti 24: approvato così
- **Mockup della finestra Info (frammento Must C, DEC-44, approvati da Manuel Cucca il 29/09/2026):** [nota con tag in sola lettura](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=60-3520) · [menu ··· con Info](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=60-3665) · [tasto destro sulla nota](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=60-3785) · [finestra Info](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=60-3866) · [suggerimenti dei tag](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=60-5139) · [calendario](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=60-5262) · [tasto destro su un suggerimento](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=60-5473) · [conferma di eliminazione](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=60-5670); esportazioni `immagini/SC-03-dettagli-nota-mockup.png`, `immagini/SC-03-dettagli-menu-mockup.png`, `immagini/SC-01-dettagli-tasto-destro-mockup.png`, `immagini/SC-03-dettagli-mockup.png`, `immagini/SC-03-dettagli-suggerimenti-mockup.png`, `immagini/SC-03-dettagli-calendario-mockup.png`, `immagini/SC-03-dettagli-tasto-destro-tag-mockup.png`, `immagini/SC-03-dettagli-elimina-tag-mockup.png`
- **Superati da DEC-96 (01/10/2026):** i mockup del menu `···` della nota, della finestra Info aperta dal `···`, della comparsa dei metadati e del titolo che si modifica nel percorso: Info si apre con un clic sul titolo, sotto di lui (CMP-24). Restano nel file come storia, con «SUPERATO (DEC-96)» nella didascalia, finché non si ridisegnano; il tasto destro sulla nota resta valido, con «Info». Esportazioni aggiornate il 01/10/2026 dopo la pubblicazione della libreria
- **Mockup di Info (DEC-96, approvati da Manuel Cucca il 01/10/2026):** [Info sotto il titolo](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=151-5987) · [calendario](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=151-6343) · [suggerimenti dei tag](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=151-6714) · [nota senza titolo](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=151-6972) · [tasto destro sulla nota](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=60-3785) · [Info dal tasto destro](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=153-2336) (in SC-01); esportazioni `immagini/SC-03-info-*-mockup.png` e `immagini/SC-01-dettagli-tasto-destro-mockup.png`. Info si apre con un clic sul titolo e il titolo è in hover; il cursore è nel campo del titolo senza l'anello, che si vede solo con la tastiera (DEC-74). Il `···` è tolto da tutti i mockup validi
- **Mockup della vista (DEC-130, approvati da Manuel Cucca il 08/10/2026):** [nota in vista Markdown con Info](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=218-16566): simboli mai visibili e la riga Vista con Markdown scelto. I mockup di Info qui sopra e quello di Info dal tasto destro (`interfaccia/4-schermate.md`) hanno la riga Vista con Testo scelto, perché mostrano una nota in vista Testo, e sono esportati di nuovo. Il mockup dei simboli sulla riga del cursore di Must A è SUPERATO (DEC-130); quelli della pillola, del menu «/» e del tasto destro restano SOSPESI (DEC-64, DEC-130). Esportazione: `immagini/SC-03-vista-markdown-mockup.png`
- **Mockup del titolo nel percorso (DEC-71, 30/09/2026):** i mockup di Must A e Must C qui sopra sono aggiornati con il percorso al centro della fascia in alto, senza titolo e metadati nel foglio, ed esportati di nuovo; in più [comparsa dei metadati](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=92-6457) · [titolo in modifica](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=92-6601); esportazioni `immagini/SC-03-comparsa-metadati-mockup.png`, `immagini/SC-03-titolo-modifica-mockup.png`. Proposte in [Proposta · Titolo nel percorso](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=88-4408)

| Cosa | Dove | Come |
|---|---|---|
| Clic sul titolo del percorso (DEC-96) | Info (CMP-24), tipo Comparsa, sotto il titolo, senza velo | Passando sul titolo non compare niente: la comparsa dei metadati (CMP-27, DEC-71) è superata. Righe e azioni di Info in `interfaccia/4-schermate.md` («Info della nota»): titolo, cartella, date, tag, vista (DEC-130), ultima modifica, poi Chiudi nota ed Elimina |
| Info dal tasto destro (DEC-96) | Tasto destro sulla nota nella colonna, voce «Info» | Info, tipo Finestra, al centro con il velo: in testa «Info» e la ✕, senza Chiudi nota |
| Info in generale (DEC-44, DEC-96, DEC-97, ID-27) | — | Ogni modifica vale subito, come nel resto dell'app (RB-06): nessun Salva. La Comparsa si chiude con un clic fuori o con Esc, la Finestra con la ✕, con Esc o con un clic sul velo (DEC-81); l'eliminazione di un tag da tutte le note resta con la sua conferma (RB-19). Il conteggio delle parole è l'idea ID-28 |
| Eliminare un tag del tutto | Tasto destro su un suggerimento | "Elimina tag…", poi finestra di conferma con il numero di note coinvolte (RB-19) |
| Date | Righe «Creata il …» e «Fine validità» di Info | Data di creazione scelta e fine validità, con il calendario. La data di sistema, che non cambia, è nel suggerimento della riga della creazione (RB-21, DEC-97). Nessun avviso sulle combinazioni (RB-20) |
| Sposta in | Pannello Sposta in (CMP-11), dalla riga della cartella di Info o da «Sposta in…» nel tasto destro sulla nota | Campo per cercare una cartella, poi la radice e l'albero; la cartella attuale è evidenziata. Clic su una cartella: la nota si sposta e il pannello si chiude |

Il calendario è il componente CMP-12 (Date picker).

### Bollicina del formato (DEC-131)
Nessuna barra fissa sopra il testo e niente pillola sopra la selezione: la pillola degli strumenti, con il menu `/`, è superata dalla **bollicina del formato** (CMP-10). C'è solo in vista Markdown: se c'è, la nota è in Markdown.

```
│ testo della nota …                                          │
│                                                             │
│                                                  ( H1 B )   │   chiusa
│        ( T H1 H2 • 1. ☐ │ B I S U │ ⌫ )  ( H1 B )            │   aperta
```

| Cosa | Come |
|---|---|
| Posizione | In basso a destra del foglio, galleggiante, ferma anche quando il testo scorre (livello 20). Sotto l'ultima riga del testo c'è un margine, così la bollicina non la copre mai |
| Bollicina chiusa | Pillola piccola con il formato della riga e quelli del carattere dove sta il cursore: `T`, `H1`, `H2`, `•`, `1.`, `☐`, poi `B`, `I`, `S`, `U` (per esempio `H1 B`, `T B I`). Con una selezione mista, solo i formati comuni e un trattino al posto della riga se le righe sono diverse (CA-02.4) |
| Cassetto aperto | Con un clic sulla bollicina si apre verso sinistra, sulla stessa linea: formati di riga (testo normale, titolo, sottotitolo, elenco puntato, elenco numerato, casella), un divisore, formati di carattere (grassetto, corsivo, barrato, sottolineato), un divisore, «Rimuovi formattazione». I formati in uso sono evidenziati come lo stato Attivo della pillola (DEC-35). Resta aperto finché si riprende a scrivere, con Esc, con un clic nel testo o fuori, o con un altro clic sulla bollicina (CA-02.21) |
| Poco spazio | Se il cassetto non ci sta su una riga (finestra stretta, nota rapida), va su due righe, verso l'alto: sopra i formati di riga, sotto quelli di carattere e «Rimuovi formattazione» (proposta dell'agente) |
| Suggerimenti | Passando su una voce compare il nome con la scorciatoia, se c'è: «Grassetto · Ctrl + B», «Barrato · Ctrl + Maiusc + S», «Titolo · Ctrl + 1»; «Rimuovi formattazione» ha l'icona della gomma e il nome solo nel suggerimento |
| Tastiera | Alt + F10 apre il cassetto con il focus sulla prima voce; frecce, Invio o spazio, Esc torna al testo (CA-02.5) |

Restano la sintassi markdown (RF-02) e le scorciatoie (CA-02.3). Il menu del tasto destro resta sospeso (DEC-64). Niente + a margine.

- **Mockup (DEC-131, approvati da Manuel Cucca il 09/10/2026):** [bollicina chiusa con H2](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=237-6652) · [cassetto aperto](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=237-6880) · [nota nuova vuota con T](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=238-6951); esportazioni `immagini/SC-03-bollicina-mockup.png`, `immagini/SC-03-cassetto-mockup.png`, `immagini/SC-03-vuoto-bollicina-mockup.png`. I mockup della pillola di formattazione, della pillola di inserimento e del menu `/` di Must A sono SUPERATI (DEC-131), con la didascalia aggiornata; il tasto destro resta SOSPESO

Il testo ha una larghezza massima di lettura anche su schermi larghi: oltre una certa misura le righe diventano difficili da seguire. Lo spazio restante resta vuoto.

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto (primo utilizzo) | Nessuna nota e nessuna cartella: invito a scrivere più pulsante per creare la prima nota | Titolo "Nessuna nota, per ora." · spiegazione "Inizia a scrivere." · pulsante "Nuova nota" (stato vuoto, CMP-19) |
| Vuoto (nessuna nota aperta) | Dopo «Chiudi nota» o con la nota aperta finita nel cestino (DEC-68, RB-67) | Titolo "Nessuna nota aperta" · spiegazione e pulsante "Nuova nota" (stato vuoto, CMP-19) |
| Vuoto (nota nuova) | Nota creata e ancora senza testo: il percorso mostra «Senza titolo» e il corpo vuoto il suo invito (DEC-71). La nota esiste già; lasciata vuota, sparisce (RB-10, DEC-39). Nasce in Markdown, quindi in basso a destra c'è la bollicina con `T` (DEC-131) | Percorso: "Senza titolo" · corpo: "Scrivi qui…" |
| Caricamento | Non previsto: la nota arriva dalla copia di lavoro sul dispositivo | — |
| Errore | Immagine rifiutata: messaggio accanto al punto di inserimento, non bloccante (RB-11, RB-12) | Testo definitivo in Fase 6 |
| Successo | Non previsto: il salvataggio è silenzioso (RB-06) | — |
| Contenuto parziale | Immagine in arrivo da un altro dispositivo non ancora sincronizzata: segnaposto tratteggiato al suo posto ([wireframe](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=32-103), `immagini/SC-03-immagine-in-arrivo.png`) | Testo definitivo in Fase 6 |
| Contenuto lungo | Nota molto lunga: scorre tutta la pagina sotto la fascia in alto e il percorso (DEC-59, DEC-60, DEC-71) | — |
| Immagine selezionata | Maniglie sull'immagine e pannello impostazioni (dimensione, allineamento, ritaglio, rotazione, testo alternativo) al livello 20 | — |
| Nota in conflitto | Nota nata da un conflitto (DEC-06): stesso titolo seguito da "(copia in conflitto)", nella stessa cartella; all'arrivo compare un avviso con il collegamento (RB-39) ([wireframe](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=32-147), `immagini/SC-03-conflitto.png`) | Testo definitivo in Fase 6 |

### Messaggi di errore
| Sfiga | Testo definitivo |
|---|---|
| SF-21 File non immagine o corrotto | Fase 6 (RB-11) |
| SF-17 Immagine oltre 25 MB | Fase 6 (RB-12) |

## Icone macOS · precisazione del 04/10/2026

Manuel Cucca richiede la M chiara in scuro e scura in chiaro sia nella barra dei menu sia nel Dock. La barra conserva la modalità template a ogni aggiornamento; il Dock usa i due loghi già forniti, in `icons/finestra`, durante l’esecuzione. Implementazione proposta in DEC-108.
