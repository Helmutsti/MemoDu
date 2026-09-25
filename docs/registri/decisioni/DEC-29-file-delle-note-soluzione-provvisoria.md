# DEC-29 – File delle note: soluzione provvisoria

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
DEC-28 tiene le note sul dispositivo come file markdown. Per il frammento Must A restavano da fissare dove sta la cartella, come si chiamano i file e cosa fare se un altro programma li modifica. Manuel Cucca ha chiarito che il file system è una soluzione temporanea: più avanti la copia locale passerà a un database vero.

## Opzioni valutate
Cartella: A) Documenti\Memodu; B) cartella dati dell'app; C) a scelta dell'utente.
Nomi dei file: A) dal titolo; B) un identificativo fisso; C) identificativo e titolo.
Modifiche fatte da altri programmi: A) tenere d'occhio la cartella e tenere entrambe le versioni; B) controllare all'apertura; C) ignorarle.

## Decisione
Scelte di Manuel Cucca:
- La cartella è **Documenti\Memodu** (su macOS `~/Documents/Memodu`).
- Il file prende il **nome dal titolo**; senza titolo o con un titolo già usato: "Senza titolo", "Senza titolo 2"; i caratteri vietati nei nomi dei file si sostituiscono. L'identificativo stabile della nota sta nell'intestazione YAML.
- Le **modifiche fatte da altri programmi si ignorano**: Memodu è l'unico che scrive le note, e non ha senso costruire un controllo per una soluzione che verrà sostituita.
- Il file system è **provvisorio**: il database definitivo sul dispositivo è rinviato.

## Conseguenze
- `docs/avanzamento.md`: nuovo rinvio "database definitivo sul dispositivo", da decidere prima della sincronizzazione (frammento Must); con lui si riprendono ricerca a testo pieno, cestino e cifratura a riposo della copia locale.
- Rischio accettato: una nota modificata da un altro programma mentre Memodu è aperto può essere sovrascritta.
