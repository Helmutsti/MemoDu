// Argon2id nativo (libsodium crypto_pwhash) per l'app per iPhone: vedi ios/MemoduArgon2Module.swift.

import { requireNativeModule } from "expo";

interface MemoduArgon2 {
  /** Password e sale in esadecimale; 32 byte in esadecimale. Memoria in KiB. */
  argon2id(password: string, sale: string, passaggi: number, memoriaKiB: number): Promise<string>;
}

export default requireNativeModule<MemoduArgon2>("MemoduArgon2");
