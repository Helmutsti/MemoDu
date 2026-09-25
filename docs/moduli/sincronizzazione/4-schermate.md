# Sincronizzazione – Schermate

<!-- Fasi 4 e 6 della guida. Wireframe e mockup restano nello strumento di design: qui si mettono i link. -->

L'impostazione generale è in `moduli/interfaccia/4-schermate.md`. La sincronizzazione non ha schermate proprie: è invisibile finché va tutto bene (RB-40).

## Avvisi di sincronizzazione (FL-07)
**Flussi:** FL-07 · **Componenti:** avviso

- **Wireframe:** [i tre avvisi](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=38-130) · [nota in conflitto](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=32-147)
- **Esportazioni:** `immagini/SC-01-avvisi.png`

In cima all'area della nota di SC-01, livello 50, uno alla volta:

| Avviso | Quando | Azione |
|---|---|---|
| Server irraggiungibile | Oltre la soglia (indicativa 24 ore, RB-40) | Ho capito |
| Credenziali rifiutate | Subito (SF-25) | Ho capito; la configurazione si corregge fuori dall'app (FL-08) |
| Errore di sincronizzazione | Subito (SF-32) | Ho capito |
| Nota in conflitto | Subito (RB-39) | Apri l'altra |

Visto su un dispositivo, l'avviso sparisce su tutti (RB-53).

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
