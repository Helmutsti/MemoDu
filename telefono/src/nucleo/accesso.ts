// Accesso con email e password (RF-14, DEC-121, DEC-133), come client/src-tauri/src/accesso.rs:
// sale e parametri dal server, prova di accesso e cassaforte dalla password sul telefono, poi il
// gettone di questo dispositivo e la chiave dati avvolta, che si apre qui. La password non lascia
// il telefono; gettone e chiave dati restano nel portachiavi (expo-secure-store).

import {
  b64,
  chiudiBlocco,
  daB64,
  daPassword,
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
