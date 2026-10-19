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
