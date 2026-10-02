import { homedir } from "node:os";
import { join } from "node:path";
function cartellaPredefinita() {
  if (process.env.MEMODU_CARTELLA) return process.env.MEMODU_CARTELLA;
  if (process.platform === "win32") {
    return join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "Memodu");
  }
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "Memodu");
  }
  return join(homedir(), ".local", "share", "Memodu");
}
export {
  cartellaPredefinita
};
