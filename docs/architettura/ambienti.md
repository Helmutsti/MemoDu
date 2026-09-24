# Ambienti

<!-- Fase 7 della guida. Un ambiente è la combinazione di codice, configurazione, dati, infrastruttura e servizi esterni. -->

## Elenco
| Ambiente | A cosa serve | Chi ha accesso | Codice | Dati | Servizi esterni |
|---|---|---|---|---|---|
| Locale | Il singolo sviluppatore lavora | | Il suo ramo in corso | Minimi, generati | Simulati |
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
| | | | |

## Regole
- **Promozione:** come una versione passa da un ambiente al successivo e chi la autorizza.
- **Ripristino:** ogni quanto si azzerano gli ambienti di prova, come si torna a una versione precedente.
- **Segreti:** dove sono custoditi, chi li vede, come si ruotano.
- **Dati personali:** mai fuori dalla produzione senza anonimizzazione.
