import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorSelection, EditorState, type StateCommand } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";
import { calcolaSegni } from "./anteprima";
import { alternaCarattere } from "./formati";
import {
  cancellaAvanti,
  cancellaIndietro,
  comeSono,
  invio,
  passo,
  scritturaComeWord,
} from "./scrittura";

/** Stato in vista Markdown; "|" nel testo è il cursore. */
const stato = (conCursore: string) => {
  const cursore = conCursore.indexOf("|");
  return EditorState.create({
    doc: conCursore.replace("|", ""),
    selection: EditorSelection.cursor(Math.max(cursore, 0)),
    extensions: [markdown({ base: markdownLanguage, addKeymap: false }), scritturaComeWord],
  });
};

/** Il testo con "|" al posto del cursore. */
const conCursore = (s: EditorState) => {
  const p = s.selection.main.head;
  return s.doc.sliceString(0, p) + "|" + s.doc.sliceString(p);
};

const esegui = (s: EditorState, comando: StateCommand) => {
  let dopo = s;
  comando({ state: s, dispatch: (tr) => (dopo = tr.state) });
  return dopo;
};

const scrivi = (s: EditorState, testo: string) => {
  const p = s.selection.main.head;
  return s.update({ changes: { from: p, insert: testo }, userEvent: "input.type" }).state;
};

const passi = (s: EditorState, avanti: boolean, n: number) => {
  const posti = [s.selection.main.head];
  for (let i = 0; i < n; i++) posti.push(passo(s, posti[posti.length - 1], avanti));
  return posti;
};

describe("cursore come in Word (CA-02.15)", () => {
  it("le frecce si fermano solo dopo un carattere visibile", () => {
    const s = stato("|a**b**c");
    expect(passi(s, true, 3)).toEqual([0, 1, 4, 7]);
    const fine = stato("a**b**c|");
    expect(passi(fine, false, 3)).toEqual([7, 6, 3, 0]);
  });

  it("salta il simbolo di inizio riga di un titolo", () => {
    const s = stato("x|\n# Titolo");
    expect(passo(s, 1, true)).toBe(4);
    expect(passo(s, 4, false)).toBe(1);
  });

  it("il clic davanti al punto dell'elenco porta il cursore dopo il segno", () => {
    const s = stato("|- uno").update({ selection: EditorSelection.cursor(0) }).state;
    expect(s.selection.main.head).toBe(2);
  });
});

describe("scrivere ai bordi (CA-02.16)", () => {
  it("in fondo a un grassetto il testo nuovo è in grassetto", () => {
    expect(conCursore(scrivi(stato("a**b**|c"), "X"))).toBe("a**bX|**c");
  });

  it("subito prima di un grassetto il testo nuovo resta normale", () => {
    expect(conCursore(scrivi(stato("a**|b**c"), "X"))).toBe("aX|**b**c");
  });

  it("cancellando tutte le lettere spariscono anche i simboli", () => {
    let s = stato("a**bc**|d");
    s = esegui(s, cancellaIndietro);
    expect(s.doc.toString()).toBe("a**b**d");
    s = esegui(s, cancellaIndietro);
    expect(s.doc.toString()).toBe("ad");
  });

  it("cancellandone una parte il resto resta formattato e la coppia resta intera", () => {
    const s = stato("a**bc**d");
    const tolto = s.update({ changes: { from: 0, to: 4 }, userEvent: "delete" }).state;
    expect(tolto.doc.toString()).toBe("**c**d");
  });

  it("Canc prima di un grassetto toglie la prima lettera, non i simboli", () => {
    expect(esegui(stato("a|**bc**d"), cancellaAvanti).doc.toString()).toBe("a**c**d");
  });
});

describe("Invio (CA-02.17)", () => {
  it("in un elenco nasce una voce con lo stesso segno, nei numerati il numero dopo", () => {
    expect(esegui(stato("- uno|"), invio).doc.toString()).toBe("- uno\n- ");
    expect(esegui(stato("1. uno|"), invio).doc.toString()).toBe("1. uno\n2. ");
  });

  it("su una voce vuota l'elenco finisce", () => {
    const fine = esegui(stato("- uno\n- |"), invio).doc.toString();
    expect(fine.split("\n").pop()).toBe("");
    expect(fine).not.toContain("\n- ");
  });

  it("dopo un titolo la riga nuova è testo normale", () => {
    expect(esegui(stato("# Titolo|"), invio).doc.toString()).toBe("# Titolo\n");
  });
});

describe("Backspace e Canc sulle righe (CA-02.18)", () => {
  it("all'inizio di una voce d'elenco toglie il segno e lascia il testo", () => {
    expect(esegui(stato("- |uno"), cancellaIndietro).doc.toString()).toBe("uno");
    expect(esegui(stato("- [ ] |fare"), cancellaIndietro).doc.toString()).toBe("fare");
    expect(esegui(stato("1. |uno"), cancellaIndietro).doc.toString()).toBe("uno");
  });

  it("all'inizio di un titolo unisce la riga a quella sopra come testo", () => {
    expect(conCursore(esegui(stato("uno\n# |Due"), cancellaIndietro))).toBe("uno|Due");
  });

  it("Canc a fine riga unisce il titolo sotto come testo", () => {
    expect(esegui(stato("uno|\n# Due"), cancellaAvanti).doc.toString()).toBe("unoDue");
  });
});

describe("copiare (CA-02.19)", () => {
  it("si copia il Markdown con i simboli attorno al pezzo selezionato", () => {
    const s = stato("a**bc**d").update({ selection: EditorSelection.range(3, 5) }).state;
    const filtro = s.facet(EditorView.clipboardOutputFilter)[0];
    expect(filtro(s.sliceDoc(3, 5), s)).toBe("**bc**");
  });
});

describe("i caratteri restano quelli che sono, come in Note di Apple (DEC-165)", () => {
  it("asterischi, trattini bassi, tilde, apici inversi e «<» entrano con la barra rovescia", () => {
    expect(comeSono("**ciao**", false)).toBe("\\*\\*ciao\\*\\*");
    expect(comeSono("nome_file ~x~ `y` <u>", false)).toBe("nome\\_file \\~x\\~ \\`y\\` \\<u>");
    expect(comeSono("a\\b", false)).toBe("a\\\\b");
  });

  it("il «#» si protegge solo a inizio riga", () => {
    expect(comeSono("#", true)).toBe("\\#");
    expect(comeSono("#", false)).toBe("#");
    expect(comeSono("a\n# b", false)).toBe("a\n\\# b");
  });

  it("scritto così, non diventa grassetto e la barra rovescia non si vede", () => {
    const s = stato(comeSono("**ciao**", false) + "|");
    const segni = calcolaSegni(s, 0, s.doc.length, false);
    expect(segni.some((x) => x.tipo === "tratto" && x.classe === "md-grassetto")).toBe(false);
    expect(segni.filter((x) => x.tipo === "nascosto")).toHaveLength(4);
  });

  it("Backspace sul carattere protetto toglie anche la barra rovescia", () => {
    const s = stato("a\\*|");
    const dopo = esegui(s, cancellaIndietro);
    expect(conCursore(dopo)).toBe("a|");
  });

  it("una barra rovescia protetta resta", () => {
    const s = stato("a\\\\*|");
    const dopo = s.update({ changes: { from: 3, to: 4 }, userEvent: "delete.backward" }).state;
    expect(dopo.doc.toString()).toBe("a\\\\");
  });
});

describe("lo spazio in fondo a un grassetto non fa comparire i simboli (DEC-165)", () => {
  const scriviQui = (s: EditorState, testo: string) => {
    const p = s.selection.main.head;
    return s.update({
      changes: { from: p, insert: testo },
      selection: EditorSelection.cursor(p + testo.length),
      userEvent: "input.type",
    }).state;
  };
  const nascosti = (s: EditorState) =>
    calcolaSegni(s, 0, s.doc.length, false).filter((x) => x.tipo === "nascosto").length;

  it("lo spazio va dopo i simboli e il grassetto resta riconosciuto", () => {
    const s = scriviQui(stato("**ciao**|"), " ");
    expect(conCursore(s)).toBe("**ciao** |");
    expect(nascosti(s)).toBe(2);
  });

  it("con il grassetto della bollicina: «ciao» e poi spazio non mostra i simboli", () => {
    let s = stato("|");
    s = esegui(s, alternaCarattere("grassetto"));
    for (const ch of ["c", "i", "a", "o", " "]) s = scriviQui(s, ch);
    expect(s.doc.toString()).toBe("**ciao** ");
    expect(nascosti(s)).toBe(2);
    for (const ch of ["m", "o"]) s = scriviQui(s, ch);
    expect(s.doc.toString()).toMatch(/^\*\*ciao\*\* \*\*mo\*\*$/);
  });

  it("grassetto, «ciao», grassetto tolto, spazio: i simboli restano nascosti", () => {
    let s = stato("|");
    s = esegui(s, alternaCarattere("grassetto"));
    for (const ch of ["c", "i", "a", "o"]) s = scriviQui(s, ch);
    s = esegui(s, alternaCarattere("grassetto"));
    s = scriviQui(s, " ");
    expect(s.doc.toString()).toBe("**ciao** ");
    expect(nascosti(s)).toBe(2);
    s = scriviQui(s, "x");
    expect(s.doc.toString()).toBe("**ciao** x");
  });

  it("la parola dopo lo spazio continua in grassetto, come in Word", () => {
    let s = scriviQui(stato("**ciao**|"), " ");
    s = scriviQui(s, "m");
    expect(s.doc.toString()).toMatch(/^\*\*ciao\*\* \*\*m\*\*$/);
    expect(nascosti(s)).toBe(4);
  });
});
