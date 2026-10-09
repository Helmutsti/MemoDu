import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { FormatoDove } from "../editor/formati";
import { Bollicina } from "./Bollicina";

const formato = (riga: FormatoDove["riga"], ...caratteri: string[]): FormatoDove => ({
  riga,
  caratteri: new Set(caratteri) as FormatoDove["caratteri"],
});

describe("CMP-10 Bollicina del formato (DEC-131)", () => {
  it("dice il formato dove sta il cursore (CA-02.4)", () => {
    const { rerender } = render(
      <Bollicina formato={formato("titolo", "grassetto")} lato="sinistra" onScegli={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Formato: titolo, grassetto" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    rerender(<Bollicina formato={formato("misto")} lato="sinistra" onScegli={() => {}} />);
    expect(screen.getByRole("button", { name: "Formato: righe diverse" })).toBeInTheDocument();
  });

  it("apre il cassetto con i formati in uso evidenziati, e resta aperto dopo una scelta (CA-02.21)", async () => {
    const onScegli = vi.fn();
    render(
      <Bollicina formato={formato("puntato", "corsivo")} lato="sinistra" onScegli={onScegli} />,
    );
    await userEvent.click(screen.getByRole("button", { name: /^Formato/ }));
    const cassetto = screen.getByRole("toolbar", { name: "Formato" });
    expect(screen.getByRole("button", { name: "Elenco puntato" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Corsivo" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Grassetto" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await userEvent.click(screen.getByRole("button", { name: "Grassetto" }));
    await userEvent.click(screen.getByRole("button", { name: "Rimuovi formattazione" }));
    expect(onScegli.mock.calls).toEqual([["grassetto"], ["rimuovi"]]);
    expect(cassetto).toBeInTheDocument();
  });

  it("si chiude con Esc, scrivendo, con un clic fuori e con un altro clic sulla bollicina", async () => {
    render(
      <>
        <p>fuori</p>
        <Bollicina formato={formato("testo")} lato="destra" onScegli={() => {}} />
      </>,
    );
    const bollicina = screen.getByRole("button", { name: "Formato: testo normale" });
    const aperto = () => screen.queryByRole("toolbar", { name: "Formato" });

    await userEvent.click(bollicina);
    const esc = fireEvent.keyDown(document.body, { key: "Escape" });
    expect(aperto()).toBeNull();
    // Esc chiude il cassetto e basta: la nota rapida non lo prende per sé.
    expect(esc).toBe(false);

    await userEvent.click(bollicina);
    fireEvent.keyDown(document.body, { key: "a" });
    expect(aperto()).toBeNull();

    await userEvent.click(bollicina);
    fireEvent.mouseDown(screen.getByText("fuori"));
    expect(aperto()).toBeNull();

    await userEvent.click(bollicina);
    await userEvent.click(bollicina);
    expect(aperto()).toBeNull();
  });

  it("un clic sulla bollicina non toglie il cursore dal testo", () => {
    render(<Bollicina formato={formato("testo")} lato="sinistra" onScegli={() => {}} />);
    const giu = fireEvent.mouseDown(screen.getByRole("button", { name: /^Formato/ }));
    expect(giu).toBe(false);
  });
});
