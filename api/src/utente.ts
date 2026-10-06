// Crea l'utente fisso (DEC-121, RB-88, RB-90) e stampa le righe delle variabili del server, da
// copiare su Vercel o in api/.env (scelta di Manuel Cucca del 06/10/2026). Password e chiave di
// recupero si scrivono senza eco e non passano mai dalla riga di comando.
//
//   npm run utente -w @memodu/api                     utente nuovo, con una chiave di recupero
//   npm run utente -w @memodu/api -- --recupero       password nuova con la chiave di recupero
//   npm run utente -w @memodu/api -- --nuovo-recupero chiave di recupero nuova con la password
//
// Le ultime due leggono i dati attuali da api/.env o dalle variabili d'ambiente.

import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { righeVariabili, utenteDaAmbiente } from "./accesso.js";
import {
  SCOPI,
  chiaveDatiDaRecupero,
  creaUtente,
  daPassword,
  improntaProva,
  leggiRecupero,
  problemaPassword,
  scriviRecupero,
  type DatiUtente,
} from "./chiavi.js";
import { svolgi } from "./xchacha.js";

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

function datiAttuali(): DatiUtente {
  const file = fileURLToPath(new URL("../.env", import.meta.url));
  if (existsSync(file)) process.loadEnvFile(file);
  const utente = utenteDaAmbiente(process.env);
  if (!utente) throw new Error("Non trovo l'utente: servono api/.env o le variabili MEMODU_*");
  return utente.dati;
}

function stampa(dati: DatiUtente, recupero?: Buffer): void {
  console.log("\nRighe per Vercel (Settings › Environment Variables) o per api/.env:\n");
  console.log(righeVariabili(dati, randomBytes(32).toString("base64url")));
  if (recupero) {
    console.log("\nChiave di recupero: stampala e conservala lontano dal computer.");
    console.log(
      "Si mostra solo adesso. Senza password e senza chiave di recupero le note sul server",
    );
    console.log("non si recuperano; chi la trova può leggere tutte le note.\n");
    console.log(`  ${scriviRecupero(recupero)}\n`);
  }
  console.log("Il segreto dei gettoni è nuovo: tutti i dispositivi rifaranno l'accesso.");
}

async function principale(argomenti: string[]): Promise<void> {
  if (argomenti.includes("--recupero")) {
    const dati = datiAttuali();
    const recupero = leggiRecupero(await chiedi("Chiave di recupero: ", true));
    const chiaveDati = chiaveDatiDaRecupero(dati, recupero);
    const { dati: nuovi } = creaUtente(dati.email, await passwordNuova(), { chiaveDati, recupero });
    return stampa(nuovi);
  }
  if (argomenti.includes("--nuovo-recupero")) {
    const dati = datiAttuali();
    const password = await chiedi("Password attuale: ", true);
    const p = daPassword(password, Buffer.from(dati.sale, "base64url"), dati.argon2);
    if (improntaProva(p.prova) !== dati.improntaAccesso)
      throw new Error("La password non è giusta");
    const chiaveDati = svolgi(p.cassaforte, dati.chiavePassword, SCOPI.chiaveDatiPassword);
    const { dati: nuovi, recupero } = creaUtente(dati.email, password, { chiaveDati });
    return stampa(nuovi, recupero);
  }
  const email = await chiedi("Email: ");
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) throw new Error("Non sembra un'email");
  const { dati, recupero } = creaUtente(email, await passwordNuova());
  stampa(dati, recupero);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  principale(process.argv.slice(2)).catch((errore: unknown) => {
    console.error(errore instanceof Error ? errore.message : errore);
    process.exit(1);
  });
}
