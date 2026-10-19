// Chiavi e cifratura del telefono (DEC-121, DEC-156): gli stessi passi e gli stessi byte del
// nucleo del computer (client/src-tauri/src/cifratura.rs) e del server (api/src/chiavi.ts).
// Dalla password Argon2id e HKDF-SHA256 ricavano la prova di accesso, che va al server, e la
// chiave della cassaforte, che apre la chiave dati avvolta. La chiave dati chiude ogni blocco
// della sincronizzazione con XChaCha20-Poly1305, con l'id dell'elemento come dati aggiunti.

import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { utf8ToBytes } from "@noble/ciphers/utils.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { argon2id } from "./argon2";
import { casuali } from "./casuali";

export const FORMATO_CIFRATO = "xchacha20poly1305";

const SCOPO = {
  prova: "memodu/prova/accesso",
  cassaforte: "memodu/cassaforte/password",
  chiaveDati: "memodu/chiave-dati/password",
  provaRecupero: "memodu/prova/recupero",
  cassaforteRecupero: "memodu/cassaforte/recupero",
  chiaveDatiRecupero: "memodu/chiave-dati/recupero",
};

export interface ParametriArgon2 {
  /** In KiB. */
  memoria: number;
  passaggi: number;
  fili: number;
}

/** 64 MiB, 3 passaggi, 1 filo (DEC-121). */
export const ARGON2: ParametriArgon2 = { memoria: 65536, passaggi: 3, fili: 1 };

const utf8 = { encode: utf8ToBytes };

/** UTF-8 rigoroso, senza dipendere da TextDecoder (non sempre c'è nel motore dell'app): null se non è valido. */
export function daUtf8(b: Uint8Array): string | null {
  let s = "";
  for (let i = 0; i < b.length;) {
    const c = b[i];
    let n: number;
    let cp: number;
    if (c < 0x80) [n, cp] = [0, c];
    else if (c >= 0xc2 && c < 0xe0) [n, cp] = [1, c & 0x1f];
    else if (c >= 0xe0 && c < 0xf0) [n, cp] = [2, c & 0x0f];
    else if (c >= 0xf0 && c < 0xf5) [n, cp] = [3, c & 0x07];
    else return null;
    if (i + n >= b.length + (n ? 0 : 1)) return null;
    for (let j = 1; j <= n; j++) {
      const x = b[i + j];
      if ((x & 0xc0) !== 0x80) return null;
      cp = (cp << 6) | (x & 0x3f);
    }
    if (
      (n === 2 && (cp < 0x800 || (cp >= 0xd800 && cp < 0xe000))) ||
      (n === 3 && (cp < 0x10000 || cp > 0x10ffff))
    )
      return null;
    s += String.fromCodePoint(cp);
    i += n + 1;
  }
  return s;
}

// base64url senza «=», come URL_SAFE_NO_PAD del computer.
const ALFABETO_B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function b64(byte: Uint8Array): string {
  let fuori = "";
  for (let i = 0; i < byte.length; i += 3) {
    const n = (byte[i] << 16) | ((byte[i + 1] ?? 0) << 8) | (byte[i + 2] ?? 0);
    const quanti = Math.min(3, byte.length - i) + 1;
    for (let j = 0; j < quanti; j++) fuori += ALFABETO_B64[(n >> (18 - 6 * j)) & 63];
  }
  return fuori;
}

export function daB64(testo: string): Uint8Array | null {
  const pulito = testo.replace(/=+$/, "");
  if (/[^A-Za-z0-9_-]/.test(pulito) || pulito.length % 4 === 1) return null;
  const fuori = new Uint8Array(Math.floor((pulito.length * 3) / 4));
  let bit = 0;
  let valore = 0;
  let k = 0;
  for (const c of pulito) {
    valore = (valore << 6) | ALFABETO_B64.indexOf(c);
    bit += 6;
    if (bit >= 8) {
      bit -= 8;
      fuori[k++] = (valore >> bit) & 255;
    }
  }
  return fuori;
}

const ricava = (segreto: Uint8Array, scopo: string) =>
  hkdf(sha256, segreto, undefined, utf8.encode(scopo), 32);

/** Prova di accesso e chiave della cassaforte dalla password (in NFC, UTF-8). Argon2id non blocca l'interfaccia. */
export async function daPassword(
  password: string,
  sale: Uint8Array,
  p: ParametriArgon2 = ARGON2,
): Promise<{ prova: Uint8Array; cassaforte: Uint8Array }> {
  const base = await argon2id(utf8.encode(password.normalize("NFC")), sale, p);
  const prova = ricava(base, SCOPO.prova);
  const cassaforte = ricava(base, SCOPO.cassaforte);
  base.fill(0);
  return { prova, cassaforte };
}

export function daRecupero(recupero: Uint8Array): { prova: Uint8Array; cassaforte: Uint8Array } {
  return {
    prova: ricava(recupero, SCOPO.provaRecupero),
    cassaforte: ricava(recupero, SCOPO.cassaforteRecupero),
  };
}

function cifra(
  chiave: Uint8Array,
  nonce: Uint8Array,
  testo: Uint8Array,
  aggiunti: Uint8Array,
): Uint8Array {
  return xchacha20poly1305(chiave, nonce, aggiunti).encrypt(testo);
}

function decifra(
  chiave: Uint8Array,
  nonce: Uint8Array,
  cifrato: Uint8Array,
  aggiunti: Uint8Array,
): Uint8Array | null {
  if (nonce.length !== 24) return null;
  try {
    return xchacha20poly1305(chiave, nonce, aggiunti).decrypt(cifrato);
  } catch {
    return null;
  }
}

function svolgi(cassaforte: Uint8Array, avvolta: string, scopo: string): Uint8Array | null {
  const byte = daB64(avvolta);
  if (!byte || byte.length !== 24 + 32 + 16) return null;
  const chiave = decifra(cassaforte, byte.subarray(0, 24), byte.subarray(24), utf8.encode(scopo));
  return chiave && chiave.length === 32 ? chiave : null;
}

/** La chiave dati avvolta dal server con la cassaforte della password. */
export const svolgiChiaveDati = (cassaforte: Uint8Array, avvolta: string) =>
  svolgi(cassaforte, avvolta, SCOPO.chiaveDati);
export const svolgiChiaveDatiRecupero = (cassaforte: Uint8Array, avvolta: string) =>
  svolgi(cassaforte, avvolta, SCOPO.chiaveDatiRecupero);

export function avvolgiChiaveDati(
  cassaforte: Uint8Array,
  chiave: Uint8Array,
  conRecupero: boolean,
): string {
  const nonce = casuali(24);
  const scopo = conRecupero ? SCOPO.chiaveDatiRecupero : SCOPO.chiaveDati;
  const cifrato = cifra(cassaforte, nonce, chiave, utf8.encode(scopo));
  const byte = new Uint8Array(24 + cifrato.length);
  byte.set(nonce);
  byte.set(cifrato, 24);
  return b64(byte);
}

/** Chiude il blocco di un elemento: solo quell'elemento lo riapre. */
export function chiudiBlocco(chiave: Uint8Array, id: string, blocco: string): string {
  const nonce = casuali(24);
  const cifrato = cifra(chiave, nonce, utf8.encode(blocco), utf8.encode(id));
  return JSON.stringify({ formato: FORMATO_CIFRATO, nonce: b64(nonce), dati: b64(cifrato) });
}

/** Apre un blocco ricevuto; null se non è di questo elemento, è alterato o la chiave è un'altra. */
export function apriBlocco(chiave: Uint8Array, id: string, ricevuto: string): string | null {
  let busta: { formato?: unknown; nonce?: unknown; dati?: unknown };
  try {
    busta = JSON.parse(ricevuto);
  } catch {
    return null;
  }
  if (busta.formato === "chiaro") return ricevuto;
  if (
    busta.formato !== FORMATO_CIFRATO ||
    typeof busta.nonce !== "string" ||
    typeof busta.dati !== "string"
  )
    return null;
  const nonce = daB64(busta.nonce);
  const cifrato = daB64(busta.dati);
  if (!nonce || !cifrato) return null;
  const chiaro = decifra(chiave, nonce, cifrato, utf8.encode(id));
  if (!chiaro) return null;
  return daUtf8(chiaro);
}

/** Gli allegati: nonce, poi il file cifrato con il suo scopo (DEC-135). */
export function apriFile(
  chiave: Uint8Array,
  scopo: string,
  cifrato: Uint8Array,
): Uint8Array | null {
  if (cifrato.length < 24) return null;
  return decifra(chiave, cifrato.subarray(0, 24), cifrato.subarray(24), utf8.encode(scopo));
}

export function chiudiFile(chiave: Uint8Array, scopo: string, byte: Uint8Array): Uint8Array {
  const nonce = casuali(24);
  const cifrato = cifra(chiave, nonce, byte, utf8.encode(scopo));
  const fuori = new Uint8Array(24 + cifrato.length);
  fuori.set(nonce);
  fuori.set(cifrato, 24);
  return fuori;
}

const ALFABETO_RECUPERO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function scriviRecupero(chiave: Uint8Array): string {
  let bit = Array.from(chiave, (b) => b.toString(2).padStart(8, "0")).join("");
  while (bit.length % 5) bit += "0";
  const lettere: string[] = [];
  for (let i = 0; i < bit.length; i += 5)
    lettere.push(ALFABETO_RECUPERO[parseInt(bit.slice(i, i + 5), 2)]);
  const gruppi: string[] = [];
  for (let i = 0; i < lettere.length; i += 4) gruppi.push(lettere.slice(i, i + 4).join(""));
  return gruppi.join("-");
}

export function leggiRecupero(testo: string): Uint8Array | null {
  const pulito = testo.toUpperCase().replace(/[\s-]/g, "");
  if (pulito.length !== 52) return null;
  let bit = "";
  for (const c of pulito) {
    const i = ALFABETO_RECUPERO.indexOf(c);
    if (i < 0) return null;
    bit += i.toString(2).padStart(5, "0");
  }
  const chiave = new Uint8Array(32);
  for (let i = 0; i < 32; i++) chiave[i] = parseInt(bit.slice(i * 8, i * 8 + 8), 2);
  return chiave;
}
