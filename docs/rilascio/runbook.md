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
### Credenziali perse, o finite in mani sbagliate
**Sintomi:** il file `credenziali` non c'è più su nessun dispositivo, oppure qualcuno che non deve ne ha una copia (DEC-114).
**Cause probabili:** dispositivi persi o reinstallati; file copiato in un posto condiviso, incollato in una chat o in un repository.
**Cosa fare:**
1. Dalla cartella del progetto genera le credenziali nuove, in un file che non esiste ancora: `npm run credenziali -w @memodu/api -- https://memodu-api.vercel.app <file>`. Il comando stampa la riga `MEMODU_IMPRONTA=…`.
2. Su Vercel, progetto dell'API › Settings › Environment Variables: metti il valore nuovo in `MEMODU_IMPRONTA` e rifai il deploy. Da qui le credenziali vecchie ricevono 401.
3. Su ogni dispositivo chiudi Memodu e metti il file nuovo al posto di `credenziali`: su Windows in `%LOCALAPPDATA%\Memodu\`, su macOS in `~/Library/Application Support/Memodu/`. Se Memodu era aperto mostra la schermata di blocco: metti il file e premi Riprova.
4. Controlla che le note arrivino; le modifiche fatte nel frattempo sono rimaste sulla copia di lavoro e partono da sole.
5. Non mettere il file né il gettone nel repository o in una chat: conserva una copia in un gestore di password.

Con la cifratura il file conterrà anche la chiave delle note: questa procedura andrà rivista (rinvio della cifratura).
