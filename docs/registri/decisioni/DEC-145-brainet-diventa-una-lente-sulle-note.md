# DEC-145 – Brainet diventa una lente sulle note di CLOUD

**Data:** 2026-10-16 · **Stato:** Superata in parte da DEC-147 · **Idea di origine:** ID-39

## Contesto
Brainet (RF-18, DEC-134) doveva essere un diario che si evolve nel tempo, non un archivio di note. Nella 1.0.0 è diventato quasi uguale alle note di CLOUD: il + apre un foglio nuovo, il Database è l'elenco dei fogli, e la lettura della knowledge base è rimasta da studiare («per ora si progetta l'input»). Manuel Cucca, 16/10/2026: «è praticamente uguale alle normali note che scrivo ogni giorno. e se brainet diventasse un semplice tool di visualizzazione?».

## Opzioni valutate
A) Brainet resta un diario a sé, con note proprie, e si progetta meglio la lettura.
B) Brainet funziona su tutte le note di CLOUD: si scrive nelle note normali, Brainet mostra le viste.

## Decisione
B, scelta di Manuel Cucca del 16/10/2026: «voglio che brainet funzioni su tutte le note cloud. ma non so come fare per le note editor pure. per il momento mettiamo tutto il mondo brainet nell'editor md. e poi lasciamo le visualizzazioni nella sidebar».
- Pillole con `@`, aree evidenziate e stati funzionano nelle note di CLOUD in vista Markdown.
- Nella vista Testo per ora Brainet non c'è: come trattarla resta da decidere.
- Nella colonna, sotto Brainet, restano le viste (le visualizzazioni); le note si scrivono in CLOUD.
Supera di DEC-134 l'idea di un flusso con note proprie di Brainet, e di RF-18 tutto ciò che ne dipende.

## Conseguenze
- RF-18 torna in Fase 1 per le parti toccate; resta in vigore ciò che non dipende dalle note proprie (entità, tipi, unione, stati, foto delle entità).
- Da decidere nei requisiti: il + accanto a Brainet e il Database; le note Brainet già scritte; gli allegati di Brainet rispetto alle immagini delle note (RF-03); cosa succede alle pillole e alle aree passando a vista Testo; lo spegnimento (oggi cancella tutto); la ricerca (oggi esclude Brainet); «Importa in Brainet»; cosa mostra il Calendario; i modi di leggere la knowledge base.
- Da aggiornare dopo i requisiti: flussi, entità e schermate di Brainet, mockup in Figma, guida per gli utenti, `CHANGELOG.md`.
