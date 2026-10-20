// Brainet da leggere sul telefono (RF-18, DEC-145, DEC-147), con le regole di
// client/src-tauri/src/archivio_brainet.rs: il Journal (le note in Brainet fuori dal Cestino,
// RB-131), le entità con quante volte sono nominate e l'ultima volta (CA-18.11), la pagina
// dell'entità con i paragrafi che la nominano (RB-124) e i giorni del Calendario (RB-113).
// Contano solo le note in Brainet fuori dal Cestino (RB-127); un'entità unita in un'altra porta
// i suoi riferimenti a quella che resta.

/** I segni nel testo: <cita e="ID">nome</cita> e <area id="ID" s="…" e="…">…</area id="ID">. */
const CITA = /<cita e="([^"]+)">([^<]*)<\/cita>/g;
const AREA_APRE = /<area id="([^"]+)"(?: s="([^"]*)")?(?: e="([^"]*)")?>/g;
const AREA_CHIUDE = /<\/area id="([^"]+)">/g;

export type TipoEntita = "persona" | "argomento" | "evento" | "oggetto";

export interface Entita {
  id: string;
  nome: string;
  tipo: TipoEntita | null;
  /** JPEG in base64, se c'è. */
  foto: string | null;
  /** L'entità in cui è stata unita (RB-108). */
  unitaIn: string | null;
}

export interface Stato {
  id: string;
  nome: string;
  colore: string;
  ordine: number;
}

export interface NotaBrainet {
  id: string;
  titolo: string;
  contenuto: string;
  creata: string;
  creata_scelta: string | null;
  eliminata_il: string | null;
  brainet: boolean;
}

export interface VoceEntita {
  entita: Entita;
  nominata: number;
  /** AAAA-MM-GG dell'ultima nota che la nomina. */
  ultimaVolta: string | null;
}

export interface Passaggio {
  nota: string;
  titolo: string;
  /** HH:MM della creazione; vuota per una data scelta senza ora. */
  ora: string;
  /** Il paragrafo con i suoi segni. */
  testo: string;
  /** Dove comincia il paragrafo nella nota, in unità di JavaScript (come l'editor). */
  inizio: number;
}

export interface PaginaEntita {
  entita: Entita;
  nominata: number;
  ultimaVolta: string | null;
  giorni: { giorno: string; passaggi: Passaggio[] }[];
}

const due = (n: number) => String(n).padStart(2, "0");
const giornoLocale = (d: Date) => `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`;

/** Il giorno della nota sul telefono: quello scelto in Info, se c'è, o quello della creazione. */
export function giornoDellaNota(n: {
  creata: string;
  creata_scelta: string | null;
}): string | null {
  if (n.creata_scelta) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(n.creata_scelta)) return n.creata_scelta;
    const d = new Date(n.creata_scelta);
    return Number.isNaN(d.getTime()) ? null : giornoLocale(d);
  }
  const d = new Date(n.creata);
  return Number.isNaN(d.getTime()) ? null : giornoLocale(d);
}

const oraLocale = (istante: string) => {
  const d = new Date(istante);
  return Number.isNaN(d.getTime()) ? "" : `${due(d.getHours())}:${due(d.getMinutes())}`;
};

/** Le entità citate e le aree del testo, con le posizioni in unità di JavaScript. */
export function leggiSegni(testo: string) {
  const citazioni = [...testo.matchAll(CITA)].map((m) => ({
    entita: m[1],
    inizio: m.index,
    fine: m.index + m[0].length,
  }));
  const chiusure = new Map(
    [...testo.matchAll(AREA_CHIUDE)].map((m) => [m[1], m.index + m[0].length]),
  );
  const lista = (v?: string) => (v ? v.split(",").filter(Boolean) : []);
  const aree = [...testo.matchAll(AREA_APRE)].map((m) => ({
    id: m[1],
    inizio: m.index,
    fine: chiusure.get(m[1]) ?? testo.length,
    stati: lista(m[2]),
    entita: lista(m[3]),
  }));
  return { citazioni, aree };
}

/**
 * I riferimenti di una nota alle entità, con dove cominciano: le citazioni e le entità delle
 * aree, comprese quelle citate dentro l'area (RB-107).
 */
function riferimenti(testo: string): { entita: string; inizio: number }[] {
  const { citazioni, aree } = leggiSegni(testo);
  const fuori = citazioni.map((c) => ({ entita: c.entita, inizio: c.inizio }));
  for (const a of aree) {
    const entita = [...a.entita];
    for (const c of citazioni)
      if (c.inizio >= a.inizio && c.fine <= a.fine && !entita.includes(c.entita))
        entita.push(c.entita);
    for (const e of entita) fuori.push({ entita: e, inizio: a.inizio });
  }
  return fuori;
}

/** Dove porta un'entità unita: si seguono i rimandi, al massimo 20 passi (contro i cicli). */
export function segui(entita: Map<string, Entita>, id: string): string {
  let attuale = id;
  const visti = new Set<string>();
  for (let e = entita.get(attuale); e?.unitaIn && !visti.has(attuale) && visti.size <= 20;) {
    visti.add(attuale);
    attuale = e.unitaIn;
    e = entita.get(attuale);
  }
  return attuale;
}

const vive = (note: NotaBrainet[]) => note.filter((n) => n.brainet && !n.eliminata_il);

/** Le note in Brainet fuori dal Cestino, dalla più recente (RB-131). */
export function journal<T extends NotaBrainet>(note: T[]): T[] {
  return (vive(note) as T[]).sort(
    (a, b) =>
      (b.creata_scelta ?? b.creata).localeCompare(a.creata_scelta ?? a.creata) ||
      b.creata.localeCompare(a.creata),
  );
}

/** Per ogni entità che resta: quante volte è nominata e il giorno dell'ultima nota. */
function conteggi(note: NotaBrainet[], entita: Map<string, Entita>) {
  const fuori = new Map<string, { nominata: number; ultimaVolta: string | null }>();
  for (const n of vive(note)) {
    const giorno = giornoDellaNota(n);
    for (const r of riferimenti(n.contenuto)) {
      const id = segui(entita, r.entita);
      const v = fuori.get(id) ?? { nominata: 0, ultimaVolta: null };
      v.nominata++;
      if (giorno && (!v.ultimaVolta || v.ultimaVolta < giorno)) v.ultimaVolta = giorno;
      fuori.set(id, v);
    }
  }
  return fuori;
}

/** Le entità che restano, dalla nominata più di recente (CA-18.11). */
export function elencoEntita(note: NotaBrainet[], entita: Map<string, Entita>): VoceEntita[] {
  const conti = conteggi(note, entita);
  return [...entita.values()]
    .filter((e) => !e.unitaIn)
    .map((e) => ({ entita: e, ...(conti.get(e.id) ?? { nominata: 0, ultimaVolta: null }) }))
    .sort(
      (a, b) =>
        (b.ultimaVolta ?? "").localeCompare(a.ultimaVolta ?? "") ||
        a.entita.nome.localeCompare(b.entita.nome),
    );
}

/** Un titolo, una voce di elenco o una citazione: una riga che sta a sé. */
function rigaASe(riga: string): boolean {
  const t = riga.trimStart();
  return /^(#|- |\* |\+ |>|\d+[.)] )/.test(t);
}

/** Il paragrafo che contiene `inizio`: le righe vicine fino a una vuota o a una che sta a sé. */
export function paragrafo(testo: string, inizio: number): { da: number; testo: string } {
  const righe = testo.split("\n");
  const inizi: number[] = [];
  let da = 0;
  for (const r of righe) {
    inizi.push(da);
    da += r.length + 1;
  }
  let i = 0;
  for (let k = 0; k < inizi.length; k++) if (inizi[k] <= inizio) i = k;
  const daSola = (r: string) => !r.trim() || rigaASe(r);
  if (daSola(righe[i])) return { da: inizi[i], testo: righe[i] };
  let su = i;
  while (su > 0 && !daSola(righe[su - 1])) su--;
  let giu = i;
  while (giu + 1 < righe.length && !daSola(righe[giu + 1])) giu++;
  return { da: inizi[su], testo: righe.slice(su, giu + 1).join("\n") };
}

/** La pagina dell'entità (FL-26): i paragrafi che la nominano, per giorno dal più recente. */
export function paginaEntita(
  id: string,
  note: NotaBrainet[],
  entita: Map<string, Entita>,
  titoloDi: (n: NotaBrainet) => string,
): PaginaEntita | null {
  const vera = segui(entita, id);
  const e = entita.get(vera);
  if (!e) return null;
  const conto = conteggi(note, entita).get(vera) ?? { nominata: 0, ultimaVolta: null };
  const perGiorno = new Map<string, { creata: string; p: Passaggio }[]>();
  for (const n of vive(note)) {
    const inizi = riferimenti(n.contenuto)
      .filter((r) => segui(entita, r.entita) === vera)
      .map((r) => r.inizio)
      .sort((a, b) => a - b);
    if (!inizi.length) continue;
    const giorno = giornoDellaNota(n);
    if (!giorno) continue;
    const visti = new Set<number>();
    for (const inizio of inizi) {
      const p = paragrafo(n.contenuto, inizio);
      if (visti.has(p.da)) continue;
      visti.add(p.da);
      const lista = perGiorno.get(giorno) ?? [];
      lista.push({
        creata: n.creata,
        p: {
          nota: n.id,
          titolo: titoloDi(n),
          ora: n.creata_scelta ? "" : oraLocale(n.creata),
          testo: p.testo,
          inizio: p.da,
        },
      });
      perGiorno.set(giorno, lista);
    }
  }
  const giorni = [...perGiorno.keys()]
    .sort()
    .reverse()
    .map((giorno) => ({
      giorno,
      passaggi: perGiorno
        .get(giorno)!
        .sort((a, b) => b.creata.localeCompare(a.creata) || a.p.inizio - b.p.inizio)
        .map((x) => x.p),
    }));
  return { entita: e, ...conto, giorni };
}

/** I giorni del mese «AAAA-MM» in cui è nata almeno una nota in Brainet (RB-113, RB-127). */
export function giorniDelCalendario(mese: string, note: NotaBrainet[]): Set<string> {
  return new Set(
    vive(note)
      .map(giornoDellaNota)
      .filter((g): g is string => !!g && g.startsWith(`${mese}-`)),
  );
}

const TIPI_IN_ORDINE: (TipoEntita | null)[] = ["persona", "argomento", "evento", "oggetto", null];
/** Suggerimenti di @ per tipo (CMP-09 Suggerimenti). */
const SUGGERIMENTI_PER_TIPO = 5;

const normalizza = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * Le entità che restano il cui nome contiene `testo`, al massimo cinque per tipo nell'ordine di
 * @, quelle senza tipo per ultime (RB-104).
 */
export function suggerisci(testo: string, entita: Map<string, Entita>): Entita[] {
  const cerca = normalizza(testo.trim());
  const vive = [...entita.values()].filter((e) => !e.unitaIn && normalizza(e.nome).includes(cerca));
  return TIPI_IN_ORDINE.flatMap((tipo) =>
    vive
      .filter((e) => (e.tipo ?? null) === tipo)
      .sort((a, b) => normalizza(a.nome).localeCompare(normalizza(b.nome)))
      .slice(0, SUGGERIMENTI_PER_TIPO),
  );
}

/** L'entità viva con lo stesso nome, senza maiuscole e accenti (RB-105). */
export function conNome(nome: string, entita: Map<string, Entita>): Entita | undefined {
  const chiave = normalizza(nome.trim());
  return [...entita.values()].find((e) => !e.unitaIn && normalizza(e.nome) === chiave);
}

/** Quante citazioni e aree passerebbero da un'entità a un'altra unendole (RB-108). */
export function riferimentiDi(
  id: string,
  note: NotaBrainet[],
  entita: Map<string, Entita>,
): { citazioni: number; aree: number } {
  let citazioni = 0;
  let aree = 0;
  for (const n of vive(note)) {
    const { citazioni: c, aree: a } = leggiSegni(n.contenuto);
    citazioni += c.filter((x) => segui(entita, x.entita) === id).length;
    for (const area of a) {
      const legate = [...area.entita];
      for (const x of c)
        if (x.inizio >= area.inizio && x.fine <= area.fine && !legate.includes(x.entita))
          legate.push(x.entita);
      aree += legate.filter((e) => segui(entita, e) === id).length;
    }
  }
  return { citazioni, aree };
}
