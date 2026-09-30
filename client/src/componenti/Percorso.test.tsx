import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Percorso } from "./Percorso";

const base = {
  modificata: "2026-09-30T09:42:00.000Z",
  tag: ["riunioni", "lavoro/clienti"],
  onTitolo: vi.fn(),
  onTornaAlTesto: vi.fn(),
  onApriCartella: vi.fn(),
};

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("CMP-26 Percorso (DEC-71)", () => {
  it("mostra le cartelle e il titolo; una cartella si apre nella colonna", async () => {
    render(<Percorso {...base} cartella="Lavoro/Clienti" titolo="Rossi" />);
    const nav = screen.getByRole("navigation", { name: "Percorso della nota" });
    expect(nav).toHaveTextContent("LavoroClienti");
    expect(screen.getByRole("textbox", { name: "Titolo della nota" })).toHaveValue("Rossi");
    await userEvent.click(screen.getByRole("button", { name: "Clienti" }));
    expect(base.onApriCartella).toHaveBeenCalledWith("Lavoro/Clienti");
  });

  it("una nota non organizzata mostra solo il titolo; senza titolo si legge «Senza titolo»", () => {
    render(<Percorso {...base} cartella="" titolo="" />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByRole("textbox", { name: "Titolo della nota" })).toHaveAttribute(
      "placeholder",
      "Senza titolo",
    );
  });

  it("con più di due cartelle quelle di mezzo diventano «…», che le elenca", async () => {
    render(<Percorso {...base} cartella="Lavoro/Clienti/Preventivi" titolo="Budget 2026" />);
    expect(screen.queryByRole("button", { name: "Clienti" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cartelle nascoste" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Clienti" }));
    expect(base.onApriCartella).toHaveBeenCalledWith("Lavoro/Clienti");
  });

  it("il titolo si scrive nel percorso; Invio torna al testo", async () => {
    render(<Percorso {...base} cartella="" titolo="Budget" />);
    const campo = screen.getByRole("textbox", { name: "Titolo della nota" });
    await userEvent.type(campo, " 2026{Enter}");
    expect(base.onTitolo).toHaveBeenLastCalledWith("Budget 2026");
    expect(base.onTornaAlTesto).toHaveBeenCalledTimes(1);
  });

  it("passando sul titolo, dopo 500 ms, compaiono ultima modifica e tag (CMP-27)", () => {
    vi.useFakeTimers();
    render(<Percorso {...base} cartella="Lavoro" titolo="Budget 2026" />);
    const campo = screen.getByRole("textbox", { name: "Titolo della nota" });
    fireEvent.mouseEnter(campo.closest("li")!);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(500));
    const comparsa = screen.getByRole("tooltip");
    expect(comparsa).toHaveTextContent(/^Modificata/);
    expect(comparsa).toHaveTextContent("riunioni");
    expect(comparsa).toHaveTextContent("lavoro/clienti");
    fireEvent.mouseLeave(campo.closest("li")!);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
