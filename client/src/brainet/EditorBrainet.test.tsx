import { EditorView } from "@codemirror/view";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EditorBrainet } from "./EditorBrainet";
import { segnoApre, segnoChiude } from "./segni";

const LUCA = {
  id: "11111111-1111-4111-8111-111111111111",
  nome: "Luca Bianchi",
  tipo: "persona",
  foto: null,
};
const GIORGIO = {
  id: "22222222-2222-4222-8222-222222222222",
  nome: "Giorgio",
  tipo: null,
  foto: null,
};
const IMPORTANTE = {
  id: "33333333-3333-4333-8333-333333333333",
  nome: "Importante",
  colore: "avviso",
  ordine: 1,
};

vi.mock("./api", async (originale) => {
  const vero = await originale<typeof import("./api")>();
  return {
    ...vero,
    brainet: {
      suggerisciEntita: vi.fn(async (t: string) =>
        [LUCA, GIORGIO].filter((e) => e.nome.toLowerCase().includes(t.toLowerCase())),
      ),
      creaEntita: vi.fn(async (nome: string) => ({
        id: "44444444-4444-4444-8444-444444444444",
        nome,
        tipo: null,
        foto: null,
      })),
      leggiEntita: vi.fn(async (id: string) => [LUCA, GIORGIO].find((e) => e.id === id) ?? LUCA),
      elencaStati: vi.fn(async () => [IMPORTANTE]),
    },
  };
});

function apri(testo = "") {
  const onModifica = vi.fn();
  const { container } = render(<EditorBrainet testo={testo} onModifica={onModifica} focus />);
  const view = EditorView.findFromDOM(container.querySelector(".cm-editor") as HTMLElement)!;
  return { container, view, ultimo: () => onModifica.mock.calls.slice(-1)[0]?.[0] as string };
}

function scrivi(view: EditorView, testo: string) {
  act(() => {
    view.focus();
    const fine = view.state.doc.length;
    view.dispatch({
      changes: { from: fine, insert: testo },
      selection: { anchor: fine + testo.length },
      userEvent: "input",
    });
  });
}

beforeEach(() => vi.clearAllMocks());

describe("EditorBrainet (RF-18)", () => {
  it("@ apre i suggerimenti per tipo; Invio sceglie e il nome diventa una pillola (CA-18.3)", async () => {
    const { container, view, ultimo } = apri();
    scrivi(view, "Chiamata con @lu");
    expect(await screen.findByText("Persone")).toBeInTheDocument();
    expect(screen.getByText("Luca Bianchi")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Enter" });
    await waitFor(() =>
      expect(container.querySelector(".bn-collegamento")?.textContent).toBe("Luca Bianchi"),
    );
    expect(ultimo()).toBe(`Chiamata con <cita e="${LUCA.id}">Luca Bianchi</cita> `);
  });

  it("Crea fa nascere l'entità senza tipo e la pillola entra subito (CA-18.4)", async () => {
    const { view, ultimo } = apri();
    scrivi(view, "pranzo con @Mario");
    fireEvent.click(await screen.findByText("Crea «Mario»"));
    await waitFor(() =>
      expect(ultimo()).toContain('<cita e="44444444-4444-4444-8444-444444444444">Mario</cita>'),
    );
  });

  it("Esc chiude il menu di @ senza scegliere", async () => {
    const { view } = apri();
    scrivi(view, "@lu");
    await screen.findByText("Luca Bianchi");
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("selezionando una frase si apre il menu dell'area; uno stato la crea (CA-18.6)", async () => {
    const { container, view, ultimo } = apri("il preventivo arriva");
    act(() => view.dispatch({ selection: { anchor: 3, head: 13 } }));
    fireEvent.mouseUp(container.querySelector(".editor-brainet")!);
    fireEvent.click(await screen.findByText("Importante"));
    await waitFor(() =>
      expect(ultimo()).toMatch(
        /^il <area id="[^"]+" s="33333333-3333-4333-8333-333333333333">preventivo<\/area id="[^"]+"> arriva$/,
      ),
    );
    expect(container.querySelector(".bn-area")?.textContent).toBe("preventivo");
  });

  it("dalla freccia della linguetta si tolgono i legami; senza legami l'area sparisce (CA-18.7)", async () => {
    const testo = `il ${segnoApre("a1", [IMPORTANTE.id], [])}preventivo${segnoChiude("a1")} arriva`;
    const { container, ultimo } = apri(testo);
    fireEvent.mouseMove(container.querySelector(".bn-area")!);
    fireEvent.click(await screen.findByRole("button", { name: "Cambia stati ed entità" }));
    const voce = await screen.findByRole("menuitemcheckbox", { name: "Importante" });
    expect(voce).toHaveAttribute("aria-checked", "true");
    fireEvent.click(voce);
    await waitFor(() => expect(ultimo()).toBe("il preventivo arriva"));
  });
});
