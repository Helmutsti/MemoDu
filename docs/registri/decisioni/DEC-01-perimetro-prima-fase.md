# DEC-01 – Perimetro della prima fase

**Data:** 2026-09-24 · **Stato:** Accettata · **Idea di origine:** ID-05, ID-06

## Contesto
La visione prevede un'app cross-platform, sincronizzata, con più utenti e più modalità di lavoro. Affrontare tutto insieme allungherebbe i tempi prima di avere un prodotto usabile.

## Opzioni valutate
A) Progettare subito tutte le modalità: cloud e offline, più utenti.
B) Partire solo con la modalità cloud e un solo utente, limitandosi a scrittura e archiviazione.

## Decisione
Opzione B. Nella prima fase Memodu funziona solo in modalità cloud, con un solo utente, e si concentra su scrittura e archiviazione. Il database non deve prevedere più utenti.

## Conseguenze
- ID-05 (più utenti) e ID-06 (modalità offline o locale) passano a *Parcheggiata*.
- Destinatari: un solo ruolo, *Utente*.
- RF-10: la sincronizzazione cloud è la modalità di archiviazione.
- Resta da chiarire quali requisiti rientrano in "scrittura e archiviazione" (vedi domande aperte su RF-07, RF-09, RF-12).
