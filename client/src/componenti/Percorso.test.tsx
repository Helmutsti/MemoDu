import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Percorso } from "./Percorso";

const base = {
  infoAperta: false,
  onApriInfo: vi.fn(),
  onApriCartella: vi.fn(),
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("CMP-26 Percorso (DEC-71, DEC-96)", () => {
  it("mostra le cartelle e il titolo; una cartella si apre nella colonna", async () => {
    render(<Percorso {...base} cartella="Lavoro/Clienti" titolo="Rossi" />);
    const nav = screen.getByRole("navigation", { name: "Percorso della nota" });
    expect(nav).toHaveTextContent("LavoroClientiRossi");
    expect(screen.getByRole("button", { name: "Rossi", current: "page" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clienti" }));
    expect(base.onApriCartella).toHaveBeenCalledWith("Lavoro/Clienti");
  });

  it("una nota non organizzata mostra solo il titolo; senza titolo si legge «Senza titolo»", () => {
    render(<Percorso {...base} cartella="" titolo="" />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { current: "page" })).toHaveTextContent("Senza titolo");
  });

  it("con più di due cartelle quelle di mezzo diventano «…», che le elenca", async () => {
    render(<Percorso {...base} cartella="Lavoro/Clienti/Preventivi" titolo="Budget 2026" />);
    expect(screen.queryByRole("button", { name: "Clienti" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cartelle nascoste" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Clienti" }));
    expect(base.onApriCartella).toHaveBeenCalledWith("Lavoro/Clienti");
  });

  it("un clic sul titolo apre Info sotto di lui (CA-04.2)", async () => {
    const { rerender } = render(<Percorso {...base} cartella="" titolo="Budget" />);
    const titolo = screen.getByRole("button", { name: "Budget", current: "page" });
    expect(titolo).toHaveAttribute("aria-haspopup", "dialog");
    await userEvent.click(titolo);
    expect(base.onApriInfo).toHaveBeenCalledWith({ x: expect.any(Number), y: expect.any(Number) });
    rerender(<Percorso {...base} infoAperta cartella="" titolo="Budget" />);
    expect(titolo).toHaveAttribute("aria-expanded", "true");
  });

  it("passando sul titolo non compare niente (DEC-96, CMP-27 superata)", async () => {
    render(<Percorso {...base} cartella="Lavoro" titolo="Budget 2026" />);
    await userEvent.hover(screen.getByRole("button", { name: "Budget 2026", current: "page" }));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
