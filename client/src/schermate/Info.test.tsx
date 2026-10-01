import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Nota, VoceTag } from "@memodu/condiviso";
import { Info, type TipoInfo } from "./Info";

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
  onTitolo: vi.fn(),
  onSpostaIn: vi.fn(),
  onChiudiNota: vi.fn(),
  onElimina: vi.fn(),
  onDettagli: vi.fn(),
  onAggiungiTag: vi.fn(),
  onTogliTag: vi.fn(),
  onEliminaTag: vi.fn(),
  onChiudi: vi.fn(),
});
let f: ReturnType<typeof funzioni>;
const apri = (n: Nota = nota, tipo: TipoInfo = "finestra") =>
  render(
    <Info
      tipo={tipo}
      nota={n}
      titolo={n.titolo}
      tutti={tutti}
      ancora={tipo === "comparsa" ? { x: 500, y: 36 } : undefined}
      {...f}
      onChiudiNota={tipo === "comparsa" ? f.onChiudiNota : undefined}
    />,
  );

/** Apre una riga di data (Data di creazione, Fine validità): al posto della frase il campo. */
const apriData = async (etichetta: string) => {
  await userEvent.click(screen.getByRole("button", { name: new RegExp(`^${etichetta}: `) }));
  return screen.getByRole("textbox", { name: etichetta });
};
/** «+ Tag» lascia il posto al campo per aggiungerne uno. */
const apriTag = async () => {
  await userEvent.click(screen.getByRole("button", { name: "Tag" }));
  return screen.getByRole("textbox", { name: "Aggiungi un tag" });
};

beforeEach(() => {
  f = funzioni();
});

describe("CMP-24 Info (DEC-96)", () => {
  it("una riga per cosa: cartella, creazione di sistema, fine validità, tag (CA-04.3, CA-04.5)", () => {
    apri();
    const finestra = screen.getByRole("dialog", { name: "Info di Budget 2026" });
    expect(within(finestra).getByText("Lavoro › Clienti")).toBeInTheDocument();
    const creata = within(finestra).getByRole("button", {
      name: "Data di creazione: Creata il 12/09/2026",
    });
    expect(creata.closest(".info-riga")).toHaveAttribute(
      "title",
      "Data di sistema: 12/09/2026 alle 10:14",
    );
    expect(within(finestra).getByText("Nessuna fine validità")).toBeInTheDocument();
    expect(within(finestra).getByText("riunioni")).toBeInTheDocument();
    expect(within(finestra).queryByRole("button", { name: "Ripristina" })).toBeNull();
  });

  it("con una data di creazione scelta, «Ripristina» torna a quella di sistema (DEC-97)", async () => {
    apri({ ...nota, creataScelta: "2020-01-01" });
    expect(
      screen.getByRole("button", { name: "Data di creazione: Creata il 01/01/2020" }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ripristina" }));
    expect(f.onDettagli).toHaveBeenCalledWith({ creataScelta: null });
  });

  it("aperta una riga di data, Esc la richiude con il calendario e poi chiude Info (DEC-97)", async () => {
    apri();
    await apriData("Fine validità");
    expect(screen.getByRole("dialog", { name: "Calendario" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("textbox", { name: "Fine validità" })).toBeNull();
    expect(screen.queryByRole("dialog", { name: "Calendario" })).toBeNull();
    expect(screen.getByRole("button", { name: /^Fine validità: / })).toHaveFocus();
    expect(f.onChiudi).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    expect(f.onChiudi).toHaveBeenCalledTimes(1);
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

  it("un clic fuori dalla finestra, sul velo, la chiude; un clic dentro no (DEC-81)", () => {
    apri();
    const finestra = screen.getByRole("dialog");
    fireEvent.mouseDown(finestra);
    expect(f.onChiudi).not.toHaveBeenCalled();
    fireEvent.mouseDown(finestra.parentElement!);
    expect(f.onChiudi).toHaveBeenCalledTimes(1);
  });

  it("una data scritta si salva con Invio (CA-04.3)", async () => {
    apri();
    const campo = await apriData("Data di creazione");
    await userEvent.type(campo, "01/01/2020{Enter}");
    expect(f.onDettagli).toHaveBeenCalledWith({ creataScelta: "2020-01-01" });
  });

  it("una data che non esiste: messaggio sotto il campo finché non è corretta (DEC-52)", async () => {
    apri();
    const fine = await apriData("Fine validità");
    await userEvent.type(fine, "30/02/2026{Enter}");
    const messaggio = screen.getByRole("alert");
    expect(messaggio).toHaveTextContent("Data non valida: scrivi GG/MM/AAAA");
    expect(fine).toHaveValue("30/02/2026");
    expect(fine).toHaveAttribute("aria-invalid", "true");
    expect(fine).toHaveAccessibleDescription("Data non valida: scrivi GG/MM/AAAA");
    await userEvent.clear(fine);
    await userEvent.type(fine, "28/02/2026");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(f.onDettagli).toHaveBeenCalledWith({ fineValidita: "2026-02-28" });
  });

  it("uscendo dal campo una data che non esiste torna com'era, senza messaggio (DEC-52)", async () => {
    apri();
    const fine = await apriData("Fine validità");
    await userEvent.type(fine, "abc{Enter}");
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await userEvent.tab();
    expect(fine).not.toBeInTheDocument();
    expect(screen.getByText("Nessuna fine validità")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(f.onDettagli).not.toHaveBeenCalled();
  });

  it("dal calendario «Nessuna data» toglie la fine validità (CA-04.4)", async () => {
    apri({ ...nota, fineValidita: "2026-01-31" });
    await apriData("Fine validità");
    await userEvent.click(screen.getByRole("button", { name: "Nessuna data" }));
    expect(f.onDettagli).toHaveBeenCalledWith({ fineValidita: null });
  });

  it("scrivendo compaiono i tag che contengono il testo e Invio sceglie il primo (CA-06.1)", async () => {
    apri();
    await userEvent.type(await apriTag(), "lav");
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
    await userEvent.type(await apriTag(), "/viaggi//estate/");
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
    await userEvent.type(await apriTag(), "lav");
    fireEvent.contextMenu(screen.getByRole("menuitem", { name: "lavoro" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Elimina tag…" }));
    const conferma = screen.getByRole("alertdialog", { name: "Eliminare il tag «lavoro»?" });
    expect(conferma).toHaveTextContent(
      "Lo usano 3 note: resteranno intatte, solo senza questo tag. Vengono eliminati anche i suoi sotto-tag.",
    );
    await userEvent.click(within(conferma).getByRole("button", { name: "Annulla" }));
    expect(f.onEliminaTag).not.toHaveBeenCalled();
    await userEvent.type(screen.getByRole("textbox", { name: "Aggiungi un tag" }), "o");
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

  it("dopo Canc su un tag il focus va su «+ Tag» e Esc chiude ancora (CA-06.6)", async () => {
    apri();
    screen.getByText("riunioni").focus();
    await userEvent.keyboard("{Delete}");
    expect(screen.getByRole("button", { name: "Tag" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    expect(f.onChiudi).toHaveBeenCalled();
  });

  it("Esc chiude anche se il focus è finito fuori dalla finestra", () => {
    apri();
    (document.activeElement as HTMLElement).blur();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(f.onChiudi).toHaveBeenCalled();
  });

  it("dopo Annulla nella conferma i suggerimenti sono chiusi (CA-06.4)", async () => {
    apri();
    await userEvent.type(await apriTag(), "lav");
    fireEvent.contextMenu(screen.getByRole("menuitem", { name: "lavoro" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Elimina tag…" }));
    await userEvent.click(screen.getByRole("button", { name: "Annulla" }));
    expect(screen.queryByRole("menu", { name: "Suggerimenti dei tag" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Aggiungi un tag" })).toHaveFocus();
  });

  it("Invio con i suggerimenti chiusi assegna il tag scritto (CA-06.1)", async () => {
    apri();
    await userEvent.type(await apriTag(), "lav");
    await userEvent.keyboard("{Escape}{Enter}");
    expect(f.onAggiungiTag).toHaveBeenCalledWith("lav");
    expect(f.onChiudi).not.toHaveBeenCalled();
  });

  it("aperta una riga di data il focus è nel campo; ↓ passa al calendario, Esc torna nel campo (CMP-12)", async () => {
    apri();
    const campo = await apriData("Fine validità");
    expect(campo).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(screen.getByRole("dialog", { name: "Calendario" })).toContainElement(
      document.activeElement as HTMLElement,
    );
    await userEvent.keyboard("{Escape}");
    expect(campo).toHaveFocus();
    expect(f.onChiudi).not.toHaveBeenCalled();
  });

  it("scelto un giorno dal calendario, la riga si chiude e il focus torna su di lei (CMP-12)", async () => {
    apri({ ...nota, fineValidita: "2026-01-31" });
    await apriData("Fine validità");
    await userEvent.click(screen.getByRole("gridcell", { name: /^giovedì 15 gennaio/ }));
    expect(f.onDettagli).toHaveBeenCalledWith({ fineValidita: "2026-01-15" });
    expect(screen.getByRole("button", { name: /^Fine validità: / })).toHaveFocus();
  });

  it("il cursore parte nel titolo; cambiandolo si avvisa subito, Invio chiude (CA-04.2, CA-04.7)", async () => {
    apri(nota, "comparsa");
    const campo = screen.getByRole("textbox", { name: "Titolo" });
    expect(campo).toHaveFocus();
    expect(campo).toHaveValue("Budget 2026");
    await userEvent.type(campo, "!");
    expect(f.onTitolo).toHaveBeenLastCalledWith("Budget 2026!");
    await userEvent.keyboard("{Enter}");
    expect(f.onChiudi).toHaveBeenCalledTimes(1);
  });

  it("in una finestra stretta la comparsa si restringe e resta a 8 da entrambi i lati", () => {
    const prima = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 300 });
    try {
      apri(nota, "comparsa");
      const info = screen.getByRole("dialog", { name: "Info di Budget 2026" });
      expect(info.style.width).toBe("284px");
      expect(info.style.left).toBe("8px");
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: prima });
    }
  });

  it("senza titolo il campo è vuoto con «Senza titolo» (RB-15)", () => {
    apri({ ...nota, titolo: "" }, "comparsa");
    const campo = screen.getByRole("textbox", { name: "Titolo" });
    expect(campo).toHaveValue("");
    expect(campo).toHaveAttribute("placeholder", "Senza titolo");
  });

  it("la Comparsa non ha velo né ✕ e ha Chiudi nota ed Elimina; un clic fuori la chiude (CA-04.8)", async () => {
    apri(nota, "comparsa");
    const info = screen.getByRole("dialog", { name: "Info di Budget 2026" });
    expect(info).not.toHaveAttribute("aria-modal");
    expect(within(info).queryByRole("button", { name: "Chiudi" })).toBeNull();
    await userEvent.click(within(info).getByRole("button", { name: /^Chiudi nota/ }));
    expect(f.onChiudiNota).toHaveBeenCalledTimes(1);
    await userEvent.click(within(info).getByRole("button", { name: "Elimina" }));
    expect(f.onElimina).toHaveBeenCalledTimes(1);
    fireEvent.mouseDown(document.body);
    expect(f.onChiudi).toHaveBeenCalledTimes(1);
  });

  it("la Finestra ha «Info» e la ✕, Elimina ma non Chiudi nota (CA-04.2, CA-04.8)", () => {
    apri();
    const info = screen.getByRole("dialog", { name: "Info di Budget 2026" });
    expect(info).toHaveAttribute("aria-modal", "true");
    expect(within(info).getByText("Info")).toBeInTheDocument();
    expect(within(info).queryByRole("button", { name: /^Chiudi nota/ })).toBeNull();
    expect(within(info).getByRole("button", { name: "Elimina" })).toBeInTheDocument();
  });

  it("«Sposta in…» passa il pulsante per aprire il pannello accanto (CA-04.5)", async () => {
    apri();
    await userEvent.click(
      screen.getByRole("button", { name: "Cartella Lavoro › Clienti: Sposta in…" }),
    );
    expect(f.onSpostaIn).toHaveBeenCalledTimes(1);
  });
});
