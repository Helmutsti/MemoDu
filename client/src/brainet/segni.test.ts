import { describe, expect, it } from "vitest";
import {
  entitaDellArea,
  leggiSegni,
  segniFinti,
  segnoApre,
  segnoChiude,
  segnoCita,
  testoSemplice,
} from "./segni";

describe("segni di Brainet nel testo (RF-18)", () => {
  it("legge collegamenti e aree, anche sovrapposte, con le posizioni", () => {
    const testo = `a ${segnoApre("x", ["s1"], [])}uno ${segnoCita({ id: "e1", nome: "Luca" })}${segnoApre("y", [], ["e2"])} due${segnoChiude("x")} tre${segnoChiude("y")}`;
    const { citazioni, aree } = leggiSegni(testo);
    expect(citazioni).toEqual([expect.objectContaining({ entita: "e1", nome: "Luca" })]);
    expect(testo.slice(citazioni[0].da, citazioni[0].a)).toBe('<cita e="e1">Luca</cita>');
    expect(aree.map((a) => a.id)).toEqual(["x", "y"]);
    expect(aree[0].stati).toEqual(["s1"]);
    expect(entitaDellArea(aree[0], citazioni, testo.length)).toEqual(["e1"]);
    expect(testoSemplice(testo)).toBe("a uno Luca due tre");
  });

  it("un'area senza chiusura arriva fino in fondo", () => {
    expect(leggiSegni(`${segnoApre("x", ["s"], [])}fine`).aree[0].chiude).toBeNull();
  });

  it("il nome con < non rompe il segno", () => {
    expect(leggiSegni(segnoCita({ id: "e", nome: "a<b" })).citazioni).toHaveLength(1);
  });

  it("riconosce i segni finti da disinnescare", () => {
    expect(segniFinti("ciao <cita e e </area")).toEqual([5, 15]);
    expect(testoSemplice("&lt;cita")).toBe("<cita");
  });
});
