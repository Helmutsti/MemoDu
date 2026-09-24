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
| Accesso non più valido | Subito (SF-25) | Accedi → SC-05 |
| Errore di sincronizzazione | Subito (SF-32) | Ho capito |
| Nota in conflitto | Subito (RB-39) | Apri l'altra |

Visto su un dispositivo, l'avviso sparisce su tutti (RB-53).

---

## SC-05 – Accesso
**Flussi:** FL-08 · **Componenti:** modulo di accesso, campo di testo, pulsante, messaggio in linea

- **Wireframe:** [accesso](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=38-181) · [credenziali errate](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=38-196) · [primo avvio](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=38-211)
- **Esportazioni:** `immagini/SC-05.png`, `immagini/SC-05-errore.png`, `immagini/SC-05-primo-avvio.png`
- **Mockup:** [Fase 6]

Finestra vuota con il modulo al centro: nome Memodu, email, password, Accedi. Al primo avvio dell'installazione lo stesso modulo crea l'unico account (DEC-05), senza requisiti sulla password (RB-43). "Password dimenticata" non c'è: il recupero è rinviato e blocca la Definition of Ready di RF-14.

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | Primo avvio: Crea l'account | Testo definitivo in Fase 6 |
| Caricamento | Dopo Accedi, mentre arriva la copia di lavoro: SC-01 in caricamento | — |
| Errore | Credenziali errate: messaggio in linea sopra il pulsante, si riprova senza limiti (RB-42) | Testo definitivo in Fase 6 |
| Successo | Si entra in SC-01 e si resta collegati (RF-14) | — |

### Messaggi di errore
| Sfiga | Testo definitivo |
|---|---|
| Credenziali errate | Fase 6 |
| SF-25 Accesso revocato | Fase 6 (avviso, vedi sopra) |
