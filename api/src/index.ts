// Avvio del server (Vercel lo riconosce da questo file, DEC-105).
// - In rete: DATABASE_URL è l'indirizzo di Neon; gli account stanno nel database (DEC-132) e
//   MEMODU_SEGRETO è il segreto del server.
// - In locale, senza DATABASE_URL: l'archivio è PGlite nella cartella dei dati e le variabili
//   stanno in api/.env (scelta di Manuel Cucca del 06/10/2026).
// Le variabili dell'utente fisso (DEC-121), se ci sono, servono solo alla migrazione che ne fa
// il primo account; dopo si possono togliere.

import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import { join } from "node:path";
import { cartellaPredefinita } from "./cartella.js";
import { HOST_API, PORTA_API } from "./costanti.js";
import { Accesso, NOME_SEGRETO, segretoDaAmbiente, utenteFissoDaAmbiente } from "./accesso.js";
import { DepositoLocale, r2DaAmbiente } from "./allegati.js";
import { daPglite, daPostgres, type Database } from "./database.js";
import { aggiornaSchema } from "./schema.js";
import { configuraServer, opzioniServer } from "./servizio.js";
import { ArchivioSincronizzazione } from "./sincronizzazione.js";

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
const segreto = segretoDaAmbiente(process.env);
if (!segreto) {
  throw new Error(
    `Manca ${NOME_SEGRETO}: 32 byte casuali in base64url, ${inRete ? "su Vercel" : "in api/.env"}`,
  );
}
const utenteFisso = utenteFissoDaAmbiente(process.env);
let db: Database;
// Gli allegati di Brainet (DEC-135): in rete Cloudflare R2 con le variabili MEMODU_R2_*; senza,
// le richieste degli allegati rispondono 503. In locale una cartella con gli stessi indirizzi.
let deposito = r2DaAmbiente(process.env);
if (inRete) {
  db = daPostgres(indirizzoDatabase!);
} else {
  const cartella = cartellaPredefinita();
  mkdirSync(cartella, { recursive: true });
  db = await daPglite(join(cartella, "archivio"));
  console.log(`Archivio in ${cartella}`);
  deposito ??= new DepositoLocale(
    join(cartella, "allegati"),
    `http://${HOST_API}:${Number(process.env.PORT ?? PORTA_API)}`,
    segreto,
  );
}
// Il server si mette subito in ascolto; lo schema si prepara intanto e le richieste lo aspettano.
// Se il database non risponde, la richiesta riceve un errore e la successiva riprova.
const avvio = Date.now();
let schema: Promise<void> | undefined;
const schemaPronto = () =>
  (schema ??= aggiornaSchema(db, { utenteFisso }).then(
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
  new ArchivioSincronizzazione(db),
  new Accesso(db, segreto),
  schemaPronto,
  deposito ? { db, deposito } : null,
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
