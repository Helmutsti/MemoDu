# Interfaccia – Flussi

<!-- Fase 2 della guida. I diagrammi si scrivono in Mermaid. -->

## RF-11 – Interazioni rapide
RF-11 non ha un flusso proprio: trascinamento, menu del tasto destro e scorciatoie sono modi di eseguire gli altri flussi.

| Interazione | Dove si usa |
|---|---|
| Scorciatoia globale, personalizzabile | FL-01 Nota rapida |
| Scorciatoie da tastiera per la formattazione | FL-02 Scrivere e formattare |
| Menu del tasto destro sul testo | FL-02 Scrivere e formattare |
| Trascinamento di immagini nel testo | FL-03 Inserire un'immagine |
| Menu della nota (in alto a destra) | FL-04 Modificare i metadati |
| Trascinamento di note e cartelle nell'albero | FL-05 Organizzare nelle cartelle |
| Menu del tasto destro nell'albero | FL-05, FL-09 |
| Scorciatoia Nuova nota: Ctrl + N, ⌘ + N su macOS (DEC-69) | FL-09 Creare una nota |
| Scorciatoia Chiudi nota: Ctrl + W, ⌘ + W su macOS (DEC-70) | SC-01, DEC-68 |

## RF-12 – Finestre multiple
Note sganciate (DEC-92): non hanno un flusso proprio, sono un modo di aprire e scrivere una nota (FL-02). I criteri sono in `1-requisiti.md` (CA-12.1 … CA-12.7). Le finestre affiancate liberamente restano *Should*: il loro flusso si scrive quando entrano in progettazione.

## Regole di business
| Codice | Regola | Usata in |
|---|---|---|
| RB-52 | Le impostazioni si sincronizzano e valgono su tutti i dispositivi, tranne tema, avvio all'accensione e nome del dispositivo, che valgono solo sul dispositivo (DEC-91); la scorciatoia globale si salva separatamente per Windows e per macOS | FL-01, FL-07 |
