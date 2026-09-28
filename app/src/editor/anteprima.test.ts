import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorSelection, EditorState } from "@codemirror/state";
import { describe, expect, it } from "vitest";
import { calcolaSegni, type Segno } from "./anteprima";

const stato = (doc: string, cursore = doc.length) =>
  EditorState.create({
    doc,
    selection: EditorSelection.cursor(cursore),
    extensions: markdown({ base: markdownLanguage }),
  });

const testo = (doc: string, s: Segno) => ("a" in s ? doc.slice(s.da, s.a) : "");
const di = (doc: string, segni: Segno[], tipo: Segno["tipo"]) =>
  segni.filter((s) => s.tipo === tipo).map((s) => testo(doc, s));

describe("anteprima dal vivo (RF-02, CA-02.2)", () => {
  const doc = "# Titolo\n## Sotto\nTesto **forte** *storto* ~~via~~ <u>sotto</u>\nfine";

  it("fuori dalla riga del cursore nasconde tutti i simboli", () => {
    const segni = calcolaSegni(stato(doc));
    expect(di(doc, segni, "nascosto")).toEqual([
      "# ",
      "## ",
      "**",
      "**",
      "*",
      "*",
      "~~",
      "~~",
      "<u>",
      "</u>",
    ]);
    expect(
      segni.filter((s) => s.tipo === "riga").map((s) => s.tipo === "riga" && s.classe),
    ).toEqual(["md-titolo", "md-sottotitolo"]);
  });

  it("applica grassetto, corsivo, barrato e sottolineato", () => {
    const tratti = calcolaSegni(stato(doc)).filter((s) => s.tipo === "tratto");
    const perClasse = Object.fromEntries(
      tratti.map((s) => [s.tipo === "tratto" && s.classe, testo(doc, s)]),
    );
    expect(perClasse).toMatchObject({
      "md-grassetto": "**forte**",
      "md-corsivo": "*storto*",
      "md-barrato": "~~via~~",
      "md-sottolineato": "sotto",
    });
  });

  it("sulla riga del cursore mostra i simboli in tenue", () => {
    const cursore = doc.indexOf("forte");
    const segni = calcolaSegni(stato(doc, cursore));
    const simboli = segni
      .filter((s) => s.tipo === "tratto" && s.classe === "md-simbolo")
      .map((s) => testo(doc, s));
    expect(simboli).toEqual(["**", "**", "*", "*", "~~", "~~", "<u>", "</u>"]);
    expect(di(doc, segni, "nascosto")).toEqual(["# ", "## "]);
  });

  it("senza focus nasconde i simboli anche sulla riga del cursore", () => {
    const segni = calcolaSegni(stato(doc, doc.indexOf("forte")), 0, doc.length, false);
    expect(segni.some((s) => s.tipo === "tratto" && s.classe === "md-simbolo")).toBe(false);
  });

  it("mostra il punto degli elenchi e la casella della checklist", () => {
    const lista = "- uno\n1. due\n- [ ] da fare\n- [x] fatto\n";
    const segni = calcolaSegni(stato(lista));
    expect(di(lista, segni, "punto")).toEqual(["- "]);
    expect(
      segni.filter((s) => s.tipo === "casella").map((s) => s.tipo === "casella" && s.spuntata),
    ).toEqual([false, true]);
    expect(segni.find((s) => s.tipo === "tratto" && s.classe === "md-spuntata")).toBeDefined();
    expect(
      segni.find((s) => s.tipo === "tratto" && s.classe === "md-segno" && testo(lista, s) === "1."),
    ).toBeDefined();
  });

  it("non interpreta l'HTML: uno script resta testo (RB-08, CA-02.9)", () => {
    const pericoloso = "<script>alert(1)</script> <img src=x onerror=alert(1)>\nfine";
    const segni = calcolaSegni(stato(pericoloso));
    expect(segni.filter((s) => s.tipo !== "riga")).toEqual([]);
  });
});
