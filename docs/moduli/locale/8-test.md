# Locale – Test e domande aperte

<!-- Fase 8 della guida. -->

## Piano di test
Scritto dall'agente e approvato da Manuel Cucca il 04/10/2026. Il set di dati «Prove locale» è in `architettura/ambienti.md`. Le prove del nucleo (percorsi, codifiche, a capo, nome dei file nuovi, cartelle nascoste) sono anche automatiche, in `client/src-tauri/src/locale_test.rs`.

| Codice | Riferimento | Caso di prova | Ambiente | Set di dati | Esito |
|---|---|---|---|---|---|
| TC-104 | RF-17 CA-17.1 | Aggiungere `prove-locale` con +: compare in ordine alfabetico; si vedono `appunti`, `progetto-x` e i file .md e .txt; non si vedono `.git` né `foto.jpg`. Sul secondo computer Locale è vuota | Locale | Prove locale | |
| TC-105 | RF-17 CA-17.2 | Aggiungere di nuovo `prove-locale` e poi `prove-locale/appunti`: nessuna riga in più, si evidenzia quella che c'è | Locale | Prove locale | |
| TC-106 | RF-17 CA-17.3 | Togli da Locale su `prove-locale`: sparisce; in Esplora file la cartella c'è ancora con tutti i file | Locale | Prove locale | |
| TC-107 | RF-17 CA-17.4 | Rinominare `prove-locale` da Esplora file: la riga diventa «non trovata»; rimettere il nome: torna piena | Locale | Prove locale | |
| TC-108 | RF-17 CA-17.5 | Aprire `riunione.txt`, scrivere: pallino nel percorso e nella riga; Ctrl + S: pallino via e il file in Blocco note ha il testo nuovo | Locale | Prove locale | |
| TC-109 | RF-17 CA-17.6 | Scrivere in `idee.md` senza salvare, aprire una nota, poi uscire da Memodu e riaprirlo: `idee.md` ha ancora il pallino e il testo nuovo; in Blocco note il file è quello di prima | Locale | Prove locale | |
| TC-110 | RF-17 CA-17.7 | Modificare e salvare `windows-crlf.txt` (a capo CRLF) e `con-bom.md` (BOM UTF-8): confronto dei byte, a capo e BOM come prima | Locale | Prove locale | |
| TC-111 | RF-17 CA-17.8 | Aprire `vecchio-elenco.txt` (Windows-1252, «Città», «Società»): accenti giusti; Ctrl + S: avviso una volta; il file è UTF-8 | Locale | Prove locale | |
| TC-112 | RF-17 CA-17.9 | + su `appunti`, scrivere «Lista per il trasloco», Ctrl + S: nasce `Lista per il trasloco.md`; di nuovo con lo stesso testo: `Lista per il trasloco 2.md`; prima del Ctrl + S il file non c'è | Locale | Prove locale | |
| TC-113 | RF-17 CA-17.10 | Nuova cartella, rinomina, trascinamento di un file in un'altra cartella dell'elenco, nome con `:` e nome già usato: sul disco come in Memodu; i due nomi sbagliati rifiutati con il motivo | Locale | Prove locale | |
| TC-114 | RF-17 CA-17.11 | Eliminare `spesa.md`: è nel Cestino di Windows e si ripristina da lì. Su una chiavetta o un disco di rete: prima la conferma «Eliminare per sempre» | Locale | Prove locale, una chiavetta | |
| TC-115 | RF-17 CA-17.12 | Da Esplora file creare, rinominare ed eliminare un file in `appunti`: la colonna si aggiorna entro 2 s | Locale | Prove locale | |
| TC-116 | RF-17 CA-17.13 | Con `riunione.txt` aperto, cambiarlo in Blocco note e salvare: avviso; Ricarica mostra il testo di Blocco note. Di nuovo con Tieni la mia versione: resta il mio testo e Ctrl + S lo scrive | Locale | Prove locale | |
| TC-117 | RF-17 CA-17.14 | Con `riunione.txt` aperto e modificato, eliminarlo da Esplora file: avviso; Ricrealo e Ctrl + S lo fanno rinascere; di nuovo con Chiudi: file chiuso, niente pallino | Locale | Prove locale | |
| TC-118 | RF-17 CA-17.15 | Aprire `grande.txt` (24 MB): messaggio «troppo grande». Aprire `sola-lettura.md` (attributo di sola lettura): si legge, non si scrive, con il motivo | Locale | Prove locale | |
| TC-119 | RF-17 CA-17.16 | Con `riunione.txt` aperto in un programma che lo blocca, Ctrl + S: avviso con il motivo, file intatto, pallino ancora lì | Locale | Prove locale | |
| TC-120 | RF-17 CA-17.17 | Prova automatica del nucleo: leggere e scrivere `..\\fuori.txt` e un collegamento simbolico che punta fuori: 400 in tutti e due i casi | Locale | Cartella temporanea | |
| TC-121 | RF-17 CA-17.18 | Usare Locale con la sincronizzazione attiva, poi leggere l'archivio del server: nessun elemento di Locale | Produzione | Prove locale | |

## Domande aperte
| Riguarda | Domanda | Chi risponde | Risposta | Decisione |
|---|---|---|---|---|
| — | Nessuna | | | |
