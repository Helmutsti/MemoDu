import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorSelection, EditorState, type StateCommand } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { deleteCharBackward, history, undo } from "@codemirror/commands";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cancellaAvanti, cancellaIndietro, passo, scritturaComeWord } from "../editor/scrittura";
import {
  aggiornaAllegati,
  aggiornaArea,
  aggiornaEntita,
  cambiaForma,
  creaArea,
  estensioneBrainet,
  inserisciAllegato,
  inserisciCitazione,
  togliAllegato,
} from "./estensione";
import {
  leggiAllegati,
  legamiArea,
  leggiSegni,
  segnoAllegato,
  segnoApre,
  segnoChiude,
  segnoCita,
  testoSemplice,
} from "./segni";

const viste: EditorView[] = [];
afterEach(() => viste.splice(0).forEach((v) => v.destroy()));

function apri(
  testo: string,
  ascolto = {
    onChiocciola: vi.fn(),
    onSelezione: vi.fn(),
    onAreaSopra: vi.fn(),
    onAllegato: vi.fn(),
  },
) {
  const view = new EditorView({
    parent: document.body,
    state: EditorState.create({ doc: testo, extensions: [history(), estensioneBrainet(ascolto)] }),
  });
  viste.push(view);
  return { view, ascolto };
}

const LUCA = { id: "e1", nome: "Luca" };

describe("compartimento Brainet dell'editor (RF-18)", () => {
  it("il collegamento è una pillola con il nome attuale dell'entità (CMP-38)", () => {
    const { view } = apri(`con ${segnoCita(LUCA)} oggi`);
    expect(view.contentDOM.querySelector(".bn-collegamento")?.textContent).toBe("Luca");
    view.dispatch({ effects: aggiornaEntita.of({ e1: { nome: "Luca Bianchi", foto: null } }) });
    expect(view.contentDOM.querySelector(".bn-collegamento")?.textContent).toBe("Luca Bianchi");
    expect(view.contentDOM.textContent).not.toContain("<cita");
  });

  it("Backspace subito dopo la pillola la toglie tutta (CA-18.5)", () => {
    const testo = `con ${segnoCita(LUCA)}`;
    const { view } = apri(testo);
    view.dispatch({ selection: EditorSelection.cursor(testo.length) });
    deleteCharBackward(view);
    expect(view.state.doc.toString()).toBe("con ");
  });

  it("@ e lettere: l'editor dice dove; scelta l'entità, entra la pillola e uno spazio (CA-18.3)", () => {
    const { view, ascolto } = apri("");
    view.focus();
    view.dispatch({
      changes: { from: 0, insert: "con @lu" },
      selection: { anchor: 7 },
      userEvent: "input",
    });
    expect(ascolto.onChiocciola).toHaveBeenLastCalledWith(
      expect.objectContaining({ da: 4, testo: "lu" }),
    );
    inserisciCitazione(view, 4, LUCA);
    expect(view.state.doc.toString()).toBe(`con ${segnoCita(LUCA)} `);
    expect(view.state.selection.main.head).toBe(view.state.doc.length);
  });

  it("un <cita scritto a mano non diventa un segno", () => {
    const { view } = apri("");
    view.dispatch({
      changes: { from: 0, insert: '<cita e="x">finto</cita>' },
      userEvent: "input.paste",
    });
    expect(view.state.doc.toString()).toBe('&lt;cita e="x">finto&lt;/cita>');
    expect(leggiSegni(view.state.doc.toString()).citazioni).toHaveLength(0);
    expect(view.contentDOM.textContent).toContain("<cita");
  });

  it("scrivere subito prima o dopo una pillola non la rompe", () => {
    const testo = `con ${segnoCita(LUCA)}`;
    const { view } = apri(testo);
    view.dispatch({ changes: { from: 4, insert: "X" }, userEvent: "input" });
    view.dispatch({ changes: { from: view.state.doc.length, insert: "Y" }, userEvent: "input" });
    expect(view.state.doc.toString()).toBe(`con X${segnoCita(LUCA)}Y`);
  });

  it("un'area nasce dalla selezione, cambia i legami e sparisce senza (CA-18.6, CA-18.7)", () => {
    const { view } = apri("il preventivo della serra.");
    const id = creaArea(view, 3, 25, ["s1"], []);
    expect(view.contentDOM.querySelector(".bn-area")?.textContent).toBe("preventivo della serra");
    expect(legamiArea(view.state.doc.toString(), id)).toEqual({
      stati: ["s1"],
      entita: [],
      citate: [],
    });
    expect(aggiornaArea(view, id, ["s1"], ["e2"])).toBe(true);
    expect(legamiArea(view.state.doc.toString(), id)?.entita).toEqual(["e2"]);
    expect(aggiornaArea(view, id, [], [])).toBe(false);
    expect(view.state.doc.toString()).toBe("il preventivo della serra.");
  });

  it("un'area con una pillola dentro resta anche senza altri legami (RB-107)", () => {
    const testo = `${segnoApre("a", ["s"], [])}con ${segnoCita(LUCA)}${segnoChiude("a")}`;
    const { view } = apri(testo);
    expect(legamiArea(view.state.doc.toString(), "a")?.citate).toEqual(["e1"]);
    expect(aggiornaArea(view, "a", [], [])).toBe(true);
    expect(leggiSegni(view.state.doc.toString()).aree).toHaveLength(1);
  });

  it("copiando si porta via il testo senza segni", () => {
    const { view } = apri(`con ${segnoCita(LUCA)}`);
    const filtri = view.state.facet(EditorView.clipboardOutputFilter);
    expect(filtri.reduce((t, f) => f(t, view.state), view.state.doc.toString())).toBe("con Luca");
  });
});

describe("allegati nell'editor (RF-18, RB-114 … RB-121)", () => {
  const PDF = { id: "a1", nome: "Preventivo.pdf", tipo: "pdf" as const };
  const FOTO = { id: "a2", nome: "cantiere.jpg", tipo: "jpg" as const };

  it("un documento è la pillola con l'icona e il nome, come blocco unico (CA-18.22)", () => {
    const { view } = apri("Ho mandato ");
    inserisciAllegato(view, 11, 11, PDF);
    const testo = view.state.doc.toString();
    expect(testo).toBe(`Ho mandato ${segnoAllegato("a1", "documento", "Preventivo.pdf")} `);
    const pillola = view.contentDOM.querySelector(".bn-allegato-documento");
    expect(pillola?.textContent).toBe("Preventivo.pdf");
    expect(pillola?.querySelector("svg")).not.toBeNull();
    expect(testoSemplice(testo)).toBe("Ho mandato Preventivo.pdf ");
  });

  it("una foto in una frase è una bolla, su una riga vuota arriva piccola (CA-18.24)", () => {
    const { view } = apri("e la foto  del cantiere\n");
    inserisciAllegato(view, 10, 10, FOTO);
    expect(leggiAllegati(view.state.doc.toString())[0].forma).toBe("bolla");
    const fine = view.state.doc.length;
    inserisciAllegato(view, fine, fine, { ...FOTO, id: "a3" });
    const [, piccola] = leggiAllegati(view.state.doc.toString());
    expect(piccola.forma).toBe("piccola");
    expect(view.state.doc.toString().endsWith("</allegato>\n")).toBe(true);
  });

  it("con l'anteprima si vede la foto; senza, il riquadro con il nome (CA-18.29)", () => {
    const { view } = apri(segnoAllegato("a2", "piccola", "cantiere.jpg"));
    expect(view.contentDOM.querySelector(".bn-foto-non-scaricata")?.textContent).toBe(
      "cantiere.jpg",
    );
    view.dispatch({
      effects: aggiornaAllegati.of({ a2: { tipo: "jpg", anteprima: "data:image/jpeg;base64,AA" } }),
    });
    const img = view.contentDOM.querySelector("img.bn-foto-piccola") as HTMLImageElement;
    expect(img.alt).toBe("cantiere.jpg");
    view.dispatch({ effects: aggiornaAllegati.of({ a2: null }) });
    expect(view.contentDOM.textContent).toContain("Allegato non più disponibile");
  });

  it("Dimensioni cambia solo la forma; Togli lo toglie e Ctrl+Z lo rimette (CA-18.25, CA-18.27)", () => {
    const { view } = apri(`prima\n${segnoAllegato("a2", "piccola", "cantiere.jpg")}\ndopo`);
    cambiaForma(view, leggiAllegati(view.state.doc.toString())[0], "grande");
    expect(leggiAllegati(view.state.doc.toString())[0].forma).toBe("grande");
    togliAllegato(view, leggiAllegati(view.state.doc.toString())[0]);
    expect(view.state.doc.toString()).toBe("prima\ndopo");
    undo(view);
    expect(leggiAllegati(view.state.doc.toString())[0].forma).toBe("grande");
  });

  it("un clic sull'allegato apre il suo menu; un segno scritto a mano non diventa un allegato", () => {
    const { view, ascolto } = apri(`vedi ${segnoAllegato("a1", "documento", "Preventivo.pdf")}`);
    const pillola = view.contentDOM.querySelector("[data-allegato]") as HTMLElement;
    pillola.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }));
    expect(ascolto.onAllegato).toHaveBeenCalledWith(
      expect.objectContaining({ id: "a1", forma: "documento" }),
    );
    view.dispatch({
      changes: { from: 0, insert: '<allegato id="x" f="bolla">finto</allegato>' },
      userEvent: "input.type",
    });
    expect(view.state.doc.toString().startsWith("&lt;allegato")).toBe(true);
    expect(leggiAllegati(view.state.doc.toString()).map((s) => s.id)).toEqual(["a1"]);
  });
});

describe("un'area senza legami sparisce (RB-107, RB-109)", () => {
  it("Backspace sulla sua sola pillola toglie anche l'area; Ctrl+Z rimette tutto", () => {
    const testo = `con ${segnoApre("a1", [], [])}${segnoCita(LUCA)} oggi${segnoChiude("a1")}`;
    const { view } = apri(testo);
    const fine = testo.indexOf(" oggi");
    view.dispatch({ selection: { anchor: fine } });
    deleteCharBackward(view);
    expect(view.state.doc.toString()).toBe("con  oggi");
    undo(view);
    expect(view.state.doc.toString()).toBe(testo);
  });
});

describe("Brainet nella vista Markdown delle note (DEC-146, CA-18.5, CA-18.8)", () => {
  const conMarkdown = (testo: string, cursore: number) =>
    EditorState.create({
      doc: testo,
      selection: EditorSelection.cursor(cursore),
      extensions: [
        markdown({ base: markdownLanguage, addKeymap: false }),
        scritturaComeWord,
        estensioneBrainet({
          onChiocciola: vi.fn(),
          onSelezione: vi.fn(),
          onAreaSopra: vi.fn(),
          onAllegato: vi.fn(),
        }),
      ],
    });
  const esegui = (s: EditorState, comando: StateCommand) => {
    let dopo = s;
    comando({ state: s, dispatch: (tr) => (dopo = tr.state) });
    return dopo;
  };

  it("Backspace subito dopo una pillola, anche in un titolo e in un elenco, la toglie tutta", () => {
    for (const prima of ["con ", "# con ", "- con "]) {
      const testo = `${prima}${segnoCita(LUCA)}`;
      const dopo = esegui(conMarkdown(testo, testo.length), cancellaIndietro);
      expect(dopo.doc.toString()).toBe(prima);
    }
  });

  it("Canc subito prima di una pillola la toglie tutta", () => {
    const testo = `con ${segnoCita(LUCA)} oggi`;
    const dopo = esegui(conMarkdown(testo, 4), cancellaAvanti);
    expect(dopo.doc.toString()).toBe("con  oggi");
  });

  it("le frecce saltano una pillola come un carattere solo", () => {
    const testo = `a${segnoCita(LUCA)}b`;
    const s = conMarkdown(testo, 1);
    const dopo = passo(s, 1, true);
    expect(dopo).toBe(1 + segnoCita(LUCA).length);
    expect(passo(s, dopo, false)).toBe(1);
  });

  it("i segni di un'area si saltano: Backspace toglie la lettera prima, non il segno", () => {
    const testo = `${segnoApre("a1", ["s"], [])}frase${segnoChiude("a1")} dopo`;
    const fine = testo.indexOf(" dopo");
    const dopo = esegui(conMarkdown(testo, fine), cancellaIndietro);
    expect(dopo.doc.toString()).toBe(`${segnoApre("a1", ["s"], [])}fras${segnoChiude("a1")} dopo`);
  });
});
