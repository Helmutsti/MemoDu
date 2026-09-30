import { render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { SCORRIMENTO_DISCRETO, useBarraScorrimento } from "./BarraScorrimento";

function Area({ stato }: { stato: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useBarraScorrimento(ref);
  return <div ref={ref} data-testid="area" className={`area-${stato} ${SCORRIMENTO_DISCRETO}`} />;
}

describe("CMP-25 Barra di scorrimento (DEC-58)", () => {
  it("il cursore sta dentro l'area, così si muove e sparisce con lei (la colonna che si chiude)", () => {
    const { getByTestId } = render(<Area stato="aperta" />);
    expect(getByTestId("area").querySelector(".barra-scorrimento")).not.toBeNull();
  });

  it("cambiando stato l'area tiene nascosta la barra del sistema", () => {
    const { getByTestId, rerender } = render(<Area stato="aperta" />);
    rerender(<Area stato="chiusa" />);
    expect(getByTestId("area")).toHaveClass(SCORRIMENTO_DISCRETO);
    expect(getByTestId("area").querySelector(".barra-scorrimento")).not.toBeNull();
  });
});
