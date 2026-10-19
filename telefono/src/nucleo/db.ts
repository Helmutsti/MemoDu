// Il database della copia di lavoro, visto dal nucleo: nell'app è expo-sqlite (db-expo.ts),
// nelle prove il SQLite di Node. Così le regole si provano sul computer.

export type Valore = string | number | null;

export interface Db {
  tutte<T>(sql: string, ...parametri: Valore[]): Promise<T[]>;
  prima<T>(sql: string, ...parametri: Valore[]): Promise<T | null>;
  esegui(sql: string, ...parametri: Valore[]): Promise<void>;
  /** Più istruzioni senza parametri (schema). */
  script(sql: string): Promise<void>;
  /** Tutto o niente. */
  transazione<T>(f: () => Promise<T>): Promise<T>;
}
