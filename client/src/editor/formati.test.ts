import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { ensureSyntaxTree } from "@codemirror/language";
import {
  EditorSelection,
  EditorState,
  type StateCommand,
  type Transaction,
} from "@codemirror/state";
import { describe, expect, it } from "vitest";
import {
  alternaCarattere,
  formatiAttivi,
  formatoDove,
  formatoRiga,
  type FormatoTesto,
  impostaRiga,
  inserisciDaBarra,
  rimuoviFormattazione,
} from "./formati";
import { scritturaComeWord } from "./scrittura";

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

// ---------------------------------------------------------------------------------------------
// Bollicina del formato (DEC-131, TC-172)

/** Stato in vista Markdown: "|" è il cursore, "{" e "}" la selezione. */
function testo(conSegni: string): EditorState {
  let doc = conSegni;
  let selection: EditorSelection;
  if (doc.includes("{")) {
    const da = doc.indexOf("{");
    doc = doc.replace("{", "");
    const a = doc.indexOf("}");
    doc = doc.replace("}", "");
    selection = EditorSelection.single(da, a);
  } else {
    const p = doc.indexOf("|");
    doc = doc.replace("|", "");
    selection = EditorSelection.single(Math.max(p, 0));
  }
  const s = EditorState.create({
    doc,
    selection,
    extensions: [markdown({ base: markdownLanguage, addKeymap: false }), scritturaComeWord],
  });
  ensureSyntaxTree(s, s.doc.length);
  return s;
}

/** Il testo con "|" al cursore o "{" e "}" attorno alla selezione. */
function segni(s: EditorState): string {
  const { from, to, empty } = s.selection.main;
  if (empty) return s.doc.sliceString(0, from) + "|" + s.doc.sliceString(from);
  return (
    s.doc.sliceString(0, from) + "{" + s.doc.sliceString(from, to) + "}" + s.doc.sliceString(to)
  );
}

function fai(s: EditorState, comando: StateCommand): EditorState {
  let dopo = s;
  comando({ state: s, dispatch: (t: Transaction) => (dopo = t.state) });
  ensureSyntaxTree(dopo, dopo.doc.length);
  return dopo;
}

function scrivi(s: EditorState, t: string): EditorState {
  let st = s;
  for (const c of t) {
    const p = st.selection.main.head;
    st = st.update({
      changes: { from: p, insert: c },
      selection: { anchor: p + c.length },
      userEvent: "input.type",
    }).state;
    ensureSyntaxTree(st, st.doc.length);
  }
  return st;
}

const mostra = (conSegni: string) => {
  const f = formatoDove(testo(conSegni));
  return [f.riga, ...f.caratteri].join(" ");
};

describe("cosa mostra la bollicina (CA-02.4)", () => {
  it("formato della riga e dei caratteri dove sta il cursore", () => {
    expect(mostra("Testo nor|male")).toBe("testo");
    expect(mostra("# Tit|olo")).toBe("titolo");
    expect(mostra("## Sotto|titolo")).toBe("sottotitolo");
    expect(mostra("# **Tit|olo**")).toBe("titolo grassetto");
    expect(mostra("a ***fo|rte*** b")).toBe("testo grassetto corsivo");
    expect(mostra("- vo|ce")).toBe("puntato");
    expect(mostra("1. vo|ce")).toBe("numerato");
    expect(mostra("- [ ] vo|ce")).toBe("checklist");
    expect(mostra("a ~~via~~ <u>sot|to</u>")).toBe("testo sottolineato");
  });

  it("in fondo a un pezzo vale il pezzo, subito prima no (come la scrittura)", () => {
    expect(mostra("a **forte|** b")).toBe("testo grassetto");
    expect(mostra("a **forte**| b")).toBe("testo grassetto");
    expect(mostra("a |**forte** b")).toBe("testo");
  });

  it("con una selezione mista: solo i formati comuni e il trattino se le righe sono diverse", () => {
    expect(mostra("# a **{b**\n**c**} d")).toBe("misto grassetto");
    expect(mostra("{**a** b}")).toBe("testo");
    expect(mostra("{***a*** **b**}")).toBe("testo grassetto");
  });
});

const applica = (conSegni: string, f: FormatoTesto) =>
  segni(fai(testo(conSegni), alternaCarattere(f)));

describe("formati di carattere (CA-02.22)", () => {
  it("sulla selezione si mette e si toglie", () => {
    expect(applica("uno {due}", "grassetto")).toBe("uno **{due}**");
    expect(applica("uno **{due}**", "grassetto")).toBe("uno {due}");
    expect(applica("uno {due}", "sottolineato")).toBe("uno <u>{due}</u>");
    expect(applica("uno {due}", "barrato")).toBe("uno ~~{due}~~");
  });

  it("spezza un pezzo senza lasciare simboli a metà", () => {
    expect(applica("**uno {due}**", "grassetto")).toBe("**uno** {due}");
    expect(applica("**uno {d}ue**", "grassetto")).toBe("**uno** {d}**ue**");
  });

  it("unisce i pezzi uguali e lascia gli spazi fuori dai simboli", () => {
    expect(applica("{**uno** due}", "grassetto")).toBe("**{uno due}**");
    expect(applica("{uno }due", "grassetto")).toBe("**{uno}** due");
  });

  it("mescola formati diversi e il testo resta leggibile dal Markdown", () => {
    const s = fai(testo("**a**{b}"), alternaCarattere("corsivo"));
    const doc = s.doc.toString();
    const su = (i: number) => [
      ...formatoDove(s.update({ selection: { anchor: i, head: i + 1 } }).state).caratteri,
    ];
    expect(su(doc.indexOf("a"))).toEqual(["grassetto"]);
    expect(su(doc.indexOf("b"))).toEqual(["corsivo"]);
  });

  it("su più righe vale per ogni riga, senza toccare i segni", () => {
    expect(applica("- {uno\n- due}", "corsivo")).toBe("- *{uno*\n- *due}*");
  });

  it("senza selezione dentro una parola vale per la parola", () => {
    expect(applica("uno d|ue tre", "barrato")).toBe("uno ~~d|ue~~ tre");
    expect(applica("uno ~~d|ue~~ tre", "barrato")).toBe("uno d|ue tre");
  });
});

describe("formato in attesa per il testo che si scrive dopo (CA-02.22)", () => {
  it("in fondo alla riga si accende e si spegne", () => {
    let s = fai(testo("uno |"), alternaCarattere("grassetto"));
    expect(mostra(segni(s))).toBe("testo");
    expect([...formatoDove(s).caratteri]).toEqual(["grassetto"]);
    s = scrivi(s, "xy");
    expect(segni(s)).toBe("uno **xy|**");
    s = fai(s, alternaCarattere("grassetto"));
    s = scrivi(s, "z");
    expect(s.doc.toString()).toBe("uno **xy**z");
  });

  it("tra due parole, anche per il sottolineato", () => {
    let s = fai(testo("uno |due"), alternaCarattere("sottolineato"));
    s = scrivi(s, "x");
    expect(s.doc.toString()).toBe("uno <u>x</u>due");
  });

  it("si spegne se il cursore si sposta", () => {
    let s = fai(testo("uno | due"), alternaCarattere("grassetto"));
    s = s.update({ selection: { anchor: 1 } }).state;
    s = s.update({ selection: { anchor: 4 } }).state;
    s = scrivi(s, "x");
    expect(s.doc.toString()).toBe("uno x due");
  });
});

describe("formati di riga e Rimuovi formattazione (CA-02.21, CA-02.23)", () => {
  it("testo normale toglie il segno", () => {
    expect(segni(fai(testo("# tit|olo"), impostaRiga("testo")))).toBe("tit|olo");
    expect(segni(fai(testo("- [ ] vo|ce"), impostaRiga("titolo")))).toBe("# vo|ce");
  });

  it("toglie tutto dalla selezione e dalle righe toccate", () => {
    expect(fai(testo("# {**a** *b* ~~c~~ <u>d</u>}"), rimuoviFormattazione).doc.toString()).toBe(
      "a b c d",
    );
    expect(fai(testo("- x **pa|rola** y"), rimuoviFormattazione).doc.toString()).toBe("x parola y");
  });
});

describe("scrittura con il sottolineato e la casella (CA-02.16, CA-02.24)", () => {
  it("il testo scritto in fondo al sottolineato resta dentro", () => {
    expect(segni(scrivi(testo("<u>ab</u>|"), "c"))).toBe("<u>abc|</u>");
  });

  it("-[] a inizio riga diventa la casella", () => {
    const s = scrivi(testo("|"), "-[]");
    expect(segni(s)).toBe("- [ ] |");
  });
});
