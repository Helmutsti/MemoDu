// Solo per argon2.test.ts: la parte di libsodium-wrappers-sumo che serve alla prova.
declare module "libsodium-wrappers-sumo" {
  const sodium: {
    ready: Promise<void>;
    crypto_pwhash_ALG_ARGON2ID13: number;
    crypto_pwhash(
      n: number,
      password: Uint8Array,
      sale: Uint8Array,
      passaggi: number,
      memoria: number,
      alg: number,
    ): Uint8Array;
  };
  export default sodium;
}
