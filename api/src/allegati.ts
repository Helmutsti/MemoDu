// Allegati di Brainet (RF-18, DEC-135; architettura «Allegati di Brainet»). Il server tiene solo
// l'elenco degli allegati di ogni account e firma indirizzi di breve durata per caricarli e
// scaricarli dal deposito: in rete Cloudflare R2, in locale e nelle prove una cartella del
// server con gli stessi indirizzi. Il file arriva già cifrato dal dispositivo: il server non lo
// apre mai.

import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { AwsClient } from "aws4fetch";
import type { Database } from "./database.js";

/** 25 MB di file più quello che aggiunge la cifratura (nonce e controllo), RB-115. */
export const LIMITE_ALLEGATO_BYTE = 25 * 1024 * 1024 + 64;
/** L'anteprima di una foto (lato lungo 1440 px in JPEG) sta ben sotto. */
export const LIMITE_ANTEPRIMA_BYTE = 4 * 1024 * 1024;
/** Quanto vale un indirizzo firmato. */
const DURATA_S = 15 * 60;

/** Il deposito dei file: R2 in rete, una cartella in locale. */
export interface Deposito {
  /** Indirizzo per caricare `chiave` con PUT, valido DURATA_S secondi. */
  perCaricare(chiave: string): Promise<string>;
  /** Indirizzo per scaricare `chiave` con GET. */
  perScaricare(chiave: string): Promise<string>;
  /** La grandezza di quello che c'è, o null se non c'è. */
  grandezza(chiave: string): Promise<number | null>;
  cancella(chiave: string): Promise<void>;
}

/** Le quattro variabili di R2 su Vercel (DEC-135), o null se non ci sono tutte. */
export function r2DaAmbiente(env: NodeJS.ProcessEnv): Deposito | null {
  const { MEMODU_R2_ACCOUNT, MEMODU_R2_CHIAVE, MEMODU_R2_SEGRETO, MEMODU_R2_BUCKET } = env;
  if (!MEMODU_R2_ACCOUNT || !MEMODU_R2_CHIAVE || !MEMODU_R2_SEGRETO || !MEMODU_R2_BUCKET)
    return null;
  return new DepositoR2(MEMODU_R2_ACCOUNT, MEMODU_R2_CHIAVE, MEMODU_R2_SEGRETO, MEMODU_R2_BUCKET);
}

/** Cloudflare R2 con la sua API compatibile con S3. */
export class DepositoR2 implements Deposito {
  private readonly aws: AwsClient;
  private readonly base: string;

  constructor(account: string, chiave: string, segreto: string, bucket: string) {
    this.aws = new AwsClient({
      accessKeyId: chiave,
      secretAccessKey: segreto,
      service: "s3",
      region: "auto",
    });
    this.base = `https://${account}.r2.cloudflarestorage.com/${bucket}/`;
  }

  private async firma(chiave: string, method: "PUT" | "GET"): Promise<string> {
    const url = new URL(this.base + chiave);
    url.searchParams.set("X-Amz-Expires", String(DURATA_S));
    const firmata = await this.aws.sign(new Request(url, { method }), { aws: { signQuery: true } });
    return firmata.url;
  }

  perCaricare(chiave: string) {
    return this.firma(chiave, "PUT");
  }

  perScaricare(chiave: string) {
    return this.firma(chiave, "GET");
  }

  async grandezza(chiave: string): Promise<number | null> {
    const r = await this.aws.fetch(this.base + chiave, { method: "HEAD" });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`R2 risponde ${r.status}`);
    return Number(r.headers.get("content-length") ?? 0);
  }

  async cancella(chiave: string): Promise<void> {
    const r = await this.aws.fetch(this.base + chiave, { method: "DELETE" });
    if (!r.ok && r.status !== 404) throw new Error(`R2 risponde ${r.status}`);
  }
}

/**
 * Il deposito in locale e nelle prove: una cartella, con indirizzi del server stesso firmati con
 * il suo segreto (`/deposito/...`), così il dispositivo fa le stesse richieste che farebbe a R2.
 */
export class DepositoLocale implements Deposito {
  constructor(
    private readonly cartella: string,
    private readonly indirizzo: string,
    private readonly segreto: string,
    private readonly adesso: () => Date = () => new Date(),
  ) {}

  firmaDi(chiave: string, metodo: string, scade: number): string {
    return createHmac("sha256", this.segreto)
      .update(`${metodo} ${chiave} ${scade}`)
      .digest("base64url");
  }

  /** La firma di un indirizzo locale è buona e non è scaduta? */
  valida(chiave: string, metodo: string, scade: number, firma: string): boolean {
    if (!Number.isFinite(scade) || scade < this.adesso().getTime() / 1000) return false;
    const attesa = Buffer.from(this.firmaDi(chiave, metodo, scade));
    const data = Buffer.from(firma);
    return attesa.length === data.length && timingSafeEqual(attesa, data);
  }

  private indirizzoPer(chiave: string, metodo: string): string {
    const scade = Math.floor(this.adesso().getTime() / 1000) + DURATA_S;
    const firma = this.firmaDi(chiave, metodo, scade);
    return `${this.indirizzo}/deposito/${chiave}?scade=${scade}&firma=${firma}`;
  }

  async perCaricare(chiave: string) {
    return this.indirizzoPer(chiave, "PUT");
  }

  async perScaricare(chiave: string) {
    return this.indirizzoPer(chiave, "GET");
  }

  file(chiave: string): string {
    return join(this.cartella, ...chiave.split("/"));
  }

  async scrivi(chiave: string, byte: Buffer): Promise<void> {
    await mkdir(dirname(this.file(chiave)), { recursive: true });
    await writeFile(this.file(chiave), byte);
  }

  async leggi(chiave: string): Promise<Buffer | null> {
    return readFile(this.file(chiave)).catch(() => null);
  }

  async grandezza(chiave: string): Promise<number | null> {
    return stat(this.file(chiave)).then(
      (s) => s.size,
      () => null,
    );
  }

  async cancella(chiave: string): Promise<void> {
    await rm(this.file(chiave), { force: true });
  }
}

/** Le chiavi nel deposito: per account, così un account non raggiunge mai i file di un altro. */
export const chiaveFile = (utente: string, id: string) => `${utente}/${id}`;
export const chiaveAnteprima = (utente: string, id: string) => `${utente}/${id}-anteprima`;

export class ErroreAllegato extends Error {
  constructor(
    readonly codice: 400 | 404 | 409 | 413,
    messaggio: string,
  ) {
    super(messaggio);
  }
}

/** L'elenco degli allegati per account (migrazione 3 dello schema). */
export class ArchivioAllegati {
  constructor(
    private readonly db: Database,
    private readonly deposito: Deposito,
  ) {}

  /** Comincia (o ricomincia) un caricamento: la riga e i due indirizzi firmati. */
  async caricamento(
    utente: string,
    id: string,
    grandezza: number,
    anteprima: number,
  ): Promise<{ file: string; anteprima: string | null }> {
    if (grandezza <= 0 || grandezza > LIMITE_ALLEGATO_BYTE) {
      throw new ErroreAllegato(413, "Il file supera 25 MB");
    }
    if (anteprima < 0 || anteprima > LIMITE_ANTEPRIMA_BYTE) {
      throw new ErroreAllegato(413, "L'anteprima è troppo grande");
    }
    await this.db.righe(
      `INSERT INTO allegati (utente, id, grandezza, anteprima, presente, creato_il)
       VALUES ($1, $2, $3, $4, false, now())
       ON CONFLICT (utente, id) DO UPDATE SET grandezza = $3, anteprima = $4, presente = false`,
      [utente, id, grandezza, anteprima],
    );
    return {
      file: await this.deposito.perCaricare(chiaveFile(utente, id)),
      anteprima:
        anteprima > 0 ? await this.deposito.perCaricare(chiaveAnteprima(utente, id)) : null,
    };
  }

  /** Il dispositivo ha finito: si controlla nel deposito che ci sia tutto e della grandezza giusta. */
  async fatto(utente: string, id: string): Promise<void> {
    const [riga] = await this.db.righe<{ grandezza: string; anteprima: string }>(
      "SELECT grandezza, anteprima FROM allegati WHERE utente = $1 AND id = $2",
      [utente, id],
    );
    if (!riga) throw new ErroreAllegato(404, "Nessun caricamento");
    const file = await this.deposito.grandezza(chiaveFile(utente, id));
    if (file !== Number(riga.grandezza))
      throw new ErroreAllegato(409, "Il file non è arrivato intero");
    if (Number(riga.anteprima) > 0) {
      const anteprima = await this.deposito.grandezza(chiaveAnteprima(utente, id));
      if (anteprima !== Number(riga.anteprima))
        throw new ErroreAllegato(409, "L'anteprima non è arrivata intera");
    }
    await this.db.righe("UPDATE allegati SET presente = true WHERE utente = $1 AND id = $2", [
      utente,
      id,
    ]);
  }

  async scaricamento(
    utente: string,
    id: string,
  ): Promise<{ file: string; anteprima: string | null }> {
    const [riga] = await this.db.righe<{ anteprima: string }>(
      "SELECT anteprima FROM allegati WHERE utente = $1 AND id = $2 AND presente",
      [utente, id],
    );
    if (!riga) throw new ErroreAllegato(404, "Allegato non più disponibile");
    return {
      file: await this.deposito.perScaricare(chiaveFile(utente, id)),
      anteprima:
        Number(riga.anteprima) > 0
          ? await this.deposito.perScaricare(chiaveAnteprima(utente, id))
          : null,
    };
  }

  /** Via dal deposito e dall'elenco; anche se non c'era (SF-20). */
  async cancella(utente: string, id: string): Promise<void> {
    await this.deposito.cancella(chiaveFile(utente, id));
    await this.deposito.cancella(chiaveAnteprima(utente, id));
    await this.db.righe("DELETE FROM allegati WHERE utente = $1 AND id = $2", [utente, id]);
  }
}
