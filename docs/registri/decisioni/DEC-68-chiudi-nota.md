# DEC-68 – «Chiudi nota» nel menu della nota aperta

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Nella finestra principale una nota è quasi sempre aperta: all'avvio si apre la modificata più di recente (SC-01), e l'area resta vuota («Nessuna nota aperta», CMP-19) solo quando la nota aperta finisce nel cestino (RB-67). Manuel Cucca: «aggiungi una voce nel menu della nota aperta che è "Chiudi nota": in questo modo possiamo tenere la schermata vuota. Non dobbiamo mostrare per forza una nota».

## Opzioni valutate
Nessuna alternativa: richiesta di Manuel Cucca.

## Decisione
- Nel menu `···` della nota aperta, dopo «Sposta in…» e prima del separatore di «Elimina», la voce **Chiudi nota** con l'icona Lucide `x` (proposta dell'agente).
- Chiudere salva la nota (RB-06); se il salvataggio non riesce la nota resta aperta. Poi l'area mostra «Nessuna nota aperta» e nessun'altra nota si apre da sola, come in RB-67. Una nota vuota sparisce, come quando si passa a un'altra (DEC-39).
- La voce non c'è nel tasto destro sulle note della colonna: lì la nota non è aperta.

## Conseguenze
- SC-01: menu `···`, parte «questa nota». Codice di `FinestraPrincipale` e una prova.
- In Figma da aggiungere la voce al menu della nota nei mockup di SC-01.
- Resta da decidere se all'avvio si apre ancora la nota modificata più di recente (domanda aperta su SC-01).
