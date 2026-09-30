// Deposito della sincronizzazione (RF-10, DEC-75 … DEC-83). Il server non legge i blocchi:
// conserva per ogni elemento la versione attuale e le precedenti come file (DEC-25), con un
// indice SQLite di identificativo, versione, numero d'ordine, ora e dimensione. Le versioni
// precedenti si sfoltiscono a scalare per 30 giorni (DEC-77). Le credenziali dell'installazione
// nascono qui al primo avvio; il server tiene solo l'impronta del gettone (DEC-79).

import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

/** Versione del protocollo di sincronizzazione (DEC-83). */
export const PROTOCOLLO = 1;
/** File delle credenziali nella cartella dei dati, lo stesso che legge l'app (DEC-79). */
export const FILE_CREDENZIALI = "credenziali";

const ORA_MS = 60 * 60 * 1000;
const GIORNO_MS = 24 * ORA_MS;

export interface Credenziali {
  indirizzo: string;
  installazione: string;
  gettone: string;
  chiave: string;
}

export interface Modifica {
  id: string;
  versione: number;
  ordine: number;
  ora: string;
  dati: string;
}

/** La versione di partenza non è più quella attuale: il client deve prima unire. */
export class VersioneSuperata extends Error {
  constructor(readonly attuale: Modifica) {
    super(`L'elemento ${attuale.id} è già alla versione ${attuale.versione}`);
  }
}

const impronta = (gettone: string) => createHash("sha256").update(gettone).digest("hex");

export class ArchivioSincronizzazione {
  private readonly db: Database.Database;
  private readonly blocchi: string;

  constructor(
    private readonly cartella: string,
    private readonly adesso: () => Date = () => new Date(),
  ) {
    const base = join(cartella, "sincronizzazione");
    this.blocchi = join(base, "blocchi");
    mkdirSync(this.blocchi, { recursive: true });
    this.db = new Database(join(base, "indice.db"));
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS versioni (
        id TEXT NOT NULL,
        versione INTEGER NOT NULL,
        ordine INTEGER NOT NULL UNIQUE,
        ora TEXT NOT NULL,
        dimensione INTEGER NOT NULL,
        PRIMARY KEY (id, versione)
      );
      CREATE TABLE IF NOT EXISTS stato (chiave TEXT PRIMARY KEY, valore TEXT NOT NULL);
    `);
  }

  chiudi(): void {
    this.db.close();
  }

  /**
   * Credenziali dell'installazione: al primo avvio si generano identificativo, gettone e chiave
   * (DEC-79), si conserva solo l'impronta del gettone e si scrivono nel file `credenziali` della
   * cartella dei dati, che sulla stessa macchina è quello dell'app. Restituisce le credenziali
   * nuove, da mostrare una volta; null se esistevano già.
   */
  preparaCredenziali(indirizzo: string): Credenziali | null {
    if (this.valore("impronta")) return null;
    const credenziali: Credenziali = {
      indirizzo,
      installazione: randomUUID(),
      gettone: randomBytes(32).toString("base64url"),
      chiave: randomBytes(32).toString("base64url"),
    };
    this.imposta("installazione", credenziali.installazione);
    this.imposta("impronta", impronta(credenziali.gettone));
    const file = join(this.cartella, FILE_CREDENZIALI);
    if (!existsSync(file)) writeFileSync(file, JSON.stringify(credenziali) + "\n", { mode: 0o600 });
    return credenziali;
  }

  /** Il gettone è quello dell'installazione? Il confronto non rivela dove differisce. */
  autorizzato(gettone: string | undefined): boolean {
    const attesa = this.valore("impronta");
    if (!gettone || !attesa) return false;
    const a = Buffer.from(impronta(gettone), "hex");
    const b = Buffer.from(attesa, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  }

  /** Le versioni attuali degli elementi cambiati dopo il numero d'ordine `dopo`, in ordine. */
  modificheDopo(
    dopo: number,
    limite = 500,
  ): { modifiche: Modifica[]; ultimo: number; altre: boolean } {
    const righe = this.db
      .prepare(
        `SELECT v.id, v.versione, v.ordine, v.ora FROM versioni v
         WHERE v.ordine > ? AND v.versione = (SELECT max(versione) FROM versioni WHERE id = v.id)
         ORDER BY v.ordine LIMIT ?`,
      )
      .all(dopo, limite + 1) as Omit<Modifica, "dati">[];
    const altre = righe.length > limite;
    const modifiche = righe
      .slice(0, limite)
      .map((r) => ({ ...r, dati: this.leggiBlocco(r.id, r.versione) }));
    const ultimo =
      modifiche.length > 0 ? modifiche[modifiche.length - 1].ordine : this.ultimoOrdine();
    return { modifiche, ultimo: Math.max(ultimo, dopo), altre };
  }

  /**
   * Scrive una versione nuova dell'elemento partendo dalla versione `base` (0 per un elemento
   * nuovo). Se nel frattempo è cambiato altrove, lancia VersioneSuperata con la versione
   * attuale (DEC-76).
   */
  scrivi(id: string, base: number, dati: string): { versione: number; ordine: number } {
    return this.db.transaction(() => {
      const attuale = this.attuale(id);
      if ((attuale?.versione ?? 0) !== base) {
        throw new VersioneSuperata(attuale ?? { id, versione: 0, ordine: 0, ora: "", dati: "" });
      }
      const versione = base + 1;
      const ordine = this.ultimoOrdine() + 1;
      const ora = this.adesso().toISOString();
      mkdirSync(join(this.blocchi, id), { recursive: true });
      writeFileSync(this.percorso(id, versione), dati);
      this.db
        .prepare(
          "INSERT INTO versioni (id, versione, ordine, ora, dimensione) VALUES (?, ?, ?, ?, ?)",
        )
        .run(id, versione, ordine, ora, Buffer.byteLength(dati));
      this.sfoltisci(id);
      return { versione, ordine };
    })();
  }

  /** Le versioni conservate di un elemento, dalla più recente. */
  versioni(id: string): { versione: number; ora: string }[] {
    return this.db
      .prepare("SELECT versione, ora FROM versioni WHERE id = ? ORDER BY versione DESC")
      .all(id) as { versione: number; ora: string }[];
  }

  /**
   * Versioni precedenti a scalare (DEC-77): tutte nell'ultima ora, l'ultima di ogni ora
   * nell'ultimo giorno, l'ultima di ogni giorno fino a 30 giorni; la versione attuale resta
   * sempre. Guarda solo versione e ora.
   */
  private sfoltisci(id: string): void {
    const ora = this.adesso().getTime();
    const [attuale, ...precedenti] = this.versioni(id);
    if (!attuale) return;
    const tenute = new Set<string>();
    const via: number[] = [];
    for (const v of precedenti) {
      const eta = ora - Date.parse(v.ora);
      let gruppo: string | null;
      if (eta <= ORA_MS) gruppo = `v${v.versione}`;
      else if (eta <= GIORNO_MS) gruppo = `h${Math.floor(Date.parse(v.ora) / ORA_MS)}`;
      else if (eta <= 30 * GIORNO_MS) gruppo = `g${Math.floor(Date.parse(v.ora) / GIORNO_MS)}`;
      else gruppo = null;
      // Le versioni vanno dalla più recente: la prima di ogni gruppo è l'ultima di quell'ora
      // o di quel giorno, e resta.
      if (gruppo === null || tenute.has(gruppo)) via.push(v.versione);
      else tenute.add(gruppo);
    }
    const togli = this.db.prepare("DELETE FROM versioni WHERE id = ? AND versione = ?");
    for (const versione of via) {
      togli.run(id, versione);
      rmSync(this.percorso(id, versione), { force: true });
    }
  }

  private attuale(id: string): Modifica | undefined {
    const riga = this.db
      .prepare(
        "SELECT id, versione, ordine, ora FROM versioni WHERE id = ? ORDER BY versione DESC LIMIT 1",
      )
      .get(id) as Omit<Modifica, "dati"> | undefined;
    return riga && { ...riga, dati: this.leggiBlocco(riga.id, riga.versione) };
  }

  private ultimoOrdine(): number {
    const riga = this.db.prepare("SELECT max(ordine) AS n FROM versioni").get() as {
      n: number | null;
    };
    // L'ultima scrittura è sempre una versione attuale, che lo sfoltimento non tocca.
    return riga.n ?? 0;
  }

  private leggiBlocco(id: string, versione: number): string {
    return readFileSync(this.percorso(id, versione), "utf8");
  }

  private percorso(id: string, versione: number): string {
    return join(this.blocchi, id, String(versione));
  }

  private valore(chiave: string): string | undefined {
    const riga = this.db.prepare("SELECT valore FROM stato WHERE chiave = ?").get(chiave) as
      { valore: string } | undefined;
    return riga?.valore;
  }

  private imposta(chiave: string, valore: string): void {
    this.db
      .prepare("INSERT OR REPLACE INTO stato (chiave, valore) VALUES (?, ?)")
      .run(chiave, valore);
  }
}
