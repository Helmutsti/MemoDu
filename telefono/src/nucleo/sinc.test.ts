// Il nucleo del telefono contro il server vero (api/src), avviato in memoria con PGlite come
// nelle prove del server: accesso, invio e ricezione cifrati, fusione, campi del computer intatti.

import { DatabaseSync } from "node:sqlite";
import type { FastifyInstance } from "fastify";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Accesso } from "../../../api/src/accesso.js";
import { chiaveDatiDaRecupero, creaUtente } from "../../../api/src/chiavi.js";
import { daPglite, type Database } from "../../../api/src/database.js";
import { aggiornaSchema } from "../../../api/src/schema.js";
import { creaServer } from "../../../api/src/servizio.js";
import { ArchivioSincronizzazione } from "../../../api/src/sincronizzazione.js";
import {
  accedi,
  cambiaPassword,
  elencaDispositivi,
  mandaNome,
  scollegaDispositivo,
  type Sessione,
} from "./accesso";
import { scriviRecupero } from "./cifratura";
import { Archivio } from "./archivio";
import type { Db, Valore } from "./db";
import { sincronizza } from "./sinc";

const LEGGERO = { memoria: 1024, passaggi: 1, fili: 1 };
const PASSWORD = "una frase lunga e mia";
const SEGRETO = Buffer.alloc(32, 7).toString("base64url");
const { dati, recupero } = creaUtente("manuel@esempio.it", PASSWORD, {}, LEGGERO);

/** SQLite di Node con l'interfaccia del nucleo. */
function dbDiProva(): Db {
  const d = new DatabaseSync(":memory:");
  return {
    tutte: async <T>(sql: string, ...p: Valore[]) => d.prepare(sql).all(...p) as T[],
    prima: async <T>(sql: string, ...p: Valore[]) =>
      (d.prepare(sql).get(...p) as T | undefined) ?? null,
    esegui: async (sql: string, ...p: Valore[]) => void d.prepare(sql).run(...p),
    script: async (sql: string) => d.exec(sql),
    transazione: async <T>(f: () => Promise<T>) => {
      d.exec("BEGIN");
      try {
        const r = await f();
        d.exec("COMMIT");
        return r;
      } catch (e) {
        d.exec("ROLLBACK");
        throw e;
      }
    },
  };
}

let pg: Database;
let server: FastifyInstance;
/** fetch che passa per il server in memoria. */
const chiama: typeof fetch = async (url, init) => {
  const u = new URL(String(url));
  const r = await server.inject({
    method: (init?.method ?? "GET") as "GET",
    url: u.pathname + u.search,
    headers: Object.fromEntries(
      Object.entries((init?.headers as Record<string, string>) ?? {}).map(([k, v]) => [
        k.toLowerCase(),
        v,
      ]),
    ),
    ...(init?.body ? { payload: String(init.body) } : {}),
  });
  return new Response(r.statusCode === 204 ? null : r.body, { status: r.statusCode });
};
const INDIRIZZO = "http://prova";

beforeAll(async () => {
  pg = await daPglite();
  await aggiornaSchema(pg);
});
afterAll(() => pg.chiudi());
beforeEach(async () => {
  await pg.esegui("TRUNCATE utenti CASCADE");
  const accesso = new Accesso(pg, SEGRETO);
  await accesso.creaAccount(dati);
  server = creaServer(new ArchivioSincronizzazione(pg), accesso);
});
afterEach(() => server.close());

async function dispositivo(): Promise<{ a: Archivio; s: Sessione }> {
  const s = await accedi("Manuel@esempio.it ", PASSWORD, chiama, INDIRIZZO);
  return { a: await Archivio.apri(dbDiProva()), s };
}
const sinc = (d: { a: Archivio; s: Sessione }) => sincronizza(d.a, d.s, chiama, INDIRIZZO);

describe("nucleo del telefono con il server (DEC-156)", () => {
  it("accede con la password e apre la stessa chiave dati del server; con quella sbagliata no", async () => {
    const { s } = await dispositivo();
    expect(Buffer.from(s.chiave).equals(chiaveDatiDaRecupero(dati, recupero))).toBe(true);
    await expect(
      accedi("manuel@esempio.it", "un'altra frase lunga", chiama, INDIRIZZO),
    ).rejects.toBe("credenziali");
  });

  it("una nota scritta qui arriva cifrata all'altro dispositivo, uguale", async () => {
    const telefono = await dispositivo();
    const computer = await dispositivo();
    const id = await telefono.a.creaNota(null);
    await telefono.a.salvaNota(id, "Riunione", "Ordine del giorno");
    await sinc(telefono);
    const sulServer = await pg.righe<{ dati: string }>("SELECT dati FROM versioni WHERE id = $1", [
      id,
    ]);
    expect(sulServer[0].dati).not.toContain("Riunione");
    expect((await sinc(computer)).cambiato).toBe(true);
    expect(await computer.a.nota(id)).toMatchObject({
      titolo: "Riunione",
      contenuto: "Ordine del giorno",
    });
    // Niente da inviare dopo una ricezione: nessun giro inutile.
    expect(await computer.a.daInviare()).toEqual([]);
  });

  it("il testo cambiato da tutte e due le parti fa nascere la copia in conflitto (DEC-06)", async () => {
    const telefono = await dispositivo();
    const computer = await dispositivo();
    const id = await telefono.a.creaNota(null);
    await telefono.a.salvaNota(id, "Spesa", "pane");
    await sinc(telefono);
    await sinc(computer);
    await computer.a.salvaNota(id, "Spesa", "pane e latte");
    await sinc(computer);
    await telefono.a.salvaNota(id, "Spesa", "pane e caffè");
    await sinc(telefono);
    const note = await telefono.a.note();
    expect(note.find((n) => n.id === id)?.contenuto).toBe("pane e latte");
    const copia = note.find((n) => n.titolo === "Spesa (copia in conflitto)");
    expect(copia?.contenuto).toBe("pane e caffè");
    expect(telefono.a.prendiConflitti()).toEqual([{ originale: id, copia: copia!.id }]);
    await sinc(computer);
    expect((await computer.a.note()).map((n) => n.titolo).sort()).toEqual([
      "Spesa",
      "Spesa (copia in conflitto)",
    ]);
  });

  it("i campi che il telefono non usa restano come li ha scritti il computer", async () => {
    const telefono = await dispositivo();
    const computer = await dispositivo();
    const id = await computer.a.creaNota(null);
    await computer.a.salvaNota(id, "Diario", "oggi");
    // Il computer ha una data scelta e la vista Testo: campi che il telefono non mostra.
    const db = (computer.a as unknown as { db: Db }).db;
    const riga = await db.prima<{ campi: string }>("SELECT campi FROM elementi WHERE id = ?", id);
    const campi = {
      ...JSON.parse(riga!.campi),
      creata_scelta: "2026-10-01",
      vista: "testo",
      tag: ["t1"],
    };
    await db.esegui("UPDATE elementi SET campi = ? WHERE id = ?", JSON.stringify(campi), id);
    await sinc(computer);
    await sinc(telefono);
    await telefono.a.salvaNota(id, "Diario di bordo", "oggi");
    await sinc(telefono);
    await sinc(computer);
    const dopo = JSON.parse(
      (await db.prima<{ campi: string }>("SELECT campi FROM elementi WHERE id = ?", id))!.campi,
    );
    expect(dopo).toMatchObject({
      titolo: "Diario di bordo",
      creata_scelta: "2026-10-01",
      vista: "testo",
      tag: ["t1"],
    });
  });

  it("nel cestino da una parte e modificata dall'altra: vince l'azione arrivata per ultima (RB-36)", async () => {
    const telefono = await dispositivo();
    const computer = await dispositivo();
    const id = await telefono.a.creaNota(null);
    await telefono.a.salvaNota(id, "Vecchia", "testo");
    await sinc(telefono);
    await sinc(computer);
    await computer.a.cestinaNota(id);
    await sinc(computer);
    await telefono.a.salvaNota(id, "Vecchia", "testo nuovo");
    await sinc(telefono);
    expect((await telefono.a.nota(id))?.eliminata_il).toBeNull();
    await sinc(computer);
    expect((await computer.a.nota(id))?.eliminata_il).toBeNull();
  });

  it("una nota vuota lasciata subito non va mai al server (RB-10)", async () => {
    const telefono = await dispositivo();
    const id = await telefono.a.creaNota(null);
    await telefono.a.eliminaSeVuota(id);
    await sinc(telefono);
    expect(await pg.righe("SELECT id FROM versioni WHERE id = $1", [id])).toEqual([]);
  });

  it("cestino: ripristina nella radice; una cartella con un nome già usato chiede, poi prende «(2)» (RB-28, RB-31)", async () => {
    const t = await dispositivo();
    const db = (t.a as unknown as { db: Db }).db;
    const cartella = async (id: string, nome: string, madre: string | null = null) =>
      db.esegui(
        "INSERT INTO elementi (id, tipo, campi) VALUES (?, 'cartella', ?)",
        id,
        JSON.stringify({ nome, madre, eliminata_il: null, provenienza: null }),
      );
    await cartella("c1", "Lavoro");
    const n = await t.a.creaNota("c1");
    await t.a.salvaNota(n, "Budget", "x");
    await t.a.cestinaNota(n);
    expect((await t.a.elementiCestino())[0]).toMatchObject({
      id: n,
      tipo: "nota",
      nome: "Budget",
      provenienza: "Lavoro",
    });
    expect(await t.a.ripristina(n)).toBeNull();
    expect(await t.a.nota(n)).toMatchObject({ cartella: null, eliminata_il: null });
    // Una cartella nel cestino e un'altra con lo stesso nome nella radice.
    await db.esegui(
      "UPDATE elementi SET campi = ? WHERE id = 'c1'",
      JSON.stringify({
        nome: "Lavoro",
        madre: null,
        eliminata_il: "2026-10-19T08:00:00.000Z",
        provenienza: "",
      }),
    );
    await cartella("c2", "lavoro");
    expect(await t.a.ripristina("c1")).toEqual({ conflitto: "Lavoro" });
    expect(await t.a.ripristina("c1", "numero")).toBeNull();
    expect((await t.a.cartelle()).find((c) => c.id === "c1")).toMatchObject({
      nome: "Lavoro (2)",
      eliminata_il: null,
    });
  });

  it("cestino: eliminare per sempre una cartella toglie il suo contenuto, anche dall'altro dispositivo (RB-55, RB-32)", async () => {
    const telefono = await dispositivo();
    const computer = await dispositivo();
    const db = (telefono.a as unknown as { db: Db }).db;
    const ora = "2026-10-19T08:00:00.000Z";
    const [C1, C2, C3] = ["c1", "c2", "c3"].map((x) => `00000000-0000-4000-8000-0000000000${x}`);
    const metti = async (
      id: string,
      nome: string,
      madre: string | null,
      eliminata: string | null,
    ) => {
      await db.esegui(
        "INSERT OR REPLACE INTO elementi VALUES (?, 'cartella', ?)",
        id,
        JSON.stringify({
          nome,
          madre,
          eliminata_il: eliminata,
          provenienza: eliminata ? "" : null,
        }),
      );
      await db.esegui(
        `INSERT INTO sinc_elementi (id, tipo, modificato, modificato_il) VALUES (?, 'cartella', 1, ?)
         ON CONFLICT(id) DO UPDATE SET modificato = 1, modificato_il = excluded.modificato_il`,
        id,
        new Date().toISOString(),
      );
    };
    // Prima il contenuto, poi «Vecchia» va nel cestino con quello che ha dentro.
    await metti(C1, "Vecchia", null, null);
    await metti(C2, "Dentro", C1, null);
    await metti(C3, "Già nel cestino", C1, ora);
    const n = await telefono.a.creaNota(C2);
    await telefono.a.salvaNota(n, "Dentro la cartella", "x");
    await sinc(telefono);
    await sinc(computer);
    await metti(C1, "Vecchia", null, ora);
    await sinc(telefono);
    await sinc(computer);
    const cestino = await computer.a.elementiCestino();
    expect(cestino.map((e) => e.nome).sort()).toEqual(["Già nel cestino", "Vecchia"]);
    expect(cestino.find((e) => e.nome === "Vecchia")?.conteggio).toBe(1);
    await telefono.a.eliminaDefinitivamente(C1);
    expect((await telefono.a.elementiCestino()).map((e) => e.nome)).toEqual(["Già nel cestino"]);
    expect(await telefono.a.nota(n)).toBeNull();
    await sinc(telefono);
    await sinc(computer);
    expect(await computer.a.nota(n)).toBeNull();
    expect((await computer.a.cartelle()).map((x) => x.nome)).toEqual(["Già nel cestino"]);
    await computer.a.svuotaCestino();
    await sinc(computer);
    await sinc(telefono);
    expect(await telefono.a.elementiCestino()).toEqual([]);
  });

  it("cartelle: nuova con il nome proposto numerato, nome scritto già usato chiede, rinomina e unisce, va nel cestino, e arriva all'altro dispositivo (RB-48, RB-31, RB-63, RB-25)", async () => {
    const t = await dispositivo();
    expect(await t.a.nomeProposto(null)).toBe("Nuova cartella");
    expect(await t.a.creaCartella(null, "Nuova cartella", true)).toBeNull();
    expect(await t.a.nomeProposto(null)).toBe("Nuova cartella (2)");
    expect(await t.a.creaCartella(null, "Nuova cartella", true)).toBeNull();
    expect(await t.a.creaCartella(null, "Lavoro: a/b", false)).toBeNull();
    const nomi = async () => (await t.a.cartelle()).map((c) => c.nome).sort();
    expect(await nomi()).toEqual(["Lavoro- a-b", "Nuova cartella", "Nuova cartella (2)"]);
    expect(await t.a.creaCartella(null, "nuova cartella", false)).toEqual({
      conflitto: "nuova cartella",
    });
    expect(await t.a.creaCartella(null, "nuova cartella", false, "unisci")).toBeNull();
    expect(await nomi()).toHaveLength(3);
    const id = (nome: string) => t.a.cartelle().then((c) => c.find((x) => x.nome === nome)!.id);
    const prima = await id("Nuova cartella");
    const seconda = await id("Nuova cartella (2)");
    const n = await t.a.creaNota(seconda);
    await t.a.salvaNota(n, "Dentro", "x");
    expect(await t.a.rinominaCartella(seconda, "Nuova Cartella")).toEqual({
      conflitto: "Nuova Cartella",
    });
    expect(await t.a.rinominaCartella(seconda, "Nuova Cartella", "unisci")).toBeNull();
    expect(await t.a.nota(n)).toMatchObject({ cartella: prima });
    expect(await nomi()).toEqual(["Lavoro- a-b", "Nuova cartella"]);
    await t.a.spostaNota(n, null);
    expect(await t.a.nota(n)).toMatchObject({ cartella: null });
    await t.a.spostaNota(n, prima);
    const altro = await dispositivo();
    await sinc(t);
    await sinc(altro);
    // Nel cestino va solo la cartella: le note dentro non cambiano e restano con lei.
    await t.a.cestinaCartella(prima);
    expect((await t.a.elementiCestino())[0]).toMatchObject({
      id: prima,
      tipo: "cartella",
      provenienza: "",
      conteggio: 1,
    });
    await sinc(t);
    await sinc(altro);
    expect((await altro.a.cartelle()).map((c) => [c.nome, !!c.eliminata_il]).sort()).toEqual([
      ["Lavoro- a-b", false],
      ["Nuova cartella", true],
    ]);
    expect(await altro.a.nota(n)).toMatchObject({ cartella: prima, titolo: "Dentro" });
  });

  it("cambia la password con quella attuale e poi con la chiave di recupero, che ne dà una nuova (SC-08, RB-98, RB-99)", async () => {
    const t = await dispositivo();
    const nuova = "un'altra frase lunga";
    await expect(
      cambiaPassword(t.s, { attuale: "sbagliata" }, nuova, false, chiama, INDIRIZZO),
    ).rejects.toEqual({ tipo: "verifica" });
    await expect(
      cambiaPassword(t.s, { attuale: PASSWORD }, "corta", false, chiama, INDIRIZZO),
    ).rejects.toMatchObject({ tipo: "password" });
    expect(
      await cambiaPassword(t.s, { attuale: PASSWORD }, nuova, false, chiama, INDIRIZZO),
    ).toEqual({ chiave: null });
    await expect(accedi("manuel@esempio.it", PASSWORD, chiama, INDIRIZZO)).rejects.toBe(
      "credenziali",
    );
    const dopo = await accedi("manuel@esempio.it", nuova, chiama, INDIRIZZO);
    expect(dopo.chiave).toEqual(t.s.chiave);
    const terza = "la terza frase lunga";
    const esito = await cambiaPassword(
      t.s,
      { chiaveRecupero: scriviRecupero(recupero) },
      terza,
      false,
      chiama,
      INDIRIZZO,
    );
    expect(esito.chiave).toMatch(/^[A-Z0-9-]+$/);
    await expect(
      cambiaPassword(
        t.s,
        { chiaveRecupero: scriviRecupero(recupero) },
        nuova,
        false,
        chiama,
        INDIRIZZO,
      ),
    ).rejects.toEqual({ tipo: "verifica" });
    expect((await accedi("manuel@esempio.it", terza, chiama, INDIRIZZO)).chiave).toEqual(
      t.s.chiave,
    );
    // La password nuova usa i parametri veri di Argon2id (64 MiB): qui va più lenta.
  }, 120_000);

  it("dispositivi collegati: questo per primo con il suo nome, l'altro si scollega (SC-09, RB-100)", async () => {
    const t = await dispositivo();
    await mandaNome(t.s, "iPhone", chiama, INDIRIZZO);
    const altro = await dispositivo();
    const elenco = await elencaDispositivi(t.s, chiama, INDIRIZZO);
    expect(elenco.map((d) => [d.nome, d.tipo, d.questo])).toEqual([
      ["iPhone", "ios", true],
      [null, "ios", false],
    ]);
    await scollegaDispositivo(t.s, altro.s.dispositivo, chiama, INDIRIZZO);
    expect(await elencaDispositivi(t.s, chiama, INDIRIZZO)).toHaveLength(1);
  });

  it("Info mostra i tag con il loro percorso, non con l'id; la ricerca li trova per nome (RF-06, RF-08)", async () => {
    const t = await dispositivo();
    const db = (t.a as unknown as { db: Db }).db;
    const tag = (id: string, nome: string, padre: string | null = null) =>
      db.esegui(
        "INSERT INTO elementi (id, tipo, campi) VALUES (?, 'tag', ?)",
        id,
        JSON.stringify({ nome, padre }),
      );
    await tag("t1", "lavoro");
    await tag("t2", "clienti", "t1");
    const n = await t.a.creaNota(null);
    await t.a.salvaNota(n, "Budget", "x");
    const e = await db.prima<{ campi: string }>("SELECT campi FROM elementi WHERE id = ?", n);
    await db.esegui(
      "UPDATE elementi SET campi = ? WHERE id = ?",
      JSON.stringify({ ...JSON.parse(e!.campi), tag: ["t2"] }),
      n,
    );
    expect((await t.a.notaPerInfo(n))?.nota.tag).toEqual(["lavoro/clienti"]);
    const cerca = (testo: string, filtro: string[] = []) =>
      t.a
        .cerca({ testo, tag: filtro, creata: null, modificata: null })
        .then((r) => r.map((x) => x.id));
    expect(await cerca("clienti")).toEqual([n]);
    expect(await cerca("", ["lavoro"])).toEqual([n]);
  });
});
