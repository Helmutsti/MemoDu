# Organizzazione – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

L'organizzazione è un effetto secondario della scrittura: l'utente ha piena libertà su come organizzare le proprie note.

## RF-05 – Struttura di cartelle
**Priorità:** Must · **Origine:** — · **Stato:** In progettazione

Come *utente* voglio organizzare le note in un albero di cartelle per dare loro una collocazione fisica.

- Ogni nota sta in una sola cartella; per appartenere a più gruppi si usano i tag (RF-06).
- Una nota può anche stare fuori da qualsiasi cartella, nella radice. Le note nella radice sono le "note non organizzate": compaiono nella barra laterale e ne escono appena vengono spostate in una cartella, anche se non hanno tag.

**Collegamenti:** FL-00 · EN-00 · SC-00

### Scenario d'uso
Condiviso con RF-04 e RF-06: Scrivo la nota. Le note non ancora organizzate compaiono in una barra laterale e da lì le trascino nell'albero delle cartelle. Quando apro una nota, dal menu in alto a destra posso aggiungere tag, spostarla in un'altra cartella o modificarne i metadati. Il titolo è l'unico metadato che modifico direttamente nella schermata di scrittura.

### Criteri di accettazione
- [Da compilare]

---

## RF-06 – Tag
**Priorità:** Must · **Origine:** — · **Stato:** In progettazione

Come *utente* voglio assegnare tag alle note per raggrupparle in modo trasversale alle cartelle.

- I tag sono gerarchici: si possono annidare (es. `lavoro/clienti/rossi`).
- Cercando un tag si trovano anche le note con i suoi sotto-tag (RF-08).

**Collegamenti:** FL-00 · EN-00 · SC-00 · RF-04 · RF-08

### Scenario d'uso
Condiviso con RF-04 e RF-05: vedi lo scenario di RF-05.

### Criteri di accettazione
- [Da compilare]

---

## RF-07 – Workspace multipli
**Priorità:** Should · **Origine:** DEC-01 · **Stato:** In progettazione

Come *utente* voglio creare più workspace per separare ambiti diversi (per esempio lavoro e vita privata) e non avere tutte le note mischiate.

Nella prima fase la separazione tra ambiti si ottiene con le cartelle principali (per esempio "Lavoro" e "Personale"); i workspace arrivano dopo, anche se la persona usa Memodu sia per lavoro sia per la vita privata.

**Collegamenti:** FL-00 · EN-00 · SC-00

### Scenario d'uso
[Da compilare]

### Criteri di accettazione
- [Da compilare]

---

## RF-08 – Ricerca e filtro
**Priorità:** Must · **Origine:** — · **Stato:** In progettazione

Come *utente* voglio cercare e filtrare le note per trovare subito quella che mi serve.

La ricerca e il filtro agiscono su:
- titolo;
- testo della nota;
- tag, sotto-tag compresi (RF-06);
- date dei metadati: creazione, ultima modifica, fine validità (RF-04).

Con la cifratura end-to-end (RF-10) il server non legge le note: la ricerca nel testo avviene sul dispositivo.

**Collegamenti:** FL-00 · EN-00 · SC-00 · RF-04 · RF-06 · RF-10

### Scenario d'uso
Inizio a scrivere nella barra di ricerca dell'interfaccia e i risultati compaiono in sovraimpressione, in una card a discesa.

### Criteri di accettazione
- [Da compilare]

---

## RF-09 – Blocco con password di workspace e note
**Priorità:** Should · **Origine:** DEC-01 · **Stato:** In progettazione

Come *utente* voglio proteggere con una password un workspace o una singola nota per impedirne la lettura a chi usa il mio dispositivo.

**Collegamenti:** FL-00 · EN-00 · SC-00 · RNF-02

### Scenario d'uso
[Da compilare]

### Criteri di accettazione
- [Da compilare]

---

## Fuori dal modulo
Codici del registro idee esclusi da questo modulo:
- ID-02 – Vault come cassaforte (rifiutata: coperta da RF-09)
- ID-04 – Link interni tra note (parcheggiata)
