// CMP-20 Testo della nota: editor CodeMirror 6 con anteprima dal vivo (DEC-27), con gli
// strumenti del frammento Must A (SC-03, CA-02.4 … CA-02.6): pillola di formattazione sopra
// la selezione, pillola di inserimento sul clic nel vuoto, menu con "/" su una riga vuota,
// menu del tasto destro. In nessuno c'è Immagine (RF-03 arriva con il frammento Must).
//
// Il contenuto non esegue mai codice (RB-08): CodeMirror mostra il testo, niente HTML viene
// interpretato; <u> diventa solo una decorazione. Il testo incollato entra come testo
// semplice (RB-07): CodeMirror legge solo la versione text/plain degli appunti.

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorSelection, EditorState, Prec, type StateCommand } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import {
  Bold,
  ClipboardPaste,
  Copy,
  Heading1,
  Heading2,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Scissors,
  Strikethrough,
  Underline,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { Menu, type VoceMenu } from "../componenti/Menu";
import { Pillola, type ManigliaPillola, type Strumento } from "../componenti/Pillola";
import { anteprimaDalVivo } from "./anteprima";
import { barrato, corsivo, grassetto, sottolineato, tastiFormattazione } from "./comandi";
import { formatiAttivi, formatoRiga, impostaRiga, inserisciDaBarra } from "./formati";
import "./Editor.css";

interface Proprieta {
  contenuto: string;
  onModifica: (contenuto: string) => void;
  /** Porta il cursore nel testo appena si apre (nota nuova, FL-09). */
  focus?: boolean;
  /** Invito nell'area vuota. */
  invito?: string;
}

type Comparsa = { tipo: "formattazione" | "inserimento"; x: number; y: number; sotto: boolean };
type Punto = { x: number; y: number };

const ALTEZZA_PILLOLA = 40;
const DISTANZA = 8;
const MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Scorciatoia come si scrive sul sistema: "Ctrl + B" su Windows, "⌘ + B" su macOS (CMP-09). */
export function scorciatoia(tasto: string, maiuscolo = false): string {
  return [MAC ? "⌘" : "Ctrl", ...(maiuscolo ? [MAC ? "⇧" : "Maiusc"] : []), tasto].join(" + ");
}

/** Sopra il punto, oppure sotto se sopra non c'è posto. */
function sopraOSotto(x: number, alto: number, basso: number) {
  const sotto = alto - DISTANZA - ALTEZZA_PILLOLA < DISTANZA;
  return { x, y: sotto ? basso : alto, sotto };
}

export function Editor({
  contenuto,
  onModifica,
  focus = false,
  invito = "Scrivi qui, oppure premi / per inserire titoli ed elenchi",
}: Proprieta): ReactElement {
  const contenitore = useRef<HTMLDivElement>(null);
  const vista = useRef<EditorView | null>(null);
  const pillola = useRef<ManigliaPillola>(null);
  const suModifica = useRef(onModifica);
  const puntatoreGiu = useRef(false);
  const [comparsa, setComparsa] = useState<Comparsa | null>(null);
  const [menuBarra, setMenuBarra] = useState<Punto | null>(null);
  const [menuTesto, setMenuTesto] = useState<Punto | null>(null);
  // Formati della selezione, per lo stato Attivo degli strumenti (CMP-10).
  const [attivi, setAttivi] = useState<{ testo: Set<string>; riga: string | null }>({
    testo: new Set(),
    riga: null,
  });
  const comparsaAttuale = useRef<Comparsa | null>(null);

  useEffect(() => {
    suModifica.current = onModifica;
  }, [onModifica]);
  useEffect(() => {
    comparsaAttuale.current = comparsa;
  }, [comparsa]);

  // Con la pillola aperta, Esc e un clic fuori la chiudono dovunque sia il focus (CA-02.4):
  // anche sul margine del foglio, sulla colonna o sulla fascia in alto.
  const aperta = comparsa !== null;
  useEffect(() => {
    if (!aperta) return;
    const suTasto = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || (e.target as Element).closest?.(".pillola")) return;
      e.preventDefault();
      setComparsa(null);
    };
    const suClic = (e: MouseEvent) => {
      if (!(e.target as Element).closest?.(".pillola")) setComparsa(null);
    };
    window.addEventListener("keydown", suTasto, true);
    window.addEventListener("mousedown", suClic, true);
    return () => {
      window.removeEventListener("keydown", suTasto, true);
      window.removeEventListener("mousedown", suClic, true);
    };
  }, [aperta]);

  // Pillola di formattazione sopra la selezione, centrata sulla prima riga selezionata.
  const comparsaSelezione = (view: EditorView): Comparsa | null => {
    const { from, to } = view.state.selection.main;
    const inizio = view.coordsAtPos(from, 1);
    const fine = view.coordsAtPos(to, -1);
    if (!inizio || !fine) return null;
    const stessaRiga = Math.abs(inizio.top - fine.top) < 2;
    const x = stessaRiga ? (inizio.left + fine.right) / 2 : inizio.left + 120;
    return { tipo: "formattazione", ...sopraOSotto(x, inizio.top, fine.bottom) };
  };

  // Pillola di inserimento sopra il punto del cursore.
  const comparsaInserimento = (view: EditorView, x?: number): Comparsa | null => {
    const c = view.coordsAtPos(view.state.selection.main.head);
    if (!c) return null;
    return { tipo: "inserimento", ...sopraOSotto(x ?? c.left, c.top, c.bottom) };
  };

  useEffect(() => {
    const tasti = Prec.high(
      keymap.of([
        {
          key: "Escape",
          run: () => {
            if (!comparsaAttuale.current) return false;
            setComparsa(null);
            return true;
          },
        },
        {
          key: "Alt-F10",
          run: (view) => {
            const c = view.state.selection.main.empty
              ? comparsaInserimento(view)
              : comparsaSelezione(view);
            setComparsa(c);
            setTimeout(() => pillola.current?.focus());
            return true;
          },
        },
      ]),
    );

    const view = new EditorView({
      parent: contenitore.current!,
      state: EditorState.create({
        doc: contenuto,
        extensions: [
          history(),
          tasti,
          keymap.of([...tastiFormattazione, ...defaultKeymap, ...historyKeymap]),
          markdown({ base: markdownLanguage }),
          anteprimaDalVivo,
          EditorView.lineWrapping,
          placeholder(invito),
          EditorView.contentAttributes.of({ "aria-label": "Testo della nota", spellcheck: "true" }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) suModifica.current(u.state.doc.toString());
            const scritto = u.transactions.some(
              (t) => t.isUserEvent("input.type") || t.isUserEvent("delete"),
            );
            // La pillola sparisce quando si riprende a scrivere; dopo un formato si riposiziona.
            if (scritto) setComparsa(null);
            else if (u.selectionSet && !puntatoreGiu.current) {
              setComparsa((c) =>
                !u.state.selection.main.empty
                  ? comparsaSelezione(u.view)
                  : c?.tipo === "formattazione"
                    ? null
                    : c,
              );
            }
            // "/" su una riga vuota apre il menu di inserimento; scrivendo altro si chiude.
            const riga = u.state.doc.lineAt(u.state.selection.main.head);
            if (scritto && riga.text === "/") {
              const c = u.view.coordsAtPos(riga.from);
              if (c) setMenuBarra({ x: c.left, y: c.bottom + DISTANZA });
            } else if (u.docChanged && riga.text !== "/") {
              setMenuBarra(null);
            }
            if (u.docChanged || u.selectionSet) {
              const head = u.state.selection.main.head;
              setAttivi({ testo: formatiAttivi(u.state), riga: formatoRiga(u.state, head) });
            }
          }),
          EditorView.domEventHandlers({
            mousedown: (e) => {
              if (e.button !== 0) return false;
              puntatoreGiu.current = true;
              setComparsa(null);
              const suRilascio = (su: MouseEvent) => {
                window.removeEventListener("mouseup", suRilascio, true);
                puntatoreGiu.current = false;
                // Attendo che CodeMirror abbia aggiornato la selezione.
                setTimeout(() => {
                  const v = vista.current;
                  if (!v?.hasFocus) return;
                  const { main } = v.state.selection;
                  if (!main.empty) return setComparsa(comparsaSelezione(v));
                  const fineTesto = v.coordsAtPos(v.state.doc.length);
                  const sottoIlTesto = fineTesto !== null && su.clientY > fineTesto.bottom;
                  const rigaVuota = v.state.doc.lineAt(main.head).text.trim() === "";
                  if (rigaVuota || sottoIlTesto) setComparsa(comparsaInserimento(v, su.clientX));
                });
              };
              window.addEventListener("mouseup", suRilascio, true);
              return false;
            },
            contextmenu: (e, v) => {
              e.preventDefault();
              const pos = v.posAtCoords({ x: e.clientX, y: e.clientY });
              const { from, to } = v.state.selection.main;
              if (pos !== null && (pos < from || pos > to)) {
                v.dispatch({ selection: EditorSelection.cursor(pos) });
              }
              setComparsa(null);
              setMenuTesto({ x: e.clientX, y: e.clientY });
              return true;
            },
          }),
        ],
      }),
    });
    vista.current = view;
    if (focus) view.focus();

    // Gli elementi di livello 20 si chiudono quando il contenuto sotto scorre.
    const suScorrimento = (e: Event) => {
      if (!(e.target as Element).closest?.(".pillola")) setComparsa(null);
    };
    window.addEventListener("scroll", suScorrimento, true);

    return () => {
      window.removeEventListener("scroll", suScorrimento, true);
      view.destroy();
      vista.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Le azioni leggono la vista quando vengono eseguite, non durante il disegno.
  const usa = (comando: StateCommand, tornaAlTesto = false) => {
    const view = vista.current;
    if (!view) return;
    comando(view);
    if (tornaAlTesto) {
      setComparsa(null);
      view.focus();
    }
  };
  const tornaAlTesto = () => vista.current?.focus();
  const riga = attivi.riga;

  const strumenti: Strumento[] =
    comparsa?.tipo === "formattazione"
      ? [
          {
            tipo: "strumento",
            nome: `Grassetto · ${scorciatoia("B")}`,
            icona: Bold,
            attivo: attivi.testo.has("grassetto"),
            azione: () => usa(grassetto),
          },
          {
            tipo: "strumento",
            nome: `Corsivo · ${scorciatoia("I")}`,
            icona: Italic,
            attivo: attivi.testo.has("corsivo"),
            azione: () => usa(corsivo),
          },
          {
            tipo: "strumento",
            nome: `Sottolineato · ${scorciatoia("U")}`,
            icona: Underline,
            attivo: attivi.testo.has("sottolineato"),
            azione: () => usa(sottolineato),
          },
          {
            tipo: "strumento",
            nome: `Barrato · ${scorciatoia("X", true)}`,
            icona: Strikethrough,
            attivo: attivi.testo.has("barrato"),
            azione: () => usa(barrato),
          },
          { tipo: "divisore" },
          {
            tipo: "strumento",
            nome: "Titolo",
            icona: Heading1,
            attivo: riga === "titolo",
            azione: () => usa(impostaRiga("titolo")),
          },
          {
            tipo: "strumento",
            nome: "Sottotitolo",
            icona: Heading2,
            attivo: riga === "sottotitolo",
            azione: () => usa(impostaRiga("sottotitolo")),
          },
        ]
      : [
          {
            tipo: "strumento",
            nome: "Titolo",
            icona: Heading1,
            azione: () => usa(impostaRiga("titolo"), true),
          },
          {
            tipo: "strumento",
            nome: "Sottotitolo",
            icona: Heading2,
            azione: () => usa(impostaRiga("sottotitolo"), true),
          },
          { tipo: "divisore" },
          {
            tipo: "strumento",
            nome: "Elenco puntato",
            icona: List,
            azione: () => usa(impostaRiga("puntato"), true),
          },
          {
            tipo: "strumento",
            nome: "Elenco numerato",
            icona: ListOrdered,
            azione: () => usa(impostaRiga("numerato"), true),
          },
          {
            tipo: "strumento",
            nome: "Checklist",
            icona: ListChecks,
            azione: () => usa(impostaRiga("checklist"), true),
          },
        ];

  const vociBarra: VoceMenu[] = [
    {
      tipo: "voce",
      etichetta: "Titolo",
      icona: Heading1,
      azione: () => usa(inserisciDaBarra("titolo")),
    },
    {
      tipo: "voce",
      etichetta: "Sottotitolo",
      icona: Heading2,
      azione: () => usa(inserisciDaBarra("sottotitolo")),
    },
    {
      tipo: "voce",
      etichetta: "Elenco puntato",
      icona: List,
      azione: () => usa(inserisciDaBarra("puntato")),
    },
    {
      tipo: "voce",
      etichetta: "Elenco numerato",
      icona: ListOrdered,
      azione: () => usa(inserisciDaBarra("numerato")),
    },
    {
      tipo: "voce",
      etichetta: "Checklist",
      icona: ListChecks,
      azione: () => usa(inserisciDaBarra("checklist")),
    },
  ];

  const appunti = {
    taglia: async () => {
      const view = vista.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      await navigator.clipboard.writeText(view.state.sliceDoc(from, to));
      view.dispatch({ changes: { from, to }, userEvent: "delete.cut" });
    },
    copia: async () => {
      const view = vista.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      await navigator.clipboard.writeText(view.state.sliceDoc(from, to));
    },
    incolla: async () => {
      const view = vista.current;
      if (!view) return;
      const testo = await navigator.clipboard.readText();
      view.dispatch(view.state.replaceSelection(testo), { userEvent: "input.paste" });
    },
  };

  const vociTesto: VoceMenu[] = [
    {
      tipo: "voce",
      etichetta: "Taglia",
      icona: Scissors,
      scorciatoia: scorciatoia("X"),
      azione: () => void appunti.taglia(),
    },
    {
      tipo: "voce",
      etichetta: "Copia",
      icona: Copy,
      scorciatoia: scorciatoia("C"),
      azione: () => void appunti.copia(),
    },
    {
      tipo: "voce",
      etichetta: "Incolla",
      icona: ClipboardPaste,
      scorciatoia: scorciatoia("V"),
      azione: () => void appunti.incolla(),
    },
    { tipo: "separatore" },
    {
      tipo: "voce",
      etichetta: "Grassetto",
      icona: Bold,
      scorciatoia: scorciatoia("B"),
      azione: () => usa(grassetto),
    },
    {
      tipo: "voce",
      etichetta: "Corsivo",
      icona: Italic,
      scorciatoia: scorciatoia("I"),
      azione: () => usa(corsivo),
    },
    {
      tipo: "voce",
      etichetta: "Sottolineato",
      icona: Underline,
      scorciatoia: scorciatoia("U"),
      azione: () => usa(sottolineato),
    },
    {
      tipo: "voce",
      etichetta: "Barrato",
      icona: Strikethrough,
      scorciatoia: scorciatoia("X", true),
      azione: () => usa(barrato),
    },
    { tipo: "separatore" },
    {
      tipo: "voce",
      etichetta: "Titolo",
      icona: Heading1,
      sottomenu: [
        {
          tipo: "voce",
          etichetta: "Titolo",
          icona: Heading1,
          azione: () => usa(impostaRiga("titolo")),
        },
        {
          tipo: "voce",
          etichetta: "Sottotitolo",
          icona: Heading2,
          azione: () => usa(impostaRiga("sottotitolo")),
        },
      ],
    },
    {
      tipo: "voce",
      etichetta: "Elenco",
      icona: List,
      sottomenu: [
        {
          tipo: "voce",
          etichetta: "Elenco puntato",
          icona: List,
          azione: () => usa(impostaRiga("puntato")),
        },
        {
          tipo: "voce",
          etichetta: "Elenco numerato",
          icona: ListOrdered,
          azione: () => usa(impostaRiga("numerato")),
        },
        {
          tipo: "voce",
          etichetta: "Checklist",
          icona: ListChecks,
          azione: () => usa(impostaRiga("checklist")),
        },
      ],
    },
  ];

  return (
    <>
      <div ref={contenitore} className="editor nota-corpo" />
      {comparsa && (
        <Pillola
          ref={pillola}
          etichetta={comparsa.tipo === "formattazione" ? "Formattazione" : "Inserimento"}
          strumenti={strumenti}
          x={comparsa.x}
          y={comparsa.y}
          sotto={comparsa.sotto}
          onEsci={() => {
            setComparsa(null);
            tornaAlTesto();
          }}
        />
      )}
      {menuBarra && (
        <Menu
          etichetta="Inserisci"
          voci={vociBarra}
          invioAlTesto
          x={menuBarra.x}
          y={menuBarra.y}
          onChiudi={() => setMenuBarra(null)}
        />
      )}
      {menuTesto && (
        <Menu
          etichetta="Testo"
          voci={vociTesto}
          x={menuTesto.x}
          y={menuTesto.y}
          onChiudi={() => {
            setMenuTesto(null);
            tornaAlTesto();
          }}
        />
      )}
    </>
  );
}
