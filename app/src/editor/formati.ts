// Formati di riga (titoli ed elenchi) e riconoscimento dei formati già applicati, per la
// pillola (CMP-10, stato Attivo), il menu di inserimento con "/" e il tasto destro (CMP-09).

import { syntaxTree } from "@codemirror/language";
import { EditorSelection, type EditorState, type StateCommand } from "@codemirror/state";

export type FormatoTesto = "grassetto" | "corsivo" | "sottolineato" | "barrato";
export type FormatoRiga = "titolo" | "sottotitolo" | "puntato" | "numerato" | "checklist";

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

/**
 * Mette il formato su ogni riga selezionata, sostituendo quello che c'era; se tutte le righe
 * lo hanno già, lo toglie. Gli elenchi numerati si numerano 1, 2, 3…
 */
export function impostaRiga(formato: FormatoRiga): StateCommand {
  return ({ state, dispatch }) => {
    const righe = new Set<number>();
    for (const r of state.selection.ranges) {
      for (let n = state.doc.lineAt(r.from).number; n <= state.doc.lineAt(r.to).number; n++)
        righe.add(n);
    }
    const numeri = [...righe].sort((a, b) => a - b);
    const togli = numeri.every((n) => formatoRiga(state, state.doc.line(n).from) === formato);
    const changes = numeri.map((n, i) => {
      const riga = state.doc.line(n);
      const esistente = PREFISSO_ESISTENTE.exec(riga.text)?.[0] ?? "";
      const nuovo = togli ? "" : formato === "numerato" ? `${i + 1}. ` : PREFISSO[formato];
      return { from: riga.from, to: riga.from + esistente.length, insert: nuovo };
    });
    dispatch(state.update({ changes, scrollIntoView: true, userEvent: "input.format" }));
    return true;
  };
}

const NODO_FORMATO: Record<string, FormatoTesto> = {
  StrongEmphasis: "grassetto",
  Emphasis: "corsivo",
  Strikethrough: "barrato",
};

/** Formati di testo che coprono tutta la selezione principale. */
export function formatiAttivi(state: EditorState): Set<FormatoTesto> {
  const { from, to } = state.selection.main;
  const attivi = new Set<FormatoTesto>();
  const albero = syntaxTree(state);
  for (let nodo = albero.resolveInner(from, 1); nodo.parent; nodo = nodo.parent) {
    const formato = NODO_FORMATO[nodo.name];
    if (formato && nodo.from <= from && nodo.to >= to) attivi.add(formato);
  }
  // <u>…</u> non è un nodo unico: si cerca il tag aperto prima della selezione sulla stessa riga.
  const riga = state.doc.lineAt(from);
  const prima = state.sliceDoc(riga.from, from).toLowerCase();
  const dopo = state.sliceDoc(to, riga.to).toLowerCase();
  if (prima.lastIndexOf("<u>") > prima.lastIndexOf("</u>") && dopo.includes("</u>"))
    attivi.add("sottolineato");
  return attivi;
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
