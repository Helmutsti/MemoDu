# Brainet – Flussi

<!-- Fase 2 della guida. I diagrammi si scrivono in Mermaid. Scritti dall'agente il 14/10/2026 dalle scelte di Manuel Cucca in `1-requisiti.md`; da approvare. -->

## FL-16 – Scrivere una nota Brainet
**Requisito:** RF-18 · **Attori:** Utente, Sistema

```mermaid
flowchart TD
    A[Il + accanto a Brainet nella colonna - RB-101] --> B[Foglio nuovo, vuoto, con il cursore - RB-101]
    B --> C[Scrivo; si salva da solo come le note - RB-102]
    C --> D{Scrivo @?}
    D -- Sì --> E[FL-17 Citare un'entità]
    E --> C
    C --> F{Seleziono una frase?}
    F -- Sì --> G[FL-18 Evidenziare un'area]
    G --> C
    C --> H[Chiudo il foglio o ne apro un altro]
    H --> I{Il foglio è vuoto?}
    I -- Sì --> J[Non resta niente - RB-102]
    I -- No --> K[La nota resta nel Database, con un pallino nel Calendario nel giorno in cui è nata - RB-103]
    K --> L[Dal Database la riapro e la modifico quando voglio; il giorno nel Calendario non cambia - RB-103]
```

### Percorsi alternativi
- **Senza rete:** si scrive come sempre; la nota parte quando la rete torna (RF-10).
- **Database nascosto:** la nota si scrive lo stesso; per rileggerla si riaccende «Mostra il Database» (RB-106).

### Sfighe gestite
| Sfiga | Rilevamento | Comunicazione | Via d'uscita |
|---|---|---|---|
| SF-02 Abbandono a metà | Il foglio si chiude con del testo | Nessuna | Il testo è già salvato (RB-102) |
| SF-16 Vuoto | Il foglio si chiude senza testo | Nessuna | Non nasce niente (RB-102) |
| SF-22 Modifica simultanea | La stessa nota modificata su due computer | Come le note (RB-39) | Una copia in conflitto, come in CLOUD (DEC-06) |

### Sfighe considerate e scartate
- SF-17 Troppo: vale il limite delle note (DEC-106).
- Le altre sfighe non riguardano la scrittura.

---

## FL-17 – Citare un'entità
**Requisito:** RF-18 · **Attori:** Utente, Sistema

```mermaid
flowchart TD
    A[Scrivo @ e qualche lettera] --> B[Menu dei suggerimenti sotto il cursore, con le sezioni per tipo e il titolo sopra; il primo è evidenziato - RB-104]
    B --> C{Cosa faccio?}
    C -- Frecce e Invio, o un clic --> D[@ e le lettere diventano la pillola dell'entità - RB-104]
    C -- Crea «…» --> E[Nasce l'entità, senza tipo, e la sua pillola; la scrittura non si interrompe - RB-105]
    C -- Esc --> F[Il menu si chiude; resta il testo scritto, senza pillola]
    D --> G[Continuo a scrivere]
    E --> G
    G --> H{Backspace subito dopo la pillola?}
    H -- Sì --> I[La pillola si toglie tutta, come in Gmail - RB-104]
```

### Percorsi alternativi
- **Nessun suggerimento:** nel menu resta solo «Crea «…»».
- **Pillola in un'area:** l'area prende da sola anche l'entità citata (RB-107).

### Sfighe gestite
| Sfiga | Rilevamento | Comunicazione | Via d'uscita |
|---|---|---|---|
| SF-19 Duplicati | La stessa persona creata due volte con nomi diversi | Nessuna | FL-19 Unire due entità |
| SF-06 Input strani | Nomi con accenti, apostrofi, spazi | Nessuna | Il filtro ignora maiuscole e accenti (proposta dell'agente) |
| SF-20 Riferimenti spariti | L'entità della pillola è stata unita a un'altra | Nessuna | La pillola mostra l'entità che resta (RB-108) |

### Sfighe considerate e scartate
- SF-01 Doppio invio: Invio due volte crea una pillola sola, poi va a capo.
- Le altre sfighe non riguardano le citazioni.

---

## FL-18 – Evidenziare un'area
**Requisito:** RF-18 · **Attori:** Utente, Sistema

```mermaid
flowchart TD
    A[Seleziono una frase] --> B[Compare il menu: in cima gli Stati con il loro colore, poi le entità per tipo, in fondo Crea - RB-107]
    B --> C[Scelgo uno o più stati ed entità - RB-107]
    C --> D[La frase resta evidenziata: è un'area con i suoi legami - RB-107]
    D --> E[Passo sopra l'area con il mouse]
    E --> F[Riquadro e linguetta con stati ed entità e una freccia - RB-109]
    F --> G[Freccia: lo stesso menu, con le voci già scelte spuntate - RB-109]
    G --> H{Tolgo tutte le voci?}
    H -- Sì --> I[L'area sparisce, la frase torna testo normale - RB-109]
    H -- No --> D
```

### Percorsi alternativi
- **Un'area con una pillola dentro:** prende da sola anche l'entità citata (RB-107).
- **Aree sovrapposte:** due aree diverse sulla stessa frase restano tutte e due (proposta dell'agente).

### Sfighe gestite
| Sfiga | Rilevamento | Comunicazione | Via d'uscita |
|---|---|---|---|
| SF-05 Cambio idea | Uno stato o un'entità scelti per errore | Linguetta | Freccia e la tolgo (RB-109) |
| SF-20 Riferimenti spariti | Lo stato è stato tolto dalle Impostazioni | Nessuna | Sparisce dall'area; l'area resta se ha altri legami (RB-110) |
| SF-22 Modifica simultanea | La frase cambiata su un altro computer | Come le note | L'area segue il testo; se la frase sparisce, sparisce anche l'area (proposta dell'agente) |

### Sfighe considerate e scartate
- Le altre sfighe non riguardano le aree.

---

## FL-19 – Unire due entità
**Requisito:** RF-18 · **Attori:** Utente, Sistema

```mermaid
flowchart TD
    A[In Entità, tasto destro su una riga] --> B[Unisci a…]
    B --> C[Scelgo l'altra entità - RB-108]
    C --> D[Resta l'entità scelta, con il suo nome; citazioni e aree dell'altra passano a lei - RB-108]
```

### Sfighe gestite
| Sfiga | Rilevamento | Comunicazione | Via d'uscita |
|---|---|---|---|
| SF-05 Cambio idea | Unione sbagliata | Nessuna | Da decidere: annullare l'unione (proposta dell'agente: Ctrl + Z subito dopo) |
| SF-22 Modifica simultanea | La stessa entità usata su un altro computer mentre si unisce | Nessuna | Le citazioni nuove arrivate dopo passano anch'esse all'entità che resta (RB-108) |

---

## FL-20 – Accendere e spegnere Brainet e il Database
**Requisito:** RF-18 · **Attori:** Utente, Sistema

```mermaid
flowchart TD
    A[Impostazioni, gruppo Brainet] --> B{Brainet è acceso?}
    B -- No --> C[C'è solo «Usa Brainet»; nella colonna niente Brainet - RB-106]
    C --> D[Accendo: nella colonna compare Brainet, nelle Impostazioni «Mostra il Database» e gli stati - RB-106]
    B -- Sì --> E{Cosa cambio?}
    E -- Mostra il Database --> F[Database sparisce o torna nella colonna; i dati restano - RB-106]
    E -- Spengo Brainet --> G[Conferma: Annulla o Spegni e cancella tutto - RB-111]
    G -- Annulla --> H[Resta acceso]
    G -- Spegni e cancella tutto --> I[Note, entità, aree e stati di Brainet cancellati su tutti i computer; Brainet spento - RB-111]
```

### Sfighe gestite
| Sfiga | Rilevamento | Comunicazione | Via d'uscita |
|---|---|---|---|
| SF-01 Doppio invio | Doppio clic su «Spegni e cancella tutto» | Nessuna | Una cancellazione sola |
| SF-05 Cambio idea | Interruttore spento per sbaglio | La finestra di conferma | «Annulla» (RB-111) |
| SF-08 Rete che cade | La cancellazione parte senza rete | Nessuna | Parte quando la rete torna; sugli altri computer Brainet si cancella al primo contatto |
| SF-24 Modifiche «da sopra» | Brainet cancellato da un altro computer mentre scrivo | Da decidere | Proposta dell'agente: la sezione sparisce e il foglio aperto si chiude, con un avviso |

---

## FL-21 – Creare e togliere gli stati
**Requisito:** RF-18 · **Attori:** Utente, Sistema

```mermaid
flowchart TD
    A[Impostazioni, Stati delle evidenziature] --> B{Cosa faccio?}
    B -- Aggiungi uno stato --> C[Nome e colore; compare nel menu della selezione - RB-110]
    B -- Togli --> D[Memodu propone di cambiarlo con un altro stato - RB-110]
    D -- Lo cambio --> E[Le aree prendono lo stato nuovo]
    D -- Lo tolgo --> F[Sparisce da tutte le aree; un'area sparisce solo se era il suo ultimo legame - RB-110]
```

---

## FL-22 – Importare una nota in Brainet
**Requisito:** RF-18 · **Attori:** Utente, Sistema

```mermaid
flowchart TD
    A[Tasto destro su una nota di CLOUD nella colonna] --> B[Importa in Brainet]
    B --> C{Copia o Sposta? - RB-112}
    C -- Copia --> D[La nota resta in CLOUD e una copia entra in Brainet]
    C -- Sposta --> E[La nota esce da CLOUD ed entra in Brainet]
    D --> F[In Brainet prende le date della nota: nel Calendario il giorno in cui era stata creata; tag e cartella si perdono - RB-112]
    E --> F
```

### Sfighe gestite
| Sfiga | Rilevamento | Comunicazione | Via d'uscita |
|---|---|---|---|
| SF-01 Doppio invio | La stessa nota copiata due volte | Nessuna | Due frammenti uguali; si toglie uno dal Database |
| SF-21 File problematici | Una nota con immagini (rinviate dopo la v1) | Nessuna | Da decidere quando arrivano le immagini |

---

## Punti da decidere nei flussi
- ~~Cosa fa un clic su un giorno del Calendario.~~ Niente: il Calendario si guarda soltanto (scelta di Manuel Cucca del 14/10/2026, RB-113).
- Come si annulla un'unione di entità sbagliata (FL-19).
- Cosa vede chi sta scrivendo quando Brainet viene cancellato da un altro computer (FL-20).
- Se Brainet, spento su un computer, resta acceso sugli altri: oggi spegnere cancella tutto, quindi vale per tutti.

## Regole di business
| Codice | Regola | Usata in |
|---|---|---|
| RB-101 | Il + accanto al titolo Brainet, come nelle altre sezioni, apre un foglio nuovo che accetta testo | FL-16 |
| RB-102 | La nota Brainet si salva da sola mentre si scrive, come le note; un foglio chiuso vuoto non lascia niente (proposta dell'agente) | FL-16 |
| RB-103 | Una nota Brainet si legge e si modifica solo dal Database; nel Calendario resta il giorno in cui è nata | FL-16 |
| RB-104 | Con @ si apre il menu dei suggerimenti, diviso per tipo con il titolo sopra; frecce e Invio o un clic scelgono; Esc chiude; Backspace subito dopo una pillola la toglie tutta | FL-17 |
| RB-105 | «Crea «…»» fa nascere l'entità senza tipo, senza interrompere la scrittura; il tipo si assegna più avanti | FL-17 |
| RB-106 | «Usa Brainet» spento: niente Brainet né nella colonna né nelle Impostazioni, a parte l'interruttore. «Mostra il Database» spento: la voce Database sparisce dalla colonna, i dati restano | FL-16, FL-20 |
| RB-107 | Un'area è una frase evidenziata legata a uno o più stati ed entità, scelti dal menu della selezione; un'area che contiene una pillola prende anche l'entità citata | FL-17, FL-18 |
| RB-108 | «Unisci a…» in Entità: resta l'entità scelta, con il suo nome; citazioni e aree dell'altra passano a lei | FL-19 |
| RB-109 | Passando sopra un'area compaiono il riquadro e la linguetta con i suoi legami; la freccia apre il menu con le voci spuntate; tolte tutte, l'area sparisce | FL-18 |
| RB-110 | Gli stati sono un elenco breve nelle Impostazioni, ognuno con un colore; togliendone uno Memodu propone di cambiarlo, e tolto sparisce dalle aree, che spariscono solo se era il loro ultimo legame | FL-18, FL-21 |
| RB-111 | Spegnere Brainet vuol dire cancellarlo: conferma con «Annulla» e «Spegni e cancella tutto»; si cancellano note, entità, aree e stati su tutti i computer | FL-20 |
| RB-112 | Una nota di CLOUD si importa in Brainet dal menu della colonna, «Importa in Brainet» › Copia o Sposta; prende le date della nota, tag e cartella si perdono | FL-22 |
| RB-113 | Il Calendario si guarda soltanto: un clic su un giorno non fa niente | — |
