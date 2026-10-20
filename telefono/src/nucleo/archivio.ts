// Copia di lavoro del telefono (DEC-67, DEC-156). Ogni elemento (nota, cartella, tag,
// impostazioni e gli elementi di Brainet) si tiene come i campi del suo blocco di
// sincronizzazione, tutti, anche quelli che il telefono non usa ancora (vista, Brainet): così il
// telefono non perde né cambia niente di ciò che scrive il computer. Le regole della
// sincronizzazione sono quelle di client/src-tauri/src/archivio_sinc.rs: ricevendo, un elemento
// non modificato qui si prende com'è; uno modificato anche qui si fonde campo per campo con la
// base, il testo cambiato da tutte e due le parti fa nascere la copia in conflitto (DEC-06), il
// resto va alla modifica di qui (DEC-109); tra cestino e modifica vince l'azione di qui (RB-36);
// una nota in una cartella mandata nel cestino altrove va tra le non organizzate (RB-30).

import { conNome, type Entita, type NotaBrainet, type Stato, type TipoEntita } from "./brainet";
import type { Db } from "./db";
import { cerca, type NotaDaCercare, type RichiestaRicerca, type RisultatoRicerca } from "./ricerca";

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
  /** Il giorno di creazione scelto a mano (RB-21), AAAA-MM-GG. */
  creata_scelta: string | null;
  /** Fine validità, AAAA-MM-GG: solo un promemoria. */
  fine_validita: string | null;
}

const NUOVA_CARTELLA = "Nuova cartella";
/** Il nome più lungo di un'entità, come sul computer. */
const LUNGHEZZA_NOME_ENTITA = 200;

/** Il nome di una cartella: i caratteri vietati diventano «-», senza spazi ai lati (RB-63). */
export function nomeCartella(nome: string): string {
  return nome.replace(/[<>:"/\\|?*]/g, "-").trim();
}

export interface Cartella {
  id: string;
  nome: string;
  madre: string | null;
  eliminata_il: string | null;
}

export interface ElementoCestino {
  id: string;
  tipo: "nota" | "cartella";
  /** Il titolo della nota (o le prime parole), il nome della cartella. */
  nome: string;
  /** Il percorso da cui viene, «Lavoro/Clienti»; vuoto dalla radice. */
  provenienza: string;
  eliminato: string;
  /** Per le cartelle, le note che contiene. */
  conteggio: number | null;
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

/** L'elemento delle impostazioni, uguale su tutti i dispositivi (DEC-91, RB-52). */
export const ID_IMPOSTAZIONI = "00000000-0000-4000-8000-000000000001";
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
      creata_scelta: (c.creata_scelta as string | null) ?? null,
      fine_validita: (c.fine_validita as string | null) ?? null,
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

  /**
   * Una nota nuova, vuota, nella radice o in una cartella, in vista Markdown (DEC-130); con
   * `brainet` la pagina nuova di «Scrivi», già in Brainet (RB-134, DEC-168).
   */
  async creaNota(cartella: string | null, brainet = false): Promise<string> {
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
        ...(brainet ? { brainet: true } : {}),
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
  async percorso(cartella: string | null): Promise<string> {
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

  /** Brainet acceso, dalle impostazioni che viaggiano con la sincronizzazione (DEC-91, RB-106). */
  async brainetAcceso(): Promise<boolean> {
    const e = await this.campi(ID_IMPOSTAZIONI);
    return e?.campi.brainet === true;
  }

  // ——— Ricerca (RF-08) e tag ———

  /** I percorsi dei tag per id: «lavoro/clienti», dai nomi e dai padri dei blocchi (RF-06). */
  async percorsiTag(): Promise<Map<string, string>> {
    const righe = await this.db.tutte<{ id: string; campi: string }>(
      "SELECT id, campi FROM elementi WHERE tipo = 'tag'",
    );
    const tag = new Map(righe.map((r) => [r.id, JSON.parse(r.campi) as Campi]));
    const percorso = (id: string): string => {
      const nomi: string[] = [];
      for (let t = tag.get(id), passi = 0; t && passi <= tag.size; passi++) {
        nomi.unshift(String(t.nome ?? ""));
        t = t.padre ? tag.get(String(t.padre)) : undefined;
      }
      return nomi.join("/");
    };
    return new Map([...tag.keys()].map((id) => [id, percorso(id)]));
  }

  // ——— Brainet da leggere (RF-18, passo 1) ———

  /** Note (tutte), entità e stati di Brainet, dai blocchi sincronizzati. */
  async datiBrainet(): Promise<{
    note: (NotaBrainet & { tag: string[] })[];
    entita: Map<string, Entita>;
    stati: Stato[];
  }> {
    const righe = await this.db.tutte<{ id: string; tipo: string; campi: string }>(
      "SELECT id, tipo, campi FROM elementi WHERE tipo IN ('nota', 'entita', 'stato')",
    );
    const note: (NotaBrainet & { tag: string[] })[] = [];
    const entita = new Map<string, Entita>();
    const stati: Stato[] = [];
    for (const r of righe) {
      const c = JSON.parse(r.campi) as Campi;
      if (r.tipo === "nota") note.push({ ...this.daNota(r.id, c), brainet: c.brainet === true });
      else if (r.tipo === "entita")
        entita.set(r.id, {
          id: r.id,
          nome: String(c.nome ?? ""),
          tipo: (c.tipo as Entita["tipo"]) ?? null,
          foto: (c.foto as string | null) ?? null,
          unitaIn: (c.unita_in as string | null) ?? null,
        });
      else
        stati.push({
          id: r.id,
          nome: String(c.nome ?? ""),
          colore: String(c.colore ?? "informazione"),
          ordine: Number(c.ordine ?? 0),
        });
    }
    stati.sort((a, b) => a.ordine - b.ordine || a.nome.localeCompare(b.nome));
    return { note, entita, stati };
  }

  // ——— Brainet da scrivere (RF-18, passo 2) ———

  private async entitaDaBlocchi(): Promise<Map<string, Entita>> {
    return (await this.datiBrainet()).entita;
  }

  /** Un'entità nuova, senza tipo (RB-105); con il nome di una che c'è già, quella. */
  async creaEntita(nome: string): Promise<Entita | null> {
    const pulito = nome.trim().slice(0, LUNGHEZZA_NOME_ENTITA);
    if (!pulito) return null;
    return this.db.transazione(async () => {
      const esistente = conNome(pulito, await this.entitaDaBlocchi());
      if (esistente) return esistente;
      const id = this.nuovoId();
      await this.scrivi(id, "entita", {
        nome: pulito,
        tipo: null,
        foto: null,
        unita_in: null,
        creata_il: this.adesso(),
      });
      return { id, nome: pulito, tipo: null, foto: null, unitaIn: null };
    });
  }

  private async cambiaEntita(id: string, cambi: Campi): Promise<void> {
    await this.db.transazione(async () => {
      const e = await this.campi(id);
      if (!e || e.tipo !== "entita") return;
      await this.scrivi(id, "entita", { ...e.campi, ...cambi });
    });
  }

  /** Il tipo dell'entità; null è «Senza tipo» (RB-122). */
  async impostaTipo(id: string, tipo: TipoEntita | null): Promise<void> {
    await this.cambiaEntita(id, { tipo });
  }

  /** La foto dell'entità, JPEG in base64 già ridotto; null la toglie (CA-18.13). */
  async impostaFoto(id: string, foto: string | null): Promise<void> {
    await this.cambiaEntita(id, { foto });
  }

  /**
   * Unisce `da` in `verso` (RB-108): `da`, e le entità già unite in lei, rimandano a `verso`, che
   * tiene il suo nome. Non si annulla.
   */
  async unisciEntita(da: string, verso: string): Promise<void> {
    if (da === verso) return;
    await this.db.transazione(async () => {
      for (const [id, e] of await this.entitaDaBlocchi()) {
        if (id !== da && e.unitaIn !== da) continue;
        const c = await this.campi(id);
        if (c) await this.scrivi(id, "entita", { ...c.campi, unita_in: verso });
      }
    });
  }

  /**
   * «Sposta in Brainet» (RB-130, DEC-147): la nota esce dalla cartella, dall'albero e dalla
   * ricerca, e resta in vista Markdown; senza ritorno.
   */
  async spostaInBrainet(id: string): Promise<void> {
    await this.db.transazione(async () => {
      const e = await this.campi(id);
      if (!e || e.tipo !== "nota") return;
      await this.scrivi(id, "nota", {
        ...e.campi,
        brainet: true,
        cartella: null,
        vista: "markdown",
      });
    });
  }

  /** La nota per Info (CMP-24): i tag con il loro percorso al posto dell'id, in ordine. */
  async notaPerInfo(id: string): Promise<{ nota: Nota; cartella: string } | null> {
    const n = await this.nota(id);
    if (!n) return null;
    const percorsi = await this.percorsiTag();
    const tag = n.tag
      .map((t) => percorsi.get(t))
      .filter((t): t is string => !!t)
      .sort();
    return { nota: { ...n, tag }, cartella: await this.percorso(n.cartella) };
  }

  /** Cerca nelle note di questo telefono, con la preferenza del cestino (RF-08, RB-29). */
  async cerca(richiesta: RichiestaRicerca): Promise<RisultatoRicerca[]> {
    const righe = await this.db.tutte<{ id: string; campi: string }>(
      "SELECT id, campi FROM elementi WHERE tipo = 'nota'",
    );
    const note: NotaDaCercare[] = righe.map((r) => {
      const c = JSON.parse(r.campi) as Campi;
      return {
        ...this.daNota(r.id, c),
        provenienza: (c.provenienza as string | null) ?? null,
        brainet: c.brainet === true,
      };
    });
    const cartelle = new Map(
      [...(await this.tutteLeCartelle())].map(([id, c]) => [
        id,
        {
          nome: String(c.nome ?? ""),
          madre: (c.madre as string | null) ?? null,
          eliminata: !!c.eliminata_il,
        },
      ]),
    );
    return cerca(
      richiesta,
      note,
      cartelle,
      await this.percorsiTag(),
      await this.cestinoInRicerca(),
    );
  }

  /** «Mostra le note del cestino nei risultati»: sincronizzata, accesa di default (RB-29, DEC-94). */
  async cestinoInRicerca(): Promise<boolean> {
    const e = await this.campi(ID_IMPOSTAZIONI);
    return e?.campi.cestino_in_ricerca !== false;
  }

  async impostaCestinoInRicerca(acceso: boolean): Promise<void> {
    await this.db.transazione(async () => {
      const e = await this.campi(ID_IMPOSTAZIONI);
      await this.scrivi(ID_IMPOSTAZIONI, "impostazioni", {
        ...(e?.campi ?? {}),
        cestino_in_ricerca: acceso,
      });
    });
  }

  async quantiNelCestino(): Promise<number> {
    const righe = await this.db.tutte<{ campi: string }>(
      "SELECT campi FROM elementi WHERE tipo IN ('nota', 'cartella')",
    );
    return righe.filter((r) => (JSON.parse(r.campi) as Campi).eliminata_il).length;
  }

  // ——— Cartelle e Sposta in (FL-05), con le regole del computer ———

  /** Sposta la nota in un'altra cartella o nella radice; la data di modifica non cambia (FL-05). */
  async spostaNota(id: string, cartella: string | null): Promise<void> {
    await this.db.transazione(async () => {
      const e = await this.campi(id);
      if (!e || e.tipo !== "nota" || (e.campi.cartella ?? null) === cartella) return;
      await this.scrivi(id, "nota", { ...e.campi, cartella });
    });
  }

  /** I nomi delle cartelle dentro `madre`, fuori dal cestino, in minuscolo; `tranne` esclusa. */
  private nomiDentro(cartelle: Map<string, Campi>, madre: string | null, tranne?: string) {
    return new Set(
      [...cartelle]
        .filter(([i, c]) => i !== tranne && (c.madre ?? null) === madre && !c.eliminata_il)
        .map(([, c]) => String(c.nome).toLowerCase()),
    );
  }

  /** Il primo nome libero: «Nome», poi «Nome (2)», «Nome (3)»… (RB-23, RB-31). */
  private static libero(nome: string, nomi: Set<string>): string {
    if (!nomi.has(nome.toLowerCase())) return nome;
    let n = 2;
    while (nomi.has(`${nome} (${n})`.toLowerCase())) n++;
    return `${nome} (${n})`;
  }

  /** Il nome proposto per una cartella nuova dentro `madre`: «Nuova cartella», numerato (RB-48). */
  async nomeProposto(madre: string | null): Promise<string> {
    return Archivio.libero(NUOVA_CARTELLA, this.nomiDentro(await this.tutteLeCartelle(), madre));
  }

  /**
   * Crea una cartella dentro `madre`. Il nome proposto prende da solo un numero (RB-48); un nome
   * scritto già usato segue RB-31: senza scelta risponde con il conflitto, con «numero» prende
   * «Nome (2)», con «unisci» non nasce niente (la cartella nuova è vuota).
   */
  async creaCartella(
    madre: string | null,
    nome: string,
    proposto: boolean,
    scelta?: "numero" | "unisci",
  ): Promise<{ conflitto: string } | null> {
    const pulito = nomeCartella(nome);
    if (!pulito) return null;
    return this.db.transazione(async () => {
      const nomi = this.nomiDentro(await this.tutteLeCartelle(), madre);
      let finale = pulito;
      if (nomi.has(pulito.toLowerCase())) {
        if (!proposto && !scelta) return { conflitto: pulito };
        if (scelta === "unisci") return null;
        finale = Archivio.libero(pulito, nomi);
      }
      await this.scrivi(this.nuovoId(), "cartella", {
        nome: finale,
        madre,
        eliminata_il: null,
        provenienza: null,
      });
      return null;
    });
  }

  /**
   * Rinomina una cartella (RB-63); un nome già usato tra le sorelle segue RB-31 (RB-23): con
   * «unisci» la cartella entra in quella che ha già il nome.
   */
  async rinominaCartella(
    id: string,
    nome: string,
    scelta?: "numero" | "unisci",
  ): Promise<{ conflitto: string } | null> {
    const pulito = nomeCartella(nome);
    if (!pulito) return null;
    return this.db.transazione(async () => {
      const cartelle = await this.tutteLeCartelle();
      const c = cartelle.get(id);
      if (!c || c.nome === pulito) return null;
      const madre = (c.madre as string | null) ?? null;
      const nomi = this.nomiDentro(cartelle, madre, id);
      let finale = pulito;
      if (nomi.has(pulito.toLowerCase())) {
        if (!scelta) return { conflitto: pulito };
        if (scelta === "unisci") {
          const arrivo = [...cartelle].find(
            ([i, x]) =>
              i !== id &&
              (x.madre ?? null) === madre &&
              !x.eliminata_il &&
              String(x.nome).toLowerCase() === pulito.toLowerCase(),
          )![0];
          await this.unisci(id, arrivo, cartelle);
          return null;
        }
        finale = Archivio.libero(pulito, nomi);
      }
      await this.scrivi(id, "cartella", { ...c, nome: finale });
      return null;
    });
  }

  /** Manda una cartella nel cestino con tutto il contenuto (RB-25), senza conferma (ID-55). */
  async cestinaCartella(id: string): Promise<void> {
    await this.db.transazione(async () => {
      const e = await this.campi(id);
      if (!e || e.tipo !== "cartella") return;
      const provenienza = await this.percorso((e.campi.madre as string | null) ?? null);
      await this.scrivi(id, "cartella", {
        ...e.campi,
        eliminata_il: this.adesso(),
        provenienza,
      });
    });
  }

  // ——— Cestino (RF-15, SC-04), con le regole del computer ———

  /** Cartelle con i campi, comprese quelle nel cestino. */
  private async tutteLeCartelle(): Promise<Map<string, Campi>> {
    const righe = await this.db.tutte<{ id: string; campi: string }>(
      "SELECT id, campi FROM elementi WHERE tipo = 'cartella'",
    );
    return new Map(righe.map((r) => [r.id, JSON.parse(r.campi) as Campi]));
  }

  /** La cartella e le sottocartelle fuori dal cestino, come sottoalbero del computer. */
  private sottoalbero(id: string, cartelle: Map<string, Campi>): string[] {
    const ids = [id];
    for (let i = 0; i < ids.length; i++)
      for (const [figlia, c] of cartelle)
        if (c.madre === ids[i] && !c.eliminata_il && !ids.includes(figlia)) ids.push(figlia);
    return ids;
  }

  /** Note fuori dal cestino nella cartella e nelle sottocartelle (RB-56). */
  private async contaNote(id: string, cartelle: Map<string, Campi>): Promise<number> {
    const ids = new Set(this.sottoalbero(id, cartelle));
    const note = await this.db.tutte<{ campi: string }>(
      "SELECT campi FROM elementi WHERE tipo = 'nota'",
    );
    return note
      .map((r) => JSON.parse(r.campi) as Campi)
      .filter((c) => !c.eliminata_il && ids.has(c.cartella as string)).length;
  }

  /** Gli elementi del cestino, l'eliminato più di recente in cima (SC-04). */
  async elementiCestino(): Promise<ElementoCestino[]> {
    const cartelle = await this.tutteLeCartelle();
    const note = await this.db.tutte<{ id: string; campi: string }>(
      "SELECT id, campi FROM elementi WHERE tipo = 'nota'",
    );
    const elementi: ElementoCestino[] = [];
    for (const r of note) {
      const c = JSON.parse(r.campi) as Campi;
      if (!c.eliminata_il) continue;
      const titolo =
        String(c.titolo ?? "").trim() ||
        String(c.contenuto ?? "")
          .trim()
          .split(/\s+/)
          .slice(0, 6)
          .join(" ");
      elementi.push({
        id: r.id,
        tipo: "nota",
        nome: titolo,
        provenienza: String(c.provenienza ?? ""),
        eliminato: String(c.eliminata_il),
        conteggio: null,
      });
    }
    for (const [id, c] of cartelle) {
      if (!c.eliminata_il) continue;
      elementi.push({
        id,
        tipo: "cartella",
        nome: String(c.nome ?? ""),
        provenienza: String(c.provenienza ?? ""),
        eliminato: String(c.eliminata_il),
        conteggio: await this.contaNote(id, cartelle),
      });
    }
    return elementi.sort((a, b) => b.eliminato.localeCompare(a.eliminato));
  }

  /**
   * Riporta l'elemento nella radice (RB-28). Una cartella con il nome di un'altra già nella radice
   * segue RB-31: senza scelta risponde con il conflitto; con «numero» prende «Nome (2)».
   */
  async ripristina(
    id: string,
    scelta?: "numero" | "unisci",
  ): Promise<{ conflitto: string } | null> {
    return this.db.transazione(async () => {
      const e = await this.campi(id);
      if (!e || !e.campi.eliminata_il) return null;
      if (e.tipo === "nota") {
        await this.scrivi(id, "nota", {
          ...e.campi,
          cartella: null,
          eliminata_il: null,
          provenienza: null,
        });
        return null;
      }
      const cartelle = await this.tutteLeCartelle();
      const nomi = new Set(
        [...cartelle]
          .filter(([i, c]) => i !== id && !c.madre && !c.eliminata_il)
          .map(([, c]) => String(c.nome).toLowerCase()),
      );
      let nome = String(e.campi.nome ?? "");
      if (nomi.has(nome.toLowerCase())) {
        if (!scelta) return { conflitto: nome };
        if (scelta === "unisci") {
          const arrivo = [...cartelle].find(
            ([i, c]) =>
              i !== id &&
              !c.madre &&
              !c.eliminata_il &&
              String(c.nome).toLowerCase() === nome.toLowerCase(),
          )![0];
          await this.unisci(id, arrivo, cartelle);
          return null;
        }
        let n = 2;
        while (nomi.has(`${nome} (${n})`.toLowerCase())) n++;
        nome = `${nome} (${n})`;
      }
      await this.scrivi(id, "cartella", {
        ...e.campi,
        nome,
        madre: null,
        eliminata_il: null,
        provenienza: null,
      });
      return null;
    });
  }

  /**
   * Unisce una cartella in un'altra con lo stesso nome (RB-31): note e sottocartelle passano
   * all'arrivo; una sottocartella con un nome già usato lì prende un numero; la cartella di
   * partenza sparisce.
   */
  private async unisci(id: string, arrivo: string, cartelle: Map<string, Campi>): Promise<void> {
    const note = await this.db.tutte<{ id: string; campi: string }>(
      "SELECT id, campi FROM elementi WHERE tipo = 'nota'",
    );
    for (const r of note) {
      const c = JSON.parse(r.campi) as Campi;
      if (c.cartella === id && !c.eliminata_il)
        await this.scrivi(r.id, "nota", { ...c, cartella: arrivo });
    }
    const nomi = new Set(
      [...cartelle]
        .filter(([, c]) => c.madre === arrivo && !c.eliminata_il)
        .map(([, c]) => String(c.nome).toLowerCase()),
    );
    for (const [figlia, c] of cartelle) {
      if (c.madre !== id || c.eliminata_il) continue;
      let nome = String(c.nome);
      if (nomi.has(nome.toLowerCase())) {
        let n = 2;
        while (nomi.has(`${nome} (${n})`.toLowerCase())) n++;
        nome = `${nome} (${n})`;
      }
      nomi.add(nome.toLowerCase());
      await this.scrivi(figlia, "cartella", { ...c, nome, madre: arrivo });
    }
    await this.cancella(id, "cartella");
  }

  /** Cancella per sempre un elemento del cestino (RB-55): una cartella con quello che contiene. */
  async eliminaDefinitivamente(id: string): Promise<void> {
    await this.db.transazione(() => this.eliminaPerSempre(id));
  }

  private async eliminaPerSempre(id: string): Promise<void> {
    const e = await this.campi(id);
    if (!e || !e.campi.eliminata_il) return;
    if (e.tipo === "nota") return this.cancella(id, "nota");
    const cartelle = await this.tutteLeCartelle();
    const ids = this.sottoalbero(id, cartelle);
    // Le sottocartelle già nel cestino restano nel cestino, nella radice.
    for (const [figlia, c] of cartelle)
      if (figlia !== id && c.eliminata_il && ids.includes(c.madre as string))
        await this.scrivi(figlia, "cartella", { ...c, madre: null });
    const note = await this.db.tutte<{ id: string; campi: string }>(
      "SELECT id, campi FROM elementi WHERE tipo = 'nota'",
    );
    for (const r of note) {
      const c = JSON.parse(r.campi) as Campi;
      if (!c.eliminata_il && ids.includes(c.cartella as string)) await this.cancella(r.id, "nota");
    }
    for (const i of ids) await this.cancella(i, "cartella");
  }

  /** Svuota il cestino (RB-32). */
  async svuotaCestino(): Promise<void> {
    await this.db.transazione(async () => {
      for (const e of await this.elementiCestino()) await this.eliminaPerSempre(e.id);
    });
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
