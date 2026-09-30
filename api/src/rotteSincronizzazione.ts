// Richieste della sincronizzazione (architettura/api.md, DEC-75 … DEC-83). Ogni richiesta
// porta il gettone nell'intestazione Authorization e la versione del protocollo in
// Memodu-Protocollo: senza gettone valido 401 (schermata di blocco, RB-57), con un protocollo
// diverso 426 (avviso di errore, DEC-83).

import type { FastifyInstance } from "fastify";
import { ArchivioSincronizzazione, PROTOCOLLO, VersioneSuperata } from "./sincronizzazione.ts";

const schemaId = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
} as const;

export function rotteSincronizzazione(
  server: FastifyInstance,
  sinc: ArchivioSincronizzazione,
): void {
  server.register(async (rami) => {
    rami.addHook("onRequest", async (richiesta, risposta) => {
      if (richiesta.method === "OPTIONS") return;
      const intestazione = richiesta.headers.authorization;
      const gettone = intestazione?.startsWith("Bearer ") ? intestazione.slice(7) : undefined;
      if (!sinc.autorizzato(gettone)) {
        return risposta.code(401).send({ statusCode: 401, message: "Credenziali non valide" });
      }
      if (richiesta.headers["memodu-protocollo"] !== String(PROTOCOLLO)) {
        return risposta.code(426).send({
          statusCode: 426,
          message: "Versione del protocollo diversa",
          protocollo: PROTOCOLLO,
        });
      }
    });

    rami.get<{ Querystring: { dopo?: string } }>(
      "/sincronizzazione/modifiche",
      {
        schema: {
          querystring: {
            type: "object",
            // Nella query tutto è testo, e il server non converte da solo (app.ts).
            properties: { dopo: { type: "string", pattern: "^[0-9]+$" } },
          },
        },
      },
      (richiesta) => sinc.modificheDopo(Number(richiesta.query.dopo ?? 0)),
    );

    rami.put<{ Params: { id: string }; Body: { base: number; dati: string } }>(
      "/sincronizzazione/elementi/:id",
      {
        schema: {
          params: schemaId,
          body: {
            type: "object",
            additionalProperties: false,
            required: ["base", "dati"],
            properties: { base: { type: "integer", minimum: 0 }, dati: { type: "string" } },
          },
        },
      },
      async (richiesta, risposta) => {
        try {
          return sinc.scrivi(richiesta.params.id, richiesta.body.base, richiesta.body.dati);
        } catch (errore) {
          if (!(errore instanceof VersioneSuperata)) throw errore;
          return risposta.code(409).send({ attuale: errore.attuale });
        }
      },
    );
  });
}
