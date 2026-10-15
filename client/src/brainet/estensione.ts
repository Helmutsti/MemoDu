// Il compartimento Brainet dell'editor (RF-18, architettura «Brainet», «Editor»), sopra la vista
// Markdown: i segni si nascondono come i simboli del Markdown (anteprima.ts). Il collegamento
// diventa la pillola CMP-38 ed è un intervallo atomico, che Backspace toglie tutto (RB-104);
// l'area diventa il fondo CMP-40. Menu di @, menu dell'area e Linguetta sono dell'interfaccia
// (EditorBrainet.tsx): qui si dice dove sono e si scrivono i segni.

import {
  EditorState,
  type Extension,
  RangeSetBuilder,
  StateEffect,
  StateField,
  type Transaction,
} from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { leggiSegni, segniFinti, segnoApre, segnoChiude, segnoCita, testoSemplice } from "./segni";

/** Quello che serve per disegnare una pillola. */
export interface VistaEntita {
  nome: string;
  /** JPEG in base64, se c'è. */
  foto: string | null;
}

/** Nomi e foto delle entità citate, che l'interfaccia legge dal nucleo. */
export const aggiornaEntita = StateEffect.define<Record<string, VistaEntita>>();
const entitaNote = StateField.define<Record<string, VistaEntita>>({
  create: () => ({}),
  update: (valore, tr) => {
    for (const e of tr.effects) if (e.is(aggiornaEntita)) valore = { ...valore, ...e.value };
    return valore;
  },
});

/** L'area con il mouse sopra (Stato = Mouse sopra di CMP-40). */
export const segnaAreaSopra = StateEffect.define<string | null>();
const areaSopra = StateField.define<string | null>({
  create: () => null,
  update: (valore, tr) => {
    for (const e of tr.effects) if (e.is(segnaAreaSopra)) valore = e.value;
    return valore;
  },
});

class Pillola extends WidgetType {
  constructor(
    readonly nome: string,
    readonly foto: string | null,
  ) {
    super();
  }
  eq(altra: Pillola): boolean {
    return altra.nome === this.nome && altra.foto === this.foto;
  }
  toDOM(): HTMLElement {
    const el = document.createElement("span");
    el.className = `bn-collegamento interfaccia-dettaglio${this.foto ? " bn-collegamento-foto" : ""}`;
    if (this.foto) {
      const img = document.createElement("img");
      img.src = `data:image/jpeg;base64,${this.foto}`;
      img.alt = "";
      el.append(img);
    }
    el.append(this.nome);
    return el;
  }
}

class Minore extends WidgetType {
  eq(): boolean {
    return true;
  }
  toDOM(): HTMLElement {
    const el = document.createElement("span");
    el.textContent = "<";
    return el;
  }
}

/** Le decorazioni dei segni: pura sullo stato, così si prova senza il DOM. */
export function decorazioniBrainet(state: EditorState): {
  tutte: DecorationSet;
  atomiche: DecorationSet;
} {
  const testo = state.doc.toString();
  const { citazioni, aree } = leggiSegni(testo);
  const nomi = state.field(entitaNote, false) ?? {};
  const sopra = state.field(areaSopra, false) ?? null;
  const tutti: { da: number; a: number; dec: Decoration; atomica: boolean }[] = [];
  for (const c of citazioni) {
    const e = nomi[c.entita];
    tutti.push({
      da: c.da,
      a: c.a,
      dec: Decoration.replace({ widget: new Pillola(e?.nome ?? c.nome, e?.foto ?? null) }),
      atomica: true,
    });
  }
  for (const area of aree) {
    const fine = area.chiude?.da ?? testo.length;
    tutti.push({ da: area.apre.da, a: area.apre.a, dec: Decoration.replace({}), atomica: true });
    if (fine > area.apre.a) {
      const classe = `bn-area${sopra === area.id ? " bn-area-sopra" : ""}`;
      tutti.push({
        da: area.apre.a,
        a: fine,
        dec: Decoration.mark({ class: classe, attributes: { "data-area": area.id } }),
        atomica: false,
      });
    }
    if (area.chiude)
      tutti.push({
        da: area.chiude.da,
        a: area.chiude.a,
        dec: Decoration.replace({}),
        atomica: true,
      });
  }
  for (const m of testo.matchAll(/&lt;(?=\/?(?:cita|area)\b)/g)) {
    tutti.push({
      da: m.index,
      a: m.index + 4,
      dec: Decoration.replace({ widget: new Minore() }),
      atomica: true,
    });
  }
  tutti.sort((x, y) => x.da - y.da || x.dec.startSide - y.dec.startSide || x.a - y.a);
  const builder = new RangeSetBuilder<Decoration>();
  const atomiche = new RangeSetBuilder<Decoration>();
  for (const d of tutti) {
    builder.add(d.da, d.a, d.dec);
    if (d.atomica) atomiche.add(d.da, d.a, d.dec);
  }
  return { tutte: builder.finish(), atomiche: atomiche.finish() };
}

const pluginBrainet = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    atomiche: DecorationSet;
    constructor(view: EditorView) {
      ({ tutte: this.decorations, atomiche: this.atomiche } = decorazioniBrainet(view.state));
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.transactions.some((t) => t.effects.length)) {
        ({ tutte: this.decorations, atomiche: this.atomiche } = decorazioniBrainet(u.state));
      }
    }
  },
  { decorations: (p) => p.decorations },
);

/**
 * Un `<cita` o un `<area` scritto o incollato dall'utente non diventa mai un segno: il suo `<`
 * diventa `&lt;` (architettura «Brainet»). I segni veri li scrivono solo i comandi qui sotto.
 */
function trovaFinti(tr: Transaction): { from: number; to: number; insert: string }[] {
  if (
    !tr.docChanged ||
    !(tr.isUserEvent("input") || tr.isUserEvent("paste") || tr.isUserEvent("drop"))
  )
    return [];
  const testo = tr.newDoc.toString();
  const posizioni = new Set<number>();
  tr.changes.iterChangedRanges((_fa, _ta, daB, aB) => {
    const inizio = Math.max(0, daB - 6);
    const fine = Math.min(testo.length, aB + 6);
    for (const p of segniFinti(testo.slice(inizio, fine))) {
      const pos = inizio + p;
      // Solo i `<` che il cambio ha toccato: i segni veri accanto restano.
      if (pos + 5 >= daB && pos <= aB) posizioni.add(pos);
    }
  });
  return [...posizioni].sort((x, y) => x - y).map((p) => ({ from: p, to: p + 1, insert: "&lt;" }));
}

const statoFiltro = EditorState.transactionFilter.of((tr) => {
  const finti = trovaFinti(tr);
  if (!finti.length) return tr;
  return [tr, { changes: finti, sequential: true }];
});

/** Copiando si porta via il testo che si legge, senza segni. */
const copiaSenzaSegni = EditorView.clipboardOutputFilter.of((testo) => testoSemplice(testo));

/** Chi ascolta l'editor: dove si scrive @, la selezione, l'area sotto il mouse. */
export interface Ascolto {
  /** @ seguita dalle lettere scritte fin qui, oppure null. */
  onChiocciola: (
    q: { da: number; testo: string; x: number; y: number; sopra: number } | null,
  ) => void;
  /** Frase selezionata per un'area nuova, oppure null. */
  onSelezione: (s: { da: number; a: number; x: number; y: number; sopra: number } | null) => void;
  /** L'area sotto il mouse, con il rettangolo dove inizia, oppure null. */
  onAreaSopra: (a: { id: string; x: number; y: number } | null) => void;
}

const CHIOCCIOLA = /(?:^|\s)@([^\s@<>]{0,40})$/;
/** Tra il testo e il menu che si apre sotto (spazio-elemento, come in CMP-09). */
const DISTANZA = 4;

/** Dove sta un punto del testo; senza impaginazione (prove) l'angolo dell'editor. */
function coordinate(view: EditorView, pos: number): { left: number; top: number; bottom: number } {
  return view.coordsAtPos(pos) ?? view.contentDOM.getBoundingClientRect();
}

/** Le estensioni di Brainet, con chi le ascolta. */
export function estensioneBrainet(ascolto: Ascolto): Extension {
  let ultimaArea: string | null = null;
  return [
    entitaNote,
    areaSopra,
    pluginBrainet,
    EditorView.atomicRanges.of((view) => view.plugin(pluginBrainet)?.atomiche ?? Decoration.none),
    statoFiltro,
    copiaSenzaSegni,
    EditorView.updateListener.of((u) => {
      if (!(u.docChanged || u.selectionSet || u.focusChanged)) return;
      const sel = u.state.selection.main;
      const a = ascolto;
      if (sel.empty && u.view.hasFocus) {
        const riga = u.state.doc.lineAt(sel.head);
        const prima = riga.text.slice(0, sel.head - riga.from);
        const m = CHIOCCIOLA.exec(prima);
        if (m) {
          const da = sel.head - m[1].length - 1;
          const r = coordinate(u.view, da);
          a.onChiocciola({ da, testo: m[1], x: r.left, y: r.bottom + DISTANZA, sopra: r.top });
        } else a.onChiocciola(null);
      } else a.onChiocciola(null);
      if (!sel.empty && testoSemplice(u.state.sliceDoc(sel.from, sel.to)).trim()) {
        const r = coordinate(u.view, sel.from);
        const f = coordinate(u.view, sel.to);
        a.onSelezione({ da: sel.from, a: sel.to, x: r.left, y: f.bottom + DISTANZA, sopra: r.top });
      } else a.onSelezione(null);
    }),
    EditorView.domEventHandlers({
      mousemove: (e, view) => {
        const el = (e.target as Element).closest?.("[data-area]");
        const id = el?.getAttribute("data-area") ?? null;
        if (id === ultimaArea) return false;
        ultimaArea = id;
        view.dispatch({ effects: segnaAreaSopra.of(id) });
        if (!id) {
          ascolto.onAreaSopra(null);
          return false;
        }
        // La linguetta sta sopra l'inizio dell'area.
        const primo = view.contentDOM.querySelector(`[data-area="${CSS.escape(id)}"]`);
        const r = primo?.getBoundingClientRect();
        ascolto.onAreaSopra(r ? { id, x: r.left, y: r.top } : null);
        return false;
      },
      mouseleave: (_e, view) => {
        if (ultimaArea === null) return false;
        ultimaArea = null;
        view.dispatch({ effects: segnaAreaSopra.of(null) });
        ascolto.onAreaSopra(null);
        return false;
      },
    }),
  ];
}

// ——— Comandi: scrivono i segni ———

/** Al posto di «@lettere» la pillola dell'entità, e uno spazio per continuare (RB-104). */
export function inserisciCitazione(
  view: EditorView,
  da: number,
  entita: { id: string; nome: string },
): void {
  const a = view.state.selection.main.head;
  const segno = segnoCita(entita);
  view.dispatch({
    changes: { from: da, to: a, insert: `${segno} ` },
    selection: { anchor: da + segno.length + 1 },
    effects: aggiornaEntita.of({ [entita.id]: { nome: entita.nome, foto: null } }),
    userEvent: "brainet.cita",
  });
  view.focus();
}

/** Un'area nuova sulla frase selezionata, con gli stati e le entità scelti (RB-107). */
export function creaArea(
  view: EditorView,
  da: number,
  a: number,
  stati: string[],
  entita: string[],
): string {
  const id = crypto.randomUUID();
  view.dispatch({
    changes: [
      { from: da, insert: segnoApre(id, stati, entita) },
      { from: a, insert: segnoChiude(id) },
    ],
    userEvent: "brainet.area",
  });
  return id;
}

/**
 * Riscrive i legami dell'area; senza più legami (né scritti né citati dentro) l'area sparisce e
 * resta la frase (RB-109). Restituisce false se l'area non c'è più.
 */
export function aggiornaArea(
  view: EditorView,
  id: string,
  stati: string[],
  entita: string[],
): boolean {
  const testo = view.state.doc.toString();
  const { citazioni, aree } = leggiSegni(testo);
  const area = aree.find((x) => x.id === id);
  if (!area) return false;
  const fine = area.chiude?.da ?? testo.length;
  const citate = citazioni.some((c) => c.da >= area.apre.a && c.a <= fine);
  if (!stati.length && !entita.length && !citate) {
    view.dispatch({
      changes: [
        { from: area.apre.da, to: area.apre.a },
        ...(area.chiude ? [{ from: area.chiude.da, to: area.chiude.a }] : []),
      ],
      userEvent: "brainet.area",
    });
    return false;
  }
  view.dispatch({
    changes: { from: area.apre.da, to: area.apre.a, insert: segnoApre(id, stati, entita) },
    userEvent: "brainet.area",
  });
  return true;
}
