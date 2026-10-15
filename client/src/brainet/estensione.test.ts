import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { deleteCharBackward } from "@codemirror/commands";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  aggiornaArea,
  aggiornaEntita,
  creaArea,
  estensioneBrainet,
  inserisciCitazione,
} from "./estensione";
import { legamiArea, leggiSegni, segnoApre, segnoChiude, segnoCita } from "./segni";

const viste: EditorView[] = [];
afterEach(() => viste.splice(0).forEach((v) => v.destroy()));

function apri(
  testo: string,
  ascolto = { onChiocciola: vi.fn(), onSelezione: vi.fn(), onAreaSopra: vi.fn() },
) {
  const view = new EditorView({
    parent: document.body,
    state: EditorState.create({ doc: testo, extensions: [estensioneBrainet(ascolto)] }),
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
