# Visione

<!-- Fase 1 della guida. Si compila all'inizio del progetto. -->

**Memodu** – Archivia le idee. Organizza i testi.

## Problema e contesto
Qual è il problema attuale? Come lo si risolve oggi, anche male?

Oggi si prendono appunti con le applicazioni di note esistenti, ognuna con pregi e difetti:
- alcune funzionano solo offline, altre solo nel cloud;
- alcune sono veloci ma poco strutturate, altre strutturate ma lente o poco affidabili;
- molte non sono cross-platform;
- altre tengono i dati "dentro" e non permettono di importarli o esportarli.

Chi le usa ogni giorno finisce per scendere a compromessi su velocità, struttura o controllo dei propri dati.

## Visione
Una frase che descrive il futuro che il prodotto rende possibile.

Un'applicazione di note cross-platform che mette la scrittura al primo posto: si apre all'istante, si scrive subito, e archiviazione e organizzazione vengono di conseguenza, con tutte le note sincronizzate e a portata di mano.

Memodu serve a prendere appunti e a produrre documenti formattati. Non impagina documenti e non è un programma di videoscrittura (ID-07).

## Obiettivi
Misurabili quando possibile.

Obiettivi della prima fase, riferiti all'uso da parte del proprietario dell'installazione (DEC-05).

| Obiettivo | Come si misura | Valore attuale | Valore atteso |
|---|---|---|---|
| Sostituire le app di note attuali | Giorni consecutivi in cui si usa solo Memodu per prendere note | 0 | 30 |
| Nessun dato perso | Note o modifiche perse, conflitti compresi (DEC-06) | — | 0 |
| Nota rapida come abitudine | Giorni in cui si usa la nota rapida (RF-01) almeno una volta | — | Ogni giorno |

## Vincoli
Budget, tempi, tecnologie imposte, integrazioni obbligatorie.

- Prima fase: solo modalità cloud, con un solo utente, limitata a scrittura e archiviazione (DEC-01).
- Prima fase: Windows, macOS e web (DEC-04).
- Prima fase: installazione personale con un solo account, senza registrazione pubblica (DEC-05).

## Assunzioni
Ciò che si dà per vero senza averlo verificato. Ogni assunzione è un rischio.

- L'obiettivo "solo Memodu per 30 giorni" si raggiunge anche senza app mobile (ID-11): le note si prendono da desktop o dal web.
- Il proprietario sa installare, aggiornare e fare il backup del server dell'installazione personale (DEC-05).
- Nel browser si possono decifrare e cercare tutte le note (RF-08, RF-10) con prestazioni accettabili.
- Sottolineato e impostazioni delle immagini si possono salvare in un markdown che altri programmi leggono ancora in modo accettabile (RF-02, RF-03, RF-13).

## Fuori dal progetto
Le esclusioni sono descritte nel registro idee (`docs/registri/idee.md`). Qui si elencano solo i codici.

- Parcheggiate: ID-01, ID-03, ID-04, ID-05, ID-06, ID-11, ID-12
- Rifiutate: ID-02, ID-07, ID-08
