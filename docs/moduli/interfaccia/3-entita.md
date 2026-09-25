# Interfaccia – Entità

<!-- Fase 3 della guida. -->

## Diagramma ER
Il diagramma di tutto il sistema è in `moduli/note/3-entita.md`.

## EN-07 – Impostazioni
**Descrizione:** le preferenze dell'utente. Si sincronizzano e valgono su tutti i dispositivi (RB-52).

| Attributo | Tipo | Obbligatorio | Vincoli | Note |
|---|---|---|---|---|
| Account | EN-05 | Sì | Una sola serie di impostazioni per account | |
| Scorciatoia globale su Windows | Combinazione di tasti | Sì | | Nota rapida (RF-01, RF-11). Default `Ctrl+Alt+N` (SC-02) |
| Scorciatoia globale su macOS | Combinazione di tasti | Sì | | Default `Control+Option+N` (SC-02) |
| Avvio automatico all'accensione | Sì \| No | Sì | Solo app desktop | Opzionale (RF-01) |
| Note del cestino nella ricerca | Sì \| No | Sì | | Di default Sì (RB-29) |

Il nome del dispositivo non è qui: appartiene al dispositivo (EN-06, RB-51). Le credenziali appartengono all'installazione (EN-05, RB-54).

- **Chi le crea:** il sistema, con i valori di default, alla creazione dell'account.
- **Chi le modifica:** l'utente, dalle impostazioni.
- **Cancellazione:** non prevista.
- **Dati sensibili:** cifrate end-to-end come tutti i dati (DEC-08).
