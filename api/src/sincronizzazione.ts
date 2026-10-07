// Deposito della sincronizzazione (RF-10, DEC-75 … DEC-83). Il server non legge i blocchi:
// conserva per ogni elemento la versione attuale e le precedenti in PostgreSQL (DEC-105), con
// numero d'ordine, ora e dimensione. Le versioni precedenti si sfoltiscono a scalare per 7
// giorni (DEC-77, DEC-113). Chi può leggere e scrivere lo decide l'accesso (DEC-121).

import { LIMITE_PAGINA_BYTE } from "./costanti.js";
import type { Database, Sql } from "./database.js";

/** Versione del protocollo di sincronizzazione (DEC-83). */
export const PROTOCOLLO = 1;

const ORA_MS = 60 * 60 * 1000;
const GIORNO_MS = 24 * ORA_MS;
/** Fin dove arrivano le versioni precedenti (DEC-113). */
const GIORNI_STORIA = 7;
/** Blocco consultivo delle scritture: una alla volta, così i numeri d'ordine si vedono in
 * ordine anche con più istanze del server (DEC-105). */
const BLOCCO_SCRITTURE = 4317;

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

/**
 * Il blocco dichiara il formato «chiaro» (DEC-78)? Il server non legge i blocchi, ma il formato
 * della busta è visibile: serve a cancellare le versioni in chiaro (DEC-121).
 */
export function inChiaro(dati: string): boolean {
  try {
    return (JSON.parse(dati) as { formato?: unknown }).formato === "chiaro";
  } catch {
    return false;
  }
}

export class ArchivioSincronizzazione {
  constructor(
    private readonly db: Database,
    private readonly adesso: () => Date = () => new Date(),
  ) {}

  /** L'archivio risponde: per il controllo di salute. */
  async pronto(): Promise<boolean> {
    const [riga] = await this.db.righe<{ uno: number }>("SELECT 1 AS uno");
    return riga?.uno === 1;
  }

  /**
   * Le versioni attuali degli elementi cambiati dopo il numero d'ordine `dopo`, in ordine. Una
   * pagina si ferma a `limite` elementi o prima di superare `limiteByte` (DEC-106); almeno un
   * elemento c'è sempre, se ne esiste uno.
   */
  async modificheDopo(
    dopo: number,
    limite = 500,
    limiteByte = LIMITE_PAGINA_BYTE,
  ): Promise<{ modifiche: Modifica[]; ultimo: number; altre: boolean; archivio: string }> {
    const righe = await this.db.righe<Omit<Modifica, "dati"> & { dimensione: number }>(
      `SELECT v.id, v.versione, v.ordine, v.ora, v.dimensione FROM versioni v
       WHERE v.ordine > $1
         AND v.versione = (SELECT max(w.versione) FROM versioni w WHERE w.id = v.id)
       ORDER BY v.ordine LIMIT $2`,
      [dopo, limite + 1],
    );
    const scelte: typeof righe = [];
    let somma = 0;
    for (const riga of righe) {
      if (scelte.length === limite) break;
      if (scelte.length > 0 && somma + riga.dimensione > limiteByte) break;
      scelte.push(riga);
      somma += riga.dimensione;
    }
    const dati = new Map(
      (
        await this.db.righe<{ ordine: number; dati: string }>(
          "SELECT ordine, dati FROM versioni WHERE ordine = ANY($1::integer[])",
          [scelte.map((r) => r.ordine)],
        )
      ).map((r) => [r.ordine, r.dati]),
    );
    const modifiche = scelte.map(({ id, versione, ordine, ora }) => ({
      id,
      versione,
      ordine,
      ora,
      dati: dati.get(ordine) ?? "",
    }));
    const ultimo =
      modifiche.length > 0 ? modifiche[modifiche.length - 1]!.ordine : await this.ultimoOrdine();
    return {
      modifiche,
      ultimo: Math.max(ultimo, dopo),
      altre: scelte.length < righe.length,
      archivio: await this.archivio(),
    };
  }

  /**
   * Scrive una versione nuova dell'elemento partendo dalla versione `base` (0 per un elemento
   * nuovo). Se nel frattempo è cambiato altrove, lancia VersioneSuperata con la versione
   * attuale (DEC-76). Versione, numero d'ordine e sfoltimento stanno in una transazione.
   */
  async scrivi(
    id: string,
    base: number,
    dati: string,
  ): Promise<{ versione: number; ordine: number }> {
    return this.db.transazione(async (sql) => {
      await sql.righe("SELECT pg_advisory_xact_lock($1)", [BLOCCO_SCRITTURE]);
      const [attuale] = await sql.righe<Modifica>(
        `SELECT id, versione, ordine, ora, dati FROM versioni WHERE id = $1
         ORDER BY versione DESC LIMIT 1`,
        [id],
      );
      if ((attuale?.versione ?? 0) !== base) {
        throw new VersioneSuperata(attuale ?? { id, versione: 0, ordine: 0, ora: "", dati: "" });
      }
      const versione = base + 1;
      const [prossimo] = await sql.righe<{ ordine: number }>(
        "SELECT coalesce(max(ordine), 0) + 1 AS ordine FROM versioni",
      );
      const ordine = prossimo!.ordine;
      await sql.righe(
        `INSERT INTO versioni (id, versione, ordine, ora, dimensione, dati)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, versione, ordine, this.adesso().toISOString(), JSON.stringify(dati).length, dati],
      );
      // La prima versione cifrata di un elemento: le precedenti in chiaro si cancellano, così sul
      // server non resta niente di leggibile (DEC-78, condizione 3; CA-10.13).
      if (!inChiaro(dati)) {
        const vecchie = await sql.righe<{ versione: number; dati: string }>(
          "SELECT versione, dati FROM versioni WHERE id = $1 AND versione < $2",
          [id, versione],
        );
        const daTogliere = vecchie.filter((v) => inChiaro(v.dati)).map((v) => v.versione);
        if (daTogliere.length > 0) {
          await sql.righe("DELETE FROM versioni WHERE id = $1 AND versione = ANY($2::integer[])", [
            id,
            daTogliere,
          ]);
        }
      }
      await this.sfoltisci(sql, id);
      return { versione, ordine };
    });
  }

  /** Le versioni conservate di un elemento, dalla più recente. */
  versioni(id: string, sql: Sql = this.db): Promise<{ versione: number; ora: string }[]> {
    return sql.righe("SELECT versione, ora FROM versioni WHERE id = $1 ORDER BY versione DESC", [
      id,
    ]);
  }

  /**
   * Versioni precedenti a scalare (DEC-77, DEC-113): tutte nell'ultima ora, l'ultima di ogni
   * ora nell'ultimo giorno, l'ultima di ogni giorno fino a 7 giorni; la versione attuale resta
   * sempre. Guarda solo versione e ora.
   */
  private async sfoltisci(sql: Sql, id: string): Promise<void> {
    const ora = this.adesso().getTime();
    const [attuale, ...precedenti] = await this.versioni(id, sql);
    if (!attuale) return;
    const tenute = new Set<string>();
    const via: number[] = [];
    for (const v of precedenti) {
      const eta = ora - Date.parse(v.ora);
      let gruppo: string | null;
      if (eta <= ORA_MS) gruppo = `v${v.versione}`;
      else if (eta <= GIORNO_MS) gruppo = `h${Math.floor(Date.parse(v.ora) / ORA_MS)}`;
      else if (eta <= GIORNI_STORIA * GIORNO_MS)
        gruppo = `g${Math.floor(Date.parse(v.ora) / GIORNO_MS)}`;
      else gruppo = null;
      // Le versioni vanno dalla più recente: la prima di ogni gruppo è l'ultima di quell'ora
      // o di quel giorno, e resta.
      if (gruppo === null || tenute.has(gruppo)) via.push(v.versione);
      else tenute.add(gruppo);
    }
    if (via.length > 0) {
      await sql.righe("DELETE FROM versioni WHERE id = $1 AND versione = ANY($2::integer[])", [
        id,
        via,
      ]);
    }
  }

  private async ultimoOrdine(): Promise<number> {
    // L'ultima scrittura è sempre una versione attuale, che lo sfoltimento non tocca.
    const [riga] = await this.db.righe<{ n: number }>(
      "SELECT coalesce(max(ordine), 0) AS n FROM versioni",
    );
    return riga?.n ?? 0;
  }

  private async archivio(): Promise<string> {
    const [riga] = await this.db.righe<{ valore: string }>(
      "SELECT valore FROM stato WHERE chiave = 'archivio'",
    );
    return riga?.valore ?? "";
  }
}
