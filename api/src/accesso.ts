// Accesso dell'utente fisso (RF-14, DEC-121, architettura temporanea). I dati dell'utente sono
// variabili d'ambiente (su Vercel, o in api/.env in locale); il server confronta l'impronta
// della prova di accesso e restituisce un JWT HS256 di 30 giorni, che autorizza la
// sincronizzazione. Password, prova e chiavi non vanno mai nel registro.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { DatiUtente, ParametriArgon2 } from "./chiavi.js";

/** Durata del gettone nell'architettura temporanea (DEC-121). */
export const DURATA_GETTONE_MS = 30 * 24 * 60 * 60 * 1000;

const NOMI = {
  email: "MEMODU_EMAIL",
  sale: "MEMODU_SALE",
  argon2: "MEMODU_ARGON2",
  improntaAccesso: "MEMODU_IMPRONTA_ACCESSO",
  improntaRecupero: "MEMODU_IMPRONTA_RECUPERO",
  chiavePassword: "MEMODU_CHIAVE_PASSWORD",
  chiaveRecupero: "MEMODU_CHIAVE_RECUPERO",
  segreto: "MEMODU_SEGRETO",
} as const;

/** Le righe NOME=valore da mettere su Vercel o in api/.env. */
export function righeVariabili(dati: DatiUtente, segreto: string): string {
  const a = dati.argon2;
  return [
    `${NOMI.email}=${dati.email}`,
    `${NOMI.sale}=${dati.sale}`,
    `${NOMI.argon2}=${a.memoria},${a.passaggi},${a.fili}`,
    `${NOMI.improntaAccesso}=${dati.improntaAccesso}`,
    `${NOMI.improntaRecupero}=${dati.improntaRecupero}`,
    `${NOMI.chiavePassword}=${dati.chiavePassword}`,
    `${NOMI.chiaveRecupero}=${dati.chiaveRecupero}`,
    `${NOMI.segreto}=${segreto}`,
  ].join("\n");
}

/**
 * L'utente fisso e il segreto dei gettoni dalle variabili d'ambiente. Nessuna variabile: null
 * (l'accesso è spento). Alcune sì e altre no, o valori malformati: un errore che dice quale.
 */
export function utenteDaAmbiente(
  env: NodeJS.ProcessEnv,
): { dati: DatiUtente; segreto: string } | null {
  const valori = Object.fromEntries(Object.entries(NOMI).map(([k, n]) => [k, env[n]?.trim()]));
  const mancanti = Object.entries(NOMI)
    .filter(([k]) => !valori[k])
    .map(([, n]) => n);
  if (mancanti.length === Object.keys(NOMI).length) return null;
  if (mancanti.length > 0) throw new Error(`Accesso: mancano ${mancanti.join(", ")}`);
  const [memoria, passaggi, fili] = valori.argon2!.split(",").map(Number);
  const argon2: ParametriArgon2 = { memoria: memoria!, passaggi: passaggi!, fili: fili! };
  if (![memoria, passaggi, fili].every((n) => Number.isInteger(n) && n! > 0)) {
    throw new Error(`Accesso: ${NOMI.argon2} va scritto come memoria,passaggi,fili`);
  }
  for (const k of ["improntaAccesso", "improntaRecupero"] as const) {
    if (!/^[0-9a-f]{64}$/.test(valori[k]!))
      throw new Error(`Accesso: ${NOMI[k]} non è un'impronta`);
  }
  if (Buffer.from(valori.segreto!, "base64url").length < 32) {
    throw new Error(`Accesso: ${NOMI.segreto} deve avere almeno 32 byte`);
  }
  return {
    segreto: valori.segreto!,
    dati: {
      email: valori.email!.toLowerCase(),
      sale: valori.sale!,
      argon2,
      improntaAccesso: valori.improntaAccesso!,
      improntaRecupero: valori.improntaRecupero!,
      chiavePassword: valori.chiavePassword!,
      chiaveRecupero: valori.chiaveRecupero!,
    },
  };
}

const b64 = (x: string | Buffer) => Buffer.from(x).toString("base64url");
const uguali = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);

export interface Gettone {
  gettone: string;
  scade_il: string;
}

export class Accesso {
  private readonly chiaveFirma: Buffer;

  constructor(
    private readonly dati: DatiUtente,
    segreto: string,
    private readonly adesso: () => Date = () => new Date(),
  ) {
    this.chiaveFirma = Buffer.from(segreto, "base64url");
  }

  /**
   * Sale e parametri di Argon2id per questa email. Per un'email sconosciuta un sale finto ma
   * sempre uguale, calcolato dal segreto: la risposta non dice quale email esiste.
   */
  parametri(email: string): { sale: string; argon2: ParametriArgon2 } {
    const e = email.trim().toLowerCase();
    if (e === this.dati.email) return { sale: this.dati.sale, argon2: this.dati.argon2 };
    const finto = createHmac("sha256", this.chiaveFirma)
      .update(`sale:${e}`)
      .digest()
      .subarray(0, 16);
    return { sale: finto.toString("base64url"), argon2: this.dati.argon2 };
  }

  /** Il gettone e la chiave dati avvolta, o null con email o prova sbagliate. */
  accedi(email: string, prova: string): (Gettone & { chiave: string }) | null {
    const giusta = email.trim().toLowerCase() === this.dati.email;
    const impronta = createHash("sha256").update(Buffer.from(prova, "base64url")).digest();
    const provaGiusta = uguali(impronta, Buffer.from(this.dati.improntaAccesso, "hex"));
    if (!giusta || !provaGiusta) return null;
    return { ...this.nuovoGettone(), chiave: this.dati.chiavePassword };
  }

  /** Un gettone nuovo al posto di uno ancora valido, o null. */
  rinnova(gettone: string | undefined): Gettone | null {
    return this.autorizzato(gettone) ? this.nuovoGettone() : null;
  }

  /** Il gettone è firmato dal server, è dell'utente e non è scaduto? */
  autorizzato(gettone: string | undefined): boolean {
    const parti = gettone?.split(".");
    if (!parti || parti.length !== 3) return false;
    const [testa, corpo, firma] = parti as [string, string, string];
    if (!uguali(Buffer.from(firma, "base64url"), this.firma(`${testa}.${corpo}`))) return false;
    try {
      const t = JSON.parse(Buffer.from(testa, "base64url").toString()) as { alg?: string };
      const c = JSON.parse(Buffer.from(corpo, "base64url").toString()) as {
        sub?: string;
        exp?: number;
      };
      return (
        t.alg === "HS256" &&
        c.sub === this.dati.email &&
        typeof c.exp === "number" &&
        c.exp * 1000 > this.adesso().getTime()
      );
    } catch {
      return false;
    }
  }

  private firma(testo: string): Buffer {
    return createHmac("sha256", this.chiaveFirma).update(testo).digest();
  }

  private nuovoGettone(): Gettone {
    const ora = this.adesso().getTime();
    const scade = ora + DURATA_GETTONE_MS;
    const testa = b64(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const corpo = b64(
      JSON.stringify({
        sub: this.dati.email,
        iat: Math.floor(ora / 1000),
        exp: Math.floor(scade / 1000),
      }),
    );
    const gettone = `${testa}.${corpo}.${this.firma(`${testa}.${corpo}`).toString("base64url")}`;
    return { gettone, scade_il: new Date(Math.floor(scade / 1000) * 1000).toISOString() };
  }
}
