# Sincronizzazione – Schermate

<!-- Fasi 4 e 6 della guida. Wireframe e mockup restano nello strumento di design: qui si mettono i link. -->

L'impostazione generale è in `moduli/interfaccia/4-schermate.md`. La sincronizzazione è invisibile finché va tutto bene (RB-40). Le sue schermate sono SC-05 Accesso (DEC-121) e SC-07, che compare solo quando la copia di lavoro non si apre o non si scrive; senza accesso si lavora in locale e non si blocca mai (RB-87).

## Avvisi di sincronizzazione (FL-07)
**Flussi:** FL-07 · **Componenti:** avviso

- **Wireframe:** [i due avvisi](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=38-130) · [nota in conflitto](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=32-147)
- **Esportazioni:** `immagini/SC-01-avvisi.png`

Al centro dell'area della nota di SC-01, 8 sotto la fascia in alto (DEC-86), livello 50, uno alla volta:

| Avviso | Quando | Azione |
|---|---|---|
| Server irraggiungibile | Oltre un'ora dall'ultima sincronizzazione riuscita (RB-40, DEC-112) | Ho capito |
| Errore di sincronizzazione | Subito (SF-32) | Ho capito |
| Nota in conflitto | Subito (RB-39) | Apri l'altra |
| Accesso scaduto | Gettone scaduto o rifiutato (RB-87) | Accedi, che apre SC-05 (wireframe da fare) |

L'avviso resta sul dispositivo in cui nasce (DEC-90). Il testo «Accedi di nuovo per sincronizzare» è provvisorio: quello definitivo in Fase 6.

---

## SC-07 – Collegamento bloccato
**Flussi:** FL-08 · **Componenti:** stato vuoto (variante Blocco), pulsante

- **Wireframe:** [collegamento bloccato](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=51-169)
- **Esportazioni:** `immagini/SC-07.png`
- **Mockup:** [Fase 6]

Al posto della finestra principale e della nota rapida quando la copia di lavoro non si apre o non si scrive (DEC-67) e nell'interfaccia aperta nel browser, che non ha il nucleo (DEC-85). Non compare più per le credenziali: senza un gettone valido si lavora in locale (RB-87, DEC-121). Finestra vuota con, al centro, icona di errore, «Memodu non riesce a collegarsi», una riga che spiega cosa correggere e il pulsante Riprova, con la spiegazione «Il server delle note non risponde. Avvialo e premi Riprova.», da rivedere (domanda aperta su SC-07).

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | Non previsto | — |
| Caricamento | Dopo Riprova, il pulsante in caricamento | — |
| Errore | È la schermata stessa; se Riprova fallisce resta com'è | Testo definitivo in Fase 6 |
| Successo | La copia di lavoro si apre: si apre SC-01 | — |

---

## SC-05 – Accesso
**Flussi:** FL-08 · **Componenti:** modulo di accesso (CMP-22), campo di testo con password (CMP-03), pulsante, messaggio in linea

- **Wireframe:** [accesso](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=38-181) · [credenziali errate](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=38-196) · [primo avvio](https://www.figma.com/design/ioeRDMTxu3TEMoLN8rinAK/Memodu--Wireframe--Fase-4-?node-id=38-211)
- **Esportazioni:** `immagini/SC-05.png`, `immagini/SC-05-errore.png`, `immagini/SC-05-primo-avvio.png`
- **Mockup:** [Fase 6]

**Attiva con DEC-121**, che supera DEC-19. Si apre da «Accedi per sincronizzare» nella sezione Sincronizzazione delle impostazioni (SC-06) o dall'avviso «Accedi di nuovo per sincronizzare» (RB-87); non compare all'avvio, che resta sulla copia di lavoro (RNF-01).

Finestra vuota con il modulo al centro: nome Memodu, email, password, Accedi. **Da aggiornare nei wireframe:** l'app non crea più l'account (lo crea il comando del server, DEC-121), quindi il wireframe del primo avvio cade; serve un modo per tornare alla copia di lavoro senza accedere. Regole: RB-86, RB-88; nessun limite ai tentativi per ora.

### Stati della schermata
| Stato | Descrizione | Testo mostrato |
|---|---|---|
| Vuoto | Email e password vuote | Testo definitivo in Fase 6 |
| Caricamento | Dopo Accedi, Accedi in caricamento mentre il dispositivo calcola Argon2id (circa mezzo secondo) e il server risponde | — |
| Errore | Email o password errate, oppure server irraggiungibile: messaggio in linea sopra il pulsante | Testo definitivo in Fase 6 |
| Successo | Si torna dove si era e la sincronizzazione parte; si resta collegati (RB-86) | — |
