// Ricerca e filtri sulla copia di lavoro del telefono (RF-08, DEC-94, DEC-95), con le regole di
// client/src-tauri/src/archivio_ricerca.rs; non passa mai dal server.
// - Il testo si cerca in titolo, contenuto e percorsi dei tag, anche dentro le parole, senza
//   maiuscole e accenti; con più parole servono tutte (RB-69). Il telefono ha poche note: le
//   scorre tutte, senza indice.
// - I filtri si sommano: ogni tag scelto, con i suoi sotto-tag, e i periodi di creazione e
//   modifica (RB-70). I periodi arrivano già in UTC (client/src/ricerca.ts).
// - Prima le note con il testo nel titolo o nei tag, poi le altre, per ultima modifica (RB-34).
// - Le note nel cestino, o in una cartella nel cestino, compaiono segnate, se la preferenza lo
//   vuole (RB-29); quelle in Brainet no (RB-126).

import { anteprima } from "../../../condiviso/src/anteprima";

/** Caratteri dell'estratto attorno alla parola trovata (DEC-95). */
const LUNGHEZZA_ESTRATTO = 80;
/** Caratteri prima della parola, quando c'è spazio. */
const PRIMA_DELLA_PAROLA = 24;

export interface Intervallo {
  da: string | null;
  a: string | null;
}

export interface RichiestaRicerca {
  testo: string;
  /** Percorsi dei tag: la nota deve averli tutti, o un loro sotto-tag (RB-70). */
  tag: string[];
  creata: Intervallo | null;
  modificata: Intervallo | null;
}

export interface RisultatoRicerca {
  id: string;
  titolo: string;
  estratto: string;
  /** Inizio e fine della parola da evidenziare, in caratteri dell'estratto. */
  evidenza: [number, number] | null;
  /** La cartella, o da dove veniva per le note nel cestino; "" nella radice. */
  cartella: string;
  /** Istante UTC, o giorno AAAA-MM-GG per una data di creazione scelta. */
  data: string;
  nelCestino: boolean;
}

/** Una nota come la legge la ricerca, con i campi del blocco. */
export interface NotaDaCercare {
  id: string;
  titolo: string;
  contenuto: string;
  cartella: string | null;
  creata: string;
  creata_scelta: string | null;
  modificata: string;
  eliminata_il: string | null;
  provenienza: string | null;
  brainet: boolean;
  tag: string[];
}

export interface CartellaDaCercare {
  nome: string;
  madre: string | null;
  eliminata: boolean;
}

/** Senza accenti e in minuscolo (RB-69), come `normalizza` del computer. */
export const normalizza = (testo: string) =>
  testo.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Il testo di una nota senza i segni di Brainet: la pillola e l'allegato con il nome, l'area con la frase. */
const testoSemplice = (testo: string) =>
  testo
    .replace(/<cita e="[^"]+">([^<]*)<\/cita>/g, "$1")
    .replace(/<allegato id="[^"]+" f="[a-z]+">([^<]*)<\/allegato>/g, "$1")
    .replace(/<\/?area id="[^"]+"[^>]*>/g, "")
    .replace(/&lt;/g, "<");

const nomeNota = (n: NotaDaCercare) => n.titolo || anteprima(n.contenuto);

/** Un giorno scelto (DEC-28) vale dalla mezzanotte di questo telefono. */
const mezzanotte = (giorno: string) => {
  const [a, m, g] = giorno.split("-").map(Number);
  return new Date(a, m - 1, g).getTime();
};

const contiene = (periodo: Intervallo, momento: number) =>
  (periodo.da === null || momento >= Date.parse(periodo.da)) &&
  (periodo.a === null || momento <= Date.parse(periodo.a));

/**
 * Circa 80 caratteri attorno alla prima parola trovata nel contenuto, a parole intere, con «…»
 * dove si taglia; null se nessuna parola è nel contenuto.
 */
export function estratto(
  contenuto: string,
  parole: string[],
): { testo: string; evidenza: [number, number] } | null {
  const caratteri = [...contenuto.replace(/\s+/g, " ").trim()];
  // Il testo normalizzato, con per ogni suo carattere quello del testo da cui viene.
  const normale: string[] = [];
  const origine: number[] = [];
  caratteri.forEach((c, i) => {
    for (const n of normalizza(c)) {
      normale.push(n);
      origine.push(i);
    }
  });
  let migliore: [number, number] | null = null;
  for (const p of parole) {
    const cercata = [...p];
    if (!cercata.length) continue;
    for (let i = 0; i + cercata.length <= normale.length; i++) {
      if (cercata.every((c, j) => normale[i + j] === c)) {
        const trovata: [number, number] = [origine[i], origine[i + cercata.length - 1] + 1];
        if (!migliore || trovata[0] < migliore[0]) migliore = trovata;
        break;
      }
    }
  }
  if (!migliore) return null;
  const [inizio, fine] = migliore;
  const totale = caratteri.length;
  let da = Math.max(0, inizio - PRIMA_DELLA_PAROLA);
  if (da > 0) {
    // Si comincia da una parola intera.
    const spazio = caratteri.slice(da, inizio).indexOf(" ");
    da = spazio >= 0 ? da + spazio + 1 : inizio;
  }
  let a = Math.min(Math.max(da + LUNGHEZZA_ESTRATTO, fine), totale);
  if (a < totale) {
    const spazio = caratteri.slice(fine, a).lastIndexOf(" ");
    if (spazio >= 0) a = fine + spazio;
  }
  const prima = da > 0 ? "…" : "";
  const dopo = a < totale ? "…" : "";
  const corpo = caratteri.slice(da, a).join("").trimEnd();
  return {
    testo: `${prima}${corpo}${dopo}`,
    evidenza: [inizio - da + prima.length, fine - da + prima.length],
  };
}

/**
 * Le note che rispondono alla richiesta (RF-08). `tag` dà per ogni id il percorso, «lavoro/clienti».
 * Senza testo e senza filtri non c'è niente: la ricerca mostra solo i filtri (RB-33).
 */
export function cerca(
  richiesta: RichiestaRicerca,
  note: NotaDaCercare[],
  cartelle: Map<string, CartellaDaCercare>,
  tag: Map<string, string>,
  cestino: boolean,
): RisultatoRicerca[] {
  const parole = richiesta.testo
    .split(/\s+/)
    .map(normalizza)
    .filter((p) => p !== "");
  const { creata, modificata } = richiesta;
  if (!parole.length && !richiesta.tag.length && !creata && !modificata) return [];
  // Le madri di una cartella, dalla più vicina; si ferma se una non c'è.
  const catena = (id: string | null) => {
    const madri: CartellaDaCercare[] = [];
    for (let c = id ? cartelle.get(id) : undefined; c && madri.length <= cartelle.size;) {
      madri.push(c);
      c = c.madre ? cartelle.get(c.madre) : undefined;
    }
    return madri;
  };
  const percorso = (id: string | null) =>
    catena(id)
      .map((c) => c.nome)
      .reverse()
      .join("/");
  const voluti = richiesta.tag.map((t) => normalizza(t));
  const trovati: { gruppo: number; modificata: string; r: RisultatoRicerca }[] = [];
  for (const n of note) {
    if (n.brainet) continue;
    const percorsiTag = n.tag.map((id) => tag.get(id)).filter((t): t is string => !!t);
    // Ogni tag scelto, o un suo sotto-tag (RB-70).
    const tagNota = percorsiTag.map(normalizza);
    if (!voluti.every((v) => tagNota.some((t) => t === v || t.startsWith(`${v}/`)))) continue;
    const tutto = normalizza(`${n.titolo}\n${n.contenuto}\n${percorsiTag.join("\n")}`);
    if (!parole.every((p) => tutto.includes(p))) continue;
    if (modificata && !contiene(modificata, Date.parse(n.modificata))) continue;
    if (creata) {
      const momento = n.creata_scelta ? mezzanotte(n.creata_scelta) : Date.parse(n.creata);
      if (!contiene(creata, momento)) continue;
    }
    const nelCestino = !!n.eliminata_il || catena(n.cartella).some((c) => c.eliminata);
    if (nelCestino && !cestino) continue;
    const inEvidenza = normalizza(`${n.titolo}\n${percorsiTag.join("\n")}`);
    const trovato = estratto(testoSemplice(n.contenuto), parole);
    trovati.push({
      gruppo: parole.some((p) => inEvidenza.includes(p)) ? 0 : 1,
      modificata: n.modificata,
      r: {
        id: n.id,
        titolo: nomeNota(n),
        estratto: trovato ? trovato.testo : anteprima(n.contenuto),
        evidenza: trovato ? trovato.evidenza : null,
        cartella: n.eliminata_il ? (n.provenienza ?? "") : percorso(n.cartella),
        data: modificata || !creata ? n.modificata : (n.creata_scelta ?? n.creata),
        nelCestino,
      },
    });
  }
  trovati.sort((a, b) => a.gruppo - b.gruppo || b.modificata.localeCompare(a.modificata));
  return trovati.map((t) => t.r);
}
