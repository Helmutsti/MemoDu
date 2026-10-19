// Argon2id nativo su iPhone: il modulo memodu-argon2 (modules/), che chiama crypto_pwhash di
// libsodium, Argon2id versione 1.3 con un filo, come il server e il computer. Gli stessi 32 byte
// della versione in TypeScript usata nelle prove (argon2.ts, controllata con libsodium in
// argon2.test.ts), che in JavaScript su iPhone richiederebbe minuti.

import MemoduArgon2 from "memodu-argon2";
import type { CostoArgon2 } from "./argon2";

export type { CostoArgon2 };

const esa = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");

export async function argon2id(
  password: Uint8Array,
  sale: Uint8Array,
  p: CostoArgon2,
): Promise<Uint8Array> {
  if (p.fili !== 1) throw new Error("libsodium calcola Argon2id con un filo solo");
  const uscita = await MemoduArgon2.argon2id(esa(password), esa(sale), p.passaggi, p.memoria);
  return Uint8Array.from(uscita.match(/../g)!.map((h) => parseInt(h, 16)));
}
