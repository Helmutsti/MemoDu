# Locale – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

Memodu come editor di file del disco, accanto alle note: niente passa dal server (DEC-115).

## RF-17 – File locali
**Priorità:** Must · **Origine:** ID-03, DEC-115 · **Fase:** 9 · **Stato:** Implementato (rilasciato fino alla 0.1.13, 07/10/2026)

Come *utente* voglio aprire e modificare in Memodu i file di testo delle mie cartelle sul disco per usarlo come editor anche per quello che non sta nelle note, senza che niente vada sul server.

Scelte di Manuel Cucca del 04/10/2026:
- Nella colonna c'è la voce **Locale**. Con «Aggiungi cartella» scelgo una o più cartelle del disco; sotto Locale compaiono loro e il loro contenuto. Posso anche **trascinare** dentro Memodu, ovunque, cartelle e file .md o .txt da Esplora file o dal Finder: le cartelle entrano come cartelle, i file da soli (DEC-120).
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
Scritti dall'agente da flussi, regole e decisioni (FL-10 … FL-13, RB-73 … RB-85, DEC-118), approvati da Manuel Cucca il 04/10/2026.
- **CA-17.1** *Dato* Locale nella colonna, *quando* premo + e scelgo una cartella del disco, *allora* compare sotto Locale, in ordine alfabetico, con le sue sottocartelle non nascoste e i soli file .md e .txt; su un altro computer non compare (RB-73, RB-75).
- **CA-17.2** *Dato* una cartella già nell'elenco, *quando* aggiungo lei o una sua sottocartella, *allora* non si aggiunge di nuovo e si apre quella che c'è (RB-74).
- **CA-17.3** *Dato* una cartella dell'elenco, *quando* scelgo Togli da Locale, *allora* sparisce dall'elenco e sul disco non cambia niente (RB-76).
- **CA-17.4** *Dato* una cartella dell'elenco che sul disco non c'è più, *quando* guardo la colonna, *allora* la vedo «non trovata», con Togli da Locale; rimessa al suo posto, torna piena.
- **CA-17.5** *Dato* un file aperto, *quando* scrivo, *allora* compare il pallino nel percorso e nella riga; con Ctrl + S (⌘ + S su Mac) il file sul disco ha il testo nuovo e il pallino sparisce (RB-77, RB-79).
- **CA-17.6** *Dato* un file con modifiche non salvate, *quando* apro un'altra nota o un altro file, oppure chiudo e riapro Memodu, *allora* riaprendo il file ritrovo le modifiche con il pallino, e il file sul disco è ancora quello di prima (RB-78).
- **CA-17.7** *Dato* un file con gli a capo di Windows o con il BOM, *quando* lo modifico e salvo, *allora* a capo e BOM restano come erano (RB-79).
- **CA-17.8** *Dato* un file non UTF-8 con lettere accentate, *quando* lo apro, *allora* gli accenti sono giusti; al primo Ctrl + S il file diventa UTF-8 e compare una volta l'avviso «l'ho salvato in UTF-8» (RB-80).
- **CA-17.9** *Dato* il + o Nuovo file su una cartella, *quando* scrivo e premo Ctrl + S, *allora* il file nasce sul disco con il nome dalla prima riga e l'estensione .md, con un numero se il nome c'è già; prima del Ctrl + S sul disco non c'è (RB-81).
- **CA-17.10** *Dato* una cartella o un file in Locale, *quando* creo una cartella, rinomino, sposto (anche trascinando e tra cartelle dell'elenco) o elimino, *allora* sul disco succede lo stesso; un nome non ammesso o già usato è rifiutato con il motivo (RB-82).
- **CA-17.11** *Dato* un file o una cartella in Locale, *quando* lo elimino, *allora* finisce nel Cestino del sistema senza domande; su un disco senza Cestino Memodu chiede prima se eliminarlo per sempre (RB-83).
- **CA-17.12** *Dato* una cartella dell'elenco, *quando* un altro programma crea, rinomina o elimina un file, *allora* la colonna si aggiorna entro 2 secondi (RB-84).
- **CA-17.13** *Dato* un file aperto o con modifiche in sospeso, *quando* un altro programma lo cambia, *allora* compare l'avviso con Ricarica e Tieni la mia versione: Ricarica mostra il testo del disco, Tieni la mia versione lascia il mio e il Ctrl + S successivo lo scrive sopra (RB-85).
- **CA-17.14** *Dato* un file aperto o con modifiche in sospeso, *quando* un altro programma lo elimina o lo sposta, *allora* compare l'avviso con Ricrealo e Chiudi: Ricrealo lo fa rinascere al suo posto al Ctrl + S, Chiudi lo chiude e scarta le modifiche (RB-85).
- **CA-17.15** *Dato* un file oltre 10 MB, *quando* lo apro, *allora* al posto del testo vedo che è troppo grande; un file in sola lettura si apre ma non si modifica, con il motivo.
- **CA-17.16** *Dato* il disco che rifiuta il salvataggio (permessi, file bloccato, disco pieno), *quando* premo Ctrl + S, *allora* compare l'avviso con il motivo, il file sul disco è intatto e le modifiche restano in sospeso (SF-37).
- **CA-17.17** *Dato* un percorso fuori dalle cartelle dell'elenco, anche dietro un collegamento simbolico, *quando* l'interfaccia chiede di leggerlo o scriverlo, *allora* il nucleo rifiuta (DEC-118).
- **CA-17.18** *Dato* l'uso di Locale, *quando* Memodu sincronizza, *allora* al server non arriva niente di Locale: né file, né elenco, né modifiche in sospeso (DEC-115).
- **CA-17.19** *Dato* Esplora file o il Finder, *quando* trascino dentro Memodu, in qualsiasi punto, una cartella e un file .md, *allora* mentre trascino tutta la finestra si oscura con «Rilascia per aggiungere a Locale» e, rilasciando, niente entra nel testo aperto, la cartella compare in Locale come cartella e il file da solo, prima delle cartelle; un file di altro tipo resta fuori con un avviso (DEC-120).
- **CA-17.20** *Dato* un file aperto, *quando* clicco sul suo nome nel percorso, *allora* sotto il percorso si apre la comparsa con il campo del nome, un divisore e Chiudi file (Ctrl + W); per un file aggiunto da solo all'elenco c'è anche Togli da Locale, per un file dentro una cartella aggiunta no. Niente cartella, date o tag; Esc o un clic fuori la chiudono (DEC-123).
- **CA-17.21** *Dato* la comparsa del file, *quando* cambio il nome nel campo e premo Invio, *allora* il file si rinomina sul disco con le stesse regole di oggi e il percorso e la colonna mostrano il nome nuovo (RB-82, DEC-123).
- **CA-17.22** *Dato* un file con modifiche non salvate, *quando* nella comparsa scelgo Chiudi file, *allora* l'area resta vuota, nessuna domanda, il pallino resta nella colonna e riaprendo il file ritrovo le modifiche (RB-78, DEC-117, DEC-123).
- **CA-17.23** *Dato* un file aggiunto da solo all'elenco, *quando* nella comparsa scelgo Togli da Locale, *allora* il file sparisce dalla colonna, l'area resta vuota e sul disco il file c'è ancora (RB-76, DEC-123).
- **CA-17.24** *Dato* un file nuovo mai salvato («Senza titolo»), *quando* clicco sul suo nome nel percorso, *allora* la comparsa ha solo Chiudi file e il nome non si cambia dal campo: lo prende al primo Ctrl + S (RB-81, DEC-123).

---

## Fuori dal modulo
Codici del registro idee esclusi da questo modulo:
- ID-06 (modalità offline o solo locale delle note): parcheggiata, DEC-01.
