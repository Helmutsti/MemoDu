// Accesso a PostgreSQL (DEC-105): Neon in rete, PGlite (Postgres dentro il processo) in locale
// e nelle prove. Il resto del server vede solo queste tre operazioni, uguali per tutti e due.

import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

export interface Sql {
  /** Una richiesta con i suoi valori ($1, $2, …); restituisce le righe. */
  righe<T>(testo: string, valori?: unknown[]): Promise<T[]>;
  /** Più istruzioni insieme, senza valori: per lo schema. */
  esegui(testo: string): Promise<void>;
}

export interface Database extends Sql {
  /** Tutto il lavoro in una transazione: se qualcosa fallisce, non resta niente. */
  transazione<T>(lavoro: (sql: Sql) => Promise<T>): Promise<T>;
  chiudi(): Promise<void>;
}

/** Neon (o un altro PostgreSQL) dall'indirizzo di connessione. */
export function daPostgres(indirizzo: string): Database {
  // Poche connessioni: una funzione di Vercel serve poche richieste alla volta.
  // Con un indirizzo sbagliato o il database spento si sbaglia in fretta, non dopo un minuto.
  const pool = new pg.Pool({
    connectionString: indirizzo,
    max: 3,
    connectionTimeoutMillis: 10_000,
    // Una richiesta che resta appesa si ferma: meglio un errore che una funzione che non risponde.
    statement_timeout: 10_000,
    query_timeout: 15_000,
  });
  const su = (c: pg.Pool | pg.PoolClient): Sql => ({
    righe: async <T>(testo: string, valori?: unknown[]) =>
      (await c.query(testo, valori)).rows as T[],
    esegui: async (testo) => {
      await c.query(testo);
    },
  });
  return {
    ...su(pool),
    transazione: async (lavoro) => {
      const connessione = await pool.connect();
      try {
        await connessione.query("BEGIN");
        const esito = await lavoro(su(connessione));
        await connessione.query("COMMIT");
        return esito;
      } catch (errore) {
        await connessione.query("ROLLBACK").catch(() => undefined);
        throw errore;
      } finally {
        connessione.release();
      }
    },
    chiudi: () => pool.end(),
  };
}

/** PGlite in una cartella, o in memoria senza cartella (prove). */
export async function daPglite(cartella?: string): Promise<Database> {
  const db = new PGlite(cartella);
  await db.waitReady;
  const su = (c: Pick<PGlite, "query" | "exec">): Sql => ({
    righe: async <T>(testo: string, valori?: unknown[]) => (await c.query<T>(testo, valori)).rows,
    esegui: async (testo) => {
      await c.exec(testo);
    },
  });
  return {
    ...su(db),
    transazione: (lavoro) => db.transaction((tx) => lavoro(su(tx))),
    chiudi: () => db.close(),
  };
}
