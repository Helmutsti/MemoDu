# DEC-58 – Foglio di scrittura più fluido: markdown nascosto, spazi discreti, finestra libera

**Data:** 2026-09-29 · **Stato:** Accettata (la barra di scorrimento si realizza con DEC-89) · **Idea di origine:** —

## Contesto
Con il foglio unico (DEC-55) Manuel Cucca vuole dedicarsi al foglio di scrittura: «l'esperienza deve essere il più fluida e naturale possibile, l'utente non deve avere paura di rompere qualcosa». Finora i simboli markdown si vedevano sulla riga del cursore (CA-02.2), il testo era centrato con 80 px sopra, la finestra aveva un minimo di 640 × 480 (DEC-57) e la barra di scorrimento del sistema occupava spazio.

## Opzioni valutate
Nessuna alternativa: sono richieste di Manuel Cucca; i valori sono proposte dell'agente.

## Decisione
Scelte di Manuel Cucca:
- **Markdown nascosto sempre**, anche sulla riga in cui si scrive: si chiama come prima (`#`, `##`, `-`, `**`…) e i simboli spariscono appena il markdown li riconosce. I simboli nascosti sono atomici: le frecce li saltano e Canc li toglie in un colpo solo (per esempio all'inizio di un titolo Canc lo riporta a testo normale).
- **Finestra ridimensionabile come si vuole**, senza minimo, anche se il contenuto va in overflow: supera DEC-57.
- **Spazi più discreti e testo sempre allineato a sinistra**, non più centrato.
- **Barra di scorrimento che non occupa spazio**, sottile e a scomparsa come su macOS.

Valori proposti dall'agente, da confermare:
- testo a misura di lettura (640 px) allineato a sinistra con 24 px dal bordo; 48 px sopra il titolo (la fascia di 32 e 16 di respiro), 8 tra titolo e metadati, 16 prima del testo, 24 in fondo;
- cursore di scorrimento largo 6 px, tondo, in `icona-tenue` al 50 % (80 % sotto il mouse), che compare scorrendo o con il mouse sull'area e sparisce dopo 0,8 s; nel foglio e nella colonna.

## Conseguenze
- Superata DEC-57 (minimo 640 × 480).
- Aggiornati CA-02.2, TC-10, SC-03 (`note/4-schermate.md`), CMP-20 in `componenti.md`; il componente della barra di scorrimento va aggiunto al design system (Fase 5) e i mockup di SC-03 vanno aggiornati.
- Codice: `app/src/editor/anteprima.ts`, `app/src/schermate/NotaAperta.css`, `app/src/componenti/BarraScorrimento.ts`, configurazioni di Tauri senza `minWidth` e `minHeight`.
