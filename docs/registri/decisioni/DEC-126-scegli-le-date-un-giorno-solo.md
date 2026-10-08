# DEC-126 – «Scegli le date…» nei filtri della ricerca sceglie un giorno solo

**Data:** 2026-10-08 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Scrivendo la guida per gli utenti (Fase 9) è emerso che CA-08.7 e CA-08.18 dicono che con «Scegli le date…» il periodo si sceglie sul calendario, mentre il codice della 0.1.13 sceglie un giorno solo: la pillola mostra per esempio «Creazione: 12/09/2026» ed escono le note di quel giorno. Il calendario è CMP-12, lo stesso delle righe di data di Info, che sceglie una data.

## Opzioni valutate
- A) Un giorno solo, come fa il codice: si correggono i criteri; per i periodi restano «Ultimi 7 giorni», «Ultimi 30 giorni» e «Quest'anno».
- B) Un periodo con inizio e fine: si riprendono CMP-12 in Figma, il codice e la prova.

## Decisione
Scelta di Manuel Cucca del 08/10/2026: **A**. Per la v1 personale i periodi più usati sono già nel menu e un giorno preciso basta a ritrovare una nota; il periodo libero, se servirà, diventerà un'idea nuova.

## Conseguenze
- `moduli/organizzazione/1-requisiti.md`: CA-08.7 e CA-08.18 dicono che «Scegli le date…» sceglie un giorno sul calendario.
- `design-system/componenti.md`: CMP-09 e CMP-29 lo dicono allo stesso modo.
- Codice e guida per gli utenti restano come sono.
