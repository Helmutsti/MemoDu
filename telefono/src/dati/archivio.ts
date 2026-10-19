// Copia di lavoro sul telefono (DEC-156): note e cartelle in SQLite, così l'app funziona anche
// senza rete. Per ora solo sul telefono; la sincronizzazione cifrata con il server arriva dopo,
// con le stesse regole del nucleo del computer (client/src-tauri/src/archivio.rs).

import type { SQLiteDatabase } from "expo-sqlite";

export interface Nota {
  id: string;
  titolo: string;
  contenuto: string;
  cartella: string | null;
  modificata: string;
}

export interface Cartella {
  id: string;
  nome: string;
  padre: string | null;
}

const VERSIONE = 1;

export async function prepara(db: SQLiteDatabase): Promise<void> {
  const riga = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const versione = riga?.user_version ?? 0;
  if (versione >= VERSIONE) return;
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS cartelle (
      id TEXT PRIMARY KEY NOT NULL,
      nome TEXT NOT NULL,
      padre TEXT
    );
    CREATE TABLE IF NOT EXISTS note (
      id TEXT PRIMARY KEY NOT NULL,
      titolo TEXT NOT NULL DEFAULT '',
      contenuto TEXT NOT NULL DEFAULT '',
      cartella TEXT,
      modificata TEXT NOT NULL,
      eliminata INTEGER NOT NULL DEFAULT 0
    );
    PRAGMA user_version = ${VERSIONE};
  `);
  // Finché manca la sincronizzazione, alla prima installazione alcune note di esempio.
  await esempio(db);
}

/** Qualche nota per vedere la lista prima della sincronizzazione; sparirà con l'accesso. */
async function esempio(db: SQLiteDatabase): Promise<void> {
  const ora = Date.now();
  const quando = (giorni: number) => new Date(ora - giorni * 86400000).toISOString();
  const cartelle: Cartella[] = [
    { id: "c1", nome: "Lavoro", padre: null },
    { id: "c2", nome: "Clienti", padre: "c1" },
    { id: "c3", nome: "Personale", padre: null },
  ];
  const note: Nota[] = [
    {
      id: "n1",
      titolo: "Riunione di lunedì",
      contenuto: "Ordine del giorno: date del rilascio, test con tre persone.",
      cartella: null,
      modificata: quando(1),
    },
    {
      id: "n2",
      titolo: "Lista della spesa",
      contenuto: "- [x] Pane\n- [ ] Latte\n- [ ] Caffè",
      cartella: null,
      modificata: quando(0),
    },
    {
      id: "n3",
      titolo: "Idee per il sito",
      contenuto: "## Pagina iniziale\nUna frase sola e una foto dell'app.",
      cartella: null,
      modificata: quando(4),
    },
    {
      id: "n4",
      titolo: "Budget 2026",
      contenuto: "Spese previste per il prossimo anno, divise per reparto.",
      cartella: "c1",
      modificata: quando(0),
    },
    {
      id: "n5",
      titolo: "Riunione con i fornitori",
      contenuto: "Chiedere i tempi di consegna.",
      cartella: "c1",
      modificata: quando(7),
    },
    {
      id: "n6",
      titolo: "Contratti in scadenza",
      contenuto: "Tre contratti da rinnovare.",
      cartella: "c2",
      modificata: quando(8),
    },
    {
      id: "n7",
      titolo: "Vacanze",
      contenuto: "- Prenotare il traghetto",
      cartella: "c3",
      modificata: quando(10),
    },
  ];
  for (const c of cartelle) {
    await db.runAsync(
      "INSERT OR IGNORE INTO cartelle (id, nome, padre) VALUES (?, ?, ?)",
      c.id,
      c.nome,
      c.padre,
    );
  }
  for (const n of note) {
    await db.runAsync(
      "INSERT OR IGNORE INTO note (id, titolo, contenuto, cartella, modificata) VALUES (?, ?, ?, ?, ?)",
      n.id,
      n.titolo,
      n.contenuto,
      n.cartella,
      n.modificata,
    );
  }
}

export async function leggiTutto(
  db: SQLiteDatabase,
): Promise<{ note: Nota[]; cartelle: Cartella[] }> {
  const note = await db.getAllAsync<Nota>(
    "SELECT id, titolo, contenuto, cartella, modificata FROM note WHERE eliminata = 0",
  );
  const cartelle = await db.getAllAsync<Cartella>("SELECT id, nome, padre FROM cartelle");
  return { note, cartelle };
}

export async function leggiNota(db: SQLiteDatabase, id: string): Promise<Nota | null> {
  return db.getFirstAsync<Nota>(
    "SELECT id, titolo, contenuto, cartella, modificata FROM note WHERE id = ? AND eliminata = 0",
    id,
  );
}

export async function nomeCartella(db: SQLiteDatabase, id: string | null): Promise<string> {
  if (!id) return "Cloud";
  const c = await db.getFirstAsync<{ nome: string }>("SELECT nome FROM cartelle WHERE id = ?", id);
  return c?.nome ?? "Cloud";
}

export async function creaNota(db: SQLiteDatabase, cartella: string | null): Promise<string> {
  const id = `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  await db.runAsync(
    "INSERT INTO note (id, titolo, contenuto, cartella, modificata) VALUES (?, '', '', ?, ?)",
    id,
    cartella,
    new Date().toISOString(),
  );
  return id;
}

export async function salvaNota(
  db: SQLiteDatabase,
  id: string,
  titolo: string,
  contenuto: string,
): Promise<void> {
  await db.runAsync(
    "UPDATE note SET titolo = ?, contenuto = ?, modificata = ? WHERE id = ?",
    titolo,
    contenuto,
    new Date().toISOString(),
    id,
  );
}

/** Nel Cestino, senza conferma: dal Cestino si recupera (ID-55). */
export async function cestinaNota(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync("UPDATE note SET eliminata = 1 WHERE id = ?", id);
}

/** Una nota senza titolo né testo sparisce quando la lasci, come sul computer (RB-10). */
export async function eliminaSeVuota(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync(
    "DELETE FROM note WHERE id = ? AND trim(titolo) = '' AND trim(contenuto) = ''",
    id,
  );
}

export async function quantiNelCestino(db: SQLiteDatabase): Promise<number> {
  const r = await db.getFirstAsync<{ n: number }>(
    "SELECT count(*) AS n FROM note WHERE eliminata = 1",
  );
  return r?.n ?? 0;
}
