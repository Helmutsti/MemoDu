# DEC-25 – Archivio del server su file system

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con la cifratura end-to-end (DEC-08) il server non cerca e non ordina: conserva documenti opachi (identificativo, versione, data, dimensione, blocco cifrato) e le immagini cifrate. Serve un posto dove tenerli.

## Opzioni valutate
A) File system: ogni documento e ogni immagine cifrati sono file su disco. Nessun database da installare, backup copiando una cartella.
B) Database documentale (DynamoDB, MongoDB): comodo per le versioni e l'elenco delle modifiche, ma un servizio in più.
C) Oggetti su cloud (S3 o Blob) più un piccolo indice.

## Decisione
Opzione A, scelta da Manuel Cucca: la più semplice per un solo utente.

## Conseguenze
- `architettura/architettura.md`: archivio del server su file system.
- L'hosting, rinviato, deve offrire un disco che resta tra un avvio e l'altro (un computer, un NAS, una VPS o un container con volume): le funzioni serverless pure non lo hanno.
- Rinviati alla Fase 7: come si organizzano i file (cartelle, nomi, versioni), come si tiene l'elenco delle modifiche, backup.
