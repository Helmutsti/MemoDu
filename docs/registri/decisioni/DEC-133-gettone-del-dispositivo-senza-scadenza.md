# DEC-133 – Un gettone per dispositivo, senza scadenza, controllato a ogni richiesta

**Data:** 2026-10-14 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-121 prevedeva, per l'architettura finale dell'accesso, un JWT di 15 minuti e un gettone di rinnovo di 90 giorni ruotato a ogni uso. Con DEC-132 l'accesso di un dispositivo non scade più e si chiude solo uscendo, a distanza (RF-16) o con un cambio della password che scollega gli altri dispositivi. La chiusura a distanza deve valere al contatto successivo (FL-15).

## Opzioni valutate
A) JWT di 15 minuti più gettone di rinnovo senza scadenza, ruotato a ogni uso: due gettoni, il rinnovo ogni 15 minuti, e una risposta persa durante la rotazione scollega il dispositivo se il server non tiene anche il gettone precedente; la chiusura a distanza vale entro 15 minuti.
B) Un solo gettone opaco per dispositivo (32 byte casuali), senza scadenza; il server ne tiene l'impronta SHA-256 nella riga del dispositivo e la cerca a ogni richiesta.
C) Come B, ruotato ogni tanto.

## Decisione
B, proposta dell'agente e scelta da Manuel Cucca il 14/10/2026: è il meccanismo più semplice che fa tutto quello che chiedono DEC-132 e FL-15. La chiusura a distanza vale subito, perché ogni richiesta cerca il dispositivo nel database; non c'è rinnovo, quindi nessuna risposta persa può scollegare un dispositivo. Il gettone sta solo nel portachiavi del sistema e viaggia solo su HTTPS; chi lo ruba da un computer sbloccato ha comunque già la copia di lavoro in chiaro (rischio accettato in DEC-121). Il segreto `MEMODU_SEGRETO` resta solo per il sale finto delle email sconosciute.

## Conseguenze
- Supera, di DEC-121, il JWT e il gettone di rinnovo dell'architettura finale; RB-97 resta com'è.
- `architettura/architettura.md` (Sicurezza, Account nel database) e `architettura/api.md` (Accesso con gli account).
- Al primo avvio della versione nuova la sessione salvata con il JWT non vale più: ogni dispositivo di Manuel Cucca rifà l'accesso una volta.
