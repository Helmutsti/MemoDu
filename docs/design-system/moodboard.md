# Moodboard

<!-- Fase 5 della guida. -->

Il moodboard e le direzioni vivono nel file Figma [Memodu – Design system](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE): pagina **Moodboard** (riferimenti raccolti da Manuel Cucca, in quattro gruppi: idee grafiche, interfaccia/sidebar, interfaccia/paper, colori) e pagina **Direzioni**.

Temi ricorrenti nei riferimenti: fondi color carta invece del bianco puro; barra flottante sopra il testo selezionato (la pillola degli strumenti di SC-03); palette terrose e smorzate (palette Holst: #0D1B2A, #1B263B, #415A77, #778D7A, #D4C4A8, #F4F1DE; verdi "earthy" e "deep & moody"); un'anima scura con testo serif.

## Parole chiave del brand
**Nitida, rapida, essenziale.** Dalla direzione scelta (C).

## Tono di voce
**Calmo e diretto.** Frasi brevi, del tu. Niente punti esclamativi né allarmi. Dice cosa è successo e cosa fare, in quest'ordine; quando non serve fare niente lo dice, rassicurando con i fatti e non con gli aggettivi.

| Sì | No |
|---|---|
| «Non riesco a sincronizzare da 2 ore. Le modifiche restano qui.» | «Ops! Qualcosa è andato storto» |
| «Si possono inserire solo immagini.» | «Errore 503: sync failed» |
| «Svuotare il cestino? 3 elementi verranno eliminati per sempre.» | «Fantastico, nota salvata!» |

## Direzioni valutate
| Direzione | Riferimenti | Pro | Contro |
|---|---|---|---|
| A · Carta | [tavola](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE/Memodu-%E2%80%93-Design-system?node-id=2-3) | Calda e riposante, vicina ai riferimenti "paper" e alla palette Holst; il serif rende la nota un quaderno | Il fondo crema può sembrare datato o poco "strumento" |
| B · Notte | [tavola](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE/Memodu-%E2%80%93-Design-system?node-id=2-72) | Per scrivere la sera; profondità e silenzio, come l'editor notturno del moodboard | Da sola non basta: di giorno e in ufficio serve anche un modo chiaro |
| C · Essenziale | [tavola](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE/Memodu-%E2%80%93-Design-system?node-id=2-141) | La più veloce e neutra, vicina ai wireframe; un solo carattere | La meno personale: somiglia a molte app di note |
| A + B · chiaro e scuro | [tavola](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE/Memodu-%E2%80%93-Design-system?node-id=2-210) | Una sola direzione con due modi: stessi componenti, cambiano i colori | Due palette da verificare per il contrasto (WCAG AA) invece di una |

**Direzione scelta:** C · Essenziale originale, con grigi neutri assoluti – vedi DEC-12 (supera DEC-11, che sceglieva la C rivista con i riferimenti 04, 08, 17, 20, 23). Tavola: [C · Essenziale](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE/Memodu-%E2%80%93-Design-system?node-id=2-141).

Colori di partenza per i token: fondo #FFFFFF, colonna #F4F4F4, testo #1F1F1F, testo tenue #7B7B7B, accento e pieno (pillola, riga attiva) #1F1F1F, bordo e selezione #E0E0E0. Carattere unico: Inter.

Le funzioni nuove viste nei riferimenti (numeri accanto alle cartelle, colori per cartella, tag nella colonna, cestino fisso) restano nel registro idee: ID-15 … ID-18.

## Regole visive della direzione
Regole decise da Manuel Cucca dopo la scelta della direzione. Diventano token (raggi, colori, spaziature…) in `tokens.md`.

| # | Regola | Si applica a |
|---|---|---|
| 1 | **Controlli a pillola:** tutto ciò che è alto una riga ha le estremità completamente tonde | Ricerca, campi di testo, pulsanti, tag, filtri, riga selezionata, pillola degli strumenti e i suoi strumenti, avvisi |
| 2 | **Contenitori molto tondi:** raggio ampio (20 px), stessa famiglia delle pillole | Menu, pannelli, finestre di conferma, finestra della nota rapida, immagini nella nota |
| 3 | **Grigi neutri:** tutti i grigi hanno rosso, verde e blu uguali, senza tinta calda né fredda | Fondi, testo, bordi, pieni |
| 4 | **Niente linee di separazione:** le zone si distinguono per il fondo (colonna grigia, nota bianca). Linee sottili solo dove servono davvero | Divisori nei menu, elenco del cestino |
| 5 | **Ombre solo su ciò che fluttua:** un'ombra sola, morbida; tutto il resto è piatto | Pillola degli strumenti, menu, pannelli, avvisi, finestre di conferma, nota rapida (livelli 20–50) |
| 6 | **Densità compatta:** righe da 32 px nella colonna e nelle liste | Colonna, menu, elenchi |
| 7 | **Passaggio del mouse:** pillola grigio chiaro dietro la riga o il pulsante; la selezione è la pillola scura, stessa forma | Righe, voci di menu, pulsanti |
| 8 | **Icone di linea:** 16 px, tratto 1,5 px con estremità arrotondate, grigio tenue; chiare sulla riga selezionata | Colonna, menu, pulsanti |
| 9 | **Modo scuro:** stessi grigi neutri e stessi ruoli, segue l'impostazione del sistema | Tutta l'interfaccia |
| 10 | **Animazioni brevi:** dissolvenza di circa 120 ms con uno spostamento di 4 px; nessun movimento se il sistema chiede di ridurlo | Pillola, menu, pannelli, avvisi |
