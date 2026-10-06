// Avvio del server (Vercel lo riconosce da questo file, DEC-105).
// - In rete: DATABASE_URL è l'indirizzo di Neon; l'utente fisso sta nelle variabili MEMODU_*
//   stampate da `npm run utente` (DEC-121) e, finché le app non hanno l'accesso, MEMODU_IMPRONTA
//   è l'impronta del gettone statico (DEC-104). Serve almeno uno dei due.
// - In locale, senza DATABASE_URL: l'archivio è PGlite nella cartella dei dati, l'utente fisso in
//   api/.env (scelta di Manuel Cucca del 06/10/2026) e il gettone statico nel file `credenziali`
//   della cartella dei dati, quello che legge l'app di oggi.

import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import { join } from "node:path";
import { cartellaPredefinita } from "./cartella.js";
import { HOST_API, INDIRIZZO_API, PORTA_API } from "./costanti.js";
import { Accesso, utenteDaAmbiente } from "./accesso.js";
import { credenzialiNelFile } from "./credenziali.js";
import { daPglite, daPostgres, type Database } from "./database.js";
import { aggiornaSchema } from "./schema.js";
import { configuraServer, opzioniServer } from "./servizio.js";
import { ArchivioSincronizzazione, impronta } from "./sincronizzazione.js";

// Neon su Vercel la chiama DATABASE_URL, a volte POSTGRES_URL: vale la prima che è davvero un
// indirizzo di PostgreSQL.
const indirizzoDatabase = [process.env.DATABASE_URL, process.env.POSTGRES_URL].find((v) =>
  /^postgres(ql)?:\/\//.test(v ?? ""),
);
if (process.env.VERCEL && !indirizzoDatabase) {
  throw new Error(
    "DATABASE_URL manca o non comincia con postgresql://: collega il database Neon al progetto su Vercel",
  );
}
const inRete = Boolean(indirizzoDatabase);
const fileUtente = fileURLToPath(new URL("../.env", import.meta.url));
if (!inRete && existsSync(fileUtente)) process.loadEnvFile(fileUtente);
const utente = utenteDaAmbiente(process.env);
const accesso = utente ? new Accesso(utente.dati, utente.segreto) : undefined;
let db: Database;
let improntaGettone: string;
if (inRete) {
  if (!accesso && !process.env.MEMODU_IMPRONTA) {
    throw new Error(
      "Mancano l'utente fisso (variabili MEMODU_*, `npm run utente -w @memodu/api`) e MEMODU_IMPRONTA",
    );
  }
  db = daPostgres(indirizzoDatabase!);
  improntaGettone = process.env.MEMODU_IMPRONTA ?? "";
} else {
  const cartella = cartellaPredefinita();
  mkdirSync(cartella, { recursive: true });
  db = await daPglite(join(cartella, "archivio"));
  improntaGettone = impronta(
    credenzialiNelFile(join(cartella, "credenziali"), INDIRIZZO_API).gettone,
  );
  console.log(`Archivio e credenziali in ${cartella}`);
}
console.log(
  accesso ? "Accesso acceso: utente fisso configurato" : "Accesso spento: nessun utente fisso",
);
// Il server si mette subito in ascolto; lo schema si prepara intanto e le richieste lo aspettano.
// Se il database non risponde, la richiesta riceve un errore e la successiva riprova.
const avvio = Date.now();
let schema: Promise<void> | undefined;
const schemaPronto = () =>
  (schema ??= aggiornaSchema(db).then(
    () => console.log(`Schema pronto in ${Date.now() - avvio} ms`),
    (errore: unknown) => {
      schema = undefined;
      console.error("Schema non pronto:", errore);
      throw errore;
    },
  ));
schemaPronto().catch(() => undefined);

const server = configuraServer(
  Fastify(opzioniServer({ registro: inRete })),
  new ArchivioSincronizzazione(db, improntaGettone),
  schemaPronto,
  accesso,
);
// Su Vercel come nella sua guida per Fastify: basta la porta, e `listen` non si aspetta. Vercel
// lo intercetta: aspettandolo al primo livello il modulo non finirebbe mai di caricarsi.
void server
  .listen(
    process.env.VERCEL
      ? { port: Number(process.env.PORT ?? 3000) }
      : { host: HOST_API, port: Number(process.env.PORT ?? PORTA_API) },
  )
  .then(() => console.log(`In ascolto dopo ${Date.now() - avvio} ms`));
