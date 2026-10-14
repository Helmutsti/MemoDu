# Brainet – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

## RF-18 – Brainet, il diario a rete
**Priorità:** da decidere · **Origine:** ID-39, DEC-134 · **Fase:** 1 · **Stato:** In progettazione

Come *utente* voglio scrivere un flusso di pensiero nel tempo, collegato a persone, oggetti, eventi e argomenti, per ritrovare tutto quello che ho pensato su ognuno di loro senza dover creare e ordinare file.

- Il modello è quello di Reflect o Mem: un flusso unico nel tempo, non un file per ogni nota (DEC-134).
- Nella colonna una sezione **Brainet** (il nome «Net» di DEC-134 è cambiato in «Brainet», scelta di Manuel Cucca del 14/10/2026), sotto CLOUD e sopra Locale (DEC-134). Il cervello non sta più accanto al titolo: è l'icona della voce Database (scelta di Manuel Cucca del 14/10/2026).
- Subito sotto il titolo della sezione la voce **Nuova nota Brainet** (scelta di Manuel Cucca del 14/10/2026): apre un foglio nuovo che accetta testo. Il foglio si archivia ma non si consulta come le altre note: entra a far parte di una «knowledge base» di nodi e connessioni. Come si consulta la knowledge base è ancora da capire; per ora si progetta l'input (Manuel Cucca, 14/10/2026).
- Sotto Brainet, in quest'ordine: **Nuova nota Brainet**, **Database** (icona del database), **Entità** (icona del cervello), **Calendario** (scelte di Manuel Cucca del 14/10/2026; prima c'erano Database con l'elenco dei nodi e Doc con le date).
- **Database:** i singoli frammenti, cioè le note Brainet, con il loro testo. È l'unica vista che mostra il testo grezzo; si può nascondere dalle impostazioni.
- **Entità:** i nodi della knowledge base: persone, oggetti, eventi, argomenti, e quelli senza tipo.
- **Calendario:** i giorni con un pallino per ogni nota scritta, senza il testo.
- Nessun'altra vista mostra il testo grezzo: i modi per «leggere» la knowledge base sono da studiare (Manuel Cucca, 14/10/2026).
- **Impostazioni:** un gruppo Brainet con l'interruttore «Usa Brainet»; finché è spento non si vede nient'altro, né nelle impostazioni né nella colonna. Acceso, sotto compare «Mostra il Database»: spento, la voce Database sparisce dalla colonna (scelte di Manuel Cucca del 14/10/2026).
- **Aree:** parti del testo sottolineate e associate a un oggetto o a un concetto, oltre alle pillole (richiesta di Manuel Cucca del 14/10/2026, da progettare).
- **Come nasce un collegamento:** scrivendo `@` si apre il menu dei suggerimenti e funziona come i destinatari di Gmail: si filtra scrivendo, si sceglie un nodo che esiste o se ne crea uno nuovo, e diventa una pillola (scelta di Manuel Cucca del 14/10/2026). Il menu ha un titolo sopra ogni sezione (scelta di Manuel Cucca). Proposte dell'agente, da confermare: sezioni Persone, Argomenti, Eventi, Oggetti in quest'ordine, «Crea «…»» in fondo, frecce e Invio per scegliere, Esc per chiudere, Backspace subito dopo una pillola la toglie tutta.
- **Un nodo nuovo:** «Crea «…»» fa nascere subito la pillola, senza tipo; il tipo si assegna dopo dal Database (scelta di Manuel Cucca del 14/10/2026). Proposta dell'agente, da confermare: «Senza tipo» come sezione del menu e come etichetta nel Database.
- **I collegamenti** sono pillole con i colori di informazione del design system (`sfondo-informazione`, `testo-informazione`, scelta di Manuel Cucca del 14/10/2026) e il nome; con la foto del «documento», se c'è, tonda a sinistra (componente «MiaPropostaLink» disegnato da Manuel Cucca nel file Mockup, 14/10/2026).

Proposta disegnata il 14/10/2026 nel file Mockup, blocco «Proposta · Brainet (DEC-134)»: [la colonna](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-9788) · [Doc](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-10008) · [Database](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ?node-id=264-10280). Proposte dell'agente, da confermare: «Scrivi un pensiero…» in cima a oggi, il tipo e il numero di volte nell'elenco del Database, ordinato dall'ultima volta; l'icona del cervello da aggiungere al design system.

**Collegamenti:** FL-00 · EN-00 · SC-00 · ID-04

### Scenario d'uso
[Da scrivere]

### Criteri di accettazione
- [Fase 8]

---

## Fuori dal modulo
Codici del registro idee esclusi da questo modulo:
- 
