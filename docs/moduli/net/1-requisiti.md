# Brainet – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

## RF-18 – Brainet, il diario a rete
**Priorità:** Must (scelta di Manuel Cucca del 14/10/2026: nella versione dopo la 1.2.0) · **Origine:** ID-39, DEC-134 · **Fase:** 2 · **Stato:** In progettazione

Come *utente* voglio scrivere un flusso di pensiero nel tempo, collegato a persone, oggetti, eventi e argomenti, per ritrovare tutto quello che ho pensato su ognuno di loro senza dover creare e ordinare file.

- Il modello è quello di Reflect o Mem: un flusso unico nel tempo, non un file per ogni nota (DEC-134).
- Nella colonna una sezione **Brainet** (il nome «Net» di DEC-134 è cambiato in «Brainet», scelta di Manuel Cucca del 14/10/2026), sotto CLOUD e sopra Locale (DEC-134). Il cervello non sta più accanto al titolo: è l'icona della voce Database (scelta di Manuel Cucca del 14/10/2026).
- **Una nota nuova** si crea con il **+** accanto al titolo Brainet, come nelle altre sezioni (scelta di Manuel Cucca del 14/10/2026; prima era la voce «Nuova nota Brainet»): apre un foglio nuovo che accetta testo. Il foglio si archivia ma non si consulta come le altre note: entra a far parte di una «knowledge base» di nodi e connessioni. Come si consulta la knowledge base è ancora da capire; per ora si progetta l'input (Manuel Cucca, 14/10/2026).
- Sotto Brainet, in quest'ordine: **Database** (icona del database), **Entità** (icona del cervello), **Calendario** (scelte di Manuel Cucca del 14/10/2026; prima c'erano Database con l'elenco dei nodi e Doc con le date).
- **Database:** i singoli frammenti, cioè le note Brainet, con il loro testo. È l'unica vista che mostra il testo grezzo; si può nascondere dalle impostazioni.
- **Entità:** i nodi della knowledge base: persone, oggetti, eventi, argomenti, e quelli senza tipo.
- **Calendario:** i giorni con un pallino per ogni nota scritta, senza il testo.
- Nessun'altra vista mostra il testo grezzo: i modi per «leggere» la knowledge base sono da studiare (Manuel Cucca, 14/10/2026).
- **Impostazioni:** un gruppo Brainet con l'interruttore «Usa Brainet»; finché è spento non si vede nient'altro, né nelle impostazioni né nella colonna. Acceso, sotto compare «Mostra il Database»: spento, la voce Database sparisce dalla colonna (scelte di Manuel Cucca del 14/10/2026).
- **Aree:** parti del testo sottolineate e associate a un oggetto o a un concetto, oltre alle pillole (richiesta di Manuel Cucca del 14/10/2026). Si creano selezionando la frase e scegliendo il nodo dallo stesso menu di `@`, o creandolo (scelta di Manuel Cucca del 14/10/2026). Le aree sono evidenziate, come con un evidenziatore, non sottolineate (scelta di Manuel Cucca del 14/10/2026). Proposte dell'agente, da confermare: il fondo con il colore dei collegamenti (`sfondo-informazione`), il nome del nodo passando sopra con il mouse.
- **Aree, entità e stati** (scelte di Manuel Cucca del 14/10/2026):
  - un'area si può associare a più entità e a più stati, non a uno solo;
  - le entità nominate con una pillola non hanno un'area: compaiono nel frammento come citazione;
  - un'area che contiene una pillola prende da sola anche l'entità citata;
  - gli stati sono una cosa a sé, non entità: un elenco breve che si può personalizzare, ognuno con il suo colore (per esempio «importante»).
  - mentre evidenzi compare un menu da cui scegli anche gli stati; l'elenco degli stati si crea nelle Impostazioni (scelte di Manuel Cucca del 14/10/2026);
  - approvate da Manuel Cucca il 14/10/2026 le proposte dell'agente: nel menu una sezione «Stati» in cima, con il pallino del colore; nelle Impostazioni, sotto il gruppo Brainet, l'elenco «Stati delle evidenziature» con pallino, nome e Togli, e «Aggiungi uno stato»; come colori i quattro di stato del design system (avviso, informazione, successo, errore);
  - passando sopra un'area compare un riquadro rettangolare con una linguetta e una freccia verso il basso (idea di Manuel Cucca, disegnata nel riquadro «ideamia»): la linguetta ha lo stesso fondo dell'area e mostra gli stati e le entità dell'area. Proposte dell'agente, disegnate in «Brainet · area, mouse sopra»: il pallino del primo stato, i nomi separati da «·», la freccia apre il menu per cambiarli. La freccia apre lo stesso menu della selezione, con gli stati e le entità già scelti spuntati: li togli o ne aggiungi altri (scelta di Manuel Cucca del 14/10/2026). Togliendo tutte le voci l'area sparisce: la frase torna testo normale (scelta di Manuel Cucca del 14/10/2026).
- **Unire due entità:** in Entità, con il tasto destro su una riga, «Unisci a…»: scegli l'altra entità; resta il nome dell'entità scelta e le citazioni e le aree passano a lei (scelta di Manuel Cucca del 14/10/2026).
- **Sincronizzazione:** frammenti, entità, aree e stati si sincronizzano tra i computer e si cifrano come le note di CLOUD, con lo stesso account (scelta di Manuel Cucca del 14/10/2026; RF-10).
- **Modificare una nota già scritta:** sì, sempre: dal Database si apre il frammento e si modifica; nel Calendario resta il giorno in cui è stato scritto (scelta di Manuel Cucca del 14/10/2026, Fase 2).
- **Spegnere Brainet:** spegnendo «Usa Brainet», Memodu chiede se cancellare tutto quello che è stato scritto in Brainet (scelta di Manuel Cucca del 14/10/2026, Fase 2).
- **Importare una nota in Brainet:** una nota di CLOUD si importa in Brainet dal menu della colonna (tasto destro), «Importa in Brainet», con due scelte: «Copia» (la nota resta anche in CLOUD) e «Sposta» (la nota passa in Brainet) (richiesta di Manuel Cucca del 14/10/2026, Fase 2).
- **Dati (proposta dell'agente):** tutto si interroga sul computer, nella copia di lavoro relazionale, perché sul server le note sono cifrate: frammenti, nodi con il tipo, e legami frammento–nodo con l'inizio e la fine del testo (la pillola copre il nome, l'area una frase); un database a grafo non serve.
- **Come nasce un collegamento:** scrivendo `@` si apre il menu dei suggerimenti e funziona come i destinatari di Gmail: si filtra scrivendo, si sceglie un nodo che esiste o se ne crea uno nuovo, e diventa una pillola (scelta di Manuel Cucca del 14/10/2026). Il menu ha un titolo sopra ogni sezione (scelta di Manuel Cucca). Proposte dell'agente, da confermare: sezioni Persone, Argomenti, Eventi, Oggetti in quest'ordine, «Crea «…»» in fondo, frecce e Invio per scegliere, Esc per chiudere, Backspace subito dopo una pillola la toglie tutta.
- **Un nodo nuovo:** «Crea «…»» fa nascere subito la pillola, senza tipo; il tipo si assegna dopo dal Database (scelta di Manuel Cucca del 14/10/2026). Proposta dell'agente, da confermare: «Senza tipo» come sezione del menu e come etichetta nel Database.
- **I collegamenti** sono pillole con i colori di informazione del design system (`sfondo-informazione`, `testo-informazione`, scelta di Manuel Cucca del 14/10/2026) e il nome; con la foto del «documento», se c'è, tonda a sinistra (componente «MiaPropostaLink» disegnato da Manuel Cucca nel file Mockup, 14/10/2026).

Proposta disegnata il 14/10/2026 nel file Mockup, blocco «Proposta · Brainet (DEC-134)»: [la colonna](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-9788) · [Doc](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-10008) · [Database](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-10280). Proposte dell'agente, da confermare: «Scrivi un pensiero…» in cima a oggi, il tipo e il numero di volte nell'elenco del Database, ordinato dall'ultima volta; l'icona del cervello da aggiungere al design system.

**Collegamenti:** FL-00 · EN-00 · SC-00 · ID-04

### Scenario d'uso
Approvato da Manuel Cucca il 14/10/2026.

Nelle Impostazioni accendo «Usa Brainet», e nella colonna compare la sezione Brainet tra CLOUD e LOCALE. Dopo una telefonata premo il «+» accanto a Brainet e si apre un foglio nuovo. Scrivo «Chiamata con @lu», dal menu scelgo Luca Bianchi e il nome diventa una pillola. Continuo: «il preventivo della serra arriva venerdì». Seleziono la frase e, dal menu che compare, scelgo lo stato «Importante», l'oggetto Serra e l'argomento Preventivi: la frase resta evidenziata. A pranzo scrivo un'altra nota con «@gior»: Giorgio non c'è ancora, lo creo e nasce senza tipo. Passando sopra la frase evidenziata vedo la linguetta «Importante · Serra · Preventivi»; con la freccia tolgo Preventivi. La sera apro il Calendario e vedo tre pallini su oggi. In Entità trovo Luca, la Serra e Giorgio «senza tipo». Il testo intero lo rileggo solo nel Database; quando presto il computer a qualcuno, spengo «Mostra il Database».

### Punti aperti
- I modi di «leggere» la knowledge base: da studiare (Manuel Cucca).
- Dove si assegna il tipo a un'entità nata senza tipo (prima il Database, ora Entità). Fermo: l'entità nasce subito senza interrompere la scrittura; il resto si definisce più avanti, non è urgente (Manuel Cucca, 14/10/2026).
- ~~La stessa persona scritta con nomi diversi: unire due entità.~~ Deciso il 14/10/2026: vedi «Unire due entità».
- ~~Sincronizzazione e cifratura di frammenti, entità, aree e stati: come le note?~~ Deciso il 14/10/2026: vedi «Sincronizzazione».
- ~~Priorità di RF-18.~~ Must, nella versione dopo la 1.2.0 (14/10/2026).

### Criteri di accettazione
- [Fase 8]

---

## Fuori dal modulo
Codici del registro idee esclusi da questo modulo:
- 
