import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { impronta } from "./sincronizzazione.js";
function nuoveCredenziali(indirizzo) {
  return {
    indirizzo,
    installazione: randomUUID(),
    gettone: randomBytes(32).toString("base64url"),
    chiave: randomBytes(32).toString("base64url")
  };
}
function credenzialiNelFile(file, indirizzo) {
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  const credenziali = nuoveCredenziali(indirizzo);
  writeFileSync(file, JSON.stringify(credenziali) + "\n", { mode: 384, flag: "wx" });
  return credenziali;
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [indirizzo, destinazione = "credenziali"] = process.argv.slice(2);
  if (!indirizzo?.startsWith("https://")) {
    console.error(
      "Indica l'indirizzo del server in https://, per esempio https://memodu.vercel.app"
    );
    process.exit(1);
  }
  const file = resolve(destinazione);
  if (existsSync(file)) {
    console.error(`Esiste gi\xE0 ${file}: non lo sovrascrivo.`);
    process.exit(1);
  }
  const credenziali = credenzialiNelFile(file, indirizzo);
  console.log(
    `Credenziali scritte in ${file}: copialo nella cartella dei dati di ogni dispositivo.`
  );
  console.log(
    `Nel server, la variabile d'ambiente:
MEMODU_IMPRONTA=${impronta(credenziali.gettone)}`
  );
}
export {
  credenzialiNelFile,
  nuoveCredenziali
};
