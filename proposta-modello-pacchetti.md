# Proposta – Nuovo modello della guida: pacchetti, decisioni, operazioni

<!-- Proposta nata da una discussione del 25/09/2026. Non è ancora in vigore: la guida (docs/guida-documentazione.md) resta quella valida finché non viene riscritta. -->

**Data:** 25/09/2026 · **Stato:** Proposta · **Autore:** Manuel Cucca

## L'idea di fondo
Tutto parte da un'idea, che sta fuori dal progetto. Un'idea entra nel progetto come **pacchetto di obiettivi**, e il pacchetto attraversa gli step della pipeline. Nessun pacchetto si modifica mai: quando qualcosa cambia, nasce qualcosa di nuovo e il vecchio resta scritto.

## I cinque concetti

| Concetto | Cos'è | Si modifica? |
|---|---|---|
| **Idea** | Una proposta che sta fuori dal progetto | Cambia solo il suo stato |
| **Pacchetto** | Un insieme di obiettivi, tutti obbligatori, descritto da una scheda | Mai |
| **Decisione** | Una scelta tra alternative vere, con un ambito | Mai: se cambia, una nuova la supera |
| **Step** | Una fase della pipeline (requisiti, flussi, …, rilascio) | Solo con una decisione di metodo |
| **Operazione** | Una riga del registro che dice cosa è successo e perché | Mai: si aggiungono righe e basta |

## I quattro registri e una vista

- **Lista idee.** Contiene le proposte, ciascuna con il suo esito.
- **Schede dei pacchetti.** Una per pacchetto, scritta alla nascita e mai più toccata. Riporta:
  - codice e obiettivi;
  - origine, cioè le idee o il pacchetto padre da cui nasce;
  - le decisioni di perimetro che valgono (per esempio "vale DEC-01");
  - le decisioni ereditate dal padre.
- **Registro delle decisioni.** Ogni decisione riporta:
  - l'ambito;
  - il pacchetto da cui è nata;
  - le opzioni valutate e la scelta;
  - i **rischi accettati**, con "da rivedere quando".
- **Registro delle operazioni.** È l'unica fonte dello stato e sostituisce lo storico. Ogni riga riporta data, autore, pacchetto (facoltativo), tipo, cosa è successo e perché.
- **`avanzamento.md`.** È una vista in sola lettura, rigenerata dalle operazioni con un comando e mai scritta a mano.

## Gli stati di un pacchetto
Nessun registro li contiene: si ricavano dalle operazioni.

- **In corso**, nello step N. Un pacchetto sta in un solo step alla volta.
- **In attesa**, sempre con un trigger. Per esempio "quando il pacchetto X completa lo step 5", oppure una data.
- **Completato**, quando i suoi obiettivi sono raggiunti.
- **Cancellato**, sempre con un motivo. Se il motivo è una divisione: "diviso in X e Y".

## I tipi di operazione
- **Creazione** di un pacchetto, da una o più idee oppure da un padre.
- **Ingresso** in uno step e **completamento** di uno step.
- **Attesa**, con il suo trigger, e **ripresa**.
- **Divisione**, **completamento** e **cancellazione** del pacchetto.
- **Modifica** di un documento, per esempio "aggiunto RB-06". Prende il posto delle righe dello storico.
- **Deduzione**, e poi la sua **conferma** (diventa una regola) o il suo **scarto**. Le deduzioni aperte sono quelle ancora senza risposta.

## Le regole

**Pacchetti**
1. Un pacchetto nasce con una scheda e un'operazione di creazione. Una decisione serve solo se c'erano alternative vere.
2. Gli obiettivi di un pacchetto sono tutti obbligatori. Se non si possono raggiungere tutti, il pacchetto muore e nascono dei figli.
3. Anche aggiungere un'idea a un pacchetto esistente lo fa morire e ne fa nascere uno nuovo.
4. Un pacchetto sta in un solo step. Se una parte dei suoi obiettivi va avanti e il resto resta indietro, è una divisione.
5. Una decisione presa in anticipo su uno step successivo non è una divisione: fissa un'intenzione che quello step troverà pronta.
6. Quando un pacchetto si divide, i figli ereditano le decisioni di ambito pacchetto del padre. Quando viene cancellato, le sue decisioni restano nel registro ma non valgono più per nessuno.

**Decisioni**

7. Una decisione ha uno di tre ambiti:
   - **progetto**: il perimetro, come DEC-01 e DEC-13;
   - **step**: sia quello che lo step produce per tutti (DEC-14, i token) sia il modo di lavorare in quello step;
   - **pacchetto**: come DEC-29.
8. Quando un pacchetto entra in uno step, legge le decisioni di progetto, quelle dello step e le proprie. Le accetta, oppure ne scrive una nuova che le supera.
9. Una decisione sul metodo vale per chi entra nello step dopo che è stata presa. Chi lo ha già superato non torna indietro, a meno che la decisione non lo dica.

**Requisiti e completamento**

10. I requisiti nascono nello step dei requisiti e servono a raggiungere gli obiettivi: non sono obiettivi del progetto. Un requisito si scrive una volta sola e più pacchetti possono usarlo. Senza priorità Must/Should: quello che non serve subito appartiene a un altro pacchetto.
11. La tracciabilità diventa: *Obiettivo → RF → FL → EN → SC → CMP*.
12. Un pacchetto è completato quando i suoi obiettivi sono raggiunti. Lo verificano i criteri di accettazione.

## Cosa sparisce rispetto a oggi

| Oggi | Nel modello nuovo |
|---|---|
| Frammenti | Pacchetti |
| Rinvii | Pacchetti in attesa con un trigger, oppure rischi dentro le decisioni |
| Storico | Operazioni di tipo "modifica" |
| Deduzioni da confermare | Operazioni di tipo "deduzione" |
| Rischi accettati | Sezione dentro la decisione |
| "Prima fase del progetto" come raggruppamento | Decisione di perimetro citata dalle schede |
| Priorità e campo "Fase" nella riga del requisito | Spariscono: fase e urgenza stanno nel pacchetto |
| `avanzamento.md` scritto a mano | Vista rigenerata |

Le idee parcheggiate non diventano pacchetti: restano nella lista idee, fuori dal progetto, con la loro data di rivalutazione.

## Prova su un caso vero: Must A nel registro delle operazioni

| Tipo | Pacchetto | Cosa | Perché |
|---|---|---|---|
| Creazione | P-Must | Obiettivi della prima fase, vale DEC-01 | ID-… |
| Completamento step | P-Must | Step 1–5 completati | — |
| Divisione | P-Must | Diviso in P-MustA (scrivere in locale) e P-MustResto | DEC-xx: si parte da ciò che va avanti da solo |
| Cancellazione | P-Must | Diviso in P-MustA e P-MustResto | Divisione |
| Ingresso step | P-MustA | Step 6 | — |
| Modifica | P-MustA | Aggiunti DEC-26 … DEC-30 (in anticipo sullo step 7) | Intenzioni già fissate |
| Attesa | P-MustResto | Trigger: P-MustA completato | DEC-xx |

## Punti ancora aperti
1. **Un pacchetto può tornare a uno step precedente?** Con la regola "un solo step alla volta" le strade sono due: un'operazione "ritorno", oppure una divisione.
2. **Come si scrive un trigger.** Serve una forma fissa, per esempio "pacchetto X completa lo step N", una data o una decisione, così il comando che genera `avanzamento.md` riesce a riconoscerli.
3. **Il passaggio dal sistema di oggi.** Bisogna tradurre l'`avanzamento.md` attuale nelle prime operazioni e nelle prime schede, e decidere se riscrivere lo storico esistente come operazioni o lasciarlo com'è fino a una certa data.
