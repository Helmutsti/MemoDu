# Interfaccia – Test e domande aperte

<!-- Fase 8 della guida. -->

## Piano di test
| Codice | Riferimento | Caso di prova | Ambiente | Set di dati | Esito |
|---|---|---|---|---|---|
| TC-00 | RF-00 criterio 1 | | Collaudo | | |
| TC-150 | RF-11 CA-11.1 | Ctrl + N con una nota aperta, con un file di Locale aperto, con il cestino e con le impostazioni aperti, con la colonna chiusa: ogni volta una nota nuova nella radice, aperta, pronta per scrivere | Locale | Note di prova | |
| TC-151 | RF-11 CA-11.2 | Ctrl + W su una nota, su una nota con Info aperta, su un file di Locale, sul cestino, sulle impostazioni: si chiude e l'area resta vuota; con l'area vuota niente | Locale | Note di prova | |
| TC-152 | RF-11 CA-11.3 | Colonna chiusa, cursore nella nota: Ctrl + K apre la colonna con il cursore nella ricerca; Esc richiude la colonna e il cursore torna nella nota; Ctrl + Maiusc + K apre la ricerca avanzata | Locale | Note di prova | |
| TC-153 | RF-11 CA-11.4 | Ctrl + \ fissa la colonna; ancora Ctrl + \ la rimette a scomparsa | Locale | — | |
| TC-154 | RF-11 CA-11.5 | Con la conferma di Svuota cestino aperta, poi con l'accesso aperto, poi con Info dal tasto destro: Ctrl + N, Ctrl + W, Ctrl + K e Ctrl + \ non fanno niente dietro; Esc e un clic sul velo chiudono | Locale | Note di prova | |
| TC-155 | RF-11 CA-11.6 | Tasto destro su una nota, su una cartella di CLOUD, su una cartella e un file di Locale, su un tag nei suggerimenti: le voci giuste; frecce, Invio ed Esc funzionano; un clic fuori chiude | Locale | Note e cartelle di prova, Prove locale | |
| TC-156 | RF-11 CA-11.7 | Trascinare una nota su una cartella, una cartella in un'altra, una nota sul titolo CLOUD, una nota sulla riga Cestino; un trascinamento annullato con Esc; una cartella su sé stessa: destinazione evidenziata, spostamenti giusti, niente cambiato dove annullato | Locale | Note e cartelle di prova | |
| TC-157 | RF-11 CA-11.8 | Le scorciatoie scritte nei menu e nelle voci (Chiudi nota, Chiudi file, ricerca) corrispondono a quelle che funzionano | Locale | — | |

## Domande aperte
| Riguarda | Domanda | Chi risponde | Risposta | Decisione |
|---|---|---|---|---|
| RF-11 | Le scorciatoie da tastiera sono personalizzabili dall'utente? | Manuel Cucca | Solo la scorciatoia globale della nota rapida; le altre sono fisse | |
| SC-01 | Con «Chiudi nota» (DEC-68), all'avvio si apre ancora la nota modificata più di recente, o la finestra ricorda se l'ultima volta era senza nota? | Manuel Cucca | Sì: all'avvio si apre ancora la modificata più di recente (30/09/2026) | DEC-68 |
| RF-12 | Su quali sistemi desktop gira l'app (Windows, macOS, Linux)? | Manuel Cucca | Windows e macOS | DEC-04 |
| RF-12 | Rientra nella prima fase, visto che DEC-01 la limita a "scrittura e stoccaggio"? | Manuel Cucca | No: rinviato dopo la prima fase (Should) | DEC-01 |
| SC-01, SC-03 | Nel frammento Must A la nota aperta nasconde la riga dei metadati (tag e data di modifica)? Deduzione dell'agente | Manuel Cucca | Sì: tutta la riga torna con i tag (RF-04), data compresa | |
