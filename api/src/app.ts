import Fastify, { type FastifyInstance } from "fastify";
import { LIMITE_CORPO_BYTE } from "@memodu/condiviso";
import { rotteSincronizzazione } from "./rotteSincronizzazione.ts";
import type { ArchivioSincronizzazione } from "./sincronizzazione.ts";

// Il server è solo il deposito della sincronizzazione (DEC-85): note, cartelle, cestino e tag
// sono comandi del client. Fastify controlla input e output con gli schemi: le richieste fuori
// schema ricevono 400, i corpi oltre 10 MB 413 (EN-01), gli errori di scrittura 500 (SF-32).

export function creaServer(sincronizzazione: ArchivioSincronizzazione): FastifyInstance {
  const server = Fastify({
    bodyLimit: LIMITE_CORPO_BYTE,
    logger: false,
    // Nessuna conversione silenziosa: un campo del tipo sbagliato o in più è un 400.
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false } },
  });
  rotteSincronizzazione(server, sincronizzazione);
  return server;
}
