# Note – Test e domande aperte

<!-- Fase 8 della guida. -->

## Piano di test
| Codice | Riferimento | Caso di prova | Ambiente | Set di dati | Esito |
|---|---|---|---|---|---|
| TC-00 | RF-00 criterio 1 | | Collaudo | | |

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
