// CMP-20 Testo della nota: CodeMirror 6 con i comandi standard dell'editor, in due viste
// (DEC-130). Vista Testo: quello che si scrive resta com'è (#, **, - sono caratteri normali,
// DEC-64). Vista Markdown: un compartimento aggiunge la lingua, la resa con i simboli nascosti
// (anteprima.ts) e la scrittura come in Word (scrittura.ts); il testo salvato è lo stesso.
// Tab rientra e Maiusc + Tab torna indietro, Esc e poi Tab escono dall'editor; annulla, ripeti,
// selezione, taglia, copia e incolla (solo testo, RB-07) come in ogni editor; il tasto destro
// apre il menu del sistema. In vista Markdown l'editor dice alla bollicina (CMP-10, DEC-131) il
// formato dove sta il cursore e applica la voce scelta nel cassetto; niente menu «/» né
// scorciatoie di formattazione, rinviate (EditorMarkdown.tsx resta non collegato).

import { defaultKeymap, history, historyKeymap, indentLess, insertTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { indentUnit } from "@codemirror/language";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactElement } from "react";
import type { VoceFormato } from "../componenti/Bollicina";
import { anteprimaDalVivo } from "./anteprima";
import {
  alternaCarattere,
  formatoDove,
  type FormatoDove,
  impostaRiga,
  rimuoviFormattazione,
} from "./formati";
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
  /** Il formato dove sta il cursore, per la bollicina; null in vista Testo (DEC-131). */
  onFormato?: (formato: FormatoDove | null) => void;
}

/** Quello che la bollicina chiede all'editor. */
export interface ManigliaEditor {
  /** Applica una voce del cassetto e rimette il cursore nel testo (CA-02.21). */
  applica: (voce: VoceFormato) => void;
}

/** Il comando di una voce del cassetto. */
function comandoDi(voce: VoceFormato) {
  if (voce === "rimuovi") return rimuoviFormattazione;
  if (voce === "grassetto" || voce === "corsivo" || voce === "barrato" || voce === "sottolineato")
    return alternaCarattere(voce);
  return impostaRiga(voce);
}

/** Uguali per la bollicina? Evita di avvisarla a ogni tasto se il formato non cambia. */
function stessoFormato(a: FormatoDove | null, b: FormatoDove | null): boolean {
  if (!a || !b) return a === b;
  return a.riga === b.riga && [...a.caratteri].join() === [...b.caratteri].join();
}

export const Editor = forwardRef<ManigliaEditor, Proprieta>(function Editor(
  {
    contenuto,
    onModifica,
    focus = false,
    invito = "Scrivi qui…",
    solaLettura = false,
    etichetta = "Testo della nota",
    markdown: inMarkdown = false,
    onFormato,
  },
  maniglia,
): ReactElement {
  const contenitore = useRef<HTMLDivElement>(null);
  const vista = useRef<EditorView | null>(null);
  const compartimento = useRef(new Compartment());
  const suModifica = useRef(onModifica);
  useEffect(() => {
    suModifica.current = onModifica;
  }, [onModifica]);
  const suFormato = useRef(onFormato);
  useEffect(() => {
    suFormato.current = onFormato;
  }, [onFormato]);
  const markdownAcceso = useRef(inMarkdown);
  const ultimoFormato = useRef<FormatoDove | null>(null);
  // Avvisa la bollicina solo quando il formato cambia.
  const avvisaFormato = (view: EditorView) => {
    const f = markdownAcceso.current ? formatoDove(view.state) : null;
    if (stessoFormato(f, ultimoFormato.current)) return;
    ultimoFormato.current = f;
    suFormato.current?.(f);
  };

  useImperativeHandle(maniglia, () => ({
    applica: (voce) => {
      const view = vista.current;
      if (!view || solaLettura) return;
      comandoDi(voce)(view);
      view.focus();
    },
  }));

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
            if (u.docChanged || u.selectionSet || u.transactions.some((t) => t.effects.length))
              avvisaFormato(u.view);
          }),
        ],
      }),
    });
    vista.current = view;
    avvisaFormato(view);
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
    markdownAcceso.current = inMarkdown;
    const view = vista.current;
    if (!view) return;
    view.dispatch({
      effects: compartimento.current.reconfigure(inMarkdown ? vistaMarkdown : []),
    });
    avvisaFormato(view);
  }, [inMarkdown]);

  return <div ref={contenitore} className="editor nota-corpo" />;
});

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
