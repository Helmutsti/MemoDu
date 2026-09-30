# Ambienti

<!-- Fase 7 della guida. Un ambiente è la combinazione di codice, configurazione, dati, infrastruttura e servizi esterni. -->

## Elenco
| Ambiente | A cosa serve | Chi ha accesso | Codice | Dati | Servizi esterni |
|---|---|---|---|---|---|
| Locale | Il singolo sviluppatore lavora. Nella prima fase è l'unico ambiente: client e API girano sulla macchina di sviluppo e si avviano separatamente. Il client (`npm run client`) tiene le note nella sua copia di lavoro e non ha bisogno dell'API (DEC-67). L'API ascolta su `127.0.0.1:4317` e si avvia a mano con `npm run api`; serve al client solo nel browser usato per le prove | Manuel Cucca | Il suo ramo in corso | Minimi, generati | Nessuno |
| Integrazione | Verificare che i pezzi funzionino insieme | | Ultima versione di ogni componente | Di prova, ricreabili | Sandbox |
| Collaudo | Verificare prima del rilascio | | Versione candidata | Realistici, anonimizzati | Sandbox |
| Produzione | Gli utenti veri | | Versione rilasciata | Reali | Reali |
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
| Smistare (Locale, frammento Must B) | Tre note non organizzate; «Lavoro» con «Clienti» (nota «Rossi»), «Progetti» e le note «Budget 2026» e «Riunione con i fornitori»; «Personale» vuota. Nessun dato personale | Database SQLite, schema 1 (DEC-48) | API avviata con `MEMODU_CARTELLA="$HOME/Documents/Memodu-prove" npm run api` su una cartella vuota, poi `sh scripts/dati-di-prova.sh` (su Windows con Git Bash le lettere accentate non passano: usare Node). Mai sul database vero: la variabile `MEMODU_CARTELLA` tiene le prove separate dalla cartella dei dati delle applicazioni |

## Regole
- **Promozione:** come una versione passa da un ambiente al successivo e chi la autorizza.
- **Ripristino:** ogni quanto si azzerano gli ambienti di prova, come si torna a una versione precedente.
- **Segreti:** dove sono custoditi, chi li vede, come si ruotano.
- **Dati personali:** mai fuori dalla produzione senza anonimizzazione.
