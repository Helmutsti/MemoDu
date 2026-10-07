import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { Accesso, DURATA_GETTONE_MS, righeVariabili, utenteDaAmbiente } from "./accesso.js";
import {
  SCOPI,
  chiaveDatiDaRecupero,
  creaUtente,
  daPassword,
  leggiRecupero,
  problemaPassword,
  scriviRecupero,
  type ParametriArgon2,
} from "./chiavi.js";
import { daPglite, type Database } from "./database.js";
import { aggiornaSchema } from "./schema.js";
import { creaServer } from "./servizio.js";
import { ArchivioSincronizzazione } from "./sincronizzazione.js";
import { svolgi } from "./xchacha.js";

// Argon2id leggero nelle prove: i passi sono gli stessi, cambia solo il costo.
const LEGGERO: ParametriArgon2 = { memoria: 1024, passaggi: 1, fili: 1 };
const PASSWORD = "una frase lunga e mia";
const SEGRETO = Buffer.alloc(32, 7).toString("base64url");
const { dati, recupero } = creaUtente("Manuel@Esempio.it", PASSWORD, {}, LEGGERO);
const provaGiusta = () =>
  daPassword(PASSWORD, Buffer.from(dati.sale, "base64url"), LEGGERO).prova.toString("base64url");

let orologio: Date;
let accesso: Accesso;
beforeEach(() => {
  orologio = new Date("2026-10-06T08:00:00Z");
  accesso = new Accesso(dati, SEGRETO, () => orologio);
});

describe("chiavi dell'utente (DEC-121)", () => {
  it("dalla password giusta si apre la chiave dati, ed è la stessa della chiave di recupero", () => {
    const p = daPassword(PASSWORD, Buffer.from(dati.sale, "base64url"), LEGGERO);
    const daPw = svolgi(p.cassaforte, dati.chiavePassword, SCOPI.chiaveDatiPassword);
    expect(daPw).toHaveLength(32);
    expect(chiaveDatiDaRecupero(dati, recupero).equals(daPw)).toBe(true);
  });

  it("con la chiave di recupero una password nuova tiene la stessa chiave dati (RB-90)", () => {
    const chiaveDati = chiaveDatiDaRecupero(dati, recupero);
    const { dati: nuovi } = creaUtente(
      dati.email,
      "un'altra frase lunga",
      { chiaveDati, recupero },
      LEGGERO,
    );
    const p = daPassword("un'altra frase lunga", Buffer.from(nuovi.sale, "base64url"), LEGGERO);
    expect(
      svolgi(p.cassaforte, nuovi.chiavePassword, SCOPI.chiaveDatiPassword).equals(chiaveDati),
    ).toBe(true);
    expect(nuovi.improntaAccesso).not.toBe(dati.improntaAccesso);
  });

  it("una chiave di recupero sbagliata non apre niente", () => {
    expect(() => chiaveDatiDaRecupero(dati, Buffer.alloc(32, 1))).toThrow("non è quella");
  });

  it("la chiave di recupero si stampa in gruppi e si rilegge anche in minuscolo", () => {
    const testo = scriviRecupero(recupero);
    expect(testo).toMatch(/^([A-Z2-9]{4}-){12}[A-Z2-9]{4}$/);
    expect(leggiRecupero(testo.toLowerCase().replace(/-/g, " ")).equals(recupero)).toBe(true);
    expect(() => leggiRecupero(testo.slice(0, -1))).toThrow();
  });

  it("la password: almeno 12 caratteri e non tra le più comuni (RB-88)", () => {
    expect(problemaPassword("corta12345")).toContain("12 caratteri");
    expect(problemaPassword("Password1234")).toContain("più usate");
    expect(problemaPassword("zzzzzzzzzzzzzz")).toContain("più usate");
    expect(problemaPassword("àèìòù àèìòù xy")).toBeNull();
    expect(problemaPassword(PASSWORD)).toBeNull();
  });

  it("le righe stampate si rileggono come variabili d'ambiente", () => {
    const env = Object.fromEntries(
      righeVariabili(dati, SEGRETO)
        .split("\n")
        .map((r) => r.split(/=(.*)/s).slice(0, 2)),
    );
    expect(utenteDaAmbiente(env)).toEqual({ dati, segreto: SEGRETO });
    expect(utenteDaAmbiente({})).toBeNull();
    expect(() => utenteDaAmbiente({ MEMODU_EMAIL: "a@b.it" })).toThrow("mancano");
  });
});

describe("accesso dell'utente fisso", () => {
  it("con email e prova giuste dà il gettone e la chiave dati avvolta; l'email è senza maiuscole", () => {
    const esito = accesso.accedi(" MANUEL@esempio.it ", provaGiusta());
    expect(esito?.chiave).toBe(dati.chiavePassword);
    expect(accesso.autorizzato(esito?.gettone)).toBe(true);
    expect(esito?.scade_il).toBe(new Date(orologio.getTime() + DURATA_GETTONE_MS).toISOString());
  });

  it("con email o prova sbagliate niente, senza dire quale delle due", () => {
    expect(accesso.accedi("altro@esempio.it", provaGiusta())).toBeNull();
    expect(accesso.accedi(dati.email, Buffer.alloc(32).toString("base64url"))).toBeNull();
  });

  it("un'email sconosciuta riceve un sale finto ma sempre uguale", () => {
    const a = accesso.parametri("nessuno@esempio.it");
    expect(a).toEqual(accesso.parametri("nessuno@esempio.it"));
    expect(a.sale).not.toBe(dati.sale);
    expect(accesso.parametri("manuel@esempio.it").sale).toBe(dati.sale);
  });

  it("il gettone scade dopo 30 giorni e si rinnova solo finché vale", () => {
    const { gettone } = accesso.accedi(dati.email, provaGiusta())!;
    orologio = new Date(orologio.getTime() + DURATA_GETTONE_MS - 1000);
    const rinnovato = accesso.rinnova(gettone);
    expect(accesso.autorizzato(rinnovato?.gettone)).toBe(true);
    orologio = new Date(orologio.getTime() + 2000);
    expect(accesso.autorizzato(gettone)).toBe(false);
    expect(accesso.rinnova(gettone)).toBeNull();
  });

  it("un gettone firmato con un altro segreto o ritoccato non vale (revoca)", () => {
    const { gettone } = accesso.accedi(dati.email, provaGiusta())!;
    const altro = new Accesso(dati, Buffer.alloc(32, 9).toString("base64url"), () => orologio);
    expect(altro.autorizzato(gettone)).toBe(false);
    const [t, c, f] = gettone.split(".");
    const corpo = Buffer.from(JSON.stringify({ sub: dati.email, exp: 9999999999 })).toString(
      "base64url",
    );
    expect(accesso.autorizzato(`${t}.${corpo}.${f}`)).toBe(false);
    expect(accesso.autorizzato(`${t}.${c}`)).toBe(false);
  });
});

describe("richieste dell'accesso e sincronizzazione", () => {
  let db: Database;
  let server: FastifyInstance;
  beforeAll(async () => {
    db = await daPglite();
    await aggiornaSchema(db);
  });
  afterAll(() => db.chiudi());
  beforeEach(() => {
    server = creaServer(new ArchivioSincronizzazione(db), accesso);
  });
  afterEach(() => server.close());

  const post = (url: string, corpo?: object, gettone?: string, protocollo = "1") =>
    server.inject({
      method: "POST",
      url,
      headers: {
        "memodu-protocollo": protocollo,
        ...(gettone ? { authorization: `Bearer ${gettone}` } : {}),
      },
      ...(corpo ? { payload: corpo } : {}),
    });
  const modifiche = (gettone: string) =>
    server.inject({
      method: "GET",
      url: "/sincronizzazione/modifiche",
      headers: { authorization: `Bearer ${gettone}`, "memodu-protocollo": "1" },
    });

  it("parametri, accesso e sincronizzazione con il gettone ricevuto", async () => {
    const p = await post("/accesso/parametri", { email: "manuel@esempio.it" });
    expect(p.json()).toEqual({ sale: dati.sale, argon2: LEGGERO });
    const a = await post("/accesso", { email: "manuel@esempio.it", prova: provaGiusta() });
    expect(a.statusCode).toBe(200);
    expect((await modifiche(a.json().gettone)).statusCode).toBe(200);
    const r = await post("/accesso/rinnovo", undefined, a.json().gettone);
    expect(r.statusCode).toBe(200);
    expect(r.json().chiave).toBeUndefined();
  });

  it("prova sbagliata: 401 senza dettagli; prova malformata: 400; protocollo diverso: 426", async () => {
    const a = await post("/accesso", {
      email: "manuel@esempio.it",
      prova: Buffer.alloc(32).toString("base64url"),
    });
    expect(a.statusCode).toBe(401);
    expect(a.json().message).toBe("Credenziali non valide");
    expect(
      (await post("/accesso", { email: "manuel@esempio.it", prova: "corta" })).statusCode,
    ).toBe(400);
    expect((await post("/accesso/parametri", { email: "a@b.it" }, undefined, "2")).statusCode).toBe(
      426,
    );
  });

  it("vale solo il JWT dell'accesso: un gettone qualsiasi è 401 (DEC-121)", async () => {
    expect((await modifiche(Buffer.alloc(32, 1).toString("base64url"))).statusCode).toBe(401);
    expect((await modifiche("sbagliato")).statusCode).toBe(401);
    const { gettone } = accesso.accedi(dati.email, provaGiusta())!;
    expect((await modifiche(gettone)).statusCode).toBe(200);
  });
});
