# Interfaccia – Requisiti

<!-- Fase 1 della guida, con i criteri di accettazione della Fase 8. Copia il blocco per ogni requisito. -->

L'interfaccia deve essere semplice e intuitiva (`RNF-08`) e favorire velocità e produttività.

## RF-11 – Interazioni rapide
**Priorità:** Must · **Origine:** — · **Fase:** 6 · **Stato:** In progettazione

Come *utente* voglio usare trascinamento, menu del tasto destro e scorciatoie da tastiera per lavorare sulle note senza passare da menu e finestre di dialogo.

Le scorciatoie interne sono fisse e documentate. Solo la scorciatoia globale della nota rapida (RF-01) si può cambiare, per evitare conflitti con altri programmi.

**Collegamenti:** FL-01 · FL-03 · FL-05 · EN-07 · SC-00 · RF-01

### Scenario d'uso
Trascino con il mouse le note da organizzare dalla barra laterale all'albero delle cartelle (vedi lo scenario di RF-05).

### Criteri di accettazione
- [Da compilare]

---

## RF-12 – Finestre multiple e sganciabili (desktop)
**Priorità:** Must per le note sganciate (DEC-92); il resto Should · **Origine:** DEC-01, DEC-92 · **Fase:** 5 · **Stato:** In progettazione

Come *utente desktop* voglio aprire più note in finestre affiancate, sganciarle dall'applicazione principale e ricollegarle per consultare e scrivere più note contemporaneamente.

Una nota **sganciata** si apre in una finestra propria, che si sposta, si ridimensiona e si può tenere in primo piano; nella finestra principale al suo posto c'è «Questa nota è sganciata» (DEC-92). Le finestre affiancate liberamente restano *Should*.

**Collegamenti:** FL-02 · EN-01 · SC-01 · SC-03

### Scenario d'uso
Sto scrivendo un documento in un altro programma e mi serve una nota con i dati sott'occhio: la sgancio, la metto accanto e la tengo in primo piano. Nella finestra di Memodu, se la riapro, mi ricorda che è sganciata e con un clic la ritrovo o la riaggancio.

### Criteri di accettazione
- **CA-12.1** *Dato* una nota aperta, *quando* scelgo «Sgancia in una finestra» dal menu `···` o dal tasto destro sulla nota nella colonna, *allora* la nota si apre in una finestra propria, con il percorso e il testo, e nella finestra principale al suo posto compare «Questa nota è sganciata» (DEC-92).
- **CA-12.2** *Dato* una nota sganciata, *quando* la apro nella finestra principale, *allora* vedo «Questa nota è sganciata» con «Mostra la finestra» e «Riaggancia», e non il testo.
- **CA-12.3** *Dato* il messaggio della nota sganciata, *quando* premo «Mostra la finestra», *allora* la sua finestra viene davanti; *quando* premo «Riaggancia», *allora* la finestra si chiude e la nota si scrive di nuovo nella finestra principale.
- **CA-12.4** *Dato* una finestra sganciata, *quando* scelgo «Tieni in primo piano» dal suo menu `···`, *allora* la voce si spunta e la finestra resta sopra gli altri programmi; sceglierla di nuovo la toglie.
- **CA-12.5** *Dato* una finestra sganciata, *quando* la chiudo con la sua ✕, *allora* la nota si riaggancia, con il testo salvato (RB-06).
- **CA-12.6** *Dato* note sganciate, *quando* chiudo la finestra principale nell'area di notifica, *allora* le finestre sganciate restano aperte; *quando* esco da Memodu e lo riapro, *allora* non ci sono finestre sganciate e le note si aprono nella finestra principale.
- **CA-12.7** *Dato* più note, *quando* le sgancio, *allora* ognuna ha la sua finestra.

Scritti dall'agente dalle scelte di DEC-92, da confermare.

---

## Fuori dal modulo
Codici del registro idee esclusi da questo modulo:
- 
