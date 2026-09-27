import Fastify, { type FastifyInstance } from "fastify";
import { LIMITE_CORPO_BYTE } from "@memodu/condiviso";

// Crea il server senza avviarlo, così le prove possono usarlo con inject().
// Gli endpoint delle note arrivano con l'attività 3 (architettura/api.md).
export function creaServer(): FastifyInstance {
  return Fastify({ bodyLimit: LIMITE_CORPO_BYTE, logger: false });
}
