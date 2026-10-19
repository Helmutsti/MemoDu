// Argon2id per l'accesso sul telefono (DEC-121, DEC-156) con libsodium: crypto_pwhash è Argon2id
// versione 1.3 con un filo, come il server e il computer. Gira fuori dal filo dell'interfaccia
// (AsyncFunction): 64 MiB in JavaScript su iPhone richiederebbero minuti.

import Clibsodium
import ExpoModulesCore

public class MemoduArgon2Module: Module {
  public func definition() -> ModuleDefinition {
    Name("MemoduArgon2")

    AsyncFunction("argon2id") { (passwordEsa: String, saleEsa: String, passaggi: Int, memoriaKiB: Int) throws -> String in
      guard sodium_init() >= 0 else { throw ErroreArgon2.libsodium }
      guard let password = Data(esadecimale: passwordEsa), let sale = Data(esadecimale: saleEsa),
        sale.count == Int(crypto_pwhash_saltbytes()) else { throw ErroreArgon2.ingresso }
      var uscita = Data(count: 32)
      let esito: Int32 = uscita.withUnsafeMutableBytes { u in
        password.withUnsafeBytes { p in
          sale.withUnsafeBytes { s in
            guard let fuori = u.bindMemory(to: UInt8.self).baseAddress,
              let segreto = p.bindMemory(to: CChar.self).baseAddress,
              let granello = s.bindMemory(to: UInt8.self).baseAddress
            else { return -1 }
            return crypto_pwhash(
              fuori, 32, segreto, UInt64(password.count), granello,
              UInt64(passaggi), memoriaKiB * 1024, crypto_pwhash_ALG_ARGON2ID13)
          }
        }
      }
      guard esito == 0 else { throw ErroreArgon2.calcolo }
      return uscita.map { String(format: "%02x", $0) }.joined()
    }
  }
}

enum ErroreArgon2: Error {
  case libsodium, ingresso, calcolo
}

extension Data {
  init?(esadecimale: String) {
    guard esadecimale.count % 2 == 0 else { return nil }
    var byte = [UInt8]()
    var i = esadecimale.startIndex
    while i < esadecimale.endIndex {
      let j = esadecimale.index(i, offsetBy: 2)
      guard let b = UInt8(esadecimale[i..<j], radix: 16) else { return nil }
      byte.append(b)
      i = j
    }
    self.init(byte)
  }
}
