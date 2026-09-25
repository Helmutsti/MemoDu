# DEC-22 – Stili di testo per ruolo e verifica dei disegni

**Data:** 2026-09-25 · **Stato:** Accettata · **Idea di origine:** —

## Contesto
Dopo DEC-21 Manuel Cucca ha chiesto se anche la tipografia dovesse avere due livelli, come `text-titolo` che ingloba `text-sm-500`. Gli stili di testo erano già il livello usato dai componenti, ma tre di loro avevano nomi da taglia (Interfaccia/Normale, Media, Piccola) e facevano mestieri diversi: Normale era sia il testo dei controlli sia quello dei messaggi, Media sia la riga selezionata sia i titoli, Piccola date, scorciatoie ed errori. Il nome Memodu nel modulo di accesso prendeva in prestito uno stile della nota. Manuel Cucca ha anche chiesto che i nomi nuovi si usino davvero e non si dimentichino.

## Opzioni valutate
A) Tenere gli stili e scrivere meglio quando usarli.
B) Uno stile per ruolo, con i valori presi da primitivi tipografici nascosti; eliminare gli stili vecchi e controllare in modo automatico che i disegni li rispettino.

## Decisione
Opzione B, approvata da Manuel Cucca. Stili: Interfaccia/Controllo, Controllo attivo, Messaggio, Titolo, Dettaglio, Etichetta, Titolo di gruppo, Titolo di sezione, Titolo di schermata; Nota/Titolo, Sottotitolo, Corpo. Nessun cambiamento a vista: Titolo di gruppo resta 11 Medium.

## Conseguenze
- Figma: stili rinominati o nuovi, collegati ai primitivi `tipo/famiglia`, `tipo/dimensione/…`, `tipo/peso/…`; gli stili vecchi non esistono più. La parola trovata nell'estratto dei risultati ha ora uno stile (Controllo attivo).
- `design-system/tokens.md`: tabella "Tipografia" con la colonna "Quando si usa". `design-system/componenti.md`: nomi degli stili aggiornati.
- `guida-documentazione.md`: il criterio della Fase 5 chiede anche che ogni testo usi uno stile di ruolo; nella sezione "Disegni", il controllo automatico prima di chiudere una fase di disegno.
- Nuovo comando di progetto `/verifica-design` (sola lettura): spazi, testi, colori e copie staccate nei file Design system e Mockup.
