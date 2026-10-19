// Gli stessi vettori delle prove del computer (client/src-tauri/src/cifratura.rs): il telefono
// deve ricavare e aprire esattamente gli stessi byte.

import { describe, expect, it } from "vitest";
import {
  apriBlocco,
  avvolgiChiaveDati,
  b64,
  chiudiBlocco,
  daB64,
  daUtf8,
  daPassword,
  daRecupero,
  FORMATO_CIFRATO,
  leggiRecupero,
  scriviRecupero,
  svolgiChiaveDati,
  svolgiChiaveDatiRecupero,
} from "./cifratura";

const esa = (t: string) => Uint8Array.from(t.match(/../g)!.map((h) => parseInt(h, 16)));
const pieno = (b: number, n = 32) => new Uint8Array(n).fill(b);
const LEGGERO = { memoria: 1024, passaggi: 1, fili: 1 };

describe("chiavi come sul computer (DEC-121)", () => {
  it("la password dà la stessa prova e la stessa cassaforte del server", async () => {
    const { prova, cassaforte } = await daPassword(
      "una frase lunga e mia",
      pieno(0x11, 16),
      LEGGERO,
    );
    expect(prova).toEqual(esa("c52e9c1c3b197f6a8d1cc770ab0b49f6211a71baaf02b920af33ba481310b97a"));
    expect(cassaforte).toEqual(
      esa("dd5da387b1ef1f021e6a25a85a009d61545505192438cb66355af4770f3abff8"),
    );
  });

  it("la password si confronta in NFC", async () => {
    const a = await daPassword("caffè e altro ancora", pieno(1, 16), LEGGERO);
    const b = await daPassword("caffè e altro ancora", pieno(1, 16), LEGGERO);
    expect(a.prova).toEqual(b.prova);
  });

  it("la chiave dati avvolta dal server si apre, e solo con la sua cassaforte", async () => {
    const { cassaforte } = await daPassword("una frase lunga e mia", pieno(0x11, 16), LEGGERO);
    const avvolta =
      "REREREREREREREREREREREREREREREREEYdsxGwNBSzXDAq3DHgd9OmbbSaHzWfS4b8ijnEAVHxx1o1juoPctbR6qe19Uyi0";
    expect(svolgiChiaveDati(cassaforte, avvolta)).toEqual(pieno(0x33));
    expect(svolgiChiaveDati(pieno(0), avvolta)).toBeNull();
  });

  it("la chiave di recupero dà le stesse prove e si scrive come sul server", () => {
    const r = pieno(0x22);
    const { prova, cassaforte } = daRecupero(r);
    expect(prova).toEqual(esa("e32fa610c5e29957383dfa393316c665f9ba7aee85a8a6e1c60a7ceaee9f4b99"));
    expect(cassaforte).toEqual(
      esa("926154ec01673d40dfa411f9d3f6a222fe8fa47e842d46e628e89a222bd1aa8c"),
    );
    const testo = scriviRecupero(r);
    expect(testo).toBe("EJTC-EJTC-EJTC-EJTC-EJTC-EJTC-EJTC-EJTC-EJTC-EJTC-EJTC-EJTC-EJTA");
    expect(leggiRecupero(testo.toLowerCase().replaceAll("-", " "))).toEqual(r);
    expect(leggiRecupero("EJTC")).toBeNull();
    expect(leggiRecupero(testo.replaceAll("E", "0"))).toBeNull();
    const avvolta =
      "HIdC6mVNUdCxVM00QB8fNCaJjDVM9d4v3UT0hA0cjNgwFKl9rqsudB285Ee0Gf99PrBiRpsqiJDYf4lwFjnGnyoZ8KxGWIYU";
    expect(svolgiChiaveDatiRecupero(cassaforte, avvolta)).toEqual(pieno(0x33));
  });

  it("la chiave dati riavvolta si riapre solo con il suo scopo", () => {
    const cassaforte = pieno(5);
    const avvolta = avvolgiChiaveDati(cassaforte, pieno(9), false);
    expect(svolgiChiaveDati(cassaforte, avvolta)).toEqual(pieno(9));
    expect(svolgiChiaveDatiRecupero(cassaforte, avvolta)).toBeNull();
  });
});

describe("blocchi della sincronizzazione", () => {
  it("un blocco si chiude e si riapre solo per il suo elemento", () => {
    const chiave = pieno(7);
    const blocco = '{"campi":{"titolo":"Riunione"},"formato":"chiaro","tipo":"nota"}';
    const busta = chiudiBlocco(chiave, "id-1", blocco);
    expect(busta).not.toContain("Riunione");
    expect(busta).toContain(FORMATO_CIFRATO);
    expect(apriBlocco(chiave, "id-1", busta)).toBe(blocco);
    expect(apriBlocco(chiave, "id-2", busta)).toBeNull();
    expect(apriBlocco(pieno(8), "id-1", busta)).toBeNull();
  });

  it("un blocco alterato non si apre", () => {
    const chiave = pieno(7);
    const busta = JSON.parse(chiudiBlocco(chiave, "id", "{}"));
    const dati = daB64(busta.dati)!;
    dati[0] ^= 1;
    busta.dati = b64(dati);
    expect(apriBlocco(chiave, "id", JSON.stringify(busta))).toBeNull();
  });

  it("base64url come il computer, senza «=»", () => {
    for (const n of [0, 1, 2, 3, 31, 32, 72]) {
      const byte = Uint8Array.from({ length: n }, (_, i) => (i * 37) & 255);
      const testo = b64(byte);
      expect(testo).toBe(Buffer.from(byte).toString("base64url"));
      expect(daB64(testo)).toEqual(byte);
    }
  });

  it("UTF-8 come TextDecoder rigoroso, anche con accenti ed emoji", () => {
    for (const t of ["", "abc", "caffè", "€ 5", "🙂 ok", "日本"])
      expect(daUtf8(new TextEncoder().encode(t))).toBe(t);
    expect(daUtf8(Uint8Array.from([0xc3]))).toBeNull();
    expect(daUtf8(Uint8Array.from([0xff]))).toBeNull();
    expect(daUtf8(Uint8Array.from([0xed, 0xa0, 0x80]))).toBeNull();
  });
});
