import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Nota, VoceElenco } from "@memodu/condiviso";
import { api } from "../api";
import { FinestraPrincipale } from "./FinestraPrincipale";

vi.mock("../api", () => ({
  api: { elenca: vi.fn(), leggi: vi.fn(), crea: vi.fn(), salva: vi.fn() },
}));

const nota = (id: string, titolo: string, contenuto = ""): Nota => ({
  id,
  titolo,
  contenuto,
  creata: "2026-09-28T08:00:00Z",
  modificata: "2026-09-28T08:00:00Z",
});
const voce = (id: string, titolo: string, anteprima = ""): VoceElenco => ({
  id,
  titolo,
  anteprima,
  modificata: "2026-09-28T08:00:00Z",
});

beforeEach(() => vi.resetAllMocks());

describe("SC-01 ridotta, primo utilizzo (SF-16)", () => {
  it("mostra lo stato vuoto nell'area e nella colonna", async () => {
    vi.mocked(api.elenca).mockResolvedValue([]);
    render(<FinestraPrincipale />);
    expect(await screen.findByText("Nessuna nota, per ora.")).toBeInTheDocument();
    expect(screen.getByText("Inizia a scrivere.")).toBeInTheDocument();
    expect(screen.getByText("Le note che scrivi compaiono qui.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Note/ })).toHaveTextContent("0");
  });

  it("Nuova nota crea una nota vuota, la apre e la mette nell'elenco (FL-09, RB-10)", async () => {
    vi.mocked(api.elenca)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([voce("n1", "")]);
    vi.mocked(api.crea).mockResolvedValue(nota("n1", ""));
    render(<FinestraPrincipale />);
    await screen.findByText("Nessuna nota, per ora.");
    await userEvent.click(
      within(screen.getByRole("main")).getByRole("button", { name: "Nuova nota" }),
    );
    expect(api.crea).toHaveBeenCalledWith({});
    const riga = await screen.findByRole("button", { name: "Nota vuota" });
    expect(riga).toHaveAttribute("aria-current", "true");
  });
});

describe("SC-01 ridotta con note", () => {
  const elenco = [voce("a", "Lista della spesa"), voce("b", "", "prime parole"), voce("c", "")];

  it("elenca le note nell'ordine dell'API, con anteprima e «Nota vuota» (RB-15, RB-60)", async () => {
    vi.mocked(api.elenca).mockResolvedValue(elenco);
    vi.mocked(api.leggi).mockResolvedValue(nota("a", "Lista della spesa"));
    render(<FinestraPrincipale />);
    const lista = await screen.findByRole("list");
    const righe = within(lista)
      .getAllByRole("button")
      .map((r) => r.textContent);
    expect(righe).toEqual(["Lista della spesa", "prime parole", "Nota vuota"]);
  });

  it("apre la nota più recente all'avvio e un'altra al clic", async () => {
    vi.mocked(api.elenca).mockResolvedValue(elenco);
    vi.mocked(api.leggi).mockImplementation(async (id) =>
      id === "a" ? nota("a", "Lista della spesa") : nota("b", "", "prime parole"),
    );
    render(<FinestraPrincipale />);
    expect(await screen.findByRole("heading", { name: "Lista della spesa" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "prime parole" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "prime parole" })).toHaveAttribute(
        "aria-current",
        "true",
      ),
    );
  });

  it("il + ha il suggerimento «Nuova nota» e la sezione si chiude dal titolo", async () => {
    vi.mocked(api.elenca).mockResolvedValue(elenco);
    vi.mocked(api.leggi).mockResolvedValue(nota("a", "Lista della spesa"));
    render(<FinestraPrincipale />);
    await screen.findByRole("list");
    await userEvent.hover(screen.getByRole("button", { name: "Nuova nota" }));
    expect(await screen.findByRole("tooltip", {}, { timeout: 1000 })).toHaveTextContent(
      "Nuova nota",
    );
    await userEvent.click(screen.getByRole("button", { name: /Note/ }));
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
