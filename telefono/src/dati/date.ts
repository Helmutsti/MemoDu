// Date nei testi, come client/src/date.ts (RF-04, DEC-28): ora locale, giorni come GG/MM/AAAA.

const due = (n: number) => String(n).padStart(2, "0");
const stessoGiorno = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const ora = (d: Date) => `${due(d.getHours())}:${due(d.getMinutes())}`;
const giorno = (d: Date) => `${due(d.getDate())}/${due(d.getMonth() + 1)}/${d.getFullYear()}`;

/** «oggi alle 11:42» oppure «il 12/09/2026 alle 10:14». */
export function quando(istante: string, adesso = new Date()): string {
  const d = new Date(istante);
  return stessoGiorno(d, adesso) ? `oggi alle ${ora(d)}` : `il ${giorno(d)} alle ${ora(d)}`;
}

/** «14:32» oggi, «05/10/2026 14:32» gli altri giorni. */
export function orario(istante: string, adesso = new Date()): string {
  const d = new Date(istante);
  return stessoGiorno(d, adesso) ? ora(d) : `${giorno(d)} ${ora(d)}`;
}

/** «Modificata oggi alle 11:42» (CA-04.1), come sul computer. */
export const testoModificata = (istante: string, adesso = new Date()) =>
  `Modificata ${quando(istante, adesso)}`;

/** Giorno AAAA-MM-GG scritto come GG/MM/AAAA. */
export function scriviGiorno(valore: string): string {
  const [a, m, g] = valore.split("-");
  return `${g}/${m}/${a}`;
}

/** Il giorno di un istante, GG/MM/AAAA. */
export const giornoDi = (istante: string) => giorno(new Date(istante));

/**
 * Sopra una nota in Brainet, come sul computer (RB-131): «oggi alle 18:40», «il 09/10/2026 alle
 * 17:02»; con un giorno scelto in Info, quel giorno senza ora.
 */
export function quandoNota(
  n: { creata: string; creata_scelta: string | null },
  adesso = new Date(),
): string {
  if (!n.creata_scelta) return quando(n.creata, adesso);
  const oggi = `${adesso.getFullYear()}-${due(adesso.getMonth() + 1)}-${due(adesso.getDate())}`;
  return n.creata_scelta === oggi ? "oggi" : `il ${scriviGiorno(n.creata_scelta)}`;
}
