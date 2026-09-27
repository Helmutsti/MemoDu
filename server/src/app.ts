import Fastify, { type FastifyInstance } from "fastify";
import { LIMITE_CORPO_BYTE, type DatiNota } from "@memodu/condiviso";
import { ArchivioNote, NotaNonTrovata } from "./archivio.ts";

// Endpoint delle note del frammento Must A (architettura/api.md). Fastify controlla
// input e output con gli schemi: le richieste fuori schema ricevono 400, i corpi
// oltre 10 MB 413 (EN-01), gli errori di scrittura 500 (SF-32).

// Da dove arriva l'interfaccia: Vite in sviluppo, Tauri nell'app installata (macOS e Windows).
const ORIGINI_APP = new Set([
  "http://localhost:1420",
  "tauri://localhost",
  "http://tauri.localhost",
]);

const schemaNota = {
  type: "object",
  required: ["id", "titolo", "contenuto", "creata", "modificata"],
  properties: {
    id: { type: "string" },
    titolo: { type: "string" },
    contenuto: { type: "string" },
    creata: { type: "string" },
    modificata: { type: "string" },
  },
} as const;

const schemaDati = {
  type: "object",
  additionalProperties: false,
  properties: { titolo: { type: "string" }, contenuto: { type: "string" } },
} as const;

const schemaId = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
} as const;

export function creaServer(archivio: ArchivioNote): FastifyInstance {
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
      risposta.header("Access-Control-Allow-Methods", "GET, POST, PUT");
      risposta.header("Access-Control-Allow-Headers", "Content-Type");
      return risposta.code(204).send();
    }
  });

  server.setErrorHandler((errore, _richiesta, risposta) => {
    if (errore instanceof NotaNonTrovata) {
      return risposta
        .code(404)
        .send({ statusCode: 404, error: "Not Found", message: errore.message });
    }
    return risposta.send(errore);
  });

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

  server.post<{ Body: DatiNota }>(
    "/note",
    { schema: { body: schemaDati, response: { 201: schemaNota } } },
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

  return server;
}
