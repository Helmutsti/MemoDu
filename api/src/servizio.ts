import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import type { Accesso } from "./accesso.js";
import { LIMITE_RICHIESTA_BYTE } from "./costanti.js";
import { rotteAccesso } from "./rotteAccesso.js";
import {
  ArchivioAllegati,
  type Deposito,
  DepositoLocale,
  LIMITE_ALLEGATO_BYTE,
} from "./allegati.js";
import type { Database } from "./database.js";
import { rotteSincronizzazione } from "./rotteSincronizzazione.js";
import type { ArchivioSincronizzazione } from "./sincronizzazione.js";

// Il server è solo il deposito della sincronizzazione (DEC-85): note, cartelle, cestino e tag
// sono comandi del client. Fastify controlla input e output con gli schemi: le richieste fuori
// schema ricevono 400, i corpi oltre il limite di Vercel 413 (DEC-106), gli errori 500 senza
// dettagli interni (il dettaglio va nel registro).

export function opzioniServer({
  registro = false,
}: { registro?: boolean } = {}): FastifyServerOptions {
  return {
    bodyLimit: LIMITE_RICHIESTA_BYTE,
    // Il registro non contiene le intestazioni, quindi nemmeno il gettone.
    logger: registro ? { level: process.env.LOG_LEVEL ?? "info" } : false,
    // Nessuna conversione silenziosa: un campo del tipo sbagliato o in più è un 400.
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false } },
  };
}

/** Il motivo di un errore del database, senza dati: il codice o l'inizio del messaggio. */
const motivo = (errore: unknown): string => {
  const e = errore as { code?: string; message?: string };
  return e.code ?? e.message?.slice(0, 120) ?? String(errore);
};

/** Al massimo `ms` millisecondi, poi un errore «timeout». */
const entro = <T>(lavoro: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    lavoro,
    new Promise<never>((_, rifiuta) => setTimeout(() => rifiuta(new Error("timeout")), ms)),
  ]);

/**
 * Aggiunge al server la gestione degli errori, i controlli e le rotte. `preparazione` è lo
 * schema dell'archivio: le richieste della sincronizzazione lo aspettano, `/vivo` no. Le
 * richieste della sincronizzazione valgono solo con il gettone di un dispositivo (DEC-133).
 */
export function configuraServer(
  server: FastifyInstance,
  sincronizzazione: ArchivioSincronizzazione,
  accesso: Accesso,
  preparazione: () => Promise<void> = () => Promise.resolve(),
  /** Gli allegati (DEC-135): il database dell'elenco e il deposito dei file (R2 o una cartella). */
  allegati: { db: Database; deposito: Deposito } | null = null,
): FastifyInstance {
  server.setErrorHandler<{ statusCode?: number }>((errore, richiesta, risposta) => {
    const codice = errore.statusCode ?? 500;
    if (codice < 500) return risposta.send(errore);
    richiesta.log.error(errore);
    return risposta.code(codice).send({ statusCode: codice, message: "Errore del server" });
  });
  server.addHook("onRequest", async (richiesta) => {
    if (richiesta.url === "/vivo" || richiesta.url === "/salute") return;
    await preparazione();
  });
  // La funzione risponde, senza toccare il database.
  server.get("/vivo", async () => ({ stato: "ok" }));
  // Controllo di salute, senza gettone: schema e archivio pronti entro 8 secondi, o il motivo.
  server.get("/salute", async (richiesta, risposta) => {
    try {
      await entro(
        preparazione().then(() => sincronizzazione.pronto()),
        8_000,
      );
      return { stato: "ok" };
    } catch (errore) {
      richiesta.log.error(errore);
      return risposta
        .code(503)
        .send({ stato: "archivio non raggiungibile", motivo: motivo(errore) });
    }
  });
  rotteAccesso(server, accesso);
  rotteSincronizzazione(
    server,
    sincronizzazione,
    (g) => accesso.autorizza(g),
    (chi) => accesso.sincronizzato(chi),
    allegati ? new ArchivioAllegati(allegati.db, allegati.deposito) : null,
  );
  if (allegati?.deposito instanceof DepositoLocale) rotteDeposito(server, allegati.deposito);
  return server;
}

/**
 * Il deposito finto di locale e delle prove: gli stessi indirizzi firmati di R2, serviti dal
 * server. La firma nell'indirizzo è l'unico permesso, come su R2.
 */
function rotteDeposito(server: FastifyInstance, deposito: DepositoLocale): void {
  server.register(async (rami) => {
    rami.addContentTypeParser(
      "*",
      { parseAs: "buffer", bodyLimit: LIMITE_ALLEGATO_BYTE },
      (_r, corpo, fatto) => fatto(null, corpo),
    );
    type Richiesta = { Params: { "*": string }; Querystring: { scade?: string; firma?: string } };
    const permesso = (
      r: { params: { "*": string }; query: { scade?: string; firma?: string } },
      metodo: string,
    ) => deposito.valida(r.params["*"], metodo, Number(r.query.scade), r.query.firma ?? "");
    rami.put<Richiesta>(
      "/deposito/*",
      { bodyLimit: LIMITE_ALLEGATO_BYTE },
      async (richiesta, risposta) => {
        if (!permesso(richiesta, "PUT")) return risposta.code(403).send();
        await deposito.scrivi(richiesta.params["*"], richiesta.body as Buffer);
        return risposta.code(200).send();
      },
    );
    rami.get<Richiesta>("/deposito/*", async (richiesta, risposta) => {
      if (!permesso(richiesta, "GET")) return risposta.code(403).send();
      const byte = await deposito.leggi(richiesta.params["*"]);
      if (!byte) return risposta.code(404).send();
      return risposta.type("application/octet-stream").send(byte);
    });
  });
}

/** Per le prove: un server senza registro. */
export function creaServer(
  sincronizzazione: ArchivioSincronizzazione,
  accesso: Accesso,
  allegati: { db: Database; deposito: Deposito } | null = null,
): FastifyInstance {
  return configuraServer(Fastify(opzioniServer()), sincronizzazione, accesso, undefined, allegati);
}
