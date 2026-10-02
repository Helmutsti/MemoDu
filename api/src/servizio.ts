import Fastify, { type FastifyInstance } from "fastify";
import { LIMITE_RICHIESTA_BYTE } from "@memodu/condiviso";
import { rotteSincronizzazione } from "./rotteSincronizzazione.ts";
import type { ArchivioSincronizzazione } from "./sincronizzazione.ts";

// Il server è solo il deposito della sincronizzazione (DEC-85): note, cartelle, cestino e tag
// sono comandi del client. Fastify controlla input e output con gli schemi: le richieste fuori
// schema ricevono 400, i corpi oltre il limite di Vercel 413 (DEC-106), gli errori 500 senza
// dettagli interni (il dettaglio va nel registro).

export function creaServer(
  sincronizzazione: ArchivioSincronizzazione,
  { registro = false }: { registro?: boolean } = {},
): FastifyInstance {
  const server = Fastify({
    bodyLimit: LIMITE_RICHIESTA_BYTE,
    // Il registro non contiene le intestazioni, quindi nemmeno il gettone.
    logger: registro ? { level: process.env.LOG_LEVEL ?? "info" } : false,
    // Nessuna conversione silenziosa: un campo del tipo sbagliato o in più è un 400.
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false } },
  });
  server.setErrorHandler<{ statusCode?: number }>((errore, richiesta, risposta) => {
    const codice = errore.statusCode ?? 500;
    if (codice < 500) return risposta.send(errore);
    richiesta.log.error(errore);
    return risposta.code(codice).send({ statusCode: codice, message: "Errore del server" });
  });
  // Controllo di salute, senza gettone: risponde se il server e l'archivio sono su.
  server.get("/salute", async (_richiesta, risposta) => {
    const pronto = await sincronizzazione.pronto().catch(() => false);
    return risposta.code(pronto ? 200 : 503).send({ stato: pronto ? "ok" : "archivio non raggiungibile" });
  });
  rotteSincronizzazione(server, sincronizzazione);
  return server;
}
