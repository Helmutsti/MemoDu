# Avanzamento della documentazione

<!-- Stato della documentazione (vedi "Lo stato della documentazione" nella guida). Si sovrascrive; le modifiche non vanno nello storico. Chi riprende il lavoro parte da qui. -->

**Ultimo aggiornamento:** 25/09/2026

## Pacchetti e frammenti

### Prima fase del progetto (DEC-01)
Perimetro: solo cloud, un solo utente, installazione personale con credenziali preimpostate e senza login (DEC-01, DEC-13); solo Windows e macOS, web rinviato (DEC-13, ID-19).

| Frammento | Requisiti | Fasi complete | Prossima fase | Note |
|---|---|---|---|---|
| Must | RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-08, RF-10, RF-11, RF-14, RF-15 | 1, 2, 3, 4 | 5 – Design system | Fase 4 completata (SC-01 … SC-06, wireflow cliccabile, test rapido fatto). Fase 5 quasi completa: moodboard e direzione C (DEC-12), regole visive 1–11, token in chiaro e scuro con contrasti verificati (DEC-14, DEC-16), icone Lucide (DEC-15), tutti i componenti CMP-01 … CMP-21 disegnati e documentati. Componenti approvati da Manuel Cucca (le deduzioni sui componenti valgono come regole). Per chiuderla: le decisioni aperte ed eliminare a mano la libreria Wireframe UI |
| Should | RF-07, RF-09, RF-12, RF-13, RF-16 | — | 1 – Requisiti | Mancano gli scenari d'uso |

### Idee parcheggiate
Da rivalutare a fine prima fase: ID-01, ID-03, ID-04, ID-05, ID-06, ID-11, ID-12, ID-13, ID-14. In stato Proposta, da valutare a fine prima fase: ID-15, ID-16, ID-17, ID-18 (dal moodboard, DEC-11). Dettagli in `registri/idee.md`.

## Rinvii
Tutto ciò che è stato rimandato, con la fase in cui va risolto.

| Cosa | Riguarda | Da risolvere in | Dove è annotato |
|---|---|---|---|
| Recupero delle credenziali dell'installazione perse (contengono la chiave di cifratura) | RF-10, RF-14 | Prima della Definition of Ready (Fase 8) | `moduli/sincronizzazione/8-test.md` |
| Elenco dei dispositivi e uscita a distanza da ripensare: con credenziali uguali per tutti non si fa uscire un solo dispositivo | RF-16 | Fase 1 di RF-16 (Should) | `moduli/sincronizzazione/1-requisiti.md` |
| Wireframe da allineare a DEC-13 (togliere SC-05, la sezione Account di SC-06 e il punto di partenza FL-08 del prototipo) e a DEC-17 (Elimina definitivamente negli elementi di SC-04) | SC-04, SC-05, SC-06 | Fase 6, prima dei mockup | File Figma dei wireframe |
| **Aperta:** allineamento di icona e testo nel tag (la ✕ sembra più alta del testo). Alternative nel confronto della pagina Prove del file Design system: C (rifinitura del testo + icona abbassata di 1 px) o D (✕ a 16 px); valutare anche per pulsante e ricerca | CMP-05, CMP-01, CMP-03 | Fase 5, prima di chiuderla | Figma, pagina Prove |
| **Aperta:** icona su "Elimina" nei menu. Alternative nella pagina Prove: nessuna icona (oggi), icone su tutte le voci, solo Elimina a sinistra, a destra, o con spazio riservato | CMP-07, CMP-09 | Fase 5, prima di chiuderla | Figma, pagina Prove |
| Colore delle icone quando si cambia icona con la proprietà Icona: il colore impostato nell'istanza si perde e la nuova icona torna `icona-tenue`. Proposta: unire le forme di ogni icona in un solo tracciato, così il colore resta. Intanto va ricolorata a mano dopo ogni scambio | CMP-02 | Fase 5, prima di chiuderla | `design-system/componenti.md` |
| Fondo dei campi sotto 3:1 contro la superficie (WCAG 1.4.11): verificare nel test di accessibilità che il campo si riconosca da etichetta, segnaposto, icona e anello di focus | CMP-03, token | Fase 8 | `design-system/tokens.md` |
| Eliminazione definitiva di un elemento su un dispositivo mentre un altro lo modifica: verificare che valga come per lo svuotamento del cestino | RB-55, FL-07 | Fase 7 | `registri/decisioni/DEC-17-eliminazione-definitiva-di-un-elemento.md` |
| Breakpoint e disegni per il mobile | Token, ID-11 | Quando si riprende il mobile | `design-system/tokens.md` |
| Libreria "Memodu – Wireframe UI": decisa l'eliminazione (non serve più; le istanze nei wireframe restano visibili). Da fare a mano in Figma: annullare la pubblicazione ed eliminare il file | DEC-10 | Fine della Fase 5 | File Figma |
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

| Deduzione | Riguarda | Dove è annotata |
|---|---|---|
| Eliminando una nota, le sue immagini la seguono nel cestino | EN-02 | `moduli/note/8-test.md` |
| Il comando Annulla vale per tutte le modifiche della nota aperta | RF-02 | `moduli/note/8-test.md` |
| Con credenziali mancanti o rifiutate l'app funziona lo stesso sulla copia di lavoro, e mostra solo l'avviso | FL-08, DEC-13 | `moduli/sincronizzazione/2-flussi.md` |

## Rischi accettati
| Rischio | Decisione | Da rivedere |
|---|---|---|
| Chi può leggere il file di configurazione di un dispositivo può leggere tutte le note | DEC-13 | Fase 7, scegliendo dove conservare le credenziali |

## Strumenti
- **Disegni (Fasi 4–6):** Figma (DEC-10), secondo la sezione "Disegni" della guida. Account `manuc.1297@gmail.com`, piano **Il mio team solitario** (posto Full, l'unico con permessi di scrittura). File di lavoro: [Memodu – Wireframe (Fase 4)](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK). Componenti da wireframe (solo struttura, niente token): [Memodu – Wireframe UI (libreria)](https://www.figma.com/design/TzpeVsSZCJDBOyb8TkaJ69). Fase 5 (moodboard, direzioni, token e componenti, è la libreria): [Memodu – Design system](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE), pagine Componenti base e Componenti composti. È pubblicato come libreria del team (primitivi nascosti: gli altri file vedono solo token semantici, stili e componenti); dopo ogni componente nuovo va ripubblicato. Icone: Lucide (DEC-15).
