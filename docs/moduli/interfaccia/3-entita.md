# Interfaccia – Entità

<!-- Fase 3 della guida. -->

## Diagramma ER
Il diagramma di tutto il sistema è in `moduli/note/3-entita.md`.

## EN-07 – Impostazioni
**Descrizione:** le preferenze dell'utente. La scorciatoia e la scelta delle note del cestino nella ricerca si sincronizzano e valgono su tutti i dispositivi (RB-52, DEC-94); tema, avvio all'accensione e primo piano valgono solo sul dispositivo (DEC-91, DEC-93).

| Attributo | Tipo | Obbligatorio | Vincoli | Note |
|---|---|---|---|---|
| Installazione | EN-05 | Sì | Una sola serie di impostazioni per installazione (DEC-13) | |
| Scorciatoia globale su Windows | Combinazione di tasti | Sì | | Nota rapida (RF-01, RF-11). Default `Ctrl+Alt+N` (SC-02) |
| Scorciatoia globale su macOS | Combinazione di tasti | Sì | | Default `Control+Option+N` (SC-02) |
| Avvio automatico all'accensione | Sì \| No | Sì | Solo app desktop; solo su questo dispositivo | Di default No (RF-01, DEC-91) |
| Tema | Sistema \| Chiaro \| Scuro | Sì | Solo su questo dispositivo | Di default Sistema (DEC-91) |
| Finestra principale in primo piano | Sì \| No | Sì | Solo app desktop; solo su questo dispositivo | Di default No (DEC-93) |
| Note del cestino nella ricerca | Sì \| No | Sì | Sincronizzata (RB-52) | Di default Sì (RB-29, DEC-94) |

Il nome del dispositivo non è qui: appartiene al dispositivo (EN-06, RB-51). Le credenziali appartengono all'installazione (EN-05, RB-54).

- **Chi le crea:** il sistema, con i valori di default, alla prima apertura di Memodu.
- **Chi le modifica:** l'utente, dalle impostazioni.
- **Cancellazione:** non prevista.
- **Dati sensibili:** cifrate end-to-end come tutti i dati (DEC-08); per ora in chiaro, con il server solo in locale (DEC-78).
