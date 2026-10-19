// Copia di lavoro del telefono (DEC-67, DEC-156). Ogni elemento (nota, cartella, tag,
// impostazioni e gli elementi di Brainet) si tiene come i campi del suo blocco di
// sincronizzazione, tutti, anche quelli che il telefono non usa ancora (vista, Brainet): così il
// telefono non perde né cambia niente di ciò che scrive il computer. Le regole della
// sincronizzazione sono quelle di client/src-tauri/src/archivio_sinc.rs: ricevendo, un elemento
// non modificato qui si prende com'è; uno modificato anche qui si fonde campo per campo con la
// base, il testo cambiato da tutte e due le parti fa nascere la copia in conflitto (DEC-06), il
// resto va alla modifica di qui (DEC-109); tra cestino e modifica vince l'azione di qui (RB-36);
// una nota in una cartella mandata nel cestino altrove va tra le non organizzate (RB-30).

import type { Db } from "./db";

export type Campi = Record<string, unknown>;

export interface Blocco {
  formato: "chiaro";
  tipo: string;
  modificato_il: string;
  eliminato: boolean;
  campi: Campi;
}

export interface Nota {
  id: string;
  titolo: string;
  contenuto: string;
  cartella: string | null;
  creata: string;
  modificata: string;
  eliminata_il: string | null;
  tag: string[];
}

export interface Cartella {
  id: string;
  nome: string;
  madre: string | null;
  eliminata_il: string | null;
}

export interface DaInviare {
  id: string;
  versione: number;
  dati: string;
  modificato_il: string;
}

export interface Ricevuta {
  id: string;
  versione: number;
  dati: string;
}

export interface Conflitto {
  originale: string;
  copia: string;
}

const TIPI = ["nota", "cartella", "tag", "impostazioni", "entita", "stato", "allegato"];
const CAMPI_TESTO = ["titolo", "contenuto"];
/** Campi che una versione vecchia non conosce: se mancano non sono un cambio (RB-92). */
const CAMPI_OPZIONALI = ["vista", "brainet", "mostra_database"];

const uguali = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
/** Come serde_json: chiavi ordinate, così lo stesso contenuto dà lo stesso testo. */
const ordinato = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(ordinato)
    : v && typeof v === "object"
      ? Object.fromEntries(
          Object.keys(v as object)
            .sort()
            .map((k) => [k, ordinato((v as Record<string, unknown>)[k])]),
        )
      : v;
export const testoBlocco = (b: Blocco) => JSON.stringify(ordinato(b));

export class Archivio {
  /** I conflitti nati dall'ultima volta, per l'interfaccia. */
  private conflitti: Conflitto[] = [];

  constructor(
    private db: Db,
    private adesso: () => string = () => new Date().toISOString(),
    private nuovoId: () => string = () => crypto.randomUUID(),
  ) {}

  static async apri(db: Db, adesso?: () => string, nuovoId?: () => string): Promise<Archivio> {
    await db.script(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS elementi (
        id TEXT PRIMARY KEY NOT NULL,
        tipo TEXT NOT NULL,
        campi TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS elementi_tipo ON elementi (tipo);
      CREATE TABLE IF NOT EXISTS sinc_elementi (
        id TEXT PRIMARY KEY NOT NULL,
        tipo TEXT NOT NULL,
        versione INTEGER NOT NULL DEFAULT 0,
        base TEXT,
        modificato INTEGER NOT NULL DEFAULT 0,
        modificato_il TEXT
      );
      CREATE TABLE IF NOT EXISTS sinc_stato (
        chiave TEXT PRIMARY KEY NOT NULL,
        valore TEXT NOT NULL
      );
    `);
    return new Archivio(db, adesso, nuovoId);
  }

  // ——— Elementi ———

  private async campi(id: string): Promise<{ tipo: string; campi: Campi } | null> {
    const r = await this.db.prima<{ tipo: string; campi: string }>(
      "SELECT tipo, campi FROM elementi WHERE id = ?",
      id,
    );
    return r ? { tipo: r.tipo, campi: JSON.parse(r.campi) } : null;
  }

  /** Scrive un elemento e lo segna da inviare. */
  private async scrivi(id: string, tipo: string, campi: Campi): Promise<void> {
    await this.db.esegui(
      "INSERT INTO elementi (id, tipo, campi) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET campi = excluded.campi",
      id,
      tipo,
      JSON.stringify(campi),
    );
    await this.segna(id, tipo);
  }

  /** Elimina per sempre: sul server va un blocco «eliminato». */
  private async cancella(id: string, tipo: string): Promise<void> {
    await this.db.esegui("DELETE FROM elementi WHERE id = ?", id);
    await this.segna(id, tipo);
  }

  private async segna(id: string, tipo: string): Promise<void> {
    await this.db.esegui(
      `INSERT INTO sinc_elementi (id, tipo, modificato, modificato_il) VALUES (?, ?, 1, ?)
       ON CONFLICT(id) DO UPDATE SET modificato = 1, modificato_il = excluded.modificato_il`,
      id,
      tipo,
      this.adesso(),
    );
  }

  // ——— Note e cartelle, per l'interfaccia ———

  private daNota(id: string, c: Campi): Nota {
    return {
      id,
      titolo: (c.titolo as string) ?? "",
      contenuto: (c.contenuto as string) ?? "",
      cartella: (c.cartella as string | null) ?? null,
      creata: (c.creata as string) ?? "",
      modificata: (c.modificata as string) ?? "",
      eliminata_il: (c.eliminata_il as string | null) ?? null,
      tag: Array.isArray(c.tag) ? (c.tag as string[]) : [],
    };
  }

  /** Le note di Cloud fuori dal cestino; quelle spostate in Brainet non ci sono (RB-132). */
  async note(): Promise<Nota[]> {
    const righe = await this.db.tutte<{ id: string; campi: string }>(
      "SELECT id, campi FROM elementi WHERE tipo = 'nota'",
    );
    return righe
      .map((r) => ({ id: r.id, c: JSON.parse(r.campi) as Campi }))
      .filter(({ c }) => !c.eliminata_il && c.brainet !== true)
      .map(({ id, c }) => this.daNota(id, c));
  }

  async cartelle(): Promise<Cartella[]> {
    const righe = await this.db.tutte<{ id: string; campi: string }>(
      "SELECT id, campi FROM elementi WHERE tipo = 'cartella'",
    );
    const tutte = righe.map((r) => {
      const c = JSON.parse(r.campi) as Campi;
      return {
        id: r.id,
        nome: (c.nome as string) ?? "",
        madre: (c.madre as string | null) ?? null,
        eliminata_il: (c.eliminata_il as string | null) ?? null,
      };
    });
    // Una madre che non c'è più (eliminata per sempre altrove): la cartella va al primo livello.
    const ids = new Set(tutte.map((x) => x.id));
    return tutte.map((x) => (x.madre && !ids.has(x.madre) ? { ...x, madre: null } : x));
  }

  async nota(id: string): Promise<Nota | null> {
    const e = await this.campi(id);
    return e && e.tipo === "nota" ? this.daNota(id, e.campi) : null;
  }

  /** Il nome della cartella, per «‹ cartella» in cima alla nota; nella radice «Cloud». */
  async nomeCartella(id: string | null): Promise<string> {
    const e = id ? await this.campi(id) : null;
    return e?.tipo === "cartella" ? String(e.campi.nome ?? "Cloud") : "Cloud";
  }

  /** Una nota nuova, vuota, nella radice o in una cartella, in vista Markdown (DEC-130). */
  async creaNota(cartella: string | null): Promise<string> {
    const id = this.nuovoId();
    const ora = this.adesso();
    await this.db.transazione(() =>
      this.scrivi(id, "nota", {
        titolo: "",
        contenuto: "",
        cartella,
        creata: ora,
        creata_scelta: null,
        modificata: ora,
        fine_validita: null,
        eliminata_il: null,
        provenienza: null,
        vista: "markdown",
        tag: [],
      }),
    );
    return id;
  }

  async salvaNota(id: string, titolo: string, contenuto: string): Promise<void> {
    await this.db.transazione(async () => {
      const e = await this.campi(id);
      if (!e) return;
      if (e.campi.titolo === titolo && e.campi.contenuto === contenuto) return;
      await this.scrivi(id, "nota", { ...e.campi, titolo, contenuto, modificata: this.adesso() });
    });
  }

  /** Il percorso della cartella, «Lavoro/Clienti», come la provenienza del computer. */
  private async percorso(cartella: string | null): Promise<string> {
    const nomi: string[] = [];
    let id = cartella;
    const visti = new Set<string>();
    while (id && !visti.has(id)) {
      visti.add(id);
      const e = await this.campi(id);
      if (!e) break;
      nomi.unshift(e.campi.nome as string);
      id = (e.campi.madre as string | null) ?? null;
    }
    return nomi.join("/");
  }

  /** Nel cestino, senza conferma: dal cestino si recupera (ID-55). */
  async cestinaNota(id: string): Promise<void> {
    await this.db.transazione(async () => {
      const e = await this.campi(id);
      if (!e) return;
      const provenienza = await this.percorso((e.campi.cartella as string | null) ?? null);
      await this.scrivi(id, "nota", { ...e.campi, eliminata_il: this.adesso(), provenienza });
    });
  }

  /** Una nota senza titolo né testo sparisce quando la lasci (RB-10). */
  async eliminaSeVuota(id: string): Promise<void> {
    await this.db.transazione(async () => {
      const e = await this.campi(id);
      if (!e || e.tipo !== "nota") return;
      if (String(e.campi.titolo ?? "").trim() || String(e.campi.contenuto ?? "").trim()) return;
      await this.cancella(id, "nota");
    });
  }

  async quantiNelCestino(): Promise<number> {
    const righe = await this.db.tutte<{ campi: string }>(
      "SELECT campi FROM elementi WHERE tipo IN ('nota', 'cartella')",
    );
    return righe.filter((r) => (JSON.parse(r.campi) as Campi).eliminata_il).length;
  }

  // ——— Stato della sincronizzazione ———

  async statoSinc(chiave: string): Promise<string | null> {
    const r = await this.db.prima<{ valore: string }>(
      "SELECT valore FROM sinc_stato WHERE chiave = ?",
      chiave,
    );
    return r?.valore ?? null;
  }

  async impostaStatoSinc(chiave: string, valore: string): Promise<void> {
    await this.db.esegui(
      "INSERT OR REPLACE INTO sinc_stato (chiave, valore) VALUES (?, ?)",
      chiave,
      valore,
    );
  }

  prendiConflitti(): Conflitto[] {
    const c = this.conflitti;
    this.conflitti = [];
    return c;
  }

  // ——— Blocchi ———

  private async bloccoAttuale(id: string, tipo: string, modificato_il: string): Promise<Blocco> {
    const e = await this.campi(id);
    return { formato: "chiaro", tipo, modificato_il, eliminato: !e, campi: e?.campi ?? {} };
  }

  // ——— Invio ———

  /** Gli elementi modificati qui, come blocchi da inviare, con la versione da cui partono. */
  async daInviare(): Promise<DaInviare[]> {
    const righe = await this.db.tutte<{
      id: string;
      tipo: string;
      versione: number;
      modificato_il: string | null;
    }>("SELECT id, tipo, versione, modificato_il FROM sinc_elementi WHERE modificato = 1");
    const blocchi: DaInviare[] = [];
    for (const r of righe) {
      let modificato_il = r.modificato_il;
      if (!modificato_il) {
        modificato_il = this.adesso();
        await this.db.esegui(
          "UPDATE sinc_elementi SET modificato_il = ? WHERE id = ? AND modificato_il IS NULL",
          modificato_il,
          r.id,
        );
      }
      const blocco = await this.bloccoAttuale(r.id, r.tipo, modificato_il);
      // Nato e sparito prima di essere mai inviato: non interessa a nessuno.
      if (r.versione === 0 && blocco.eliminato) {
        await this.db.esegui("DELETE FROM sinc_elementi WHERE id = ?", r.id);
        continue;
      }
      blocchi.push({ id: r.id, versione: r.versione, dati: testoBlocco(blocco), modificato_il });
    }
    return blocchi;
  }

  /** Il server l'ha accettato: è la nuova base; se nel frattempo è cambiato, resta da inviare. */
  async inviato(b: DaInviare, versione: number): Promise<void> {
    await this.db.esegui(
      `UPDATE sinc_elementi SET versione = ?, base = ?,
         modificato = CASE WHEN modificato_il = ? THEN 0 ELSE modificato END
       WHERE id = ?`,
      versione,
      b.dati,
      b.modificato_il,
      b.id,
    );
  }

  /** Il primo giro cifrato (DEC-121): ogni elemento torna da inviare. */
  async segnaTuttoDaInviare(): Promise<void> {
    await this.db.esegui(
      `UPDATE sinc_elementi SET modificato = 1,
         modificato_il = coalesce(modificato_il, json_extract(base, '$.modificato_il'), ?)`,
      this.adesso(),
    );
  }

  /** L'archivio del server è un altro (DEC-105): si riparte da zero. */
  async azzeraSinc(): Promise<void> {
    await this.db.esegui(
      `UPDATE sinc_elementi SET versione = 0, base = NULL, modificato = 1,
         modificato_il = coalesce(modificato_il, json_extract(base, '$.modificato_il'), ?)`,
      this.adesso(),
    );
    await this.db.esegui("DELETE FROM sinc_stato WHERE chiave = 'ultimo_ordine'");
  }

  // ——— Ricezione ———

  /** Applica le versioni ricevute, fondendole con le modifiche fatte qui. Dice se qualcosa è cambiato. */
  async ricevi(ricevute: Ricevuta[]): Promise<boolean> {
    return this.db.transazione(async () => {
      let cambiato = false;
      const spostate: string[] = [];
      const ordine = (r: Ricevuta) => {
        const t = (JSON.parse(r.dati) as Blocco).tipo;
        return t === "tag" ? 0 : t === "cartella" ? 1 : 2;
      };
      const ordinate = [...ricevute].sort((a, b) => ordine(a) - ordine(b));
      for (const r of ordinate) {
        let remoto: Blocco;
        try {
          remoto = JSON.parse(r.dati);
        } catch {
          continue;
        }
        // Le versioni vecchie di Brainet (frammento, RB-125) le converte il computer.
        if (!TIPI.includes(remoto.tipo)) continue;
        const voce = await this.db.prima<{
          tipo: string;
          versione: number;
          base: string | null;
          modificato: number;
          modificato_il: string | null;
        }>(
          "SELECT tipo, versione, base, modificato, modificato_il FROM sinc_elementi WHERE id = ?",
          r.id,
        );
        // L'eco di una versione già nota (per esempio la propria appena inviata).
        if (voce && voce.versione >= r.versione) continue;
        const prima = await this.bloccoAttuale(r.id, remoto.tipo, "");
        const risultato =
          voce && voce.modificato === 1
            ? await this.fondi(r.id, voce.tipo, voce.base, voce.modificato_il, prima, remoto)
            : remoto;
        if (risultato.eliminato) await this.db.esegui("DELETE FROM elementi WHERE id = ?", r.id);
        else
          await this.db.esegui(
            "INSERT INTO elementi (id, tipo, campi) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET campi = excluded.campi",
            r.id,
            remoto.tipo,
            JSON.stringify(risultato.campi ?? {}),
          );
        const ugualeAlServer =
          uguali(ordinato(risultato.campi), ordinato(remoto.campi)) &&
          risultato.eliminato === remoto.eliminato;
        await this.db.esegui(
          `INSERT INTO sinc_elementi (id, tipo, versione, base, modificato, modificato_il)
           VALUES (?, ?, ?, ?, 0, NULL)
           ON CONFLICT(id) DO UPDATE SET versione = excluded.versione, base = excluded.base,
             modificato = CASE WHEN ? THEN 0 ELSE sinc_elementi.modificato END`,
          r.id,
          remoto.tipo,
          r.versione,
          r.dati,
          ugualeAlServer ? 1 : 0,
        );
        if (
          !uguali(ordinato(prima.campi), ordinato(risultato.campi)) ||
          prima.eliminato !== risultato.eliminato
        )
          cambiato = true;
        if (remoto.tipo === "nota" && !uguali(prima.campi.cartella, risultato.campi.cartella))
          spostate.push(r.id);
      }
      if (await this.sistemaRiferimenti()) cambiato = true;
      // RB-30: solo le note modificate qui o spostate da questa ricezione, come sul computer.
      const modificate = await this.db.tutte<{ id: string }>(
        "SELECT id FROM sinc_elementi WHERE tipo = 'nota' AND modificato = 1",
      );
      for (const id of new Set([...modificate.map((m) => m.id), ...spostate]))
        if (await this.togliDallaCartellaNelCestino(id)) cambiato = true;
      return cambiato;
    });
  }

  /** Fonde un elemento modificato qui e sul server, campo per campo con la base (DEC-76, DEC-109). */
  private async fondi(
    id: string,
    tipo: string,
    baseTesto: string | null,
    modificato_il: string | null,
    locale: Blocco,
    remoto: Blocco,
  ): Promise<Blocco> {
    let base: Blocco | null;
    try {
      base = baseTesto ? JSON.parse(baseTesto) : null;
    } catch {
      base = null;
    }
    // Eliminato per sempre da una parte e cambiato dall'altra: vince quello di qui.
    if (locale.eliminato || remoto.eliminato)
      return locale.eliminato && remoto.eliminato ? remoto : locale;
    const b = base?.campi ?? {};
    const l = locale.campi;
    const r = remoto.campi;
    const fusi: Campi = {};
    let conflittoDiTesto = false;
    const chiavi = [...new Set([...Object.keys(l), ...Object.keys(r)])].sort();
    for (const k of chiavi) {
      // Un campo che manca in una base che c'è non esisteva ancora: valeva null.
      const vb = base === null ? b[k] : k in b ? b[k] : null;
      let vl = l[k];
      let vr = r[k];
      if (CAMPI_OPZIONALI.includes(k)) {
        vl = k in l ? vl : vb;
        vr = k in r ? vr : vb;
      }
      const presenteL = k in l || (CAMPI_OPZIONALI.includes(k) && vb !== undefined);
      const presenteR = k in r || (CAMPI_OPZIONALI.includes(k) && vb !== undefined);
      let valore: unknown;
      let presente: boolean;
      if (uguali(vl, vr) || uguali(vl, vb)) {
        valore = vr;
        presente = presenteR;
      } else if (uguali(vr, vb)) {
        valore = vl;
        presente = presenteL;
      } else if (tipo === "nota" && CAMPI_TESTO.includes(k)) {
        // Il testo cambiato da tutte e due le parti: l'originale prende quello del server,
        // quello di qui va nella copia in conflitto (DEC-06).
        conflittoDiTesto = true;
        valore = vr;
        presente = presenteR;
      } else if (k === "tag") {
        fusi[k] = unisciInsiemi(vb, vl, vr);
        continue;
      } else {
        valore = vl;
        presente = presenteL;
      }
      if (presente) fusi[k] = valore;
    }
    // RB-36: tra cestino e modifica vince l'azione di qui.
    if (tipo === "nota") {
      const k = "eliminata_il";
      const cl = !uguali(l[k], b[k]);
      const cr = !uguali(r[k], b[k]);
      const altro = (m: Campi) =>
        Object.entries(m).some(
          ([c, v]) => c !== k && c !== "provenienza" && c !== "modificata" && !uguali(b[c], v),
        );
      if (cl !== cr && ((cl && altro(r)) || (cr && altro(l)))) {
        for (const c of [k, "provenienza"]) fusi[c] = l[c] ?? null;
      }
    }
    if (conflittoDiTesto) {
      const copia = await this.creaCopiaInConflitto(
        id,
        String(l.titolo ?? ""),
        String(l.contenuto ?? ""),
        fusi,
      );
      this.conflitti.push({ originale: id, copia });
    }
    return {
      formato: "chiaro",
      tipo,
      modificato_il: modificato_il ?? "",
      eliminato: false,
      campi: fusi,
    };
  }

  /** La copia in conflitto: stessa cartella e stessi tag, titolo seguito da «(copia in conflitto)» (RB-39). */
  private async creaCopiaInConflitto(
    _originale: string,
    titolo: string,
    contenuto: string,
    fusi: Campi,
  ): Promise<string> {
    const id = this.nuovoId();
    const ora = this.adesso();
    await this.scrivi(id, "nota", {
      titolo: titolo.trim() ? `${titolo} (copia in conflitto)` : "(copia in conflitto)",
      contenuto,
      cartella: fusi.cartella ?? null,
      creata: ora,
      creata_scelta: null,
      modificata: ora,
      fine_validita: null,
      eliminata_il: null,
      provenienza: null,
      ...(fusi.vista !== undefined ? { vista: fusi.vista } : {}),
      ...(fusi.brainet === true ? { brainet: true } : {}),
      tag: Array.isArray(fusi.tag) ? fusi.tag : [],
    });
    return id;
  }

  /** Riferimenti a cartelle che non ci sono più (eliminate per sempre altrove): la nota va nella radice. */
  private async sistemaRiferimenti(): Promise<boolean> {
    const ids = new Set((await this.cartelle()).map((c) => c.id));
    let cambiato = false;
    const righe = await this.db.tutte<{ id: string; campi: string }>(
      "SELECT id, campi FROM elementi WHERE tipo = 'nota'",
    );
    for (const r of righe) {
      const c = JSON.parse(r.campi) as Campi;
      if (c.cartella && !ids.has(c.cartella as string)) {
        await this.db.esegui(
          "UPDATE elementi SET campi = ? WHERE id = ?",
          JSON.stringify({ ...c, cartella: null }),
          r.id,
        );
        cambiato = true;
      }
    }
    return cambiato;
  }

  /** RB-30, DEC-111: la nota, visibile, sta in una cartella nel cestino? Allora va tra le non organizzate. */
  private async togliDallaCartellaNelCestino(id: string): Promise<boolean> {
    const e = await this.campi(id);
    if (!e || e.tipo !== "nota" || e.campi.eliminata_il) return false;
    const cartelle = new Map((await this.cartelle()).map((c) => [c.id, c]));
    let attuale = (e.campi.cartella as string | null) ?? null;
    const visti = new Set<string>();
    while (attuale && !visti.has(attuale)) {
      visti.add(attuale);
      const c = cartelle.get(attuale);
      if (!c) return false;
      if (c.eliminata_il) {
        await this.scrivi(id, "nota", { ...e.campi, cartella: null });
        return true;
      }
      attuale = c.madre;
    }
    return false;
  }
}

/** Tag cambiati da tutte e due le parti: quelli che nessuno ha tolto, più gli aggiunti. */
function unisciInsiemi(base: unknown, locale: unknown, remoto: unknown): string[] {
  const insieme = (v: unknown) =>
    new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  const b = insieme(base);
  const l = insieme(locale);
  const r = insieme(remoto);
  const tutti = new Set<string>();
  for (const t of b) if (l.has(t) && r.has(t)) tutti.add(t);
  for (const t of l) if (!b.has(t)) tutti.add(t);
  for (const t of r) if (!b.has(t)) tutti.add(t);
  return [...tutti].sort();
}
