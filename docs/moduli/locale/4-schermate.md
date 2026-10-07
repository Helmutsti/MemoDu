# Locale – Schermate

<!-- Fasi 4 e 6 della guida. Wireframe e mockup restano nello strumento di design: qui si mettono i link. -->

Locale non ha una schermata sua: è una sezione della colonna di SC-01, sotto Cartelle, e un file si apre nell'area della nota come in SC-03. L'impostazione generale (scala z-index, inventario dei componenti) è in `moduli/interfaccia/4-schermate.md`.

## SC-01 – Finestra principale: la sezione Locale (FL-10, FL-12)
**Flussi:** FL-10, FL-12 · **Componenti:** titolo di sezione con +, riga della colonna (cartella, file, cartella non trovata), menu del tasto destro, finestra di conferma

- **Mockup (approvati da Manuel Cucca il 04/10/2026):** pagina «SC-01 Locale (RF-17)» del file Mockup: [senza cartelle](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=205-3133) · [tasto destro su una cartella](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=205-3304) · [eliminare per sempre](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=205-4166); esportazioni `immagini/SC-01-locale-vuota-mockup.png`, `immagini/SC-01-locale-tasto-destro-mockup.png`, `immagini/SC-01-locale-elimina-mockup.png`. Le sezioni Non organizzate e Cartelle sono chiuse per far vedere Locale; i file sono righe CMP-06 File, la cartella che manca Cartella non trovata.
- **Wireframe:** [Locale senza cartelle](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=69-207) · [tasto destro su una cartella locale](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=69-230) · [eliminare per sempre](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=69-440)

| Azione | Come |
|---|---|
| Aggiungi cartella | + accanto al titolo LOCALE: finestra di scelta della cartella del sistema (FL-10) |
| Cartelle e file | Le cartelle dell'elenco in ordine alfabetico, con dentro sottocartelle (freccia) e file .md e .txt, come l'albero delle cartelle (RB-73, RB-75) |
| Cartella non trovata | Testo tenue e «non trovata» a destra; tasto destro → Togli da Locale |
| Tasto destro su una cartella dell'elenco | Nuovo file, Nuova cartella, Togli da Locale (RB-76) |
| Tasto destro su una sottocartella | Nuovo file, Nuova cartella, Rinomina, Elimina |
| Tasto destro su un file | Rinomina, Elimina |
| Spostare | Trascinando file e cartelle, anche tra cartelle dell'elenco diverse |
| Eliminare | Nel Cestino del sistema, senza conferma; se il disco non ha un Cestino, finestra di conferma «Eliminare per sempre» (livello 40, RB-83) |

### Stati della sezione
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | Nessuna cartella nell'elenco: una riga in testo tenue, come Cartelle | «Nessuna cartella. Aggiungine una con +» |
| Caricamento | Non previsto: si leggono solo le cartelle aperte | — |
| Errore | Cartella sparita o non leggibile: riga tenue con il motivo a destra | «non trovata» · «non accessibile» |
| Successo | Le operazioni sul disco si vedono subito nella colonna, senza messaggi | — |
| Contenuto lungo | La colonna scorre come per le note | — |

---

## SC-03 – Un file locale aperto (FL-11, FL-13)
**Flussi:** FL-10, FL-11, FL-13 · **Componenti:** percorso, comparsa del file (da disegnare, DEC-123), editor del testo (lo stesso delle note), segno di non salvato, avviso

- **Mockup (approvati da Manuel Cucca il 04/10/2026):** [file aperto, non salvato](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=204-3268) · [file nuovo](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=205-3641) · [file troppo grande](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=205-3806) · [salvato in UTF-8](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=205-3981) · [file cambiato sul disco](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=205-3511) · [file sparito dal disco](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=205-3586); esportazioni `immagini/SC-01-locale-mockup.png`, `immagini/SC-01-locale-file-nuovo-mockup.png`, `immagini/SC-01-locale-troppo-grande-mockup.png`, `immagini/SC-01-locale-utf8-mockup.png`, `immagini/SC-01-locale-file-cambiato-mockup.png`, `immagini/SC-01-locale-file-sparito-mockup.png`. Testo su tutta la larghezza (DEC-107); percorso CMP-26 con Non salvato; avvisi CMP-15 (Avviso con due scelte, Informazione con Ho capito); file troppo grande con lo Stato vuoto CMP-19.
- **Wireframe:** [file aperto, non salvato](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=69-169) · [file nuovo](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=69-352) · [file troppo grande](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=69-383) · [salvato in UTF-8](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=69-411) · [file cambiato sul disco](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=69-279) · [file sparito dal disco](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=69-317)

Il file si apre al posto della nota. In alto il percorso «Locale › cartella › nome del file»; il testo è quello del file, con lo stesso editor delle note (testo puro, DEC-64). Niente Info, tag o date (RF-17): il clic sul nome apre una comparsa più piccola, con il nome e le voci del file (DEC-123). Wireframe e mockup sono ancora senza la comparsa.

| Azione | Come |
|---|---|
| Modifiche non salvate | Un pallino ● dopo il nome nel percorso e a destra della riga nella colonna (RB-77) |
| Salvare | Ctrl + S (⌘ + S su Mac); il pallino sparisce (RB-79) |
| Passare ad altro o chiudere | Nessuna domanda: le modifiche restano in sospeso e il pallino resta nella colonna (RB-78) |
| File nuovo | + o Nuovo file: riga «Senza titolo» in corsivo tenue con il pallino; al primo Ctrl + S il nome viene dalla prima riga (RB-81) |
| Comparsa del file (DEC-123) | Clic sul nome nel percorso, come il titolo di una nota: sotto il percorso una comparsa come Info (CMP-24, variante Comparsa), con il campo del nome, un divisore e le voci Chiudi file e, solo per un file aggiunto da solo, Togli da Locale. Si chiude con Esc o con un clic fuori |
| Rinominare | Nel campo della comparsa, come il titolo di una nota; l'estensione si vede. Un file nuovo mai salvato prende il nome al primo Ctrl + S (RB-81) e nella comparsa ha solo Chiudi file |
| Chiudi file | Come Chiudi nota: l'area resta vuota (DEC-117); le modifiche non salvate restano in sospeso (RB-78) |
| Togli da Locale | Solo per un file aggiunto da solo (DEC-120): sparisce dall'elenco, sul disco non cambia niente (RB-76), l'area resta vuota. Un file dentro una cartella aggiunta non si toglie da solo: si toglie la cartella dal tasto destro della colonna |

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | File vuoto: l'editor vuoto con il cursore | — |
| Caricamento | Non previsto: un file fino a 10 MB si legge subito | — |
| Errore | File che non si apre: stato nell'area al posto del testo, come «Nessuna nota aperta» | «Questo file è troppo grande per Memodu» · «Pesa 24 MB: Memodu apre file fino a 10 MB. Aprilo con un altro programma.» Per gli altri motivi: «Questo file non si apre» e il motivo |
| Successo | Ctrl + S: il pallino sparisce, senza messaggi; al primo salvataggio di un file non UTF-8, avviso una volta | «vecchio-elenco.txt era in Windows-1252: l'ho salvato in UTF-8.» · Ho capito |
| Contenuto lungo | Il testo scorre come una nota | — |

### Avvisi (livello 50)
| Caso | Testo | Azioni |
|---|---|---|
| Il file è cambiato sul disco (RB-85) | «riunione.txt è cambiato sul disco.» | Ricarica · Tieni la mia versione |
| Il file non c'è più (RB-85) | «riunione.txt non c'è più sul disco.» | Ricrealo · Chiudi |
| Il disco rifiuta il salvataggio (SF-37) | «Non riesco a salvare riunione.txt: » e il motivo del sistema | Ho capito |

### Messaggi di errore
| Sfiga | Testo definitivo |
|---|---|
| SF-17 | Da scrivere in Fase 6 |
| SF-37 | Da scrivere in Fase 6 |

I testi sono provvisori fino alla Fase 6.
