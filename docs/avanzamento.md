# Avanzamento della documentazione

<!-- Stato della documentazione (vedi "Lo stato della documentazione" nella guida). Si sovrascrive; le modifiche non vanno nello storico. Chi riprende il lavoro parte da qui. -->

**Ultimo aggiornamento:** 25/09/2026

## Pacchetti e frammenti

### Prima fase del progetto (DEC-01)
Perimetro: solo cloud, un solo utente, installazione personale con credenziali preimpostate e senza login (DEC-01, DEC-13); solo Windows e macOS, web rinviato (DEC-13, ID-19).

| Frammento | Requisiti | Fasi complete | Prossima fase | Note |
|---|---|---|---|---|
| Must | RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-08, RF-10, RF-11, RF-14, RF-15 | 1, 2, 3, 4, 5 | 6 – Mockup e prototipo | Fase 5 completata il 25/09/2026, riaperta e richiusa lo stesso giorno per DEC-21 (spazi semantici, regola 12): moodboard e direzione C (DEC-12), regole visive 1–11, token in chiaro e scuro con contrasti verificati (DEC-14, DEC-16), icone Lucide (DEC-15), componenti CMP-01 … CMP-22 disegnati, documentati e approvati da Manuel Cucca, libreria pubblicata. Il criterio "ogni schermata si costruisce con i soli componenti" si verifica schermata per schermata nei mockup: un componente mancante riapre la Fase 5 (guida, Fase 6) |
| Should | RF-07, RF-09, RF-12, RF-13, RF-16 | — | 1 – Requisiti | Mancano gli scenari d'uso |

### Idee parcheggiate
Da rivalutare a fine prima fase: ID-01, ID-03, ID-04, ID-05, ID-06, ID-11, ID-12, ID-13, ID-14, ID-20. In stato Proposta: ID-16, ID-18 (dal moodboard, DEC-11), ID-21, ID-22. ID-15 accettata in RF-05, ID-17 rifiutata. Dettagli in `registri/idee.md`.

## Rinvii
Tutto ciò che è stato rimandato, con la fase in cui va risolto.

| Cosa | Riguarda | Da risolvere in | Dove è annotato |
|---|---|---|---|
| Recupero delle credenziali dell'installazione perse (contengono la chiave di cifratura) | RF-10, RF-14 | Prima della Definition of Ready (Fase 8) | `moduli/sincronizzazione/8-test.md` |
| Elenco dei dispositivi e uscita a distanza da ripensare: con credenziali uguali per tutti non si fa uscire un solo dispositivo | RF-16 | Fase 1 di RF-16 (Should) | `moduli/sincronizzazione/1-requisiti.md` |
| Fondo dei campi sotto 3:1 contro la superficie (WCAG 1.4.11): verificare nel test di accessibilità che il campo si riconosca da etichetta, segnaposto, icona e anello di focus | CMP-03, token | Fase 8 | `design-system/tokens.md` |
| Eliminazione definitiva di un elemento su un dispositivo mentre un altro lo modifica: verificare che valga come per lo svuotamento del cestino | RB-55, FL-07 | Fase 7 | `registri/decisioni/DEC-17-eliminazione-definitiva-di-un-elemento.md` |
| Accesso (SC-05, sezione Account di SC-06): progettato ma non attivo. Quando lo si attiva si decidono tentativi, requisiti e recupero della password | DEC-19, ID-19 | Quando serve l'accesso (per esempio con il web) | `registri/decisioni/DEC-19-accesso-progettato-non-attivo.md` |
| Breakpoint e disegni per il mobile | Token, ID-11 | Quando si riprende il mobile | `design-system/tokens.md` |
| Pannello delle impostazioni dell'immagine (dimensione, allineamento, ritaglio, rotazione, testo alternativo) | CMP-21, RB-14 | Fase 6, con i mockup | `design-system/componenti.md` |
| Testi definitivi di messaggi e avvisi | Tutti i flussi, EN-08 | Fase 6 | Flussi, colonna "Comunicazione" |
| Come si salva il sottolineato nel markdown | RF-02 | Fase 7 | `moduli/note/8-test.md` |
| Come si salvano dimensione, allineamento, ritaglio e rotazione delle immagini senza rompere l'esportazione | RF-03, RF-13 | Fase 7 | `moduli/note/8-test.md` |
| Durata della pausa di scrittura prima del salvataggio (indicativa 1 s) | RB-06 | Fase 7 | `moduli/note/2-flussi.md` |
| Ritardo prima della comparsa del suggerimento | CMP-08 | Fase 7 | `design-system/componenti.md` |
| Frequenza della sincronizzazione | RF-10 | Fase 7 | `moduli/sincronizzazione/1-requisiti.md` |
| Soglia dell'avviso "server irraggiungibile" (indicativa 24 ore) | RB-40 | Fase 7 | `moduli/sincronizzazione/2-flussi.md` |
| Memorizzazione di date e fusi orari; confronto "più recente" tra dispositivi | FL-04, FL-07 (SF-14) | Fase 7 | `moduli/note/2-flussi.md`, `moduli/sincronizzazione/2-flussi.md` |
| Versioni diverse di app e server | FL-07 (SF-33) | Fase 7 | `moduli/sincronizzazione/2-flussi.md` |
| Come si generano, si conservano sul dispositivo e si cambiano le credenziali dell'installazione | EN-05, RB-54 | Fase 7 | `moduli/sincronizzazione/3-entita.md` |
| Quando eliminare davvero gli avvisi visti | EN-08 | Fase 7 | `moduli/sincronizzazione/3-entita.md` |

## Deduzioni da confermare
Comportamenti ricavati da un agente e non ancora confermati. Finché restano qui non valgono come regole.

Nessuna: le ultime tre sono state confermate (RB-58, RB-59) o superate da DEC-20.

## Rischi accettati
| Rischio | Decisione | Da rivedere |
|---|---|---|
| Chi può leggere il file di configurazione di un dispositivo può leggere tutte le note | DEC-13 | Fase 7, scegliendo dove conservare le credenziali |

## Strumenti
- **Disegni (Fasi 4–6):** Figma (DEC-10), secondo la sezione "Disegni" della guida. Account `manuc.1297@gmail.com`, piano **Il mio team solitario** (posto Full, l'unico con permessi di scrittura). File di lavoro: [Memodu – Wireframe (Fase 4)](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK). La vecchia libreria da wireframe "Memodu – Wireframe UI" è stata eliminata: la libreria del progetto è il file Design system. Fase 5 (moodboard, direzioni, token e componenti, è la libreria): [Memodu – Design system](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE), pagine Componenti base e Componenti composti. È pubblicato come libreria del team (primitivi nascosti: gli altri file vedono solo token semantici, stili e componenti); dopo ogni componente nuovo va ripubblicato. Icone: Lucide (DEC-15). Fase 6 (mockup e prototipo): [Memodu – Mockup (Fase 6)](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ), una pagina per schermata (SC-01 … SC-07) più Prototipo; usa solo istanze della libreria Design system.
