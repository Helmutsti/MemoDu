// Formati della bollicina (CMP-10, DEC-131): cosa mostra dove sta il cursore (CA-02.4) e i comandi
// del cassetto (CA-02.21 … CA-02.23). I formati di carattere si leggono dall'albero del Markdown
// che la libreria costruisce già; per cambiarli si legge il tratto toccato come lettere visibili,
// ognuna con i suoi formati, si cambia l'insieme e si riscrivono i simboli. Così una coppia di
// simboli non resta mai a metà e i pezzi uguali vicini si uniscono. Il sottolineato si scrive
// `<u>…</u>` (DEC-28). Senza selezione un formato vale per la parola sotto il cursore; tra due
// parole o in fondo alla riga resta in attesa per il testo che si scrive dopo (CA-02.22).
// Le funzioni lavorano sullo stato, così si provano senza il DOM.

import { ensureSyntaxTree, syntaxTree } from "@codemirror/language";
import {
  ChangeSet,
  EditorSelection,
  type EditorState,
  type Line,
  type StateCommand,
  StateEffect,
  StateField,
  type TransactionSpec,
} from "@codemirror/state";

export type FormatoTesto = "grassetto" | "corsivo" | "sottolineato" | "barrato";
export type FormatoRiga = "titolo" | "sottotitolo" | "puntato" | "numerato" | "checklist";

/** Quello che mostra la bollicina (CA-02.4): la riga e i formati di carattere. */
export interface FormatoDove {
  /** "testo" sul testo normale, "misto" se le righe toccate hanno formati diversi. */
  riga: FormatoRiga | "testo" | "misto";
  caratteri: Set<FormatoTesto>;
}

const PREFISSO: Record<FormatoRiga, string> = {
  titolo: "# ",
  sottotitolo: "## ",
  puntato: "- ",
  numerato: "1. ",
  checklist: "- [ ] ",
};

// Un solo formato di riga alla volta: titolo, sottotitolo o una voce di elenco.
const PREFISSO_ESISTENTE = /^(#{1,6} |[-*+] \[[ xX]\] |[-*+] |\d+[.)] )/;

/** Formato di riga della riga che contiene `pos`, se c'è. */
export function formatoRiga(state: EditorState, pos: number): FormatoRiga | null {
  const testo = state.doc.lineAt(pos).text;
  if (/^# /.test(testo)) return "titolo";
  if (/^#{2,6} /.test(testo)) return "sottotitolo";
  if (/^[-*+] \[[ xX]\] /.test(testo)) return "checklist";
  if (/^[-*+] /.test(testo)) return "puntato";
  if (/^\d+[.)] /.test(testo)) return "numerato";
  return null;
}

/** Numeri delle righe toccate dalla selezione principale. */
function righeToccate(state: EditorState): number[] {
  const { from, to } = state.selection.main;
  const numeri: number[] = [];
  for (let n = state.doc.lineAt(from).number; n <= state.doc.lineAt(to).number; n++) numeri.push(n);
  return numeri;
}

/**
 * Mette il formato su ogni riga toccata, sostituendo quello che c'era; se tutte le righe lo hanno
 * già, lo toglie. "testo" toglie il segno. Gli elenchi numerati si numerano 1, 2, 3…
 */
export function impostaRiga(formato: FormatoRiga | "testo"): StateCommand {
  return ({ state, dispatch }) => {
    const numeri = righeToccate(state);
    const togli =
      formato === "testo" ||
      numeri.every((n) => formatoRiga(state, state.doc.line(n).from) === formato);
    const changes = numeri.map((n, i) => {
      const riga = state.doc.line(n);
      const esistente = PREFISSO_ESISTENTE.exec(riga.text)?.[0] ?? "";
      const nuovo = togli
        ? ""
        : formato === "numerato"
          ? `${i + 1}. `
          : PREFISSO[formato as FormatoRiga];
      return { from: riga.from, to: riga.from + esistente.length, insert: nuovo };
    });
    dispatch(state.update({ changes, scrollIntoView: true, userEvent: "input.format" }));
    return true;
  };
}

/** Scelta dal menu "/": toglie la "/" e mette il formato sulla riga (FL-02, CMP-09). */
export function inserisciDaBarra(formato: FormatoRiga): StateCommand {
  return ({ state, dispatch }) => {
    const riga = state.doc.lineAt(state.selection.main.head);
    const prefisso = PREFISSO[formato];
    dispatch(
      state.update({
        changes: { from: riga.from, to: riga.to, insert: prefisso },
        selection: EditorSelection.cursor(riga.from + prefisso.length),
        userEvent: "input.format",
      }),
    );
    return true;
  };
}

// ---------------------------------------------------------------------------------------------
// Pezzi formattati

interface Tratto {
  da: number;
  a: number;
}

/** Un pezzo formattato: il formato e i simboli di apertura e di chiusura. */
export interface Pezzo {
  formato: FormatoTesto;
  apre: Tratto;
  chiude: Tratto;
}

const NODO_FORMATO: Record<string, FormatoTesto> = {
  StrongEmphasis: "grassetto",
  Emphasis: "corsivo",
  Strikethrough: "barrato",
};
const MARCHE = new Set(["EmphasisMark", "StrikethroughMark"]);

/** I pezzi formattati che toccano le righe tra `da` e `a`, compreso `<u>…</u>`. */
export function pezziFormattati(state: EditorState, da: number, a: number): Pezzo[] {
  const inizio = state.doc.lineAt(da).from;
  const fine = state.doc.lineAt(a).to;
  const albero = ensureSyntaxTree(state, fine, 200) ?? syntaxTree(state);
  const trovati: Pezzo[] = [];
  const aperti: Tratto[] = [];
  albero.iterate({
    from: inizio,
    to: fine,
    enter: (nodo) => {
      const formato = NODO_FORMATO[nodo.name];
      if (formato) {
        const primo = nodo.node.firstChild;
        const ultimo = nodo.node.lastChild;
        if (
          primo &&
          ultimo &&
          primo !== ultimo &&
          MARCHE.has(primo.name) &&
          MARCHE.has(ultimo.name)
        )
          trovati.push({
            formato,
            apre: { da: primo.from, a: primo.to },
            chiude: { da: ultimo.from, a: ultimo.to },
          });
      } else if (nodo.name === "HTMLTag") {
        const tag = state.doc.sliceString(nodo.from, nodo.to).toLowerCase();
        if (tag === "<u>") aperti.push({ da: nodo.from, a: nodo.to });
        if (tag === "</u>" && aperti.length)
          trovati.push({
            formato: "sottolineato",
            apre: aperti.pop()!,
            chiude: { da: nodo.from, a: nodo.to },
          });
      }
    },
  });
  return trovati;
}

// ---------------------------------------------------------------------------------------------
// Lettere visibili con i loro formati

interface Lettera {
  /** Posizione nel documento. */
  pos: number;
  testo: string;
  formati: Set<FormatoTesto>;
}

/** Inizio del testo della riga, dopo il rientro e il segno di titolo o di elenco. */
function inizioTesto(line: Line): number {
  const rientro = /^[ \t]*/.exec(line.text)![0].length;
  const segno = PREFISSO_ESISTENTE.exec(line.text.slice(rientro))?.[0].length ?? 0;
  return line.from + rientro + segno;
}

/** Le lettere visibili della riga tra `da` e `a` (fuori dai simboli dei pezzi). */
function lettere(line: Line, pezzi: Pezzo[], da: number, a: number): Lettera[] {
  const risultato: Lettera[] = [];
  const inizio = Math.max(da, inizioTesto(line));
  const fine = Math.min(a, line.to);
  for (let p = inizio; p < fine; p++) {
    if (pezzi.some((z) => (p >= z.apre.da && p < z.apre.a) || (p >= z.chiude.da && p < z.chiude.a)))
      continue;
    const formati = new Set(
      pezzi.filter((z) => p >= z.apre.a && p < z.chiude.da).map((z) => z.formato),
    );
    risultato.push({ pos: p, testo: line.text[p - line.from], formati });
  }
  return risultato;
}

const SPAZIO = /\s/;
const LETTERA_DI_PAROLA = /[\p{L}\p{N}_'’]/u;

const SIMBOLI: Record<FormatoTesto, [string, string]> = {
  grassetto: ["**", "**"],
  corsivo: ["*", "*"],
  barrato: ["~~", "~~"],
  sottolineato: ["<u>", "</u>"],
};
/** A parità di lunghezza, l'ordine dei simboli dal più esterno al più interno. */
const ORDINE: FormatoTesto[] = ["sottolineato", "barrato", "grassetto", "corsivo"];
const IN_BOLLICINA: FormatoTesto[] = ["grassetto", "corsivo", "barrato", "sottolineato"];

/**
 * Riscrive una riga di lettere con i simboli. Un formato non comincia e non finisce su uno spazio,
 * perché il Markdown non lo riconoscerebbe. Restituisce il testo e, per ogni lettera, dove sta.
 */
function scrivi(lettereRiga: Lettera[]): { testo: string; dove: number[] } {
  const insiemi = lettereRiga.map((l) => new Set(l.formati));
  // Niente formato sugli spazi ai bordi di un tratto.
  for (const f of ORDINE) {
    let i = 0;
    while (i < insiemi.length) {
      if (!insiemi[i].has(f)) {
        i++;
        continue;
      }
      let j = i;
      while (j < insiemi.length && insiemi[j].has(f)) j++;
      for (let k = i; k < j && SPAZIO.test(lettereRiga[k].testo); k++) insiemi[k].delete(f);
      for (let k = j - 1; k >= i && SPAZIO.test(lettereRiga[k].testo); k--) insiemi[k].delete(f);
      i = j;
    }
  }
  const fineDi = (f: FormatoTesto, i: number) => {
    let j = i;
    while (j < insiemi.length && insiemi[j].has(f)) j++;
    return j;
  };
  let testo = "";
  const dove: number[] = [];
  const pila: FormatoTesto[] = [];
  for (let i = 0; i <= insiemi.length; i++) {
    const voluti = i < insiemi.length ? insiemi[i] : new Set<FormatoTesto>();
    // Si chiude dall'interno finché nella pila non resta nessun formato che finisce qui.
    const riaprire: FormatoTesto[] = [];
    while (pila.some((f) => !voluti.has(f))) {
      const f = pila.pop()!;
      testo += SIMBOLI[f][1];
      if (voluti.has(f)) riaprire.push(f);
    }
    if (i === insiemi.length) break;
    // Si apre prima il formato che dura di più, così si riapre il meno possibile.
    const nuovi = [...voluti]
      .filter((f) => !pila.includes(f))
      .sort((x, y) => fineDi(y, i) - fineDi(x, i) || ORDINE.indexOf(x) - ORDINE.indexOf(y));
    for (const f of nuovi) {
      testo += SIMBOLI[f][0];
      pila.push(f);
    }
    dove.push(testo.length);
    testo += lettereRiga[i].testo;
  }
  return { testo, dove };
}

/** Il tratto da riscrivere: `da`…`a` allargato a tutti i pezzi che lo toccano. */
function trattoDaRiscrivere(state: EditorState, da: number, a: number) {
  let inizio = da;
  let fine = a;
  let pezzi = pezziFormattati(state, inizio, fine);
  for (;;) {
    let allargato = false;
    for (const z of pezzi) {
      if (z.apre.da <= fine && z.chiude.a >= inizio) {
        if (z.apre.da < inizio || z.chiude.a > fine) allargato = true;
        inizio = Math.min(inizio, z.apre.da);
        fine = Math.max(fine, z.chiude.a);
      }
    }
    if (!allargato) break;
    pezzi = pezziFormattati(state, inizio, fine);
  }
  return { inizio, fine, pezzi };
}

/**
 * Cambia i formati delle lettere tra `da` e `a` con `cambia` e riscrive i simboli del tratto.
 * Restituisce le modifiche e dove finisce ogni posizione di lettera del tratto, per rimettere il
 * cursore o la selezione sulle stesse lettere.
 */
function riscrivi(
  state: EditorState,
  da: number,
  a: number,
  cambia: (formati: Set<FormatoTesto>) => Set<FormatoTesto>,
): { changes: ChangeSet; prima: (pos: number) => number; dopo: (pos: number) => number } {
  const { inizio, fine, pezzi } = trattoDaRiscrivere(state, da, a);
  const modifiche: { from: number; to: number; insert: string }[] = [];
  const posti = new Map<number, { prima: number; dopo: number }>();
  for (let n = state.doc.lineAt(inizio).number; n <= state.doc.lineAt(fine).number; n++) {
    const line = state.doc.line(n);
    const rigaDa = Math.max(inizio, inizioTesto(line));
    const rigaA = Math.min(fine, line.to);
    if (rigaA <= rigaDa) continue;
    const tutte = lettere(line, pezzi, rigaDa, rigaA).map((l) =>
      l.pos >= da && l.pos < a ? { ...l, formati: cambia(new Set(l.formati)) } : l,
    );
    const { testo, dove } = scrivi(tutte);
    modifiche.push({ from: rigaDa, to: rigaA, insert: testo });
    tutte.forEach((l, i) => posti.set(l.pos, { prima: dove[i], dopo: dove[i] + l.testo.length }));
  }
  const changes = state.changes(modifiche);
  // Posizione nel testo nuovo, davanti alla lettera `pos` o subito dopo di lei.
  const verso = (pos: number, lato: "prima" | "dopo") => {
    const q = posti.get(pos);
    if (!q) return changes.mapPos(pos, lato === "prima" ? 1 : -1);
    const riga = modifiche.find((m) => pos >= m.from && pos < m.to)!;
    return changes.mapPos(riga.from, -1) + q[lato];
  };
  return {
    changes,
    prima: (pos) => verso(pos, "prima"),
    dopo: (pos) => verso(pos, "dopo"),
  };
}

// ---------------------------------------------------------------------------------------------
// Il formato in attesa per il testo che si scrive dopo (CA-02.22)

/** I formati accesi (true) o spenti (false) per il testo che si scrive in `pos`. */
export interface Attesa {
  pos: number;
  formati: Map<FormatoTesto, boolean>;
}

const impostaAttesa = StateEffect.define<Attesa | null>();

/** Si svuota appena il cursore si sposta o il testo cambia per altre vie. */
export const formatoInAttesa = StateField.define<Attesa | null>({
  create: () => null,
  update(valore, tr) {
    for (const e of tr.effects) if (e.is(impostaAttesa)) return e.value;
    return tr.docChanged || tr.selection ? null : valore;
  },
});

/** I formati del testo scritto in `pos` senza attesa: quelli della lettera prima, se la segue. */
function formatiAlCursore(state: EditorState, pos: number): Set<FormatoTesto> {
  const line = state.doc.lineAt(pos);
  const pezzi = pezziFormattati(state, line.from, line.to);
  // Il testo scritto in fondo a un pezzo ne prende il formato, quello scritto all'inizio no
  // (doveScrivere in scrittura.ts): sono i formati della lettera visibile prima del cursore.
  const prima = lettere(line, pezzi, line.from, pos);
  return new Set(prima.length ? prima[prima.length - 1].formati : []);
}

/** I formati per il testo scritto in `pos`, compresi quelli in attesa. */
function formatiPerScrivere(state: EditorState, pos: number): Set<FormatoTesto> {
  const formati = formatiAlCursore(state, pos);
  const attesa = state.field(formatoInAttesa, false);
  if (attesa && attesa.pos === pos)
    for (const [f, acceso] of attesa.formati) {
      if (acceso) formati.add(f);
      else formati.delete(f);
    }
  return formati;
}

/**
 * Il testo scritto con un formato in attesa (CA-02.22): entra già dentro i suoi simboli.
 * `dove` è il punto in cui va il testo (doveScrivere di scrittura.ts). Null se non c'è attesa.
 */
export function scriviConAttesa(
  state: EditorState,
  pos: number,
  dove: number,
  testo: string,
): TransactionSpec | null {
  const attesa = state.field(formatoInAttesa, false);
  if (!attesa || attesa.pos !== pos || !testo || testo.includes("\n")) return null;
  const voluti = formatiPerScrivere(state, pos);
  const inserito = state.update({ changes: { from: dove, insert: testo } });
  const s1 = inserito.state;
  const { changes, dopo } = riscrivi(s1, dove, dove + testo.length, () => new Set(voluti));
  return {
    changes: inserito.changes.compose(changes),
    selection: EditorSelection.cursor(dopo(dove + testo.length - 1)),
    scrollIntoView: true,
    userEvent: "input.type",
  };
}

// ---------------------------------------------------------------------------------------------
// Cosa mostra la bollicina (CA-02.4)

/** La parola sotto il cursore, solo se il cursore è dentro, tra due lettere di parola. */
function parolaSotto(state: EditorState, pos: number): Tratto | null {
  const line = state.doc.lineAt(pos);
  const tutte = lettere(line, pezziFormattati(state, line.from, line.to), line.from, line.to);
  const dopo = tutte.findIndex((l) => l.pos >= pos);
  if (dopo <= 0) return null;
  const parola = (l: Lettera | undefined) => !!l && LETTERA_DI_PAROLA.test(l.testo);
  if (!parola(tutte[dopo - 1]) || !parola(tutte[dopo])) return null;
  let i = dopo - 1;
  while (i > 0 && parola(tutte[i - 1])) i--;
  let j = dopo;
  while (j < tutte.length - 1 && parola(tutte[j + 1])) j++;
  return { da: tutte[i].pos, a: tutte[j].pos + 1 };
}

/** Lettere non vuote tra `da` e `a`, su tutte le righe. */
function lettereTra(state: EditorState, da: number, a: number): Lettera[] {
  const pezzi = pezziFormattati(state, da, a);
  const tutte: Lettera[] = [];
  for (let n = state.doc.lineAt(da).number; n <= state.doc.lineAt(a).number; n++)
    tutte.push(...lettere(state.doc.line(n), pezzi, da, a));
  return tutte.filter((l) => !SPAZIO.test(l.testo));
}

/** Il formato da mostrare nella bollicina per la selezione principale (CA-02.4). */
export function formatoDove(state: EditorState): FormatoDove {
  const righe = new Set(
    righeToccate(state).map((n) => formatoRiga(state, state.doc.line(n).from) ?? "testo"),
  );
  const riga = righe.size === 1 ? [...righe][0] : "misto";
  const { from, to, empty } = state.selection.main;
  let presenti: (f: FormatoTesto) => boolean;
  if (empty) {
    const formati = formatiPerScrivere(state, from);
    presenti = (f) => formati.has(f);
  } else {
    const scelte = lettereTra(state, from, to);
    presenti = (f) => scelte.length > 0 && scelte.every((l) => l.formati.has(f));
  }
  // Nella bollicina l'ordine è sempre B, I, S, U.
  return { riga, caratteri: new Set(IN_BOLLICINA.filter(presenti)) };
}

/** Formati di testo che coprono tutta la selezione principale (vecchia pillola). */
export function formatiAttivi(state: EditorState): Set<FormatoTesto> {
  return formatoDove(state).caratteri;
}

// ---------------------------------------------------------------------------------------------
// I comandi del cassetto (CA-02.21 … CA-02.23)

/** Applica `cambia` alla selezione, o alla parola sotto il cursore; null se non c'è né l'una né l'altra. */
function applicaAlTesto(
  state: EditorState,
  cambia: (formati: Set<FormatoTesto>) => Set<FormatoTesto>,
): TransactionSpec | null {
  const r = state.selection.main;
  const tratto = r.empty ? parolaSotto(state, r.head) : { da: r.from, a: r.to };
  if (!tratto) return null;
  const { changes, prima, dopo } = riscrivi(state, tratto.da, tratto.a, cambia);
  const scelte = lettereTra(state, tratto.da, tratto.a);
  let selection: EditorSelection | ReturnType<typeof EditorSelection.cursor>;
  if (r.empty) {
    // Il cursore resta dopo la stessa lettera.
    const davanti = lettere(
      state.doc.lineAt(r.head),
      pezziFormattati(state, r.head, r.head),
      0,
      r.head,
    );
    const p = davanti.length ? dopo(davanti[davanti.length - 1].pos) : changes.mapPos(r.head);
    selection = EditorSelection.cursor(p);
  } else if (scelte.length) {
    const da = prima(scelte[0].pos);
    const a = dopo(scelte[scelte.length - 1].pos);
    selection = r.head < r.anchor ? EditorSelection.range(a, da) : EditorSelection.range(da, a);
  } else {
    selection = EditorSelection.range(changes.mapPos(r.anchor), changes.mapPos(r.head));
  }
  return { changes, selection, scrollIntoView: true, userEvent: "input.format" };
}

/**
 * Grassetto, corsivo, barrato o sottolineato (CA-02.22): sulla selezione o sulla parola si mette,
 * o si toglie se c'è già su tutte le lettere; tra due parole o in fondo alla riga si accende o si
 * spegne per il testo che si scrive dopo.
 */
export function alternaCarattere(formato: FormatoTesto): StateCommand {
  return ({ state, dispatch }) => {
    const r = state.selection.main;
    const tratto = r.empty ? parolaSotto(state, r.head) : { da: r.from, a: r.to };
    if (!tratto) {
      const attuale = formatiPerScrivere(state, r.head);
      const naturali = formatiAlCursore(state, r.head);
      const attesa = state.field(formatoInAttesa, false);
      const formati = new Map(attesa && attesa.pos === r.head ? attesa.formati : []);
      const acceso = !attuale.has(formato);
      if (acceso === naturali.has(formato)) formati.delete(formato);
      else formati.set(formato, acceso);
      dispatch(
        state.update({
          effects: impostaAttesa.of(formati.size ? { pos: r.head, formati } : null),
        }),
      );
      return true;
    }
    const scelte = lettereTra(state, tratto.da, tratto.a);
    const togli = scelte.length > 0 && scelte.every((l) => l.formati.has(formato));
    const spec = applicaAlTesto(state, (f) => {
      if (togli) f.delete(formato);
      else f.add(formato);
      return f;
    });
    if (spec) dispatch(state.update(spec));
    return true;
  };
}

/**
 * «Rimuovi formattazione» (CA-02.23): toglie i formati di carattere dalla selezione o dalla parola
 * sotto il cursore, e il segno dalle righe toccate.
 */
export const rimuoviFormattazione: StateCommand = ({ state, dispatch }) => {
  const spec = applicaAlTesto(state, () => new Set());
  const s = spec ? state.update(spec).state : state;
  const segni = righeToccate(s)
    .map((n) => s.doc.line(n))
    .map((riga) => ({
      from: riga.from,
      to: riga.from + (PREFISSO_ESISTENTE.exec(riga.text)?.[0].length ?? 0),
    }))
    .filter((x) => x.to > x.from);
  const changes = s.changes(segni);
  dispatch(
    state.update({
      changes: spec ? (spec.changes as ChangeSet).compose(changes) : changes,
      selection: s.selection.map(changes),
      effects: impostaAttesa.of(null),
      scrollIntoView: true,
      userEvent: "input.format",
    }),
  );
  return true;
};
