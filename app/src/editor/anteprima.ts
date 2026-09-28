// Anteprima dal vivo del markdown (RF-02, DEC-27, CMP-20): il testo si vede formattato e i
// simboli si vedono, in testo tenue, solo sulle righe dove c'è il cursore o la selezione.
// calcolaSegni() è una funzione pura sullo stato, così si prova senza il DOM; il plugin
// la trasforma in decorazioni di CodeMirror.

import { ensureSyntaxTree, syntaxTree } from "@codemirror/language";
import { type EditorState, RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";

export type Segno =
  /** Stile di tutta la riga (titoli). */
  | { tipo: "riga"; da: number; classe: string }
  /** Stile di un tratto di testo (grassetto, simboli in tenue…). */
  | { tipo: "tratto"; da: number; a: number; classe: string }
  /** Simbolo nascosto fuori dalla riga del cursore. */
  | { tipo: "nascosto"; da: number; a: number }
  /** Segno dell'elenco puntato al posto di "-". */
  | { tipo: "punto"; da: number; a: number }
  /** Casella della checklist al posto di "- [ ]". */
  | { tipo: "casella"; da: number; a: number; spuntata: boolean };

const CLASSE_TITOLO: Record<string, string> = {
  ATXHeading1: "md-titolo",
  ATXHeading2: "md-sottotitolo",
  ATXHeading3: "md-sottotitolo",
  ATXHeading4: "md-sottotitolo",
  ATXHeading5: "md-sottotitolo",
  ATXHeading6: "md-sottotitolo",
};

const CLASSE_FORMATO: Record<string, string> = {
  StrongEmphasis: "md-grassetto",
  Emphasis: "md-corsivo",
  Strikethrough: "md-barrato",
};

const MARCHE = new Set(["EmphasisMark", "StrikethroughMark"]);

/** Righe (numeri, da 1) che contengono il cursore o una selezione. */
function righeAttive(state: EditorState): Set<number> {
  const righe = new Set<number>();
  for (const r of state.selection.ranges) {
    const prima = state.doc.lineAt(r.from).number;
    const ultima = state.doc.lineAt(r.to).number;
    for (let n = prima; n <= ultima; n++) righe.add(n);
  }
  return righe;
}

/**
 * Segni dell'anteprima tra `da` e `a`. `conCursore` è falso quando l'editor non ha il focus:
 * allora non c'è una riga in cui si scrive e tutti i simboli restano nascosti.
 */
export function calcolaSegni(
  state: EditorState,
  da = 0,
  a = state.doc.length,
  conCursore = true,
): Segno[] {
  const segni: Segno[] = [];
  const attive = conCursore ? righeAttive(state) : new Set<number>();
  const suRigaAttiva = (pos: number) => attive.has(state.doc.lineAt(pos).number);
  // Un simbolo si mostra in tenue sulla riga del cursore, altrimenti si nasconde.
  const simbolo = (inizio: number, fine: number) =>
    segni.push(
      suRigaAttiva(inizio)
        ? { tipo: "tratto", da: inizio, a: fine, classe: "md-simbolo" }
        : { tipo: "nascosto", da: inizio, a: fine },
    );
  // Il simbolo di inizio riga si porta via anche lo spazio che lo segue.
  const conSpazio = (fine: number) =>
    state.doc.sliceString(fine, fine + 1) === " " ? fine + 1 : fine;
  const sottolineati: number[] = [];

  const albero = ensureSyntaxTree(state, a, 200) ?? syntaxTree(state);
  albero.iterate({
    from: da,
    to: a,
    enter: (nodo) => {
      const nome = nodo.name;
      if (CLASSE_TITOLO[nome]) {
        segni.push({
          tipo: "riga",
          da: state.doc.lineAt(nodo.from).from,
          classe: CLASSE_TITOLO[nome],
        });
      } else if (nome === "HeaderMark") {
        simbolo(nodo.from, conSpazio(nodo.to));
      } else if (CLASSE_FORMATO[nome]) {
        segni.push({ tipo: "tratto", da: nodo.from, a: nodo.to, classe: CLASSE_FORMATO[nome] });
      } else if (MARCHE.has(nome)) {
        simbolo(nodo.from, nodo.to);
      } else if (nome === "HTMLTag") {
        const tag = state.doc.sliceString(nodo.from, nodo.to).toLowerCase();
        if (tag === "<u>") sottolineati.push(nodo.to);
        if (tag === "</u>" && sottolineati.length) {
          const inizio = sottolineati.pop()!;
          segni.push({ tipo: "tratto", da: inizio, a: nodo.from, classe: "md-sottolineato" });
        }
        if (tag === "<u>" || tag === "</u>") simbolo(nodo.from, nodo.to);
      } else if (nome === "ListMark") {
        const segno = state.doc.sliceString(nodo.from, nodo.to);
        const compito = nodo.node.nextSibling;
        if (compito?.name === "Task") {
          const marcatore = compito.firstChild;
          if (marcatore?.name === "TaskMarker") {
            const fine = conSpazio(marcatore.to);
            if (suRigaAttiva(nodo.from)) {
              segni.push({ tipo: "tratto", da: nodo.from, a: fine, classe: "md-simbolo" });
            } else {
              const spuntata = /x/i.test(state.doc.sliceString(marcatore.from, marcatore.to));
              segni.push({ tipo: "casella", da: nodo.from, a: fine, spuntata });
              if (spuntata)
                segni.push({ tipo: "tratto", da: fine, a: compito.to, classe: "md-spuntata" });
            }
            return;
          }
        }
        if (/^[-*+]$/.test(segno)) {
          if (suRigaAttiva(nodo.from)) {
            segni.push({ tipo: "tratto", da: nodo.from, a: nodo.to, classe: "md-simbolo" });
          } else {
            segni.push({ tipo: "punto", da: nodo.from, a: conSpazio(nodo.to) });
          }
        } else {
          // I numeri degli elenchi restano visibili, in tenue (CMP-20).
          segni.push({ tipo: "tratto", da: nodo.from, a: nodo.to, classe: "md-segno" });
        }
      }
    },
  });
  return segni;
}

class Punto extends WidgetType {
  eq(): boolean {
    return true;
  }
  toDOM(): HTMLElement {
    const el = document.createElement("span");
    el.className = "md-punto";
    el.textContent = "•";
    return el;
  }
}

class Casella extends WidgetType {
  constructor(readonly spuntata: boolean) {
    super();
  }
  eq(altra: Casella): boolean {
    return altra.spuntata === this.spuntata;
  }
  toDOM(): HTMLElement {
    const el = document.createElement("span");
    el.className = `md-casella ${this.spuntata ? "md-casella-spuntata" : ""}`;
    el.setAttribute("role", "checkbox");
    el.setAttribute("aria-checked", String(this.spuntata));
    el.setAttribute("aria-label", this.spuntata ? "Fatto" : "Da fare");
    return el;
  }
  ignoreEvent(): boolean {
    return false;
  }
}

function decorazioni(view: EditorView): DecorationSet {
  const tutti: { da: number; a: number; dec: Decoration }[] = [];
  for (const { from, to } of view.visibleRanges) {
    for (const s of calcolaSegni(view.state, from, to, view.hasFocus)) {
      if (s.tipo === "riga")
        tutti.push({ da: s.da, a: s.da, dec: Decoration.line({ class: s.classe }) });
      else if (s.tipo === "tratto")
        tutti.push({ da: s.da, a: s.a, dec: Decoration.mark({ class: s.classe }) });
      else if (s.tipo === "nascosto") tutti.push({ da: s.da, a: s.a, dec: Decoration.replace({}) });
      else if (s.tipo === "punto")
        tutti.push({ da: s.da, a: s.a, dec: Decoration.replace({ widget: new Punto() }) });
      else
        tutti.push({
          da: s.da,
          a: s.a,
          dec: Decoration.replace({ widget: new Casella(s.spuntata) }),
        });
    }
  }
  // Il RangeSetBuilder vuole le decorazioni in ordine; a parità di inizio, prima quelle di riga.
  tutti.sort((x, y) => x.da - y.da || x.dec.startSide - y.dec.startSide || x.a - y.a);
  const builder = new RangeSetBuilder<Decoration>();
  for (const d of tutti) builder.add(d.da, d.a, d.dec);
  return builder.finish();
}

/** Clic su una casella della checklist: la spunta o la toglie ("[ ]" ↔ "[x]"). */
function clicSuCasella(evento: MouseEvent, view: EditorView): boolean {
  const el = evento.target as HTMLElement;
  if (!el.classList.contains("md-casella")) return false;
  const pos = view.posAtDOM(el);
  const riga = view.state.doc.lineAt(pos);
  const trovato = /\[( |x|X)\]/.exec(riga.text);
  if (!trovato) return false;
  const inizio = riga.from + trovato.index + 1;
  view.dispatch({
    changes: { from: inizio, to: inizio + 1, insert: trovato[1] === " " ? "x" : " " },
  });
  evento.preventDefault();
  return true;
}

export const anteprimaDalVivo = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = decorazioni(view);
    }
    update(u: ViewUpdate) {
      if (
        u.docChanged ||
        u.focusChanged ||
        u.selectionSet ||
        u.viewportChanged ||
        syntaxTree(u.startState) !== syntaxTree(u.state)
      ) {
        this.decorations = decorazioni(u.view);
      }
    }
  },
  {
    decorations: (p) => p.decorations,
    eventHandlers: { mousedown: clicSuCasella },
  },
);
