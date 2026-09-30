import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { ensureSyntaxTree } from "@codemirror/language";
import {
  EditorSelection,
  EditorState,
  type StateCommand,
  type Transaction,
} from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { formatiAttivi, formatoRiga, impostaRiga, inserisciDaBarra } from "./formati";

const stato = (doc: string, da: number, a = da) => {
  const s = EditorState.create({
    doc,
    selection: EditorSelection.range(da, a),
    extensions: markdown({ base: markdownLanguage }),
  });
  ensureSyntaxTree(s, s.doc.length);
  return s;
};

function esegui(comando: StateCommand, doc: string, da: number, a = da): EditorState {
  let s = stato(doc, da, a);
  comando({ state: s, dispatch: (t: Transaction) => (s = t.state) });
  return s;
}

describe("formati di riga (pillola, menu /, tasto destro)", () => {
  it("mette, sostituisce e toglie titoli ed elenchi", () => {
    expect(esegui(impostaRiga("titolo"), "testo", 2).doc.toString()).toBe("# testo");
    expect(esegui(impostaRiga("sottotitolo"), "# testo", 4).doc.toString()).toBe("## testo");
    expect(esegui(impostaRiga("sottotitolo"), "## testo", 4).doc.toString()).toBe("testo");
    expect(esegui(impostaRiga("checklist"), "- voce", 3).doc.toString()).toBe("- [ ] voce");
    expect(esegui(impostaRiga("puntato"), "- [x] voce", 7).doc.toString()).toBe("- voce");
  });

  it("numera le righe selezionate", () => {
    expect(esegui(impostaRiga("numerato"), "uno\ndue\ntre", 0, 11).doc.toString()).toBe(
      "1. uno\n2. due\n3. tre",
    );
  });

  it("riconosce il formato della riga", () => {
    const s = stato("# a\n### b\n- [ ] c\n* d\n2) e\nf", 0);
    expect([0, 4, 10, 18, 22, 28].map((p) => formatoRiga(s, p))).toEqual([
      "titolo",
      "sottotitolo",
      "checklist",
      "puntato",
      "numerato",
      null,
    ]);
  });

  it("dalla / mette il formato e toglie la barra", () => {
    const s = esegui(inserisciDaBarra("checklist"), "prima\n/", 7);
    expect(s.doc.toString()).toBe("prima\n- [ ] ");
    expect(s.selection.main.head).toBe(s.doc.length);
  });
});

describe("formati attivi sulla selezione (CMP-10, stato Attivo)", () => {
  it("riconosce grassetto, corsivo, barrato e sottolineato", () => {
    const doc = "a **forte** b *storto* c ~~via~~ d <u>sotto</u>";
    const su = (parola: string) => {
      const da = doc.indexOf(parola);
      return [...formatiAttivi(stato(doc, da, da + parola.length))];
    };
    expect(su("forte")).toEqual(["grassetto"]);
    expect(su("storto")).toEqual(["corsivo"]);
    expect(su("via")).toEqual(["barrato"]);
    expect(su("sotto")).toEqual(["sottolineato"]);
    expect(su("b")).toEqual([]);
  });
});
