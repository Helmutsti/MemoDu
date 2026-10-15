# DEC-137 – Ricevere le novità ogni 20 secondi

**Data:** 2026-10-15 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
CA-10.1 e CA-10.14 vogliono una nota scritta su un dispositivo leggibile sull'altro entro 30 secondi. Con DEC-80 il dispositivo che scrive invia circa 3 s dopo la modifica e l'altro chiede le novità ogni 30 s: se le ha appena chieste, la nota aspetta il giro successivo e arriva oltre i 30 s. Nelle prove sul Mac del 15/10/2026, sul codice della 1.0 (DEC-128, DEC-136), i tempi di TC-127 su cinque prove sono stati 35, 9, 22, 15 e 22 s.

## Opzioni valutate
A) Chiedere le novità ogni 20 s: l'attesa più lunga è circa 3 s + 20 s + il tempo delle richieste, sotto i 30 s; al server arrivano circa il 50% di richieste in più.
B) Lasciare 30 s e cambiare i criteri in «di solito entro 30 secondi, al massimo 35».

## Decisione
Scelta di Manuel Cucca del 15/10/2026: **A**. Supera DEC-80 solo per il ritmo: le novità si chiedono ogni 20 s invece che ogni 30 s. Provata sul Mac sul codice della 1.0: su dieci prove la più lunga è di 21 s.

## Conseguenze
- `client/src-tauri/src/sincronizzazione.rs`: `INTERVALLO` a 20 s.
- `architettura/architettura.md`, sezione sulla sincronizzazione; guida per gli utenti, «Più computer».
- TC-127 da riprovare sulla testa di `main` prima del rilascio (DEC-136).
