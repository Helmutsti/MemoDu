import Fastify, { type FastifyInstance } from "fastify";
import {
  LIMITE_CORPO_BYTE,
  type DatiDettagli,
  type DatiNota,
  type DatiNuovaNota,
  type SeEsiste,
} from "@memodu/condiviso";
import {
  ArchivioNote,
  CartellaNonTrovata,
  DataNonValida,
  ElementoNonTrovato,
  NomeEsistente,
  NotaNonTrovata,
  NotaNonVuota,
  PercorsoNonValido,
  SpostamentoImpossibile,
  TagNonTrovato,
} from "./archivio.ts";
import { rotteSincronizzazione } from "./rotteSincronizzazione.ts";
import type { ArchivioSincronizzazione } from "./sincronizzazione.ts";

// Endpoint di note, cartelle e cestino (architettura/api.md, DEC-37). Fastify controlla
// input e output con gli schemi: le richieste fuori schema ricevono 400, i corpi oltre
// 10 MB 413 (EN-01), gli errori di scrittura 500 (SF-32).

// Da dove arriva l'interfaccia: Vite in sviluppo, Tauri nell'app installata (macOS e Windows).
const ORIGINI_APP = new Set([
  "http://localhost:1420",
  "tauri://localhost",
  "http://tauri.localhost",
]);

const schemaNota = {
  type: "object",
  required: [
    "id",
    "titolo",
    "contenuto",
    "creata",
    "modificata",
    "cartella",
    "creataScelta",
    "fineValidita",
    "tag",
  ],
  properties: {
    id: { type: "string" },
    titolo: { type: "string" },
    contenuto: { type: "string" },
    creata: { type: "string" },
    modificata: { type: "string" },
    cartella: { type: "string" },
    creataScelta: { type: ["string", "null"] },
    fineValidita: { type: ["string", "null"] },
    tag: { type: "array", items: { type: "string" } },
  },
} as const;

const schemaDati = {
  type: "object",
  additionalProperties: false,
  properties: { titolo: { type: "string" }, contenuto: { type: "string" } },
} as const;

const schemaDatiNuova = {
  type: "object",
  additionalProperties: false,
  properties: {
    titolo: { type: "string" },
    contenuto: { type: "string" },
    cartella: { type: "string" },
  },
} as const;

const schemaId = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
} as const;

const seEsiste = { type: "string", enum: ["chiedi", "numero", "unisci"] } as const;

/** Errori dell'archivio tradotti in codici HTTP (architettura/api.md). */
const CODICI: [new (...argomenti: never[]) => Error, number][] = [
  [NotaNonTrovata, 404],
  [CartellaNonTrovata, 404],
  [ElementoNonTrovato, 404],
  [PercorsoNonValido, 400],
  [DataNonValida, 400],
  [TagNonTrovato, 404],
  [SpostamentoImpossibile, 422],
  [NotaNonVuota, 409],
];

export function creaServer(
  archivio: ArchivioNote,
  sincronizzazione?: ArchivioSincronizzazione,
): FastifyInstance {
  const server = Fastify({
    bodyLimit: LIMITE_CORPO_BYTE,
    logger: false,
    // Nessuna conversione silenziosa: un titolo numerico o un campo in più è un 400.
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false } },
  });

  // L'app chiama l'API da un'altra origine: si permettono solo le origini dell'app.
  server.addHook("onRequest", async (richiesta, risposta) => {
    const origine = richiesta.headers.origin;
    if (origine && ORIGINI_APP.has(origine)) {
      risposta.header("Access-Control-Allow-Origin", origine);
      risposta.header("Vary", "Origin");
    }
    if (richiesta.method === "OPTIONS") {
      risposta.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
      risposta.header("Access-Control-Allow-Headers", "Content-Type");
      return risposta.code(204).send();
    }
  });

  server.setErrorHandler((errore: Error, _richiesta, risposta) => {
    if (errore instanceof NomeEsistente) {
      return risposta.code(409).send({ conflitto: errore.conflitto });
    }
    // Nota nel cestino: la risposta dice quale elemento ripristinare (lei o la sua cartella).
    if (errore instanceof NotaNonTrovata && errore.cestino) {
      return risposta
        .code(404)
        .send({ statusCode: 404, message: errore.message, cestino: errore.cestino });
    }
    const codice = CODICI.find(([classe]) => errore instanceof classe)?.[1];
    if (codice) return risposta.code(codice).send({ statusCode: codice, message: errore.message });
    return risposta.send(errore);
  });

  // ——— Note ———

  server.get(
    "/note",
    {
      schema: {
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "titolo", "anteprima", "modificata"],
              properties: {
                id: { type: "string" },
                titolo: { type: "string" },
                anteprima: { type: "string" },
                modificata: { type: "string" },
              },
            },
          },
        },
      },
    },
    () => archivio.elenca(),
  );

  server.get<{ Params: { id: string } }>(
    "/note/:id",
    { schema: { params: schemaId, response: { 200: schemaNota } } },
    (richiesta) => archivio.leggi(richiesta.params.id),
  );

  server.post<{ Body: DatiNuovaNota }>(
    "/note",
    { schema: { body: schemaDatiNuova, response: { 201: schemaNota } } },
    async (richiesta, risposta) => {
      const nota = await archivio.crea(richiesta.body ?? {});
      return risposta.code(201).send(nota);
    },
  );

  server.put<{ Params: { id: string }; Body: DatiNota }>(
    "/note/:id",
    { schema: { params: schemaId, body: schemaDati, response: { 200: schemaNota } } },
    (richiesta) => archivio.salva(richiesta.params.id, richiesta.body),
  );

  server.delete<{ Params: { id: string } }>(
    "/note/:id",
    { schema: { params: schemaId } },
    async (richiesta, risposta) => {
      await archivio.eliminaSeVuota(richiesta.params.id);
      return risposta.code(204).send();
    },
  );

  server.put<{ Params: { id: string }; Body: { cartella: string } }>(
    "/note/:id/cartella",
    {
      schema: {
        params: schemaId,
        body: {
          type: "object",
          additionalProperties: false,
          required: ["cartella"],
          properties: { cartella: { type: "string" } },
        },
        response: { 200: schemaNota },
      },
    },
    (richiesta) => archivio.spostaNota(richiesta.params.id, richiesta.body.cartella),
  );

  // ——— Dettagli e tag (DEC-51) ———

  const giornoONull = { type: ["string", "null"] } as const;
  const schemaNomeTag = {
    type: "object",
    additionalProperties: false,
    required: ["nome"],
    properties: { nome: { type: "string" } },
  } as const;

  server.put<{ Params: { id: string }; Body: DatiDettagli }>(
    "/note/:id/dettagli",
    {
      schema: {
        params: schemaId,
        body: {
          type: "object",
          additionalProperties: false,
          properties: { creataScelta: giornoONull, fineValidita: giornoONull },
        },
        response: { 200: schemaNota },
      },
    },
    (richiesta) => archivio.salvaDettagli(richiesta.params.id, richiesta.body),
  );

  server.get(
    "/tag",
    {
      schema: {
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              required: ["nome", "note"],
              properties: { nome: { type: "string" }, note: { type: "integer" } },
            },
          },
        },
      },
    },
    () => archivio.elencaTag(),
  );

  server.post<{ Params: { id: string }; Body: { nome: string } }>(
    "/note/:id/tag",
    { schema: { params: schemaId, body: schemaNomeTag, response: { 200: schemaNota } } },
    (richiesta) => archivio.aggiungiTag(richiesta.params.id, richiesta.body.nome),
  );

  server.delete<{ Params: { id: string }; Body: { nome: string } }>(
    "/note/:id/tag",
    { schema: { params: schemaId, body: schemaNomeTag, response: { 200: schemaNota } } },
    (richiesta) => archivio.togliTag(richiesta.params.id, richiesta.body.nome),
  );

  server.delete<{ Body: { nome: string } }>(
    "/tag",
    { schema: { body: schemaNomeTag } },
    async (richiesta, risposta) => {
      await archivio.eliminaTag(richiesta.body.nome);
      return risposta.code(204).send();
    },
  );

  // ——— Albero e cartelle ———

  server.get("/albero", () => archivio.albero());

  server.post<{ Body: { genitore: string; nome?: string; seEsiste?: SeEsiste } }>(
    "/cartelle",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["genitore"],
          properties: { genitore: { type: "string" }, nome: { type: "string" }, seEsiste },
        },
      },
    },
    async (richiesta, risposta) => {
      const { genitore, nome, seEsiste: scelta } = richiesta.body;
      return risposta.code(201).send(await archivio.creaCartella(genitore, nome, scelta));
    },
  );

  server.patch<{ Body: { percorso: string; nome: string; seEsiste?: SeEsiste } }>(
    "/cartelle",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["percorso", "nome"],
          properties: { percorso: { type: "string" }, nome: { type: "string" }, seEsiste },
        },
      },
    },
    (richiesta) => {
      const { percorso, nome, seEsiste: scelta } = richiesta.body;
      return archivio.rinominaCartella(percorso, nome, scelta);
    },
  );

  server.post<{
    Body: { percorso: string; destinazione: string; seEsiste?: SeEsiste; daUnione?: boolean };
  }>(
    "/cartelle/sposta",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["percorso", "destinazione"],
          properties: {
            percorso: { type: "string" },
            destinazione: { type: "string" },
            seEsiste,
            daUnione: { type: "boolean" },
          },
        },
      },
    },
    (richiesta) => {
      const { percorso, destinazione, seEsiste: scelta, daUnione } = richiesta.body;
      return archivio.spostaCartella(percorso, destinazione, scelta, daUnione);
    },
  );

  // ——— Cestino ———

  server.post<{ Body: { tipo: "nota" | "cartella"; id?: string; percorso?: string } }>(
    "/cestino",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["tipo"],
          properties: {
            tipo: { type: "string", enum: ["nota", "cartella"] },
            id: { type: "string", format: "uuid" },
            percorso: { type: "string" },
          },
        },
      },
    },
    async (richiesta, risposta) => {
      const { tipo, id, percorso } = richiesta.body;
      if (tipo === "nota" && id) return risposta.code(201).send(await archivio.cestinaNota(id));
      if (tipo === "cartella" && percorso !== undefined) {
        return risposta.code(201).send(await archivio.cestinaCartella(percorso));
      }
      throw new PercorsoNonValido("Serve l'id della nota o il percorso della cartella");
    },
  );

  server.get("/cestino", () => archivio.elencaCestino());

  server.post<{ Params: { id: string }; Body: { seEsiste?: SeEsiste } }>(
    "/cestino/:id/ripristina",
    {
      schema: {
        params: schemaId,
        body: { type: "object", additionalProperties: false, properties: { seEsiste } },
      },
    },
    (richiesta) => archivio.ripristina(richiesta.params.id, richiesta.body?.seEsiste),
  );

  server.delete<{ Params: { id: string } }>(
    "/cestino/:id",
    { schema: { params: schemaId } },
    async (richiesta, risposta) => {
      await archivio.eliminaDefinitivamente(richiesta.params.id);
      return risposta.code(204).send();
    },
  );

  server.delete("/cestino", async (_richiesta, risposta) => {
    await archivio.svuotaCestino();
    return risposta.code(204).send();
  });

  // ——— Sincronizzazione (RF-10) ———
  if (sincronizzazione) rotteSincronizzazione(server, sincronizzazione);

  return server;
}
