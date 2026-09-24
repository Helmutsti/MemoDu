# Organizzazione – Schermate

<!-- Fasi 4 e 6 della guida. Wireframe e mockup restano nello strumento di design: qui si mettono i link. -->

L'impostazione generale (breakpoint, scala z-index, inventario dei componenti) è in `moduli/interfaccia/4-schermate.md`. L'albero e le non organizzate stanno nella colonna sinistra di SC-01.

## SC-01 – Finestra principale: organizzare (FL-05)
**Flussi:** FL-05 · **Componenti:** riga cartella, campo nome nell'albero, cestino durante il trascinamento, finestra di conferma

- **Wireframe:** [nuova cartella](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=37-108) · [trascinamento di una nota](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=37-153) · [trascinamento non permesso](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=37-201) · [nome già presente](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=14-91) · [tasto destro su una cartella](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=30-186)
- **Esportazioni:** `immagini/SC-01-nuova-cartella.png`, `immagini/SC-01-trascinamento.png`, `immagini/SC-01-trascinamento-non-permesso.png`

| Azione | Come |
|---|---|
| Nuova cartella | + accanto a Cartelle (primo livello) o tasto destro → Nuova sottocartella. La riga nasce come campo con "Nuova cartella" già selezionato (RB-48); Invio o clic fuori confermano |
| Rinomina | Tasto destro → Rinomina: stesso campo sul nome esistente |
| Nome già presente | Finestra con tre scelte: aggiungi un numero, unisci, annulla (RB-31) |
| Spostare | Si trascina una nota o una cartella nell'albero: la cartella sotto il puntatore si evidenzia. Oppure Sposta in… dal menu `···` (FL-04) |
| Spostamento non permesso | Una cartella dentro sé stessa o una sua sottocartella: nessuna evidenziazione, segno ✕, rilasciando non succede niente (RB-24) |
| Eliminare | Tasto destro → Elimina, Elimina dal menu `···`, oppure trascinando sul cestino che compare in fondo alla colonna **solo durante il trascinamento** (livello 20). Nessun messaggio: l'elemento è nel cestino (SF-05) |

---

## SC-04 – Cestino
**Flussi:** FL-05 · **Componenti:** elemento del cestino, pulsante, finestra di conferma

- **Wireframe:** [cestino](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=37-246) · [vuoto](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=37-314) · [conferma svuotamento](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=37-357)
- **Esportazioni:** `immagini/SC-04.png`, `immagini/SC-04-vuoto.png`, `immagini/SC-04-svuota.png`
- **Mockup:** [Fase 6]

Si apre dalla voce Cestino del menu `···`, al posto della nota; la colonna resta. Ogni elemento mostra tipo (nota o cartella con il numero di note), da dove veniva e quando è stato eliminato, con Ripristina. In cima, Svuota cestino.

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | Nessun elemento: solo il messaggio, senza Svuota cestino | Testo definitivo in Fase 6 |
| Caricamento | Non previsto: il cestino è sulla copia di lavoro | — |
| Errore | Non previsto | — |
| Successo | Ripristina: l'elemento sparisce dall'elenco e torna nella radice (RB-28), senza messaggio. Svuota: dopo la conferma il cestino è vuoto (RB-32) | — |
| Contenuto lungo | L'elenco scorre; resta tutto finché non si svuota (RB-27, SF-17) | — |

### Messaggi di errore
| Sfiga | Testo definitivo |
|---|---|
| — | Nessun messaggio di errore; il testo della conferma si scrive in Fase 6 |
