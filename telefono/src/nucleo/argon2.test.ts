// libsodium (quello dell'app su iPhone, qui nella versione per il computer) ricava gli stessi byte
// di @noble e del server: lo stesso vettore di cifratura.test.ts.

import sodium from "libsodium-wrappers-sumo";
import { describe, expect, it } from "vitest";
import { argon2id } from "./argon2";

const esa = (b: Uint8Array) => Buffer.from(b).toString("hex");

describe("Argon2id di libsodium come quello del server (DEC-121)", () => {
  it("stessi 32 byte, con i parametri leggeri delle prove", async () => {
    await sodium.ready;
    const password = new TextEncoder().encode("una frase lunga e mia");
    const sale = new Uint8Array(16).fill(0x11);
    const atteso = await argon2id(password, sale, { memoria: 1024, passaggi: 1, fili: 1 });
    const libsodium = sodium.crypto_pwhash(
      32,
      password,
      sale,
      1,
      1024 * 1024,
      sodium.crypto_pwhash_ALG_ARGON2ID13,
    );
    expect(esa(libsodium)).toBe(esa(atteso));
  });
});
