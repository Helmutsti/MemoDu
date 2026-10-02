import { createHash, timingSafeEqual } from "node:crypto";
import { LIMITE_PAGINA_BYTE } from "./costanti.js";
const PROTOCOLLO = 1;
const ORA_MS = 60 * 60 * 1e3;
const GIORNO_MS = 24 * ORA_MS;
const BLOCCO_SCRITTURE = 4317;
class VersioneSuperata extends Error {
  constructor(attuale) {
    super(`L'elemento ${attuale.id} \xE8 gi\xE0 alla versione ${attuale.versione}`);
    this.attuale = attuale;
  }
  attuale;
}
const impronta = (gettone) => createHash("sha256").update(gettone).digest("hex");
class ArchivioSincronizzazione {
  /**
   * @param impronta l'impronta SHA-256 del gettone dell'installazione, in esadecimale.
   */
  constructor(db, impronta2, adesso = () => /* @__PURE__ */ new Date()) {
    this.db = db;
    this.impronta = impronta2;
    this.adesso = adesso;
  }
  db;
  impronta;
  adesso;
  /** Il gettone è quello dell'installazione? Il confronto non rivela dove differisce. */
  autorizzato(gettone) {
    if (!gettone || !/^[0-9a-f]{64}$/.test(this.impronta)) return false;
    const a = Buffer.from(impronta(gettone), "hex");
    const b = Buffer.from(this.impronta, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  }
  /** L'archivio risponde: per il controllo di salute. */
  async pronto() {
    const [riga] = await this.db.righe("SELECT 1 AS uno");
    return riga?.uno === 1;
  }
  /**
   * Le versioni attuali degli elementi cambiati dopo il numero d'ordine `dopo`, in ordine. Una
   * pagina si ferma a `limite` elementi o prima di superare `limiteByte` (DEC-106); almeno un
   * elemento c'è sempre, se ne esiste uno.
   */
  async modificheDopo(dopo, limite = 500, limiteByte = LIMITE_PAGINA_BYTE) {
    const righe = await this.db.righe(
      `SELECT v.id, v.versione, v.ordine, v.ora, v.dimensione FROM versioni v
       WHERE v.ordine > $1
         AND v.versione = (SELECT max(w.versione) FROM versioni w WHERE w.id = v.id)
       ORDER BY v.ordine LIMIT $2`,
      [dopo, limite + 1]
    );
    const scelte = [];
    let somma = 0;
    for (const riga of righe) {
      if (scelte.length === limite) break;
      if (scelte.length > 0 && somma + riga.dimensione > limiteByte) break;
      scelte.push(riga);
      somma += riga.dimensione;
    }
    const dati = new Map(
      (await this.db.righe(
        "SELECT ordine, dati FROM versioni WHERE ordine = ANY($1::integer[])",
        [scelte.map((r) => r.ordine)]
      )).map((r) => [r.ordine, r.dati])
    );
    const modifiche = scelte.map(({ id, versione, ordine, ora }) => ({
      id,
      versione,
      ordine,
      ora,
      dati: dati.get(ordine) ?? ""
    }));
    const ultimo = modifiche.length > 0 ? modifiche[modifiche.length - 1].ordine : await this.ultimoOrdine();
    return {
      modifiche,
      ultimo: Math.max(ultimo, dopo),
      altre: scelte.length < righe.length,
      archivio: await this.archivio()
    };
  }
  /**
   * Scrive una versione nuova dell'elemento partendo dalla versione `base` (0 per un elemento
   * nuovo). Se nel frattempo è cambiato altrove, lancia VersioneSuperata con la versione
   * attuale (DEC-76). Versione, numero d'ordine e sfoltimento stanno in una transazione.
   */
  async scrivi(id, base, dati) {
    return this.db.transazione(async (sql) => {
      await sql.righe("SELECT pg_advisory_xact_lock($1)", [BLOCCO_SCRITTURE]);
      const [attuale] = await sql.righe(
        `SELECT id, versione, ordine, ora, dati FROM versioni WHERE id = $1
         ORDER BY versione DESC LIMIT 1`,
        [id]
      );
      if ((attuale?.versione ?? 0) !== base) {
        throw new VersioneSuperata(attuale ?? { id, versione: 0, ordine: 0, ora: "", dati: "" });
      }
      const versione = base + 1;
      const [prossimo] = await sql.righe(
        "SELECT coalesce(max(ordine), 0) + 1 AS ordine FROM versioni"
      );
      const ordine = prossimo.ordine;
      await sql.righe(
        `INSERT INTO versioni (id, versione, ordine, ora, dimensione, dati)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, versione, ordine, this.adesso().toISOString(), JSON.stringify(dati).length, dati]
      );
      await this.sfoltisci(sql, id);
      return { versione, ordine };
    });
  }
  /** Le versioni conservate di un elemento, dalla più recente. */
  versioni(id, sql = this.db) {
    return sql.righe("SELECT versione, ora FROM versioni WHERE id = $1 ORDER BY versione DESC", [
      id
    ]);
  }
  /**
   * Versioni precedenti a scalare (DEC-77): tutte nell'ultima ora, l'ultima di ogni ora
   * nell'ultimo giorno, l'ultima di ogni giorno fino a 30 giorni; la versione attuale resta
   * sempre. Guarda solo versione e ora.
   */
  async sfoltisci(sql, id) {
    const ora = this.adesso().getTime();
    const [attuale, ...precedenti] = await this.versioni(id, sql);
    if (!attuale) return;
    const tenute = /* @__PURE__ */ new Set();
    const via = [];
    for (const v of precedenti) {
      const eta = ora - Date.parse(v.ora);
      let gruppo;
      if (eta <= ORA_MS) gruppo = `v${v.versione}`;
      else if (eta <= GIORNO_MS) gruppo = `h${Math.floor(Date.parse(v.ora) / ORA_MS)}`;
      else if (eta <= 30 * GIORNO_MS) gruppo = `g${Math.floor(Date.parse(v.ora) / GIORNO_MS)}`;
      else gruppo = null;
      if (gruppo === null || tenute.has(gruppo)) via.push(v.versione);
      else tenute.add(gruppo);
    }
    if (via.length > 0) {
      await sql.righe("DELETE FROM versioni WHERE id = $1 AND versione = ANY($2::integer[])", [
        id,
        via
      ]);
    }
  }
  async ultimoOrdine() {
    const [riga] = await this.db.righe(
      "SELECT coalesce(max(ordine), 0) AS n FROM versioni"
    );
    return riga?.n ?? 0;
  }
  async archivio() {
    const [riga] = await this.db.righe(
      "SELECT valore FROM stato WHERE chiave = 'archivio'"
    );
    return riga?.valore ?? "";
  }
}
export {
  ArchivioSincronizzazione,
  PROTOCOLLO,
  VersioneSuperata,
  impronta
};
