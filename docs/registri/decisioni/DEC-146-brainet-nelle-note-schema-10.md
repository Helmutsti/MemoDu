# DEC-146 – Brainet nelle note: schema 10 e editor Markdown

**Data:** 2026-10-16 · **Stato:** Accettata (approvata da Manuel Cucca il 16/10/2026: «va bene») · **Idea di origine:** ID-39

## Contesto
Con DEC-145 Brainet non ha più note sue: pillole, aree e allegati stanno nelle note di CLOUD in vista Markdown. Oggi la copia di lavoro ha la tabella `frammenti` con il suo indice (`brainet_citazioni`, `brainet_aree`, `brainet_aree_legami`), il blocco di sincronizzazione `frammento`, la pulizia degli allegati che legge i frammenti, la ricerca che indicizza il testo grezzo delle note, e l'editor di Brainet in vista Testo. Quest'ultimo era una scelta di Manuel Cucca del 15/10/2026, dopo le prove a mano: la scrittura come in Word della vista Markdown (`scrittura.ts`) gestisce da sé Backspace, Canc e frecce e non conosceva le pillole («l'editor delle note non si tocca»). DEC-145 supera quella scelta.

## Opzioni valutate
Dove tenere l'indice:
A) Le stesse tabelle, con la colonna `frammento` che diventa `nota`, riempite dal testo delle note.
B) Niente indice: cercare i segni nel testo di tutte le note a ogni richiesta.

Le note Brainet esistenti:
C) Diventano note con lo stesso `id` del frammento, così due computer che fanno il passaggio creano la stessa nota.
D) Diventano note con un `id` nuovo.

## Decisione
Proposta dell'agente: **A** e **C**.
- **Schema 10** della copia di lavoro: per ogni frammento una riga in `note` con lo stesso `id`, `contenuto` = `testo`, `titolo` vuoto, `cartella` null, `vista` = `markdown`, `creata` = `nato_il`, `modificata` = `modificato_il`, `eliminata_il` = `eliminato_il`; il segno «modificato qui» del frammento passa alla nota. Poi `frammenti` si svuota, l'indice cambia la colonna `frammento` in `nota` e si rifà dal testo di tutte le note. La colonna `mostra_database` resta nella tabella ma non si usa più. Il blocco ricevuto di tipo `frammento` (da un computer con la 1.0.0) fa lo stesso passaggio e non si rimanda.
- **Indice:** si rifà a ogni salvataggio di una nota, a ogni nota ricevuta e alla copia in conflitto, come oggi per i frammenti. Conta solo le note fuori dal Cestino (RB-127).
- **Ricerca:** una funzione SQL `senza_segni(testo)`, registrata come `tag_della_nota`, toglie i segni e lascia il nome della pillola e la frase dell'area; i trigger della ricerca la usano al posto di `contenuto`, e l'indice si rifà una volta (RB-126).
- **Allegati:** la pulizia (`togli_allegati_inusati`) legge i testi delle note, anche nel Cestino, invece dei frammenti; allegare non dipende più da Brainet acceso (se la deduzione è confermata).
- **Spegnere:** solo `brainet` a 0; niente cancellazioni, niente evento `spento`.
- **Editor:** l'estensione di Brainet (`estensione.ts`, già indipendente dai frammenti) si monta in `NotaAperta` dentro il compartimento della vista Markdown, con Brainet acceso; i menu di `EditorBrainet.tsx` diventano un componente che si appoggia all'editor delle note. In `scrittura.ts` Backspace, Canc e le frecce rispettano gli intervalli atomici di Brainet (pillole e allegati), e `anteprima.ts` non tocca i tag `<cita>`, `<area>` e `<allegato>`. Il cambio a Testo si rifiuta nel nucleo (`cambia_vista` → `409`, `motivo: "brainet"`) se il testo ha dei segni.
- **Pagina dell'entità:** un comando nuovo, `passaggi_entita`, che dall'indice ricava i paragrafi (il testo tra due righe vuote, o tra due a capo per gli elenchi) con i segni, per giorno di creazione della nota.

## Conseguenze
- `architettura/architettura.md` e `architettura/api.md`: sezione Brainet riscritta per DEC-145 e DEC-146.
- Codice: `archivio.rs` (schema 10, funzione `senza_segni`, `cambia_vista`), `archivio_brainet.rs` (passaggio, indice sulle note, Calendario, conteggi, `passaggi_entita`, niente spegnimento che cancella né importazione), `archivio_allegati.rs`, `archivio_sinc.rs`, `brainet.rs`, `lib.rs`; nel client `NotaAperta.tsx`, `Editor.tsx`, `scrittura.ts`, `anteprima.ts`, `brainet/` (via il foglio nuovo, il Database, il Cestino di Brainet, l'importazione, la conferma per spegnere; nuova pagina dell'entità).
- Rischio: la scrittura come in Word va provata a mano con pillole, aree e allegati in tutti i formati (titoli, elenchi, caselle).
- Rischio accettato da confermare: un computer ancora con la 1.0.0 vede i segni come testo nelle note di CLOUD e può ancora scrivere frammenti, che passano in CLOUD appena arrivano su un computer aggiornato.
