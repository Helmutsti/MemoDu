// Accesso con gli account (RF-14, RF-16, DEC-132, DEC-133, architettura/api.md). I dati di ogni
// account stanno nella tabella `utenti`; ogni dispositivo ha un gettone opaco senza scadenza,
// di cui il server tiene solo l'impronta e che cerca a ogni richiesta. Password, prove, chiavi e
// gettoni non vanno mai nel registro.

import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { ARGON2, type DatiUtente, type ParametriArgon2 } from "./chiavi.js";
import type { Database, Sql } from "./database.js";

/** Le variabili dell'utente fisso di DEC-121: servono solo alla migrazione verso gli account. */
const NOMI_FISSO = {
  email: "MEMODU_EMAIL",
  sale: "MEMODU_SALE",
  argon2: "MEMODU_ARGON2",
  improntaAccesso: "MEMODU_IMPRONTA_ACCESSO",
  improntaRecupero: "MEMODU_IMPRONTA_RECUPERO",
  chiavePassword: "MEMODU_CHIAVE_PASSWORD",
  chiaveRecupero: "MEMODU_CHIAVE_RECUPERO",
} as const;

/** Il segreto del server: serve al sale finto delle email sconosciute. */
export const NOME_SEGRETO = "MEMODU_SEGRETO";

/** Il segreto da `MEMODU_SEGRETO`, di almeno 32 byte; null se manca. */
export function segretoDaAmbiente(env: NodeJS.ProcessEnv): string | null {
  const segreto = env[NOME_SEGRETO]?.trim();
  if (!segreto) return null;
  if (Buffer.from(segreto, "base64url").length < 32) {
    throw new Error(`Accesso: ${NOME_SEGRETO} deve avere almeno 32 byte`);
  }
  return segreto;
}

/**
 * L'utente fisso di DEC-121 dalle variabili d'ambiente, per farne il primo account. Nessuna
 * variabile: null. Alcune sì e altre no, o valori malformati: un errore che dice quale.
 */
export function utenteFissoDaAmbiente(env: NodeJS.ProcessEnv): DatiUtente | null {
  const valori = Object.fromEntries(
    Object.entries(NOMI_FISSO).map(([k, n]) => [k, env[n]?.trim()]),
  );
  const mancanti = Object.entries(NOMI_FISSO)
    .filter(([k]) => !valori[k])
    .map(([, n]) => n);
  if (mancanti.length === Object.keys(NOMI_FISSO).length) return null;
  if (mancanti.length > 0) throw new Error(`Utente fisso: mancano ${mancanti.join(", ")}`);
  const argon2 = leggiArgon2(valori.argon2!);
  if (!argon2)
    throw new Error(`Utente fisso: ${NOMI_FISSO.argon2} va scritto come memoria,passaggi,fili`);
  for (const k of ["improntaAccesso", "improntaRecupero"] as const) {
    if (!/^[0-9a-f]{64}$/.test(valori[k]!))
      throw new Error(`Utente fisso: ${NOMI_FISSO[k]} non è un'impronta`);
  }
  return {
    email: valori.email!.toLowerCase(),
    sale: valori.sale!,
    argon2,
    improntaAccesso: valori.improntaAccesso!,
    improntaRecupero: valori.improntaRecupero!,
    chiavePassword: valori.chiavePassword!,
    chiaveRecupero: valori.chiaveRecupero!,
  };
}

const leggiArgon2 = (testo: string): ParametriArgon2 | null => {
  const [memoria, passaggi, fili] = testo.split(",").map(Number);
  if (![memoria, passaggi, fili].every((n) => Number.isInteger(n) && n! > 0)) return null;
  return { memoria: memoria!, passaggi: passaggi!, fili: fili! };
};
const scriviArgon2 = (a: ParametriArgon2) => `${a.memoria},${a.passaggi},${a.fili}`;

/** Impronta SHA-256 in esadecimale di un valore in base64url (prova o gettone). */
const impronta = (valore: string) =>
  createHash("sha256").update(Buffer.from(valore, "base64url")).digest("hex");
const ugualiHex = (a: string, b: string) => {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
};
const normalizza = (email: string) => email.trim().toLowerCase();

export type Tipo = "windows" | "macos";

/** Chi fa la richiesta: l'account e il dispositivo del gettone. */
export interface Autorizzazione {
  utente: string;
  dispositivo: string;
}

/** I dati nuovi calcolati dal dispositivo quando cambia la password. */
export interface PasswordNuova {
  sale: string;
  argon2: ParametriArgon2;
  prova: string;
  chiave: string;
}

/** La chiave di recupero nuova, nata sul dispositivo (RB-99). */
export interface RecuperoNuovo {
  prova: string;
  chiave: string;
}

export interface Dispositivo {
  id: string;
  nome: string | null;
  tipo: Tipo;
  ultima_sincronizzazione: string | null;
  questo: boolean;
}

interface RigaUtente {
  id: string;
  email: string;
  sale: string;
  argon2: string;
  impronta_accesso: string;
  impronta_recupero: string;
  chiave_password: string;
  chiave_recupero: string;
}

export class Accesso {
  private readonly chiaveSegreto: Buffer;

  constructor(
    private readonly db: Database,
    segreto: string,
    private readonly adesso: () => Date = () => new Date(),
  ) {
    this.chiaveSegreto = Buffer.from(segreto, "base64url");
  }

  /** Crea un account (comando del server, DEC-132); false se l'email c'è già. */
  async creaAccount(dati: DatiUtente): Promise<boolean> {
    const righe = await this.db.righe<{ id: string }>(
      `INSERT INTO utenti (id, email, sale, argon2, impronta_accesso, impronta_recupero,
         chiave_password, chiave_recupero, creato_il)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) DO NOTHING RETURNING id`,
      [
        randomUUID(),
        normalizza(dati.email),
        dati.sale,
        scriviArgon2(dati.argon2),
        dati.improntaAccesso,
        dati.improntaRecupero,
        dati.chiavePassword,
        dati.chiaveRecupero,
        this.adesso().toISOString(),
      ],
    );
    return righe.length === 1;
  }

  /** Email e data di creazione degli account, per il comando del server. */
  elencoAccount(): Promise<{ email: string; creato_il: string }[]> {
    return this.db.righe(
      "SELECT email, creato_il::text AS creato_il FROM utenti ORDER BY creato_il",
    );
  }

  /**
   * Sale e parametri di Argon2id per questa email. Per un'email sconosciuta un sale finto ma
   * sempre uguale, calcolato dal segreto: la risposta non dice quale email esiste.
   */
  async parametri(email: string): Promise<{ sale: string; argon2: ParametriArgon2 }> {
    const utente = await this.utente(email);
    if (utente) return { sale: utente.sale, argon2: leggiArgon2(utente.argon2)! };
    const finto = createHmac("sha256", this.chiaveSegreto)
      .update(`sale:${normalizza(email)}`)
      .digest()
      .subarray(0, 16);
    return {
      sale: finto.toString("base64url"),
      argon2: ARGON2,
    };
  }

  /** Accesso con email e prova: un dispositivo nuovo, o null (RB-97). */
  async accedi(
    email: string,
    prova: string,
    tipo: Tipo,
  ): Promise<{ gettone: string; dispositivo: string; chiave: string } | null> {
    const utente = await this.utente(email);
    if (!utente || !ugualiHex(impronta(prova), utente.impronta_accesso)) return null;
    const nuovo = await this.nuovoDispositivo(this.db, utente.id, tipo);
    return { ...nuovo, chiave: utente.chiave_password };
  }

  /** Il gettone è di un dispositivo ancora collegato? (DEC-133) */
  async autorizza(gettone: string | undefined): Promise<Autorizzazione | null> {
    if (!gettone || !/^[A-Za-z0-9_-]{43}$/.test(gettone)) return null;
    const [riga] = await this.db.righe<{ id: string; utente: string }>(
      "SELECT id, utente FROM dispositivi WHERE impronta_gettone = $1",
      [impronta(gettone)],
    );
    return riga ? { utente: riga.utente, dispositivo: riga.id } : null;
  }

  /** La chiave dati avvolta con la chiave di recupero, per chi ha la prova di recupero (FL-14). */
  async chiaveRecupero(
    email: string,
    provaRecupero: string,
  ): Promise<{ chiave_recupero: string; sale: string; argon2: ParametriArgon2 } | null> {
    const utente = await this.utente(email);
    if (!utente || !ugualiHex(impronta(provaRecupero), utente.impronta_recupero)) return null;
    return {
      chiave_recupero: utente.chiave_recupero,
      sale: utente.sale,
      argon2: leggiArgon2(utente.argon2)!,
    };
  }

  /**
   * Recupero dell'account (RB-99): password e chiave di recupero nuove, gli altri dispositivi
   * scollegati se richiesto, e questo dispositivo collegato. Ripetuto dopo una risposta persa
   * trova i dati già scritti e riesce lo stesso (SF-08).
   */
  async recupera(richiesta: {
    email: string;
    prova_recupero: string;
    nuova: PasswordNuova;
    recupero_nuovo: RecuperoNuovo;
    scollega_altri: boolean;
    tipo: Tipo;
  }): Promise<{ gettone: string; dispositivo: string } | null> {
    return this.db.transazione(async (sql) => {
      const utente = await this.utente(richiesta.email, sql, true);
      if (!utente) return null;
      const giusta = ugualiHex(impronta(richiesta.prova_recupero), utente.impronta_recupero);
      const giaFatto =
        ugualiHex(impronta(richiesta.nuova.prova), utente.impronta_accesso) &&
        ugualiHex(impronta(richiesta.recupero_nuovo.prova), utente.impronta_recupero);
      if (!giusta && !giaFatto) return null;
      if (giusta) {
        await this.scriviPassword(sql, utente.id, richiesta.nuova, richiesta.recupero_nuovo);
        if (richiesta.scollega_altri) {
          await sql.righe("DELETE FROM dispositivi WHERE utente = $1", [utente.id]);
        }
      }
      return this.nuovoDispositivo(sql, utente.id, richiesta.tipo);
    });
  }

  /**
   * Cambio della password da un dispositivo collegato (RB-98), verificato con la password
   * attuale o con la chiave di recupero; questo dispositivo resta collegato. false se la
   * verifica non riesce; ripetuto dopo una risposta persa riesce lo stesso (SF-08).
   */
  async cambiaPassword(
    chi: Autorizzazione,
    richiesta: {
      verifica: { tipo: "password" | "recupero"; prova: string };
      nuova: PasswordNuova;
      recupero_nuovo?: RecuperoNuovo;
      scollega_altri: boolean;
    },
  ): Promise<boolean> {
    return this.db.transazione(async (sql) => {
      const [utente] = await sql.righe<RigaUtente>(
        "SELECT * FROM utenti WHERE id = $1 FOR UPDATE",
        [chi.utente],
      );
      if (!utente) return false;
      const conRecupero = richiesta.verifica.tipo === "recupero";
      const attesa = conRecupero ? utente.impronta_recupero : utente.impronta_accesso;
      const giusta = ugualiHex(impronta(richiesta.verifica.prova), attesa);
      const giaFatto =
        ugualiHex(impronta(richiesta.nuova.prova), utente.impronta_accesso) &&
        (!conRecupero ||
          ugualiHex(impronta(richiesta.recupero_nuovo!.prova), utente.impronta_recupero));
      if (!giusta) return giaFatto;
      await this.scriviPassword(
        sql,
        utente.id,
        richiesta.nuova,
        conRecupero ? richiesta.recupero_nuovo : undefined,
      );
      if (richiesta.scollega_altri) {
        await sql.righe("DELETE FROM dispositivi WHERE utente = $1 AND id <> $2", [
          utente.id,
          chi.dispositivo,
        ]);
      }
      return true;
    });
  }

  /** I dispositivi dell'account, questo per primo, poi dall'ultima sincronizzazione (RB-100). */
  async dispositivi(chi: Autorizzazione): Promise<Dispositivo[]> {
    const righe = await this.db.righe<Omit<Dispositivo, "questo">>(
      `SELECT id, nome, tipo, ultima_sincronizzazione FROM dispositivi WHERE utente = $1
       ORDER BY (id = $2) DESC, ultima_sincronizzazione DESC NULLS LAST, collegato_il DESC`,
      [chi.utente, chi.dispositivo],
    );
    return righe.map((r) => ({ ...r, questo: r.id === chi.dispositivo }));
  }

  /** Il nome cifrato di questo dispositivo (RB-51). */
  async nomina(chi: Autorizzazione, nome: string): Promise<void> {
    await this.db.righe("UPDATE dispositivi SET nome = $1 WHERE id = $2", [nome, chi.dispositivo]);
  }

  /**
   * Scollega un altro dispositivo dello stesso account (RB-100). «questo» se è chi chiede,
   * «altro» se l'id è di un altro account; ok anche se la riga non c'era più (SF-20).
   */
  async scollega(chi: Autorizzazione, id: string): Promise<"ok" | "questo" | "altro"> {
    if (id === chi.dispositivo) return "questo";
    const [riga] = await this.db.righe<{ utente: string }>(
      "SELECT utente FROM dispositivi WHERE id = $1",
      [id],
    );
    if (riga && riga.utente !== chi.utente) return "altro";
    await this.db.righe("DELETE FROM dispositivi WHERE id = $1 AND utente = $2", [id, chi.utente]);
    return "ok";
  }

  /** Esci: la riga di questo dispositivo sparisce (RB-89). */
  async esci(chi: Autorizzazione): Promise<void> {
    await this.db.righe("DELETE FROM dispositivi WHERE id = $1", [chi.dispositivo]);
  }

  /** L'ultima sincronizzazione del dispositivo, per l'elenco (RB-100). */
  async sincronizzato(chi: Autorizzazione): Promise<void> {
    await this.db.righe("UPDATE dispositivi SET ultima_sincronizzazione = $1 WHERE id = $2", [
      this.adesso().toISOString(),
      chi.dispositivo,
    ]);
  }

  private async utente(email: string, sql: Sql = this.db, blocca = false) {
    const [riga] = await sql.righe<RigaUtente>(
      `SELECT * FROM utenti WHERE email = $1${blocca ? " FOR UPDATE" : ""}`,
      [normalizza(email)],
    );
    return riga;
  }

  private async scriviPassword(
    sql: Sql,
    utente: string,
    nuova: PasswordNuova,
    recupero?: RecuperoNuovo,
  ): Promise<void> {
    await sql.righe(
      `UPDATE utenti SET sale = $2, argon2 = $3, impronta_accesso = $4, chiave_password = $5
       WHERE id = $1`,
      [utente, nuova.sale, scriviArgon2(nuova.argon2), impronta(nuova.prova), nuova.chiave],
    );
    if (recupero) {
      await sql.righe(
        "UPDATE utenti SET impronta_recupero = $2, chiave_recupero = $3 WHERE id = $1",
        [utente, impronta(recupero.prova), recupero.chiave],
      );
    }
  }

  private async nuovoDispositivo(
    sql: Sql,
    utente: string,
    tipo: Tipo,
  ): Promise<{ gettone: string; dispositivo: string }> {
    const gettone = randomBytes(32).toString("base64url");
    const dispositivo = randomUUID();
    await sql.righe(
      `INSERT INTO dispositivi (id, utente, impronta_gettone, tipo, collegato_il)
       VALUES ($1, $2, $3, $4, $5)`,
      [dispositivo, utente, impronta(gettone), tipo, this.adesso().toISOString()],
    );
    return { gettone, dispositivo };
  }
}
