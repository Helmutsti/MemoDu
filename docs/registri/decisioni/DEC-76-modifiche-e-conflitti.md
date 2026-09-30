# DEC-76 – Come si riconoscono modifiche e conflitti

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-75 ogni elemento viaggia come un blocco cifrato con una versione, e il server tiene le versioni precedenti. Restano da stabilire come si riconosce che un elemento è cambiato altrove e cosa vuol dire «più recente» nei conflitti di RB-36 (eliminata e modificata), RB-37 (spostata in due posti) e RB-38 (rinominata in due modi). Gli orologi dei dispositivi possono essere sbagliati (SF-14).

## Opzioni valutate
Per «più recente»: A) l'ora della modifica sul dispositivo, in UTC; B) l'ordine di arrivo al server.

## Decisione
Scelta di Manuel Cucca: **A**. Ogni modifica porta, dentro il blocco cifrato, l'istante UTC in ISO 8601 (DEC-28) in cui è stata fatta sul dispositivo; nei conflitti di RB-36, RB-37 e RB-38 vince l'istante più tardo. Il fuso orario non conta (SF-14).

Proposte dell'agente, da confermare:
- **Server:** ogni blocco ha una versione; ogni scrittura riuscita riceve anche un numero d'ordine globale crescente. «Cosa è cambiato dopo il numero N» è l'elenco delle modifiche da ricevere.
- **Dispositivo:** per ogni elemento tiene la versione ricevuta l'ultima volta, il suo contenuto (la base) e il segno «modificato qui».
- **Invio:** l'elemento con la versione da cui parte; il server lo accetta solo se è ancora a quella versione, altrimenti rifiuta e manda la versione attuale.
- **Conflitto:** il client confronta campo per campo base, versione del server e versione propria. Un campo cambiato da una parte sola si prende; il testo cambiato da entrambe le parti fa nascere la nota in conflitto (DEC-06, RB-39); spostamenti, eliminazioni e rinomine seguono RB-36, RB-37, RB-38 e RB-30.
- **Eliminazione definitiva:** diventa un blocco «eliminato», così anche gli altri dispositivi la ricevono.

## Conseguenze
- Rischio accettato: con l'orologio di un dispositivo molto sbagliato può vincere lo spostamento, l'eliminazione o la rinomina sbagliati; il testo non si perde mai, perché i conflitti di testo tengono tutte e due le versioni.
- Risolto il rinvio sul confronto «più recente» tra dispositivi (SF-14).
- `architettura/architettura.md`, sezione sulla sincronizzazione.
