import { render, screen } from "@testing-library/react";
import { Bold } from "lucide-react";
import { describe, expect, it } from "vitest";
import { Pillola } from "./Pillola";

describe("CMP-10 Pillola", () => {
  it("resta dentro la finestra anche con la selezione vicino al bordo", () => {
    render(
      <Pillola
        etichetta="Formattazione"
        strumenti={[{ tipo: "strumento", nome: "Grassetto", icona: Bold, azione: () => {} }]}
        x={window.innerWidth + 500}
        y={100}
        sotto={false}
        onEsci={() => {}}
      />,
    );
    const pillola = screen.getByRole("toolbar", { name: "Formattazione" });
    expect(parseFloat(pillola.style.left)).toBeLessThanOrEqual(window.innerWidth - 8);
  });
});
