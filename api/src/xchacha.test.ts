import { describe, expect, it } from "vitest";
import { avvolgi, cifra, decifra, hchacha20, svolgi } from "./xchacha.js";

// Vettori del draft-irtf-cfrg-xchacha-03 (2.2.1 e A.3.1).
const da = (esa: string) => Buffer.from(esa.replace(/\s/g, ""), "hex");
const sequenza = (inizio: number, n: number) =>
  Buffer.from(Array.from({ length: n }, (_, i) => inizio + i));

describe("XChaCha20-Poly1305", () => {
  it("HChaCha20 dà la sottochiave del vettore di prova", () => {
    const nonce = da("000000090000004a0000000031415927");
    expect(hchacha20(sequenza(0, 32), nonce).toString("hex")).toBe(
      "82413b4227b27bfed30e42508a877d73a0f9e4d58a74a853c12ec41326d3ecdc",
    );
  });

  it("cifra e decifra come il vettore di prova", () => {
    const testo = Buffer.from(
      "Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.",
    );
    const aggiunti = da("50515253c0c1c2c3c4c5c6c7");
    const chiave = sequenza(0x80, 32);
    const nonce = sequenza(0x40, 24);
    const atteso = da(`bd6d179d3e83d43b9576579493c0e939572a1700252bfaccbed2902c21396cbb
      731c7f1b0b4aa6440bf3a82f4eda7e39ae64c6708c54c216cb96b72e1213b452
      2f8c9ba40db5d945b11b69b982c1bb9e3f3fac2bc369488f76b2383565d3fff9
      21f9664c97637da9768812f615c68b13b52e
      c0875924c1c7987947deafd8780acf49`);
    expect(cifra(chiave, nonce, testo, aggiunti).toString("hex")).toBe(atteso.toString("hex"));
    expect(decifra(chiave, nonce, atteso, aggiunti).toString()).toBe(testo.toString());
  });

  it("rifiuta un blocco alterato", () => {
    const chiave = sequenza(1, 32);
    const nonce = sequenza(2, 24);
    const cifrato = cifra(chiave, nonce, Buffer.from("nota"));
    cifrato[0]! ^= 1;
    expect(() => decifra(chiave, nonce, cifrato)).toThrow();
  });

  it("avvolge e svolge una chiave solo con lo stesso scopo", () => {
    const chiave = sequenza(3, 32);
    const dati = sequenza(100, 32);
    const avvolta = avvolgi(chiave, dati, "memodu/chiave-dati/password");
    expect(avvolta).toHaveLength(96);
    expect(svolgi(chiave, avvolta, "memodu/chiave-dati/password").equals(dati)).toBe(true);
    expect(() => svolgi(chiave, avvolta, "memodu/chiave-dati/recupero")).toThrow();
  });
});
