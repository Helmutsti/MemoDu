// Richieste dell'accesso (RF-14, DEC-121, architettura/api.md). Come la sincronizzazione,
// portano la versione del protocollo; il corpo non va mai nel registro.

import type { FastifyInstance } from "fastify";
import type { Accesso } from "./accesso.js";
import { PROTOCOLLO } from "./sincronizzazione.js";

const email = { type: "string", minLength: 3, maxLength: 320 } as const;

export function rotteAccesso(server: FastifyInstance, accesso: Accesso): void {
  server.register(async (rami) => {
    rami.addHook("onRequest", async (richiesta, risposta) => {
      if (richiesta.headers["memodu-protocollo"] !== String(PROTOCOLLO)) {
        return risposta.code(426).send({
          statusCode: 426,
          message: "Versione del protocollo diversa",
          protocollo: PROTOCOLLO,
        });
      }
    });

    rami.post<{ Body: { email: string } }>(
      "/accesso/parametri",
      {
        schema: {
          body: {
            type: "object",
            additionalProperties: false,
            required: ["email"],
            properties: { email },
          },
        },
      },
      (richiesta) => accesso.parametri(richiesta.body.email),
    );

    rami.post<{ Body: { email: string; prova: string } }>(
      "/accesso",
      {
        schema: {
          body: {
            type: "object",
            additionalProperties: false,
            required: ["email", "prova"],
            properties: { email, prova: { type: "string", pattern: "^[A-Za-z0-9_-]{43}$" } },
          },
        },
      },
      (richiesta, risposta) => {
        const esito = accesso.accedi(richiesta.body.email, richiesta.body.prova);
        if (!esito)
          return risposta.code(401).send({ statusCode: 401, message: "Credenziali non valide" });
        return esito;
      },
    );

    rami.post("/accesso/rinnovo", (richiesta, risposta) => {
      const intestazione = richiesta.headers.authorization;
      const gettone = intestazione?.startsWith("Bearer ") ? intestazione.slice(7) : undefined;
      const esito = accesso.rinnova(gettone);
      if (!esito)
        return risposta.code(401).send({ statusCode: 401, message: "Credenziali non valide" });
      return esito;
    });
  });
}
