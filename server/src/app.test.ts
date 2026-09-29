import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import type { Nota, VoceElenco } from "@memodu/condiviso";
import { creaServer } from "./app.ts";
import { ArchivioNote } from "./archivio.ts";

let cartella: string;
let archivio: ArchivioNote;
let server: FastifyInstance;
let orologio: Date;

beforeEach(async () => {
  cartella = await mkdtemp(join(tmpdir(), "memodu-api-"));
  orologio = new Date("2026-09-28T08:00:00Z");
  archivio = new ArchivioNote(cartella, () => orologio);
  server = creaServer(archivio);
});
afterEach(async () => {
  await server.close();
  try {
    archivio.chiudi();
  } catch {
    // già chiuso dalla prova sugli errori del database
  }
  await rm(cartella, { recursive: true, force: true });
});

const crea = async (corpo: object = {}) =>
  (await server.inject({ method: "POST", url: "/note", payload: corpo })).json<Nota>();

describe("POST /note", () => {
  it("crea una nota e risponde 201 con id e date", async () => {
    const risposta = await server.inject({
      method: "POST",
      url: "/note",
      payload: { titolo: "A" },
    });
    expect(risposta.statusCode).toBe(201);
    expect(risposta.json()).toMatchObject({
      titolo: "A",
      contenuto: "",
      creata: "2026-09-28T08:00:00.000Z",
    });
  });

  it("accetta un corpo senza campi (nota nuova dal +, RB-10)", async () => {
    const risposta = await server.inject({ method: "POST", url: "/note", payload: {} });
    expect(risposta.statusCode).toBe(201);
    expect(risposta.json()).toMatchObject({ titolo: "", contenuto: "" });
  });

  it("risponde 400 a campi non di tipo testo (SF-06)", async () => {
    const risposta = await server.inject({
      method: "POST",
      url: "/note",
      payload: { titolo: 3, altro: 1 },
    });
    expect(risposta.statusCode).toBe(400);
  });

  it("risponde 413 oltre i 10 MB (EN-01, SF-17)", async () => {
    const contenuto = "x".repeat(10 * 1024 * 1024 + 1);
    const risposta = await server.inject({ method: "POST", url: "/note", payload: { contenuto } });
    expect(risposta.statusCode).toBe(413);
  });
});

describe("GET /note/:id e PUT /note/:id", () => {
  it("salva e rilegge la nota", async () => {
    const nota = await crea({ titolo: "T" });
    orologio = new Date("2026-09-28T08:00:02Z");
    const salvata = await server.inject({
      method: "PUT",
      url: `/note/${nota.id}`,
      payload: { contenuto: "ciao" },
    });
    expect(salvata.statusCode).toBe(200);
    expect(salvata.json()).toMatchObject({
      contenuto: "ciao",
      modificata: "2026-09-28T08:00:02.000Z",
    });
    const letta = await server.inject({ method: "GET", url: `/note/${nota.id}` });
    expect(letta.json()).toEqual(salvata.json());
  });

  it("risponde 400 a un id che non è un UUID (SF-34)", async () => {
    expect((await server.inject({ method: "GET", url: "/note/..%2Fsegreto" })).statusCode).toBe(
      400,
    );
    expect((await server.inject({ method: "PUT", url: "/note/abc", payload: {} })).statusCode).toBe(
      400,
    );
  });

  it("risponde 404 a una nota che non esiste", async () => {
    const id = "3f6c1b2e-9a4d-4c8e-8f1a-2b7d5e6a9c10";
    expect((await server.inject({ method: "GET", url: `/note/${id}` })).statusCode).toBe(404);
    expect(
      (await server.inject({ method: "PUT", url: `/note/${id}`, payload: {} })).statusCode,
    ).toBe(404);
  });

  it("risponde 500 se il database non si può usare (SF-32)", async () => {
    const nota = await crea({ titolo: "T" });
    archivio.chiudi();
    const risposta = await server.inject({
      method: "PUT",
      url: `/note/${nota.id}`,
      payload: { contenuto: "x" },
    });
    expect(risposta.statusCode).toBe(500);
  });
});

describe("GET /note", () => {
  it("elenca le note, la modificata più di recente in cima (RB-60)", async () => {
    await crea({ titolo: "Vecchia" });
    orologio = new Date("2026-09-28T09:00:00Z");
    await crea({ contenuto: "**senza** titolo" });
    const elenco = (await server.inject({ method: "GET", url: "/note" })).json<VoceElenco[]>();
    expect(elenco.map((v) => [v.titolo, v.anteprima])).toEqual([
      ["", "senza titolo"],
      ["Vecchia", ""],
    ]);
  });
});

describe("origini ammesse", () => {
  it("risponde all'app e non ad altri siti", async () => {
    const app = await server.inject({
      method: "OPTIONS",
      url: "/note",
      headers: { origin: "http://localhost:1420" },
    });
    expect(app.statusCode).toBe(204);
    expect(app.headers["access-control-allow-origin"]).toBe("http://localhost:1420");
    const altro = await server.inject({
      method: "GET",
      url: "/note",
      headers: { origin: "https://esempio.it" },
    });
    expect(altro.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("cartelle e cestino (DEC-37)", () => {
  const chiama = (
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    url: string,
    payload?: object,
  ) => server.inject({ method, url, payload });

  it("crea, rinomina e sposta cartelle; la nota porta la sua cartella", async () => {
    expect((await chiama("POST", "/cartelle", { genitore: "", nome: "Lavoro" })).statusCode).toBe(
      201,
    );
    await chiama("POST", "/cartelle", { genitore: "Lavoro", nome: "Clienti" });
    const nota = (await chiama("POST", "/note", { titolo: "A", cartella: "Lavoro" })).json<Nota>();
    expect(nota.cartella).toBe("Lavoro");
    const spostata = await chiama("PUT", `/note/${nota.id}/cartella`, {
      cartella: "Lavoro/Clienti",
    });
    expect(spostata.json()).toMatchObject({ cartella: "Lavoro/Clienti" });
    const rinominata = await chiama("PATCH", "/cartelle", { percorso: "Lavoro", nome: "Ufficio" });
    expect(rinominata.json()).toMatchObject({
      cartella: { percorso: "Ufficio", conteggio: 1 },
      daRisolvere: [],
    });
    const albero = (await chiama("GET", "/albero")).json();
    expect(albero).toMatchObject({
      cartelle: [{ nome: "Ufficio", cartelle: [{ nome: "Clienti" }] }],
    });
  });

  it("risponde 409 con il nome in conflitto, 422 dentro sé stessa, 404 e 400", async () => {
    await chiama("POST", "/cartelle", { genitore: "", nome: "Clienti" });
    await chiama("POST", "/cartelle", { genitore: "Clienti", nome: "Sotto" });
    const doppia = await chiama("POST", "/cartelle", { genitore: "", nome: "clienti" });
    expect(doppia.statusCode).toBe(409);
    expect(doppia.json()).toEqual({ conflitto: "Clienti" });
    const dentro = await chiama("POST", "/cartelle/sposta", {
      percorso: "Clienti",
      destinazione: "Clienti/Sotto",
    });
    expect(dentro.statusCode).toBe(422);
    expect((await chiama("PATCH", "/cartelle", { percorso: "Manca", nome: "X" })).statusCode).toBe(
      404,
    );
    expect(
      (await chiama("POST", "/cartelle", { genitore: "../fuori", nome: "X" })).statusCode,
    ).toBe(400);
    expect((await chiama("POST", "/cartelle", { genitore: "", seEsiste: "boh" })).statusCode).toBe(
      400,
    );
  });

  it("cestina, elenca, ripristina ed elimina", async () => {
    const nota = await crea({ titolo: "Via" });
    const elemento = await chiama("POST", "/cestino", { tipo: "nota", id: nota.id });
    expect(elemento.statusCode).toBe(201);
    const { id } = elemento.json<{ id: string }>();
    expect((await chiama("GET", "/cestino")).json()).toMatchObject([
      { id, tipo: "nota", nome: "Via" },
    ]);
    expect((await chiama("POST", `/cestino/${id}/ripristina`, {})).json()).toMatchObject({
      id: nota.id,
      cartella: "",
    });
    const diNuovo = (await chiama("POST", "/cestino", { tipo: "nota", id: nota.id })).json<{
      id: string;
    }>();
    expect((await chiama("DELETE", `/cestino/${diNuovo.id}`)).statusCode).toBe(204);
    expect((await chiama("DELETE", `/cestino/${diNuovo.id}`)).statusCode).toBe(404);
    expect((await chiama("DELETE", "/cestino")).statusCode).toBe(204);
    expect((await chiama("POST", "/cestino", { tipo: "cartella" })).statusCode).toBe(400);
  });

  it("permette all'app anche PATCH e DELETE", async () => {
    const risposta = await server.inject({
      method: "OPTIONS",
      url: "/cartelle",
      headers: { origin: "http://localhost:1420" },
    });
    expect(risposta.headers["access-control-allow-methods"]).toContain("PATCH");
    expect(risposta.headers["access-control-allow-methods"]).toContain("DELETE");
  });
});

describe("DELETE /note/:id (DEC-39)", () => {
  it("cancella una nota vuota con 204 e risponde 409 se non è vuota", async () => {
    const vuota = await crea({});
    const piena = await crea({ contenuto: "x" });
    expect((await server.inject({ method: "DELETE", url: `/note/${vuota.id}` })).statusCode).toBe(
      204,
    );
    expect((await server.inject({ method: "DELETE", url: `/note/${piena.id}` })).statusCode).toBe(
      409,
    );
    expect((await server.inject({ method: "DELETE", url: `/note/${vuota.id}` })).statusCode).toBe(
      404,
    );
  });
});
