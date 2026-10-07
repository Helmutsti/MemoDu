# Runbook

<!-- Fase 9 della guida. Per chi gestisce il sistema. -->

## Installazione e aggiornamento
[Da compilare]

## Backup e ripristino
[Da compilare]

## Monitoraggio
| Cosa si controlla | Soglia di allarme | Chi viene avvisato |
|---|---|---|
| | | |

## Se succede X, fai Y
### Password persa (DEC-121)
**Sintomi:** non ricordi la password dell'utente fisso.
**Cosa fare:**
1. Prendi il foglio con la chiave di recupero.
2. Dalla cartella del progetto, con `api/.env` attuale o le variabili di Vercel nell'ambiente: `npm run utente -w @memodu/api -- --recupero`; chiede la chiave di recupero e la password nuova (almeno 12 caratteri, RB-88) e riusa la stessa chiave dati, quindi le note non si ricifrano.
3. Su Vercel, progetto dell'API › Settings › Environment Variables: metti i valori nuovi e rifai il deploy.
4. Su ogni dispositivo compare «Accedi di nuovo per sincronizzare»: accedi con la password nuova.

Senza il foglio e senza la password le note sul server non si recuperano: restano solo le copie di lavoro dei dispositivi (RB-90).

### Dispositivo perso, o chiave di recupero finita in mani sbagliate (DEC-121)
**Cosa fare:**
1. Dispositivo perso: cambia `MEMODU_SEGRETO` su Vercel e rifai il deploy; tutti i gettoni smettono di valere e ogni dispositivo rifà l'accesso. Cambia anche la password se poteva essere salvata su quel dispositivo.
2. Chiave di recupero in mani sbagliate: `npm run utente -w @memodu/api -- --nuovo-recupero` chiede la password e stampa una chiave di recupero nuova e le variabili; aggiornale, stampa la chiave nuova e distruggi il foglio vecchio.
