import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { LIMITE_CORPO_BYTE } from "@memodu/condiviso";
import { LIMITE_PAGINA_BYTE, LIMITE_RICHIESTA_BYTE } from "./costanti.js";
import { credenzialiNelFile, nuoveCredenziali } from "./credenziali.js";
import { daPglite, type Database } from "./database.js";
import { aggiornaSchema, VERSIONE_SCHEMA } from "./schema.js";
import { creaServer } from "./servizio.js";
import { ArchivioSincronizzazione, impronta } from "./sincronizzazione.js";

const A = "7d1c4a52-6b8f-4c1e-9a3d-2f5e8b7c6a10";
const B = "0b9e8d7c-6f5a-4b3c-8d2e-1a0f9e8d7c6b";
const credenziali = nuoveCredenziali("https://memodu.example");

let db: Database;
let orologio: Date;
let sinc: ArchivioSincronizzazione;
let server: FastifyInstance;

// Un solo Postgres in memoria per il file: avviarlo costa; tra una prova e l'altra si svuota.
beforeAll(async () => {
  db = await daPglite();
  await aggiornaSchema(db);
});
afterAll(() => db.chiudi());
beforeEach(async () => {
  await db.esegui("TRUNCATE versioni");
  orologio = new Date("2026-09-30T08:00:00Z");
  sinc = new ArchivioSincronizzazione(db, impronta(credenziali.gettone), () => orologio);
  server = creaServer(sinc);
});
afterEach(() => server.close());

const intestazioni = (gettone = credenziali.gettone, protocollo = "1") => ({
  authorization: `Bearer ${gettone}`,
  "memodu-protocollo": protocollo,
});
const scrivi = (id: string, base: number, dati: string) =>
  server.inject({
    method: "PUT",
    url: `/sincronizzazione/elementi/${id}`,
    headers: intestazioni(),
    payload: { base, dati },
  });
const modifiche = async (dopo = 0) =>
  (
    await server.inject({
      method: "GET",
      url: `/sincronizzazione/modifiche?dopo=${dopo}`,
      headers: intestazioni(),
    })
  ).json<{
    modifiche: { id: string; versione: number; ordine: number; dati: string }[];
    ultimo: number;
    altre: boolean;
    archivio: string;
  }>();

describe("credenziali dell'installazione (CA-14.1, DEC-79, DEC-104)", () => {
  it("il file nasce una volta e non si sovrascrive; il server tiene solo l'impronta", async () => {
    const cartella = await mkdtemp(join(tmpdir(), "memodu-credenziali-"));
    try {
      const file = join(cartella, "credenziali");
      const prime = credenzialiNelFile(file, "http://127.0.0.1:4317");
      expect(JSON.parse(await readFile(file, "utf8"))).toEqual(prime);
      expect(credenzialiNelFile(file, "http://altro")).toEqual(prime);
      expect(impronta(prime.gettone)).toMatch(/^[0-9a-f]{64}$/);
      expect(impronta(prime.gettone)).not.toContain(prime.gettone);
    } finally {
      await rm(cartella, { recursive: true, force: true });
    }
  });

  it("senza gettone valido risponde 401 (RB-57)", async () => {
    const senza = await server.inject({ method: "GET", url: "/sincronizzazione/modifiche" });
    const sbagliato = await server.inject({
      method: "GET",
      url: "/sincronizzazione/modifiche",
      headers: intestazioni("sbagliato"),
    });
    expect([senza.statusCode, sbagliato.statusCode]).toEqual([401, 401]);
  });

  it("senza impronta configurata nessun gettone vale", async () => {
    const senzaImpronta = creaServer(new ArchivioSincronizzazione(db, ""));
    const r = await senzaImpronta.inject({
      method: "GET",
      url: "/sincronizzazione/modifiche",
      headers: intestazioni(),
    });
    expect(r.statusCode).toBe(401);
    await senzaImpronta.close();
  });

  it("con un protocollo diverso risponde 426 (DEC-83)", async () => {
    const r = await server.inject({
      method: "GET",
      url: "/sincronizzazione/modifiche",
      headers: intestazioni(credenziali.gettone, "2"),
    });
    expect(r.statusCode).toBe(426);
  });
});

describe("elementi e versioni (DEC-75, DEC-76)", () => {
  it("scrive partendo dalla versione giusta e rifiuta una versione superata con quella attuale", async () => {
    expect((await scrivi(A, 0, "uno")).json()).toEqual({ versione: 1, ordine: 1 });
    expect((await scrivi(A, 1, "due")).json()).toEqual({ versione: 2, ordine: 2 });
    const conflitto = await scrivi(A, 1, "tre");
    expect(conflitto.statusCode).toBe(409);
    expect(conflitto.json().attuale).toMatchObject({ id: A, versione: 2, dati: "due" });
  });

  it("le modifiche dopo N sono solo le versioni attuali, in ordine, con l'identificativo dell'archivio", async () => {
    await scrivi(A, 0, "a1");
    await scrivi(B, 0, "b1");
    await scrivi(A, 1, "a2");
    const tutte = await modifiche();
    expect(tutte.modifiche.map((m) => [m.id, m.versione, m.dati])).toEqual([
      [B, 1, "b1"],
      [A, 2, "a2"],
    ]);
    expect(tutte.ultimo).toBe(3);
    expect(tutte.altre).toBe(false);
    expect(tutte.archivio).toMatch(/^[0-9a-f-]{36}$/);
    expect((await modifiche(3)).modifiche).toEqual([]);
  });

  it("due scritture insieme sullo stesso elemento: una passa, l'altra trova la versione superata", async () => {
    const [uno, due] = await Promise.all([scrivi(A, 0, "qui"), scrivi(A, 0, "là")]);
    expect([uno.statusCode, due.statusCode].sort()).toEqual([200, 409]);
    const [x, y] = await Promise.all([
      scrivi(B, 0, "b"),
      scrivi("1b4e28ba-2fa1-41d2-883f-0016d3cca427", 0, "c"),
    ]);
    expect([x.json().ordine, y.json().ordine].sort()).toEqual([2, 3]);
  });

  it("un identificativo che non è un UUID è 400", async () => {
    const r = await server.inject({
      method: "PUT",
      url: "/sincronizzazione/elementi/..%2F..%2Fx",
      headers: intestazioni(),
      payload: { base: 0, dati: "x" },
    });
    expect(r.statusCode).toBe(400);
  });

  it("una nota al limite del client sta in una richiesta e in una pagina (DEC-106)", () => {
    // La nota di 4 MB più il blocco intorno, sotto i 4,5 MB di Vercel.
    expect(LIMITE_CORPO_BYTE).toBeLessThan(LIMITE_PAGINA_BYTE + 200_000);
    expect(LIMITE_CORPO_BYTE + 100_000).toBeLessThan(LIMITE_RICHIESTA_BYTE);
    expect(LIMITE_RICHIESTA_BYTE).toBeLessThan(4.5 * 1000 * 1000);
  });

  it("un corpo oltre il limite di Vercel è 413 (DEC-106)", async () => {
    const r = await scrivi(A, 0, "x".repeat(LIMITE_RICHIESTA_BYTE));
    expect(r.statusCode).toBe(413);
  });
});

describe("pagine delle modifiche (DEC-106)", () => {
  it("si fermano prima del limite in byte, con almeno un elemento, e dicono che ce ne sono altre", async () => {
    const ids = [A, B, "1b4e28ba-2fa1-41d2-883f-0016d3cca427"];
    for (const id of ids) await sinc.scrivi(id, 0, "x".repeat(98));
    // Ogni blocco viaggia come 100 byte (98 più le virgolette): ne stanno due in 250.
    const prima = await sinc.modificheDopo(0, 500, 250);
    expect(prima.modifiche.map((m) => m.id)).toEqual([A, B]);
    expect(prima.altre).toBe(true);
    const seconda = await sinc.modificheDopo(prima.ultimo, 500, 250);
    expect(seconda.modifiche.map((m) => m.id)).toEqual([ids[2]]);
    expect(seconda.altre).toBe(false);
    // Un blocco più grande del limite arriva comunque, da solo.
    expect((await sinc.modificheDopo(0, 500, 10)).modifiche).toHaveLength(1);
  });
});

describe("server", () => {
  it("il controllo di salute risponde senza gettone", async () => {
    const r = await server.inject({ method: "GET", url: "/salute" });
    expect([r.statusCode, r.json()]).toEqual([200, { stato: "ok" }]);
  });

  it("con il database rotto /vivo risponde e /salute dice il motivo, senza appendersi", async () => {
    const rotto = creaServer(
      new ArchivioSincronizzazione(
        {
          ...db,
          righe: () => Promise.reject(Object.assign(new Error("no"), { code: "ENOTFOUND" })),
        },
        impronta(credenziali.gettone),
      ),
    );
    const vivo = await rotto.inject({ method: "GET", url: "/vivo" });
    const salute = await rotto.inject({ method: "GET", url: "/salute" });
    expect([vivo.statusCode, salute.statusCode]).toEqual([200, 503]);
    expect(salute.json()).toMatchObject({ motivo: "ENOTFOUND" });
    await rotto.close();
  });

  it("lo schema ha il suo numero di versione e riapplicarlo non cambia niente", async () => {
    await aggiornaSchema(db);
    const [riga] = await db.righe<{ versione: number }>("SELECT versione FROM schema");
    expect(riga?.versione).toBe(VERSIONE_SCHEMA);
  });

  it("un errore interno è 500 senza dettagli", async () => {
    const rotto = creaServer(
      new ArchivioSincronizzazione(
        { ...db, righe: () => Promise.reject(new Error("dettaglio interno")) },
        impronta(credenziali.gettone),
      ),
    );
    const r = await rotto.inject({
      method: "GET",
      url: "/sincronizzazione/modifiche",
      headers: intestazioni(),
    });
    expect(r.statusCode).toBe(500);
    expect(r.body).not.toContain("dettaglio interno");
    await rotto.close();
  });
});

describe("versioni precedenti a scalare (DEC-77, DEC-113, CA-10.11)", () => {
  it("tutte nell'ultima ora, una all'ora nel giorno, una al giorno per 7 giorni", async () => {
    const inizio = Date.parse("2026-08-01T00:00:00Z");
    let versione = 0;
    // Una versione ogni 20 minuti per 10 giorni.
    for (let t = inizio; t < inizio + 10 * 86400000; t += 20 * 60000) {
      orologio = new Date(t);
      await sinc.scrivi(A, versione, `v${versione + 1}`);
      versione++;
    }
    const ora = orologio.getTime();
    const tenute = (await sinc.versioni(A)).map((v) => ora - Date.parse(v.ora));
    expect(tenute[0]).toBe(0);
    // Nell'ultima ora ci sono tutte: la attuale e le due di 20 e 40 minuti prima.
    expect(tenute.filter((e) => e <= 3600000)).toHaveLength(4);
    // Nessuna oltre i 7 giorni, e al massimo una per giorno oltre le 24 ore.
    expect(Math.max(...tenute)).toBeLessThanOrEqual(7 * 86400000);
    expect(Math.max(...tenute)).toBeGreaterThan(6 * 86400000);
    expect(tenute.filter((e) => e > 86400000).length).toBeLessThanOrEqual(7);
    expect(tenute.length).toBeLessThan(40);
  }, 120000);
});
