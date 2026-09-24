# Sincronizzazione – Test e domande aperte

<!-- Fase 8 della guida. -->

## Piano di test
| Codice | Riferimento | Caso di prova | Ambiente | Set di dati | Esito |
|---|---|---|---|---|---|
| TC-00 | RF-00 criterio 1 | | Collaudo | | |

## Domande aperte
| Riguarda | Domanda | Chi risponde | Risposta | Decisione |
|---|---|---|---|---|
| RF-10 | Senza connessione l'utente può comunque scrivere? La modalità offline è parcheggiata (ID-06), ma la velocità di scrittura (RNF-01) lo richiederebbe. | Manuel Cucca | Sì: scrive sulla copia di lavoro e sincronizza quando torna la rete | DEC-02 |
| RF-10 | Come si risolvono le modifiche fatte sulla stessa nota da due dispositivi (SF-22)? | Manuel Cucca | Si salvano entrambe le versioni (la risposta precedente, "vince l'ultima", è superata) | DEC-06 |
| RF-10 | Come vengono presentate all'utente le due versioni in conflitto? | Manuel Cucca | L'altra versione diventa una nota indipendente, con lo stesso titolo seguito da "(copia in conflitto)" (RB-39, SC-03) | DEC-06 |
| RF-10 | Anche con un solo utente serve un account con accesso autenticato: con quale metodo? | Manuel Cucca | Installazione personale, un solo account, accesso con email e password | DEC-05 |
| RF-10 | Se l'utente perde la password o la chiave di cifratura, le note sono recuperabili? | Manuel Cucca | Rimandata: da decidere prima che RF-10 sia Pronto (Definition of Ready) | |
| RF-10 | Dove compare la nota nata dal conflitto e come si riconosce? | Manuel Cucca | Nella stessa cartella dell'originale, con titolo + dispositivo e ora | DEC-06 |
| EN-06 | Dopo che un dispositivo è uscito, resta nell'elenco dei dispositivi o sparisce? Serve un elenco dei dispositivi collegati, per esempio per far uscire a distanza un browser dimenticato aperto (SF-26)? | Manuel Cucca | L'elenco con uscita a distanza diventa RF-16 (Should). Nella prima fase non c'è; se il dispositivo uscito resti registrato si decide con RF-16 | |
