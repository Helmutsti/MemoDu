// Le chiavi dell'utente (DEC-121). Dalla password, sul dispositivo: Argon2id(password, sale),
// poi HKDF-SHA256 ricava la prova di accesso (va al server) e la chiave della cassaforte (non
// lascia il dispositivo), che avvolge la chiave dati. Dalla chiave di recupero, casuale, HKDF
// ricava allo stesso modo la prova di recupero e la chiave che avvolge l'altra copia della
// chiave dati (RB-90). Il nucleo Rust del client deve fare esattamente gli stessi passi.

import { argon2Sync, createHash, hkdfSync, randomBytes } from "node:crypto";
import { avvolgi, svolgi } from "./xchacha.js";

export interface ParametriArgon2 {
  /** In KiB. */
  memoria: number;
  passaggi: number;
  fili: number;
}

/** 64 MiB, 3 passaggi, 1 filo (DEC-121). */
export const ARGON2: ParametriArgon2 = { memoria: 65536, passaggi: 3, fili: 1 };

/** Gli scopi delle chiavi ricavate e delle chiavi avvolte: due scopi non si scambiano mai. */
export const SCOPI = {
  provaAccesso: "memodu/prova/accesso",
  cassaforte: "memodu/cassaforte/password",
  provaRecupero: "memodu/prova/recupero",
  cassaforteRecupero: "memodu/cassaforte/recupero",
  chiaveDatiPassword: "memodu/chiave-dati/password",
  chiaveDatiRecupero: "memodu/chiave-dati/recupero",
} as const;

const ricava = (segreto: Buffer, scopo: string) =>
  Buffer.from(hkdfSync("sha256", segreto, Buffer.alloc(0), scopo, 32));

/** Prova di accesso e chiave della cassaforte dalla password (in NFC, UTF-8). */
export function daPassword(
  password: string,
  sale: Buffer,
  parametri: ParametriArgon2 = ARGON2,
): { prova: Buffer; cassaforte: Buffer } {
  const base = argon2Sync("argon2id", {
    message: Buffer.from(password.normalize("NFC"), "utf8"),
    nonce: sale,
    memory: parametri.memoria,
    passes: parametri.passaggi,
    parallelism: parametri.fili,
    tagLength: 32,
  });
  return { prova: ricava(base, SCOPI.provaAccesso), cassaforte: ricava(base, SCOPI.cassaforte) };
}

/** Prova di recupero e chiave della cassaforte dalla chiave di recupero. */
export function daRecupero(recupero: Buffer): { prova: Buffer; cassaforte: Buffer } {
  return {
    prova: ricava(recupero, SCOPI.provaRecupero),
    cassaforte: ricava(recupero, SCOPI.cassaforteRecupero),
  };
}

/** Impronta SHA-256 di una prova, in esadecimale: è ciò che il server conserva. */
export const improntaProva = (prova: Buffer) => createHash("sha256").update(prova).digest("hex");

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** La chiave di recupero da stampare: 32 byte in gruppi di 4 caratteri senza 0/O e 1/I. */
export function scriviRecupero(chiave: Buffer): string {
  let bit = "";
  for (const b of chiave) bit += b.toString(2).padStart(8, "0");
  bit = bit.padEnd(Math.ceil(bit.length / 5) * 5, "0");
  let testo = "";
  for (let i = 0; i < bit.length; i += 5) testo += ALFABETO[parseInt(bit.slice(i, i + 5), 2)];
  return testo.match(/.{1,4}/g)!.join("-");
}

/** L'inverso di `scriviRecupero`; accetta minuscole, spazi e trattini in qualunque punto. */
export function leggiRecupero(testo: string): Buffer {
  const pulito = testo.toUpperCase().replace(/[\s-]/g, "");
  let bit = "";
  for (const c of pulito) {
    const i = ALFABETO.indexOf(c);
    if (i < 0) throw new Error("La chiave di recupero contiene un carattere che non le appartiene");
    bit += i.toString(2).padStart(5, "0");
  }
  if (pulito.length !== 52) throw new Error("La chiave di recupero ha 52 caratteri");
  return Buffer.from(
    bit
      .slice(0, 256)
      .match(/.{8}/g)!
      .map((b) => parseInt(b, 2)),
  );
}

/** I dati dell'utente fisso che il server conserva (EN-05), come variabili d'ambiente. */
export interface DatiUtente {
  email: string;
  sale: string;
  argon2: ParametriArgon2;
  improntaAccesso: string;
  improntaRecupero: string;
  chiavePassword: string;
  chiaveRecupero: string;
}

/**
 * Crea i dati dell'utente da email e password. Con `chiaveDati` (recupero, RB-90) riusa quella
 * chiave dati, così le note non si ricifrano; con `recupero` riusa la chiave di recupero.
 */
export function creaUtente(
  email: string,
  password: string,
  esistenti: { chiaveDati?: Buffer; recupero?: Buffer } = {},
  parametri: ParametriArgon2 = ARGON2,
): { dati: DatiUtente; recupero: Buffer } {
  const sale = randomBytes(16);
  const chiaveDati = esistenti.chiaveDati ?? randomBytes(32);
  const recupero = esistenti.recupero ?? randomBytes(32);
  const p = daPassword(password, sale, parametri);
  const r = daRecupero(recupero);
  return {
    recupero,
    dati: {
      email: email.trim().toLowerCase(),
      sale: sale.toString("base64url"),
      argon2: parametri,
      improntaAccesso: improntaProva(p.prova),
      improntaRecupero: improntaProva(r.prova),
      chiavePassword: avvolgi(p.cassaforte, chiaveDati, SCOPI.chiaveDatiPassword),
      chiaveRecupero: avvolgi(r.cassaforte, chiaveDati, SCOPI.chiaveDatiRecupero),
    },
  };
}

/** La chiave dati aperta con la chiave di recupero; lancia un errore se la chiave è sbagliata. */
export function chiaveDatiDaRecupero(dati: DatiUtente, recupero: Buffer): Buffer {
  const r = daRecupero(recupero);
  if (improntaProva(r.prova) !== dati.improntaRecupero) {
    throw new Error("La chiave di recupero non è quella di questo utente");
  }
  return svolgi(r.cassaforte, dati.chiaveRecupero, SCOPI.chiaveDatiRecupero);
}

/** Le password più comuni, in minuscolo: un elenco breve, come chiede RB-88. */
const COMUNI = new Set([
  "123456789012",
  "1234567890123",
  "password1234",
  "passwordpassword",
  "qwertyuiopas",
  "qwerty123456",
  "abcdefghijkl",
  "abc123456789",
  "000000000000",
  "111111111111",
  "iloveyou1234",
  "ciaociaociao",
  "password123!",
  "amore1234567",
  "juventus1234",
  "napoli123456",
  "forzainter12",
  "forzamilan12",
  "admin1234567",
  "benvenuto123",
  "passwordciao",
  "qwertyqwerty",
  "asdfghjklzxc",
  "1q2w3e4r5t6y",
  "letmein12345",
  "welcome12345",
  "memodu123456",
  "memodumemodu",
  "passw0rd1234",
  "aaaaaaaaaaaa",
]);

/** Il motivo per cui la password non va bene, o null (RB-88). */
export function problemaPassword(password: string): string | null {
  const lettere = [...password.normalize("NFC")];
  if (lettere.length < 12) return "La password deve avere almeno 12 caratteri.";
  const minuscola = password.toLowerCase();
  if (COMUNI.has(minuscola) || /^(.)\1+$/.test(minuscola)) {
    return "Questa password è tra le più usate: scegline un'altra.";
  }
  return null;
}
