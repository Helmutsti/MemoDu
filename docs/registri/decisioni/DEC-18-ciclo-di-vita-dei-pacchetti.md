# DEC-18 – Ciclo di vita dei pacchetti

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-09 ha introdotto pacchetti, frammenti e rinvii, ma non diceva cosa succede a un pacchetto che nasce quando il progetto è già avanti (come DEC-13 e DEC-17, nati in Fase 5), né che fine fanno i pezzi che si staccano lungo il percorso o i rinvii quando il progetto li raggiunge. Guardando la mappa dei pacchetti, Manuel Cucca ha proposto una visione più semplice: i pacchetti contengono idee, possono fermarsi a ogni passo, e tutto ciò che si stacca o viene rinviato riparte dalla valutazione.

## Opzioni valutate
A) Un modello con più tipi di stato (punto di nascita, rincorsa, aggancio, debito, blocco).
B) Un solo giro: registro idee, valutazione, viaggio lungo le fasi; i pezzi che cambiano *cosa* si vuole tornano nel registro idee, quelli che cambiano solo *quando* restano come rinvii; ogni rinvio raggiunto torna in valutazione.

## Decisione
Opzione B, proposta da Manuel Cucca. Motivi e scelte emerse ragionandoci:
- Se un pacchetto nato tardi non ha ancora percorso tutte le sue fasi, il progetto può andare avanti lasciando il pezzo in sospeso, purché il percorso resti scritto e si possa riprendere; tra aspettare e andare avanti si sceglie la modifica meno dolorosa dopo.
- La valutazione di un pacchetto nuovo è obbligatoria ma può essere implicita (se serve un tasto, si aggiunge).
- Un frammento Should può essere una decisione rinviata, che può anche portare a un ripensamento, oppure una parte con meno priorità, per un percorso più snello.
- Un rinvio raggiunto dal progetto torna in valutazione, non è automaticamente "da fare".
- Una decisione non si modifica: se ci si ripensa, se ne scrive una nuova che la supera.

## Conseguenze
- `guida-documentazione.md`: nuovo paragrafo "Ciclo di vita di un pacchetto" nella sezione "Pacchetti e frammenti". Nessun'altra regola della guida cambia; DEC-09 resta valida.
- I registri e `docs/avanzamento.md` restano quelli che sono: registro idee, registro decisioni, fase dei requisiti, rinvii.
- La mappa dei pacchetti (artifact) è una vista di comodo, non un documento.
