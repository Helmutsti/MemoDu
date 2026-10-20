# DEC-165 – I caratteri scritti restano quelli che sono

**Data:** 2026-10-20 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
In vista Markdown (DEC-58, DEC-130) i simboli spariscono appena il markdown li riconosce, ma mentre si scrive `**ciao` gli asterischi si vedono finché la coppia non è chiusa. Sul telefono Manuel Cucca li ha visti: «non si deve mai vedere la formattazione. deve essere come word… come le note apple deve funzionare».

## Opzioni valutate
A) Come Word: scrivendo `**` (o `*`, `~~`) il formato parte subito, senza mostrare i simboli.
B) Come Note di Apple: l'asterisco è solo un asterisco; grassetto, corsivo e barrato si mettono solo con la bollicina dei formati.

## Decisione
B, scelta di Manuel Cucca del 20/10/2026, sul computer e sul telefono (lo stesso editor, DEC-162). In vista Markdown un asterisco, un trattino basso, una tilde, un apice inverso, un «<» e un «#» a inizio riga, scritti o incollati, restano quei caratteri: nel file entrano con la barra rovescia davanti (`\*`), che non si vede e che Backspace toglie insieme al carattere. Il formato si mette con la bollicina (CMP-10) o con la barra dei formati del telefono. Restano come prima gli elenchi: `- `, `1. ` e `-[]` a inizio riga diventano elenco puntato, numerato e casella, come in Note di Apple. Il testo copiato da una nota di Memodu e incollato in un'altra tiene i suoi formati (CA-02.19).

Proposta dell'agente, da confermare: anche il «#» a inizio riga resta un carattere (in Note di Apple i titoli si mettono dal menu).

## Conseguenze
- Supera DEC-58 per la scrittura dei simboli («si chiama come prima»); resta il resto di DEC-58.
- CA-02.2 e TC-10 in `docs/moduli/note/`; CMP-20; CHANGELOG.
- Codice: `client/src/editor/scrittura.ts` (`comeSono`, `cancellaConLaBarra`), `anteprima.ts` (barra rovescia nascosta).
