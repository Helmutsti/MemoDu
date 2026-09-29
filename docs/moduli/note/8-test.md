# Note – Test e domande aperte

<!-- Fase 8 della guida. -->

## Piano di test
| Codice | Riferimento | Caso di prova | Ambiente | Set di dati | Esito |
|---|---|---|---|---|---|
| TC-01 | RF-01 CA-01.1 | Da un altro programma premere la scorciatoia: SC-02 compare entro 0,2 s con il cursore pronto | Locale | Nessuna nota | |
| TC-02 | RF-01 CA-01.2 | Scrivere in una nota rapida e chiuderla con Salva, poi con Esc per chiudere, poi con il tasto Esc, poi con un clic fuori: ogni volta la nota è in cima all'elenco | Locale | Quattro note di prova | |
| TC-03 | RF-01 CA-01.3 | Aprire e chiudere una nota rapida senza scrivere: l'elenco non cambia | Locale | Una nota di prova | |
| TC-04 | RF-01 CA-01.4 | Con una nota rapida aperta premere di nuovo la scorciatoia, tre volte: finestre a cascata di 32 px, le precedenti salvate | Locale | Nessuna nota | |
| TC-05 | RF-01 CA-01.5 | Con una nota aperta nel programma, scegliere Apri nel programma dalla freccia di Salva di una nota rapida: la prima è salvata e chiusa, la rapida la sostituisce | Locale | Una nota di prova aperta | |
| TC-06 | RF-01 CA-01.6 | Dall'icona nell'area di notifica (Windows) o nella barra dei menu (macOS) aprire la nota rapida e il programma | Locale | — | |
| TC-07 | RF-01 CA-01.7 | Spegnere il server, scrivere in una nota rapida: compare SC-07; avviare il server e premere Riprova: la nota è salvata con tutto il testo | Locale | Server spento | |
| TC-08 | RF-01 CA-01.8 | Con SC-07 visibile chiudere la nota rapida: compare la conferma; Annulla lascia il testo, Chiudi comunque chiude | Locale | Server spento | |
| TC-09 | RF-02 CA-02.1 | Premere + e Nuova nota: nasce una nota vuota in cima con il cursore nel corpo; lasciata vuota aprendo un'altra nota sparisce dall'elenco e dal disco; con del testo resta | Locale | Nessuna nota e poi tre note | |
| TC-10 | RF-02 CA-02.2 | Scrivere ogni sintassi markdown prevista: il testo si formatta, i simboli restano solo sulla riga del cursore | Locale | Nota vuota | |
| TC-11 | RF-02 CA-02.3 | Applicare le quattro scorciatoie su una parola; controllare nel file che il sottolineato sia `<u>…</u>` | Locale | Nota con testo | |
| TC-12 | RF-02 CA-02.4 | Selezionare testo, cliccare sul vuoto, scrivere / su riga vuota: compaiono pillole e menu giusti, senza Immagine; spariscono scrivendo, con Esc e con un clic altrove | Locale | Nota con testo | |
| TC-13 | RF-02 CA-02.5 | Solo tastiera: Alt + F10 porta sulla pillola, frecce tra gli strumenti, Esc torna al testo; controllo con un lettore di schermo (RNF-04) | Locale | Nota con testo | |
| TC-14 | RF-02 CA-02.6 | Tasto destro sul testo: voci e scorciatoie del menu Testo, sottomenu Titolo ed Elenco | Locale | Nota con testo | |
| TC-15 | RF-02 CA-02.7 | Scrivere e fermarsi 2 s; poi cambiare nota, chiudere, passare a un'altra finestra: ogni volta il file è aggiornato e la nota sale in cima | Locale | Tre note di prova | |
| TC-16 | RF-02 CA-02.8 | Incollare testo da Word, da una pagina web e da un'email: entra senza formattazione | Locale | Testi di prova formattati | |
| TC-17 | RF-02 CA-02.9 | Scrivere e incollare `<script>` e HTML con eventi: niente viene eseguito | Locale | Testi malevoli di prova | |
| TC-18 | RF-02 CA-02.10 | Nota senza titolo con testo, e nota senza titolo né testo: nell'elenco le prime parole e «Nota vuota» | Locale | Due note di prova | |
| TC-19 | RF-02 CA-02.11 | Fare testo, formattazione e cancellazioni, poi Ctrl + Z più volte: ogni modifica si annulla in ordine | Locale | Nota con testo | |
| TC-20 | RF-02 CA-02.12 | Chiudere a forza il programma e poi il server durante la scrittura; riaprire: c'è l'ultimo salvataggio e il file si apre | Locale | Nota con testo | |
| TC-21 | RF-02 CA-02.13 | Server spento o errore di scrittura (cartella in sola lettura, nota oltre 10 MB, file tolto): SC-07, testo in memoria, conferma alla chiusura | Locale | Server spento, nota da 11 MB | |
| TC-22 | FL-01 × SF-01, SF-04 | Scorciatoia ripetuta con note rapide aperte (vedi CA-01.4) | Locale | Nessuna nota | |
| TC-23 | FL-01 × SF-02 | Chiudere la finestra senza scegliere: nota salvata (vedi CA-01.2) | Locale | — | |
| TC-24 | FL-01 × SF-16 | Nota rapida chiusa vuota (vedi CA-01.3) | Locale | — | |
| TC-25 | FL-01 × SF-30 | Server spento durante la nota rapida (vedi CA-01.7, CA-01.8) | Locale | Server spento | |
| TC-26 | FL-02 × SF-02 | Chiudere il programma mentre si scrive: modifiche salvate | Locale | Nota con testo | |
| TC-27 | FL-02 × SF-06 | Incollare testo formattato (vedi CA-02.8) | Locale | — | |
| TC-28 | FL-02 × SF-10 | Sospendere il computer durante la scrittura: si perde al massimo l'ultima pausa | Locale | Nota con testo | |
| TC-29 | FL-02 × SF-30, SF-32 | Server spento ed errori di scrittura (vedi CA-02.12, CA-02.13) | Locale | — | |
| TC-30 | FL-02 × SF-36 | Input malevolo (vedi CA-02.9) | Locale | — | |
| TC-31 | FL-09 × SF-01 | Premere + più volte di fila: nasce una nota vuota a ogni clic, restano tutte | Locale | Nessuna nota | |
| TC-32 | FL-09 × SF-16 | Nuova nota lasciata vuota (vedi CA-02.1) | Locale | — | |

Frammento Must A. Ambiente Locale, l'unico della prima fase (`architettura/ambienti.md`); set di dati inventati, senza dati personali reali. FL-09 × SF-20 riguarda la sincronizzazione ed è fuori da Must A.

## Domande aperte
| Riguarda | Domanda | Chi risponde | Risposta | Decisione |
|---|---|---|---|---|
| RF-01 | La scorciatoia è globale di sistema (funziona anche con l'app chiusa o in background)? Esiste un equivalente su mobile? | Manuel Cucca | Desktop: scorciatoia globale con Memodu in background. Web: nessuna nota rapida. Mobile rinviato | DEC-04 |
| RF-02 | "Lined" nel testo originale significa barrato, oppure altro (linea orizzontale, evidenziato)? | Manuel Cucca | Barrato. Aggiunti anche titoli ed elenchi; i link esterni non servono nella prima fase | |
| RF-02 | Il sottolineato non fa parte del markdown standard: come viene salvato nel file? | Manuel Cucca | Come tag HTML `<u>testo</u>` | DEC-28 |
| RF-02 | Serve anche la nota in testo semplice (ID-01)? | Manuel Cucca | Non ora: ID-01 parcheggiata | |
| RF-04 | Gli hashtag dei metadati sono gli stessi tag di RF-06? | Manuel Cucca | Sì. Si chiamano solo "tag", mai "hashtag". RF-06 torna Must | |
| RF-04 | Cosa succede a una nota quando supera la data di fine validità? | Manuel Cucca | Nessun effetto | |
| RF-04 | Tra data di creazione di sistema e data scelta dall'utente, quale si mostra? | Manuel Cucca | Quella dell'utente; se manca, quella di sistema. La data di sistema resta sempre visibile nei dettagli. Le date non servono a ordinare | |
| RF-01 | Nello scenario: "se ci fosse già aperta un'altra scheda viene messa da parte". Quale scheda: una nota aperta nel programma completo o un'altra nota rapida? Cosa vuol dire "messa da parte"? | Manuel Cucca | Una nota alla volta: la nota aperta viene salvata e chiusa, e al suo posto si apre la nota rapida. Nessuna scheda | |
| RF-02, RF-03 | Quali sono le "impostazioni in stile Word" sull'immagine (dimensione, allineamento, ritaglio, didascalia…)? Attenzione a non sconfinare nell'impaginazione, rifiutata (ID-07) | Manuel Cucca | Dimensione, allineamento, ritaglio | |
| RF-03 | Il testo alternativo delle immagini non è stato scelto, ma WCAG 2.1 AA (RNF-04) lo richiede: va aggiunto? | Manuel Cucca | Sì: di default il nome del file, modificabile nelle impostazioni dell'immagine | |
| RF-03 | Dimensione, allineamento e ritaglio non sono previsti dal markdown standard: come si salvano senza rompere l'esportazione (RF-13)? Da decidere in Fase 7 | | | |
| RF-03 | Il ritaglio e la rotazione modificano l'immagine originale o si possono annullare in seguito? (Principio: nessun dato perso, DEC-06) | Manuel Cucca | No: sono reversibili, l'originale resta intatto | |
| EN-02 | Eliminando una nota, le sue immagini la seguono nel cestino e tornano con lei se viene ripristinata? | Manuel Cucca | Sì, anche nell'eliminazione definitiva (RB-58) | |
| RF-02 | Il comando Annulla (Ctrl+Z / Cmd+Z) vale per tutte le modifiche della nota aperta, non solo per le immagini tolte (RB-46)? | Manuel Cucca | Sì, tutte le modifiche della nota aperta (RB-59) | |
| SC-02 | La nota rapida si apre a 480 × 320 come nel wireframe, o più grande ("circa un quarto di schermo")? Deduzione dell'agente | Manuel Cucca | 480 × 320, ridimensionabile | |
| SC-02, CMP-01 | La freccia del pulsante diviso «Salva» si chiama «Altre azioni» (nome per i lettori di schermo e suggerimento)? Deduzione dell'agente | Manuel Cucca | Sì, «Altre azioni» | DEC-34 |
| RF-01 | Nel frammento Must A la scorciatoia si può cambiare, visto che le impostazioni (SC-06) non ci sono? | Manuel Cucca | No: fissa fino al frammento Must; con un conflitto la nota rapida si apre dall'icona | |
| RF-04, SC-03 | Dove si vedono i dettagli della singola nota (date di creazione di sistema e scelta, ultima modifica, fine validità, cartella)? RF-04 dice «sempre visibile nei dettagli della nota», ma nessuna schermata ha un posto per i dettagli: il wireframe mette solo i tag sotto il titolo e le date in un pannello del `···`. Segnalato da Manuel Cucca il 29/09/2026 | Manuel Cucca | | |
