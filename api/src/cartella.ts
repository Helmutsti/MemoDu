// Cartella dei dati del server: quella delle applicazioni (DEC-46), fuori da OneDrive e iCloud;
// su Windows quella locale, che non segue il profilo nei domini aziendali. MEMODU_CARTELLA la
// sostituisce, per le prove.

import { homedir } from "node:os";
import { join } from "node:path";

export function cartellaPredefinita(): string {
  if (process.env.MEMODU_CARTELLA) return process.env.MEMODU_CARTELLA;
  if (process.platform === "win32") {
    return join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "Memodu");
  }
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "Memodu");
  }
  return join(homedir(), ".local", "share", "Memodu");
}
