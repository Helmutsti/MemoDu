import Fastify, { type FastifyInstance, type FastifyServerOptions } from "fastify";
import type { Accesso } from "./accesso.js";
import { LIMITE_RICHIESTA_BYTE } from "./costanti.js";
import { rotteAccesso } from "./rotteAccesso.js";
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
 * richieste della sincronizzazione valgono solo con il JWT di `accesso` (DEC-121).
 */
export function configuraServer(
  server: FastifyInstance,
  sincronizzazione: ArchivioSincronizzazione,
  accesso: Accesso,
  preparazione: () => Promise<void> = () => Promise.resolve(),
): FastifyInstance {
  server.setErrorHandler<{ statusCode?: number }>((errore, richiesta, risposta) => {
    const codice = errore.statusCode ?? 500;
    if (codice < 500) return risposta.send(errore);
    richiesta.log.error(errore);
    return risposta.code(codice).send({ statusCode: codice, message: "Errore del server" });
  });
  server.addHook("onRequest", async (richiesta) => {
    if (richiesta.url === "/vivo" || richiesta.url === "/salute") return;
    if (richiesta.url.startsWith("/accesso")) return;
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
  rotteSincronizzazione(server, sincronizzazione, (g) => accesso.autorizzato(g));
  return server;
}

/** Per le prove: un server senza registro. */
export function creaServer(
  sincronizzazione: ArchivioSincronizzazione,
  accesso: Accesso,
): FastifyInstance {
  return configuraServer(Fastify(opzioniServer()), sincronizzazione, accesso);
}
