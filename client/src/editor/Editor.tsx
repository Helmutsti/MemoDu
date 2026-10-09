// CMP-20 Testo della nota: CodeMirror 6 con i comandi standard dell'editor, in due viste
// (DEC-130). Vista Testo: quello che si scrive resta com'è (#, **, - sono caratteri normali,
// DEC-64). Vista Markdown: un compartimento aggiunge la lingua, la resa con i simboli nascosti
// (anteprima.ts) e la scrittura come in Word (scrittura.ts); il testo salvato è lo stesso.
// Tab rientra e Maiusc + Tab torna indietro, Esc e poi Tab escono dall'editor; annulla, ripeti,
// selezione, taglia, copia e incolla (solo testo, RB-07) come in ogni editor; il tasto destro
// apre il menu del sistema. Niente pillola, menu «/» o scorciatoie di formattazione
// (EditorMarkdown.tsx resta non collegato).

import { defaultKeymap, history, historyKeymap, indentLess, insertTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { indentUnit } from "@codemirror/language";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { useEffect, useRef, type ReactElement } from "react";
import { anteprimaDalVivo } from "./anteprima";
import { scritturaComeWord } from "./scrittura";
import "./Editor.css";

/** Le estensioni della vista Markdown (DEC-130), senza i tasti pronti della lingua. */
const vistaMarkdown: Extension = [
  markdown({ base: markdownLanguage, addKeymap: false }),
  anteprimaDalVivo,
  scritturaComeWord,
];

interface Proprieta {
  contenuto: string;
  onModifica: (contenuto: string) => void;
  /** Porta il cursore nel testo appena si apre (nota nuova, FL-09). */
  focus?: boolean;
  /** Invito nell'area vuota. */
  invito?: string;
  /** Si legge ma non si scrive (file locale in sola lettura, CA-17.15). */
  solaLettura?: boolean;
  /** Nome per i lettori di schermo. */
  etichetta?: string;
  /** Vista Markdown: testo formattato con i simboli nascosti (DEC-130). */
  markdown?: boolean;
}

export function Editor({
  contenuto,
  onModifica,
  focus = false,
  invito = "Scrivi qui…",
  solaLettura = false,
  etichetta = "Testo della nota",
  markdown: inMarkdown = false,
}: Proprieta): ReactElement {
  const contenitore = useRef<HTMLDivElement>(null);
  const vista = useRef<EditorView | null>(null);
  const compartimento = useRef(new Compartment());
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
          compartimento.current.of(inMarkdown ? vistaMarkdown : []),
          indentUnit.of("\t"),
          keymap.of([
            { key: "Tab", run: insertTab, shift: indentLess },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.lineWrapping,
          placeholder(invito),
          EditorView.contentAttributes.of({ "aria-label": etichetta, spellcheck: "true" }),
          EditorState.readOnly.of(solaLettura),
          EditorView.editable.of(!solaLettura),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) suModifica.current(u.state.doc.toString());
          }),
        ],
      }),
    });
    vista.current = view;
    if (focus) view.focus();
    return () => {
      vista.current = null;
      view.destroy();
    };
    // L'editor nasce una volta per nota: il contenuto iniziale non cambia mentre si scrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cambiare vista non ricrea l'editor: cursore, annulla e testo restano (RB-91).
  useEffect(() => {
    vista.current?.dispatch({
      effects: compartimento.current.reconfigure(inMarkdown ? vistaMarkdown : []),
    });
  }, [inMarkdown]);

  return <div ref={contenitore} className="editor nota-corpo" />;
}

/**
 * Clic nel vuoto attorno al testo (sotto l'ultima riga, a destra o a sinistra): il cursore va
 * nel punto di testo più vicino, come in ogni programma di scrittura. `area` contiene l'editor.
 * Restituisce false se il clic non va gestito (tasto diverso dal sinistro, controlli, testo).
 */
export function cursoreDalClic(area: HTMLElement, e: React.MouseEvent): boolean {
  const bersaglio = e.target as Element;
  if (e.button !== 0 || bersaglio.closest("input, textarea, button, a, [role], .cm-editor")) {
    return false;
  }
  const radice = area.querySelector<HTMLElement>(".cm-editor");
  const view = radice ? EditorView.findFromDOM(radice) : null;
  if (!view) return false;
  const r = view.contentDOM.getBoundingClientRect();
  const x = Math.min(Math.max(e.clientX, r.left + 1), r.right - 1);
  const y = Math.min(Math.max(e.clientY, r.top + 1), r.bottom - 1);
  const pos = view.posAtCoords({ x, y }) ?? view.state.doc.length;
  e.preventDefault();
  view.focus();
  view.dispatch({ selection: { anchor: pos }, scrollIntoView: true });
  return true;
}
