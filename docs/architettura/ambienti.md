# Ambienti

<!-- Fase 7 della guida. Un ambiente è la combinazione di codice, configurazione, dati, infrastruttura e servizi esterni. -->

## Elenco
| Ambiente | A cosa serve | Chi ha accesso | Codice | Dati | Servizi esterni |
|---|---|---|---|---|---|
| Locale | Il singolo sviluppatore lavora. Nella prima fase è l'unico ambiente: client e API girano sulla macchina di sviluppo e si avviano separatamente. Il client (`npm run client`) tiene le note nella sua copia di lavoro e non ha bisogno dell'API (DEC-67). L'API ascolta su `127.0.0.1:4317` e si avvia a mano con `npm run api`; serve al client solo per sincronizzare (DEC-85). Oggi al primo avvio scrive il file `credenziali` nella cartella dei dati, che il client sulla stessa macchina usa da solo (DEC-79, DEC-84); con DEC-121 l'utente fisso in locale sta in `api/.env`, accanto all'API, come database simulato degli utenti, escluso da git | Manuel Cucca | Il suo ramo in corso | Minimi, generati | Nessuno |
| Integrazione | Verificare che i pezzi funzionino insieme | | Ultima versione di ogni componente | Di prova, ricreabili | Sandbox |
| Collaudo | Verificare prima del rilascio | | Versione candidata | Realistici, anonimizzati | Sandbox |
| Produzione | Le note vere di Manuel Cucca, da più dispositivi (DEC-104) | Manuel Cucca (account Vercel e Neon) | API su Vercel, ingresso `api/src/index.ts` (DEC-105) | Reali, in Neon (PostgreSQL), in chiaro finché la cifratura di DEC-121 non è nel codice (DEC-78) | Vercel, Neon |
| Effimeri | Provare una singola modifica | | Un ramo specifico | Di prova | Simulati o sandbox |

## Manifesto di ogni ambiente
```yaml
ambiente: collaudo
componenti:
  frontend: 0.0.0
  api: 0.0.0
database:
  schema: 0
  dati: nome-set-di-dati
configurazione: collaudo
servizi-esterni:
  pagamenti: sandbox
  email: intercettate
```

## Set di dati
| Nome | Contenuto | Versione schema | Come si genera |
|---|---|---|---|
| Smistare (Locale, frammento Must B) | Tre note non organizzate; «Lavoro» con «Clienti» (nota «Rossi»), «Progetti» e le note «Budget 2026» e «Riunione con i fornitori»; «Personale» vuota. Nessun dato personale | Copia di lavoro, schema 5 (DEC-48, DEC-67) | Da rifare: lo script `scripts/dati-di-prova.sh` usava le richieste delle note dell'API, tolte con DEC-85. Per ora le note di prova si creano a mano nell'app, con `MEMODU_CARTELLA` su una cartella vuota; mai sulla cartella dei dati vera |
| Ricerca (Locale, RF-08) | Il set Smistare più: «Rilascio della versione 2» e «Bozza del rilascio» in «Lavoro» (tag «lavoro»), «Riunione di lunedì» in «Clienti» (tag «lavoro», «clienti», testo con «rilascio» e «venerdì»), «Idee per il sito» non organizzata (testo «note di rilascio»), una nota con «perché»; «Rossi» con il solo tag «lavoro/clienti»; «Vecchia scaletta» nel cestino e una cartella nel cestino con una nota che contiene «rilascio»; una nota modificata 10 giorni prima e una con la data di creazione scelta. Nessun dato personale | Copia di lavoro, schema 5 (DEC-95) | A mano nell'app, con `MEMODU_CARTELLA` su una cartella vuota; le date vecchie si spostano nel database con un comando SQL. Per TC-78 le 5.000 note le genera la prova automatica |
| Prove locale (Locale, RF-17) | Una cartella `prove-locale` con: `appunti/` (`idee.md`, `riunione.txt`, `spesa.md`, `vecchio-elenco.txt` in Windows-1252 con «Città» e «Società», `windows-crlf.txt` con a capo CRLF, `con-bom.md` con BOM, `sola-lettura.md` in sola lettura, `grande.txt` da 24 MB, `foto.jpg`), `progetto-x/` (`note.md`), `.git/` (`config`). Nessun dato personale | — (file sul disco) | Da uno script di prova scritto con il codice di RF-17 |

## Regole
- **Promozione:** come una versione passa da un ambiente al successivo e chi la autorizza.
- **Ripristino:** ogni quanto si azzerano gli ambienti di prova, come si torna a una versione precedente.
- **Segreti:** dove sono custoditi, chi li vede, come si ruotano.
- **Dati personali:** mai fuori dalla produzione senza anonimizzazione.
