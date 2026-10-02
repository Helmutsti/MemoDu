import { mkdirSync } from "node:fs";
import Fastify from "fastify";
import { join } from "node:path";
import { cartellaPredefinita } from "./cartella.js";
import { HOST_API, INDIRIZZO_API, PORTA_API } from "./costanti.js";
import { credenzialiNelFile } from "./credenziali.js";
import { daPglite, daPostgres } from "./database.js";
import { aggiornaSchema } from "./schema.js";
import { configuraServer, opzioniServer } from "./servizio.js";
import { ArchivioSincronizzazione, impronta } from "./sincronizzazione.js";
const indirizzoDatabase = [process.env.DATABASE_URL, process.env.POSTGRES_URL].find(
  (v) => /^postgres(ql)?:\/\//.test(v ?? "")
);
if (process.env.VERCEL && !indirizzoDatabase) {
  throw new Error(
    "DATABASE_URL manca o non comincia con postgresql://: collega il database Neon al progetto su Vercel"
  );
}
const inRete = Boolean(indirizzoDatabase);
let db;
let improntaGettone;
if (inRete) {
  if (!process.env.MEMODU_IMPRONTA) {
    throw new Error("Manca MEMODU_IMPRONTA: generala con `npm run credenziali -w @memodu/api`");
  }
  db = daPostgres(indirizzoDatabase);
  improntaGettone = process.env.MEMODU_IMPRONTA;
} else {
  const cartella = cartellaPredefinita();
  mkdirSync(cartella, { recursive: true });
  db = await daPglite(join(cartella, "archivio"));
  improntaGettone = impronta(
    credenzialiNelFile(join(cartella, "credenziali"), INDIRIZZO_API).gettone
  );
  console.log(`Archivio e credenziali in ${cartella}`);
}
const avvio = Date.now();
let schema;
const schemaPronto = () => schema ??= aggiornaSchema(db).then(
  () => console.log(`Schema pronto in ${Date.now() - avvio} ms`),
  (errore) => {
    schema = void 0;
    console.error("Schema non pronto:", errore);
    throw errore;
  }
);
schemaPronto().catch(() => void 0);
const server = configuraServer(
  Fastify(opzioniServer({ registro: inRete })),
  new ArchivioSincronizzazione(db, improntaGettone)
);
server.addHook("onRequest", async () => {
  await schemaPronto();
});
await server.listen(
  process.env.VERCEL ? { port: Number(process.env.PORT ?? 3e3) } : { host: HOST_API, port: Number(process.env.PORT ?? PORTA_API) }
);
console.log(`In ascolto dopo ${Date.now() - avvio} ms`);
