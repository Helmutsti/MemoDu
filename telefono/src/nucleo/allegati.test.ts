// Allegati sul telefono (RF-18, DEC-169; TC-257 … TC-259 dal lato del nucleo) contro il server
// vero (api/src) in memoria, con il deposito finto in una cartella temporanea come nelle prove
// del server: allegare, caricare, ricevere su un altro dispositivo, scaricare, togliere.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { FastifyInstance } from "fastify";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Accesso } from "../../../api/src/accesso.js";
import { DepositoLocale } from "../../../api/src/allegati.js";
import { creaUtente } from "../../../api/src/chiavi.js";
import { daPglite, type Database } from "../../../api/src/database.js";
import { aggiornaSchema } from "../../../api/src/schema.js";
import { creaServer } from "../../../api/src/servizio.js";
import { ArchivioSincronizzazione } from "../../../api/src/sincronizzazione.js";
import { accedi, type Sessione } from "./accesso";
import {
  AllegatoRifiutato,
  AVVISO_GRANDE,
  AVVISO_NON_DISPONIBILE,
  AVVISO_TIPO,
  daBase64,
  inBase64,
  LIMITE_BYTE,
  tipoDelFile,
  type Disco,
} from "./allegati";
import { Archivio } from "./archivio";
import type { Db, Valore } from "./db";
import { fileSulTelefono, giroAllegati } from "./filoAllegati";
import { sincronizza } from "./sinc";

const LEGGERO = { memoria: 1024, passaggi: 1, fili: 1 };
const PASSWORD = "una frase lunga e mia";
const SEGRETO = Buffer.alloc(32, 7).toString("base64url");
const { dati } = creaUtente("manuel@esempio.it", PASSWORD, {}, LEGGERO);
const INDIRIZZO = "http://prova";
const DEPOSITO = "http://memodu.local";

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

/** I file del telefono in memoria. */
function discoDiProva(): Disco & { file: Map<string, Uint8Array> } {
  const file = new Map<string, Uint8Array>();
  return {
    file,
    leggi: async (p) => file.get(p) ?? null,
    scrivi: async (p, b) => void file.set(p, b),
    esiste: async (p) => file.has(p),
    togli: async (p) => {
      for (const k of [...file.keys()]) if (k === p || k.startsWith(`${p}/`)) file.delete(k);
    },
    indirizzo: (p) => `file:///prova/${p}`,
  };
}

let pg: Database;
let server: FastifyInstance;
let cartella: string;
/** fetch che passa per il server in memoria, anche per gli indirizzi firmati del deposito. */
const chiama: typeof fetch = async (url, init) => {
  const u = new URL(String(url));
  const corpo = init?.body;
  const r = await server.inject({
    method: (init?.method ?? "GET") as "GET",
    url: u.pathname + u.search,
    headers: Object.fromEntries(
      Object.entries((init?.headers as Record<string, string>) ?? {}).map(([k, v]) => [
        k.toLowerCase(),
        v,
      ]),
    ),
    ...(corpo instanceof Uint8Array
      ? { payload: Buffer.from(corpo) }
      : corpo
        ? { payload: String(corpo) }
        : {}),
  });
  return new Response(r.statusCode === 204 ? null : new Uint8Array(r.rawPayload), {
    status: r.statusCode,
  });
};

beforeAll(async () => {
  pg = await daPglite();
  await aggiornaSchema(pg);
});
afterAll(() => pg.chiudi());
beforeEach(async () => {
  await pg.esegui("TRUNCATE utenti CASCADE");
  await pg.esegui("TRUNCATE allegati");
  cartella = mkdtempSync(join(tmpdir(), "memodu-telefono-allegati-"));
  const accesso = new Accesso(pg, SEGRETO);
  await accesso.creaAccount(dati);
  server = creaServer(new ArchivioSincronizzazione(pg), accesso, {
    db: pg,
    deposito: new DepositoLocale(cartella, DEPOSITO, SEGRETO),
  });
});
afterEach(async () => {
  await server.close();
  rmSync(cartella, { recursive: true, force: true });
});

const riduci = async (byte: Uint8Array) => ({
  jpeg: new Uint8Array([0xff, 0xd8, 0xff, byte.length % 256]),
  larghezza: 4000,
  altezza: 3000,
});

async function dispositivo() {
  const s: Sessione = await accedi("manuel@esempio.it", PASSWORD, chiama, INDIRIZZO);
  const a = await Archivio.apri(dbDiProva());
  const disco = discoDiProva();
  a.usaFile(disco, riduci);
  return { a, s, disco };
}
type Dispositivo = Awaited<ReturnType<typeof dispositivo>>;
const sinc = (d: Dispositivo) => sincronizza(d.a, d.s, chiama, INDIRIZZO);
const giro = (d: Dispositivo, anteprime = new Set<string>()) =>
  giroAllegati(d.a, d.s, anteprime, chiama, INDIRIZZO);

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37, 10, 1, 2, 3]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 9, 8, 7, 6, 5]);
const segno = (id: string, f: string, nome: string) =>
  `<allegato id="${id}" f="${f}">${nome}</allegato>`;

describe("allegati sul telefono (DEC-169)", () => {
  it("riconosce i tipi dai primi byte e l'anteprima passa in base64 senza perdere niente", () => {
    expect(tipoDelFile("Preventivo.PDF", PDF)).toBe("pdf");
    expect(tipoDelFile("finto.pdf", JPG)).toBeNull();
    expect(tipoDelFile("cantiere.jpeg", JPG)).toBe("jpg");
    expect(tipoDelFile("archivio.zip", PDF)).toBeNull();
    for (const n of [0, 1, 2, 3, 10]) {
      const b = Uint8Array.from({ length: n }, (_, i) => (i * 37) % 256);
      expect(daBase64(inBase64(b))).toEqual(b);
    }
    expect(inBase64(new Uint8Array([1, 2, 3, 4]))).toBe(
      Buffer.from([1, 2, 3, 4]).toString("base64"),
    );
  });

  it("un file troppo grande o di un tipo non ammesso non entra, con il testo del computer (RB-115)", async () => {
    const t = await dispositivo();
    await expect(t.a.allega("grande.pdf", new Uint8Array(LIMITE_BYTE + 1))).rejects.toThrow(
      new AllegatoRifiutato(AVVISO_GRANDE),
    );
    await expect(t.a.allega("cose.zip", PDF)).rejects.toThrow(AVVISO_TIPO);
    expect(t.disco.file.size).toBe(0);
  });

  it("allegato qui, caricato, arriva all'altro dispositivo che scarica anteprima e file; tolto, sparisce ovunque (RB-118, RB-121)", async () => {
    const t = await dispositivo();
    const pdf = await t.a.allega("Preventivo serra.pdf", PDF);
    const foto = await t.a.allega("cantiere.jpg", JPG);
    expect([pdf.forma, foto.forma]).toEqual(["documento", "piccola"]);
    // Lo stesso file con lo stesso nome è lo stesso allegato.
    expect((await t.a.allega("cantiere.jpg", JPG)).id).toBe(foto.id);
    expect((await t.a.leggiAllegato(foto.id))?.anteprima).toMatch(/^data:image\/jpeg;base64,/);
    const n = await t.a.creaNota(null, true);
    await t.a.salvaNota(
      n,
      "",
      `Ho mandato ${segno(pdf.id, "documento", pdf.nome)} e\n${segno(foto.id, "piccola", foto.nome)}`,
    );
    await sinc(t);
    expect(await giro(t)).toEqual([]);
    expect(await t.a.allegatiConStato("da_caricare")).toEqual([]);

    const altro = await dispositivo();
    await sinc(altro);
    const info = await altro.a.leggiAllegato(foto.id);
    expect(info).toMatchObject({ nome: "cantiere.jpg", tipo: "jpg", anteprima: null });
    expect(await giro(altro, new Set([foto.id]))).toEqual([foto.id]);
    expect((await altro.a.leggiAllegato(foto.id))?.anteprima).not.toBeNull();
    const percorso = await fileSulTelefono(altro.a, altro.s, pdf.id, chiama, INDIRIZZO);
    expect(altro.disco.file.get(percorso)).toEqual(PDF);

    // Togli: alla pulizia il blocco se ne va e il server cancella il file.
    await t.a.salvaNota(n, "", `Ho mandato ${segno(pdf.id, "documento", pdf.nome)} e`);
    expect(await t.a.pulisciAllegati()).toBe(1);
    expect(await t.a.leggiAllegato(foto.id)).toBeNull();
    expect([...t.disco.file.keys()].some((k) => k.includes(foto.id))).toBe(false);
    await sinc(t);
    await giro(t);
    expect(await t.a.allegatiConStato("da_cancellare")).toEqual([]);
    await sinc(altro);
    await giro(altro);
    expect(await altro.a.leggiAllegato(foto.id)).toBeNull();
    expect([...altro.disco.file.keys()].some((k) => k.includes(foto.id))).toBe(false);
    // Il PDF, ancora nel testo, resta.
    expect(await altro.a.leggiAllegato(pdf.id)).not.toBeNull();
  });

  it("un allegato che non entra nel testo se ne va alla pulizia; quello di una nota nel Cestino resta", async () => {
    const t = await dispositivo();
    const sciolto = await t.a.allega("nota.txt", new TextEncoder().encode("ciao"));
    const tenuto = await t.a.allega("Preventivo.pdf", PDF);
    const n = await t.a.creaNota(null);
    await t.a.salvaNota(n, "Spesa", segno(tenuto.id, "documento", tenuto.nome));
    await t.a.cestinaNota(n);
    expect(await t.a.pulisciAllegati()).toBe(1);
    expect(await t.a.leggiAllegato(sciolto.id)).toBeNull();
    expect(await t.a.leggiAllegato(tenuto.id)).not.toBeNull();
    // Eliminata per sempre, anche l'allegato se ne va.
    await t.a.eliminaDefinitivamente(n);
    expect(await t.a.pulisciAllegati()).toBe(1);
    expect(await t.a.leggiAllegato(tenuto.id)).toBeNull();
  });

  it("senza l'allegato sul server «Apri» dice che non è più disponibile (SF-20)", async () => {
    const t = await dispositivo();
    await expect(fileSulTelefono(t.a, t.s, "nessuno", chiama, INDIRIZZO)).rejects.toThrow(
      AVVISO_NON_DISPONIBILE,
    );
  });
});
