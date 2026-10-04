import { describe, expect, it } from "vitest";
import type { RisultatoRicerca } from "./api";
import {
  dettagliRisultato,
  divisioneEstratto,
  intervallo,
  nomeFiltroTag,
  nomePeriodo,
  stessoPeriodo,
} from "./ricerca";

const risultato = (altro: Partial<RisultatoRicerca> = {}): RisultatoRicerca => ({
  id: "1",
  titolo: "Rilascio",
  estratto: "…il rilascio è fissato…",
  evidenza: [4, 12],
  cartella: "Lavoro/Clienti",
  data: "2026-09-25T09:12:00Z",
  nelCestino: false,
  ...altro,
});

describe("periodi dei filtri di data (DEC-95)", () => {
  const adesso = new Date(2026, 8, 30, 15, 20);

  it("partono dalla mezzanotte locale e restano aperti in fondo", () => {
    expect(intervallo("oggi", adesso)).toEqual({
      da: new Date(2026, 8, 30).toISOString(),
      a: null,
    });
    expect(intervallo("7", adesso).da).toBe(new Date(2026, 8, 24).toISOString());
    expect(intervallo("30", adesso).da).toBe(new Date(2026, 8, 1).toISOString());
    expect(intervallo("anno", adesso).da).toBe(new Date(2026, 0, 1).toISOString());
  });

  it("un giorno scelto va dalla mezzanotte all'ultimo millisecondo", () => {
    const { da, a } = intervallo({ giorno: "2026-09-12" });
    expect(da).toBe(new Date(2026, 8, 12).toISOString());
    expect(new Date(a!).getTime()).toBe(new Date(2026, 8, 13).getTime() - 1);
  });

  it("hanno i nomi delle pillole", () => {
    expect(nomePeriodo("7")).toBe("ultimi 7 giorni");
    expect(nomePeriodo("anno")).toBe("quest'anno");
    expect(nomePeriodo({ giorno: "2026-09-12" })).toBe("12/09/2026");
    expect(stessoPeriodo({ giorno: "2026-09-12" }, { giorno: "2026-09-12" })).toBe(true);
    expect(stessoPeriodo("7", "30")).toBe(false);
  });
});

describe("testi dei risultati", () => {
  it("pillola del filtro Tag", () => {
    expect(nomeFiltroTag([])).toBe("Tag");
    expect(nomeFiltroTag(["lavoro"])).toBe("Tag: lavoro");
    expect(nomeFiltroTag(["lavoro", "clienti"])).toBe("Tag: 2");
  });

  it("cartella e data", () => {
    expect(dettagliRisultato(risultato())).toMatch(/^Lavoro › Clienti · \d\d\/09\/2026$/);
    expect(dettagliRisultato(risultato({ cartella: "", data: "2026-09-12" }))).toBe(
      "CLOUD · 12/09/2026",
    );
  });

  it("l'evidenza conta i caratteri, anche con emoji e «…»", () => {
    expect(divisioneEstratto(risultato())).toEqual(["…il ", "rilascio", " è fissato…"]);
    expect(divisioneEstratto(risultato({ estratto: "🏖️ mare", evidenza: [3, 7] }))).toEqual([
      "🏖️ ",
      "mare",
      "",
    ]);
    expect(divisioneEstratto(risultato({ evidenza: null }))[0]).toBe("…il rilascio è fissato…");
  });
});
