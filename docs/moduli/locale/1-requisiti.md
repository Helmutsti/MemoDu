# Locale – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

Memodu come editor di file del disco, accanto alle note: niente passa dal server (DEC-115).

## RF-17 – File locali
**Priorità:** Must · **Origine:** ID-03, DEC-115 · **Fase:** 5 · **Stato:** In progettazione

Come *utente* voglio aprire e modificare in Memodu i file di testo delle mie cartelle sul disco per usarlo come editor anche per quello che non sta nelle note, senza che niente vada sul server.

Scelte di Manuel Cucca del 04/10/2026:
- Nella colonna c'è la voce **Locale**. Con «Aggiungi cartella» scelgo una o più cartelle del disco; sotto Locale compaiono loro e il loro contenuto.
- Si vedono solo i file **.md** e **.txt**; gli altri file non compaiono.
- Da Locale si creano, rinominano, spostano (anche trascinando) ed eliminano file e cartelle sul disco, come con le note. Eliminare manda nel Cestino del sistema (Windows o Mac), non in quello di Memodu.
- Si salva con **Ctrl + S** (⌘ + S su Mac): un segno mostra le modifiche non salvate e chiudendo il file Memodu chiede se salvare. È diverso dalle note, che si salvano da sole.
- Se un file aperto cambia sul disco per mano di un altro programma, compare un avviso «Il file è cambiato sul disco» con **Ricarica** o **Tieni la mia versione**.
- Tag, Info, ricerca e cestino di Memodu non valgono per i file locali: hanno nome, posizione e contenuto, come sul disco.
- Niente passaggi tra note e file locali, per ora: si copia e incolla il testo (l'importazione è RF-13).
- Niente si sincronizza: né i file né l'elenco delle cartelle aggiunte, che vale solo per il computer su cui si aggiungono (confermato il 04/10/2026: i percorsi del disco cambiano da un computer all'altro).

**Collegamenti:** RF-02 (lo stesso editor) · RF-05 · RF-13

### Scenario d'uso
Ho sul disco una cartella di appunti in .md che uso anche con altri programmi (un progetto, la documentazione di un repository). In Memodu, sotto Locale, aggiungo la cartella; apro un file, lo correggo e salvo con Ctrl + S. Creo un file nuovo accanto e ne rinomino un altro. Se intanto lo stesso file cambia in un altro programma, Memodu me lo dice e scelgo quale versione tenere. Niente di tutto questo va sul server.

### Criteri di accettazione
Da scrivere in Fase 8.

---

## Fuori dal modulo
Codici del registro idee esclusi da questo modulo:
- ID-06 (modalità offline o solo locale delle note): parcheggiata, DEC-01.
