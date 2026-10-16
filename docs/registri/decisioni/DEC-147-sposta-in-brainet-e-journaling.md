# DEC-147 – «Sposta in Brainet» e Journaling

**Data:** 2026-10-16 · **Stato:** Superata in parte da DEC-148 · **Idea di origine:** ID-39

## Contesto
Con DEC-145 Brainet funziona dentro tutte le note di CLOUD in vista Markdown. Nelle prove a mano del 16/10/2026 Manuel Cucca ha visto le note passate dalla 1.0.0 nell'albero di CLOUD: «Non voglio vedere queste note di questo tipo nel tree. voglio reinserire il "sposta nel brainet". tutto parte come nota md ma può essere spostato nel brainet. l'unica cosa che succede è che non viene più mostrata nel tree di file e la ricerca non mostra le note, rimettiamo una voce journaling dove mostriamo tutte le note in una lista per essere modificate».

## Opzioni valutate
A) Brainet in tutte le note di CLOUD (DEC-145).
B) Ogni nota nasce in CLOUD; «Sposta in Brainet» la toglie dall'albero e dalla ricerca e la mette nel Journaling, dove pillole e aree diventano disponibili.

## Decisione
B, scelte di Manuel Cucca del 16/10/2026:
- ogni nota nasce come nota Markdown in CLOUD;
- «Sposta in Brainet» la sposta: non compare più nell'albero di CLOUD e la ricerca non la trova;
- sotto BRAINET torna una voce **Journaling**, con l'elenco di tutte le note spostate in Brainet, che si leggono e si modificano lì;
- pillole e aree si usano solo nelle note spostate in Brainet («pillole e aree non sono disponibili finché non viene fatta la conversione»);
- gli allegati restano in tutte le note Markdown, come in qualsiasi altra nota;
- lo spostamento è senza ritorno: «una nota in brainet non si sposta più in cloud».
- le note Brainet già scritte con la 1.0.0 non contano («ignoriamo le note già scritte»): all'aggiornamento vanno nel Journaling, la strada più semplice che non perde niente (scelta dell'agente);
- il Journaling elenca le note in Brainet dalla più recente, con il giorno e l'ora sopra ognuna; si modificano lì; tasto destro › «Elimina» la manda nel Cestino, e ripristinata torna nel Journaling; il Calendario mette un pallino nei giorni in cui è nata una nota in Brainet (proposte dell'agente, approvate da Manuel Cucca: «ok»);
- «Sposta in Brainet» sta nel menu del tasto destro sulla nota nella colonna, sotto «Sposta in…», e in Info; prima una conferma: «Spostare la nota in Brainet?» · «La nota esce da CLOUD e dalla ricerca e non si riporta indietro. Nel Journaling puoi collegarla a persone, oggetti e argomenti.» · «Annulla», «Sposta»; la voce c'è solo con Brainet acceso; dopo si apre il Journaling con la nota in cima (proposte dell'agente, approvate da Manuel Cucca: «ok»);
- deduzioni dell'agente: Entità e pagina dell'entità contano solo le note in Brainet, perché solo lì ci sono pillole e aree; spostata in Brainet, la nota esce dalla sua cartella.

Supera di DEC-145 la regola che Brainet vive in tutte le note di CLOUD, la ricerca che legge tutte le note e la scomparsa di «Importa in Brainet» e del Database (che torna come Journaling). Resta di DEC-145: niente note proprie che nascono in Brainet, gli allegati di Brainet in vista Markdown, spegnere senza cancellare, l'esportazione, la pagina dell'entità.

## Conseguenze
- Fase 1 chiusa il 16/10/2026. Deduzione dell'agente, da confermare: con Brainet spento le note in Brainet non si vedono da nessuna parte (né albero, né ricerca, né Journaling), ma restano; riaccendendolo tornano.
- Da aggiornare: RF-18 e i suoi flussi, entità, schermate, mockup, architettura (un campo `brainet` della nota, nello schema 10 non ancora rilasciato; la ricerca e l'albero lo escludono), guida per gli utenti, note di rilascio.
