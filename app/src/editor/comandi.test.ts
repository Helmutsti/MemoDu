import { EditorSelection, EditorState, type Transaction } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { barrato, corsivo, grassetto, sottolineato, spuntaVoce } from "./comandi";

function esegui(comando: typeof grassetto, doc: string, da: number, a = da) {
  let stato = EditorState.create({ doc, selection: EditorSelection.range(da, a) });
  comando({ state: stato, dispatch: (t: Transaction) => (stato = t.state) });
  return {
    testo: stato.doc.toString(),
    selezione: stato.sliceDoc(stato.selection.main.from, stato.selection.main.to),
  };
}

describe("scorciatoie di formattazione (CA-02.3)", () => {
  it("mette e toglie il grassetto attorno alla selezione", () => {
    expect(esegui(grassetto, "una parola qui", 4, 10)).toEqual({
      testo: "una **parola** qui",
      selezione: "parola",
    });
    expect(esegui(grassetto, "una **parola** qui", 6, 12).testo).toBe("una parola qui");
    expect(esegui(grassetto, "una **parola** qui", 4, 14).testo).toBe("una parola qui");
  });

  it("corsivo, barrato e sottolineato come <u>…</u> (DEC-28)", () => {
    expect(esegui(corsivo, "ab", 0, 2).testo).toBe("*ab*");
    expect(esegui(barrato, "ab", 0, 2).testo).toBe("~~ab~~");
    expect(esegui(sottolineato, "ab", 0, 2).testo).toBe("<u>ab</u>");
    expect(esegui(sottolineato, "<u>ab</u>", 3, 5).testo).toBe("ab");
  });

  it("il corsivo su una parola in grassetto si aggiunge invece di rompere il grassetto", () => {
    expect(esegui(corsivo, "**parola**", 2, 8).testo).toBe("***parola***");
    expect(esegui(corsivo, "***parola***", 3, 9).testo).toBe("**parola**");
  });

  it("senza selezione prepara i simboli con il cursore in mezzo", () => {
    expect(esegui(grassetto, "ab", 1)).toEqual({ testo: "a****b", selezione: "" });
  });
});

describe("spunta della checklist con Ctrl + Invio (CMP-20)", () => {
  it("spunta e toglie la spunta alla voce del cursore", () => {
    expect(esegui(spuntaVoce, "- [ ] latte", 8).testo).toBe("- [x] latte");
    expect(esegui(spuntaVoce, "- [x] latte", 8).testo).toBe("- [ ] latte");
  });

  it("fuori da una checklist non fa niente", () => {
    expect(esegui(spuntaVoce, "testo", 2).testo).toBe("testo");
  });
});
