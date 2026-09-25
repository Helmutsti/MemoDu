# Sincronizzazione – Entità

<!-- Fase 3 della guida. -->

## Diagramma ER
Il diagramma di tutto il sistema è in `moduli/note/3-entita.md`.

## EN-05 – Account
**Descrizione:** l'unica installazione personale e le sue credenziali (RF-14, DEC-13). Non ha email né password e l'utente non la vede.

| Attributo | Tipo | Obbligatorio | Vincoli | Note |
|---|---|---|---|---|
| Identificativo | Codice | Sì | Uno solo per installazione (DEC-01, DEC-13) | Tecnico, non visibile |
| Credenziali | Segreto | Sì | Generate installando il server | Autorizzano i dispositivi e contengono la chiave di cifratura (DEC-08). Si scrivono nel file di configurazione dell'app (RB-54). Come si conservano e come si cambiano si decide in Fase 7 |
| Data di creazione | Data e ora | Sì | | All'installazione del server |

- **Chi lo crea:** il sistema, all'installazione del server (FL-08).
- **Chi lo modifica:** nessuno dall'app; il cambio delle credenziali si decide in Fase 7.
- **Cancellazione:** non prevista nella prima fase.
- **Dati sensibili:** le credenziali. Chi legge il file di configurazione di un dispositivo legge tutte le note (rischio accettato, DEC-13). Il recupero delle credenziali perse è rimandato (domanda aperta su RF-10).

## EN-06 – Dispositivo
**Descrizione:** un computer da cui l'utente usa Memodu (FL-07, FL-08).

| Attributo | Tipo | Obbligatorio | Vincoli | Note |
|---|---|---|---|---|
| Identificativo | Codice | Sì | Unico e stabile | Tecnico, non visibile |
| Nome | Testo | Sì | | Preso dal sistema (es. nome del PC), modificabile (RB-51). Compare nel titolo delle note in conflitto (DEC-06) |
| Tipo | Windows \| macOS | Sì | Piattaforme della prima fase (DEC-13) | |
| Ultima sincronizzazione | Data e ora | No | | Serve all'avviso di RB-40 |
| Modifiche in attesa | Numero | Sì | | Modifiche non ancora arrivate al server |

- **Chi lo crea:** il sistema, alla prima sincronizzazione da quel dispositivo (FL-08).
- **Chi lo modifica:** il sistema; l'utente, solo per il nome (RB-51).
- **Cancellazione:** non c'è uscita (DEC-13): un dispositivo si scollega disinstallando l'app. Se resti registrato si decide con RF-16 (Should).
- **Dati sensibili:** il nome del dispositivo è cifrato end-to-end (DEC-08).

## EN-08 – Avviso
**Descrizione:** un avviso mostrato all'utente dalla sincronizzazione (RB-39, RB-40). Si sincronizza: visto su un dispositivo, sparisce da tutti (RB-53).

| Attributo | Tipo | Obbligatorio | Vincoli | Note |
|---|---|---|---|---|
| Identificativo | Codice | Sì | Unico e stabile | Tecnico, non visibile |
| Tipo | nota in conflitto \| errore di sincronizzazione \| server irraggiungibile | Sì | | RB-39, RB-40. Le credenziali rifiutate non sono un avviso: bloccano la finestra (RB-57) |
| Nota collegata | EN-01 | No | Solo per il tipo "nota in conflitto" | Il collegamento dell'avviso (RB-39) |
| Dispositivo | EN-06 | Sì | | Il dispositivo su cui è nato il problema |
| Data | Data e ora | Sì | | |
| Visto | Sì \| No | Sì | | Di default No |

Il testo dell'avviso non è un attributo: dipende dal tipo e si scrive in Fase 6.

- **Chi lo crea:** il sistema (FL-07).
- **Chi lo modifica:** l'utente, vedendolo (Visto diventa Sì).
- **Cancellazione:** un avviso visto non si mostra più, su nessun dispositivo (RB-53). Quando eliminarlo davvero si decide in Fase 7.
- **Dati sensibili:** cifrato end-to-end come tutti i dati (DEC-08).
- **Limite:** un avviso "server irraggiungibile" per natura non può sincronizzarsi finché il server non torna: fino ad allora esiste solo sul dispositivo che lo ha generato.

## Diagrammi a stati
Nessuno: senza login e uscita il dispositivo non cambia stato (DEC-13).
