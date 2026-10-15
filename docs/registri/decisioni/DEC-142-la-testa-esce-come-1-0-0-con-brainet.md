# DEC-142 – La testa esce come 1.0.0, con Brainet

**Data:** 2026-10-15 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Con DEC-136 la 1.0.0 del ramo `rilascio/1.0` non esce e il prossimo rilascio parte dalla testa di `main`, da collaudare sul Mac. La testa contiene le novità pensate per la 1.1.0 (Markdown), per la 1.2.0 (account) e Brainet (RF-18), che era previsto «nella versione dopo la 1.2.0»; le note di rilascio avevano tre blocchi in coda. Il collaudo sul Mac della testa del 15/10/2026 è passato, con due correzioni di testo (DEC-140, DEC-141).

## Opzioni valutate
Numero: la testa esce come 1.0.0, senza le versioni intermedie. Per Brainet:
A) Esce così com'è: spento all'inizio, si accende nelle Impostazioni.
B) Esce nascosto: l'interruttore non si vede.
C) Si toglie dalla testa prima del tag.

## Decisione
Scelte di Manuel Cucca del 15/10/2026: la testa esce come **1.0.0**, senza 1.1.0 e 1.2.0; Brainet **A**, esce spento e da accendere. Supera la priorità di RF-18 «nella versione dopo la 1.2.0» e la coda di versioni nelle note di rilascio.

## Conseguenze
- `CHANGELOG.md`: un solo blocco «Non rilasciato» che diventerà la 1.0.0, rispetto alla 0.1.13, con Brainet.
- Guida per gli utenti: sezione «Brainet, il diario a rete» e riga nelle Impostazioni (scritte dall'agente, da approvare).
- RF-18: priorità nella 1.0.0. Runbook: si pubblica dalla testa con il tag.
- Al rilascio la versione passa da 1.1.0 a 1.0.0 nei file di versione (runbook, passo 1).
