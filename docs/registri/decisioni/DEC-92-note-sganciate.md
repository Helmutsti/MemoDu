# DEC-92 – Note sganciate in una finestra propria

**Data:** 2026-09-30 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
RF-12 (finestre multiple e sganciabili) era *Should*, fuori dalla prima fase (DEC-01), ferma alla Fase 1. Manuel Cucca vuole poter sganciare una nota, vedere «Questa nota è sganciata» quando la si apre nella finestra principale e poterla tenere in primo piano dal suo menu.

## Opzioni valutate
Sganciare: A) aprire la nota in una finestra propria; B) solo segnarla come sganciata. In primo piano: dal menu `···` della finestra sganciata, da quello della finestra principale, con una puntina. Nella finestra principale: messaggio con «Mostra la finestra» e «Riaggancia», solo «Mostra la finestra», testo in sola lettura. Dopo un'uscita vera: si riaprono sganciate, tornano nella finestra principale, lo decide un'impostazione.

## Decisione
Scelte di Manuel Cucca, anticipando RF-12 nella prima fase:
- Sganciare apre la nota in una **finestra propria**, che si sposta e si ridimensiona; si possono sganciare più note.
- Nella finestra principale, aprendo una nota sganciata, al posto del testo compare **«Questa nota è sganciata»** con **«Mostra la finestra»** (porta davanti la sua finestra) e **«Riaggancia»** (la chiude e la nota torna a scriversi qui): il testo non si scrive in due posti.
- Il menu `···` della finestra sganciata ha **«Tieni in primo piano»**, con la spunta: la finestra resta sopra gli altri programmi.
- Chiudendo la finestra principale nell'area di notifica le finestre sganciate restano aperte. Dopo un'uscita vera (Esci da Memodu, spegnimento, chiusura forzata) al riavvio non ci sono finestre sganciate: le note tornano nella finestra principale.

Proposte dell'agente, accettate da Manuel Cucca con il riepilogo:
- «Sgancia in una finestra» sta nel menu `···` della nota e nel tasto destro sulla nota nella colonna.
- La finestra sganciata è come il foglio della nota (SC-03), con il percorso e il testo e i pulsanti della finestra.
- Il suo menu `···` ha, dopo «Tieni in primo piano», «Riaggancia», Dettagli, Sposta in ed Elimina; le stesse voci nel tasto destro.
- Chiudere la finestra sganciata con la sua ✕ la riaggancia.

## Conseguenze
- RF-12 passa a *Must* per questa funzione (le finestre affiancate liberamente restano da scrivere), con i criteri CA-12.1 … CA-12.7.
- SC-01 (menu `···`, stato «nota sganciata»), SC-03 (finestra sganciata), nuova schermata della finestra sganciata da disegnare.
- Da disegnare: la voce «Tieni in primo piano» con la spunta (CMP-07) e lo stato «nota sganciata» dell'area della nota (CMP-19).
