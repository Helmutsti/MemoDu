// Formati della nota sul telefono, con gli stessi segni Markdown del computer
// (client/src/editor/formati.ts, DEC-28): un solo formato di riga alla volta; i formati di
// carattere intorno alla selezione o, senza selezione, alla parola sotto il cursore; ripetuti,
// si tolgono. Funzioni pure sul testo, così si provano senza l'app.

export type FormatoTesto = "grassetto" | "corsivo" | "sottolineato" | "barrato";
export type FormatoRiga = "titolo" | "sottotitolo" | "puntato" | "numerato" | "checklist";

export interface Selezione {
  start: number;
  end: number;
}

const PREFISSO: Record<FormatoRiga, string> = {
  titolo: "# ",
  sottotitolo: "## ",
  puntato: "- ",
  numerato: "1. ",
  checklist: "- [ ] ",
};
const PREFISSO_ESISTENTE = /^(#{1,6} |[-*+] \[[ xX]\] |[-*+] |\d+[.)] )/;

const SEGNI: Record<FormatoTesto, [string, string]> = {
  grassetto: ["**", "**"],
  corsivo: ["*", "*"],
  barrato: ["~~", "~~"],
  sottolineato: ["<u>", "</u>"],
};

const inizioRiga = (t: string, i: number) => t.lastIndexOf("\n", i - 1) + 1;

export function formatoRiga(riga: string): FormatoRiga | "testo" {
  if (riga.startsWith("## ")) return "sottotitolo";
  if (riga.startsWith("# ")) return "titolo";
  if (/^[-*+] \[[ xX]\] /.test(riga)) return "checklist";
  if (/^[-*+] /.test(riga)) return "puntato";
  if (/^\d+[.)] /.test(riga)) return "numerato";
  return "testo";
}

/** Cambia il formato della riga del cursore; lo stesso formato ripetuto torna testo normale. */
export function applicaRiga(t: string, sel: Selezione, f: FormatoRiga | "testo") {
  const da = inizioRiga(t, sel.start);
  const fine = t.indexOf("\n", da);
  const riga = t.slice(da, fine < 0 ? t.length : fine);
  const vecchio = riga.match(PREFISSO_ESISTENTE)?.[0] ?? "";
  const nuovo = f === "testo" || formatoRiga(riga) === f ? "" : PREFISSO[f];
  const d = nuovo.length - vecchio.length;
  return {
    testo: t.slice(0, da) + nuovo + t.slice(da + vecchio.length),
    sel: { start: Math.max(da, sel.start + d), end: Math.max(da, sel.end + d) },
  };
}

/** La parola sotto il cursore, se non c'è una selezione. */
function parola(t: string, sel: Selezione): Selezione {
  if (sel.start !== sel.end) return sel;
  let a = sel.start;
  let b = sel.end;
  while (a > 0 && /[\p{L}\p{N}_]/u.test(t[a - 1])) a--;
  while (b < t.length && /[\p{L}\p{N}_]/u.test(t[b])) b++;
  return { start: a, end: b };
}

export function haFormato(t: string, sel: Selezione, f: FormatoTesto): boolean {
  const s = parola(t, sel);
  const [a, b] = SEGNI[f];
  return t.slice(s.start - a.length, s.start) === a && t.slice(s.end, s.end + b.length) === b;
}

/** Mette o toglie un formato di carattere intorno alla selezione (o alla parola). */
export function applicaTesto(t: string, sel: Selezione, f: FormatoTesto) {
  const s = parola(t, sel);
  const [a, b] = SEGNI[f];
  if (haFormato(t, sel, f)) {
    return {
      testo: t.slice(0, s.start - a.length) + t.slice(s.start, s.end) + t.slice(s.end + b.length),
      sel: { start: sel.start - a.length, end: sel.end - a.length },
    };
  }
  return {
    testo: t.slice(0, s.start) + a + t.slice(s.start, s.end) + b + t.slice(s.end),
    sel: { start: sel.start + a.length, end: sel.end + a.length },
  };
}

/** Le voci accese dove sta il cursore, per la barra dei formati. */
export function attivi(t: string, sel: Selezione): Set<FormatoRiga | "testo" | FormatoTesto> {
  const da = inizioRiga(t, sel.start);
  const fine = t.indexOf("\n", da);
  const s = new Set<FormatoRiga | "testo" | FormatoTesto>([
    formatoRiga(t.slice(da, fine < 0 ? t.length : fine)),
  ]);
  for (const f of Object.keys(SEGNI) as FormatoTesto[]) if (haFormato(t, sel, f)) s.add(f);
  return s;
}
