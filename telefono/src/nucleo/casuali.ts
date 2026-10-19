// Byte casuali sicuri. Nell'app li dà iOS (casuali.native.ts); nelle prove, sul computer, Web Crypto.

export function casuali(n: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(n));
}
