# Interfaccia – Flussi

<!-- Fase 2 della guida. I diagrammi si scrivono in Mermaid. -->

## RF-11 – Interazioni rapide
RF-11 non ha un flusso proprio: trascinamento, menu del tasto destro e scorciatoie sono modi di eseguire gli altri flussi.

| Interazione | Dove si usa |
|---|---|
| Scorciatoia globale, personalizzabile | FL-01 Nota rapida |
| Scorciatoie da tastiera per la formattazione (per ora sospese, DEC-64) | FL-02 Scrivere e formattare |
| Menu del tasto destro sul testo (per ora sospeso: si apre il menu del sistema, DEC-64) | FL-02 Scrivere e formattare |
| Trascinamento di immagini nel testo | FL-03 Inserire un'immagine |
| Info: clic sul titolo nel percorso o tasto destro sulla nota (DEC-96) | FL-04 Modificare i metadati |
| Trascinamento di note e cartelle nell'albero | FL-05 Organizzare nelle cartelle |
| Menu del tasto destro nell'albero | FL-05, FL-09 |
| Scorciatoia Nuova nota: Ctrl + N, ⌘ + N su macOS (DEC-69) | FL-09 Creare una nota |
| Scorciatoia Chiudi nota: Ctrl + W, ⌘ + W su macOS (DEC-70) | SC-01, DEC-68 |
| Scorciatoia Ricerca: Ctrl + K, ⌘ + K su macOS, apre la colonna con il cursore nel campo (DEC-94) | FL-06 Cercare e filtrare |
| Scorciatoia Ricerca avanzata: Ctrl + Maiusc + K, ⌘ + Maiusc + K su macOS (DEC-96) | FL-06 Cercare e filtrare |
| Scorciatoia Fissa la colonna: Ctrl + \, ⌘ + \ su macOS (DEC-102) | SC-01, DEC-55 |

## RF-12 – Finestre multiple
Requisito *Should*: il flusso si scrive quando entra in progettazione. Le note sganciate di DEC-92 sono state tolte (DEC-93).

## Regole di business
| Codice | Regola | Usata in |
|---|---|---|
| RB-52 | Le impostazioni si sincronizzano e valgono su tutti i dispositivi, tranne tema, avvio all'accensione, primo piano e nome del dispositivo, che valgono solo sul dispositivo (DEC-91, DEC-93); la scorciatoia globale si salva separatamente per Windows e per macOS | FL-01, FL-07 |
