// Brainet da leggere sul telefono, con i casi di archivio_brainet.rs (RB-107, RB-113, RB-124,
// RB-127, RB-131, CA-18.11).

import { describe, expect, it } from "vitest";
import {
  elencoEntita,
  giorniDelCalendario,
  journal,
  paginaEntita,
  paragrafo,
  type Entita,
  type NotaBrainet,
} from "./brainet";

const entita = new Map<string, Entita>([
  ["luca", { id: "luca", nome: "Luca Bianchi", tipo: "persona", foto: null, unitaIn: null }],
  ["luca2", { id: "luca2", nome: "Luca", tipo: null, foto: null, unitaIn: "luca" }],
  ["serra", { id: "serra", nome: "Serra", tipo: "oggetto", foto: null, unitaIn: null }],
  ["mai", { id: "mai", nome: "Giorgio", tipo: null, foto: null, unitaIn: null }],
]);
const nota = (id: string, n: Partial<NotaBrainet>): NotaBrainet => ({
  id,
  titolo: "",
  contenuto: "",
  creata: "2026-10-09T08:30:00.000Z",
  creata_scelta: null,
  eliminata_il: null,
  brainet: true,
  ...n,
});
const note = [
  nota("a", {
    titolo: "Chiamata",
    contenuto:
      'Prima riga\n\nChiamata con <cita e="luca">Luca Bianchi</cita>: <area id="x" s="st1">il preventivo della <cita e="serra">Serra</cita></area id="x"> arriva.\n- voce con <cita e="luca2">Luca</cita>',
  }),
  nota("b", {
    titolo: "Orto",
    contenuto: 'Misurare la <cita e="serra">Serra</cita>.',
    creata: "2026-10-16T16:40:00.000Z",
  }),
  nota("c", {
    contenuto: '<cita e="serra">Serra</cita>',
    eliminata_il: "2026-10-17T00:00:00.000Z",
  }),
  nota("d", { contenuto: '<cita e="serra">Serra</cita>', brainet: false }),
  nota("e", { titolo: "Scelta", contenuto: "x", creata_scelta: "2026-09-30" }),
];
const titolo = (n: NotaBrainet) => n.titolo || "Senza titolo";

describe("Brainet sul telefono (RF-18)", () => {
  it("il Journal: le note in Brainet fuori dal Cestino, dalla più recente (RB-131)", () => {
    expect(journal(note).map((n) => n.id)).toEqual(["b", "a", "e"]);
  });

  it("le entità con quante volte e l'ultima, le unite contano per quella che resta (CA-18.11, RB-127)", () => {
    const voci = elencoEntita(note, entita);
    expect(voci.map((v) => [v.entita.id, v.nominata, v.ultimaVolta])).toEqual([
      ["serra", 3, "2026-10-16"],
      ["luca", 2, "2026-10-09"],
      ["mai", 0, null],
    ]);
  });

  it("la pagina dell'entità: un paragrafo per riferimento, per giorno dal più recente (RB-124)", () => {
    const p = paginaEntita("luca2", note, entita, titolo)!;
    expect(p.entita.id).toBe("luca");
    expect(p.giorni).toHaveLength(1);
    expect(p.giorni[0].passaggi.map((x) => x.testo)).toEqual([
      'Chiamata con <cita e="luca">Luca Bianchi</cita>: <area id="x" s="st1">il preventivo della <cita e="serra">Serra</cita></area id="x"> arriva.',
      '- voce con <cita e="luca2">Luca</cita>',
    ]);
    expect(paginaEntita("mai", note, entita, titolo)?.giorni).toEqual([]);
  });

  it("il paragrafo si ferma alle righe vuote e alle righe che stanno a sé", () => {
    expect(paragrafo("a\nb\n\nc\n# t", 1)).toEqual({ da: 0, testo: "a\nb" });
    expect(paragrafo("a\n# titolo\nb", 3)).toEqual({ da: 2, testo: "# titolo" });
  });

  it("il Calendario: i giorni del mese con una nota in Brainet, anche quello scelto (RB-113)", () => {
    expect([...giorniDelCalendario("2026-10", note)].sort()).toEqual(["2026-10-09", "2026-10-16"]);
    expect([...giorniDelCalendario("2026-09", note)]).toEqual(["2026-09-30"]);
  });
});
