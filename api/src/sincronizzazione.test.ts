import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { creaServer } from "./app.ts";
import { ArchivioNote } from "./archivio.ts";
import { ArchivioSincronizzazione, type Credenziali } from "./sincronizzazione.ts";

const A = "7d1c4a52-6b8f-4c1e-9a3d-2f5e8b7c6a10";
const B = "0b9e8d7c-6f5a-4b3c-8d2e-1a0f9e8d7c6b";

let cartella: string;
let orologio: Date;
let sinc: ArchivioSincronizzazione;
let archivio: ArchivioNote;
let server: FastifyInstance;
let credenziali: Credenziali;

beforeEach(async () => {
  cartella = await mkdtemp(join(tmpdir(), "memodu-sinc-"));
  orologio = new Date("2026-09-30T08:00:00Z");
  sinc = new ArchivioSincronizzazione(cartella, () => orologio);
  credenziali = sinc.preparaCredenziali("http://127.0.0.1:4317")!;
  archivio = new ArchivioNote(cartella);
  server = creaServer(archivio, sinc);
});
afterEach(async () => {
  await server.close();
  archivio.chiudi();
  sinc.chiudi();
  await rm(cartella, { recursive: true, force: true });
});

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
  }>();

describe("credenziali dell'installazione (CA-14.1, DEC-79)", () => {
  it("nascono una volta, nel file dell'app, e il server tiene solo l'impronta del gettone", async () => {
    const file = JSON.parse(await readFile(join(cartella, "credenziali"), "utf8")) as Credenziali;
    expect(file).toEqual(credenziali);
    expect(sinc.preparaCredenziali("http://altro")).toBeNull();
    const indice = await readFile(join(cartella, "sincronizzazione", "indice.db"));
    expect(indice.includes(Buffer.from(credenziali.gettone))).toBe(false);
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

  it("le modifiche dopo N sono solo le versioni attuali, in ordine", async () => {
    await scrivi(A, 0, "a1");
    await scrivi(B, 0, "b1");
    await scrivi(A, 1, "a2");
    const tutte = await modifiche();
    expect(tutte.modifiche.map((m) => [m.id, m.versione, m.dati])).toEqual([
      [B, 1, "b1"],
      [A, 2, "a2"],
    ]);
    expect(tutte.ultimo).toBe(3);
    expect((await modifiche(3)).modifiche).toEqual([]);
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
});

describe("versioni precedenti a scalare (DEC-77, CA-10.11)", () => {
  it("tutte nell'ultima ora, una all'ora nel giorno, una al giorno per 30 giorni", () => {
    const inizio = Date.parse("2026-08-01T00:00:00Z");
    let versione = 0;
    const alle = (ms: number) => {
      orologio = new Date(ms);
      sinc.scrivi(A, versione, `v${versione + 1}`);
      versione++;
    };
    // Una versione ogni 20 minuti per 40 giorni.
    for (let t = inizio; t < inizio + 40 * 86400000; t += 20 * 60000) alle(t);
    const ora = orologio.getTime();
    const tenute = sinc.versioni(A).map((v) => ora - Date.parse(v.ora));
    expect(tenute[0]).toBe(0);
    // Nell'ultima ora ci sono tutte: la attuale e le due di 20 e 40 minuti prima.
    expect(tenute.filter((e) => e <= 3600000)).toHaveLength(4);
    // Nessuna oltre i 30 giorni, e al massimo una per giorno oltre le 24 ore.
    expect(Math.max(...tenute)).toBeLessThanOrEqual(30 * 86400000);
    const giorni = tenute.filter((e) => e > 86400000);
    expect(giorni.length).toBeLessThanOrEqual(30);
    expect(sinc.versioni(A).length).toBeLessThan(100);
  });
});
