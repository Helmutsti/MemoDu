// Formattazione da tastiera (RF-02, CA-02.3, CMP-09): Ctrl/⌘ + B, I, U e Ctrl/⌘ + Maiusc + X.
// Ogni comando mette o toglie i simboli markdown attorno alla selezione; il sottolineato
// si scrive come <u>…</u> (DEC-28). Ctrl/⌘ + Invio spunta la voce della checklist (CMP-20).
// Tab e Maiusc + Tab rientrano (ID-26): una voce di elenco va un livello più dentro o più
// fuori, altrove si scrive o si toglie una tabulazione. Per uscire dall'editor da tastiera:
// Esc e poi Tab (CodeMirror).

import { EditorSelection, type EditorState, type Line, type StateCommand } from "@codemirror/state";
import type { KeyBinding } from "@codemirror/view";

function stelleDispari(testo: string, da: number, a: number): boolean {
  let prima = 0;
  while (testo[da - 1 - prima] === "*") prima++;
  let dopo = 0;
  while (testo[a + dopo] === "*") dopo++;
  return prima % 2 === 1 && dopo % 2 === 1;
}

export function alternaFormato(apri: string, chiudi = apri): StateCommand {
  return ({ state, dispatch }) => {
    const modifica = state.changeByRange((r) => {
      const prima = state.sliceDoc(r.from - apri.length, r.from);
      const dopo = state.sliceDoc(r.to, r.to + chiudi.length);
      // Già formattato attorno alla selezione: si tolgono i simboli. Per "*" conta quante
      // stelle ci sono: "**parola**" è grassetto, non corsivo, e con Ctrl + I diventa "***parola***".
      if (
        prima === apri &&
        dopo === chiudi &&
        (apri !== "*" || stelleDispari(state.doc.toString(), r.from, r.to))
      ) {
        return {
          changes: [
            { from: r.from - apri.length, to: r.from },
            { from: r.to, to: r.to + chiudi.length },
          ],
          range: EditorSelection.range(r.from - apri.length, r.to - apri.length),
        };
      }
      const testo = state.sliceDoc(r.from, r.to);
      // Selezione che include già i simboli: si tolgono.
      if (
        testo.length >= apri.length + chiudi.length &&
        testo.startsWith(apri) &&
        testo.endsWith(chiudi)
      ) {
        const interno = testo.slice(apri.length, testo.length - chiudi.length);
        return {
          changes: { from: r.from, to: r.to, insert: interno },
          range: EditorSelection.range(r.from, r.from + interno.length),
        };
      }
      return {
        changes: [
          { from: r.from, insert: apri },
          { from: r.to, insert: chiudi },
        ],
        range: EditorSelection.range(r.from + apri.length, r.to + apri.length),
      };
    });
    dispatch(state.update(modifica, { scrollIntoView: true, userEvent: "input.format" }));
    return true;
  };
}

/** Spunta o toglie la spunta alla voce della checklist in cui si trova il cursore. */
export const spuntaVoce: StateCommand = ({ state, dispatch }) => {
  const riga = state.doc.lineAt(state.selection.main.head);
  const trovato = /^\s*[-*+] \[( |x|X)\]/.exec(riga.text);
  if (!trovato) return false;
  const pos = riga.from + trovato[0].length - 2;
  dispatch(
    state.update({
      changes: { from: pos, to: pos + 1, insert: trovato[1] === " " ? "x" : " " },
      userEvent: "input.format",
    }),
  );
  return true;
};

/** Voce di elenco: rientro iniziale e segno con il suo spazio ("- ", "1. ", anche "- [ ] "). */
const ELENCO = /^( *)([-*+] |\d+[.)] )/;

/** Le righe toccate dalla selezione principale. */
function righeSelezionate(state: EditorState): Line[] {
  const { from, to } = state.selection.main;
  const righe: Line[] = [];
  for (let n = state.doc.lineAt(from).number; n <= state.doc.lineAt(to).number; n++) {
    righe.push(state.doc.line(n));
  }
  return righe;
}

/** Tab: le voci di elenco vanno un livello più dentro; altrove si scrive una tabulazione. */
export const rientra: StateCommand = ({ state, dispatch }) => {
  const righe = righeSelezionate(state);
  if (righe.every((r) => ELENCO.test(r.text))) {
    const changes = righe.map((r) => ({
      from: r.from,
      insert: " ".repeat(ELENCO.exec(r.text)![2]!.length),
    }));
    dispatch(state.update({ changes, scrollIntoView: true, userEvent: "input.indent" }));
    return true;
  }
  dispatch(state.update(state.replaceSelection("	"), { scrollIntoView: true, userEvent: "input" }));
  return true;
};

/** Maiusc + Tab: le voci di elenco tornano un livello più fuori; altrove si toglie una
 * tabulazione: quella all'inizio della riga o la più vicina prima del cursore. */
export const rientraIndietro: StateCommand = ({ state, dispatch }) => {
  const righe = righeSelezionate(state);
  if (righe.every((r) => ELENCO.test(r.text))) {
    const changes = righe.flatMap((r) => {
      const [, rientro, segno] = ELENCO.exec(r.text)!;
      const quanti = Math.min(rientro!.length, segno!.length);
      return quanti > 0 ? [{ from: r.from, to: r.from + quanti }] : [];
    });
    if (changes.length) dispatch(state.update({ changes, userEvent: "delete.dedent" }));
    return true;
  }
  // Fuori dagli elenchi: si toglie la tabulazione all'inizio della riga, altrimenti la più
  // vicina prima del cursore sulla stessa riga.
  const { head } = state.selection.main;
  const riga = state.doc.lineAt(head);
  const prima = riga.text.slice(0, head - riga.from);
  const pos = riga.text.startsWith("	") ? 0 : prima.lastIndexOf("	");
  if (pos >= 0) {
    dispatch(
      state.update({
        changes: { from: riga.from + pos, to: riga.from + pos + 1 },
        userEvent: "delete.dedent",
      }),
    );
  }
  return true;
};

export const grassetto = alternaFormato("**");
export const corsivo = alternaFormato("*");
export const sottolineato = alternaFormato("<u>", "</u>");
export const barrato = alternaFormato("~~");

export const tastiFormattazione: KeyBinding[] = [
  { key: "Mod-b", run: grassetto },
  { key: "Mod-i", run: corsivo },
  { key: "Mod-u", run: sottolineato },
  { key: "Mod-Shift-x", run: barrato },
  { key: "Mod-Enter", run: spuntaVoce },
  { key: "Tab", run: rientra, shift: rientraIndietro },
];
