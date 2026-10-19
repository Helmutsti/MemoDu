// Byte casuali sicuri dal generatore di iOS (expo-crypto).

import { getRandomBytes } from "expo-crypto";

export function casuali(n: number): Uint8Array {
  return getRandomBytes(n);
}
