# Brainet – Schermate

<!-- Fasi 4 e 6 della guida. Per Brainet la Fase 4 in bianco e nero è saltata: si va direttamente ai mockup, fatti con i componenti della libreria (scelta di Manuel Cucca del 14/10/2026). Mockup nel file Mockup, blocco «FL-16 … FL-22 · Brainet (DEC-134)», in ordine di flusso. Approvati da Manuel Cucca il 14/10/2026, con le proposte dell'agente (codici SC-10, SC-11, SC-12, testi delle conferme, parte Brainet del Cestino, icone e spunta nei menu); esportazioni in `immagini/`, una per mockup, con il nome della schermata. -->

Brainet vive nella finestra principale: una sezione della colonna (SC-01), tre viste nell'area della nota (SC-10 Database, SC-11 Entità, SC-12 Calendario), una parte del Cestino (SC-04) e un gruppo delle Impostazioni (SC-06).

Link: `https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=` seguito dal nodo.

## SC-01 – Finestra principale: la sezione Brainet (FL-16, FL-17, FL-18, FL-20, FL-22)
**Flussi:** FL-16, FL-17, FL-18, FL-20, FL-22 · **Componenti:** riga della colonna (sezione con +, voci Database, Entità, Calendario), testo della nota, menu, voce di menu, avviso; da disegnare in libreria: pillola del collegamento, area evidenziata, linguetta, icone cervello e database

- **Mockup (approvati il 14/10/2026):** [la colonna](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-9788) · [nota nuova](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=268-10039) · [@ e suggerimenti](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=271-10124) · [collegamento scelto](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=271-10295) · [area, selezione](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=277-10832) · [area creata](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=277-11030) · [area, mouse sopra](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=281-11025) · [area, menu dalla linguetta](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-12153) · [Importa in Brainet](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=288-12207) · [spento da un altro computer](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-11738)
- **Wireframe:** nessuno (Fase 4 saltata, scelta di Manuel Cucca del 14/10/2026)

| Azione | Come |
|---|---|
| Nota nuova | + accanto al titolo BRAINET: un foglio nuovo che accetta testo (RB-101) |
| Citare un'entità | @ apre i suggerimenti divisi per tipo, con il titolo sopra ogni sezione; in fondo «Crea» (RB-104, RB-105) |
| Evidenziare un'area | Selezione di una frase: il menu con gli Stati in cima e poi le entità, più voci insieme (RB-107) |
| Cambiare un'area | Mouse sopra: riquadro e linguetta con stati ed entità; la freccia apre lo stesso menu con le voci spuntate; tolte tutte, l'area sparisce (RB-109) |
| Importare | Tasto destro su una nota di CLOUD › «Importa in Brainet» › Copia o Sposta (RB-112) |

### Stati della sezione
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | Brainet spento: la sezione non c'è | — |
| Caricamento | Non previsto: le note sono nella copia di lavoro | — |
| Errore | Brainet spento da un altro computer mentre scrivi: la sezione sparisce, il foglio si chiude, il testo si perde (RB-111) | «Brainet è stato spento da un altro computer.» con «Ho capito» |
| Successo | Pillole e aree si vedono subito, senza messaggi | — |

---

## SC-10 – Database (FL-16)
**Flussi:** FL-16 · **Componenti:** pillola del collegamento, menu

- **Mockup (approvati il 14/10/2026):** [Database](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-10008) · [tasto destro su una nota](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-11109)

| Azione | Come |
|---|---|
| Leggere e modificare | I frammenti dal più recente, con giorno e ora sopra; si modificano scrivendoci sopra (RB-103) |
| Eliminare | Tasto destro › «Elimina»: la nota va nel Cestino, nella parte di Brainet |

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | Nessuna nota Brainet | Da decidere |
| Nascosto | «Mostra il Database» spento: la voce Database non c'è | — |

---

## SC-11 – Entità (FL-19)
**Flussi:** FL-19 · **Componenti:** menu, pannello a comparsa (come «Sposta in»), finestra di conferma, pillola del filtro della ricerca (CMP-13) per il tipo

- **Mockup (approvati il 14/10/2026):** [Entità](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-10280) · [tasto destro su una riga](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-11241) · [Unisci a…](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-12290) · [conferma dell'unione](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-11538) · [scelta del tipo](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=316-14044) (15/10/2026, RB-122)

| Azione | Come |
|---|---|
| Unire | Tasto destro › «Unisci a…»: pannello con la ricerca e le entità per tipo; poi la conferma con quante citazioni e aree si spostano, «Annulla» o «Unisci» (RB-108) |
| Tipo | Clic sulla pillola del tipo (con la freccia giù, come i filtri della ricerca, CMP-13): menu 8 px sotto con Persona, Argomento, Evento, Oggetto, una linea e «Senza tipo», spunta sul tipo attuale (RB-122, CA-18.31) |
| Foto | Tasto destro › «Scegli una foto…»: la finestra del sistema per scegliere un'immagine dal disco; un file che non è un'immagine dà l'avviso «Il file scelto non è un'immagine: la foto non cambia.» e la foto resta com'era (CA-18.13, DEC-141) |

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | Nessuna entità | Da decidere |
| Conferma | Prima di unire | «Unire «Luca» a «Luca Bianchi»?» · «1 citazione e 2 aree passano a «Luca Bianchi», che tiene il suo nome. L'unione non si annulla.» (proposta dell'agente) |

---

## SC-12 – Calendario (FL-16)
**Flussi:** FL-16 · **Componenti:** da disegnare in libreria: giorno con i pallini

- **Mockup (approvati il 14/10/2026):** [Calendario](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=276-10310)
- Si guarda soltanto: i clic non fanno niente (scelta di Manuel Cucca).

---

## SC-04 – Cestino: la parte di Brainet
- **Mockup (approvati il 14/10/2026):** [Cestino con la parte di Brainet](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=288-11942)
- Le note di Brainet eliminate stanno sotto quelle di CLOUD, con il titolo «Brainet»; si ripristinano o si eliminano per sempre come le altre; «Svuota cestino» svuota tutte e due le parti (proposta dell'agente).

## SC-06 – Impostazioni: il gruppo Brainet (FL-20, FL-21)
- **Mockup (approvati il 14/10/2026):** [spento](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=276-11131) · [acceso, con gli stati](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=276-10845) · [conferma per spegnere](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-11670)
- Conferma per spegnere: «Spegnere Brainet?» · «Le note, le entità, le aree e gli stati di Brainet si cancellano per sempre, su tutti i tuoi computer.» · «Annulla», «Spegni e cancella tutto» (testi proposta dell'agente; il pulsante è il principale perché la libreria non ha un pulsante rosso).

## SC-01 – Gli allegati in una nota Brainet (FL-23, FL-24, FL-25)
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
