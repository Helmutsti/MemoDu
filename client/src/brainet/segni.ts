// I segni di Brainet nel testo (RF-18, scelta di Manuel Cucca del 15/10/2026), come li legge il
// nucleo in `archivio_brainet.rs`:
//   collegamento (EN-14): <cita e="ID">nome</cita>
//   area (EN-15):         <area id="ID" s="ID,ID" e="ID,ID">frase</area id="ID">
// Le posizioni sono quelle delle stringhe JavaScript, come in CodeMirror.

export interface Tratto {
  da: number;
  a: number;
}

export interface Citazione extends Tratto {
  entita: string;
  /** Il nome com'era quando si è scritto: serve solo se l'entità non c'è più. */
  nome: string;
}

export interface AreaSegno {
  id: string;
  apre: Tratto;
  /** null se la chiusura manca: l'area arriva fino in fondo. */
  chiude: Tratto | null;
  stati: string[];
  /** Le entità scritte nel segno, senza quelle citate dentro. */
  entita: string[];
}

const CITA = /<cita e="([^"]+)">([^<]*)<\/cita>/g;
const AREA_APRE = /<area id="([^"]+)"(?: s="([^"]*)")?(?: e="([^"]*)")?>/g;
const AREA_CHIUDE = /<\/area id="([^"]+)">/g;
/** Un `<` che comincia un segno senza esserlo, scritto o incollato dall'utente. */
const FINTO_SEGNO = /<(\/?)(cita|area)\b/g;

const lista = (v: string | undefined) => (v ? v.split(",").filter(Boolean) : []);

export function leggiSegni(testo: string): { citazioni: Citazione[]; aree: AreaSegno[] } {
  const citazioni: Citazione[] = [];
  for (const m of testo.matchAll(CITA)) {
    citazioni.push({ da: m.index, a: m.index + m[0].length, entita: m[1], nome: m[2] });
  }
  const chiusure = new Map<string, Tratto>();
  for (const m of testo.matchAll(AREA_CHIUDE)) {
    chiusure.set(m[1], { da: m.index, a: m.index + m[0].length });
  }
  const aree: AreaSegno[] = [];
  for (const m of testo.matchAll(AREA_APRE)) {
    aree.push({
      id: m[1],
      apre: { da: m.index, a: m.index + m[0].length },
      chiude: chiusure.get(m[1]) ?? null,
      stati: lista(m[2]),
      entita: lista(m[3]),
    });
  }
  return { citazioni, aree };
}

/** Le entità di un'area: quelle scritte nel segno più quelle citate dentro (RB-107). */
export function entitaDellArea(
  area: AreaSegno,
  citazioni: Citazione[],
  lunghezza: number,
): string[] {
  const fine = area.chiude?.da ?? lunghezza;
  const dentro = citazioni.filter((c) => c.da >= area.apre.a && c.a <= fine).map((c) => c.entita);
  return [...new Set([...area.entita, ...dentro])];
}

/** Il nome dentro il segno non può avere `<`: diventerebbe la fine del segno. */
export function segnoCita(entita: { id: string; nome: string }): string {
  return `<cita e="${entita.id}">${entita.nome.replace(/</g, "‹")}</cita>`;
}

export function segnoApre(id: string, stati: string[], entita: string[]): string {
  let s = `<area id="${id}"`;
  if (stati.length) s += ` s="${stati.join(",")}"`;
  if (entita.length) s += ` e="${entita.join(",")}"`;
  return `${s}>`;
}

export function segnoChiude(id: string): string {
  return `</area id="${id}">`;
}

/** Il testo che si legge, senza segni. */
export function testoSemplice(testo: string): string {
  return testo
    .replace(CITA, "$2")
    .replace(AREA_APRE, "")
    .replace(AREA_CHIUDE, "")
    .replace(/&lt;/g, "<");
}

/** Le posizioni dei `<` di segni finti in un tratto di testo. */
export function segniFinti(testo: string): number[] {
  return [...testo.matchAll(FINTO_SEGNO)].map((m) => m.index);
}

/** Legami dell'area `id`: stati, entità scritte nel segno e quelle citate dentro. */
export function legamiArea(
  testo: string,
  id: string,
): { stati: string[]; entita: string[]; citate: string[] } | null {
  const { citazioni, aree } = leggiSegni(testo);
  const area = aree.find((x) => x.id === id);
  if (!area) return null;
  const tutte = entitaDellArea(area, citazioni, testo.length);
  return {
    stati: area.stati,
    entita: area.entita,
    citate: tutte.filter((e) => !area.entita.includes(e)),
  };
}
