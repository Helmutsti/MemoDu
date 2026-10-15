# Brainet – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

## RF-18 – Brainet, il diario a rete
**Priorità:** Must (scelta di Manuel Cucca del 14/10/2026: nella versione dopo la 1.2.0) · **Origine:** ID-39, DEC-134 · **Fase:** Sviluppo · **Stato:** In sviluppo

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
- **Spegnere Brainet:** spegnere vuol dire cancellare. Spegnendo «Usa Brainet» una finestra chiede conferma con due pulsanti, «Annulla» e «Spegni e cancella tutto»: si cancellano note, entità, aree e stati di Brainet, su tutti i computer (scelte di Manuel Cucca del 14/10/2026, Fase 2).
- **Importare una nota in Brainet:** una nota di CLOUD si importa in Brainet dal menu della colonna (tasto destro), «Importa in Brainet», con due scelte: «Copia» (la nota resta anche in CLOUD) e «Sposta» (la nota passa in Brainet) (richiesta di Manuel Cucca del 14/10/2026, Fase 2). La nota importata prende le date della nota: nel Calendario compare nel giorno in cui era stata creata (scelta di Manuel Cucca del 14/10/2026). Per ora tag e cartella si perdono (scelta di Manuel Cucca del 14/10/2026).
- **Togliere uno stato:** togliendo uno stato dall'elenco nelle Impostazioni, Memodu propone di cambiarlo con un altro stato. Se lo togli, sparisce da tutte le aree; un'area sparisce solo se quello era il suo ultimo legame, altrimenti resta con gli altri (scelte di Manuel Cucca del 14/10/2026, Fase 2).
- **Dati (proposta dell'agente):** tutto si interroga sul computer, nella copia di lavoro relazionale, perché sul server le note sono cifrate: frammenti, nodi con il tipo, e legami frammento–nodo con l'inizio e la fine del testo (la pillola copre il nome, l'area una frase); un database a grafo non serve.
- **Come nasce un collegamento:** scrivendo `@` si apre il menu dei suggerimenti e funziona come i destinatari di Gmail: si filtra scrivendo, si sceglie un nodo che esiste o se ne crea uno nuovo, e diventa una pillola (scelta di Manuel Cucca del 14/10/2026). Il menu ha un titolo sopra ogni sezione (scelta di Manuel Cucca). Proposte dell'agente, da confermare: sezioni Persone, Argomenti, Eventi, Oggetti in quest'ordine, «Crea «…»» in fondo, frecce e Invio per scegliere, Esc per chiudere, Backspace subito dopo una pillola la toglie tutta.
- **Un nodo nuovo:** «Crea «…»» fa nascere subito la pillola, senza tipo; il tipo si assegna dopo dal Database (scelta di Manuel Cucca del 14/10/2026). Proposta dell'agente, da confermare: «Senza tipo» come sezione del menu e come etichetta nel Database.
- **I collegamenti** sono pillole con i colori di informazione del design system (`sfondo-informazione`, `testo-informazione`, scelta di Manuel Cucca del 14/10/2026) e il nome; con la foto del «documento», se c'è, tonda a sinistra (componente «MiaPropostaLink» disegnato da Manuel Cucca nel file Mockup, 14/10/2026).

Per Brainet si salta la Fase 4 in bianco e nero: si va direttamente ai mockup, partendo dalla proposta già disegnata con i componenti della libreria (scelta di Manuel Cucca del 14/10/2026). Proposta disegnata il 14/10/2026 nel file Mockup, blocco «FL-16 … FL-22 · Brainet (DEC-134)», prima chiamato «Proposta · Brainet»: [la colonna](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-9788) · [Doc](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-10008) · [Database](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-10280). Proposte dell'agente, da confermare: «Scrivi un pensiero…» in cima a oggi, il tipo e il numero di volte nell'elenco del Database, ordinato dall'ultima volta; l'icona del cervello da aggiungere al design system.

**Collegamenti:** FL-00 · EN-00 · SC-00 · ID-04

- **Allegati** (richiesta di Manuel Cucca del 15/10/2026, durante lo sviluppo; da progettare): «devo poter allegare anche documenti e foto». Le foto in mezzo al testo sono bolle; le foto a fine paragrafo possono essere piccole, medie o grandi, ma non bolle. Entrano in questa versione di Brainet, prima delle prove a mano (scelta di Manuel Cucca del 15/10/2026): si progettano dalla Fase 1. Si allega in tre modi: trascinando il file nel testo, incollandolo (Ctrl + V) e da un menu (scelta di Manuel Cucca del 15/10/2026). Il menu è quello di @: in fondo, dopo «Crea», la voce «Allega un file…» (scelta di Manuel Cucca del 15/10/2026). Un allegato arriva fino a 25 MB, come in Gmail: i file viaggiano a parte rispetto alle note, cifrati come loro (scelta di Manuel Cucca del 15/10/2026). Si allegano solo foto e documenti comuni: JPG, PNG, PDF, Word, Excel, PowerPoint e testo (scelta di Manuel Cucca del 15/10/2026). Un documento si mostra come la pillola di una persona: al posto della foto l'icona del tipo di file, poi il nome del file (scelta di Manuel Cucca del 15/10/2026). Da decidere: cosa fa un clic su un allegato, come si mostra, dove viaggia (il limite di un blocco è 4 MB).

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
Scritti dall'agente il 15/10/2026 (Fase 8), approvati da Manuel Cucca lo stesso giorno.

- **CA-18.1** *Dato* «Usa Brainet» spento, *quando* apro Memodu, *allora* nella colonna non c'è la sezione Brainet e nelle Impostazioni il gruppo Brainet ha solo l'interruttore; *quando* lo accendo, *allora* la sezione compare tra CLOUD e LOCALE con Database, Entità e Calendario, e nelle Impostazioni compaiono «Mostra il Database» e gli stati delle evidenziature.
- **CA-18.2** *Dato* Brainet acceso, *quando* premo + accanto a BRAINET, scrivo e chiudo il foglio, *allora* la nota è nel Database in cima, con il giorno e l'ora, e nel Calendario oggi ha un pallino in più; un foglio lasciato vuoto non lascia niente (RB-101, RB-102).
- **CA-18.3** *Dato* un foglio Brainet, *quando* scrivo @ e qualche lettera, *allora* si apre il menu con le entità che corrispondono, divise per tipo con il titolo sopra e «Crea «…»» in fondo; frecce e Invio scelgono, Esc chiude; scelta un'entità, le lettere diventano la sua pillola, con la foto se c'è (RB-104).
- **CA-18.4** *Dato* il menu di @ con un nome che non c'è, *quando* premo «Crea «…»», *allora* nasce l'entità senza tipo, la pillola entra nel testo e continuo a scrivere senza altre finestre (RB-105).
- **CA-18.5** *Dato* il cursore subito dopo una pillola, *quando* premo Backspace, *allora* la pillola sparisce tutta; le frecce la saltano come un carattere solo (RB-104).
- **CA-18.6** *Dato* una frase selezionata in un foglio Brainet, *quando* scelgo dal menu uno o più stati ed entità, *allora* la frase resta evidenziata e legata a tutte le voci scelte; se la frase contiene una pillola, l'area è legata anche a quell'entità (RB-107).
- **CA-18.7** *Dato* un'area, *quando* ci passo sopra con il mouse, *allora* compaiono il riquadro e la linguetta con il pallino del primo stato e i nomi separati da «·»; la freccia apre il menu con le voci dell'area spuntate; togliendo una spunta il legame sparisce, togliendo l'ultima sparisce l'area (RB-109).
- **CA-18.8** *Dato* una nota con pillole e aree, *quando* aggiungo o cancello parole prima e dentro, *allora* pillole e aree restano sulle stesse parole, anche dopo averla chiusa e riaperta e sull'altro computer (scelta del 15/10/2026).
- **CA-18.9** *Dato* il Database, *quando* apro una nota e la cambio, *allora* la modifica resta e nel Calendario il giorno non cambia; *quando* uso il tasto destro › Elimina, *allora* la nota va nella parte Brainet del Cestino, da dove si ripristina o si elimina per sempre (RB-103).
- **CA-18.10** *Dato* «Mostra il Database» spento, *allora* la voce Database non c'è, su tutti i computer dell'account; riaccendendolo torna, con tutte le note (RB-106).
- **CA-18.11** *Dato* Entità, *allora* vedo tutte le entità con quante volte sono nominate, l'ultima volta e il tipo («Senza tipo» se non ce l'ha); le citazioni e le aree contano tutte e due.
- **CA-18.12** *Dato* due entità, *quando* faccio tasto destro › Unisci a… e ne scelgo un'altra, *allora* la conferma dice quante citazioni e aree si spostano; con «Unisci» resta solo l'entità scelta, con il suo nome, e tutte le pillole e le aree dell'altra mostrano lei; con «Annulla» non cambia niente (RB-108).
- **CA-18.13** *Dato* un'entità, *quando* faccio tasto destro › Scegli una foto… e scelgo un'immagine, *allora* la foto compare nelle sue pillole e nella sua riga, anche sull'altro computer; un file che non è un'immagine dà un messaggio e non cambia niente.
- **CA-18.14** *Dato* il Calendario, *allora* ogni giorno ha un pallino per nota, fino a tre; oggi è evidenziato, i giorni dopo tenui; le frecce cambiano mese; un clic su un giorno non fa niente (RB-113).
- **CA-18.15** *Dato* l'elenco degli stati, *quando* aggiungo uno stato con nome e colore, *allora* compare nel menu dell'area; un nome già usato è rifiutato; *quando* tolgo uno stato usato, *allora* Memodu propone di cambiarlo con un altro; se lo tolgo, sparisce da tutte le aree, e un'area sparisce solo se era il suo ultimo legame (RB-110).
- **CA-18.16** *Dato* due computer con lo stesso account, *quando* scrivo, unisco, cambio una foto o uno stato su uno, *allora* entro 30 s l'altro ha tutto uguale; sul server i blocchi di Brainet sono cifrati come quelli delle note (RF-10).
- **CA-18.17** *Dato* la stessa nota Brainet cambiata su due computer senza rete, *quando* torna la rete, *allora* una versione resta e l'altra va in una copia in conflitto con le sue pillole e aree, come per le note (DEC-06).
- **CA-18.18** *Dato* un computer con una versione di Memodu senza Brainet, *quando* un altro computer dello stesso account usa Brainet, *allora* il primo continua a sincronizzare le note senza errori.
- **CA-18.19** *Dato* Brainet acceso, *quando* spengo «Usa Brainet», *allora* la finestra chiede conferma con «Annulla» e «Spegni e cancella tutto»; con «Annulla» non cambia niente; con «Spegni e cancella tutto» note, entità, aree e stati spariscono, la sezione sparisce, e sull'altro computer succede lo stesso; se lì un foglio Brainet era aperto, si chiude con l'avviso «Brainet è stato spento da un altro computer.» (RB-111).
- **CA-18.20** *Dato* una nota di CLOUD con titolo, tag e cartella, *quando* faccio tasto destro › Importa in Brainet › Copia, *allora* in Brainet c'è una nota con il titolo come prima riga e il testo, nel giorno in cui la nota era stata creata, senza tag né cartella, e la nota resta in CLOUD; con «Sposta» la nota di CLOUD va nel Cestino (RB-112). La voce c'è solo con Brainet acceso.
- **CA-18.21** *Dato* Brainet, *quando* cerco una parola che c'è solo in una nota Brainet, *allora* la ricerca non la trova: Brainet resta fuori dalla ricerca.

---

## Fuori dal modulo
Codici del registro idee esclusi da questo modulo:
- 
