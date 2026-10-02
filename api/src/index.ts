// Avvio del server (Vercel lo riconosce da questo file, DEC-105).
// - In rete: DATABASE_URL è l'indirizzo di Neon e MEMODU_IMPRONTA l'impronta del gettone,
//   generata con `npm run credenziali` (DEC-104).
// - In locale, senza DATABASE_URL: l'archivio è PGlite nella cartella dei dati e le credenziali
//   nascono al primo avvio nel file `credenziali` della stessa cartella, quello che legge l'app.

import { mkdirSync } from "node:fs";
import Fastify from "fastify";
import { join } from "node:path";
import { cartellaPredefinita } from "./cartella.js";
import { HOST_API, INDIRIZZO_API, PORTA_API } from "./costanti.js";
import { credenzialiNelFile } from "./credenziali.js";
import { daPglite, daPostgres, type Database } from "./database.js";
import { aggiornaSchema } from "./schema.js";
import { configuraServer, opzioniServer } from "./servizio.js";
import { ArchivioSincronizzazione, impronta } from "./sincronizzazione.js";

if (process.env.VERCEL && !process.env.DATABASE_URL) {
  throw new Error("Manca DATABASE_URL: collega il database Neon al progetto su Vercel");
}
const inRete = Boolean(process.env.DATABASE_URL);
let db: Database;
let improntaGettone: string;
if (inRete) {
  if (!process.env.MEMODU_IMPRONTA) {
    throw new Error("Manca MEMODU_IMPRONTA: generala con `npm run credenziali -w @memodu/api`");
  }
  db = daPostgres(process.env.DATABASE_URL!);
  improntaGettone = process.env.MEMODU_IMPRONTA;
} else {
  const cartella = cartellaPredefinita();
  mkdirSync(cartella, { recursive: true });
  db = await daPglite(join(cartella, "archivio"));
  improntaGettone = impronta(
    credenzialiNelFile(join(cartella, "credenziali"), INDIRIZZO_API).gettone,
  );
  console.log(`Archivio e credenziali in ${cartella}`);
}
await aggiornaSchema(db);

const server = configuraServer(
  Fastify(opzioniServer({ registro: inRete })),
  new ArchivioSincronizzazione(db, improntaGettone),
);
await server.listen({
  host: process.env.VERCEL ? "0.0.0.0" : HOST_API,
  port: Number(process.env.PORT ?? PORTA_API),
});
