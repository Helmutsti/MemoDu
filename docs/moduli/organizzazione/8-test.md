# Organizzazione – Test e domande aperte

<!-- Fase 8 della guida. -->

## Piano di test
| Codice | Riferimento | Caso di prova | Ambiente | Set di dati | Esito |
|---|---|---|---|---|---|
| TC-00 | RF-00 criterio 1 | | Collaudo | | |

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
