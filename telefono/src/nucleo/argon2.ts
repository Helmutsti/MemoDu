// Argon2id (DEC-121): nelle prove, sul computer, la versione in TypeScript di @noble. Nell'app
// c'è quella nativa (argon2.native.ts): in JavaScript su iPhone 64 MiB richiedono minuti.

import { argon2idAsync } from "@noble/hashes/argon2.js";

export interface CostoArgon2 {
  memoria: number;
  passaggi: number;
  fili: number;
}

export function argon2id(
  password: Uint8Array,
  sale: Uint8Array,
  p: CostoArgon2,
): Promise<Uint8Array> {
  return argon2idAsync(password, sale, {
    m: p.memoria,
    t: p.passaggi,
    p: p.fili,
    dkLen: 32,
    asyncTick: 10,
  });
}
