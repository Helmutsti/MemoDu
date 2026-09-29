// CMP-20 Testo della nota, per ora in testo puro (DEC-64): CodeMirror 6 con i soli comandi
// standard dell'editor. Quello che si scrive resta com'è (#, **, - sono caratteri normali);
// Tab rientra e Maiusc + Tab torna indietro, Esc e poi Tab escono dall'editor; annulla,
// ripeti, selezione, taglia, copia e incolla (solo testo, RB-07) come in ogni editor; il tasto
// destro apre il menu del sistema. Il markdown dal vivo (DEC-27) è in EditorMarkdown.tsx e
// tornerà più avanti.

import { defaultKeymap, history, historyKeymap, indentLess, insertTab } from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { useEffect, useRef, type ReactElement } from "react";
import "./Editor.css";

interface Proprieta {
  contenuto: string;
  onModifica: (contenuto: string) => void;
  /** Porta il cursore nel testo appena si apre (nota nuova, FL-09). */
  focus?: boolean;
  /** Invito nell'area vuota. */
  invito?: string;
}

export function Editor({
  contenuto,
  onModifica,
  focus = false,
  invito = "Scrivi qui…",
}: Proprieta): ReactElement {
  const contenitore = useRef<HTMLDivElement>(null);
  const suModifica = useRef(onModifica);
  useEffect(() => {
    suModifica.current = onModifica;
  }, [onModifica]);

  useEffect(() => {
    const view = new EditorView({
      parent: contenitore.current!,
      state: EditorState.create({
        doc: contenuto,
        extensions: [
          history(),
          indentUnit.of("\t"),
          keymap.of([
            { key: "Tab", run: insertTab, shift: indentLess },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.lineWrapping,
          placeholder(invito),
          EditorView.contentAttributes.of({ "aria-label": "Testo della nota", spellcheck: "true" }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) suModifica.current(u.state.doc.toString());
          }),
        ],
      }),
    });
    if (focus) view.focus();
    return () => view.destroy();
    // L'editor nasce una volta per nota: il contenuto iniziale non cambia mentre si scrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={contenitore} className="editor nota-corpo" />;
}
