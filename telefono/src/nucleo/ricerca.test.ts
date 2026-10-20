// La ricerca del telefono con i casi di RF-08 (CA-08.2 … CA-08.9), come le prove del computer
// (client/src-tauri/src/archivio_ricerca_test.rs).

import { describe, expect, it } from "vitest";
import { cerca, estratto, type CartellaDaCercare, type NotaDaCercare } from "./ricerca";

const nota = (id: string, n: Partial<NotaDaCercare>): NotaDaCercare => ({
  id,
  titolo: "",
  contenuto: "",
  cartella: null,
  creata: "2026-10-01T08:00:00.000Z",
  creata_scelta: null,
  modificata: "2026-10-01T08:00:00.000Z",
  eliminata_il: null,
  provenienza: null,
  brainet: false,
  tag: [],
  ...n,
});
const cartelle = new Map<string, CartellaDaCercare>([
  ["c1", { nome: "Lavoro", madre: null, eliminata: false }],
  ["c2", { nome: "Clienti", madre: "c1", eliminata: false }],
  ["c3", { nome: "Vecchie", madre: null, eliminata: true }],
]);
const tag = new Map([
  ["t1", "lavoro"],
  ["t2", "lavoro/clienti"],
  ["t3", "personale"],
]);
const note = [
  nota("a", {
    titolo: "Note sparse",
    contenuto: "Prima del rilascio controllare tutto.",
    modificata: "2026-10-20T08:00:00.000Z",
  }),
  nota("b", {
    titolo: "Rilascio di ottobre",
    contenuto: "Perché si fa venerdì",
    cartella: "c2",
    tag: ["t2"],
    modificata: "2026-10-10T08:00:00.000Z",
  }),
  nota("c", { titolo: "Idee", contenuto: "rimandare il rilascio", cartella: "c3" }),
  nota("d", {
    titolo: "Cestinata",
    contenuto: "rilascio",
    eliminata_il: "2026-10-02T08:00:00.000Z",
    provenienza: "Lavoro",
  }),
  nota("e", { titolo: "In Brainet", contenuto: "rilascio", brainet: true }),
  nota("f", { titolo: "Spesa", contenuto: "latte", tag: ["t3"] }),
];
const richiesta = (testo: string, altro: Partial<Parameters<typeof cerca>[0]> = {}) => ({
  testo,
  tag: [],
  creata: null,
  modificata: null,
  ...altro,
});
const ids = (testo: string, altro = {}, cestino = true) =>
  cerca(richiesta(testo, altro), note, cartelle, tag, cestino).map((r) => r.id);

describe("ricerca del telefono (RF-08)", () => {
  it("prima il titolo, poi il testo, per ultima modifica; il cestino segnato; Brainet escluso (CA-08.2, CA-08.9)", () => {
    expect(ids("rilascio")).toEqual(["b", "a", "c", "d"]);
    const r = cerca(richiesta("rilascio"), note, cartelle, tag, true);
    expect(r.find((x) => x.id === "b")).toMatchObject({
      cartella: "Lavoro/Clienti",
      nelCestino: false,
    });
    expect(r.find((x) => x.id === "c")).toMatchObject({ cartella: "Vecchie", nelCestino: true });
    expect(r.find((x) => x.id === "d")).toMatchObject({ cartella: "Lavoro", nelCestino: true });
    expect(ids("rilascio", {}, false)).toEqual(["b", "a"]);
  });

  it("dentro le parole, senza maiuscole né accenti, con tutte le parole (CA-08.3)", () => {
    expect(ids("lascio", {}, false)).toEqual(["b", "a"]);
    expect(ids("PERCHE")).toEqual(["b"]);
    expect(ids("ri")).toEqual(expect.arrayContaining(["a", "b"]));
    expect(ids("rilascio venerdì")).toEqual(["b"]);
  });

  it("i nomi dei tag e il filtro con i sotto-tag (CA-08.4, CA-08.5, CA-08.6)", () => {
    expect(ids("clienti")).toEqual(["b"]);
    expect(ids("", { tag: ["lavoro"] })).toEqual(["b"]);
    expect(ids("", { tag: ["lavoro", "personale"] })).toEqual([]);
    expect(ids("")).toEqual([]);
  });

  it("i periodi di modifica e di creazione (CA-08.7)", () => {
    expect(ids("", { modificata: { da: "2026-10-15T00:00:00.000Z", a: null } })).toEqual(["a"]);
    expect(
      ids("", { creata: { da: "2026-09-30T00:00:00.000Z", a: "2026-10-01T23:59:59.999Z" } }, false),
    ).toEqual(["a", "b", "f"]);
  });

  it("l'estratto attorno alla parola, a parole intere, con l'evidenza in caratteri", () => {
    const e = estratto(
      "Una frase piuttosto lunga che porta, dopo molte parole, al rilascio vero e proprio della versione nuova del programma per tutti",
      ["rilascio"],
    )!;
    expect(e.testo.startsWith("…")).toBe(true);
    expect([...e.testo].slice(e.evidenza[0], e.evidenza[1]).join("")).toBe("rilascio");
    expect(estratto("Perché sì", ["perche"])!.evidenza).toEqual([0, 6]);
  });
});
