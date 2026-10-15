# DEC-135 – Allegati di Brainet su Cloudflare R2

**Data:** 2026-10-15 · **Stato:** Accettata · **Idea di origine:** RF-18 (allegati)

## Contesto
Le note Brainet hanno allegati, foto e documenti fino a 25 MB (RF-18, RB-115). Le note stanno nel database Neon dietro il server su Vercel, che accetta circa 4,5 MB per richiesta; i file sono cifrati sul dispositivo e occupano molto più spazio delle note.

## Opzioni valutate
A) Neon per tutto, i file a pezzi da 4 MB nel database.
B) Neon per le note e un deposito di file: Vercel Blob, Amazon S3 o Cloudflare R2.
C) Tutto su un servizio unico (Supabase, AWS), migrando note, account e dispositivi.

## Decisione
B con Cloudflare R2, scelta di Manuel Cucca del 15/10/2026: le note restano su Neon, che funziona e ha appena ricevuto gli account (DEC-132); i file vanno in un deposito a parte, che il dispositivo raggiunge direttamente, senza il limite di Vercel. Il server tiene solo l'elenco degli allegati per account e dà al dispositivo indirizzi firmati e di breve durata per caricare e scaricare.

## Conseguenze
- Servizio nuovo: un account Cloudflare con un bucket R2 e una chiave di accesso; le quattro variabili `MEMODU_R2_*` su Vercel (le crea Manuel Cucca, l'agente non le legge).
- Architettura e API: sezione «Allegati» in `architettura/architettura.md` e `architettura/api.md`.
- Runbook: il servizio nuovo da controllare e cosa fare se non risponde.
