# Avanzamento della documentazione

<!-- Stato della documentazione (vedi "Lo stato della documentazione" nella guida). Si sovrascrive; le modifiche non vanno nello storico. Chi riprende il lavoro parte da qui. -->

**Ultimo aggiornamento:** 28/09/2026 (sviluppo di Must A)

## Pacchetti e frammenti

### Prima fase del progetto (DEC-01)
Perimetro: solo cloud, un solo utente, installazione personale con credenziali preimpostate e senza login (DEC-01, DEC-13); solo Windows e macOS, web rinviato (DEC-13, ID-19).

| Frammento | Requisiti | Fasi complete | Prossima fase | Note |
|---|---|---|---|---|
| Must A · Scrivere | RF-01, RF-02 | 1, 2, 3, 4, 5, 6, 7, 8 | Sviluppo (attività 11 di 11: prove finali), poi 9 – Rilascio | Codice al 28/09/2026, attività 1–10 fatte e provate (task elencati in chat, nessuno strumento di gestione): struttura DEC-33; server Fastify con archivio dei file e 4 endpoint (25 prove); app con finestra principale ridotta, editor CodeMirror con anteprima dal vivo, pillola, menu / e tasto destro, salvataggio automatico, SC-07 e conferma alla chiusura; nucleo Rust con scorciatoia globale, icona nella barra dei menu («Nuova nota rapida», «Apri Memodu», «Esci da Memodu») e note rapide a cascata (43 prove nell'app). Provato da Manuel Cucca su macOS il 28/09/2026. Resta l'attività 11: piano di test TC-01 … TC-32 caso per caso, revisione del codice dell'agente (Definition of Done), prova su Windows, poi Fase 9. Da sistemare, segnalati da Manuel Cucca il 28/09/2026: la nota rapida non corrispondeva al mockup di SC-02 (corretti fondo e spazi il 28/09/2026, da riprovare a vista); l'editor «non si comporta come dovrebbe» (da capire con Manuel Cucca cosa, caso per caso); annullando la nota rapida la finestra principale viene in primo piano, e non dovrebbe. Scostamento accettato: la nota rapida ha angoli squadrati (arrotondarli richiede l'API privata di macOS). In Figma da sistemare, non bloccante: nome degli stili di testo nel file Mockup (Interfaccia/Piccola invece di Interfaccia/Dettaglio) |
| Must | RF-03, RF-04, RF-05, RF-06, RF-08, RF-10, RF-11, RF-14, RF-15 | 1, 2, 3, 4, 5 | 6 – Mockup e prototipo (in pausa) · 7 – Architettura tecnica avviata in parallelo: scelti app (DEC-23), server (DEC-24) e archivio (DEC-25), il resto rinviato | Fase 5 completata il 25/09/2026, riaperta e richiusa lo stesso giorno per DEC-21 (spazi semantici, regola 12): moodboard e direzione C (DEC-12), regole visive 1–11, token in chiaro e scuro con contrasti verificati (DEC-14, DEC-16), icone Lucide (DEC-15), componenti CMP-01 … CMP-22 disegnati, documentati e approvati da Manuel Cucca, libreria pubblicata. Il criterio "ogni schermata si costruisce con i soli componenti" si verifica schermata per schermata nei mockup: un componente mancante riapre la Fase 5 (guida, Fase 6) |
| Should | RF-07, RF-09, RF-12, RF-13, RF-16 | — | 1 – Requisiti | Mancano gli scenari d'uso |

### Idee parcheggiate
Da rivalutare a fine prima fase: ID-01, ID-03, ID-04, ID-05, ID-06, ID-11, ID-12, ID-13, ID-14, ID-20. In stato Proposta: ID-16, ID-18 (dal moodboard, DEC-11), ID-21, ID-22, ID-23, ID-24, ID-25, ID-26. ID-15 accettata in RF-05, ID-17 rifiutata. Dettagli in `registri/idee.md`.

## Rinvii
Tutto ciò che è stato rimandato, con la fase in cui va risolto.

| Cosa | Riguarda | Da risolvere in | Dove è annotato |
|---|---|---|---|
| Prototipo cliccabile e test di usabilità di SC-01, SC-02, SC-03 (saltati per Must A) | RF-01, RF-02 | Fase 6 del frammento Must, e prima di un rilascio ad altre persone | `registri/decisioni/DEC-31-fase-6-di-must-a-senza-prototipo-e-test.md` |
| Database definitivo sul dispositivo al posto dei file (DEC-29, provvisoria), e con lui ricerca a testo pieno, cestino e cifratura a riposo della copia locale | DEC-28, DEC-29, RF-08, RF-15, RNF-02 | Fase 7 del frammento Must, prima della sincronizzazione | `registri/decisioni/DEC-29-file-delle-note-soluzione-provvisoria.md` |
| Cifratura: libreria e algoritmo, chiavi per scopo, allegati a pezzi, portachiavi del sistema | DEC-08, RNF-02 | Fase 7 | `architettura/architettura.md` |
| Protocollo di sincronizzazione e resto delle API | DEC-24, FL-07 | Fase 7 del frammento Must | `registri/decisioni/DEC-24-server-con-api-in-node.md` |
| Organizzazione dei file sul server, elenco delle modifiche, backup | DEC-25 | Fase 7 | `registri/decisioni/DEC-25-archivio-del-server-su-file-system.md` |
| Hosting definitivo del server personale (con disco persistente) e come si installa. Per ora il server gira sulla macchina di sviluppo | DEC-25, DEC-13 | Fase 8, prima del rilascio | `architettura/architettura.md` |
| **In pausa:** mockup della Fase 6 per il frammento Must (SC-02 e SC-03 ripresi subito per Must A). Fatto SC-01 stato normale (in revisione); da fare gli altri stati di SC-01 e SC-04 … SC-07, contenuti definitivi, micro-interazioni, prototipo e test di usabilità. Da valutare con il mockup: ID-22 (numero di note accanto al nome) e stile dei titoli di gruppo delle impostazioni | Fase 6, frammento Must | Fase 6, prima della Fase 8 | Figma, file Mockup; `moduli/interfaccia/4-schermate.md` |
| Recupero delle credenziali dell'installazione perse (contengono la chiave di cifratura) | RF-10, RF-14 | Prima della Definition of Ready (Fase 8) | `moduli/sincronizzazione/8-test.md` |
| Elenco dei dispositivi e uscita a distanza da ripensare: con credenziali uguali per tutti non si fa uscire un solo dispositivo | RF-16 | Fase 1 di RF-16 (Should) | `moduli/sincronizzazione/1-requisiti.md` |
| Fondo dei campi sotto 3:1 contro la superficie (WCAG 1.4.11): verificare nel test di accessibilità che il campo si riconosca da etichetta, segnaposto, icona e anello di focus | CMP-03, token | Fase 8 | `design-system/tokens.md` |
| Eliminazione definitiva di un elemento su un dispositivo mentre un altro lo modifica: verificare che valga come per lo svuotamento del cestino | RB-55, FL-07 | Fase 7 | `registri/decisioni/DEC-17-eliminazione-definitiva-di-un-elemento.md` |
| Accesso (SC-05, sezione Account di SC-06): progettato ma non attivo. Quando lo si attiva si decidono tentativi, requisiti e recupero della password | DEC-19, ID-19 | Quando serve l'accesso (per esempio con il web) | `registri/decisioni/DEC-19-accesso-progettato-non-attivo.md` |
| Breakpoint e disegni per il mobile | Token, ID-11 | Quando si riprende il mobile | `design-system/tokens.md` |
| Pannello delle impostazioni dell'immagine (dimensione, allineamento, ritaglio, rotazione, testo alternativo) | CMP-21, RB-14 | Fase 6, con i mockup | `design-system/componenti.md` |
| Testi definitivi di messaggi e avvisi | Tutti i flussi, EN-08 | Fase 6 | Flussi, colonna "Comunicazione" |
| Come si salvano dimensione, allineamento, ritaglio e rotazione delle immagini senza rompere l'esportazione | RF-03, RF-13 | Fase 7 | `moduli/note/8-test.md` |
| Frequenza della sincronizzazione | RF-10 | Fase 7 | `moduli/sincronizzazione/1-requisiti.md` |
| Soglia dell'avviso "server irraggiungibile" (indicativa 24 ore) | RB-40 | Fase 7 | `moduli/sincronizzazione/2-flussi.md` |
| Confronto "più recente" tra dispositivi (il formato delle date è fissato in DEC-28) | FL-04, FL-07 (SF-14) | Fase 7 | `moduli/note/2-flussi.md`, `moduli/sincronizzazione/2-flussi.md` |
| Versioni diverse di app e server | FL-07 (SF-33) | Fase 7 | `moduli/sincronizzazione/2-flussi.md` |
| Come si generano, si conservano sul dispositivo e si cambiano le credenziali dell'installazione | EN-05, RB-54 | Fase 7 | `moduli/sincronizzazione/3-entita.md` |
| Quando eliminare davvero gli avvisi visti | EN-08 | Fase 7 | `moduli/sincronizzazione/3-entita.md` |

## Deduzioni da confermare
Comportamenti ricavati da un agente e non ancora confermati. Finché restano qui non valgono come regole.

Nessuna: le deduzioni dell'attività 4 sono state confermate il 28/09/2026.

## Rischi accettati
| Rischio | Decisione | Da rivedere |
|---|---|---|
| Chi può leggere il file di configurazione di un dispositivo può leggere tutte le note | DEC-13 | Fase 7, scegliendo dove conservare le credenziali |
| Una nota modificata da un altro programma mentre Memodu è aperto può essere sovrascritta | DEC-29 | Con il database definitivo sul dispositivo |

## Strumenti
- **Disegni (Fasi 4–6):** Figma (DEC-10), secondo la sezione "Disegni" della guida. Account `manuc.1297@gmail.com`, piano **Il mio team solitario** (posto Full, l'unico con permessi di scrittura). File di lavoro: [Memodu – Wireframe (Fase 4)](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK). La vecchia libreria da wireframe "Memodu – Wireframe UI" è stata eliminata: la libreria del progetto è il file Design system. Fase 5 (moodboard, direzioni, token e componenti, è la libreria): [Memodu – Design system](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE), pagine Componenti base e Componenti composti. È pubblicato come libreria del team (primitivi nascosti: gli altri file vedono solo token semantici, stili e componenti); dopo ogni componente nuovo va ripubblicato. Icone: Lucide (DEC-15). Fase 6 (mockup e prototipo): [Memodu – Mockup (Fase 6)](https://www.figma.com/design/18288YdcRf5vtWCtEefQYJ), una pagina per schermata (SC-01 … SC-07) più Prototipo; usa solo istanze della libreria Design system.
