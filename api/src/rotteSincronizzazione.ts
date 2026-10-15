// Richieste della sincronizzazione (architettura/api.md, DEC-75 … DEC-83). Ogni richiesta
// porta il gettone nell'intestazione Authorization e la versione del protocollo in
// Memodu-Protocollo: senza gettone valido 401 (il client tiene le modifiche e mostra l'avviso
// dell'accesso scaduto, RB-87), con un protocollo diverso 426 (avviso di errore, DEC-83).
// Il gettone è quello del dispositivo (DEC-133): dice anche di quale account sono gli elementi.

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { Autorizzazione } from "./accesso.js";
import { type ArchivioAllegati, ErroreAllegato } from "./allegati.js";
import { ArchivioSincronizzazione, PROTOCOLLO, VersioneSuperata } from "./sincronizzazione.js";

const schemaId = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
} as const;

export function rotteSincronizzazione(
  server: FastifyInstance,
  sinc: ArchivioSincronizzazione,
  autorizza: (gettone: string | undefined) => Promise<Autorizzazione | null>,
  sincronizzato: (chi: Autorizzazione) => Promise<void> = async () => undefined,
  /** Gli allegati di Brainet (DEC-135); senza deposito le richieste rispondono 503. */
  allegati: ArchivioAllegati | null = null,
): void {
  const chi = new WeakMap<FastifyRequest, Autorizzazione>();
  server.register(async (rami) => {
    rami.addHook("onRequest", async (richiesta, risposta) => {
      if (richiesta.method === "OPTIONS") return;
      const intestazione = richiesta.headers.authorization;
      const gettone = intestazione?.startsWith("Bearer ") ? intestazione.slice(7) : undefined;
      const autorizzazione = await autorizza(gettone);
      if (!autorizzazione) {
        return risposta.code(401).send({ statusCode: 401, message: "Credenziali non valide" });
      }
      chi.set(richiesta, autorizzazione);
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
      async (richiesta) => {
        const a = chi.get(richiesta)!;
        const esito = await sinc.modificheDopo(a.utente, Number(richiesta.query.dopo ?? 0));
        await sincronizzato(a);
        return esito;
      },
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
          return await sinc.scrivi(
            chi.get(richiesta)!.utente,
            richiesta.params.id,
            richiesta.body.base,
            richiesta.body.dati,
          );
        } catch (errore) {
          if (!(errore instanceof VersioneSuperata)) throw errore;
          return risposta.code(409).send({ attuale: errore.attuale });
        }
      },
    );

    // ——— Allegati di Brainet (architettura/api.md, «Allegati») ———

    const conAllegati = async <T>(
      risposta: { code: (c: number) => { send: (b: unknown) => unknown } },
      lavoro: (a: ArchivioAllegati) => Promise<T>,
    ) => {
      if (!allegati) {
        return risposta.code(503).send({ statusCode: 503, message: "Allegati non configurati" });
      }
      try {
        return await lavoro(allegati);
      } catch (errore) {
        if (!(errore instanceof ErroreAllegato)) throw errore;
        return risposta
          .code(errore.codice)
          .send({ statusCode: errore.codice, message: errore.message });
      }
    };

    rami.post<{ Params: { id: string }; Body: { grandezza: number; anteprima: number } }>(
      "/allegati/:id/caricamento",
      {
        schema: {
          params: schemaId,
          body: {
            type: "object",
            additionalProperties: false,
            required: ["grandezza", "anteprima"],
            properties: {
              grandezza: { type: "integer", minimum: 1 },
              anteprima: { type: "integer", minimum: 0 },
            },
          },
        },
      },
      async (richiesta, risposta) =>
        conAllegati(risposta, (a) =>
          a.caricamento(
            chi.get(richiesta)!.utente,
            richiesta.params.id,
            richiesta.body.grandezza,
            richiesta.body.anteprima,
          ),
        ),
    );

    rami.post<{ Params: { id: string } }>(
      "/allegati/:id/fatto",
      { schema: { params: schemaId } },
      async (richiesta, risposta) =>
        conAllegati(risposta, async (a) => {
          await a.fatto(chi.get(richiesta)!.utente, richiesta.params.id);
          return risposta.code(204).send();
        }),
    );

    rami.get<{ Params: { id: string } }>(
      "/allegati/:id/scaricamento",
      { schema: { params: schemaId } },
      async (richiesta, risposta) =>
        conAllegati(risposta, (a) =>
          a.scaricamento(chi.get(richiesta)!.utente, richiesta.params.id),
        ),
    );

    rami.delete<{ Params: { id: string } }>(
      "/allegati/:id",
      { schema: { params: schemaId } },
      async (richiesta, risposta) =>
        conAllegati(risposta, async (a) => {
          await a.cancella(chi.get(richiesta)!.utente, richiesta.params.id);
          return risposta.code(204).send();
        }),
    );
  });
}
