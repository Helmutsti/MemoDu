# DEC-77 – Versioni precedenti a scalare per 30 giorni

**Data:** 2026-09-30 · **Stato:** Accettata (i 30 giorni sono superati da DEC-113: 7 giorni) · **Idea di origine:** —

## Contesto
Con DEC-75 il server tiene le versioni precedenti di ogni blocco. Con il salvataggio dopo 2 s di pausa (RB-06) ogni sincronizzazione riuscita crea una versione: una nota scritta a lungo ne produce molte.

## Opzioni valutate
A) A scalare per 30 giorni: tutte nell'ultima ora, una all'ora nell'ultimo giorno, una al giorno fino a 30 giorni.
B) Le ultime N versioni per elemento.
C) Tutte, per sempre.

## Decisione
Scelta di Manuel Cucca: **A**. Il server sfoltisce da solo guardando solo versione e ora, senza leggere il contenuto. La versione attuale resta sempre.

Proposta dell'agente, da confermare: anche un elemento eliminato per sempre (blocco «eliminato», DEC-76) conserva le sue versioni precedenti per 30 giorni, così si può ancora recuperare.

## Conseguenze
- `architettura/architettura.md`, sezione sulla sincronizzazione.
- Lo spazio sul server resta proporzionato alle note; con le immagini (RF-03) si rivaluta.
- Come l'utente vede e ripristina una versione precedente resta da decidere con i requisiti.
