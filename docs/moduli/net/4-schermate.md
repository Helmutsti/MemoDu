# Brainet – Schermate

<!-- Fasi 4 e 6 della guida. Per Brainet la Fase 4 in bianco e nero è saltata: si va direttamente ai mockup, fatti con i componenti della libreria (scelta di Manuel Cucca del 14/10/2026). Mockup nel file Mockup, blocco «FL-16 … FL-22 · Brainet (DEC-134)», in ordine di flusso. Da approvare da Manuel Cucca; le esportazioni in `immagini/` si fanno dopo l'approvazione. I codici SC-10, SC-11 e SC-12 sono una proposta dell'agente, da confermare. -->

Brainet vive nella finestra principale: una sezione della colonna (SC-01), tre viste nell'area della nota (SC-10 Database, SC-11 Entità, SC-12 Calendario), una parte del Cestino (SC-04) e un gruppo delle Impostazioni (SC-06).

Link: `https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=` seguito dal nodo.

## SC-01 – Finestra principale: la sezione Brainet (FL-16, FL-17, FL-18, FL-20, FL-22)
**Flussi:** FL-16, FL-17, FL-18, FL-20, FL-22 · **Componenti:** riga della colonna (sezione con +, voci Database, Entità, Calendario), testo della nota, menu, voce di menu, avviso; da disegnare in libreria: pillola del collegamento, area evidenziata, linguetta, icone cervello e database

- **Mockup (proposta):** [la colonna](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-9788) · [nota nuova](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=268-10039) · [@ e suggerimenti](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=271-10124) · [collegamento scelto](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=271-10295) · [area, selezione](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=277-10832) · [area creata](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=277-11030) · [area, mouse sopra](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=281-11025) · [area, menu dalla linguetta](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-12153) · [Importa in Brainet](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=288-12207) · [spento da un altro computer](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-11738)
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

- **Mockup (proposta):** [Database](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-10008) · [tasto destro su una nota](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-11109)

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
**Flussi:** FL-19 · **Componenti:** menu, pannello a comparsa (come «Sposta in»), finestra di conferma

- **Mockup (proposta):** [Entità](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-10280) · [tasto destro su una riga](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-11241) · [Unisci a…](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-12290) · [conferma dell'unione](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-11538)

| Azione | Come |
|---|---|
| Unire | Tasto destro › «Unisci a…»: pannello con la ricerca e le entità per tipo; poi la conferma con quante citazioni e aree si spostano, «Annulla» o «Unisci» (RB-108) |
| Foto | Tasto destro › «Scegli una foto…»: la finestra del sistema per scegliere un'immagine dal disco |

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | Nessuna entità | Da decidere |
| Conferma | Prima di unire | «Unire «Luca» a «Luca Bianchi»?» · «1 citazione e 2 aree passano a «Luca Bianchi», che tiene il suo nome. L'unione non si annulla.» (proposta dell'agente) |

---

## SC-12 – Calendario (FL-16)
**Flussi:** FL-16 · **Componenti:** da disegnare in libreria: giorno con i pallini

- **Mockup (proposta):** [Calendario](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=276-10310)
- Si guarda soltanto: i clic non fanno niente (scelta di Manuel Cucca).

---

## SC-04 – Cestino: la parte di Brainet
- **Mockup (proposta):** [Cestino con la parte di Brainet](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=288-11942)
- Le note di Brainet eliminate stanno sotto quelle di CLOUD, con il titolo «Brainet»; si ripristinano o si eliminano per sempre come le altre; «Svuota cestino» svuota tutte e due le parti (proposta dell'agente).

## SC-06 – Impostazioni: il gruppo Brainet (FL-20, FL-21)
- **Mockup (proposta):** [spento](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=276-11131) · [acceso, con gli stati](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=276-10845) · [conferma per spegnere](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=287-11670)
- Conferma per spegnere: «Spegnere Brainet?» · «Le note, le entità, le aree e gli stati di Brainet si cancellano per sempre, su tutti i tuoi computer.» · «Annulla», «Spegni e cancella tutto» (testi proposta dell'agente; il pulsante è il principale perché la libreria non ha un pulsante rosso).

## Da decidere
- I codici SC-10, SC-11, SC-12 (proposta dell'agente).
- I testi delle viste vuote di Database ed Entità.
- Pezzi fatti a mano nei mockup, da trasformare in componenti della libreria con l'ok di Manuel Cucca: icone cervello, database e pallino dello stato; pillola del collegamento; area evidenziata e linguetta; elenco degli stati; spunta nelle voci di menu (oggi è l'icona a destra, come nel pannello «Sposta in»); titoli delle parti nel Cestino.
