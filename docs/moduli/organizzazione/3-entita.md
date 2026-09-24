# Organizzazione – Entità

<!-- Fase 3 della guida. -->

## Diagramma ER
Il diagramma di tutto il sistema è in `moduli/note/3-entita.md`.

## EN-03 – Cartella
**Descrizione:** contenitore dell'albero che dà a una nota la sua collocazione fisica (RF-05).

| Attributo | Tipo | Obbligatorio | Vincoli | Note |
|---|---|---|---|---|
| Identificativo | Codice | Sì | Unico e stabile: non cambia se la cartella viene rinominata o spostata | Tecnico, non visibile |
| Nome | Testo | Sì | Unico tra le cartelle sorelle (RB-23) | Di default "Nuova cartella", da cambiare (RB-48) |
| Cartella madre | EN-03 | No | Non può essere la cartella stessa né una sua sottocartella (RB-24) | Vuota se la cartella è al primo livello |
| Posizione | albero \| cestino | Sì | | Stato del diagramma di FL-05 |

- **Chi la crea:** l'utente (FL-05); il sistema, quando una rinomina in conflitto genera la cartella vuota di segnalazione (RB-38).
- **Chi la modifica:** l'utente; il sistema, applicando le modifiche arrivate dagli altri dispositivi (FL-07).
- **Cancellazione:** archiviazione nel cestino con tutto il contenuto (RB-25); definitiva solo svuotando il cestino (RB-27, RB-32). Può tornare dal cestino da sola se riceve una nota da un altro dispositivo (RB-30).
- **Dati sensibili:** nome e posizione nell'albero sono cifrati end-to-end (DEC-08).

## EN-04 – Tag
**Descrizione:** etichetta che raggruppa le note in modo trasversale alle cartelle, organizzata in gerarchia (RF-06).

| Attributo | Tipo | Obbligatorio | Vincoli | Note |
|---|---|---|---|---|
| Identificativo | Codice | Sì | Unico e stabile | Tecnico, non visibile |
| Nome | Testo | Sì | Unico senza distinguere maiuscole e minuscole; spazi, accenti ed emoji ammessi (RB-22) | Si mostra come è stato scritto la prima volta |
| Tag padre | EN-04 | No | | I livelli si scrivono separati da `/` (RB-18) |

- **Chi lo crea:** l'utente, scrivendolo (RB-17).
- **Chi lo modifica:** l'utente; il sistema, applicando le modifiche arrivate dagli altri dispositivi (FL-07).
- **Cancellazione:** definitiva, solo a mano, dopo una conferma; viene tolto dalle note e i sotto-tag seguono la stessa sorte (RB-19). Un tag che nessuna nota usa più continua a esistere (RB-49).
- **Dati sensibili:** il nome è cifrato end-to-end (DEC-08).
