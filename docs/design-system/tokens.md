# Tokens

<!-- Fase 5 della guida. I componenti usano solo token semantici. -->

Direzione: C · Essenziale con grigi neutri (DEC-12) e regole visive di `moodboard.md`. I token vivono come variabili nel file Figma [Memodu – Design system](https://www.figma.com/design/ulmeeMyPHDFR0lSR9NquuE) (collezioni **Primitivi**, **Colore** con modi Chiaro e Scuro, **Dimensioni**; pagina **Token**). Nel codice il nome diventa una variabile CSS: `colore/sfondo/nota` → `var(--sfondo-nota)`.

## Primitivi
Grigi neutri assoluti (rosso, verde e blu uguali). Non si usano direttamente nei componenti.

| Token | Valore |
|---|---|
| `grigio-0` | #FFFFFF |
| `grigio-50` | #F4F4F4 |
| `grigio-100` | #EBEBEB |
| `grigio-200` | #E0E0E0 |
| `grigio-400` | #A3A3A3 |
| `grigio-500` | #696969 |
| `grigio-700` | #3D3D3D |
| `grigio-800` | #2B2B2B |
| `grigio-900` | #1F1F1F |
| `grigio-950` | #141414 |
| `nero-12` · `nero-30` · `nero-40` · `nero-50` | #000000 al 12%, 30%, 40%, 50% |

## Semantici · colore
| Token | Chiaro | Scuro | Uso |
|---|---|---|---|
| `sfondo-nota` | `grigio-0` | `grigio-950` | Area della nota |
| `sfondo-colonna` | `grigio-50` | `grigio-900` | Colonna sinistra |
| `sfondo-campo` | `grigio-100` | `grigio-800` | Campo di ricerca e campi |
| `sfondo-hover` | `grigio-200` | `grigio-700` | Passaggio del mouse (pillola chiara) |
| `sfondo-pieno` | `grigio-900` | `grigio-50` | Riga selezionata, pillola degli strumenti, pulsante primario |
| `sfondo-flottante` | `grigio-0` | `grigio-800` | Menu, pannelli, avvisi chiari, nota rapida |
| `testo-primario` | `grigio-900` | `grigio-50` | Testo principale |
| `testo-tenue` | `grigio-500` | `grigio-400` | Testo secondario, etichette, segnaposto |
| `testo-su-pieno` | `grigio-0` | `grigio-950` | Testo su sfondo pieno |
| `icona-tenue` | `grigio-500` | `grigio-400` | Icone di linea |
| `icona-su-pieno` | `grigio-0` | `grigio-950` | Icone su sfondo pieno |
| `bordo-divisore` | `grigio-200` | `grigio-700` | Divisori dove servono (menu, cestino) |
| `evidenziazione-selezione` | `grigio-200` | `grigio-700` | Evidenziazione del testo selezionato |
| `velo` | `nero-30` | `nero-50` | Velo sotto le finestre di conferma (livello 40) |
| `ombra-flottante` | `nero-12` | `nero-40` | Colore dell'ombra degli elementi flottanti |

Il modo segue l'impostazione del sistema (regola 9).

## Semantici · dimensioni e movimento
| Token | Valore | Uso |
|---|---|---|
| `spazio-4` … `spazio-48` | 4, 8, 12, 16, 24, 32, 48 | Margini e distanze |
| `raggio-pillola` | 999 | Controlli alti una riga (regola 1) |
| `raggio-contenitore` | 20 | Menu, pannelli, finestre, immagini (regola 2) |
| `misura-riga` | 32 | Righe della colonna e dei menu (regola 6) |
| `misura-icona` | 16 | Icone (regola 8) |
| `tratto-icona` | 1,5 | Spessore delle icone di linea |
| `movimento-durata-breve` | 120 ms | Comparsa di pillola, menu, pannelli, avvisi (regola 10) |
| `movimento-spostamento` | 4 px | Spostamento durante la comparsa |

## Tipografia
Un solo carattere: **Inter**.

| Stile | Dimensione | Peso | Interlinea | Uso |
|---|---|---|---|---|
| `nota-titolo` | 30 | Bold | 1,25 (spaziatura −1%) | Titolo della nota |
| `nota-sottotitolo` | 19 | Semi Bold | 1,35 | Titoli dentro la nota |
| `nota-corpo` | 15 | Regular | 1,6 | Testo della nota |
| `interfaccia-normale` | 13 | Regular | 1,4 | Righe, voci di menu, campi |
| `interfaccia-media` | 13 | Medium | 1,4 | Riga selezionata, pulsanti |
| `interfaccia-etichetta` | 11 | Medium | 1,3 | Titoli di sezione della colonna |
| `interfaccia-piccola` | 11 | Regular | 1,3 | Date, dettagli |

## Ombre ed elevazione
Un'ombra sola, solo su ciò che fluttua (regola 5): `ombra-flottante` = 0 8 24, colore `ombra-flottante`. La usano i livelli 20–50 della scala z-index; i livelli 0 e 10 sono piatti.

## Scala z-index
| Token | Valore | Uso |
|---|---|---|
| `z-base` | 0 | Contenuto base: colonna, area della nota |
| `z-fisso` | 10 | Ricerca in cima alla colonna |
| `z-comparsa` | 20 | Pillola degli strumenti, menu, pannelli, suggerimenti, card dei risultati |
| `z-overlay` | 30 | Drawer sul web stretto, area di trascinamento |
| `z-conferma` | 40 | Finestre di conferma, con velo |
| `z-avviso` | 50 | Avvisi |

## Verifica contrasti
Soglie WCAG AA: 4,5:1 per il testo normale, 3:1 per icone e testo grande. Il testo tenue è passato da #7B7B7B (moodboard) a #696969 perché il primo non raggiungeva 4,5:1.

| Testo | Sfondo | Modo | Colori | Rapporto | WCAG AA |
|---|---|---|---|---|---|
| `testo/primario` | `sfondo/nota` | Chiaro | #1F1F1F su #FFFFFF | 16.48:1 | ✅ |
| `testo/primario` | `sfondo/nota` | Scuro | #F4F4F4 su #141414 | 16.75:1 | ✅ |
| `testo/primario` | `sfondo/colonna` | Chiaro | #1F1F1F su #F4F4F4 | 14.99:1 | ✅ |
| `testo/primario` | `sfondo/colonna` | Scuro | #F4F4F4 su #1F1F1F | 14.99:1 | ✅ |
| `testo/primario` | `sfondo/campo` | Chiaro | #1F1F1F su #EBEBEB | 13.83:1 | ✅ |
| `testo/primario` | `sfondo/campo` | Scuro | #F4F4F4 su #2B2B2B | 12.87:1 | ✅ |
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
| `testo/tenue` | `sfondo/campo` | Scuro | #A3A3A3 su #2B2B2B | 5.61:1 | ✅ |
| `testo/tenue` | `sfondo/flottante` | Chiaro | #696969 su #FFFFFF | 5.49:1 | ✅ |
| `testo/tenue` | `sfondo/flottante` | Scuro | #A3A3A3 su #2B2B2B | 5.61:1 | ✅ |
| `testo/tenue` | `sfondo/hover` | Chiaro | #696969 su #E0E0E0 | 4.16:1 | ⚠️ solo testo grande (≥3:1) |
| `testo/tenue` | `sfondo/hover` | Scuro | #A3A3A3 su #3D3D3D | 4.31:1 | ⚠️ solo testo grande (≥3:1) |
| `testo/su-pieno` | `sfondo/pieno` | Chiaro | #FFFFFF su #1F1F1F | 16.48:1 | ✅ |
| `testo/su-pieno` | `sfondo/pieno` | Scuro | #141414 su #F4F4F4 | 16.75:1 | ✅ |
| `icona/tenue` | `sfondo/colonna` | Chiaro | #696969 su #F4F4F4 | 4.99:1 | ✅ |
| `icona/tenue` | `sfondo/colonna` | Scuro | #A3A3A3 su #1F1F1F | 6.53:1 | ✅ |
| `icona/su-pieno` | `sfondo/pieno` | Chiaro | #FFFFFF su #1F1F1F | 16.48:1 | ✅ |
| `icona/su-pieno` | `sfondo/pieno` | Scuro | #141414 su #F4F4F4 | 16.75:1 | ✅ |

Il testo tenue sulla pillola di passaggio del mouse (`sfondo-hover`) non raggiunge 4,5:1: sulle righe in hover il testo resta `testo-primario`. Il testo tenue si usa solo su nota, colonna, campi e superfici flottanti.
