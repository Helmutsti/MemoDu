// Formattazione da tastiera (RF-02, CA-02.3, CMP-09): Ctrl/⌘ + B, I, U e Ctrl/⌘ + Maiusc + X.
// Ogni comando mette o toglie i simboli markdown attorno alla selezione; il sottolineato
// si scrive come <u>…</u> (DEC-28). Ctrl/⌘ + Invio spunta la voce della checklist (CMP-20).

import { EditorSelection, type StateCommand } from "@codemirror/state";
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
];
