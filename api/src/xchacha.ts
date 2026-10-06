// XChaCha20-Poly1305 (DEC-121): ChaCha20-Poly1305 di Node con una sottochiave ricavata da
// HChaCha20 e un nonce di 24 byte, come nel draft-irtf-cfrg-xchacha. Node non lo offre da solo;
// sul dispositivo lo fa il crate `chacha20poly1305`, e i due devono dare gli stessi byte.

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const COSTANTI = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574];

const ruota = (x: number, n: number) => ((x << n) | (x >>> (32 - n))) >>> 0;

function quarto(s: Uint32Array, a: number, b: number, c: number, d: number): void {
  s[a] = (s[a]! + s[b]!) >>> 0;
  s[d] = ruota(s[d]! ^ s[a]!, 16);
  s[c] = (s[c]! + s[d]!) >>> 0;
  s[b] = ruota(s[b]! ^ s[c]!, 12);
  s[a] = (s[a]! + s[b]!) >>> 0;
  s[d] = ruota(s[d]! ^ s[a]!, 8);
  s[c] = (s[c]! + s[d]!) >>> 0;
  s[b] = ruota(s[b]! ^ s[c]!, 7);
}

/** HChaCha20: dalla chiave e dai primi 16 byte del nonce, una sottochiave di 32 byte. */
export function hchacha20(chiave: Buffer, nonce16: Buffer): Buffer {
  if (chiave.length !== 32 || nonce16.length !== 16) throw new Error("HChaCha20: misure sbagliate");
  const s = new Uint32Array(16);
  s.set(COSTANTI, 0);
  for (let i = 0; i < 8; i++) s[4 + i] = chiave.readUInt32LE(i * 4);
  for (let i = 0; i < 4; i++) s[12 + i] = nonce16.readUInt32LE(i * 4);
  for (let giro = 0; giro < 10; giro++) {
    quarto(s, 0, 4, 8, 12);
    quarto(s, 1, 5, 9, 13);
    quarto(s, 2, 6, 10, 14);
    quarto(s, 3, 7, 11, 15);
    quarto(s, 0, 5, 10, 15);
    quarto(s, 1, 6, 11, 12);
    quarto(s, 2, 7, 8, 13);
    quarto(s, 3, 4, 9, 14);
  }
  const uscita = Buffer.alloc(32);
  for (let i = 0; i < 4; i++) uscita.writeUInt32LE(s[i]!, i * 4);
  for (let i = 0; i < 4; i++) uscita.writeUInt32LE(s[12 + i]!, 16 + i * 4);
  return uscita;
}

/** Sottochiave e nonce di 12 byte per ChaCha20-Poly1305: 4 byte a zero e gli ultimi 8. */
function interni(chiave: Buffer, nonce: Buffer): [Buffer, Buffer] {
  if (nonce.length !== 24) throw new Error("XChaCha20-Poly1305: il nonce è di 24 byte");
  return [
    hchacha20(chiave, nonce.subarray(0, 16)),
    Buffer.concat([Buffer.alloc(4), nonce.subarray(16)]),
  ];
}

/** Testo cifrato seguito dal controllo di 16 byte. */
export function cifra(
  chiave: Buffer,
  nonce: Buffer,
  testo: Buffer,
  aggiunti = Buffer.alloc(0),
): Buffer {
  const [sottochiave, n12] = interni(chiave, nonce);
  const c = createCipheriv("chacha20-poly1305", sottochiave, n12, { authTagLength: 16 });
  c.setAAD(aggiunti, { plaintextLength: testo.length });
  return Buffer.concat([c.update(testo), c.final(), c.getAuthTag()]);
}

/** Il testo in chiaro; lancia un errore se il controllo non torna. */
export function decifra(
  chiave: Buffer,
  nonce: Buffer,
  cifrato: Buffer,
  aggiunti = Buffer.alloc(0),
): Buffer {
  if (cifrato.length < 16) throw new Error("XChaCha20-Poly1305: blocco troppo corto");
  const [sottochiave, n12] = interni(chiave, nonce);
  const d = createDecipheriv("chacha20-poly1305", sottochiave, n12, { authTagLength: 16 });
  d.setAAD(aggiunti, { plaintextLength: cifrato.length - 16 });
  d.setAuthTag(cifrato.subarray(cifrato.length - 16));
  return Buffer.concat([d.update(cifrato.subarray(0, cifrato.length - 16)), d.final()]);
}

/** Avvolge una chiave: nonce casuale (24), chiave cifrata (32) e controllo (16), in base64url. */
export function avvolgi(chiave: Buffer, daAvvolgere: Buffer, scopo: string): string {
  const nonce = randomBytes(24);
  return Buffer.concat([nonce, cifra(chiave, nonce, daAvvolgere, Buffer.from(scopo))]).toString(
    "base64url",
  );
}

/** L'inverso di `avvolgi`. */
export function svolgi(chiave: Buffer, avvolta: string, scopo: string): Buffer {
  const byte = Buffer.from(avvolta, "base64url");
  return decifra(chiave, byte.subarray(0, 24), byte.subarray(24), Buffer.from(scopo));
}
