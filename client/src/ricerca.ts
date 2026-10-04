// Ricerca (RF-08, DEC-94, DEC-95): periodi dei filtri di data calcolati nell'ora locale e inviati
// al nucleo in UTC, testi delle pillole e dettagli dei risultati.

import type { Intervallo, RisultatoRicerca } from "./api";
import { scriviGiorno } from "./date";

/** Una scelta del filtro di data (CMP-09, filtro data); un giorno viene da «Scegli le date…». */
export type Periodo = "oggi" | "7" | "30" | "anno" | { giorno: string };

/** Le scelte del menu, dopo «Qualsiasi data». */
export const PERIODI: { valore: Periodo; etichetta: string }[] = [
  { valore: "oggi", etichetta: "Oggi" },
  { valore: "7", etichetta: "Ultimi 7 giorni" },
  { valore: "30", etichetta: "Ultimi 30 giorni" },
  { valore: "anno", etichetta: "Quest'anno" },
];

/** Pausa dall'ultimo tasto prima di cercare (RB-33, DEC-95). */
export const PAUSA_RICERCA_MS = 150;

export const stessoPeriodo = (a: Periodo | null, b: Periodo | null) =>
  typeof a === "object" && a !== null && typeof b === "object" && b !== null
    ? a.giorno === b.giorno
    : a === b;

const mezzanotte = (anno: number, mese: number, giorno: number) => new Date(anno, mese, giorno);

/** Il periodo in UTC: dalla mezzanotte locale del primo giorno; un giorno solo finisce alle 23:59:59. */
export function intervallo(periodo: Periodo, adesso = new Date()): Intervallo {
  const [a, m, g] = [adesso.getFullYear(), adesso.getMonth(), adesso.getDate()];
  if (typeof periodo === "object") {
    const [pa, pm, pg] = periodo.giorno.split("-").map(Number);
    const inizio = mezzanotte(pa!, pm! - 1, pg!);
    const fine = new Date(mezzanotte(pa!, pm! - 1, pg! + 1).getTime() - 1);
    return { da: inizio.toISOString(), a: fine.toISOString() };
  }
  const inizio = {
    oggi: mezzanotte(a, m, g),
    "7": mezzanotte(a, m, g - 6),
    "30": mezzanotte(a, m, g - 29),
    anno: mezzanotte(a, 0, 1),
  }[periodo];
  return { da: inizio.toISOString(), a: null };
}

/** Il periodo dopo il nome della pillola: «Modifica: ultimi 7 giorni», «Creazione: 12/09/2026». */
export function nomePeriodo(periodo: Periodo): string {
  if (typeof periodo === "object") return scriviGiorno(periodo.giorno);
  const scelta = PERIODI.find((p) => p.valore === periodo)!;
  return scelta.etichetta.toLowerCase();
}

/** Pillola del filtro Tag: «Tag», «Tag: lavoro», «Tag: 2». */
export const nomeFiltroTag = (tag: string[]) =>
  tag.length === 0 ? "Tag" : tag.length === 1 ? `Tag: ${tag[0]}` : `Tag: ${tag.length}`;

/** «Lavoro › Clienti · 25/09/2026»; senza cartella «CLOUD», la radice (DEC-119). */
export function dettagliRisultato(r: RisultatoRicerca): string {
  const cartella = r.cartella === "" ? "CLOUD" : r.cartella.split("/").join(" › ");
  return `${cartella} · ${dataRisultato(r.data)}`;
}

/** Un giorno scelto come GG/MM/AAAA; un istante nel giorno di questo computer. */
export function dataRisultato(data: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return scriviGiorno(data);
  const d = new Date(data);
  const due = (n: number) => String(n).padStart(2, "0");
  return `${due(d.getDate())}/${due(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** L'estratto diviso attorno alla parola da evidenziare (evidenza in caratteri, non in byte). */
export function divisioneEstratto(r: RisultatoRicerca): [string, string, string] {
  const caratteri = [...r.estratto];
  if (!r.evidenza) return [r.estratto, "", ""];
  const [da, a] = r.evidenza;
  return [
    caratteri.slice(0, da).join(""),
    caratteri.slice(da, a).join(""),
    caratteri.slice(a).join(""),
  ];
}
