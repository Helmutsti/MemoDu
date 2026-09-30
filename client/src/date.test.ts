import { describe, expect, it } from "vitest";
import { leggiGiorno, scriviGiorno, testoCreata, testoModificata } from "./date";

const locale = (a: number, m: number, g: number, h: number, min: number) =>
  new Date(a, m - 1, g, h, min).toISOString();

describe("date nei testi (CA-04.1, RB-21)", () => {
  it("scrive l'ultima modifica di oggi con l'ora, le altre con giorno e ora", () => {
    const adesso = new Date(2026, 8, 29, 18, 0);
    expect(testoModificata(locale(2026, 9, 29, 11, 42), adesso)).toBe("Modificata oggi alle 11:42");
    expect(testoModificata(locale(2026, 9, 12, 10, 4), adesso)).toBe(
      "Modificata il 12/09/2026 alle 10:04",
    );
  });

  it("scrive la data di creazione di sistema", () => {
    expect(testoCreata(locale(2026, 9, 12, 10, 14))).toBe("Creata il 12/09/2026 alle 10:14");
  });

  it("legge e scrive i giorni del calendario", () => {
    expect(scriviGiorno("2026-09-12")).toBe("12/09/2026");
    expect(leggiGiorno("12/09/2026")).toBe("2026-09-12");
    expect(leggiGiorno("1.2.2020")).toBe("2020-02-01");
    expect(leggiGiorno("30/02/2026")).toBeNull();
    expect(leggiGiorno("domani")).toBeNull();
  });
});
