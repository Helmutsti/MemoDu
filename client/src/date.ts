// Date nei testi dell'interfaccia (RF-04, CA-04.1): istanti in ora locale del dispositivo,
// giorni del calendario come GG/MM/AAAA (DEC-28).

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

/** Riga sotto il titolo e nei Dettagli: «Modificata oggi alle 11:42» (CA-04.1). */
export const testoModificata = (istante: string, adesso = new Date()) =>
  `Modificata ${quando(istante, adesso)}`;

/** Data di creazione di sistema, sotto quella scelta (RB-21): «Creata il 12/09/2026 alle 10:14». */
export const testoCreata = (istante: string) => {
  const d = new Date(istante);
  return `Creata il ${giorno(d)} alle ${ora(d)}`;
};

/** Giorno AAAA-MM-GG scritto come GG/MM/AAAA. */
export function scriviGiorno(valore: string): string {
  const [a, m, g] = valore.split("-");
  return `${g}/${m}/${a}`;
}

/**
 * Legge un giorno scritto nel campo (GG/MM/AAAA, anche con 1 cifra e con - o .): AAAA-MM-GG,
 * oppure null se non è una data che esiste.
 */
export function leggiGiorno(testo: string): string | null {
  const parti = testo.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!parti) return null;
  const [g, m, a] = [Number(parti[1]), Number(parti[2]), Number(parti[3])];
  const d = new Date(a, m - 1, g);
  if (d.getFullYear() !== a || d.getMonth() !== m - 1 || d.getDate() !== g) return null;
  return `${a}-${due(m)}-${due(g)}`;
}
