import Fastify from "fastify";
import { LIMITE_RICHIESTA_BYTE } from "./costanti.js";
import { rotteSincronizzazione } from "./rotteSincronizzazione.js";
function opzioniServer({
  registro = false
} = {}) {
  return {
    bodyLimit: LIMITE_RICHIESTA_BYTE,
    // Il registro non contiene le intestazioni, quindi nemmeno il gettone.
    logger: registro ? { level: process.env.LOG_LEVEL ?? "info" } : false,
    // Nessuna conversione silenziosa: un campo del tipo sbagliato o in più è un 400.
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false } }
  };
}
function configuraServer(server, sincronizzazione) {
  server.setErrorHandler((errore, richiesta, risposta) => {
    const codice = errore.statusCode ?? 500;
    if (codice < 500) return risposta.send(errore);
    richiesta.log.error(errore);
    return risposta.code(codice).send({ statusCode: codice, message: "Errore del server" });
  });
  server.get("/salute", async (_richiesta, risposta) => {
    const pronto = await sincronizzazione.pronto().catch(() => false);
    return risposta.code(pronto ? 200 : 503).send({ stato: pronto ? "ok" : "archivio non raggiungibile" });
  });
  rotteSincronizzazione(server, sincronizzazione);
  return server;
}
function creaServer(sincronizzazione) {
  return configuraServer(Fastify(opzioniServer()), sincronizzazione);
}
export {
  configuraServer,
  creaServer,
  opzioniServer
};
