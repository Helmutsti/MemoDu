# Organizzazione – Test e domande aperte

<!-- Fase 8 della guida. -->

## Piano di test
| Codice | Riferimento | Caso di prova | Ambiente | Set di dati | Esito |
|---|---|---|---|---|---|
| TC-33 | RF-05 CA-05.1, CA-05.2 | Creare «Lavoro» con le sottocartelle «progetti» e «Clienti» e le note «budget» e «Agenda»: l'ordine è Clienti, progetti, Agenda, budget; i numeri contano le note delle sottocartelle e non quelle nel cestino | Locale | Cartella di prova vuota || Superato il 29/09/2026 (Chrome, cartella di prova) |
| TC-34 | RF-05 CA-05.3 | Trascinare una nota non organizzata su «Lavoro»: si evidenzia, al rilascio esce dalle non organizzate; nel Finder il file è in `Memodu/Lavoro` | Locale | Tre note non organizzate || Superato il 29/09/2026 (Chrome, cartella di prova) |
| TC-35 | RF-05 CA-05.4 | Con una nota aperta, Sposta in… → «Clienti»: la nota resta aperta, «Lavoro» e «Clienti» si aprono con la nota selezionata; nel pannello scrivere «cli» filtra l'albero | Locale | Albero di prova || Superato il 29/09/2026 (Chrome, cartella di prova) |
| TC-36 | RF-05 CA-05.5 | Premere il + delle Cartelle, scrivere «Idee» e Invio: nasce «Idee» in ordine alfabetico; ripetere premendo Esc: non nasce niente, né in Memodu né sul disco | Locale | Albero di prova || Superato il 29/09/2026 (Chrome, cartella di prova) |
| TC-37 | RF-05 CA-05.6 | Rinominare «Idee» in «Idee: 2026?» con F2: diventa «Idee- 2026-» anche sul disco; rinominare e premere Esc: resta il nome di prima | Locale | Albero di prova || Superato il 29/09/2026 (Chrome, cartella di prova) |
| TC-38 | RF-05 CA-05.7 | Rinominare una cartella in «clienti» accanto a «Clienti»: compare la finestra; provare Annulla, Aggiungi un numero («clienti (2)») e Unisci con una sottocartella omonima (la finestra ricompare) | Locale | Due cartelle con sottocartelle omonime || Superato il 29/09/2026 (Chrome, cartella di prova) |
| TC-39 | RF-05 CA-05.8 | Trascinare «Lavoro» su «Clienti», sua sottocartella: nessuna evidenziazione, nessuna modifica | Locale | Albero di prova | |
| TC-40 | RF-05 CA-05.9 | Tasto destro su «Lavoro» → Nuova nota qui: la nota nasce in «Lavoro», aperta; poi il + delle Non organizzate con quella nota aperta: la nuova nasce tra le non organizzate | Locale | Albero di prova | |
| TC-41 | RF-05 CA-05.10 | Cancellare «Clienti» dal Finder con Memodu aperto, poi rinominarla in Memodu: compare l'avviso e la colonna si aggiorna | Locale | Albero di prova | |
| TC-42 | RF-05 CA-05.11 | Solo tastiera: frecce, destra e sinistra, Invio, F2 nella colonna; controllo con VoiceOver (RNF-04) | Locale | Albero di prova | |
| TC-43 | RF-05 CA-05.12 | Senza cartelle: sotto «Cartelle» compare «Nessuna cartella. Creane una con +» | Locale | Solo note non organizzate | |
| TC-44 | RF-15 CA-15.1, CA-15.2 | Eliminare la nota aperta dal menu `···`, poi una cartella che contiene la nota aperta dal tasto destro: nessuna conferma, stato vuoto nell'area della nota, entrambe nel cestino con il contenuto | Locale | Albero di prova | |
| TC-45 | RF-15 CA-15.3 | Trascinare una nota e poi una cartella sul cestino in fondo alla colonna: compare, diventa rosso, al rilascio l'elemento è nel cestino | Locale | Albero di prova | |
| TC-46 | RF-15 CA-15.4 | Eliminare tre elementi in momenti diversi: la riga Cestino in fondo alla colonna mostra 3; aprirla: il più recente in cima, testi di tipo, provenienza e data corretti | Locale | Tre elementi eliminati | |
| TC-47 | RF-15 CA-15.5 | Ripristinare una nota di «Clienti» e una sottocartella: tornano tra le non organizzate e al primo livello; ripristinare una cartella con un nome già al primo livello: compare la finestra | Locale | Cestino con elementi | |
| TC-48 | RF-15 CA-15.6 | Elimina definitivamente: Annulla lascia l'elemento; confermando sparisce anche da `.cestino` sul disco | Locale | Cestino con elementi | |
| TC-49 | RF-15 CA-15.7 | Svuota cestino: la conferma indica il numero di elementi; dopo, «Il cestino è vuoto» e niente pulsante Svuota | Locale | Cestino con tre elementi | |
| TC-50 | RF-15 CA-15.8 | Chiudere e riaprire Memodu: gli elementi del cestino ci sono ancora | Locale | Cestino con elementi | |

## Domande aperte
| Riguarda | Domanda | Chi risponde | Risposta | Decisione |
|---|---|---|---|---|
| RF-05 | Una nota appartiene a una sola cartella? | Manuel Cucca | Sì, una sola. Può anche stare nella radice, fuori da ogni cartella | |
| RF-06 | I tag sono piatti o possono essere gerarchici? | Manuel Cucca | Gerarchici; cercando un tag si trovano anche i sotto-tag | |
| RF-07, RF-09 | Rientrano nella prima fase, visto che DEC-01 la limita a "scrittura e stoccaggio"? | Manuel Cucca | No: rinviati dopo la prima fase (Should) | DEC-01 |
| RF-08 | La ricerca deve funzionare sul contenuto delle note, oltre che su titolo e metadati? Con la cifratura end-to-end (RF-10) la ricerca va fatta sul dispositivo. | Manuel Cucca | Sì: titolo, testo, tag (con sotto-tag) e date dei metadati. La ricerca dentro gli allegati non è stata valutata | |
| RF-09 | Se l'utente dimentica la password di una nota o di un workspace, il contenuto è recuperabile? | | | |
| RF-05 | Nello scenario, le "note non organizzate" nella barra laterale sono le note nella radice, cioè fuori da ogni cartella? | Manuel Cucca | Sì: sono le note nella radice; escono dalla barra laterale appena spostate in una cartella | |
| RF-06 | Nello scenario compaiono "tag e categorie": le categorie sono un concetto diverso dai tag e dalle cartelle? | Manuel Cucca | Sinonimo di tag: si usa solo "tag" | |
| RF-06 | Quali caratteri sono ammessi nei nomi dei tag (spazi, emoji, `/` all'inizio o alla fine, maiuscole e minuscole distinte)? | Manuel Cucca | Maiuscole e minuscole non contano; spazi, accenti ed emoji ammessi; `/` superflui corretti in automatico (RB-22) | |
| RF-05 | Unendo due cartelle con lo stesso nome, cosa succede alle sottocartelle che hanno a loro volta lo stesso nome? | Manuel Cucca | Per ogni sottocartella doppia ricompare l'avviso con le tre scelte (RB-31) | |
| RB-23, RB-63 | «Idee» e «idee» contano come lo stesso nome di cartella, visto che su macOS e Windows il disco non le distingue? Deduzione dell'agente | Manuel Cucca | Sì, stesso nome | DEC-36 |
| RF-15, SC-04 | Nel cestino gli elementi si ordinano con l'eliminato più di recente in cima? Deduzione dell'agente | Manuel Cucca | Sì | DEC-37 |
| FL-05 | Se un'operazione su cartelle o cestino fallisce (elemento sparito, disco che non scrive), l'app ricarica l'albero e mostra un avviso (CMP-15), con testi da scrivere in Fase 6? Deduzione dell'agente | Manuel Cucca | Sì | DEC-37 |
| SC-01 | Il ··· in alto a destra si chiama «Altre azioni»? Deduzione dell'agente | Manuel Cucca | Sì | |
| CMP-14, RB-48 | Nel campo nome un clic altrove conferma; un nome vuoto annulla? Deduzione dell'agente | Manuel Cucca | Sì | |
| FL-05 | Una nota trascinata sul titolo «Non organizzate» torna nella radice, una cartella sul titolo «Cartelle» va al primo livello? Deduzione dell'agente | Manuel Cucca | Sì | |
| SC-04 | Testi per cartella vuota e con una sola nota nella conferma di eliminazione definitiva? Deduzione dell'agente | Manuel Cucca | Sì | |
| SC-01, RB-67 | Con note ma nessuna aperta, «Nessuna nota aperta» con il testo del componente? Deduzione dell'agente | Manuel Cucca | Sì | |
