// Avvio del server (Vercel lo riconosce da questo file, DEC-105).
// - In rete: DATABASE_URL è l'indirizzo di Neon e MEMODU_IMPRONTA l'impronta del gettone,
//   generata con `npm run credenziali` (DEC-104).
// - In locale, senza DATABASE_URL: l'archivio è PGlite nella cartella dei dati e le credenziali
//   nascono al primo avvio nel file `credenziali` della stessa cartella, quello che legge l'app.

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { HOST_API, INDIRIZZO_API, PORTA_API } from "@memodu/condiviso";
import { cartellaPredefinita } from "./cartella.ts";
import { credenzialiNelFile } from "./credenziali.ts";
import { daPglite, daPostgres, type Database } from "./database.ts";
import { aggiornaSchema } from "./schema.ts";
import { creaServer } from "./servizio.ts";
import { ArchivioSincronizzazione, impronta } from "./sincronizzazione.ts";

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
  improntaGettone = impronta(credenzialiNelFile(join(cartella, "credenziali"), INDIRIZZO_API).gettone);
  console.log(`Archivio e credenziali in ${cartella}`);
}
await aggiornaSchema(db);

const server = creaServer(new ArchivioSincronizzazione(db, improntaGettone), { registro: inRete });
await server.listen({
  host: process.env.VERCEL ? "0.0.0.0" : HOST_API,
  port: Number(process.env.PORT ?? PORTA_API),
});
