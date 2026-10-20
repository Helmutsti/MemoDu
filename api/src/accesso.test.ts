import { problemaPassword as problemaCondiviso } from "@memodu/condiviso";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { Accesso, utenteFissoDaAmbiente } from "./accesso.js";
import {
  SCOPI,
  chiaveDatiDaRecupero,
  creaUtente,
  daPassword,
  daRecupero,
  leggiRecupero,
  problemaPassword,
  scriviRecupero,
  type DatiUtente,
  type ParametriArgon2,
} from "./chiavi.js";
import { daPglite, type Database } from "./database.js";
import { aggiornaSchema } from "./schema.js";
import { creaServer } from "./servizio.js";
import { ArchivioSincronizzazione } from "./sincronizzazione.js";
import { avvolgi, svolgi } from "./xchacha.js";

// Argon2id leggero nelle prove: i passi sono gli stessi, cambia solo il costo.
const LEGGERO: ParametriArgon2 = { memoria: 1024, passaggi: 1, fili: 1 };
const PASSWORD = "una frase lunga e mia";
const NUOVA = "un'altra frase lunga";
const SEGRETO = Buffer.alloc(32, 7).toString("base64url");
const { dati, recupero } = creaUtente("Manuel@Esempio.it", PASSWORD, {}, LEGGERO);
const b64 = (b: Buffer) => b.toString("base64url");
const provaDi = (password: string, d: DatiUtente = dati) =>
  b64(daPassword(password, Buffer.from(d.sale, "base64url"), LEGGERO).prova);
const chiaveDati = chiaveDatiDaRecupero(dati, recupero);

/** Ciò che il dispositivo calcola per una password nuova, con la stessa chiave dati (FL-14). */
function nuovaPassword(password: string, conRecupero = false) {
  const { dati: d, recupero: r } = creaUtente(
    dati.email,
    password,
    conRecupero ? { chiaveDati } : { chiaveDati, recupero },
    LEGGERO,
  );
  return {
    nuova: {
      sale: d.sale,
      argon2: d.argon2,
      prova: provaDi(password, d),
      chiave: d.chiavePassword,
    },
    recupero_nuovo: { prova: b64(daRecupero(r).prova), chiave: d.chiaveRecupero },
    recupero: r,
  };
}

describe("chiavi dell'utente (DEC-121)", () => {
  it("dalla password giusta si apre la chiave dati, ed è la stessa della chiave di recupero", () => {
    const p = daPassword(PASSWORD, Buffer.from(dati.sale, "base64url"), LEGGERO);
    const daPw = svolgi(p.cassaforte, dati.chiavePassword, SCOPI.chiaveDatiPassword);
    expect(daPw).toHaveLength(32);
    expect(chiaveDati.equals(daPw)).toBe(true);
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
    // Il telefono usa la copia del pacchetto condiviso: deve dire le stesse cose.
    for (const p of [
      "corta12345",
      "Password1234",
      "zzzzzzzzzzzzzz",
      "àèìòù àèìòù xy",
      PASSWORD,
      "memodumemodu",
    ])
      expect(problemaCondiviso(p)).toBe(problemaPassword(p));
  });

  it("l'utente fisso si rilegge dalle variabili d'ambiente, per la migrazione", () => {
    const env = {
      MEMODU_EMAIL: dati.email,
      MEMODU_SALE: dati.sale,
      MEMODU_ARGON2: "1024,1,1",
      MEMODU_IMPRONTA_ACCESSO: dati.improntaAccesso,
      MEMODU_IMPRONTA_RECUPERO: dati.improntaRecupero,
      MEMODU_CHIAVE_PASSWORD: dati.chiavePassword,
      MEMODU_CHIAVE_RECUPERO: dati.chiaveRecupero,
    };
    expect(utenteFissoDaAmbiente(env)).toEqual(dati);
    expect(utenteFissoDaAmbiente({})).toBeNull();
    expect(() => utenteFissoDaAmbiente({ MEMODU_EMAIL: "a@b.it" })).toThrow("mancano");
  });
});

let db: Database;
let accesso: Accesso;
let orologio: Date;
let server: FastifyInstance;

beforeAll(async () => {
  db = await daPglite();
  await aggiornaSchema(db);
});
afterAll(() => db.chiudi());
beforeEach(async () => {
  await db.esegui("TRUNCATE utenti CASCADE");
  orologio = new Date("2026-10-14T08:00:00Z");
  accesso = new Accesso(db, SEGRETO, () => orologio);
  await accesso.creaAccount(dati);
  server = creaServer(new ArchivioSincronizzazione(db, () => orologio), accesso);
});
afterEach(() => server.close());

const richiesta = (
  metodo: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  corpo?: object,
  gettone?: string,
) =>
  server.inject({
    method: metodo,
    url,
    headers: {
      "memodu-protocollo": "1",
      ...(gettone ? { authorization: `Bearer ${gettone}` } : {}),
    },
    ...(corpo ? { payload: corpo } : {}),
  });
const accedi = async (password = PASSWORD, tipo = "windows") =>
  (
    await richiesta("POST", "/accesso", {
      email: "manuel@esempio.it",
      prova: provaDi(password),
      tipo,
    })
  ).json<{ gettone: string; dispositivo: string; chiave: string }>();
const modifiche = (gettone: string) =>
  richiesta("GET", "/sincronizzazione/modifiche", undefined, gettone);

describe("account e accesso (DEC-132, DEC-133)", () => {
  it("un account per email: la seconda volta il comando la rifiuta (CA-14.23)", async () => {
    expect(await accesso.creaAccount(dati)).toBe(false);
    expect((await accesso.elencoAccount()).map((a) => a.email)).toEqual(["manuel@esempio.it"]);
  });

  it("parametri, accesso, sincronizzazione con il gettone del dispositivo", async () => {
    const p = await richiesta("POST", "/accesso/parametri", { email: " MANUEL@esempio.it " });
    expect(p.json()).toEqual({ sale: dati.sale, argon2: LEGGERO });
    const a = await accedi();
    expect(a.chiave).toBe(dati.chiavePassword);
    expect(a.gettone).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect((await modifiche(a.gettone)).statusCode).toBe(200);
  });

  it("anche l'app per iPhone accede, con il tipo «ios» (DEC-156)", async () => {
    const a = await accedi(PASSWORD, "ios");
    expect(a.gettone).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect((await modifiche(a.gettone)).statusCode).toBe(200);
    const altro = await richiesta("POST", "/accesso", {
      email: "manuel@esempio.it",
      prova: provaDi(PASSWORD),
      tipo: "android",
    });
    expect(altro.statusCode).toBe(400);
  });

  it("un'email sconosciuta riceve un sale finto ma sempre uguale", async () => {
    const a = await accesso.parametri("nessuno@esempio.it");
    expect(a).toEqual(await accesso.parametri("nessuno@esempio.it"));
    expect(a.sale).not.toBe(dati.sale);
  });

  it("prova sbagliata: 401 senza dettagli; prova malformata: 400; protocollo diverso: 426", async () => {
    const a = await richiesta("POST", "/accesso", {
      email: "manuel@esempio.it",
      prova: b64(Buffer.alloc(32)),
      tipo: "windows",
    });
    expect([a.statusCode, a.json().message]).toEqual([401, "Credenziali non valide"]);
    const corta = await richiesta("POST", "/accesso", {
      email: "manuel@esempio.it",
      prova: "x",
      tipo: "windows",
    });
    expect(corta.statusCode).toBe(400);
    const vecchia = await server.inject({
      method: "POST",
      url: "/accesso/parametri",
      headers: { "memodu-protocollo": "2" },
      payload: { email: "a@b.it" },
    });
    expect(vecchia.statusCode).toBe(426);
  });

  it("l'accesso non scade: dopo 91 giorni il gettone vale ancora (CA-14.25)", async () => {
    const { gettone } = await accedi();
    orologio = new Date(orologio.getTime() + 91 * 24 * 60 * 60 * 1000);
    expect((await modifiche(gettone)).statusCode).toBe(200);
  });

  it("un gettone qualsiasi non vale, e il database ne tiene solo l'impronta (CA-14.36)", async () => {
    const { gettone } = await accedi();
    expect((await modifiche(b64(Buffer.alloc(32, 1)))).statusCode).toBe(401);
    const righe = await db.righe<Record<string, unknown>>("SELECT * FROM dispositivi");
    const tutto = JSON.stringify(righe) + JSON.stringify(await db.righe("SELECT * FROM utenti"));
    expect(tutto).not.toContain(gettone);
    expect(tutto).not.toContain(provaDi(PASSWORD));
  });
});

describe("recupero dell'account (FL-14, RB-99)", () => {
  const conChiave = (r: Buffer = recupero) => b64(daRecupero(r).prova);

  it("con la prova di recupero si ha la chiave dati avvolta; con quella sbagliata 401", async () => {
    const ok = await richiesta("POST", "/accesso/recupero/chiave", {
      email: "manuel@esempio.it",
      prova_recupero: conChiave(),
    });
    expect(ok.json()).toEqual({
      chiave_recupero: dati.chiaveRecupero,
      sale: dati.sale,
      argon2: LEGGERO,
    });
    const no = await richiesta("POST", "/accesso/recupero/chiave", {
      email: "manuel@esempio.it",
      prova_recupero: conChiave(Buffer.alloc(32, 3)),
    });
    expect(no.statusCode).toBe(401);
  });

  it("password e chiave di recupero nuove; la vecchia password e la chiave usata non valgono più (CA-14.28)", async () => {
    const n = nuovaPassword(NUOVA, true);
    const corpo = {
      email: "manuel@esempio.it",
      prova_recupero: conChiave(),
      ...n,
      scollega_altri: false,
      tipo: "macos",
    };
    const r = await richiesta("POST", "/accesso/recupero", { ...corpo, recupero: undefined });
    expect(r.statusCode).toBe(200);
    expect((await modifiche(r.json().gettone)).statusCode).toBe(200);
    expect(
      (
        await richiesta("POST", "/accesso", {
          email: dati.email,
          prova: provaDi(PASSWORD),
          tipo: "windows",
        })
      ).statusCode,
    ).toBe(401);
    const nuovaChiave = await richiesta("POST", "/accesso/recupero/chiave", {
      email: dati.email,
      prova_recupero: conChiave(n.recupero),
    });
    // La chiave dati è sempre la stessa: le note non si ricifrano.
    const aperta = svolgi(
      daRecupero(n.recupero).cassaforte,
      nuovaChiave.json().chiave_recupero,
      SCOPI.chiaveDatiRecupero,
    );
    expect(aperta.equals(chiaveDati)).toBe(true);
    expect(
      (
        await richiesta("POST", "/accesso/recupero/chiave", {
          email: dati.email,
          prova_recupero: conChiave(),
        })
      ).statusCode,
    ).toBe(401);
  });

  it("ripetuto dopo una risposta persa riesce lo stesso (CA-14.34)", async () => {
    const n = nuovaPassword(NUOVA, true);
    const corpo = {
      email: dati.email,
      prova_recupero: conChiave(),
      nuova: n.nuova,
      recupero_nuovo: n.recupero_nuovo,
      scollega_altri: false,
      tipo: "windows",
    };
    expect((await richiesta("POST", "/accesso/recupero", corpo)).statusCode).toBe(200);
    expect((await richiesta("POST", "/accesso/recupero", corpo)).statusCode).toBe(200);
  });

  it("con «scollega gli altri» i dispositivi di prima non valgono più (CA-14.29)", async () => {
    const prima = await accedi();
    const n = nuovaPassword(NUOVA, true);
    const corpo = {
      email: dati.email,
      prova_recupero: conChiave(),
      nuova: n.nuova,
      recupero_nuovo: n.recupero_nuovo,
      scollega_altri: true,
      tipo: "windows",
    };
    const r = await richiesta("POST", "/accesso/recupero", corpo);
    expect((await modifiche(prima.gettone)).statusCode).toBe(401);
    expect((await modifiche(r.json().gettone)).statusCode).toBe(200);
  });
});

describe("cambio della password (FL-14, RB-98)", () => {
  it("con la password attuale: questo resta collegato, gli altri pure se non si scollegano (CA-14.31)", async () => {
    const questo = await accedi();
    const altro = await accedi();
    const n = nuovaPassword(NUOVA);
    const r = await richiesta(
      "POST",
      "/accesso/password",
      {
        verifica: { tipo: "password", prova: provaDi(PASSWORD) },
        nuova: n.nuova,
        scollega_altri: false,
      },
      questo.gettone,
    );
    expect(r.statusCode).toBe(204);
    expect((await modifiche(questo.gettone)).statusCode).toBe(200);
    expect((await modifiche(altro.gettone)).statusCode).toBe(200);
    const nuova = await richiesta("POST", "/accesso", {
      email: dati.email,
      prova: n.nuova.prova,
      tipo: "windows",
    });
    expect(nuova.statusCode).toBe(200);
    expect(
      svolgi(
        daPassword(NUOVA, Buffer.from(n.nuova.sale, "base64url"), LEGGERO).cassaforte,
        nuova.json().chiave,
        SCOPI.chiaveDatiPassword,
      ).equals(chiaveDati),
    ).toBe(true);
  });

  it("con «scollega gli altri» resta solo questo dispositivo (CA-14.29)", async () => {
    const questo = await accedi();
    const altro = await accedi();
    const n = nuovaPassword(NUOVA);
    await richiesta(
      "POST",
      "/accesso/password",
      {
        verifica: { tipo: "password", prova: provaDi(PASSWORD) },
        nuova: n.nuova,
        scollega_altri: true,
      },
      questo.gettone,
    );
    expect((await modifiche(questo.gettone)).statusCode).toBe(200);
    expect((await modifiche(altro.gettone)).statusCode).toBe(401);
  });

  it("con la chiave di recupero nasce una chiave nuova; senza, recupero_nuovo è un 400 (CA-14.32)", async () => {
    const questo = await accedi();
    const n = nuovaPassword(NUOVA, true);
    const senza = await richiesta(
      "POST",
      "/accesso/password",
      {
        verifica: { tipo: "recupero", prova: b64(daRecupero(recupero).prova) },
        nuova: n.nuova,
        scollega_altri: false,
      },
      questo.gettone,
    );
    expect(senza.statusCode).toBe(400);
    const r = await richiesta(
      "POST",
      "/accesso/password",
      {
        verifica: { tipo: "recupero", prova: b64(daRecupero(recupero).prova) },
        nuova: n.nuova,
        recupero_nuovo: n.recupero_nuovo,
        scollega_altri: false,
      },
      questo.gettone,
    );
    expect(r.statusCode).toBe(204);
    expect(
      (await accesso.chiaveRecupero(dati.email, b64(daRecupero(n.recupero).prova)))
        ?.chiave_recupero,
    ).toBe(n.recupero_nuovo.chiave);
  });

  it("verifica sbagliata: 403 e niente cambia; ripetuto dopo una risposta persa: 204 (CA-14.33, CA-14.34)", async () => {
    const questo = await accedi();
    const n = nuovaPassword(NUOVA);
    const sbagliata = await richiesta(
      "POST",
      "/accesso/password",
      {
        verifica: { tipo: "password", prova: provaDi("non è questa la mia") },
        nuova: n.nuova,
        scollega_altri: false,
      },
      questo.gettone,
    );
    expect([sbagliata.statusCode, sbagliata.json().message]).toEqual([
      403,
      "Verifica non riuscita",
    ]);
    expect((await modifiche(questo.gettone)).statusCode).toBe(200);
    const corpo = {
      verifica: { tipo: "password", prova: provaDi(PASSWORD) },
      nuova: n.nuova,
      scollega_altri: false,
    };
    expect((await richiesta("POST", "/accesso/password", corpo, questo.gettone)).statusCode).toBe(
      204,
    );
    expect((await richiesta("POST", "/accesso/password", corpo, questo.gettone)).statusCode).toBe(
      204,
    );
    expect((await richiesta("POST", "/accesso/password", corpo)).statusCode).toBe(401);
  });
});

describe("dispositivi collegati (FL-15, RB-100)", () => {
  it("l'elenco: questo per primo, nome cifrato, ultima sincronizzazione (CA-16.1, CA-16.5)", async () => {
    const questo = await accedi();
    const altro = await accedi(PASSWORD, "macos");
    const nome = avvolgi(chiaveDati, Buffer.from("MacBook dell'ufficio"), "memodu/nome");
    expect(
      (await richiesta("PUT", "/dispositivi/questo", { nome }, altro.gettone)).statusCode,
    ).toBe(204);
    await modifiche(altro.gettone);
    const elenco = (await richiesta("GET", "/dispositivi", undefined, questo.gettone)).json();
    expect(elenco).toEqual([
      {
        id: questo.dispositivo,
        nome: null,
        tipo: "windows",
        ultima_sincronizzazione: null,
        questo: true,
      },
      {
        id: altro.dispositivo,
        nome,
        tipo: "macos",
        ultima_sincronizzazione: expect.any(String),
        questo: false,
      },
    ]);
  });

  it("scollegare un altro: 204 e il suo gettone non vale più, anche ripetuto (CA-16.2, CA-16.3)", async () => {
    const questo = await accedi();
    const altro = await accedi();
    const url = `/dispositivi/${altro.dispositivo}`;
    expect((await richiesta("DELETE", url, undefined, questo.gettone)).statusCode).toBe(204);
    expect((await richiesta("DELETE", url, undefined, questo.gettone)).statusCode).toBe(204);
    expect((await modifiche(altro.gettone)).statusCode).toBe(401);
  });

  it("questo dispositivo non si scollega dall'elenco: 409", async () => {
    const questo = await accedi();
    const r = await richiesta(
      "DELETE",
      `/dispositivi/${questo.dispositivo}`,
      undefined,
      questo.gettone,
    );
    expect(r.statusCode).toBe(409);
  });

  it("il dispositivo di un altro account: 404 e resta (CA-16.6)", async () => {
    const { dati: altri } = creaUtente("altra@esempio.it", PASSWORD, {}, LEGGERO);
    await accesso.creaAccount(altri);
    const sua = (await accesso.accedi(altri.email, provaDi(PASSWORD, altri), "windows"))!;
    const mio = await accedi();
    expect(
      (await richiesta("DELETE", `/dispositivi/${sua.dispositivo}`, undefined, mio.gettone))
        .statusCode,
    ).toBe(404);
    expect((await modifiche(sua.gettone)).statusCode).toBe(200);
  });

  it("Esci toglie il dispositivo; senza gettone valido risponde lo stesso 204 (CA-14.35)", async () => {
    const questo = await accedi();
    expect((await richiesta("POST", "/accesso/esci", undefined, questo.gettone)).statusCode).toBe(
      204,
    );
    expect((await modifiche(questo.gettone)).statusCode).toBe(401);
    expect((await richiesta("POST", "/accesso/esci", undefined, questo.gettone)).statusCode).toBe(
      204,
    );
  });
});

describe("account separati (CA-10.17)", () => {
  it("ogni account legge e scrive solo i suoi elementi, anche con lo stesso id", async () => {
    const { dati: altri } = creaUtente("altra@esempio.it", PASSWORD, {}, LEGGERO);
    await accesso.creaAccount(altri);
    const sua = (await accesso.accedi(altri.email, provaDi(PASSWORD, altri), "windows"))!;
    const mio = await accedi();
    const id = "7d1c4a52-6b8f-4c1e-9a3d-2f5e8b7c6a10";
    const scrivi = (gettone: string, dati: string) =>
      richiesta("PUT", `/sincronizzazione/elementi/${id}`, { base: 0, dati }, gettone);
    expect((await scrivi(mio.gettone, "mio")).statusCode).toBe(200);
    expect((await scrivi(sua.gettone, "suo")).statusCode).toBe(200);
    const leggi = async (gettone: string) =>
      (await modifiche(gettone))
        .json<{ modifiche: { dati: string }[] }>()
        .modifiche.map((m) => m.dati);
    expect(await leggi(mio.gettone)).toEqual(["mio"]);
    expect(await leggi(sua.gettone)).toEqual(["suo"]);
  });
});

describe("migrazione dell'utente fisso (CA-14.24)", () => {
  it("lo schema 2 fa dell'utente fisso il primo account e gli dà le versioni che c'erano", async () => {
    const vecchio = await daPglite();
    // Lo schema 1 com'era, con una versione dentro.
    await vecchio.esegui(`CREATE TABLE schema (versione integer NOT NULL); INSERT INTO schema VALUES (1);
      CREATE TABLE versioni (id text NOT NULL, versione integer NOT NULL, ordine integer NOT NULL UNIQUE,
        ora text NOT NULL, dimensione integer NOT NULL, dati text NOT NULL, PRIMARY KEY (id, versione));
      CREATE TABLE stato (chiave text PRIMARY KEY, valore text NOT NULL);
      INSERT INTO stato VALUES ('archivio', 'a');
      INSERT INTO versioni VALUES ('x', 1, 1, '2026-10-01T00:00:00Z', 3, 'uno');`);
    await expect(aggiornaSchema(vecchio)).rejects.toThrow("utente fisso");
    await aggiornaSchema(vecchio, { utenteFisso: dati });
    const acc = new Accesso(vecchio, SEGRETO);
    const a = (await acc.accedi(dati.email, provaDi(PASSWORD), "windows"))!;
    expect(a.chiave).toBe(dati.chiavePassword);
    const chi = (await acc.autorizza(a.gettone))!;
    const m = await new ArchivioSincronizzazione(vecchio).modificheDopo(chi.utente, 0);
    expect(m.modifiche.map((v) => v.dati)).toEqual(["uno"]);
    await vecchio.chiudi();
  });
});
