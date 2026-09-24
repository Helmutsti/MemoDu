# DEC-06 – Conflitti di sincronizzazione senza perdita di dati

**Data:** 2026-09-24 · **Stato:** Accettata · **Idea di origine:** ID-10

## Contesto
DEC-03 aveva stabilito che, nei conflitti tra dispositivi, vince la modifica più recente, accettando il rischio di perdere testo senza avviso. Scrivendo lo scenario d'uso di RF-10 è emerso che questo rischio è inaccettabile: "la perdita dei dati è inconcepibile".

## Opzioni valutate
A) Mantenere DEC-03: vince l'ultima modifica.
B) Salvare entrambe le versioni in conflitto.
C) Chiedere all'utente di scegliere o unire le versioni.
D) Unione automatica (CRDT).

## Decisione
Opzione B. Se la stessa nota è stata modificata su due dispositivi, il programma salva entrambe le versioni. È una soluzione rudimentale, ma garantisce che nessun dato vada perso. Supera DEC-03.

## Conseguenze
- DEC-03 passa a *Superata da DEC-06*.
- RF-10: la regola "vince l'ultima modifica" è sostituita da "si salvano entrambe le versioni".
- ID-10 passa ad *Accettata*, in RF-10.
- Resta da definire come le due versioni vengono presentate all'utente (domanda aperta su RF-10).
