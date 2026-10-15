import { EditorView } from "@codemirror/view";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErroreApi } from "../api";
import { AVVISO_GRANDE, EditorBrainet } from "./EditorBrainet";
import { brainet } from "./api";
import { segnoAllegato, segnoApre, segnoChiude } from "./segni";

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

const PDF = {
  id: "55555555-5555-4555-8555-555555555555",
  nome: "Preventivo.pdf",
  tipo: "pdf",
  forma: "documento",
};
const FOTO = "66666666-6666-4666-8666-666666666666";

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
      allegaFile: vi.fn(async () => PDF),
      allegaDati: vi.fn(async () => PDF),
      leggiAllegato: vi.fn(async (id: string) =>
        id === PDF.id
          ? { nome: PDF.nome, tipo: "pdf", grandezza: 10, anteprima: null }
          : {
              nome: "cantiere.jpg",
              tipo: "jpg",
              grandezza: 10,
              anteprima: "data:image/jpeg;base64,AA",
            },
      ),
      apriAllegato: vi.fn(async () => undefined),
      mostraAllegato: vi.fn(async () => undefined),
    },
  };
});

function apri(testo = "", onAvviso = vi.fn()) {
  const onModifica = vi.fn();
  const { container } = render(
    <EditorBrainet testo={testo} onModifica={onModifica} onAvviso={onAvviso} focus />,
  );
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

  it("Backspace e frecce della tastiera trattano la pillola come un carattere solo (CA-18.5)", () => {
    const testo = `con <cita e="${LUCA.id}">Luca Bianchi</cita> `;
    const { container, view, ultimo } = apri(testo);
    act(() => {
      view.focus();
      view.dispatch({ selection: { anchor: testo.length } });
    });
    const cm = container.querySelector(".cm-content") as HTMLElement;
    fireEvent.keyDown(cm, { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 });
    fireEvent.keyDown(cm, { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 });
    expect(view.state.selection.main.head).toBe(4);
    act(() => view.dispatch({ selection: { anchor: testo.length - 1 } }));
    fireEvent.keyDown(cm, { key: "Backspace", code: "Backspace", keyCode: 8 });
    expect(ultimo()).toBe("con  ");
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

  it("in fondo al menu di @ c'è «Allega un file…»: il documento entra al posto di @ (CA-18.22)", async () => {
    const { container, view, ultimo } = apri();
    scrivi(view, "Ho mandato @");
    // Si aspettano i suggerimenti: il menu si ricompone quando arrivano.
    await screen.findByText("Luca Bianchi");
    fireEvent.click(screen.getByText("Allega un file…"));
    await waitFor(() =>
      expect(ultimo()).toBe(`Ho mandato ${segnoAllegato(PDF.id, "documento", PDF.nome)} `),
    );
    expect(brainet.allegaFile).toHaveBeenCalledWith();
    expect(container.querySelector(".bn-allegato-documento")?.textContent).toBe(PDF.nome);
  });

  it("un file oltre 25 MB non entra e l'avviso dice perché; il testo non cambia (CA-18.23)", async () => {
    vi.mocked(brainet.allegaFile).mockRejectedValueOnce(new ErroreApi(413, "Il file pesa 26 MB"));
    const onAvviso = vi.fn();
    const { view } = apri("", onAvviso);
    scrivi(view, "vedi @");
    // Si aspettano i suggerimenti: il menu si ricompone quando arrivano.
    await screen.findByText("Luca Bianchi");
    fireEvent.click(screen.getByText("Allega un file…"));
    await waitFor(() => expect(onAvviso).toHaveBeenCalledWith(AVVISO_GRANDE));
    expect(view.state.doc.toString()).toBe("vedi @");
  });

  it("il menu di un documento ha Apri, Mostra nella cartella e Togli, senza Dimensioni (CA-18.25, CA-18.26)", async () => {
    const { container, ultimo } = apri(`vedi ${segnoAllegato(PDF.id, "documento", PDF.nome)}`);
    const pillola = container.querySelector("[data-allegato]")!;
    fireEvent.mouseDown(pillola, { button: 0 });
    fireEvent.click(await screen.findByText("Apri"));
    expect(brainet.apriAllegato).toHaveBeenCalledWith(PDF.id);
    fireEvent.mouseDown(container.querySelector("[data-allegato]")!, { button: 0 });
    expect(await screen.findByText("Mostra nella cartella")).toBeInTheDocument();
    expect(screen.queryByText("Dimensioni")).toBeNull();
    fireEvent.click(screen.getByText("Togli"));
    await waitFor(() => expect(ultimo()).toBe("vedi "));
  });

  it("una foto piccola ha Dimensioni con la spunta su quella attuale; Grande la cambia (CA-18.25)", async () => {
    const { container, ultimo } = apri(
      `prima\n${segnoAllegato(FOTO, "piccola", "cantiere.jpg")}\n`,
    );
    await waitFor(() => expect(container.querySelector("img.bn-foto-piccola")).not.toBeNull());
    fireEvent.mouseDown(container.querySelector("[data-allegato]")!, { button: 0 });
    fireEvent.click(await screen.findByText("Dimensioni"));
    expect(await screen.findByRole("menuitemcheckbox", { name: "Piccola" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    fireEvent.click(screen.getByText("Grande"));
    await waitFor(() =>
      expect(ultimo()).toBe(`prima\n${segnoAllegato(FOTO, "grande", "cantiere.jpg")}\n`),
    );
  });

  it("un file trascinato da Esplora file si allega dove si lascia, non va in Locale (CA-18.22)", async () => {
    const { container, ultimo } = apri("Ho mandato");
    const zona = container.querySelector("[data-rilascio-proprio]")!;
    act(() => {
      zona.dispatchEvent(
        new CustomEvent("rilascio-file", {
          detail: { percorsi: ["C:\Documenti\Preventivo.pdf"], x: 0, y: 0 },
        }),
      );
    });
    await waitFor(() => expect(ultimo()).toContain(segnoAllegato(PDF.id, "documento", PDF.nome)));
    expect(brainet.allegaFile).toHaveBeenCalledWith("C:\Documenti\Preventivo.pdf");
  });
});
