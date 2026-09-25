# Sincronizzazione – Schermate

<!-- Fasi 4 e 6 della guida. Wireframe e mockup restano nello strumento di design: qui si mettono i link. -->

L'impostazione generale è in `moduli/interfaccia/4-schermate.md`. La sincronizzazione è invisibile finché va tutto bene (RB-40). Ha una sola schermata propria, SC-07, quando le credenziali mancano o vengono rifiutate.

## Avvisi di sincronizzazione (FL-07)
**Flussi:** FL-07 · **Componenti:** avviso

- **Wireframe:** [i due avvisi](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=38-130) · [nota in conflitto](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=32-147)
- **Esportazioni:** `immagini/SC-01-avvisi.png`

In cima all'area della nota di SC-01, livello 50, uno alla volta:

| Avviso | Quando | Azione |
|---|---|---|
| Server irraggiungibile | Oltre la soglia (indicativa 24 ore, RB-40) | Ho capito |
| Errore di sincronizzazione | Subito (SF-32) | Ho capito |
| Nota in conflitto | Subito (RB-39) | Apri l'altra |

Visto su un dispositivo, l'avviso sparisce su tutti (RB-53). Le credenziali rifiutate non sono un avviso: bloccano la finestra (SC-07).

---

## SC-07 – Collegamento bloccato
**Flussi:** FL-08 · **Componenti:** stato vuoto (variante Blocco), pulsante

- **Wireframe:** [collegamento bloccato](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=51-169)
- **Esportazioni:** `immagini/SC-07.png`
- **Mockup:** [Fase 6]

Al posto della finestra principale e della nota rapida quando le credenziali mancano nel file di configurazione o il server le rifiuta (RB-57, DEC-20). Finestra vuota con, al centro, icona di errore, «Memodu non riesce a collegarsi», una riga che spiega cosa correggere e il pulsante Riprova. Senza rete non compare (DEC-02).

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | Non previsto | — |
| Caricamento | Dopo Riprova, il pulsante in caricamento | — |
| Errore | È la schermata stessa; se Riprova fallisce resta com'è | Testo definitivo in Fase 6 |
| Successo | Credenziali accettate: si apre SC-01 | — |

---

## SC-05 – Accesso
**Flussi:** — (progettata, non attiva) · **Componenti:** modulo di accesso (CMP-22), campo di testo con password (CMP-03), pulsante, messaggio in linea

- **Wireframe:** [accesso](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=38-181) · [credenziali errate](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=38-196) · [primo avvio](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=38-211)
- **Esportazioni:** `immagini/SC-05.png`, `immagini/SC-05-errore.png`, `immagini/SC-05-primo-avvio.png`
- **Mockup:** [Fase 6]

**Progettata ma non attiva nella prima versione (DEC-19).** Oggi il dispositivo si collega con le credenziali preimpostate (DEC-13); l'accesso si porta avanti fino al design per averlo pronto quando servirà (per esempio con il web, ID-19). Le regole dell'accesso (tentativi, requisiti e recupero della password) si decidono quando lo si attiva.

Finestra vuota con il modulo al centro: nome Memodu, email, password, Accedi. Al primo avvio lo stesso modulo crea l'account.

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | Primo avvio: Crea l'account | Testo definitivo in Fase 6 |
| Caricamento | Dopo Accedi, mentre arriva la copia di lavoro: SC-01 in caricamento | — |
| Errore | Credenziali errate: messaggio in linea sopra il pulsante | Testo definitivo in Fase 6 |
| Successo | Si entra in SC-01 e si resta collegati | — |
