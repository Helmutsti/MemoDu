// Regole della password (RB-88) per il telefono, uguali a quelle del server (api/src/chiavi.ts,
// che non dipende da questo pacchetto quando gira) e del computer (client/src-tauri/src/cifratura.rs).
// Una prova del server controlla che le due versioni diano gli stessi esiti.
/** Le password più comuni, in minuscolo: un elenco breve, come chiede RB-88. */
const COMUNI = new Set([
  "123456789012",
  "1234567890123",
  "password1234",
  "passwordpassword",
  "qwertyuiopas",
  "qwerty123456",
  "abcdefghijkl",
  "abc123456789",
  "000000000000",
  "111111111111",
  "iloveyou1234",
  "ciaociaociao",
  "password123!",
  "amore1234567",
  "juventus1234",
  "napoli123456",
  "forzainter12",
  "forzamilan12",
  "admin1234567",
  "benvenuto123",
  "passwordciao",
  "qwertyqwerty",
  "asdfghjklzxc",
  "1q2w3e4r5t6y",
  "letmein12345",
  "welcome12345",
  "memodu123456",
  "memodumemodu",
  "passw0rd1234",
  "aaaaaaaaaaaa",
]);

/** Il motivo per cui la password non va bene, o null (RB-88). */
export function problemaPassword(password: string): string | null {
  const lettere = [...password.normalize("NFC")];
  if (lettere.length < 12) return "La password deve avere almeno 12 caratteri.";
  const minuscola = password.toLowerCase();
  if (COMUNI.has(minuscola) || /^(.)\1+$/.test(minuscola)) {
    return "Questa password è tra le più usate: scegline un'altra.";
  }
  return null;
}
