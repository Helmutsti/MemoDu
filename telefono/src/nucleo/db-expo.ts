// Il database del nucleo sopra expo-sqlite. Le transazioni passano una alla volta: una
// sincronizzazione e un salvataggio non si mescolano. Nel nucleo le transazioni non si annidano.

import { openDatabaseAsync, type SQLiteBindValue } from "expo-sqlite";
import type { Db, Valore } from "./db";

export async function apriDb(nome: string): Promise<Db> {
  const d = await openDatabaseAsync(nome);
  let coda: Promise<unknown> = Promise.resolve();
  const inFila = <T>(f: () => Promise<T>): Promise<T> => {
    const r = coda.then(f, f);
    coda = r.catch(() => undefined);
    return r;
  };
  const p = (v: Valore[]) => v as SQLiteBindValue[];
  return {
    tutte: <T>(sql: string, ...v: Valore[]) => d.getAllAsync<T>(sql, p(v)),
    prima: <T>(sql: string, ...v: Valore[]) => d.getFirstAsync<T>(sql, p(v)),
    esegui: async (sql: string, ...v: Valore[]) => void (await d.runAsync(sql, p(v))),
    script: (sql: string) => d.execAsync(sql),
    transazione: <T>(f: () => Promise<T>) =>
      inFila(async () => {
        let r!: T;
        await d.withTransactionAsync(async () => {
          r = await f();
        });
        return r;
      }),
  };
}
