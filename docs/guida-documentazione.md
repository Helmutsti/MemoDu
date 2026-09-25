# Guida alla documentazione

---

# README – Come usare questa guida

## A cosa serve
Questa guida accompagna la progettazione di un software dal problema iniziale fino al rilascio. Serve a prendere le decisioni nell'ordine giusto: prima *cosa* e *perché*, poi *come funziona*, poi *come appare*, infine *come si costruisce* e *come si consegna*. Ogni fase riduce l'incertezza per quella successiva, così gli errori vengono scoperti quando correggerli costa ancora poco.

## A chi è rivolta
A chiunque partecipi al progetto: chi raccoglie i requisiti, chi progetta flussi e interfacce, chi sviluppa. Non serve conoscerla tutta: ogni fase è leggibile da sola, ma ha senso solo nel contesto di quelle precedenti.

## I tre strati della documentazione
- **Il metodo:** questa guida. È uguale per tutti i progetti e cambia raramente.
- **La fotografia:** ciò che producono le fasi della Parte A (requisiti, flussi, entità, wireframe, design system, architettura, documentazione per utenti e operativa). Descrive il sistema *come deve essere oggi*. Si sovrascrive: quando qualcosa cambia, si aggiorna il testo.
- **I registri:** ciò che descrive la Parte B (idee, decisioni, storico). Raccontano *come ci si è arrivati*. Non si cancella mai nulla, si aggiunge soltanto.

**La fotografia dice cosa è vero, i registri dicono perché.** Ogni modifica alla fotografia ha una voce nei registri che la giustifica.

## I principi
1. **Tracciabilità.** Ogni elemento deve poter essere ricondotto a quello della fase precedente: *Requisito → Flusso → Entità → Schermata → Componente*. Se qualcosa non ha un "genitore", o manca un requisito o l'elemento è superfluo.
2. **Iterazione.** Le fasi non sono a senso unico. Tornare indietro per correggere una fase precedente è normale e previsto: una fase non è mai "chiusa per sempre".
3. **Proporzionalità.** La profondità della documentazione va commisurata alla complessità. Una funzione semplice può richiedere mezza pagina, un flusso di pagamento molte. La guida è uno strumento, non un modulo da compilare.
4. **Regola di ingresso.** Ogni cambiamento passa dai registri (Parte B) prima di entrare nella fotografia (Parte A).

## Come si applica
La guida si può applicare all'intero progetto, a un singolo modulo o a un'integrazione con un sistema esterno. Il team decide di volta in volta quali fasi e sezioni ripercorrere e con quale profondità, in base a ciò che il lavoro aggiunge o cambia.

## Pacchetti e frammenti
Un cambiamento attraversa le fasi come un **pacchetto**: nasce nei registri (un'idea `ID-` o una decisione `DEC-`), diventa uno o più requisiti e da lì percorre la Parte A. Un pacchetto si può dividere in **frammenti**, cioè gruppi di requisiti che attraversano le fasi con tempi diversi: per esempio i requisiti *Must* di una fase del progetto partono subito, i *Should* restano documentati ma si progettano dopo.

- Ogni requisito indica nella sua riga di stato la **fase** in cui si trova, cioè la prossima fase da completare per lui (vedi il modello in Appendice).
- Il **frammento** è l'unità a cui si applicano i criteri di completamento: una fase si dice completa *per quel frammento*.
- Lo stato di ogni pacchetto e frammento si riassume in `docs/avanzamento.md` (vedi sotto).

### Ciclo di vita di un pacchetto
Ogni pacchetto segue lo stesso giro, e può fermarsi a ogni passo:

1. **Nasce nel registro idee**, da cui tutto parte.
2. **Viene valutato:** diventa una decisione o dei requisiti, oppure si ferma (parcheggiato o rifiutato). La valutazione può essere leggera: se serve un tasto, si aggiunge.
3. **Attraversa le fasi.** Lungo il percorso può dividersi:
   - se un pezzo cambia *cosa* si vuole, torna nel registro idee come idea nuova, indicando il pacchetto da cui viene;
   - se cambia solo *quando* si fa, resta dov'è come rinvio in `docs/avanzamento.md`, con la fase entro cui riprenderlo.
4. **Un rinvio, quando il progetto raggiunge la sua fase, torna in valutazione:** si risolve, si rinvia di nuovo o diventa un'idea.

Un requisito può anche cambiare frammento lungo il percorso (per esempio da Must a Should, perché una fase ha mostrato che non serve subito). Si cambia la priorità nella sua riga, si registra nello storico con il motivo, e il requisito passa al frammento nuovo mantenendo le fasi già fatte: riparte da dove era arrivato quando quel frammento lo raggiunge. Non è un ripensamento del *cosa*, quindi non torna nel registro idee.

Una decisione presa non si modifica: se ci si ripensa, se ne scrive una nuova che la supera. Ogni pacchetto che si ferma, a qualsiasi passo, resta scritto con il suo motivo, così nessun pezzo si perde.

## Come capire se una fase è completa
Ogni fase termina con un **criterio di completamento**. Finché il criterio non è soddisfatto, passare alla fase successiva significa costruire su basi incerte. Se si decide di procedere comunque, va annotato cosa resta in sospeso, in `docs/avanzamento.md`.

Il criterio si valuta per frammento, non per tutto il progetto: "ogni requisito Must ha uno scenario" riguarda i requisiti del frammento che sta attraversando la fase.

## Convenzioni di codifica
Ogni elemento riceve un codice univoco, da riportare ovunque venga richiamato. I codici rendono i collegamenti precisi, permettono di valutare l'impatto di una modifica, di verificare che nulla resti scoperto e di mantenere riferimenti stabili anche quando i titoli cambiano. Nei progetti molto piccoli possono essere semplificati o omessi.

| Prefisso | Elemento | Dove |
|---|---|---|
| `RF-` | Requisito funzionale | Fase 1 |
| `RNF-` | Requisito non funzionale | Fase 1 |
| `FL-` | Flusso | Fase 2 |
| `RB-` | Regola di business | Fase 2 |
| `SF-` | Sfiga | Fase 2 |
| `EN-` | Entità | Fase 3 |
| `SC-` | Schermata | Fase 4 |
| `CMP-` | Componente | Fase 5 |
| `TC-` | Caso di test | Fase 8 |
| `ID-` | Idea | Registro idee |
| `DEC-` | Decisione | Registro decisioni |

## Organizzazione dei file
```
/
├── README.md                          ← cos'è il progetto e come avviarlo
├── AGENTS.md                          ← istruzioni per gli agenti IA
├── CHANGELOG.md                       ← note di rilascio (Fase 9)
├── CONTRIBUTING.md                    ← come si contribuisce
└── docs/
    ├── guida-documentazione.md        ← questa guida (il metodo)
    ├── avanzamento.md                 ← stato della documentazione: pacchetti, fasi, rinvii
    ├── generale/                      ← Fase 1 e parti comuni a tutto il progetto
    │   ├── visione.md
    │   ├── destinatari.md
    │   ├── requisiti-non-funzionali.md
    │   ├── glossario.md
    │   ├── catalogo-sfighe.md
    │   └── definition-of-ready-done.md
    ├── moduli/
    │   ├── _modello-modulo/           ← da copiare per ogni nuovo modulo
    │   │   ├── 1-requisiti.md         ← Fase 1 e criteri di accettazione (Fase 8)
    │   │   ├── 2-flussi.md            ← Fase 2
    │   │   ├── 3-entita.md            ← Fase 3
    │   │   ├── 4-schermate.md         ← Fasi 4 e 6 (link a wireframe e mockup)
    │   │   ├── 8-test.md              ← Fase 8 (piano di test, domande aperte)
    │   │   └── immagini/              ← esportazioni di wireframe e mockup (Fasi 4 e 6)
    │   └── nome-modulo/
    ├── design-system/                 ← Fase 5
    │   ├── moodboard.md
    │   ├── tokens.md
    │   └── componenti.md
    ├── architettura/                  ← Fase 7
    │   ├── architettura.md
    │   ├── api.md
    │   └── ambienti.md
    ├── rilascio/                      ← Fase 9
    │   ├── guida-utenti.md
    │   └── runbook.md
    └── registri/                      ← Parte B
        ├── idee.md
        ├── storico.md
        └── decisioni/
            ├── _modello.md
            └── DEC-01-titolo.md
```

Nei moduli il numero del file indica la fase in cui il file nasce. I numeri mancanti (5, 6, 7) sono le fasi che valgono per tutto il progetto e quindi vivono fuori dai moduli.

| Fase | Dove scrive |
|---|---|
| 1 – Requisiti | `generale/` (visione, destinatari, requisiti non funzionali, glossario) e `moduli/*/1-requisiti.md` |
| 2 – Flussi logici | `moduli/*/2-flussi.md` e `generale/catalogo-sfighe.md` |
| 3 – Entità | `moduli/*/3-entita.md` |
| 4 – Wireframe | `moduli/*/4-schermate.md`, con le esportazioni in `moduli/*/immagini/` |
| 5 – Design System | `design-system/` |
| 6 – Mockup | link ed esportazioni in `moduli/*/4-schermate.md` e `moduli/*/immagini/` |
| 7 – Architettura | `architettura/` |
| 8 – Handoff | criteri di accettazione in `moduli/*/1-requisiti.md`, `moduli/*/8-test.md`, `generale/definition-of-ready-done.md` |
| 9 – Rilascio | `rilascio/` e `CHANGELOG.md` |
| Parte B – Registri | `registri/` |
| Stato della documentazione | `avanzamento.md` |

## Lo stato della documentazione
`docs/avanzamento.md` dice a che punto è la documentazione: per ogni pacchetto e frammento, quali fasi sono complete e quale viene dopo; l'elenco unico di ciò che è stato **rinviato**, con la fase in cui va risolto e il documento in cui è annotato; le **deduzioni da confermare**, cioè comportamenti ricavati ma non ancora decisi, che finché restano lì non valgono come regole; e i **rischi accettati**, con la decisione che li ha accettati e quando rivederli.

- Non fa parte della fotografia né dei registri: descrive la documentazione, non il sistema. Si sovrascrive e le sue modifiche non si registrano nello storico.
- Si aggiorna alla chiusura di ogni fase per un frammento, e ogni volta che qualcosa viene rinviato o risolto.
- Chi riprende il lavoro, persona o agente, parte da qui.

## Disegni: strumento di design e repository
Wireframe, componenti visivi, mockup e prototipi (Fasi 4, 5 e 6) si disegnano in uno strumento di design (per esempio Figma), dove si possono modificare visivamente. La regola è: **il disegno vive nello strumento, nessuna decisione vive solo lì.**

- Ogni frame riporta il codice della schermata (`SC-`) o del componente (`CMP-`) che rappresenta.
- `moduli/*/4-schermate.md` contiene, per ogni schermata, il link al frame e tutto ciò che è una decisione: flussi, stati, testi, componenti usati.
- A ogni revisione, un'esportazione in immagine di ogni schermata si salva in `moduli/*/immagini/` con il nome del codice (`SC-01.png`). Così il repository resta leggibile senza lo strumento e ogni versione resta nello storico di git.
- I token del design system (Fase 5) vivono in `design-system/tokens.md` e vengono allineati alle variabili dello strumento.
- Una scelta presa guardando i disegni diventa una regola, una decisione o una domanda aperta, come ogni altra.
- Prima di chiudere una fase di disegno (4, 5, 6) si controlla in modo automatico che componenti e schermate usino solo token e stili di ruolo (nel progetto, il comando `/verifica-design`).

## Cosa non va in questa documentazione
La documentazione dice *cosa* costruire e *perché*. Chi fa cosa ed entro quando (task, scadenze, avanzamento dello sviluppo) vive nello strumento di gestione del progetto, collegato ai codici `RF-` e `FL-`. Duplicare quelle informazioni qui porta a contraddizioni. Lo stato della *documentazione* (quali fasi sono complete per quali requisiti) è un'altra cosa e vive in `docs/avanzamento.md`.

## Manutenzione del documento
- Ogni modifica alla fotografia si registra nei registri secondo le regole della **Parte B**.
- Il catalogo delle sfighe si arricchisce nel tempo con i problemi incontrati davvero in test o in produzione.
- `docs/avanzamento.md` si aggiorna alla chiusura di ogni fase e a ogni rinvio.

---

# Parte A – Dalla progettazione al rilascio

## Fase 1 – Requisiti
**Scopo:** capire *cosa* costruire e *perché*, prima di pensare al *come*.

- **Problema e contesto:** qual è il problema attuale? Come lo si risolve oggi, anche male (fogli di calcolo, carta, telefono)?
- **Visione e obiettivo:** una frase per la visione. Obiettivi misurabili quando possibile (es. "ridurre da 10 a 2 minuti il tempo per…").
- **Destinatari:** chi sono, il loro livello di competenza digitale, i dispositivi usati e il contesto d'uso (ufficio, in movimento, di fretta). Utili 2–3 **personas** sintetiche. Vanno distinti i **ruoli** (admin, operatore, utente finale), perché determinano permessi e schermate.
- **Requisiti funzionali:** cosa il sistema deve fare, scritti come user story: "Come *[ruolo]* voglio *[azione]* per *[beneficio]*". Ogni requisito ha una priorità secondo il metodo **MoSCoW**:
  - **Must:** indispensabile;
  - **Should:** importante ma rinviabile;
  - **Could:** desiderabile;
  - **Won't:** escluso per ora.
- **Requisiti non funzionali:** prestazioni, sicurezza, privacy/GDPR, accessibilità, lingue, supporto offline, browser e dispositivi supportati.
- **Vincoli e assunzioni:** budget, tempi, tecnologie imposte, integrazioni obbligatorie. Le assunzioni vanno scritte esplicitamente, perché sono i rischi nascosti.
- **Fuori dal progetto:** le esclusioni non si descrivono qui ma nel **registro idee**, con stato *Parcheggiata* (non ora) o *Rifiutata* (mai) e il relativo motivo. In questa sezione si riporta solo l'elenco dei codici `ID-` esclusi, per avere il quadro a colpo d'occhio.
- **Esempi concreti di utilizzo:** scenari narrativi, cioè racconti brevi di una persona reale che usa il prodotto dall'inizio alla fine. Qui l'immaginazione serve a far emergere requisiti che non erano stati pensati.
- **Glossario:** i termini del dominio con un significato unico e condiviso tra cliente, designer e sviluppatori.

**Output:** documento dei requisiti con user story prioritizzate.
**Completata quando:** ogni requisito "Must" ha almeno uno scenario d'uso che lo giustifica.

---

## Fase 2 – Flussi logici
**Scopo:** fissare la logica prima che l'interfaccia la nasconda.

Per ogni funzione rilevante si crea un diagramma di flusso (flowchart, oppure BPMN se ci sono più attori). Ogni flusso copre:

- **Percorso principale** (happy path): tutto va come previsto.
- **Percorsi alternativi:** l'utente sceglie strade diverse ma legittime.
- **Errori ed eccezioni:** verificati con il catalogo delle sfighe (vedi sotto).
- **Punti di decisione:** chi decide e in base a quale regola.
- **Attori:** chi fa cosa. Utile la notazione a corsie (swimlane) quando i ruoli sono più di uno.

Per gli oggetti che cambiano stato nel tempo (un ordine, una prenotazione, una pratica) si aggiunge un **diagramma a stati**: stati possibili, transizioni consentite e chi può attivarle.

Le **regole di business** si raccolgono a parte, in un elenco numerato (es. "una prenotazione è annullabile fino a 24h prima"). I flussi le richiamano con il loro codice.

### Il catalogo delle sfighe
Per ogni flusso si scorre l'elenco e ci si chiede: *"può succedere qui? E se succede, cosa accade?"*. Non tutte le sfighe si applicano a ogni flusso, ma ognuna va almeno considerata e scartata consapevolmente.

Per ogni sfiga pertinente il flusso deve prevedere:

1. **Rilevamento:** come se ne accorge il sistema.
2. **Comunicazione:** cosa vede l'utente, in linguaggio comprensibile.
3. **Via d'uscita:** come si recupera senza perdere lavoro o lasciare dati incoerenti.

Ogni sfiga ha un codice `SF-`, da riportare nei diagrammi dove viene gestita. In fase di test, ogni coppia flusso-sfiga diventa un caso di prova.

#### L'utente
- **Doppio click / invio ripetuto:** il pulsante "Conferma" premuto due volte crea due ordini o due pagamenti?
- **Abbandono a metà:** l'utente chiude tutto al passo 3 di 5. Si salva una bozza? Restano dati orfani?
- **Tasto indietro e refresh:** cosa succede se torna indietro dopo aver inviato, o ricarica la pagina durante l'invio?
- **Più schede aperte:** la stessa operazione portata avanti in due tab contemporaneamente.
- **Cambio idea:** vuole annullare o modificare dopo aver confermato. È possibile? Fino a quando?
- **Input "strani" ma legittimi:** nomi con apostrofi o accenti, cognomi lunghissimi, spazi iniziali e finali, testo incollato da Word, emoji, numeri con virgola o punto.
- **Dimenticanze:** password dimenticata, email sbagliata in registrazione, link di conferma mai cliccato.

#### Rete e dispositivo
- **Connessione che cade a metà:** l'operazione è andata a buon fine o no? L'utente lo sa?
- **Connessione lenta:** cosa vede durante l'attesa? Può fare danni cliccando ancora?
- **App in background o schermo bloccato** nel mezzo di un'operazione.
- **Schermo piccolo, zoom del testo al 200%, browser datato**, cookie o JavaScript bloccati.

#### Il tempo
- **Sessione scaduta** mentre l'utente compila un modulo lungo. Il lavoro si perde?
- **Scadenze superate durante l'operazione:** l'offerta scade mentre l'utente è al pagamento.
- **Fusi orari e ora legale:** un evento alle 2:30 nella notte del cambio d'ora esiste?
- **Date particolari:** 29 febbraio, fine mese, fine anno, mezzanotte, date nel passato dove servono future.

#### I dati
- **Vuoto:** nessun risultato, lista vuota, primo utilizzo in assoluto.
- **Troppo:** 10.000 elementi in una lista, un testo di 5.000 caratteri, un file enorme.
- **Valori limite:** zero, negativi, il massimo consentito, il massimo +1.
- **Duplicati:** lo stesso utente si registra due volte, lo stesso elemento viene inserito due volte.
- **Riferimenti spariti:** si visualizza o si usa qualcosa che nel frattempo è stato eliminato.
- **File problematici:** formato sbagliato, file corrotto, nome con caratteri speciali, foto ruotata.

#### La concorrenza
- **Due utenti modificano lo stesso dato** nello stesso momento. Chi vince? L'altro viene avvisato?
- **L'ultimo posto disponibile** prenotato da due persone nello stesso secondo.
- **Modifiche "da sopra":** l'admin cambia prezzi, permessi o configurazione mentre l'utente sta lavorando.

#### Permessi e account
- **Utente disattivato o ruolo cambiato** mentre è collegato.
- **Accesso via link diretto** a una pagina o a un dato che non gli spetta.
- **Account non ancora verificato** che prova a fare operazioni riservate.

#### I sistemi esterni
- **Pagamento rifiutato**, carta scaduta, autenticazione 3D Secure abbandonata.
- **Pagamento riuscito ma conferma mai arrivata:** i soldi sono stati presi ma il sistema non lo sa.
- **Servizio esterno lento o fuori uso:** mappe, email, SMS, API di terzi.
- **Notifiche perse:** l'email finisce in spam, l'SMS non arriva, la stessa notifica arriva due volte.

#### Il sistema
- **Errore del server** nel mezzo di un'operazione a più passaggi: resta tutto a metà?
- **Manutenzione o aggiornamento** durante l'uso, versione dell'app vecchia che comunica con un server nuovo.

#### I malintenzionati
- **Manipolazione di URL e ID:** cambiare `/ordine/123` in `/ordine/124` mostra l'ordine di un altro?
- **Tentativi ripetuti:** login a forza bruta, invio massivo di moduli, abuso di funzioni gratuite.
- **Input malevolo:** codice inserito nei campi di testo o nei file caricati.

**Output:** diagrammi di flusso, diagrammi a stati, elenco delle regole di business, sfighe gestite per ogni flusso.
**Completata quando:** per ogni flusso sai rispondere a "cosa succede se qui qualcosa va storto?".

---

## Fase 3 – Entità (modello dati)
**Scopo:** fissare *quali dati* esistono e come sono collegati, partendo dai sostantivi emersi nei flussi.

- **Entità:** l'elenco dei "sostantivi" del sistema (Utente, Prenotazione, Servizio…).
- **Attributi principali:** per ciascuno tipo, obbligatorietà e vincoli (unico, formato, intervallo). Non serve ancora il dettaglio tecnico da database.
- **Relazioni e cardinalità:** uno-a-uno, uno-a-molti, molti-a-molti, rappresentate con un **diagramma ER**.
- **Stati:** gli stati dei diagrammi della Fase 2 diventano attributi (es. `stato: bozza | confermata | annullata`).
- **Ciclo di vita del dato:** chi lo crea, chi lo modifica, se si cancella davvero o si archivia (soft delete).
- **Dati sensibili:** quali sono personali o riservati, chi può vederli e per quanto tempo si conservano.

**Output:** diagramma ER e dizionario dei dati.
**Completata quando:** ogni dato mostrato o richiesto nei flussi ha un'entità "di casa".

---

## Fase 4 – Wireframe e wireflow
**Scopo:** studiare struttura, gerarchia e usabilità senza la distrazione dell'estetica.

- **Solo bianco, nero e grigi.** Niente colori, loghi o immagini: si usano segnaposto (box con una X). Il testo deve essere realistico, non lorem ipsum, perché la lunghezza reale dei contenuti cambia gli ingombri.
- **Ingombri, volumi e spazi:** gerarchia dell'informazione (cosa si nota per primo, cosa per secondo), raggruppamenti e densità.
- **Approccio mobile-first** se il pubblico usa lo smartphone: la versione stretta obbliga a scegliere le priorità. I breakpoint principali si definiscono subito.
- **Stati di ogni schermata:** vuoto (primo utilizzo), caricamento, errore, successo, contenuto parziale o molto lungo. Derivano direttamente dalle sfighe della Fase 2.
- **Livelli di profondità (z-index):** si usa una scala fissa di livelli invece di numeri a caso. Per esempio:

  | Livello | Uso |
  |---|---|
  | 0 | Contenuto base |
  | 10 | Elementi sticky (header, barre) |
  | 20 | Dropdown, tooltip |
  | 30 | Overlay e drawer |
  | 40 | Modali |
  | 50 | Notifiche/toast |

  Insieme alla scala si fissano le regole di comportamento: si possono aprire due modali una sopra l'altra? Un toast copre una modale? Cosa succede al contenuto sotto un overlay?
- **Componenti concettuali:** si notano gli elementi che si ripetono (card, liste, form, filtri) e se ne annotano nome e scopo, senza disegnarli in dettaglio. Diventano l'inventario della Fase 5.
- **Wireflow:** si collegano le schermate seguendo i flussi della Fase 2. Ogni freccia corrisponde a un'azione dell'utente o a un evento del sistema.
- **Test rapido (consigliato):** mostrare i wireframe a 3–5 persone del pubblico target e chiedere di completare un compito.

**Output:** wireframe delle schermate con i loro stati, wireflow, scala z-index, inventario dei componenti.
**Completata quando:** ogni flusso della Fase 2 si può percorrere cliccando nel wireflow.

---

## Fase 5 – Design System
**Scopo:** dare un'identità visiva coerente e costruire i mattoni riutilizzabili.

### Prima di disegnare i componenti
Si decide come verrà costruita l'interfaccia: componenti da zero o da una libreria (quale), sistema di stile, web o nativo. È una `DEC-` della Fase 7 presa in anticipo, perché cambia cosa si può disegnare. Se si usa una libreria, il design system parte dal suo catalogo e ne diventa il tema. Anche i componenti "motore" (editor, calendario, tabelle) si scelgono qui, perché il loro comportamento entra nel disegno; quando il comportamento richiesto è insolito, una prova tecnica veloce verifica che la libreria lo sappia fare prima di rifinirlo.

### Moodboard
- Riferimenti visivi, tono di voce e parole chiave del brand (es. "affidabile, calmo, essenziale").
- Si preparano 2–3 direzioni alternative e se ne sceglie una esplicitamente, con motivazione.

### Tokens
Organizzati su tre livelli:

1. **Primitivi:** i valori grezzi (`blue-500`, `space-4`, `font-size-16`).
2. **Semantici:** il significato (`color-primary`, `color-danger`, `space-section`). I componenti usano questi.
3. **Di componente** (opzionali): `button-padding`, `card-radius`.

Il livello semantico vale per ogni categoria: colori, spazi, raggi, misure, ombre, durate. Un primitivo usato direttamente da un componente è una domanda aperta: o trova il suo semantico o diventa una regola visiva che lo giustifica. Gli spazi semantici nascono da un inventario dei ruoli (dentro un gruppo, tra blocchi, tra gruppi, bordo dei contenitori), non dai numeri.

Categorie tipiche: colore, tipografia (scala di dimensioni, pesi, interlinea), spaziatura, raggi, ombre ed elevazione (legate ai livelli z-index della Fase 4), bordi, durate delle animazioni, breakpoint.

Per ogni coppia colore/sfondo si verifica il contrasto: almeno **WCAG AA**, cioè 4.5:1 per il testo normale.

### Componenti base e avanzati
- **Base:** pulsanti, campi di input, checkbox, radio, select, icone, badge, link.
- **Composti/avanzati:** card, form, tabelle, modali, navigazione, filtri, date picker.

Per ogni componente la documentazione include:

- scopo e quando usarlo (e quando no);
- varianti (primario, secondario…) e dimensioni;
- tutti gli stati: default, hover, focus, attivo, disabilitato, errore, caricamento;
- comportamento da tastiera e requisiti di accessibilità;
- esempi d'uso corretti e scorretti.

**Output:** libreria di token e componenti documentata.
**Completata quando:** tutte le schermate della Fase 4 si possono costruire usando solo componenti del sistema, nessun componente usa un primitivo o un valore senza token, e ogni testo usa uno stile di ruolo.

---

## Fase 6 – Mockup ad alta fedeltà e prototipo
**Scopo:** vedere e provare il prodotto come sarà davvero, prima di scrivere codice.

- **Mockup:** i wireframe della Fase 4 rivestiti con token e componenti della Fase 5. Se una schermata richiede un componente che non esiste, si torna alla Fase 5 invece di inventarlo sul posto.
- **Contenuti definitivi:** titoli, etichette, testi dei pulsanti e soprattutto i **messaggi di errore**, scritti uno per uno a partire dalle sfighe della Fase 2.
- **Micro-interazioni:** transizioni, animazioni, feedback al click, usando le durate definite nei token.
- **Prototipo interattivo:** i flussi principali resi cliccabili.
- **Test di usabilità:** con 5 persone del pubblico target, su compiti concreti. I problemi emersi entrano nel registro idee o diventano correzioni.

**Output:** mockup di tutte le schermate con i loro stati, prototipo navigabile, testi definitivi.
**Completata quando:** ogni schermata usa solo componenti del design system e il test non ha rivelato problemi bloccanti.

---

## Fase 7 – Architettura tecnica
**Scopo:** decidere *come* il sistema verrà costruito, partendo da ciò che flussi ed entità richiedono.

- **Scelte tecnologiche:** linguaggi, framework, database, hosting. Ognuna è una decisione con le sue alternative, quindi va nel registro come `DEC-`.
- **Architettura generale:** un diagramma dei blocchi (frontend, backend, database, servizi esterni) e di come comunicano.
- **Modello dati fisico:** le entità della Fase 3 diventano tabelle o collezioni, con chiavi, indici e strategia di migrazione.
- **API:** gli endpoint derivano dai flussi della Fase 2. Per ciascuno si definiscono input, output e **codici di errore**, collegati alle sfighe che gestiscono.
- **Sicurezza:** autenticazione, autorizzazione per ruolo, protezione dei dati sensibili individuati nella Fase 3.
- **Integrazioni:** per ogni sistema esterno, cosa si scambia, cosa succede quando non risponde, come si gestiscono i duplicati.
- **Ambienti:** vedi sotto.

Questa fase non deve per forza aspettare la fine della 6: le scelte che cambiano cosa si può disegnare (costruzione dell'interfaccia e componenti "motore") si prendono già all'inizio della Fase 5 (vedi "Prima di disegnare i componenti"); il resto può procedere in parallelo con le Fasi 5 e 6.

### Ambienti
Un ambiente è la combinazione di cinque strati: codice (la versione di ogni componente), configurazione, dati, infrastruttura e servizi esterni. Due ambienti possono condividere lo stesso codice e differire solo nei dati, oppure il contrario.

#### Esempi di ambienti

| Ambiente | A cosa serve | Codice | Dati | Servizi esterni |
|---|---|---|---|---|
| **Locale** | Il singolo sviluppatore lavora | Il suo ramo in corso | Minimi, generati | Simulati |
| **Integrazione** | Verificare che i pezzi funzionino insieme | Ultima versione di ogni componente | Di prova, ricreabili | Sandbox |
| **Collaudo (staging)** | Verificare prima del rilascio, anche con il cliente | La versione candidata al rilascio | Realistici, anonimizzati | Sandbox |
| **Produzione** | Gli utenti veri | La versione rilasciata | Reali | Reali |
| **Effimeri** | Provare una singola modifica, poi si eliminano | Un ramo specifico | Di prova | Simulati o sandbox |

**Output:** diagramma di architettura, modello dati fisico, specifiche delle API, elenco degli ambienti.
**Completata quando:** ogni flusso ha gli endpoint che lo supportano e ogni sfiga ha una risposta tecnica definita.

---

## Fase 8 – Handoff e pianificazione
**Scopo:** trasformare la documentazione in lavoro che si può costruire e verificare senza zone grigie. È il punto in cui la progettazione passa il testimone allo sviluppo: tutto ciò che resta ambiguo qui verrà deciso da qualcun altro, in fretta, durante la scrittura del codice.

### Criteri di accettazione
Ogni `RF-` riceve dei criteri che definiscono in modo verificabile quando il requisito "funziona". Si scrivono nel formato:

*Dato* [un contesto], *quando* [un'azione], *allora* [un risultato osservabile].

Per esempio, per un requisito di annullamento prenotazione:

- *Dato* un appuntamento tra 3 giorni, *quando* il paziente preme "Annulla", *allora* l'appuntamento passa a stato "annullato" e riceve un'email di conferma.
- *Dato* un appuntamento tra 12 ore, *quando* il paziente prova ad annullare, *allora* il pulsante non è disponibile e un messaggio spiega la regola delle 24 ore (`RB-03`).
- *Dato* un annullamento appena confermato, *quando* il paziente preme di nuovo "Annulla", *allora* non succede nulla di diverso (`SF-01`).

I criteri si ricavano da tre fonti già presenti nella documentazione: il percorso principale del flusso, le regole di business e le sfighe gestite. Se per scriverli serve inventare qualcosa, significa che manca un pezzo in una fase precedente.

### Definition of Ready e Definition of Done
Due liste di controllo comuni a tutto il lavoro, decise una volta dal team:

- **Definition of Ready:** quando un requisito è pronto per essere sviluppato. Per esempio: ha criteri di accettazione, flusso completo, schermate e testi definitivi, endpoint specificati, nessuna domanda aperta.
- **Definition of Done:** quando un requisito è davvero finito. Per esempio: tutti i criteri superati, codice rivisto da un collega, test scritti, accessibilità verificata, documentazione aggiornata.

La prima protegge gli sviluppatori dal lavorare su specifiche incomplete. La seconda evita che "fatto" significhi cose diverse per persone diverse.

### Specifiche per lo sviluppo
Ciò che serve a chi scrive il codice per non dover interpretare:

- mockup con misure, token usati e tutti gli stati delle schermate (dalla Fase 6);
- componenti da usare, già presenti nel design system (dalla Fase 5);
- endpoint, formati dei dati e codici di errore (dalla Fase 7);
- testi definitivi, compresi i messaggi di errore.

Nella maggior parte dei casi non si scrive nulla di nuovo: si verifica che tutto ciò che serve esista già e sia raggiungibile dai codici del requisito.

### Piano di test
I casi di prova nascono dalla documentazione, non si inventano:

- ogni criterio di accettazione diventa almeno un caso di prova;
- ogni coppia flusso-sfiga gestita diventa un caso di prova;
- per ogni caso si indica in quale ambiente eseguirlo e con quale set di dati (dalla Fase 7).

### Domande aperte
Durante l'handoff emergono sempre dubbi. Si raccolgono in un elenco, ciascuno collegato al codice che riguarda, e ognuno deve avere una risposta prima che il requisito sia considerato pronto. Se la risposta cambia qualcosa di importante, diventa una `DEC-`.

### Presentazione allo sviluppo
Un incontro in cui chi ha progettato percorre i flussi con chi li svilupperà. Serve a far emergere le domande aperte di persona, prima che diventino ipotesi silenziose nel codice.

### Suddivisione in task
È qui che la documentazione si ferma. I requisiti pronti vengono suddivisi in task nello strumento di gestione del progetto, e ogni task riporta i codici `RF-` e `FL-` a cui si riferisce. Da questo momento avanzamento, assegnazioni e scadenze vivono lì.

**Output:** criteri di accettazione per ogni requisito, Definition of Ready e of Done, piano di test, domande aperte risolte.
**Completata quando:** ogni requisito da sviluppare soddisfa la Definition of Ready.

---

## Fase 9 – Rilascio e chiusura del ciclo
**Scopo:** accompagnare il prodotto nelle mani degli utenti e far tornare quanto imparato dentro la documentazione, così il ciclo successivo parte da una base più solida.

### Documentazione per gli utenti
Guide, FAQ, eventuali tutorial. Non si parte da zero: i destinatari e il loro livello di competenza sono descritti nella Fase 1, gli scenari d'uso della Fase 1 diventano spesso i capitoli della guida, e i messaggi di errore della Fase 6 suggeriscono le domande più frequenti. Si scrive con il linguaggio di chi usa il prodotto, non di chi l'ha costruito.

### Documentazione operativa
È per chi gestisce il sistema, non per chi lo usa: come si installa e si aggiorna, come si fa il backup e il ripristino, cosa si monitora, e cosa fare quando qualcosa si rompe. Quest'ultima parte, il *runbook*, è una raccolta di procedure del tipo "se succede X, fai Y". Molto viene dalle fasi precedenti: gli ambienti dalla Fase 7, le sfighe dei sistemi esterni dalla Fase 2.

### Note di rilascio
Un elenco di cosa è cambiato in questa versione, scritto per chi usa il prodotto. Non vanno confuse con lo storico della Parte B:

- lo **storico** è interno e registra ogni modifica alla documentazione, con il suo perché;
- le **note di rilascio** sono esterne e raccontano solo ciò che l'utente noterà, in parole sue.

Si scrivono partendo dai requisiti rilasciati: ogni `RF-` implementato e visibile all'utente diventa una voce delle note.

### Aggiornamento della fotografia
I requisiti rilasciati passano a stato *Implementato*, e così le idee collegate nel registro. Se durante lo sviluppo qualcosa è stato realizzato in modo diverso dal progettato, la fotografia va corretta ora: una documentazione che descrive un sistema diverso da quello reale induce in errore.

### Retrospettiva
Un momento in cui il team si chiede cosa è andato bene, cosa no e cosa si è scoperto. Gli esiti hanno una destinazione precisa:

- le sfighe incontrate davvero, in test o in produzione, entrano nel **catalogo delle sfighe**;
- le richieste e i suggerimenti nuovi entrano nel **registro idee**;
- i cambi di rotta importanti diventano **decisioni**;
- i miglioramenti al modo di lavorare possono diventare modifiche alla guida stessa.

Senza questa fase la documentazione si ferma all'handoff e da lì comincia a invecchiare. Con questa fase, ogni rilascio la lascia più accurata di prima.

**Output:** documentazione per gli utenti e operativa, note di rilascio, fotografia e registri aggiornati.
**Completata quando:** tutto ciò che è stato rilasciato risulta *Implementato* nella documentazione e le lezioni apprese sono finite nel registro giusto.

---

# Parte B – Registri

**Scopo:** tenere traccia di come il progetto evolve. La Parte A descrive cosa è vero oggi, i registri spiegano come ci si è arrivati.

**Regole generali**
- Nei registri si aggiunge, non si cancella.
- Ogni voce ha un codice, una data e un autore.
- Ogni modifica alla fotografia deve essere collegata a un'idea o a una decisione.

## B.1 – Registro idee
Raccoglie tutte le proposte, prima che diventino requisiti.

**Ogni idea riporta:** codice, descrizione breve, chi l'ha proposta, data, stato, posizione nella guida, esito.

**Stati:** Proposta → Accettata, oppure Parcheggiata o Rifiutata. Da quando è accettata, il percorso lo segue il requisito in cui è diventata (fase e stato nella sua riga), e l'idea non cambia più stato.

**Regole**
- Chiunque può proporre un'idea.
- Un'idea che nasce staccandosi da un pacchetto (vedi "Ciclo di vita di un pacchetto") riporta nella colonna "Proposta da" anche il codice da cui viene (es. "Manuel Cucca, da DEC-13").
- Il registro si rivede periodicamente, con una cadenza decisa dal team.
- Un'idea accettata diventa uno o più `RF-`, e la colonna "posizione" ne elenca i codici. La fase in cui si trova ciascuno è indicata nel requisito stesso.
- Un'idea parcheggiata o rifiutata ha sempre un motivo. Per quelle parcheggiate si indica quando rivalutarle.

**Completato quando:** nessuna idea resta in stato "Proposta" dopo una revisione.

## B.2 – Registro decisioni
Un file per ogni decisione importante.

**Quando serve una decisione:** c'erano alternative reali, la scelta è difficile da invertire, tocca elementi condivisi da più parti del progetto (visione, entità principali, design system), oppure rifiuta un'idea rilevante.

**Regola:** una decisione non si modifica mai. Se cambia, se ne scrive una nuova e la vecchia viene segnata come superata.

## B.3 – Storico
Una riga per ogni modifica alla fotografia, al design system e al metodo (questa guida). Si scrive per essere letto: chi lo apre deve capire cosa è cambiato e perché senza aprire altri file.

**Ogni riga riporta:** data, autore, cosa è cambiato, perché (codice `ID-` o `DEC-`).

**Regola:** le correzioni minori, come refusi o riformulazioni che non cambiano il significato, non si registrano.

---

# Appendice – Modelli

## Requisito funzionale
```markdown
**RF-00 – Titolo** · Priorità: Must | Should | Could | Won't · Origine: ID-00, DEC-00
Come *[ruolo]* voglio *[azione]* per *[beneficio]*.
Flussi: FL-00 · Entità: EN-00 · Fase: 1…9 · Stato: In progettazione | Pronto | Implementato
```

## Registro idee
```markdown
| Codice | Idea | Proposta da | Data | Stato | Posizione | Esito |
|---|---|---|---|---|---|---|
| ID-00 | Descrizione breve | Nome | gg/mm/aaaa | Proposta | — | — |
```

## Decisione
```markdown
# DEC-00 – Titolo
**Data:** gg/mm/aaaa · **Stato:** Proposta | Accettata | Superata da DEC-00 · **Idea di origine:** ID-00

**Contesto.** Qual è il problema.

**Opzioni valutate.**
A) ...
B) ...
C) ...

**Decisione.** Cosa si è scelto e perché.

**Conseguenze.** Cosa cambia nella fotografia (codici coinvolti).
```

## Storico
```markdown
| Data | Autore | Cosa è cambiato | Perché |
|---|---|---|---|
| gg/mm/aaaa | Nome | Aggiunto RF-00 | DEC-00 |
```
