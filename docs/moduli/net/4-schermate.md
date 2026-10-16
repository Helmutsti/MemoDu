# Brainet – Schermate

<!-- Fasi 4 e 6 della guida. Per Brainet la Fase 4 in bianco e nero è saltata: si va direttamente ai mockup, fatti con i componenti della libreria (scelta di Manuel Cucca del 14/10/2026). Mockup nel file Mockup, pagina «8 · Brainet», un blocco per flusso con le schermate numerate come passi (DEC-149). Rivisto dall'agente il 16/10/2026 per DEC-145 (Brainet dentro le note di CLOUD): schermate superate cancellate da Figma e segnate «rimosso», nuove SC-13 e Info con Testo spento, approvate da Manuel Cucca il 16/10/2026. Approvati da Manuel Cucca il 14/10/2026, con le proposte dell'agente (codici SC-10, SC-11, SC-12, testi delle conferme, parte Brainet del Cestino, icone e spunta nei menu); esportazioni in `immagini/`, una per mockup, con il nome della schermata. -->

Brainet vive nella finestra principale: una sezione della colonna e le note di CLOUD in vista Markdown (SC-01), tre viste nell'area della nota (SC-11 Entità, SC-13 Pagina dell'entità, SC-12 Calendario), una riga di Info (SC-03) e un gruppo delle Impostazioni (SC-06). SC-10 Database e la parte di Brainet del Cestino (SC-04) sono tolte (DEC-145).

Link: `https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=` seguito dal nodo.

## SC-01 – Finestra principale: la sezione Brainet e le note (FL-16, FL-17, FL-18, FL-20)
**Flussi:** FL-16, FL-17, FL-18, FL-20 · **Componenti:** riga della colonna (sezione senza +, voci Entità e Calendario), percorso, testo della nota, menu, voce di menu, avviso; da disegnare in libreria: pillola del collegamento, area evidenziata, linguetta, icone cervello e database

- **Mockup (approvati il 14/10/2026):** [la colonna](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-9788) · nota nuova (rimosso, DEC-145) · [@ e suggerimenti](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=271-10124) · [collegamento scelto](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=271-10295) · [area, selezione](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=277-10832) · [area creata](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=277-11030) · [area, mouse sopra](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=281-11025) · [area, menu dalla linguetta](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-12153) · Importa in Brainet (rimosso, DEC-145) · spento da un altro computer (rimosso, DEC-145). Aggiornati il 16/10/2026 per DEC-145: la colonna senza + e senza Database, le note con il percorso di una nota di CLOUD «Senza titolo»
- **Wireframe:** nessuno (Fase 4 saltata, scelta di Manuel Cucca del 14/10/2026)

| Azione | Come |
|---|---|
| Dove si scrive | In una nota di CLOUD in vista Markdown, creata come sempre (Ctrl + N o + accanto a CLOUD) (RB-123) |
| Citare un'entità | @ apre i suggerimenti divisi per tipo, con il titolo sopra ogni sezione; in fondo «Crea» (RB-104, RB-105) |
| Evidenziare un'area | Selezione di una frase: il menu con gli Stati in cima e poi le entità, più voci insieme (RB-107) |
| Cambiare un'area | Mouse sopra: riquadro e linguetta con stati ed entità; la freccia apre lo stesso menu con le voci spuntate; tolte tutte, l'area sparisce (RB-109) |
| Aprire un'entità | Clic su una pillola: la pagina dell'entità (SC-13, proposta dell'agente) |

### Stati della sezione
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | Brainet spento: la sezione non c'è | — |
| Caricamento | Non previsto: le note sono nella copia di lavoro | — |
| Spento | Brainet spento, anche da un altro computer: la sezione sparisce, i menu di Brainet non si aprono; pillole, aree e allegati restano e si vedono (RB-111) | — |
| Successo | Pillole e aree si vedono subito, senza messaggi | — |

---

## SC-10 – Journal (FL-16, FL-28)
**Flussi:** FL-16, FL-28 · **Componenti:** riga della colonna (voce Journal, icona libro aperto di CMP-02), testo della nota (CMP-20) con Brainet, menu (CMP-09), finestra di conferma (CMP-16), stato vuoto (CMP-19)

Torna con DEC-147 (16/10/2026) al posto del Database: l'elenco delle note in Brainet (RB-131); si chiama Journal (DEC-148). Scritta dall'agente, approvata con i mockup da Manuel Cucca il 16/10/2026 («ok tutto vai avanti»).

- **Mockup (fatti dall'agente il 16/10/2026, approvati da Manuel Cucca lo stesso giorno):** [Journal](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=331-13468) · [tasto destro su una nota di CLOUD con «Sposta in Brainet»](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=330-13224) · [conferma](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=330-13421) · [Info con «Sposta in Brainet»](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=331-13663); esportazioni `SC-10-journal-mockup.png`, `SC-01-brainet-sposta-in-brainet-menu-mockup.png`, `SC-01-brainet-sposta-in-brainet-conferma-mockup.png`, `SC-03-info-sposta-in-brainet-mockup.png`. Nel menu e in Info la voce è aggiunta a un'istanza staccata: il file dei mockup non ha ancora la versione nuova di Menu e Info della libreria (da aggiornare in Figma con «Aggiorna» delle librerie).

| Azione | Come |
|---|---|
| Leggere e modificare | Le note in Brainet dalla più recente, con giorno e ora sopra; si modificano lì, con @, pillole, aree e allegati |
| Eliminare | Tasto destro › «Elimina»: la nota va nel Cestino; ripristinata torna qui |
| Spostare qui una nota | Dalla colonna o da Info: «Sposta in Brainet», con la conferma (RB-130) |

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | Nessuna nota in Brainet | «Nessuna nota in Brainet» · «Sposta una nota qui dal suo menu: tasto destro › «Sposta in Brainet».» |
| Conferma | Prima di spostare | «Spostare la nota in Brainet?» · «La nota esce da CLOUD e dalla ricerca e non si riporta indietro. Nel Journal puoi collegarla a persone, oggetti e argomenti.» · «Annulla», «Sposta» |

---

## SC-11 – Entità (FL-19)
**Flussi:** FL-19 · **Componenti:** Riga dell'entità (CMP-41, con l'icona del tipo), Volto dell'entità (CMP-46), Titolo di sezione (CMP-39), menu, pannello a comparsa (come «Sposta in»), finestra di conferma, pillola del filtro della ricerca (CMP-13) per il tipo

**Divisa per tipo** (richiesta di Manuel Cucca del 16/10/2026: «Le persone devono apparire come i personaggi del cast di un film con foto rotonda e nome sotto. se la foto manca allora le iniziali. Gli eventi/date con un icona di un calendario. I concetti/idee/pensieri/argomenti con una lampadina»): un gruppo per tipo con il titolo di sezione, nell'ordine di @ (Persone, Argomenti, Eventi, Oggetti, Senza tipo), i gruppi vuoti non si vedono. Le persone in una griglia di Volti (CMP-46); gli altri tipi in righe (CMP-41), con l'icona del calendario per gli eventi e la lampadina per gli argomenti al posto della foto che manca. Proposte dell'agente, approvate da Manuel Cucca il 16/10/2026: ordine dei gruppi, Oggetti e Senza tipo senza icona, nel cast niente pillola del tipo né «nominato…» (il tipo si cambia con tasto destro › «Tipo ›», il resto è nel suggerimento del mouse). Mockup [Entità](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-10280) ridisegnato dall'agente il 16/10/2026 con i componenti nuovi e approvato (esportazione `SC-11-entita-mockup.png`); anche le altre schermate di Entità (tipo, tasto destro con «Tipo ›», unione) hanno l'elenco per tipo.

- **Mockup (approvati il 14/10/2026):** [Entità](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-10280) · [tasto destro su una riga](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-11241) · [Unisci a…](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-12290) · [conferma dell'unione](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-11538) · [scelta del tipo](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=316-14044) (15/10/2026, RB-122)

| Azione | Come |
|---|---|
| Aprire | Clic su una riga: la pagina dell'entità (SC-13, proposta dell'agente, DEC-145) |
| Unire | Tasto destro › «Unisci a…»: pannello con la ricerca e le entità per tipo; poi la conferma con quante citazioni e aree si spostano, «Annulla» o «Unisci» (RB-108) |
| Tipo | Clic sulla pillola del tipo (con la freccia giù, come i filtri della ricerca, CMP-13): menu 8 px sotto con Persona, Argomento, Evento, Oggetto, una linea e «Senza tipo», spunta sul tipo attuale (RB-122, CA-18.31) |
| Foto | Tasto destro › «Scegli una foto…»: la finestra del sistema per scegliere un'immagine dal disco; un file che non è un'immagine dà l'avviso «Il file scelto non è un'immagine: la foto non cambia.» e la foto resta com'era (CA-18.13, DEC-141) |

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | Nessuna entità | Da decidere (proposta dell'agente: «Nessuna entità. Scrivi @ in una nota per crearne una.») |
| Conferma | Prima di unire | «Unire «Luca» a «Luca Bianchi»?» · «1 citazione e 2 aree passano a «Luca Bianchi», che tiene il suo nome. L'unione non si annulla.» (proposta dell'agente) |

---

## SC-12 – Calendario (FL-16)
**Flussi:** FL-16 · **Componenti:** CMP-43 Calendario di Brainet

- **Mockup (approvato il 14/10/2026, aggiornato il 16/10/2026 per DEC-145):** [Calendario](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=276-10310)
- Un pallino solo per ogni giorno in cui è nata almeno una nota di CLOUD con pillole o aree (scelta di Manuel Cucca del 16/10/2026, RB-113). Si guarda soltanto: i clic non fanno niente (scelta di Manuel Cucca).

---

## SC-13 – Pagina dell'entità (FL-26)
**Flussi:** FL-26 · **Componenti:** CMP-45 Testata dell'entità, CMP-39 Titolo di sezione (i giorni), CMP-38 Collegamento, CMP-40 Area evidenziata, CMP-37 Pallino dello stato, CMP-19 Stato vuoto (Entità); il passaggio è una disposizione della schermata

Scritta dall'agente il 16/10/2026 (DEC-145, RB-124), approvata da Manuel Cucca lo stesso giorno.

- **Mockup:** [pagina dell'entità](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=322-12870) · [pagina dell'entità, vuota](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=322-13035)

| Azione | Come |
|---|---|
| Aprire | Clic su una riga di Entità o su una pillola in una nota |
| Leggere | I passaggi per giorno, dal più recente: titolo della nota (o le prime parole) e ora, sotto il paragrafo con la pillola o l'area evidenziata e i pallini degli stati (RB-124) |
| Aprire una nota | Clic su un passaggio: la nota si apre con il cursore su quel paragrafo |
| Cambiare il tipo | Clic sulla pillola del tipo nella testata (RB-122) |
| Tornare | «Entità» in cima, o Esc |

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Default | Testata e passaggi | «Nominata 3 volte · l'ultima il 16/10/2026» (una volta: «Nominata 1 volta · …») |
| Vuoto | Nessuna nota di CLOUD fuori dal Cestino la nomina (RB-127) | «Mai nominata» nella testata; «Nessuna nota parla ancora di «Giorgio».» · «Scrivi @ in una nota per citarla.» |
| Hover | Mouse su un passaggio | Fondo `sfondo-hover`, raggio 12 |
| Caricamento | Non previsto: i dati sono nella copia di lavoro | — |

---

## SC-03 – Info: la riga Vista di una nota con Brainet (FL-16)
Scritta dall'agente il 16/10/2026 (DEC-145, RB-123); il comportamento è approvato da Manuel Cucca, il disegno è approvato da Manuel Cucca il 16/10/2026.

- **Mockup:** [Info con Testo spento](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=322-13656)
- Il segmento «Testo» è spento e sotto la riga c'è «Questa nota usa Brainet: si vede solo in Markdown» in Interfaccia/Dettaglio `testo-tenue`. Nel mockup Info è staccata dal componente: la riga di spiegazione e il segmento spento sono da aggiungere in libreria (CMP-24, CMP-28).

---

## SC-04 – Cestino: la parte di Brainet
Tolta il 16/10/2026 (DEC-145): le note con Brainet sono note di CLOUD e stanno nel Cestino con le altre. Mockup: Cestino con la parte di Brainet (rimosso).

## SC-06 – Impostazioni: il gruppo Brainet (FL-20, FL-21)
- **Mockup (approvati il 14/10/2026; aggiornati il 16/10/2026 per DEC-145):** [spento](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=276-11131) · [acceso, con gli stati](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=276-10845), senza «Mostra il Database» · conferma per spegnere (rimosso, DEC-145)
- Spegnere non chiede conferma e non cancella niente (RB-111, DEC-145).

## SC-01 – Gli allegati in una nota (FL-23, FL-24, FL-25)
**Flussi:** FL-23, FL-24, FL-25 · **Componenti:** da disegnare in libreria: pillola del documento (tipo nuovo di CMP-38), bolla della foto, foto piccola, media e grande, riquadro della foto non scaricata, menu dell'allegato (tipo nuovo di CMP-09)

- **Mockup (approvati da Manuel Cucca il 15/10/2026, con le proposte dell'agente e con la graffetta da aggiungere alla libreria per «Allega un file…»; foto di prova: il ritratto già nel file):** [allegati nel testo](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=301-13046) · [menu del documento](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=303-13120) · [menu della foto con Dimensioni](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=303-13270) · [foto media e grande](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=303-13451) · [@ con Allega un file…](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=303-13570) · [allegato troppo grande](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=303-13724) · [foto non scaricata, senza rete](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=303-13777)
- Proposte dell'agente: la bolla alta come la riga (24) e larga 36, con raggio-pillola; le foto fuori dal paragrafo larghe 160, 360 o 720, con raggio-interno; nel menu le icone mostra (Apri), cartella aperta, immagine (Dimensioni) ed elimina (Togli); per «Allega un file…» l'icona immagine, perché la graffetta manca nel design system; il riquadro senza rete su sfondo-campo, con l'icona immagine e il nome in Interfaccia/Dettaglio.

| Azione | Come |
|---|---|
| Allegare | Trascinando, incollando, o @ › «Allega un file…» (RB-114) |
| Usare | Clic: menu con Apri, Mostra nella cartella, Togli; per le foto fuori dal paragrafo anche Dimensioni › Piccola, Media, Grande (RB-119, RB-120) |

| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Errore | File troppo grande o tipo non ammesso | «Il file supera 25 MB: non si può allegare.» · «Si allegano solo foto e documenti (JPG, PNG, PDF, Word, Excel, PowerPoint, testo).» |
| Caricamento | Foto non ancora sul computer, senza rete | Riquadro con il nome del file |
| Errore | Allegato tolto da un altro computer | «Allegato non più disponibile» |

## Da decidere
- ~~I codici SC-10, SC-11, SC-12.~~ Approvati (14/10/2026).
- I testi delle viste vuote di Database ed Entità.
- ~~Pezzi fatti a mano nei mockup da trasformare in componenti.~~ Fatti il 15/10/2026 (scelta dell'agente su delega di Manuel Cucca, «tutti quelli che ritieni necessari»): icone cervello e database (CMP-02), CMP-37 Pallino dello stato, CMP-38 Collegamento, CMP-39 Titolo di sezione, CMP-40 Area evidenziata con la Linguetta, CMP-41 Riga dell'entità, CMP-42 Stati delle evidenziature, CMP-43 Calendario di Brainet, Menu Suggerimenti e Area (CMP-09), Pannello Unisci a (CMP-11), Riga di impostazione Stato (CMP-18). La riga del Database resta una disposizione della schermata (vedi `design-system/componenti.md`). Mockup da aggiornare ai componenti dopo la pubblicazione della libreria.
- Da aggiungere in libreria (DEC-145): il segmento spento della Scelta a segmenti (CMP-28) e la riga di spiegazione sotto Vista in Info (CMP-24). Fatti il 16/10/2026 e pubblicati da Manuel Cucca lo stesso giorno: CMP-45 Testata dell'entità, la variante Entità di CMP-19 e il Giorno con le note a un pallino (CMP-43); nei mockup di SC-13 sono istanze della libreria.
