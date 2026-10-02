// Credenziali dell'installazione (DEC-79, DEC-104): identificativo, gettone e chiave. Il file
// `credenziali` va nella cartella dei dati dell'app su ogni dispositivo; il server conosce solo
// l'impronta del gettone, che in rete sta nella variabile MEMODU_IMPRONTA.
//
//   npm run credenziali -w @memodu/api -- https://indirizzo.del.server [file]
//
// scrive il file (di base `credenziali` nella cartella corrente, mai sopra uno esistente) e
// stampa solo l'impronta da mettere nel server.

import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { impronta } from "./sincronizzazione.ts";

export interface Credenziali {
  indirizzo: string;
  installazione: string;
  gettone: string;
  chiave: string;
}

export function nuoveCredenziali(indirizzo: string): Credenziali {
  return {
    indirizzo,
    installazione: randomUUID(),
    gettone: randomBytes(32).toString("base64url"),
    chiave: randomBytes(32).toString("base64url"),
  };
}

/** Scrive il file se non c'è; restituisce le credenziali del file. */
export function credenzialiNelFile(file: string, indirizzo: string): Credenziali {
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8")) as Credenziali;
  const credenziali = nuoveCredenziali(indirizzo);
  writeFileSync(file, JSON.stringify(credenziali) + "\n", { mode: 0o600, flag: "wx" });
  return credenziali;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [indirizzo, destinazione = "credenziali"] = process.argv.slice(2);
  if (!indirizzo?.startsWith("https://")) {
    console.error(
      "Indica l'indirizzo del server in https://, per esempio https://memodu.vercel.app",
    );
    process.exit(1);
  }
  const file = resolve(destinazione);
  if (existsSync(file)) {
    console.error(`Esiste già ${file}: non lo sovrascrivo.`);
    process.exit(1);
  }
  const credenziali = credenzialiNelFile(file, indirizzo);
  console.log(
    `Credenziali scritte in ${file}: copialo nella cartella dei dati di ogni dispositivo.`,
  );
  console.log(
    `Nel server, la variabile d'ambiente:\nMEMODU_IMPRONTA=${impronta(credenziali.gettone)}`,
  );
}
