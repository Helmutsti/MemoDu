// Richieste dell'accesso con gli account e dei dispositivi (RF-14, RF-16, DEC-132, DEC-133,
// architettura/api.md). Come la sincronizzazione, portano la versione del protocollo; il corpo
// non va mai nel registro.

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Accesso, Autorizzazione, PasswordNuova, RecuperoNuovo, Tipo } from "./accesso.js";
import { PROTOCOLLO } from "./sincronizzazione.js";

const email = { type: "string", minLength: 3, maxLength: 320 } as const;
const prova = { type: "string", pattern: "^[A-Za-z0-9_-]{43}$" } as const;
const chiave = { type: "string", pattern: "^[A-Za-z0-9_-]{96}$" } as const;
const tipo = { type: "string", enum: ["windows", "macos", "ios"] } as const;
const intero = (minimo: number, massimo: number) =>
  ({ type: "integer", minimum: minimo, maximum: massimo }) as const;
const oggetto = (proprieta: Record<string, object>, facoltative: string[] = []) => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(proprieta).filter((k) => !facoltative.includes(k)),
  properties: proprieta,
});
const passwordNuova = oggetto({
  sale: { type: "string", pattern: "^[A-Za-z0-9_-]{22}$" },
  argon2: oggetto({
    memoria: intero(1024, 4_194_304),
    passaggi: intero(1, 16),
    fili: intero(1, 16),
  }),
  prova,
  chiave,
});
const recuperoNuovo = oggetto({ prova, chiave });

const nonValide = (risposta: FastifyReply) =>
  risposta.code(401).send({ statusCode: 401, message: "Credenziali non valide" });

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

    const gettoneDi = (richiesta: FastifyRequest) => {
      const intestazione = richiesta.headers.authorization;
      return intestazione?.startsWith("Bearer ") ? intestazione.slice(7) : undefined;
    };
    /** Le richieste con il gettone: senza un dispositivo collegato 401. */
    const conGettone =
      <T>(
        lavoro: (
          chi: Autorizzazione,
          richiesta: FastifyRequest<T & object>,
          risposta: FastifyReply,
        ) => unknown,
      ) =>
      async (richiesta: FastifyRequest<T & object>, risposta: FastifyReply) => {
        const chi = await accesso.autorizza(gettoneDi(richiesta));
        if (!chi) return nonValide(risposta);
        return lavoro(chi, richiesta, risposta);
      };

    rami.post<{ Body: { email: string } }>(
      "/accesso/parametri",
      { schema: { body: oggetto({ email }) } },
      (richiesta) => accesso.parametri(richiesta.body.email),
    );

    rami.post<{ Body: { email: string; prova: string; tipo: Tipo } }>(
      "/accesso",
      { schema: { body: oggetto({ email, prova, tipo }) } },
      async (richiesta, risposta) => {
        const { email: e, prova: p, tipo: t } = richiesta.body;
        return (await accesso.accedi(e, p, t)) ?? nonValide(risposta);
      },
    );

    rami.post<{ Body: { email: string; prova_recupero: string } }>(
      "/accesso/recupero/chiave",
      { schema: { body: oggetto({ email, prova_recupero: prova }) } },
      async (richiesta, risposta) =>
        (await accesso.chiaveRecupero(richiesta.body.email, richiesta.body.prova_recupero)) ??
        nonValide(risposta),
    );

    rami.post<{
      Body: {
        email: string;
        prova_recupero: string;
        nuova: PasswordNuova;
        recupero_nuovo: RecuperoNuovo;
        scollega_altri: boolean;
        tipo: Tipo;
      };
    }>(
      "/accesso/recupero",
      {
        schema: {
          body: oggetto({
            email,
            prova_recupero: prova,
            nuova: passwordNuova,
            recupero_nuovo: recuperoNuovo,
            scollega_altri: { type: "boolean" },
            tipo,
          }),
        },
      },
      async (richiesta, risposta) =>
        (await accesso.recupera(richiesta.body)) ?? nonValide(risposta),
    );

    type CorpoPassword = {
      Body: {
        verifica: { tipo: "password" | "recupero"; prova: string };
        nuova: PasswordNuova;
        recupero_nuovo?: RecuperoNuovo;
        scollega_altri: boolean;
      };
    };
    rami.post<CorpoPassword>(
      "/accesso/password",
      {
        schema: {
          body: oggetto(
            {
              verifica: oggetto({
                tipo: { type: "string", enum: ["password", "recupero"] },
                prova,
              }),
              nuova: passwordNuova,
              recupero_nuovo: recuperoNuovo,
              scollega_altri: { type: "boolean" },
            },
            ["recupero_nuovo"],
          ),
        },
      },
      conGettone<CorpoPassword>(async (chi, richiesta, risposta) => {
        const corpo = richiesta.body;
        // La chiave di recupero nuova c'è solo quando si è usata quella vecchia (RB-99).
        if ((corpo.verifica.tipo === "recupero") !== Boolean(corpo.recupero_nuovo)) {
          return risposta.code(400).send({
            statusCode: 400,
            message: "recupero_nuovo va mandato solo con la verifica «recupero»",
          });
        }
        if (!(await accesso.cambiaPassword(chi, corpo))) {
          return risposta.code(403).send({ statusCode: 403, message: "Verifica non riuscita" });
        }
        return risposta.code(204).send();
      }),
    );

    rami.post("/accesso/esci", async (richiesta, risposta) => {
      // Senza un dispositivo collegato non c'è niente da cancellare: è già fuori (RB-89).
      const chi = await accesso.autorizza(gettoneDi(richiesta));
      if (chi) await accesso.esci(chi);
      return risposta.code(204).send();
    });

    rami.get(
      "/dispositivi",
      conGettone((chi) => accesso.dispositivi(chi)),
    );

    type CorpoNome = { Body: { nome: string } };
    rami.put<CorpoNome>(
      "/dispositivi/questo",
      { schema: { body: oggetto({ nome: { type: "string", minLength: 1, maxLength: 1024 } }) } },
      conGettone<CorpoNome>(async (chi, richiesta, risposta) => {
        await accesso.nomina(chi, richiesta.body.nome);
        return risposta.code(204).send();
      }),
    );

    type ParametroId = { Params: { id: string } };
    rami.delete<ParametroId>(
      "/dispositivi/:id",
      {
        schema: {
          params: {
            type: "object",
            required: ["id"],
            properties: { id: { type: "string", format: "uuid" } },
          },
        },
      },
      conGettone<ParametroId>(async (chi, richiesta, risposta) => {
        const esito = await accesso.scollega(chi, richiesta.params.id);
        if (esito === "questo") {
          return risposta.code(409).send({ statusCode: 409, message: "Questo dispositivo" });
        }
        if (esito === "altro") {
          return risposta.code(404).send({ statusCode: 404, message: "Dispositivo non trovato" });
        }
        return risposta.code(204).send();
      }),
    );
  });
}
