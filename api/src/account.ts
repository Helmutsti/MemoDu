// Crea gli account nel database (DEC-132, RB-88, RB-90) e stampa una volta sola la chiave di
// recupero, che durante la prova conserva Manuel Cucca. Il database è quello di DATABASE_URL o,
// senza, il PGlite della cartella dei dati (con il server locale fermo). Password e chiave di
// recupero si scrivono senza eco e non passano mai dalla riga di comando.
//
//   npm run account -w @memodu/api               account nuovo, con la sua chiave di recupero
//   npm run account -w @memodu/api -- --elenco   email e data di creazione degli account

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Accesso, segretoDaAmbiente, utenteFissoDaAmbiente } from "./accesso.js";
import { cartellaPredefinita } from "./cartella.js";
import { creaUtente, problemaPassword, scriviRecupero } from "./chiavi.js";
import { daPglite, daPostgres, type Database } from "./database.js";
import { aggiornaSchema } from "./schema.js";

/** Le righe dell'input quando non è un terminale (per esempio da un file): una lettura sola. */
let righe: AsyncIterator<string> | undefined;

/** Una riga dal terminale; con `nascosta` i caratteri non si vedono. */
async function chiedi(domanda: string, nascosta = false): Promise<string> {
  if (!process.stdin.isTTY) {
    righe ??= createInterface({ input: process.stdin })[Symbol.asyncIterator]();
    process.stdout.write(domanda);
    const { value, done } = await righe.next();
    if (done) throw new Error("Input finito prima delle risposte");
    process.stdout.write("\n");
    return value.trim();
  }
  if (!nascosta) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      return (await rl.question(domanda)).trim();
    } finally {
      rl.close();
    }
  }
  process.stdout.write(domanda);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise((risolvi, rifiuta) => {
    let testo = "";
    const leggi = (dati: Buffer) => {
      for (const c of dati.toString("utf8")) {
        if (c === "\r" || c === "\n") {
          fine();
          process.stdout.write("\n");
          return risolvi(testo);
        }
        if (c === "\u0003") {
          fine();
          return rifiuta(new Error("Interrotto"));
        }
        if (c === "\u007f" || c === "\b") testo = [...testo].slice(0, -1).join("");
        else testo += c;
      }
    };
    const fine = () => {
      process.stdin.off("data", leggi);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };
    process.stdin.on("data", leggi);
  });
}

async function passwordNuova(): Promise<string> {
  for (;;) {
    const password = await chiedi("Password: ", true);
    const problema = problemaPassword(password);
    if (problema) {
      console.error(problema);
      continue;
    }
    if ((await chiedi("Ripeti la password: ", true)) === password) return password;
    console.error("Le due password non coincidono.");
  }
}

async function apriDatabase(): Promise<Database> {
  const file = fileURLToPath(new URL("../.env", import.meta.url));
  if (existsSync(file)) process.loadEnvFile(file);
  const indirizzo = [process.env.DATABASE_URL, process.env.POSTGRES_URL].find((v) =>
    /^postgres(ql)?:\/\//.test(v ?? ""),
  );
  if (indirizzo) return daPostgres(indirizzo);
  const cartella = cartellaPredefinita();
  mkdirSync(cartella, { recursive: true });
  return daPglite(join(cartella, "archivio"));
}

async function principale(argomenti: string[]): Promise<void> {
  const db = await apriDatabase();
  try {
    await aggiornaSchema(db, { utenteFisso: utenteFissoDaAmbiente(process.env) });
    // Il segreto serve solo al sale finto delle email sconosciute: qui non conta.
    const accesso = new Accesso(db, segretoDaAmbiente(process.env) ?? "x".repeat(43));
    if (argomenti.includes("--elenco")) {
      for (const a of await accesso.elencoAccount()) console.log(`${a.creato_il}  ${a.email}`);
      return;
    }
    const email = await chiedi("Email: ");
    if (!/^[^\s@]+@[^\s@]+$/.test(email)) throw new Error("Non sembra un'email");
    const { dati, recupero } = creaUtente(email, await passwordNuova());
    if (!(await accesso.creaAccount(dati))) {
      throw new Error("Esiste già un account con questa email");
    }
    console.log(`\nAccount creato: ${dati.email}`);
    console.log("\nChiave di recupero: si mostra solo adesso. Conservala lontano dal computer;");
    console.log("durante la prova la tiene Manuel Cucca. Senza password e senza chiave di");
    console.log("recupero le note sul server non si recuperano; chi la trova le può leggere.\n");
    console.log(`  ${scriviRecupero(recupero)}\n`);
  } finally {
    await db.chiudi();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  principale(process.argv.slice(2)).catch((errore: unknown) => {
    console.error(errore instanceof Error ? errore.message : errore);
    process.exit(1);
  });
}
