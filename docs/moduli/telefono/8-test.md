# Telefono – Test e domande aperte

<!-- Fase 8 della guida. -->

## Piano di test
| Codice | Riferimento | Caso di prova | Ambiente | Set di dati | Esito |
|---|---|---|---|---|---|
| TC-260 | RF-04 CA-04 (telefono) | Info › Creata il: scegliere il 01/10 nel calendario; in Info «Creata il 01/10/2026» con «Ripristina»; Ripristina torna alla data di sistema; sul computer la stessa data | iPhone e computer | Una nota | Prova automatica del nucleo superata il 21/10/2026 (date scelte, ripristinate e ricevute dall'altro dispositivo); a mano nel simulatore il 21/10/2026 dall'agente: Info con «Creata il 01/10/2026» e «Ripristina», il calendario con il giorno pieno, «Oggi» e «Ripristina» con la data di sistema; il tocco dei giorni da provare sull'iPhone |
| TC-261 | RF-04 (telefono) | Info › Fine validità: scegliere un giorno, poi «Nessuna fine validità» la toglie | iPhone | Una nota | A mano nel simulatore il 21/10/2026 dall'agente: il calendario con il 31 pieno e «Nessuna fine validità»; il tocco da provare sull'iPhone |
| TC-262 | RF-06 CA-06.1 … CA-06.5 (telefono) | Foglio Tag: spuntare e togliere «lavoro»; scrivere «Lavoro/Clienti» e Crea: si usa «lavoro» con sotto «Clienti»; tenendo premuto un tag «Elimina tag…» con la conferma e il numero di note | iPhone | Due note con tag | Prova automatica del nucleo superata il 21/10/2026 (livelli, maiuscole, togliere, eliminare con i sotto-tag, sull'altro dispositivo); a mano nel simulatore il foglio con «Cerca o crea un tag» e la spunta; il tocco e la pressione lunga da provare sull'iPhone |
| TC-263 | RF-08 CA-08.7 (telefono) | Filtro Creazione › Scegli le date… › 12/10: pillola «Creazione: 12/10/2026», escono le note di quel giorno | iPhone | Note create in giorni diversi | Da fare |

## Domande aperte
| Riguarda | Domanda | Chi risponde | Risposta | Decisione |
|---|---|---|---|---|
| Perimetro | Cosa deve fare la prima versione per il telefono (note, cartelle, ricerca, Brainet, Cestino, Impostazioni, accesso)? | Manuel Cucca | La proposta dell'agente («vai avanti», 19/10/2026): vedi `1-requisiti.md` | |
| DEC-156 | Nucleo Rust riusato o copia di lavoro, sincronizzazione e cifratura riscritte in TypeScript? | Agente propone, Manuel Cucca sceglie | TypeScript con @noble (Argon2id, HKDF, XChaCha20-Poly1305), stessi vettori di prova del computer; copia di lavoro come blocchi con tutti i campi (proposta dell'agente, «vai avanti con il nucleo» di Manuel Cucca del 19/10/2026) | |
| DEC-156 | Editor della nota nativo o in una vista web? | Agente propone, Manuel Cucca sceglie | L'editor del computer in un componente DOM di Expo (DEC-162, proposta dell'agente del 20/10/2026) | DEC-162 |
| Design system | Scala dei testi e delle misure per il telefono | Agente propone, Manuel Cucca sceglie | 15/13 con righe compatte; nella nota le misure del computer (scelte di Manuel Cucca del 20/10/2026) | DEC-161, DEC-164 |
