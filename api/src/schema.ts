// Schema dell'archivio, con un numero di versione: ogni cambio è una migrazione nuova in fondo
// all'elenco, mai una modifica di quelle già applicate. All'avvio si applicano quelle che
// mancano, in una transazione e una istanza alla volta.

import type { Database } from "./database.ts";

const MIGRAZIONI = [
  // 1 – Versioni degli elementi con il blocco (DEC-75, DEC-105) e lo stato dell'archivio. Il
  // numero d'ordine è unico; `dimensione` è la lunghezza del blocco come viaggia in JSON, per
  // le pagine delle modifiche (DEC-106). `archivio` distingue questo archivio da ogni altro: se
  // cambia, il client riparte da zero.
  `CREATE TABLE versioni (
     id text NOT NULL,
     versione integer NOT NULL,
     ordine integer NOT NULL UNIQUE,
     ora text NOT NULL,
     dimensione integer NOT NULL,
     dati text NOT NULL,
     PRIMARY KEY (id, versione)
   );
   CREATE TABLE stato (chiave text PRIMARY KEY, valore text NOT NULL);
   INSERT INTO stato (chiave, valore) VALUES ('archivio', gen_random_uuid()::text);`,
];

export const VERSIONE_SCHEMA = MIGRAZIONI.length;

/** Blocco consultivo che tiene una migrazione alla volta tra le istanze. */
const BLOCCO_SCHEMA = 4318;

export async function aggiornaSchema(db: Database): Promise<void> {
  await db.transazione(async (sql) => {
    await sql.righe("SELECT pg_advisory_xact_lock($1)", [BLOCCO_SCHEMA]);
    await sql.esegui("CREATE TABLE IF NOT EXISTS schema (versione integer NOT NULL)");
    const [riga] = await sql.righe<{ versione: number }>("SELECT versione FROM schema");
    if (!riga) await sql.righe("INSERT INTO schema (versione) VALUES (0)");
    for (let versione = riga?.versione ?? 0; versione < MIGRAZIONI.length; versione++) {
      await sql.esegui(MIGRAZIONI[versione]!);
      await sql.righe("UPDATE schema SET versione = $1", [versione + 1]);
    }
  });
}
