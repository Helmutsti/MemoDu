// Scrittura come in Word nella vista Markdown (DEC-130, CA-02.15 … CA-02.19). I simboli sono
// nascosti (anteprima.ts), ma nel testo ci sono: queste regole fanno sì che non si tocchino mai
// per sbaglio. Il cursore si ferma solo dopo aver superato un carattere visibile; il testo scritto
// in fondo a un pezzo formattato ne prende la formattazione, quello scritto subito prima no;
// Backspace e Canc cancellano un carattere visibile, mai un simbolo da solo; un pezzo svuotato
// perde i suoi simboli; una cancellazione non spezza mai una coppia di simboli. Invio negli elenchi
// è il comando pronto della libreria, che su una voce vuota chiude l'elenco.
// Le funzioni lavorano sullo stato, così si provano senza il DOM.

import { insertNewlineAndIndent } from "@codemirror/commands";
import { insertNewlineContinueMarkupCommand } from "@codemirror/lang-markdown";
import { ensureSyntaxTree, syntaxTree } from "@codemirror/language";
import {
  EditorSelection,
  EditorState,
  type Extension,
  findClusterBreak,
  type Line,
  Prec,
  type StateCommand,
  Transaction,
  type TransactionSpec,
} from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { calcolaSegni } from "./anteprima";

interface Tratto {
  da: number;
  a: number;
}

/** Un pezzo formattato: i simboli di apertura e di chiusura (`**`, `*`, `~~`). */
interface Formato {
  apre: Tratto;
  chiude: Tratto;
}

/** Simbolo di inizio riga: titolo (`# `), punto (`- `) o casella (`- [ ] `). */
interface Prefisso extends Tratto {
  titolo: boolean;
}

const FORMATI = new Set(["StrongEmphasis", "Emphasis", "Strikethrough"]);
const MARCHE = new Set(["EmphasisMark", "StrikethroughMark"]);

/** Simboli nascosti dentro la riga e simbolo di inizio riga, se c'è. */
function riga(
  state: EditorState,
  pos: number,
): { line: Line; nascosti: Tratto[]; prefisso: Prefisso | null } {
  const line = state.doc.lineAt(pos);
  const nascosti: Tratto[] = [];
  let prefisso: Prefisso | null = null;
  for (const s of calcolaSegni(state, line.from, line.to, false)) {
    if (s.tipo !== "nascosto" && s.tipo !== "punto" && s.tipo !== "casella") continue;
    const prima = state.doc.sliceString(line.from, s.da);
    const titolo = s.tipo === "nascosto" && /^#{1,6} ?$/.test(state.doc.sliceString(s.da, s.a));
    if (!prefisso && /^\s*$/.test(prima) && (titolo || s.tipo !== "nascosto")) {
      prefisso = { da: s.da, a: s.a, titolo };
    } else if (s.tipo === "nascosto") {
      nascosti.push({ da: s.da, a: s.a });
    }
  }
  return { line, nascosti, prefisso };
}

/** I pezzi formattati che toccano le righe tra `da` e `a`. */
function formati(state: EditorState, da: number, a: number): Formato[] {
  const inizio = state.doc.lineAt(da).from;
  const fine = state.doc.lineAt(a).to;
  const albero = ensureSyntaxTree(state, fine, 200) ?? syntaxTree(state);
  const trovati: Formato[] = [];
  albero.iterate({
    from: inizio,
    to: fine,
    enter: (nodo) => {
      if (!FORMATI.has(nodo.name)) return;
      const primo = nodo.node.firstChild;
      const ultimo = nodo.node.lastChild;
      if (
        primo &&
        ultimo &&
        primo !== ultimo &&
        MARCHE.has(primo.name) &&
        MARCHE.has(ultimo.name)
      ) {
        trovati.push({
          apre: { da: primo.from, a: primo.to },
          chiude: { da: ultimo.from, a: ultimo.to },
        });
      }
    },
  });
  return trovati;
}

/** Dopo un salto a capo il cursore non resta davanti al simbolo di inizio riga. */
function dopoIlPrefisso(state: EditorState, pos: number): number {
  const { prefisso } = riga(state, pos);
  return prefisso && pos >= prefisso.da && pos < prefisso.a ? prefisso.a : pos;
}

/**
 * Un passo del cursore come in Word (CA-02.15): salta i simboli nascosti e si ferma solo dopo
 * aver superato un carattere visibile o un a capo. Il simbolo di inizio riga non è un posto dove
 * fermarsi.
 */
export function passo(state: EditorState, pos: number, avanti: boolean): number {
  let p = pos;
  for (;;) {
    const { line, nascosti, prefisso } = riga(state, p);
    if (avanti) {
      if (prefisso && p >= prefisso.da && p < prefisso.a) {
        p = prefisso.a;
        continue;
      }
      const h = nascosti.find((t) => p >= t.da && p < t.a);
      if (h) {
        p = h.a;
        continue;
      }
      if (p >= state.doc.length) return pos;
      if (p === line.to) return dopoIlPrefisso(state, p + 1);
      return line.from + findClusterBreak(line.text, p - line.from, true);
    }
    if (prefisso && p > prefisso.da && p <= prefisso.a) {
      p = prefisso.da;
      continue;
    }
    const h = nascosti.find((t) => p > t.da && p <= t.a);
    if (h) {
      p = h.da;
      continue;
    }
    if (p <= line.from) return line.from === 0 ? pos : p - 1;
    return line.from + findClusterBreak(line.text, p - line.from, false);
  }
}

/** Dove va il testo scritto in `pos` (CA-02.16). */
export function doveScrivere(state: EditorState, pos: number): number {
  const { prefisso } = riga(state, pos);
  if (prefisso && pos >= prefisso.da && pos < prefisso.a) return prefisso.a;
  const tutti = formati(state, pos, pos);
  let p = pos;
  for (let giri = 0; giri < 6; giri++) {
    // In fondo a un pezzo formattato si scrive dentro; subito dopo l'apertura, fuori.
    const f = tutti.find((t) => t.chiude.a === p) ?? tutti.find((t) => t.apre.a === p);
    if (!f) break;
    p = f.chiude.a === p ? f.chiude.da : f.apre.da;
  }
  return p;
}

/** Il cursore non sta mai dentro un simbolo nascosto né davanti al simbolo di inizio riga. */
function cursoreAPosto(state: EditorState, pos: number): number {
  const { nascosti, prefisso } = riga(state, pos);
  if (prefisso && pos >= prefisso.da && pos < prefisso.a) return prefisso.a;
  const h = nascosti.find((t) => pos > t.da && pos < t.a);
  return h ? h.a : pos;
}

/** Elenchi continuati dalla libreria; su una voce vuota l'elenco finisce, come in Word. */
const continuaElenco = insertNewlineContinueMarkupCommand({ nonTightLists: false });

/** Invio come in Word (CA-02.17): continua l'elenco; dopo un titolo la riga nuova è testo. */
export const invio: StateCommand = (t) => continuaElenco(t) || insertNewlineAndIndent(t);

const muovi =
  (avanti: boolean, estendi: boolean): StateCommand =>
  ({ state, dispatch }) => {
    const selezione = EditorSelection.create(
      state.selection.ranges.map((r) => {
        if (!estendi && !r.empty) return EditorSelection.cursor(avanti ? r.to : r.from);
        const p = passo(state, r.head, avanti);
        return estendi ? EditorSelection.range(r.anchor, p) : EditorSelection.cursor(p);
      }),
      state.selection.mainIndex,
    );
    dispatch(state.update({ selection: selezione, scrollIntoView: true, userEvent: "select" }));
    return true;
  };

/** Backspace come in Word, con il cursore senza selezione (CA-02.16, CA-02.18). */
export const cancellaIndietro: StateCommand = ({ state, dispatch }) => {
  const sel = state.selection;
  if (sel.ranges.length > 1 || !sel.main.empty) return false;
  const p = sel.main.head;
  const { line, nascosti, prefisso } = riga(state, p);
  let da: number;
  let a = p;
  if (prefisso && p === prefisso.a) {
    // All'inizio di un titolo la riga si unisce a quella sopra come testo; in un elenco sparisce
    // il segno e il testo resta.
    da = prefisso.titolo && line.number > 1 ? line.from - 1 : prefisso.da;
  } else if (/^\s*\d+[.)] $/.test(state.sliceDoc(line.from, p))) {
    da = line.from;
  } else {
    let q = p;
    for (
      let h = nascosti.find((t) => q > t.da && q <= t.a);
      h;
      h = nascosti.find((t) => q > t.da && q <= t.a)
    ) {
      q = h.da;
    }
    if (q === 0) return true;
    a = q;
    da = q === line.from ? q - 1 : line.from + findClusterBreak(line.text, q - line.from, false);
  }
  dispatch(
    state.update({
      changes: { from: da, to: a },
      scrollIntoView: true,
      userEvent: "delete.backward",
    }),
  );
  return true;
};

/** Canc come in Word: il carattere visibile dopo il cursore; a fine riga unisce la riga dopo come testo. */
export const cancellaAvanti: StateCommand = ({ state, dispatch }) => {
  const sel = state.selection;
  if (sel.ranges.length > 1 || !sel.main.empty) return false;
  const { line, nascosti } = riga(state, sel.main.head);
  let q = sel.main.head;
  for (
    let h = nascosti.find((t) => q >= t.da && q < t.a);
    h;
    h = nascosti.find((t) => q >= t.da && q < t.a)
  ) {
    q = h.a;
  }
  if (q >= state.doc.length) return true;
  let a: number;
  if (q === line.to) {
    const dopo = riga(state, q + 1);
    a =
      dopo.prefisso && /^\s*$/.test(state.sliceDoc(dopo.line.from, dopo.prefisso.da))
        ? dopo.prefisso.a
        : q + 1;
  } else {
    a = line.from + findClusterBreak(line.text, q - line.from, true);
  }
  dispatch(
    state.update({
      changes: { from: q, to: a },
      scrollIntoView: true,
      userEvent: "delete.forward",
    }),
  );
  return true;
};

/** Il tratto meno i pezzi protetti, in ordine. */
function sottrai(tratto: Tratto, protetti: Tratto[]): Tratto[] {
  let pezzi = [tratto];
  for (const p of protetti) {
    pezzi = pezzi.flatMap((t) =>
      p.a <= t.da || p.da >= t.a
        ? [t]
        : [
            { da: t.da, a: Math.max(t.da, p.da) },
            { da: Math.min(t.a, p.a), a: t.a },
          ].filter((x) => x.a > x.da),
    );
  }
  return pezzi;
}

/**
 * Una cancellazione scritta dall'utente (CA-02.16): se svuota un pezzo formattato porta via anche
 * i suoi simboli; altrimenti non tocca i simboli, così una coppia non resta mai a metà.
 */
export function proteggiSimboli(tr: Transaction): TransactionSpec | null {
  if (!tr.docChanged || !(tr.isUserEvent("delete") || tr.isUserEvent("input"))) return null;
  const st = tr.startState;
  const cambi: { da: number; a: number; testo: string }[] = [];
  tr.changes.iterChanges((da, a, _d, _a, inserito) =>
    cambi.push({ da, a, testo: inserito.toString() }),
  );
  if (cambi.length !== 1 || cambi[0].da === cambi[0].a) return null;
  const { testo } = cambi[0];
  let { da, a } = cambi[0];
  const tutti = formati(st, da, a);
  for (let giri = 0; giri < 4; giri++) {
    let allargato = false;
    for (const f of tutti) {
      const svuotato = !testo && da <= f.apre.a && a >= f.chiude.da;
      if (svuotato && (f.apre.da < da || f.chiude.a > a)) {
        da = Math.min(da, f.apre.da);
        a = Math.max(a, f.chiude.a);
        allargato = true;
      }
    }
    if (!allargato) break;
  }
  const protetti = tutti
    .filter((f) => !(da <= f.apre.da && a >= f.chiude.a))
    .flatMap((f) => [f.apre, f.chiude])
    .filter((m) => m.da < a && m.a > da)
    .sort((x, y) => x.da - y.da);
  const pezzi = sottrai({ da, a }, protetti);
  if (pezzi.length === 1 && pezzi[0].da === cambi[0].da && pezzi[0].a === cambi[0].a) return null;
  const inizio = pezzi.length ? pezzi[0].da : cambi[0].da;
  const changes = pezzi.map((t, i) => ({ from: t.da, to: t.a, insert: i === 0 ? testo : "" }));
  if (!pezzi.length && testo) changes.push({ from: inizio, to: inizio, insert: testo });
  const insieme = st.changes(changes);
  return {
    changes: insieme,
    selection: EditorSelection.cursor(insieme.mapPos(inizio, -1) + testo.length),
    scrollIntoView: true,
    userEvent: tr.annotation(Transaction.userEvent),
  };
}

/** Il testo scritto va dove lo metterebbe Word (CA-02.16); un a capo resta dov'è. */
export function spostaScrittura(tr: Transaction): TransactionSpec | null {
  if (!tr.docChanged || !tr.isUserEvent("input")) return null;
  const cambi: { da: number; a: number; testo: string }[] = [];
  tr.changes.iterChanges((da, a, _d, _a, inserito) =>
    cambi.push({ da, a, testo: inserito.toString() }),
  );
  if (cambi.length !== 1) return null;
  const { da, a, testo } = cambi[0];
  if (da !== a || !testo || testo.includes("\n")) return null;
  const dove = doveScrivere(tr.startState, da);
  if (dove === da) return null;
  return {
    changes: { from: dove, insert: testo },
    selection: EditorSelection.cursor(dove + testo.length),
    scrollIntoView: true,
    userEvent: tr.annotation(Transaction.userEvent),
  };
}

const filtri = EditorState.transactionFilter.of((tr) => {
  const spec = spostaScrittura(tr) ?? proteggiSimboli(tr);
  if (spec) return spec;
  if (tr.selection && !tr.docChanged) {
    const st = tr.state;
    const sistemata = EditorSelection.create(
      st.selection.ranges.map((r) =>
        r.empty ? EditorSelection.cursor(cursoreAPosto(st, r.head)) : r,
      ),
      st.selection.mainIndex,
    );
    if (!sistemata.eq(st.selection)) return [tr, { selection: sistemata, sequential: true }];
  }
  return tr;
});

/** Si copia il Markdown con i simboli: anche quelli attorno a un pezzo selezionato tutto (CA-02.19). */
const copiaConISimboli = EditorView.clipboardOutputFilter.of((testo, state) => {
  const sel = state.selection;
  if (sel.ranges.length !== 1 || sel.main.empty) return testo;
  let { from, to } = sel.main;
  for (const f of formati(state, from, to)) {
    if (f.apre.a === from || (f.apre.da < from && from <= f.apre.a))
      from = Math.min(from, f.apre.da);
    if (f.chiude.da === to || (f.chiude.da <= to && to < f.chiude.a)) to = Math.max(to, f.chiude.a);
  }
  return state.sliceDoc(from, to);
});

/** Tutto il comportamento della scrittura in vista Markdown. */
export const scritturaComeWord: Extension = [
  Prec.high(
    keymap.of([
      { key: "Enter", run: invio },
      { key: "Backspace", run: cancellaIndietro },
      { key: "Delete", run: cancellaAvanti },
      { key: "ArrowLeft", run: muovi(false, false), shift: muovi(false, true) },
      { key: "ArrowRight", run: muovi(true, false), shift: muovi(true, true) },
    ]),
  ),
  filtri,
  copiaConISimboli,
];
