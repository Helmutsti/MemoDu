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
| Scorciatoia Nuova nota | FL-09 Creare una nota |

## RF-12 – Finestre multiple
Requisito *Should*: il flusso si scrive quando entra in progettazione.

## Regole di business
| Codice | Regola | Usata in |
|---|---|---|
| RB-52 | Le impostazioni si sincronizzano e valgono su tutti i dispositivi; la scorciatoia globale si salva separatamente per Windows e per macOS | FL-01, FL-07 |
