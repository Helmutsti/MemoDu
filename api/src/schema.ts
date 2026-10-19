// Schema dell'archivio, con un numero di versione: ogni cambio è una migrazione nuova in fondo
// all'elenco, mai una modifica di quelle già applicate. All'avvio si applicano quelle che
// mancano, in una transazione e una istanza alla volta.

import { randomUUID } from "node:crypto";
import type { DatiUtente } from "./chiavi.js";
import type { Database, Sql } from "./database.js";

/** Ciò che una migrazione può sapere oltre al database. */
export interface ContestoSchema {
  /** L'utente fisso di DEC-121, dalle variabili d'ambiente, se c'è. */
  utenteFisso?: DatiUtente | null;
}

type Migrazione = string | ((sql: Sql, contesto: ContestoSchema) => Promise<void>);

const MIGRAZIONI: Migrazione[] = [
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

  // 2 – Account e dispositivi nel database (DEC-132, DEC-133). L'utente fisso, se c'è, diventa
  // il primo account con gli stessi dati (stessa chiave dati: le note non si ricifrano) e
  // riceve tutte le versioni che ci sono già. Senza utente fisso e con versioni, ci si ferma.
  async (sql, { utenteFisso }) => {
    await sql.esegui(
      `CREATE TABLE utenti (
         id uuid PRIMARY KEY,
         email text NOT NULL UNIQUE,
         sale text NOT NULL,
         argon2 text NOT NULL,
         impronta_accesso text NOT NULL,
         impronta_recupero text NOT NULL,
         chiave_password text NOT NULL,
         chiave_recupero text NOT NULL,
         creato_il timestamptz NOT NULL
       );
       CREATE TABLE dispositivi (
         id uuid PRIMARY KEY,
         utente uuid NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
         impronta_gettone text NOT NULL UNIQUE,
         tipo text NOT NULL CHECK (tipo IN ('windows', 'macos')),
         nome text,
         collegato_il timestamptz NOT NULL,
         ultima_sincronizzazione timestamptz
       );
       CREATE INDEX dispositivi_utente ON dispositivi (utente);
       ALTER TABLE versioni ADD COLUMN utente uuid REFERENCES utenti (id) ON DELETE CASCADE;`,
    );
    const [{ n }] = (await sql.righe<{ n: number }>(
      "SELECT count(*)::integer AS n FROM versioni",
    )) as [{ n: number }];
    if (utenteFisso) {
      const id = randomUUID();
      const a = utenteFisso.argon2;
      await sql.righe(
        `INSERT INTO utenti (id, email, sale, argon2, impronta_accesso, impronta_recupero,
           chiave_password, chiave_recupero, creato_il)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())`,
        [
          id,
          utenteFisso.email.trim().toLowerCase(),
          utenteFisso.sale,
          `${a.memoria},${a.passaggi},${a.fili}`,
          utenteFisso.improntaAccesso,
          utenteFisso.improntaRecupero,
          utenteFisso.chiavePassword,
          utenteFisso.chiaveRecupero,
        ],
      );
      await sql.righe("UPDATE versioni SET utente = $1", [id]);
    } else if (n > 0) {
      throw new Error(
        "Schema 2: ci sono note ma non l'utente fisso (variabili MEMODU_*) a cui assegnarle",
      );
    }
    await sql.esegui(
      `ALTER TABLE versioni ALTER COLUMN utente SET NOT NULL;
       ALTER TABLE versioni DROP CONSTRAINT versioni_pkey;
       ALTER TABLE versioni ADD PRIMARY KEY (utente, id, versione);
       CREATE INDEX versioni_utente_ordine ON versioni (utente, ordine);`,
    );
  },

  // 3 – Allegati di Brainet (RF-18, DEC-135): l'elenco per account; i file stanno nel deposito.
  // `anteprima` è la grandezza dell'anteprima di una foto, 0 se non c'è.
  `CREATE TABLE allegati (
     utente uuid NOT NULL REFERENCES utenti (id) ON DELETE CASCADE,
     id uuid NOT NULL,
     grandezza bigint NOT NULL,
     anteprima bigint NOT NULL,
     presente boolean NOT NULL,
     creato_il timestamptz NOT NULL,
     PRIMARY KEY (utente, id)
   );`,

  // 4 – L'app per iPhone (DEC-156): i dispositivi possono essere anche di tipo «ios».
  `ALTER TABLE dispositivi DROP CONSTRAINT dispositivi_tipo_check;
   ALTER TABLE dispositivi ADD CONSTRAINT dispositivi_tipo_check
     CHECK (tipo IN ('windows', 'macos', 'ios'));`,
];

export const VERSIONE_SCHEMA = MIGRAZIONI.length;

/** Blocco consultivo che tiene una migrazione alla volta tra le istanze. */
const BLOCCO_SCHEMA = 4318;

export async function aggiornaSchema(db: Database, contesto: ContestoSchema = {}): Promise<void> {
  await db.transazione(async (sql) => {
    await sql.righe("SELECT pg_advisory_xact_lock($1)", [BLOCCO_SCHEMA]);
    await sql.esegui("CREATE TABLE IF NOT EXISTS schema (versione integer NOT NULL)");
    const [riga] = await sql.righe<{ versione: number }>("SELECT versione FROM schema");
    if (!riga) await sql.righe("INSERT INTO schema (versione) VALUES (0)");
    for (let versione = riga?.versione ?? 0; versione < MIGRAZIONI.length; versione++) {
      const migrazione = MIGRAZIONI[versione]!;
      if (typeof migrazione === "string") await sql.esegui(migrazione);
      else await migrazione(sql, contesto);
      await sql.righe("UPDATE schema SET versione = $1", [versione + 1]);
    }
  });
}
