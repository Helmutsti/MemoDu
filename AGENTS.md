# AGENTS.md

Istruzioni per gli agenti IA che lavorano su questo repository.

## Il progetto
Memodu è un'applicazione di note cross-platform che mette la scrittura al primo posto: note in markdown, organizzate in cartelle, tag e workspace, sincronizzate nel cloud con cifratura end-to-end. Si rivolge a chiunque debba prendere appunti o produrre documenti formattati. La prima fase è solo cloud e mono-utente (DEC-01).

## Comandi
<!-- Da compilare con i comandi reali del progetto. -->
- Installazione: `[comando]`
- Avvio in locale: `[comando]`
- Test: `[comando]`
- Lint e formattazione: `[comando]`

## Documentazione: leggila prima di scrivere codice
Il progetto segue il metodo descritto in `docs/guida-documentazione.md`. Non modificare quel file se non ti viene chiesto esplicitamente.

**Parti da `docs/avanzamento.md`:** dice quali fasi sono complete per quali requisiti, cosa viene dopo, cosa è stato rinviato e quali deduzioni aspettano conferma.

La documentazione ha due parti:
- **Fotografia**: descrive il sistema come deve essere oggi.
  - `docs/generale/`: visione, destinatari, requisiti non funzionali, glossario, catalogo delle sfighe, Definition of Ready e Done.
  - `docs/moduli/<modulo>/`: requisiti, flussi, entità, schermate e test di ogni modulo.
  - `docs/design-system/`: moodboard, token, componenti.
  - `docs/architettura/`: architettura, API, ambienti.
  - `docs/rilascio/`: guida per gli utenti, runbook.
- **Registri** (`docs/registri/`): idee, decisioni e storico. Raccontano come ci si è arrivati.
- **Stato della documentazione** (`docs/avanzamento.md`): pacchetti, fasi, rinvii, deduzioni da confermare, rischi accettati.

Ogni requisito indica nella riga di stato la **fase** in cui si trova (la prossima da completare). I criteri di completamento delle fasi si valutano per frammento: vedi "Pacchetti e frammenti" nella guida.

Per creare un nuovo modulo copia `docs/moduli/_modello-modulo/` e rinomina la cartella (minuscole, parole separate da trattini). Per una nuova decisione copia `docs/registri/decisioni/_modello.md` e usa il numero successivo all'ultimo esistente.

Prima di implementare un requisito `RF-`:
1. Leggi il requisito e i suoi criteri di accettazione.
2. Leggi tutti gli elementi collegati: flussi `FL-`, regole di business `RB-`, sfighe `SF-`, entità `EN-`, schermate `SC-`, componenti `CMP-`.
3. Controlla `docs/registri/decisioni/` per le decisioni che lo riguardano.

## Se qualcosa manca o è ambiguo
- Non inventare comportamenti, regole o testi non documentati.
- Fermati e segnala la domanda aperta, indicando il codice dell'elemento coinvolto.
- Se hai un'idea di miglioramento, aggiungila a `docs/registri/idee.md` con stato *Proposta*. Non cambiare lo stato delle idee esistenti: accettarle o rifiutarle spetta al team.

## Come si conduce una fase della documentazione
Quando lavori con una persona su una fase della guida:
1. Ricava dai documenti esistenti tutto ciò che è già deciso; scrivilo senza chiedere.
2. Chiedi solo ciò che manca, **una domanda alla volta**. Per ogni domanda spiega il contesto (da dove nasce, citando i documenti) e perché la risposta conta.
3. Distingui sempre ciò che viene dalla persona da ciò che deduci tu. Se completi qualcosa di tua iniziativa, dillo esplicitamente e chiedi conferma.
4. Una deduzione non confermata non diventa una regola: va nelle domande aperte del modulo (`8-test.md`) e in "Deduzioni da confermare" di `docs/avanzamento.md`.
5. Dopo ogni risposta aggiorna subito la fotografia coinvolta e aggiungi la riga nello storico.
6. Se una risposta contraddice una decisione esistente, segnalalo e scrivi una nuova decisione che la supera: non modificare quella vecchia.
7. Alla chiusura della fase per un frammento verifica il criterio di completamento della guida, aggiorna la fase dei requisiti e `docs/avanzamento.md`, e riepiloga cosa resta sospeso.

## Disegni
Wireframe, componenti e mockup si disegnano nello strumento di design; nel repository vanno il link al frame, un'esportazione in `docs/moduli/<modulo>/immagini/` e tutte le decisioni. Nessuna decisione vive solo nello strumento di design: vedi "Disegni" nella guida.

## Regole sui registri
- Nei registri si aggiunge, non si cancella.
- Non modificare mai una decisione esistente. L'unica eccezione è il campo *Stato*, quando una nuova decisione la supera.
- Per una scelta tecnica rilevante (nuova dipendenza, cambio di architettura, modifica allo schema dei dati) crea una nuova decisione `DEC-` con stato *Proposta*, usando `docs/registri/decisioni/_modello.md`. Non segnarla come *Accettata*.

## Codice e documentazione cambiano insieme
- Se una modifica al codice cambia un comportamento documentato, aggiorna il documento corrispondente nella stessa modifica.
- Per ogni modifica alla fotografia aggiungi una riga in `docs/registri/storico.md`, con il codice `ID-` o `DEC-` che la giustifica.
- Le correzioni minori (refusi, riformulazioni) non vanno registrate nello storico.

## Sfighe e test
- Quando implementi un flusso, gestisci tutte le sfighe `SF-` indicate nel flusso: rilevamento, messaggio per l'utente, via d'uscita.
- Scrivi almeno un test per ogni criterio di accettazione e per ogni coppia flusso-sfiga.
- Usa i testi definitivi documentati per i messaggi di errore, non scriverne di nuovi.

## Convenzioni di codifica
| Prefisso | Elemento |
|---|---|
| `RF-` / `RNF-` | Requisito funzionale / non funzionale |
| `FL-` | Flusso |
| `RB-` | Regola di business |
| `SF-` | Sfiga |
| `EN-` | Entità |
| `SC-` | Schermata |
| `CMP-` | Componente |
| `TC-` | Caso di test |
| `ID-` | Idea |
| `DEC-` | Decisione |

## Note di rilascio
- Le modifiche visibili agli utenti vanno in `CHANGELOG.md`, nella sezione *Non rilasciato*, scritte con parole comprensibili per chi usa il prodotto.

## Commit e pull request
- Inizia il messaggio con i codici coinvolti, per esempio: `RF-07 FL-07: gestione annullamento entro 24h`.
- Nella descrizione della pull request elenca i documenti aggiornati.

## Cosa non fare
- Non inserire dati personali reali nei set di dati di prova.
- Non scrivere segreti, chiavi o password nel codice o nella documentazione.
- Non introdurre componenti visivi che non esistono nel design system: segnala la mancanza.
