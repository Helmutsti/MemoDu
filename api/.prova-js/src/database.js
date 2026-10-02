import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
function daPostgres(indirizzo) {
  const pool = new pg.Pool({
    connectionString: indirizzo,
    max: 3,
    connectionTimeoutMillis: 1e4
  });
  const su = (c) => ({
    righe: async (testo, valori) => (await c.query(testo, valori)).rows,
    esegui: async (testo) => {
      await c.query(testo);
    }
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
        await connessione.query("ROLLBACK").catch(() => void 0);
        throw errore;
      } finally {
        connessione.release();
      }
    },
    chiudi: () => pool.end()
  };
}
async function daPglite(cartella) {
  const db = new PGlite(cartella);
  await db.waitReady;
  const su = (c) => ({
    righe: async (testo, valori) => (await c.query(testo, valori)).rows,
    esegui: async (testo) => {
      await c.exec(testo);
    }
  });
  return {
    ...su(db),
    transazione: (lavoro) => db.transaction((tx) => lavoro(su(tx))),
    chiudi: () => db.close()
  };
}
export {
  daPglite,
  daPostgres
};
