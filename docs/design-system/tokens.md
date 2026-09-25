# Tokens

<!-- Fase 5 della guida. I componenti usano solo token semantici. -->

Direzione: C · Essenziale con grigi neutri (DEC-12) e regole visive di `moodboard.md`. I token vivono come variabili nel file Figma [Memodu – Design system](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE) (collezioni **Primitivi**, **Colore** con modi Chiaro e Scuro, **Dimensioni**; pagina **Token**). Nel codice il nome diventa una variabile CSS: `colore/sfondo/nota` → `var(--sfondo-nota)`.

## Primitivi
Grigi neutri assoluti (rosso, verde e blu uguali) e quattro scale semantiche per gli stati (DEC-14). Non si usano direttamente nei componenti. Le scale complete sono nel riquadro "Scale complete" della pagina Token.

| Token | Valore |
|---|---|
| `grigio-0` | #FFFFFF |
| `grigio-50` | #F4F4F4 |
| `grigio-100` | #EBEBEB |
| `grigio-200` | #E0E0E0 |
| `grigio-300` | #C1C1C1 |
| `grigio-400` | #A3A3A3 |
| `grigio-500` | #696969 |
| `grigio-600` | #525252 |
| `grigio-700` | #3D3D3D |
| `grigio-750` | #383838 · solo per `sfondo-campo` in scuro, tra `grigio-800` (flottante) e `grigio-700` (hover) |
| `grigio-800` | #2B2B2B |
| `grigio-900` | #1F1F1F |
| `grigio-950` | #141414 |
| `nero-6` · `nero-12` · `nero-30` · `nero-40` · `nero-50` | #000000 al 6%, 12%, 30%, 40%, 50% |
| `bianco-5` | #FFFFFF al 5% |

I gradini 300 e 600 del grigio completano la scala; oggi nessun token semantico li usa.

Scale semantiche: a parità di gradino hanno la stessa luminosità dei grigi.

| Gradino | `rosso` | `ambra` | `verde` | `blu` |
|---|---|---|---|---|
| 50 | #FFF0EF | #FEF2E5 | #E3FCE7 | #EEF5FE |
| 100 | #FFE4E1 | #FFE7CC | #D0F7D6 | #DFEDFE |
| 200 | #FFD5D0 | #FFD9AE | #B6F2C1 | #CDE2FE |
| 300 | #FFA69F | #F6B25E | #86D798 | #97C4FF |
| 400 | #FE6F69 | #DE8F0F | #58BC72 | #5EA5FF |
| 500 | #BE232A | #915C02 | #047F39 | #1468C2 |
| 600 | #9E0117 | #734803 | #03642C | #01519F |
| 700 | #77010F | #573400 | #004B1E | #013C79 |
| 800 | #570108 | #3E2501 | #013514 | #012A58 |
| 900 | #420105 | #2E1A00 | #00270D | #001E43 |
| 950 | #2F0002 | #201000 | #001A07 | #001330 |

## Semantici · colore
| Token | Chiaro | Scuro | Uso |
|---|---|---|---|
| `sfondo-nota` | `grigio-0` | `grigio-950` | Area della nota |
| `sfondo-colonna` | `grigio-50` | `grigio-900` | Colonna sinistra |
| `sfondo-campo` | `grigio-100` | `grigio-750` | Campi, ricerca, tag, pulsante secondario. Deve staccarsi da nota, colonna e flottante (vedi "Fondi dei controlli sulle superfici") |
| `sfondo-hover` | `grigio-200` | `grigio-700` | Passaggio del mouse (pillola chiara) |
| `sfondo-pieno` | `grigio-900` | `grigio-50` | Riga selezionata, strumento attivo della pillola, suggerimento, pulsante primario |
| `sfondo-pieno-hover` | `grigio-700` | `grigio-200` | Pulsante primario al passaggio del mouse |
| `sfondo-pieno-premuto` | `grigio-800` | `grigio-100` | Pulsante primario premuto |
| `sfondo-premuto` | `grigio-300` | `grigio-600` | Pulsanti secondario, tenue e solo icona premuti |
| `sfondo-flottante` | `grigio-0` | `grigio-800` | Menu, pillola degli strumenti, pannelli, avvisi chiari, nota rapida |
| `testo-primario` | `grigio-900` | `grigio-50` | Testo principale |
| `testo-tenue` | `grigio-500` | `grigio-400` | Testo secondario, etichette, segnaposto |
| `testo-su-pieno` | `grigio-0` | `grigio-950` | Testo su sfondo pieno |
| `icona-tenue` | `grigio-500` | `grigio-400` | Icone di linea |
| `icona-su-pieno` | `grigio-0` | `grigio-950` | Icone su sfondo pieno |
| `bordo-divisore` | `grigio-200` | `grigio-700` | Divisori dove servono (cestino) |
| `bordo-divisore-tenue` | `nero-6` | `bianco-5` | Divisori dei menu, da lato a lato. Trasparente: su `sfondo-flottante` dà circa #F0 in chiaro e #36 in scuro. Decorativo, senza soglia di contrasto |
| `evidenziazione-selezione` | `grigio-200` | `grigio-700` | Evidenziazione del testo selezionato |
| `velo` | `nero-30` | `nero-50` | Velo sotto le finestre di conferma (livello 40) |
| `ombra-flottante` | `nero-12` | `nero-40` | Colore dell'ombra degli elementi flottanti |
| `focus-anello` | `grigio-900` | `grigio-50` | Anello di focus: mostra dove si trova chi usa la tastiera |

### Stati (DEC-14)
Il colore compare solo quando comunica uno stato. `<stato>` è `errore` (rosso), `avviso` (ambra), `successo` (verde) o `informazione` (blu).

| Token | Chiaro | Scuro | Uso |
|---|---|---|---|
| `sfondo-<stato>` | `<scala>-50` | `<scala>-800` | Sfondo di avvisi e messaggi dello stato (in scuro 800 e non 950, che si confondeva con il fondo: DEC-16) |
| `testo-<stato>` | `<scala>-500` | `<scala>-400` | Testo dello stato |
| `icona-<stato>` | `<scala>-500` | `<scala>-400` | Icona dello stato |

Il modo segue l'impostazione del sistema (regola 9).

## Spazi (regola 12)
I primitivi `spazio-4` … `spazio-48` (4, 8, 12, 16, 24, 32, 48) non si usano direttamente: sono nascosti nella libreria e i componenti usano solo i ruoli qui sotto (DEC-21). Più il legame è stretto, meno spazio c'è.

| Token | Valore | Ruolo |
|---|---|---|
| `spazio-elemento` | 4 | Tra elementi dello stesso gruppo: voci di un elenco e della checklist, righe di un risultato, tag vicini, margine della pillola degli strumenti |
| `spazio-icona-piccola` | 4 | Tra icona e testo nei controlli alti 24 (tag, filtri, campo nome nell'albero) |
| `spazio-icona` | 8 | Tra icona e testo, e tra elementi affiancati o impilati che si leggono insieme (titolo e testo, filtri, pulsanti di una finestra, tag e data) |
| `spazio-controllo-piccolo` | 8 | Margine interno dei controlli alti 24; margine verticale delle righe su più linee; lato di una riga che finisce con un controllo |
| `spazio-controllo` | 12 | Margine interno di campi, righe della colonna e voci di menu |
| `spazio-pulsante` | 16 | Margine interno orizzontale del pulsante |
| `spazio-blocco` | 16 | Tra blocchi: paragrafi della nota, titolo e metadati, campi di un modulo, gruppi di un pannello, testo e controllo di una riga di impostazione |
| `spazio-gruppo` | 24 | Tra sezioni e gruppi: sezioni della colonna, intestazione e testo della nota, margine dello stato vuoto |
| `spazio-flottante` | 8 | Bordo di menu e pannelli a comparsa |
| `spazio-contenitore` | 16 | Bordo della colonna e degli avvisi |
| `spazio-finestra` | 24 | Bordo delle finestre di conferma |

**Di componente:** `interruttore-margine-spento` (4) e `interruttore-margine-acceso` (2, con il primitivo `spazio-2`): centrano il pallino da 8 o 12 nel binario alto 16. Sono geometria del componente, non spazi tra elementi.

## Semantici · dimensioni e movimento
| Token | Valore | Uso |
|---|---|---|
| `raggio-pillola` | 999 | Controlli alti una riga (regola 1) |
| `raggio-contenitore` | 20 | Menu, pannelli, finestre, immagini (regola 2) |
| `raggio-interno` | 12 | Evidenziazione dei blocchi su più righe dentro un contenitore: concentrico (20 − 8 di margine) |
| `misura-riga` | 32 | Righe della colonna e dei menu (regola 6) |
| `misura-colonna` | 288 | Colonna sinistra al breakpoint largo: 16 px di margine ai lati e righe da 256 |
| `misura-controllo-piccolo` | 24 | Controlli che stanno dentro una riga, come i tag |
| `misura-icona` | 16 | Icone (regola 8) |
| `tratto-icona` | 1,5 | Spessore delle icone di linea |
| `focus-spessore` | 2 | Spessore dell'anello di focus |
| `focus-distanza` | 2 | Spazio tra il controllo e l'anello di focus |
| `opacita-disabilitato` | 40% | Opacità di un controllo disabilitato |
| `movimento-durata-breve` | 120 ms | Comparsa di pillola, menu, pannelli, avvisi (regola 10) |
| `movimento-spostamento` | 4 px | Spostamento durante la comparsa |

## Breakpoint
Desktop-first (vedi `moduli/interfaccia/4-schermate.md`). Solo Windows e macOS (DEC-13).

| Token | Valore | Uso |
|---|---|---|
| `breakpoint-largo` | 1280 | Da 1280 px: colonna sinistra, nota aperta e spazio di respiro ai lati del testo |
| `breakpoint-medio` | 1024 | Da 1024 a 1279 px: colonna più stretta, il testo occupa tutta la larghezza restante. È anche la larghezza minima della finestra desktop |

Il breakpoint stretto (sotto 1024 px, con la colonna come drawer) serviva solo al web ed è rinviato con ID-19.

## Tipografia
Un solo carattere: **Inter**.

| Stile | Dimensione | Peso | Interlinea | Quando si usa |
|---|---|---|---|---|
| `nota-titolo` | 30 | Bold | 1,25 (spaziatura −1%) | Titolo della nota |
| `nota-sottotitolo` | 19 | Semi Bold | 1,35 | Titoli dentro la nota |
| `nota-corpo` | 15 | Regular | 1,6 | Testo della nota |
| `interfaccia-titolo-schermata` | 19 | Semi Bold | 1,35 | Titolo di una schermata senza nota (Memodu nel modulo di accesso) |
| `interfaccia-controllo` | 13 | Regular | 1,4 | Testo di campi, righe, voci di menu, tag, filtri, giorni del calendario |
| `interfaccia-controllo-attivo` | 13 | Medium | 1,4 | Riga selezionata, etichetta dei pulsanti, giorno di oggi |
| `interfaccia-messaggio` | 13 | Regular | 1,4 | Testo di avvisi, finestre di conferma, stati vuoti, aree di trascinamento |
| `interfaccia-titolo` | 13 | Medium | 1,4 | Titoli di finestre, stati vuoti, risultati, elementi del cestino, mese del calendario |
| `interfaccia-etichetta` | 11 | Medium | 1,3 | Etichette dei campi, giorni della settimana |
| `interfaccia-titolo-gruppo` | 11 | Medium | 1,3 | Titoli di gruppo delle impostazioni |
| `interfaccia-titolo-sezione` | 11 | Semi Bold, maiuscolo, spaziatura 6% | 1,3 | Titoli di sezione della colonna (Non organizzate, Cartelle) |
| `interfaccia-dettaglio` | 11 | Regular | 1,3 | Date, cartella, conteggi, scorciatoie, descrizioni, suggerimento, messaggio d'errore di un campo |

Gli stili sono il livello semantico: si sceglie lo stile dal ruolo del testo, mai dalla taglia, e un testo senza stile non è ammesso (DEC-22). Sotto gli stili ci sono i primitivi nascosti `tipo-famiglia` (Inter), `tipo-dimensione-11` … `-30` e `tipo-peso-regular` … `-bold`, collegati a famiglia, dimensione e peso di ogni stile; interlinea e spaziatura restano nello stile, perché sono in percentuale. Ruoli diversi con gli stessi valori (controllo e messaggio, controllo attivo e titolo) restano stili separati: se un ruolo cambia, non trascina l'altro.

## Ombre ed elevazione
Un'ombra sola, solo su ciò che fluttua (regola 5): `ombra-flottante` = 0 8 24, colore `ombra-flottante`. La usano i livelli 20–50 della scala z-index; i livelli 0 e 10 sono piatti.

## Scala z-index
| Token | Valore | Uso |
|---|---|---|
| `z-base` | 0 | Contenuto base: colonna, area della nota |
| `z-fisso` | 10 | Ricerca in cima alla colonna |
| `z-comparsa` | 20 | Pillola degli strumenti, menu, pannelli, suggerimenti, card dei risultati |
| `z-overlay` | 30 | Area di trascinamento; drawer sul web stretto (rinviato, ID-19) |
| `z-conferma` | 40 | Finestre di conferma, con velo |
| `z-avviso` | 50 | Avvisi |

## Fondi dei controlli sulle superfici
Regola visiva 11: un controllo con un fondo proprio (campo, hover, premuto, pieno) deve distinguersi da **ogni superficie** su cui può comparire, in chiaro e in scuro. Le superfici sono tre: `sfondo-nota`, `sfondo-colonna` e `sfondo-flottante` (menu, pannelli, pillola, finestre). Due fondi uguali (rapporto 1,00) non sono mai ammessi.

La regola è nata da un errore: in scuro `sfondo-campo` e `sfondo-flottante` erano entrambi `grigio-800`, e i campi nei pannelli (CMP-11) sparivano. Da qui il nuovo `grigio-750`.

| Fondo del controllo | Modo | Su nota | Su colonna | Su flottante |
|---|---|---|---|---|
| `sfondo-campo` (#EBEBEB) | Chiaro | 1,19 | 1,08 | 1,19 |
| `sfondo-campo` (#383838) | Scuro | 1,57 | 1,41 | 1,21 |
| `sfondo-hover` (#E0E0E0) | Chiaro | 1,32 | 1,20 | 1,32 |
| `sfondo-hover` (#3D3D3D) | Scuro | 1,70 | 1,52 | 1,30 |
| `sfondo-premuto` (#C1C1C1) | Chiaro | 1,80 | 1,64 | 1,80 |
| `sfondo-premuto` (#525252) | Scuro | 2,36 | 2,11 | 1,81 |
| `sfondo-pieno` (#1F1F1F) | Chiaro | 16,48 | 14,99 | 16,48 |
| `sfondo-pieno` (#F4F4F4) | Scuro | 16,75 | 14,99 | 12,87 |
| `sfondo-<stato>` (gradino 50) | Chiaro | 1,09–1,11 | — | 1,09–1,11 |
| `sfondo-<stato>` (gradino 800) | Scuro | 1,24–1,33 | — | — |

Soglia della regola: ogni cella sopra 1,05 (il valore più basso, 1,08, è il campo sulla colonna in chiaro). Nuovi fondi o nuove superfici si aggiungono a questa tabella prima di usarli.

**Limite noto (WCAG 1.4.11):** il fondo dei campi non raggiunge 3:1 contro la superficie. Il campo si riconosce comunque da etichetta, segnaposto, icona e dall'anello di focus (che invece supera 3:1); va verificato nel test di accessibilità (Fase 8).

## Verifica contrasti
Soglie WCAG AA: 4,5:1 per il testo normale, 3:1 per icone e testo grande. Il testo tenue è passato da #7B7B7B (moodboard) a #696969 perché il primo non raggiungeva 4,5:1.

| Testo | Sfondo | Modo | Colori | Rapporto | WCAG AA |
|---|---|---|---|---|---|
| `testo/primario` | `sfondo/nota` | Chiaro | #1F1F1F su #FFFFFF | 16.48:1 | ✅ |
| `testo/primario` | `sfondo/nota` | Scuro | #F4F4F4 su #141414 | 16.75:1 | ✅ |
| `testo/primario` | `sfondo/colonna` | Chiaro | #1F1F1F su #F4F4F4 | 14.99:1 | ✅ |
| `testo/primario` | `sfondo/colonna` | Scuro | #F4F4F4 su #1F1F1F | 14.99:1 | ✅ |
| `testo/primario` | `sfondo/campo` | Chiaro | #1F1F1F su #EBEBEB | 13.83:1 | ✅ |
| `testo/primario` | `sfondo/campo` | Scuro | #F4F4F4 su #383838 | 10.66:1 | ✅ |
| `testo/primario` | `sfondo/hover` | Chiaro | #1F1F1F su #E0E0E0 | 12.49:1 | ✅ |
| `testo/primario` | `sfondo/hover` | Scuro | #F4F4F4 su #3D3D3D | 9.88:1 | ✅ |
| `testo/primario` | `sfondo/flottante` | Chiaro | #1F1F1F su #FFFFFF | 16.48:1 | ✅ |
| `testo/primario` | `sfondo/flottante` | Scuro | #F4F4F4 su #2B2B2B | 12.87:1 | ✅ |
| `testo/primario` | `evidenziazione/selezione` | Chiaro | #1F1F1F su #E0E0E0 | 12.49:1 | ✅ |
| `testo/primario` | `evidenziazione/selezione` | Scuro | #F4F4F4 su #3D3D3D | 9.88:1 | ✅ |
| `testo/tenue` | `sfondo/nota` | Chiaro | #696969 su #FFFFFF | 5.49:1 | ✅ |
| `testo/tenue` | `sfondo/nota` | Scuro | #A3A3A3 su #141414 | 7.30:1 | ✅ |
| `testo/tenue` | `sfondo/colonna` | Chiaro | #696969 su #F4F4F4 | 4.99:1 | ✅ |
| `testo/tenue` | `sfondo/colonna` | Scuro | #A3A3A3 su #1F1F1F | 6.53:1 | ✅ |
| `testo/tenue` | `sfondo/campo` | Chiaro | #696969 su #EBEBEB | 4.61:1 | ✅ |
| `testo/tenue` | `sfondo/campo` | Scuro | #A3A3A3 su #383838 | 4.65:1 | ✅ |
| `testo/tenue` | `sfondo/flottante` | Chiaro | #696969 su #FFFFFF | 5.49:1 | ✅ |
| `testo/tenue` | `sfondo/flottante` | Scuro | #A3A3A3 su #2B2B2B | 5.61:1 | ✅ |
| `testo/tenue` | `sfondo/hover` | Chiaro | #696969 su #E0E0E0 | 4.16:1 | ⚠️ solo testo grande (≥3:1) |
| `testo/tenue` | `sfondo/hover` | Scuro | #A3A3A3 su #3D3D3D | 4.31:1 | ⚠️ solo testo grande (≥3:1) |
| `testo/primario` | `sfondo/premuto` | Chiaro | #1F1F1F su #C1C1C1 | 9.16:1 | ✅ |
| `testo/primario` | `sfondo/premuto` | Scuro | #F4F4F4 su #525252 | 7.10:1 | ✅ |
| `testo/su-pieno` | `sfondo/pieno-hover` | Chiaro | #FFFFFF su #3D3D3D | 10.86:1 | ✅ |
| `testo/su-pieno` | `sfondo/pieno-hover` | Scuro | #141414 su #E0E0E0 | 13.96:1 | ✅ |
| `testo/su-pieno` | `sfondo/pieno-premuto` | Chiaro | #FFFFFF su #2B2B2B | 14.16:1 | ✅ |
| `testo/su-pieno` | `sfondo/pieno-premuto` | Scuro | #141414 su #EBEBEB | 15.45:1 | ✅ |
| `icona/tenue` | `sfondo/premuto` | Chiaro | #696969 su #C1C1C1 | 3.05:1 | ✅ (icone ≥ 3:1) |
| `icona/tenue` | `sfondo/premuto` | Scuro | #A3A3A3 su #525252 | 3.10:1 | ✅ (icone ≥ 3:1) |
| `testo/su-pieno` | `sfondo/pieno` | Chiaro | #FFFFFF su #1F1F1F | 16.48:1 | ✅ |
| `testo/su-pieno` | `sfondo/pieno` | Scuro | #141414 su #F4F4F4 | 16.75:1 | ✅ |
| `icona/tenue` | `sfondo/colonna` | Chiaro | #696969 su #F4F4F4 | 4.99:1 | ✅ |
| `icona/tenue` | `sfondo/colonna` | Scuro | #A3A3A3 su #1F1F1F | 6.53:1 | ✅ |
| `icona/su-pieno` | `sfondo/pieno` | Chiaro | #FFFFFF su #1F1F1F | 16.48:1 | ✅ |
| `icona/su-pieno` | `sfondo/pieno` | Scuro | #141414 su #F4F4F4 | 16.75:1 | ✅ |

| Testo dello stato | Sfondo | Modo | Errore | Avviso | Successo | Informazione | WCAG AA |
|---|---|---|---|---|---|---|---|
| `testo/<stato>` | `sfondo/<stato>` | Chiaro | 5.48:1 | 5.10:1 | 4.72:1 | 5.05:1 | ✅ |
| `testo/<stato>` | `sfondo/<stato>` | Scuro | 5.44:1 | 5.47:1 | 5.82:1 | 5.63:1 | ✅ |
| `testo/<stato>` | `sfondo/nota` | Chiaro | 6.06:1 | 5.62:1 | 5.12:1 | 5.54:1 | ✅ |
| `testo/<stato>` | `sfondo/nota` | Scuro | 6.75:1 | 7.05:1 | 7.76:1 | 7.28:1 | ✅ |

Tutti i token di testo e icone neutri puntano alla scala dei grigi; quelli degli stati alle scale semantiche. Nessun token ha un valore scritto direttamente.

Il testo tenue sulla pillola di passaggio del mouse (`sfondo-hover`) non raggiunge 4,5:1: sulle righe in hover tutto il testo, compreso quello secondario (date, numeri), passa a `testo-primario` (12,49:1 chiaro, 9,88:1 scuro). Scelta tra quattro alternative confrontate nel riquadro "Hover · alternative di contrasto" della pagina Token; scartate: testo tenue scurito (#636363 / #A7A7A7) e grigio hover più tenue (#E9E9E9 / #3A3A3A), corrette ma senza differenza visibile. Il testo tenue si usa solo su nota, colonna, campi e superfici flottanti.
