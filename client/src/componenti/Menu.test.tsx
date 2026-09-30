import { fireEvent, render, screen } from "@testing-library/react";
import { Bold, List } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Menu, type VoceMenu } from "./Menu";

function apri(voci: VoceMenu[]) {
  const onChiudi = vi.fn();
  render(<Menu etichetta="Prova" voci={voci} x={10} y={10} onChiudi={onChiudi} />);
  return onChiudi;
}

describe("CMP-09 Menu", () => {
  it("si usa con frecce e Invio, saltando i separatori, e poi si chiude", () => {
    const prima = vi.fn();
    const seconda = vi.fn();
    const onChiudi = apri([
      { tipo: "voce", etichetta: "Prima", icona: Bold, azione: prima },
      { tipo: "separatore" },
      { tipo: "voce", etichetta: "Seconda", azione: seconda },
    ]);
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(prima).not.toHaveBeenCalled();
    expect(seconda).toHaveBeenCalled();
    expect(onChiudi).toHaveBeenCalled();
  });

  it("si chiude con Esc e con un clic fuori", () => {
    const onChiudi = apri([{ tipo: "voce", etichetta: "Voce" }]);
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.mouseDown(document.body);
    expect(onChiudi).toHaveBeenCalledTimes(2);
  });

  it("apre il sottomenu con la freccia destra e sceglie una sua voce", () => {
    const puntato = vi.fn();
    const onChiudi = apri([
      {
        tipo: "voce",
        etichetta: "Elenco",
        icona: List,
        sottomenu: [{ tipo: "voce", etichetta: "Elenco puntato", azione: puntato }],
      },
    ]);
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByRole("menu", { name: "Elenco" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(puntato).toHaveBeenCalled();
    expect(onChiudi).toHaveBeenCalled();
  });

  it("mostra icone, etichette e scorciatoie come voci del menu", () => {
    apri([{ tipo: "voce", etichetta: "Grassetto", icona: Bold, scorciatoia: "Ctrl + B" }]);
    expect(screen.getByRole("menuitem")).toHaveTextContent("GrassettoCtrl + B");
  });

  it("Invio senza voce evidenziata chiude il menu e non passa il tasto", () => {
    const onChiudi = apri([{ tipo: "voce", etichetta: "Voce", azione: vi.fn() }]);
    expect(fireEvent.keyDown(window, { key: "Enter" })).toBe(false);
    expect(onChiudi).toHaveBeenCalled();
  });

  it("nel menu «/» Invio senza voce evidenziata chiude e va a capo nel testo", () => {
    const azione = vi.fn();
    const onChiudi = vi.fn();
    render(
      <Menu
        etichetta="Inserisci"
        voci={[{ tipo: "voce", etichetta: "Voce", azione }]}
        x={10}
        y={10}
        onChiudi={onChiudi}
        invioAlTesto
      />,
    );
    expect(fireEvent.keyDown(window, { key: "Enter" })).toBe(true);
    expect(onChiudi).toHaveBeenCalled();
    expect(azione).not.toHaveBeenCalled();
  });
});
