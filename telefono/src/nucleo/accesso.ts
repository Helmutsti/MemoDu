// Accesso con email e password (RF-14, DEC-121, DEC-133), come client/src-tauri/src/accesso.rs:
// sale e parametri dal server, prova di accesso e cassaforte dalla password sul telefono, poi il
// gettone di questo dispositivo e la chiave dati avvolta, che si apre qui. La password non lascia
// il telefono; gettone e chiave dati restano nel portachiavi (expo-secure-store).

import { problemaPassword } from "../../../condiviso/src/password";
import { casuali } from "./casuali";
import {
  ARGON2,
  apriBlocco,
  avvolgiChiaveDati,
  b64,
  chiudiBlocco,
  daB64,
  daPassword,
  daRecupero,
  leggiRecupero,
  scriviRecupero,
  svolgiChiaveDati,
  type ParametriArgon2,
} from "./cifratura";
import { INDIRIZZO, richiesta } from "./sinc";

export interface Sessione {
  email: string;
  gettone: string;
  dispositivo: string;
  chiave: Uint8Array;
}

export type ErroreAccesso = "credenziali" | "rete" | "errore";

const SCOPO_NOME = "memodu/nome-dispositivo";
const TENTATIVI = 3;

type Chiamata = typeof fetch;

async function chiama(
  percorso: string,
  corpo: unknown,
  gettone: string | undefined,
  f: Chiamata,
  indirizzo: string,
) {
  let ultimo: unknown;
  for (let i = 0; i < TENTATIVI; i++) {
    try {
      return await richiesta({ gettone }, "POST", percorso, corpo, f, indirizzo);
    } catch (e) {
      ultimo = e;
    }
  }
  throw ultimo;
}

/** Accede; con le credenziali sbagliate «credenziali», senza server «rete». */
export async function accedi(
  email: string,
  password: string,
  f: Chiamata = fetch,
  indirizzo = INDIRIZZO,
): Promise<Sessione> {
  const e = email.trim().toLowerCase();
  let p;
  try {
    p = await chiama("/accesso/parametri", { email: e }, undefined, f, indirizzo);
  } catch {
    throw "rete" satisfies ErroreAccesso;
  }
  if (p.stato !== 200) throw "errore" satisfies ErroreAccesso;
  const { sale, argon2 } = p.json as { sale: string; argon2: ParametriArgon2 };
  const saleByte = daB64(sale);
  if (!saleByte) throw "errore" satisfies ErroreAccesso;
  const { prova, cassaforte } = await daPassword(password, saleByte, argon2);
  let r;
  try {
    r = await chiama(
      "/accesso",
      { email: e, prova: b64(prova), tipo: "ios" },
      undefined,
      f,
      indirizzo,
    );
  } catch {
    throw "rete" satisfies ErroreAccesso;
  }
  if (r.stato === 401) throw "credenziali" satisfies ErroreAccesso;
  if (r.stato !== 200) throw "errore" satisfies ErroreAccesso;
  const risposta = r.json as { gettone?: string; dispositivo?: string; chiave?: string };
  const chiave = risposta.chiave ? svolgiChiaveDati(cassaforte, risposta.chiave) : null;
  if (!chiave || !risposta.gettone || !risposta.dispositivo) throw "errore" satisfies ErroreAccesso;
  return { email: e, gettone: risposta.gettone, dispositivo: risposta.dispositivo, chiave };
}

/** Manda il nome di questo dispositivo, cifrato con la chiave dati (RB-51, RB-100). */
export async function mandaNome(
  s: Sessione,
  nome: string,
  f: Chiamata = fetch,
  indirizzo = INDIRIZZO,
) {
  try {
    await richiesta(
      s,
      "PUT",
      "/dispositivi/questo",
      { nome: chiudiBlocco(s.chiave, SCOPO_NOME, nome) },
      f,
      indirizzo,
    );
  } catch {
    // Si riprova al prossimo accesso.
  }
}

/** Perché il cambio della password non è riuscito (SC-08), come gli errori del computer. */
export type ErroreCambio =
  { tipo: "password"; testo: string } | { tipo: "verifica" | "rete" | "accesso" | "errore" };

/** Sale, parametri, prova e chiave dati avvolta per una password nuova (RB-98). */
async function passwordNuova(password: string, chiave: Uint8Array) {
  const sale = casuali(16);
  const { prova, cassaforte } = await daPassword(password, sale, ARGON2);
  return {
    sale: b64(sale),
    argon2: ARGON2,
    prova: b64(prova),
    chiave: avvolgiChiaveDati(cassaforte, chiave, false),
  };
}

/**
 * Cambia la password da questo telefono (SC-08, RB-98), verificando con la password attuale o con
 * la chiave di recupero, come client/src-tauri/src/accesso.rs. Con la chiave di recupero ne nasce
 * una nuova, che si restituisce per mostrarla una volta (RB-99). Questo dispositivo resta collegato.
 */
export async function cambiaPassword(
  s: Sessione,
  verifica: { attuale: string } | { chiaveRecupero: string },
  nuova: string,
  scollegaAltri: boolean,
  f: Chiamata = fetch,
  indirizzo = INDIRIZZO,
): Promise<{ chiave: string | null }> {
  const problema = problemaPassword(nuova);
  if (problema) throw { tipo: "password", testo: problema } satisfies ErroreCambio;
  let corpo: Record<string, unknown>;
  let chiaveNuova: string | null = null;
  try {
    if ("attuale" in verifica) {
      const p = await chiama("/accesso/parametri", { email: s.email }, undefined, f, indirizzo);
      if (p.stato !== 200) throw { tipo: "errore" } satisfies ErroreCambio;
      const { sale, argon2 } = p.json as { sale: string; argon2: ParametriArgon2 };
      const saleByte = daB64(sale);
      if (!saleByte) throw { tipo: "errore" } satisfies ErroreCambio;
      const { prova } = await daPassword(verifica.attuale, saleByte, argon2);
      corpo = { verifica: { tipo: "password", prova: b64(prova) } };
    } else {
      const vecchia = leggiRecupero(verifica.chiaveRecupero);
      if (!vecchia) throw { tipo: "verifica" } satisfies ErroreCambio;
      const recupero = casuali(32);
      const r = daRecupero(recupero);
      chiaveNuova = scriviRecupero(recupero);
      corpo = {
        verifica: { tipo: "recupero", prova: b64(daRecupero(vecchia).prova) },
        recupero_nuovo: {
          prova: b64(r.prova),
          chiave: avvolgiChiaveDati(r.cassaforte, s.chiave, true),
        },
      };
    }
    corpo.nuova = await passwordNuova(nuova, s.chiave);
    corpo.scollega_altri = scollegaAltri;
    const r = await chiama("/accesso/password", corpo, s.gettone, f, indirizzo);
    if (r.stato === 403) throw { tipo: "verifica" } satisfies ErroreCambio;
    if (r.stato === 401) throw { tipo: "accesso" } satisfies ErroreCambio;
    if (r.stato !== 204) throw { tipo: "errore" } satisfies ErroreCambio;
    return { chiave: chiaveNuova };
  } catch (e) {
    if (e && typeof e === "object" && "tipo" in e) throw e;
    throw { tipo: "rete" } satisfies ErroreCambio;
  }
}

/** Un dispositivo dell'account (SC-09), con il nome già aperto. */
export interface Dispositivo {
  id: string;
  nome: string | null;
  tipo: "windows" | "macos" | "ios";
  ultimaSincronizzazione: string | null;
  questo: boolean;
}

/** I dispositivi collegati all'account (SC-09, RB-100); senza server lancia un errore. */
export async function elencaDispositivi(
  s: Sessione,
  f: Chiamata = fetch,
  indirizzo = INDIRIZZO,
): Promise<Dispositivo[]> {
  const r = await richiesta(s, "GET", "/dispositivi", undefined, f, indirizzo);
  if (r.stato !== 200) throw new Error(`dispositivi: ${r.stato}`);
  return (
    r.json as {
      id: string;
      nome: string | null;
      tipo: Dispositivo["tipo"];
      ultima_sincronizzazione: string | null;
      questo: boolean;
    }[]
  ).map((d) => ({
    id: d.id,
    nome: d.nome ? apriBlocco(s.chiave, SCOPO_NOME, d.nome) : null,
    tipo: d.tipo,
    ultimaSincronizzazione: d.ultima_sincronizzazione,
    questo: d.questo,
  }));
}

/** Scollega un altro dispositivo (RB-100); già sparito va bene lo stesso (SF-20). */
export async function scollegaDispositivo(
  s: Sessione,
  id: string,
  f: Chiamata = fetch,
  indirizzo = INDIRIZZO,
): Promise<void> {
  const r = await richiesta(s, "DELETE", `/dispositivi/${id}`, undefined, f, indirizzo);
  if (r.stato !== 204 && r.stato !== 200) throw new Error(`scollega: ${r.stato}`);
}

/** Esce: avvisa il server se c'è rete; la sessione si toglie comunque (RB-89). */
export async function esci(s: Sessione, f: Chiamata = fetch, indirizzo = INDIRIZZO) {
  try {
    await richiesta(s, "POST", "/accesso/esci", {}, f, indirizzo);
  } catch {
    // Senza rete il dispositivo resta nell'elenco e si scollega da lì.
  }
}

/** La sessione come testo per il portachiavi, e ritorno. */
export const sessioneInTesto = (s: Sessione) =>
  JSON.stringify({
    email: s.email,
    gettone: s.gettone,
    dispositivo: s.dispositivo,
    chiave: b64(s.chiave),
  });

export function sessioneDaTesto(t: string | null): Sessione | null {
  if (!t) return null;
  try {
    const v = JSON.parse(t);
    const chiave = daB64(v.chiave);
    if (!chiave || chiave.length !== 32 || !v.gettone || !v.dispositivo) return null;
    return { email: v.email, gettone: v.gettone, dispositivo: v.dispositivo, chiave };
  } catch {
    return null;
  }
}
