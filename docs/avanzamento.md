# Avanzamento della documentazione

<!-- Stato della documentazione (vedi "Lo stato della documentazione" nella guida). Si sovrascrive; le modifiche non vanno nello storico. Chi riprende il lavoro parte da qui. -->

**Ultimo aggiornamento:** 25/09/2026

## Pacchetti e frammenti

### Prima fase del progetto (DEC-01)
Perimetro: solo cloud, un solo utente, installazione personale (DEC-01, DEC-05); Windows, macOS e web (DEC-04).

| Frammento | Requisiti | Fasi complete | Prossima fase | Note |
|---|---|---|---|---|
| Must | RF-01, RF-02, RF-03, RF-04, RF-05, RF-06, RF-08, RF-10, RF-11, RF-14, RF-15 | 1, 2, 3, 4 | 5 – Design system | Fase 4 completata: SC-01 … SC-06 con i loro stati e wireflow cliccabile per FL-01 … FL-09 (prototipo Figma). Test rapido non fatto. Fase 5 in corso: moodboard fatto, direzione C · Essenziale originale con grigi neutri (DEC-12), regole visive e token fatti (chiaro e scuro, contrasti verificati); prossimi i componenti |
| Should | RF-07, RF-09, RF-12, RF-13, RF-16 | — | 1 – Requisiti | Mancano gli scenari d'uso |

### Idee parcheggiate
Da rivalutare a fine prima fase: ID-01, ID-03, ID-04, ID-05, ID-06, ID-11, ID-12, ID-13, ID-14. In stato Proposta, da valutare a fine prima fase: ID-15, ID-16, ID-17, ID-18 (dal moodboard, DEC-11). Dettagli in `registri/idee.md`.

## Rinvii
Tutto ciò che è stato rimandato, con la fase in cui va risolto.

| Cosa | Riguarda | Da risolvere in | Dove è annotato |
|---|---|---|---|
| Recupero della password e della chiave di cifratura | RF-10, RF-14 | Prima della Definition of Ready (Fase 8) | `moduli/sincronizzazione/8-test.md` |
| Da confermare: sulle righe in hover il testo resta `testo-primario` (il tenue sul grigio hover non raggiunge 4,5:1), oppure si scurisce ancora il testo tenue | Token, regola 7 | Fase 5, prima dei componenti | `design-system/tokens.md` |
| Campo "Ripeti la password" al primo avvio: la password protegge la cifratura e il recupero è rinviato, un errore di battitura può far perdere l'accesso | RF-14, RB-43, SC-05 | Fase 5, con i componenti | `moduli/sincronizzazione/4-schermate.md` |
| Test rapido dei wireframe con 3–5 persone (consigliato dalla guida, non fatto) | Fase 4 | Prima della Fase 6 | `moduli/interfaccia/4-schermate.md` (wireflow) |
| Testi definitivi di messaggi e avvisi | Tutti i flussi, EN-08 | Fase 6 | Flussi, colonna "Comunicazione" |
| Come si salva il sottolineato nel markdown | RF-02 | Fase 7 | `moduli/note/8-test.md` |
| Come si salvano dimensione, allineamento, ritaglio e rotazione delle immagini senza rompere l'esportazione | RF-03, RF-13 | Fase 7 | `moduli/note/8-test.md` |
| Durata della pausa di scrittura prima del salvataggio (indicativa 1 s) | RB-06 | Fase 7 | `moduli/note/2-flussi.md` |
| Frequenza della sincronizzazione | RF-10 | Fase 7 | `moduli/sincronizzazione/1-requisiti.md` |
| Soglia dell'avviso "server irraggiungibile" (indicativa 24 ore) | RB-40 | Fase 7 | `moduli/sincronizzazione/2-flussi.md` |
| Memorizzazione di date e fusi orari; confronto "più recente" tra dispositivi | FL-04, FL-07 (SF-14) | Fase 7 | `moduli/note/2-flussi.md`, `moduli/sincronizzazione/2-flussi.md` |
| Versioni diverse di app e server | FL-07 (SF-33) | Fase 7 | `moduli/sincronizzazione/2-flussi.md` |
| Come si ricava la chiave di cifratura dalla password | EN-05 | Fase 7 | `moduli/sincronizzazione/3-entita.md` |
| Quali dati dell'account il server deve poter leggere per verificare l'accesso | EN-05 | Fase 7 | `moduli/sincronizzazione/3-entita.md` |
| Quando eliminare davvero gli avvisi visti | EN-08 | Fase 7 | `moduli/sincronizzazione/3-entita.md` |

## Deduzioni da confermare
Comportamenti ricavati da un agente e non ancora confermati. Finché restano qui non valgono come regole.

| Deduzione | Riguarda | Dove è annotata |
|---|---|---|
| Eliminando una nota, le sue immagini la seguono nel cestino | EN-02 | `moduli/note/8-test.md` |
| Il comando Annulla vale per tutte le modifiche della nota aperta | RF-02 | `moduli/note/8-test.md` |

## Rischi accettati
| Rischio | Decisione | Da rivedere |
|---|---|---|
| Nessun limite ai tentativi di accesso e nessun requisito sulla password, con il server raggiungibile da Internet | DEC-07 | Prima del servizio aperto al pubblico (ID-12) |
| Una volta usciti dal browser senza rete, le modifiche si sincronizzano solo riaprendo Memodu in quel browser | RB-44 | Con RF-16 |

## Strumenti
- **Disegni (Fasi 4–6):** Figma (DEC-10), secondo la sezione "Disegni" della guida. Account `manuc.1297@gmail.com`, piano **Il mio team solitario** (posto Full, l'unico con permessi di scrittura). File di lavoro: [Memodu – Wireframe (Fase 4)](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK). Componenti da wireframe (solo struttura, niente token): [Memodu – Wireframe UI (libreria)](https://www.figma.com/design/TzpeVsSZCJDBOyb8TkaJ69). Fase 5 (moodboard, direzioni, poi token e componenti): [Memodu – Design system](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE).
