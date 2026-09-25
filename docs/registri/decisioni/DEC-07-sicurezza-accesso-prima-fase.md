# DEC-07 – Sicurezza dell'accesso nella prima fase

**Data:** 2026-09-24 · **Stato:** Superata da DEC-13 · **Idea di origine:** —

## Contesto
L'installazione è personale ma raggiungibile da Internet, per permettere la versione web (DEC-04, DEC-05). Si resta collegati finché non si esce (RF-14). La password protegge sia l'accesso sia la cifratura end-to-end delle note (RNF-02).

## Opzioni valutate
Tentativi ripetuti: A) blocco temporaneo crescente; B) blocco dopo un numero di tentativi; C) nessun limite.
Password: A) almeno 12 caratteri; B) almeno 8 caratteri con complessità; C) nessun requisito.
Uscita: A) la copia di lavoro sul dispositivo viene cancellata; B) resta, cifrata.

## Decisione
- Nessun limite ai tentativi di accesso.
- Nessun requisito sulla password.
- Uscendo, la copia di lavoro sul dispositivo viene cancellata, dopo aver sincronizzato le modifiche in attesa.

## Conseguenze
- RB-41, RB-42, RB-43 in FL-08.
- Rischio accettato: senza limite ai tentativi e senza requisiti sulla password, chi raggiunge il server può provare password all'infinito, e una password debole indebolisce anche la cifratura delle note. Da rivalutare prima del servizio aperto al pubblico (ID-12).
