# DEC-09 – Pacchetti, stato della documentazione e disegni

**Data:** 2026-09-24 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Dopo le prime tre fasi sono emersi tre limiti del metodo:
- lo stato dei requisiti ("In progettazione") non dice in quale fase si trovano, e la colonna "posizione" del registro idee non regge quando un'idea si divide in più requisiti;
- lo stato della documentazione, i rinvii e le deduzioni da confermare vivevano solo nei messaggi di commit e nelle conversazioni: chi riprende il lavoro da un altro computer non li trova;
- la guida non diceva come far convivere i disegni (Fasi 4–6), che non si fanno in un file di testo, con la documentazione nel repository.

## Opzioni valutate
A) Lasciare la guida com'è e affidarsi ai messaggi di commit.
B) Aggiornare la guida: fase in ogni requisito, criteri di completamento per frammento, un file con lo stato della documentazione, regole per i disegni.

## Decisione
Opzione B.
- Ogni requisito indica la **fase** in cui si trova; i criteri di completamento si valutano per **frammento** di pacchetto.
- Nasce `docs/avanzamento.md`: stato di pacchetti e frammenti, rinvii, deduzioni da confermare, rischi accettati. Non è fotografia né registro: si sovrascrive e non va nello storico.
- I disegni vivono nello strumento di design; nel repository vanno link, esportazioni in `moduli/*/immagini/` e tutte le decisioni.
- `AGENTS.md` descrive come si conduce una fase con una persona.

## Conseguenze
- Aggiornati `docs/guida-documentazione.md`, il modello `moduli/_modello-modulo/1-requisiti.md` e `AGENTS.md`.
- Tutti i requisiti riportano la fase: 4 per il frammento Must della prima fase, 1 per il frammento Should.
- Nel registro idee la colonna "posizione" elenca i codici dei requisiti.
- La scelta dello strumento di design si fa alla ripresa della Fase 4.
