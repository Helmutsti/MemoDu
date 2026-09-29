import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Nota, VoceTag } from "@memodu/condiviso";
import { FinestraDettagli } from "./FinestraDettagli";

const nota: Nota = {
  id: "n1",
  titolo: "Budget 2026",
  contenuto: "",
  creata: new Date(2026, 8, 12, 10, 14).toISOString(),
  modificata: new Date(2026, 8, 12, 10, 14).toISOString(),
  cartella: "Lavoro/Clienti",
  creataScelta: null,
  fineValidita: null,
  tag: ["riunioni"],
};
const tutti: VoceTag[] = [
  { nome: "lavoro", note: 3 },
  { nome: "lavoro/fornitori", note: 2 },
  { nome: "riunioni", note: 1 },
];

const funzioni = () => ({
  onDettagli: vi.fn(),
  onAggiungiTag: vi.fn(),
  onTogliTag: vi.fn(),
  onEliminaTag: vi.fn(),
  onChiudi: vi.fn(),
});
let f: ReturnType<typeof funzioni>;
const apri = (n: Nota = nota) =>
  render(<FinestraDettagli nota={n} titolo={n.titolo} tutti={tutti} {...f} />);

beforeEach(() => {
  f = funzioni();
});

describe("CMP-24 Finestra dei dettagli", () => {
  it("mostra date, tag e cartella, con la data di creazione di sistema (CA-04.3, CA-04.5)", () => {
    apri();
    const finestra = screen.getByRole("dialog", { name: "Dettagli di Budget 2026" });
    expect(within(finestra).getByText("Creata il 12/09/2026 alle 10:14")).toBeInTheDocument();
    expect(within(finestra).getByText("Lavoro › Clienti")).toBeInTheDocument();
    expect(within(finestra).getByText("riunioni")).toBeInTheDocument();
  });

  it("una nota senza cartella è «Non organizzata» (CA-04.5)", () => {
    apri({ ...nota, cartella: "" });
    expect(screen.getByText("Non organizzata")).toBeInTheDocument();
  });

  it("Esc e ✕ chiudono (CA-04.2)", async () => {
    apri();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await userEvent.click(screen.getByRole("button", { name: "Chiudi" }));
    expect(f.onChiudi).toHaveBeenCalledTimes(2);
  });

  it("una data scritta si salva con Invio; una non valida torna com'era (CA-04.3)", async () => {
    apri();
    const campo = screen.getByRole("textbox", { name: "Data di creazione" });
    await userEvent.type(campo, "01/01/2020{Enter}");
    expect(f.onDettagli).toHaveBeenCalledWith({ creataScelta: "2020-01-01" });
    const fine = screen.getByRole("textbox", { name: "Fine validità" });
    await userEvent.type(fine, "30/02/2026{Enter}");
    expect(fine).toHaveValue("");
    expect(f.onDettagli).toHaveBeenCalledTimes(1);
  });

  it("dal calendario «Nessuna data» toglie la fine validità (CA-04.4)", async () => {
    apri({ ...nota, fineValidita: "2026-01-31" });
    await userEvent.click(
      screen.getByRole("button", { name: "Scegli fine validità dal calendario" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Nessuna data" }));
    expect(f.onDettagli).toHaveBeenCalledWith({ fineValidita: null });
  });

  it("scrivendo compaiono i tag che contengono il testo e Invio sceglie il primo (CA-06.1)", async () => {
    apri();
    await userEvent.type(screen.getByRole("textbox", { name: "Aggiungi un tag" }), "lav");
    const suggerimenti = screen.getByRole("menu", { name: "Suggerimenti dei tag" });
    expect(
      within(suggerimenti)
        .getAllByRole("menuitem")
        .map((v) => v.textContent),
    ).toEqual(["lavoro", "lavoro/fornitori", "Crea il tag «lav»"]);
    await userEvent.keyboard("{Enter}");
    expect(f.onAggiungiTag).toHaveBeenCalledWith("lavoro");
  });

  it("un tag nuovo si crea con i / corretti (CA-06.1, CA-06.5)", async () => {
    apri();
    await userEvent.type(
      screen.getByRole("textbox", { name: "Aggiungi un tag" }),
      "/viaggi//estate/",
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Crea il tag «viaggi/estate»" }));
    expect(f.onAggiungiTag).toHaveBeenCalledWith("viaggi/estate");
  });

  it("la ✕ toglie il tag dalla nota (CA-06.3)", async () => {
    apri();
    await userEvent.click(screen.getByRole("button", { name: "Togli il tag riunioni" }));
    expect(f.onTogliTag).toHaveBeenCalledWith("riunioni");
  });

  it("tasto destro su un suggerimento: Elimina tag… con la conferma e il numero di note (CA-06.4)", async () => {
    apri();
    await userEvent.type(screen.getByRole("textbox", { name: "Aggiungi un tag" }), "lav");
    fireEvent.contextMenu(screen.getByRole("menuitem", { name: "lavoro" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Elimina tag…" }));
    const conferma = screen.getByRole("alertdialog", { name: "Eliminare il tag «lavoro»?" });
    expect(conferma).toHaveTextContent(
      "Lo usano 3 note: resteranno intatte, solo senza questo tag. Vengono eliminati anche i suoi sotto-tag.",
    );
    await userEvent.click(within(conferma).getByRole("button", { name: "Annulla" }));
    expect(f.onEliminaTag).not.toHaveBeenCalled();
    fireEvent.contextMenu(screen.getByRole("menuitem", { name: "lavoro" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Elimina tag…" }));
    await userEvent.click(screen.getByRole("button", { name: "Elimina tag" }));
    expect(f.onEliminaTag).toHaveBeenCalledWith("lavoro");
  });

  it("con la tastiera Canc toglie il tag in focus (CA-06.6)", async () => {
    apri();
    screen.getByText("riunioni").focus();
    await userEvent.keyboard("{Delete}");
    expect(f.onTogliTag).toHaveBeenCalledWith("riunioni");
  });
});
