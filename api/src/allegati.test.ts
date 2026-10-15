// Prove degli allegati di Brainet (RF-18, DEC-135; TC-216 … TC-224 dal lato del server), con il
// deposito finto in una cartella temporanea.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FastifyInstance } from "fastify";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Accesso } from "./accesso.js";
import { DepositoLocale, DepositoR2, LIMITE_ALLEGATO_BYTE, r2DaAmbiente } from "./allegati.js";
import { creaUtente, daPassword, type ParametriArgon2 } from "./chiavi.js";
import { daPglite, type Database } from "./database.js";
import { aggiornaSchema } from "./schema.js";
import { creaServer } from "./servizio.js";
import { ArchivioSincronizzazione } from "./sincronizzazione.js";

const LEGGERO: ParametriArgon2 = { memoria: 1024, passaggi: 1, fili: 1 };
const SEGRETO = Buffer.alloc(32, 7).toString("base64url");
const ID = "7d1c4a52-6b8f-4c1e-9a3d-2f5e8b7c6a10";

async function account(accesso: Accesso, email: string): Promise<string> {
  const { dati } = creaUtente(email, "una frase lunga e mia", {}, LEGGERO);
  const prova = daPassword(
    "una frase lunga e mia",
    Buffer.from(dati.sale, "base64url"),
    LEGGERO,
  ).prova.toString("base64url");
  await accesso.creaAccount(dati);
  return (await accesso.accedi(dati.email, prova, "windows"))!.gettone;
}

let db: Database;
let accesso: Accesso;
let gettoneA: string;
let gettoneB: string;
let cartella: string;
let deposito: DepositoLocale;
let server: FastifyInstance;

beforeAll(async () => {
  db = await daPglite();
  await aggiornaSchema(db);
  accesso = new Accesso(db, SEGRETO);
  gettoneA = await account(accesso, "a@memodu.example");
  gettoneB = await account(accesso, "b@memodu.example");
});
afterAll(() => db.chiudi());
beforeEach(async () => {
  await db.esegui("TRUNCATE allegati");
  cartella = mkdtempSync(join(tmpdir(), "memodu-allegati-"));
  deposito = new DepositoLocale(cartella, "http://memodu.local", SEGRETO);
  server = creaServer(new ArchivioSincronizzazione(db), accesso, { db, deposito });
});
afterEach(async () => {
  await server.close();
  rmSync(cartella, { recursive: true, force: true });
});

const intestazioni = (g: string) => ({ authorization: `Bearer ${g}`, "memodu-protocollo": "1" });
const percorso = (indirizzo: string) => indirizzo.replace("http://memodu.local", "");

async function carica(g: string, byte: Buffer, anteprima?: Buffer) {
  const r = await server.inject({
    method: "POST",
    url: `/allegati/${ID}/caricamento`,
    headers: intestazioni(g),
    payload: { grandezza: byte.length, anteprima: anteprima?.length ?? 0 },
  });
  expect(r.statusCode).toBe(200);
  const { file, anteprima: perAnteprima } = r.json<{ file: string; anteprima: string | null }>();
  const put = (indirizzo: string, corpo: Buffer) =>
    server.inject({
      method: "PUT",
      url: percorso(indirizzo),
      headers: { "content-type": "application/octet-stream" },
      payload: corpo,
    });
  expect((await put(file, byte)).statusCode).toBe(200);
  if (anteprima) expect((await put(perAnteprima!, anteprima)).statusCode).toBe(200);
  return server.inject({ method: "POST", url: `/allegati/${ID}/fatto`, headers: intestazioni(g) });
}

describe("allegati sul server (DEC-135)", () => {
  it("carica, finisce, scarica e cancella; il file resta com'è arrivato (cifrato)", async () => {
    const byte = Buffer.from("contenuto cifrato del dispositivo");
    const anteprima = Buffer.from("anteprima cifrata");
    expect((await carica(gettoneA, byte, anteprima)).statusCode).toBe(204);
    const s = await server.inject({
      method: "GET",
      url: `/allegati/${ID}/scaricamento`,
      headers: intestazioni(gettoneA),
    });
    expect(s.statusCode).toBe(200);
    const { file, anteprima: a } = s.json<{ file: string; anteprima: string }>();
    expect((await server.inject({ method: "GET", url: percorso(file) })).rawPayload).toEqual(byte);
    expect((await server.inject({ method: "GET", url: percorso(a) })).rawPayload).toEqual(
      anteprima,
    );
    const d = await server.inject({
      method: "DELETE",
      url: `/allegati/${ID}`,
      headers: intestazioni(gettoneA),
    });
    expect(d.statusCode).toBe(204);
    expect(
      await deposito.grandezza(`${(await accesso.autorizza(gettoneA))!.utente}/${ID}`),
    ).toBeNull();
    const dopo = await server.inject({
      method: "GET",
      url: `/allegati/${ID}/scaricamento`,
      headers: intestazioni(gettoneA),
    });
    expect(dopo.statusCode).toBe(404);
    // Cancellare di nuovo va bene (SF-20).
    expect(
      (
        await server.inject({
          method: "DELETE",
          url: `/allegati/${ID}`,
          headers: intestazioni(gettoneA),
        })
      ).statusCode,
    ).toBe(204);
  });

  it("oltre 25 MB rifiuta con 413 (RB-115)", async () => {
    const r = await server.inject({
      method: "POST",
      url: `/allegati/${ID}/caricamento`,
      headers: intestazioni(gettoneA),
      payload: { grandezza: LIMITE_ALLEGATO_BYTE + 1, anteprima: 0 },
    });
    expect(r.statusCode).toBe(413);
  });

  it("un file arrivato a metà non è presente (SF-08)", async () => {
    const r = await server.inject({
      method: "POST",
      url: `/allegati/${ID}/caricamento`,
      headers: intestazioni(gettoneA),
      payload: { grandezza: 100, anteprima: 0 },
    });
    const { file } = r.json<{ file: string }>();
    await server.inject({
      method: "PUT",
      url: percorso(file),
      headers: { "content-type": "application/octet-stream" },
      payload: Buffer.alloc(40),
    });
    const f = await server.inject({
      method: "POST",
      url: `/allegati/${ID}/fatto`,
      headers: intestazioni(gettoneA),
    });
    expect(f.statusCode).toBe(409);
    const s = await server.inject({
      method: "GET",
      url: `/allegati/${ID}/scaricamento`,
      headers: intestazioni(gettoneA),
    });
    expect(s.statusCode).toBe(404);
  });

  it("un altro account non vede gli allegati (SF-34); senza gettone 401", async () => {
    await carica(gettoneA, Buffer.from("di A"));
    const b = await server.inject({
      method: "GET",
      url: `/allegati/${ID}/scaricamento`,
      headers: intestazioni(gettoneB),
    });
    expect(b.statusCode).toBe(404);
    const senza = await server.inject({ method: "GET", url: `/allegati/${ID}/scaricamento` });
    expect(senza.statusCode).toBe(401);
  });

  it("una firma sbagliata o scaduta non apre il deposito", async () => {
    await carica(gettoneA, Buffer.from("di A"));
    const s = await server.inject({
      method: "GET",
      url: `/allegati/${ID}/scaricamento`,
      headers: intestazioni(gettoneA),
    });
    const { file } = s.json<{ file: string }>();
    const falso = percorso(file).replace(/firma=[^&]+/, "firma=falsa");
    expect((await server.inject({ method: "GET", url: falso })).statusCode).toBe(403);
    const scaduto = percorso(file).replace(/scade=\d+/, "scade=1");
    expect((await server.inject({ method: "GET", url: scaduto })).statusCode).toBe(403);
  });

  it("senza deposito le richieste degli allegati rispondono 503", async () => {
    const senza = creaServer(new ArchivioSincronizzazione(db), accesso);
    const r = await senza.inject({
      method: "POST",
      url: `/allegati/${ID}/caricamento`,
      headers: intestazioni(gettoneA),
      payload: { grandezza: 10, anteprima: 0 },
    });
    expect(r.statusCode).toBe(503);
    await senza.close();
  });
});

describe("indirizzi di Cloudflare R2", () => {
  it("firma con la query di S3, per 15 minuti, sul bucket giusto", async () => {
    const r2 = new DepositoR2("conto", "CHIAVE", "segreto", "memodu");
    const u = new URL(await r2.perCaricare(`utente/${ID}`));
    expect(u.host).toBe("conto.r2.cloudflarestorage.com");
    expect(u.pathname).toBe(`/memodu/utente/${ID}`);
    expect(u.searchParams.get("X-Amz-Expires")).toBe("900");
    expect(u.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
    expect(u.searchParams.get("X-Amz-Credential")).toContain("CHIAVE/");
  });

  it("senza tutte e quattro le variabili non c'è R2", () => {
    expect(
      r2DaAmbiente({ MEMODU_R2_ACCOUNT: "a", MEMODU_R2_CHIAVE: "b", MEMODU_R2_SEGRETO: "c" }),
    ).toBeNull();
    expect(
      r2DaAmbiente({
        MEMODU_R2_ACCOUNT: "a",
        MEMODU_R2_CHIAVE: "b",
        MEMODU_R2_SEGRETO: "c",
        MEMODU_R2_BUCKET: "d",
      }),
    ).toBeInstanceOf(DepositoR2);
  });
});
