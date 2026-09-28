// CMP-20 Testo della nota: editor CodeMirror 6 con anteprima dal vivo (DEC-27).
// Il contenuto non esegue mai codice (RB-08): CodeMirror mostra il testo, niente HTML
// viene interpretato; <u> diventa solo una decorazione. Il testo incollato entra come
// testo semplice (RB-07): CodeMirror legge solo la versione text/plain degli appunti.

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { useEffect, useRef, type ReactElement } from "react";
import { anteprimaDalVivo } from "./anteprima";
import { tastiFormattazione } from "./comandi";
import "./Editor.css";

interface Proprieta {
  contenuto: string;
  onModifica: (contenuto: string) => void;
  /** Porta il cursore nel testo appena si apre (nota nuova, FL-09). */
  focus?: boolean;
}

export function Editor({ contenuto, onModifica, focus = false }: Proprieta): ReactElement {
  const contenitore = useRef<HTMLDivElement>(null);
  const suModifica = useRef(onModifica);
  useEffect(() => {
    suModifica.current = onModifica;
  }, [onModifica]);

  // L'editor nasce una volta per nota: il componente si ricrea quando cambia nota (key).
  useEffect(() => {
    const view = new EditorView({
      parent: contenitore.current!,
      state: EditorState.create({
        doc: contenuto,
        extensions: [
          history(),
          keymap.of([...tastiFormattazione, ...defaultKeymap, ...historyKeymap]),
          markdown({ base: markdownLanguage }),
          anteprimaDalVivo,
          EditorView.lineWrapping,
          placeholder("Scrivi qui, oppure premi / per inserire titoli ed elenchi"),
          EditorView.contentAttributes.of({ "aria-label": "Testo della nota", spellcheck: "true" }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) suModifica.current(u.state.doc.toString());
          }),
        ],
      }),
    });
    if (focus) view.focus();
    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={contenitore} className="editor nota-corpo" />;
}
