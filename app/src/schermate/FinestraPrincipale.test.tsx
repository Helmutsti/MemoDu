import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Albero, Cartella, ElementoCestino, Nota, VoceElenco } from "@memodu/condiviso";
import { api, ErroreApi } from "../api";
import { FinestraPrincipale } from "./FinestraPrincipale";

vi.mock("../api", async (originale) => ({
  ...(await originale<typeof import("../api")>()),
  api: {
    leggi: vi.fn(),
    crea: vi.fn(),
    salva: vi.fn(),
    eliminaSeVuota: vi.fn(),
    spostaNota: vi.fn(),
    albero: vi.fn(),
    creaCartella: vi.fn(),
    rinominaCartella: vi.fn(),
    spostaCartella: vi.fn(),
    cestinaNota: vi.fn(),
    cestinaCartella: vi.fn(),
    cestino: vi.fn(),
    ripristina: vi.fn(),
    eliminaDefinitivamente: vi.fn(),
    svuotaCestino: vi.fn(),
  },
}));

const nota = (id: string, titolo: string, contenuto = "", cartella = ""): Nota => ({
  id,
  titolo,
  contenuto,
  creata: "2026-09-28T08:00:00Z",
  modificata: "2026-09-28T08:00:00Z",
  cartella,
  creataScelta: null,
  fineValidita: null,
  tag: [],
});
const voce = (
  id: string,
  titolo: string,
  anteprima = "",
  modificata = "2026-09-28T08:00:00Z",
): VoceElenco => ({ id, titolo, anteprima, modificata });
const cartella = (
  percorso: string,
  note: VoceElenco[] = [],
  cartelle: Cartella[] = [],
): Cartella => ({
  nome: percorso.split("/").pop()!,
  percorso,
  conteggio: note.length + cartelle.reduce((s, c) => s + c.conteggio, 0),
  cartelle,
  note,
});
const albero = (note: VoceElenco[] = [], cartelle: Cartella[] = [], cestino = 0): Albero => ({
  nonOrganizzate: { conteggio: note.length, note },
  cartelle,
  cestino,
});

/** Lavoro con Clienti e Progetti e due note dentro, Personale, e una nota non organizzata. */
const alberoDiProva = () =>
  albero(
    [voce("r", "Riunione di lunedì", "", "2026-09-28T09:00:00Z")],
    [
      cartella(
        "Lavoro",
        [voce("b", "Budget 2026"), voce("f", "Riunione con i fornitori")],
        [cartella("Lavoro/Clienti", [voce("c", "Rossi")]), cartella("Lavoro/Progetti")],
      ),
      cartella("Personale"),
    ],
  );

const riga = (nome: string | RegExp) => screen.findByRole("treeitem", { name: nome });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.cestino).mockResolvedValue([]);
  // Di norma la nota lasciata non è vuota: l'API risponde 409 e non la cancella (DEC-39).
  vi.mocked(api.eliminaSeVuota).mockRejectedValue(new ErroreApi(409, "non vuota"));
});

describe("SC-01, primo utilizzo (SF-16)", () => {
  it("mostra lo stato vuoto nell'area, nelle non organizzate e nelle cartelle", async () => {
    vi.mocked(api.albero).mockResolvedValue(albero());
    render(<FinestraPrincipale />);
    expect(await screen.findByText("Nessuna nota, per ora.")).toBeInTheDocument();
    expect(screen.getByText("Le note che scrivi compaiono qui.")).toBeInTheDocument();
    expect(screen.getByText("Nessuna cartella. Creane una con +")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Non organizzate/ })).toHaveTextContent("0");
  });

  it("con delle cartelle ma nessuna nota non è il primo utilizzo: «Nessuna nota aperta» (RB-67)", async () => {
    vi.mocked(api.albero).mockResolvedValue(albero([], [cartella("Lavoro")]));
    render(<FinestraPrincipale />);
    expect(await screen.findByText("Nessuna nota aperta")).toBeInTheDocument();
    expect(screen.queryByText("Nessuna nota, per ora.")).not.toBeInTheDocument();
  });

  it("Nuova nota crea una nota vuota nella radice e la apre (FL-09, RB-09, RB-10)", async () => {
    vi.mocked(api.albero)
      .mockResolvedValueOnce(albero())
      .mockResolvedValue(albero([voce("n1", "")]));
    vi.mocked(api.crea).mockResolvedValue(nota("n1", ""));
    render(<FinestraPrincipale />);
    await screen.findByText("Nessuna nota, per ora.");
    await userEvent.click(
      within(screen.getByRole("main")).getByRole("button", { name: "Nuova nota" }),
    );
    expect(api.crea).toHaveBeenCalledWith({});
    expect(await riga("Nota vuota")).toHaveAttribute("aria-current", "true");
  });
});

describe("SC-01, non organizzate", () => {
  const elenco = [voce("a", "Lista della spesa"), voce("b", "", "prime parole"), voce("c", "")];

  it("elenca le note nell'ordine dell'API, con anteprima e «Nota vuota» (RB-15, RB-60)", async () => {
    vi.mocked(api.albero).mockResolvedValue(albero(elenco));
    vi.mocked(api.leggi).mockResolvedValue(nota("a", "Lista della spesa"));
    render(<FinestraPrincipale />);
    await riga("Lista della spesa");
    expect(screen.getAllByRole("treeitem").map((r) => r.textContent)).toEqual([
      "Lista della spesa",
      "prime parole",
      "Nota vuota",
    ]);
  });

  it("apre la nota più recente all'avvio e un'altra al clic", async () => {
    vi.mocked(api.albero).mockResolvedValue(
      albero([
        voce("a", "Lista della spesa", "", "2026-09-28T09:00:00Z"),
        voce("b", "", "prime parole"),
      ]),
    );
    vi.mocked(api.leggi).mockImplementation(async (id) =>
      id === "a" ? nota("a", "Lista della spesa") : nota("b", "", "prime parole"),
    );
    render(<FinestraPrincipale />);
    expect(await screen.findByDisplayValue("Lista della spesa")).toBeInTheDocument();
    await userEvent.click(await riga("prime parole"));
    await waitFor(async () =>
      expect(await riga("prime parole")).toHaveAttribute("aria-current", "true"),
    );
  });

  it("una nota lasciata vuota sparisce: aprendo un'altra nota si chiede di cancellarla (RB-10, DEC-39)", async () => {
    vi.mocked(api.albero)
      .mockResolvedValueOnce(
        albero([voce("v", "", "", "2026-09-28T09:00:00Z"), voce("a", "Lista")]),
      )
      .mockResolvedValue(albero([voce("a", "Lista")]));
    vi.mocked(api.leggi).mockImplementation(async (id) =>
      id === "v" ? nota("v", "") : nota("a", "Lista"),
    );
    vi.mocked(api.eliminaSeVuota).mockResolvedValue(undefined);
    render(<FinestraPrincipale />);
    await riga("Nota vuota");
    await userEvent.click(await riga("Lista"));
    expect(api.eliminaSeVuota).toHaveBeenCalledWith("v", undefined);
    await waitFor(() =>
      expect(screen.queryByRole("treeitem", { name: "Nota vuota" })).not.toBeInTheDocument(),
    );
    expect(await screen.findByDisplayValue("Lista")).toBeInTheDocument();
  });

  it("il + ha il suggerimento «Nuova nota» e la sezione si chiude dal titolo", async () => {
    vi.mocked(api.albero).mockResolvedValue(albero(elenco));
    vi.mocked(api.leggi).mockResolvedValue(nota("a", "Lista della spesa"));
    render(<FinestraPrincipale />);
    await riga("Lista della spesa");
    await userEvent.hover(screen.getByRole("button", { name: "Nuova nota" }));
    expect(await screen.findByRole("tooltip", {}, { timeout: 1000 })).toHaveTextContent(
      "Nuova nota",
    );
    await userEvent.click(screen.getByRole("button", { name: /Non organizzate/ }));
    expect(screen.queryByRole("treeitem", { name: "Lista della spesa" })).not.toBeInTheDocument();
  });
});

describe("SC-01, cartelle (RF-05)", () => {
  beforeEach(() => {
    vi.mocked(api.albero).mockResolvedValue(alberoDiProva());
    vi.mocked(api.leggi).mockImplementation(async (id) =>
      id === "b" ? nota("b", "Budget 2026", "", "Lavoro") : nota("r", "Riunione di lunedì"),
    );
  });

  it("aprendo una cartella mostra sottocartelle, poi note, con i numeri (CA-05.1, CA-05.2)", async () => {
    render(<FinestraPrincipale />);
    const lavoro = await riga(/Lavoro/);
    expect(lavoro).toHaveTextContent("3");
    expect(lavoro).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(lavoro);
    const nomi = within(lavoro.closest("li")!)
      .getAllByRole("treeitem")
      .map((r) => r.textContent);
    expect(nomi).toEqual([
      "Lavoro3",
      "Clienti1",
      "Progetti0",
      "Budget 2026",
      "Riunione con i fornitori",
    ]);
    // Il titolo delle note si allinea al nome delle sottocartelle: 8 + 16 + 20.
    expect((await riga("Budget 2026")).style.paddingLeft).toContain("36px");
  });

  it("+ delle Cartelle apre il campo con «Nuova cartella»; Invio crea, Esc annulla (CA-05.5, RB-48)", async () => {
    vi.mocked(api.creaCartella).mockResolvedValue({ cartella: cartella("Idee"), daRisolvere: [] });
    render(<FinestraPrincipale />);
    await riga(/Lavoro/);
    await userEvent.click(screen.getByRole("button", { name: "Nuova cartella" }));
    expect(screen.getByRole("textbox", { name: "Nome della cartella" })).toHaveValue(
      "Nuova cartella",
    );
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("textbox", { name: "Nome della cartella" })).not.toBeInTheDocument();
    expect(api.creaCartella).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Nuova cartella" }));
    await userEvent.keyboard("Idee{Enter}");
    expect(api.creaCartella).toHaveBeenCalledWith("", "Idee", "chiedi");
  });

  it("un nome già usato apre la finestra con tre scelte (CA-05.7, RB-31)", async () => {
    vi.mocked(api.creaCartella)
      .mockRejectedValueOnce(new ErroreApi(409, "conflitto", "Personale"))
      .mockResolvedValue({ cartella: cartella("personale (2)"), daRisolvere: [] });
    render(<FinestraPrincipale />);
    await riga(/Lavoro/);
    await userEvent.click(screen.getByRole("button", { name: "Nuova cartella" }));
    await userEvent.keyboard("personale{Enter}");
    const finestra = await screen.findByRole("alertdialog", {
      name: "Esiste già «Personale» tra le cartelle",
    });
    expect(within(finestra).getByRole("button", { name: "Unisci" })).toBeInTheDocument();
    await userEvent.click(within(finestra).getByRole("button", { name: "Aggiungi un numero" }));
    await waitFor(() =>
      expect(api.creaCartella).toHaveBeenLastCalledWith("", "personale", "numero"),
    );
  });

  it("F2 rinomina la cartella in focus; Esc lascia il nome di prima (CA-05.6)", async () => {
    vi.mocked(api.rinominaCartella).mockResolvedValue({
      cartella: cartella("Ufficio"),
      daRisolvere: [],
    });
    render(<FinestraPrincipale />);
    (await riga(/Personale/)).focus();
    await userEvent.keyboard("{F2}");
    expect(screen.getByRole("textbox", { name: "Nome della cartella" })).toHaveValue("Personale");
    await userEvent.keyboard("{Escape}");
    expect(api.rinominaCartella).not.toHaveBeenCalled();
    (await riga(/Personale/)).focus();
    await userEvent.keyboard("{F2}Ufficio{Enter}");
    expect(api.rinominaCartella).toHaveBeenCalledWith("Personale", "Ufficio", "chiedi");
  });

  it("chiuso il campo nome con Esc o Invio, il focus torna sulla riga della cartella (CA-05.11)", async () => {
    vi.mocked(api.rinominaCartella).mockResolvedValue({
      cartella: cartella("Ufficio"),
      daRisolvere: [],
    });
    render(<FinestraPrincipale />);
    (await riga(/Personale/)).focus();
    await userEvent.keyboard("{F2}{Escape}");
    await waitFor(async () => expect(await riga(/Personale/)).toHaveFocus());
    vi.mocked(api.albero).mockResolvedValue(
      albero(alberoDiProva().nonOrganizzate.note, [
        alberoDiProva().cartelle[0]!,
        cartella("Ufficio"),
      ]),
    );
    await userEvent.keyboard("{F2}Ufficio{Enter}");
    await waitFor(async () => expect(await riga(/Ufficio/)).toHaveFocus());
  });

  it("dopo un clic altrove il focus resta dove si è cliccato", async () => {
    render(<FinestraPrincipale />);
    (await riga(/Personale/)).focus();
    await userEvent.keyboard("{F2}");
    await userEvent.click(await riga("Riunione di lunedì"));
    await waitFor(async () => expect(await riga("Riunione di lunedì")).toHaveFocus());
  });

  it("una cartella vuota aperta non aggiunge un elenco vuoto sotto la riga", async () => {
    render(<FinestraPrincipale />);
    const personale = await riga(/Personale/);
    await userEvent.click(personale);
    expect(personale).toHaveAttribute("aria-expanded", "true");
    expect(personale.nextElementSibling).toBeNull();
  });

  it("frecce destra e sinistra aprono e chiudono la cartella in focus (CA-05.11)", async () => {
    render(<FinestraPrincipale />);
    (await riga(/Lavoro/)).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(await riga(/Lavoro/)).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{ArrowDown}");
    expect(await riga(/Clienti/)).toHaveFocus();
    (await riga(/Lavoro/)).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(await riga(/Lavoro/)).toHaveAttribute("aria-expanded", "false");
  });

  it("tasto destro su una cartella → Nuova nota qui crea la nota lì (CA-05.9, RB-09)", async () => {
    vi.mocked(api.crea).mockResolvedValue(nota("n", "", "", "Personale"));
    render(<FinestraPrincipale />);
    fireEvent.contextMenu(await riga(/Personale/));
    await userEvent.click(screen.getByRole("menuitem", { name: "Nuova nota qui" }));
    expect(api.crea).toHaveBeenCalledWith({ cartella: "Personale" });
  });

  it("trascinando una nota su una cartella la sposta; una cartella non entra in sé stessa (CA-05.3, CA-05.8)", async () => {
    vi.mocked(api.spostaNota).mockResolvedValue(nota("r", "Riunione di lunedì", "", "Personale"));
    render(<FinestraPrincipale />);
    const dati = { setData: vi.fn(), dropEffect: "", effectAllowed: "" };
    fireEvent.dragStart(await riga("Riunione di lunedì"), { dataTransfer: dati });
    expect(await screen.findByText("Trascina qui per eliminare")).toBeInTheDocument();
    const personale = await riga(/Personale/);
    fireEvent.dragOver(personale, { dataTransfer: dati });
    expect(personale).toHaveClass("riga-sopra");
    fireEvent.drop(personale, { dataTransfer: dati });
    await waitFor(() => expect(api.spostaNota).toHaveBeenCalledWith("r", "Personale"));

    await userEvent.click(await riga(/Lavoro/));
    fireEvent.dragStart(await riga(/Lavoro/), { dataTransfer: dati });
    const clienti = await riga(/Clienti/);
    fireEvent.dragOver(clienti, { dataTransfer: dati });
    expect(clienti).not.toHaveClass("riga-sopra");
    fireEvent.drop(clienti, { dataTransfer: dati });
    expect(api.spostaCartella).not.toHaveBeenCalled();
  });

  it("un errore dell'API mostra l'avviso e ricarica la colonna (CA-05.10)", async () => {
    vi.mocked(api.rinominaCartella).mockRejectedValue(new ErroreApi(404, "sparita"));
    render(<FinestraPrincipale />);
    (await riga(/Personale/)).focus();
    await userEvent.keyboard("{F2}Ufficio{Enter}");
    expect(
      await screen.findByText(
        "Non è stato possibile completare l'operazione. La colonna mostra com'è adesso.",
      ),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Ho capito" }));
    expect(screen.queryByRole("status", { name: "Errore" })).not.toBeInTheDocument();
  });

  it("un 422 non mostra l'avviso: la colonna si ricarica e basta (api.md)", async () => {
    vi.mocked(api.rinominaCartella).mockRejectedValue(new ErroreApi(422, "dentro sé stessa"));
    render(<FinestraPrincipale />);
    (await riga(/Personale/)).focus();
    await userEvent.keyboard("{F2}Ufficio{Enter}");
    await waitFor(() => expect(vi.mocked(api.albero).mock.calls.length).toBeGreaterThan(1));
    expect(
      screen.queryByText(
        "Non è stato possibile completare l'operazione. La colonna mostra com'è adesso.",
      ),
    ).not.toBeInTheDocument();
  });
});

describe("menu ··· e Sposta in (CA-05.4, CA-15.1)", () => {
  beforeEach(() => {
    vi.mocked(api.albero).mockResolvedValue(alberoDiProva());
    vi.mocked(api.leggi).mockResolvedValue(nota("r", "Riunione di lunedì"));
  });

  it("Sposta in sposta la nota aperta, che resta aperta, e apre la cartella (RB-66)", async () => {
    vi.mocked(api.spostaNota).mockResolvedValue(
      nota("r", "Riunione di lunedì", "", "Lavoro/Clienti"),
    );
    render(<FinestraPrincipale />);
    await screen.findByDisplayValue("Riunione di lunedì");
    await userEvent.click(screen.getByRole("button", { name: "Altre azioni" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Sposta in…" }));
    const pannello = screen.getByRole("dialog", { name: "Sposta in" });
    expect(within(pannello).getByRole("option", { name: /Non organizzate/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await userEvent.type(
      within(pannello).getByRole("combobox", { name: "Cerca una cartella" }),
      "cli",
    );
    expect(
      within(pannello)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["Lavoro", "Clienti"]);
    // Evidenziata è la cartella che corrisponde, non il suo antenato: Invio la sceglie.
    expect(within(pannello).getByRole("option", { name: "Clienti" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.click(within(pannello).getByRole("option", { name: "Clienti" }));
    await waitFor(() => expect(api.spostaNota).toHaveBeenCalledWith("r", "Lavoro/Clienti"));
    expect(screen.getByDisplayValue("Riunione di lunedì")).toBeInTheDocument();
    expect(await riga(/Lavoro/)).toHaveAttribute("aria-expanded", "true");
    expect(await riga(/Clienti/)).toHaveAttribute("aria-expanded", "true");
  });

  it("il tasto destro su una nota della colonna dà Dettagli, Sposta in ed Elimina, senza aprirla", async () => {
    vi.mocked(api.spostaNota).mockResolvedValue(nota("b", "Budget 2026", "", "Personale"));
    render(<FinestraPrincipale />);
    await screen.findByDisplayValue("Riunione di lunedì");
    await userEvent.click(await riga(/Lavoro/));
    fireEvent.contextMenu(await riga("Budget 2026"));
    expect(screen.getAllByRole("menuitem").map((v) => v.textContent)).toEqual([
      "Dettagli",
      "Sposta in…",
      "Elimina",
    ]);
    await userEvent.click(screen.getByRole("menuitem", { name: "Sposta in…" }));
    const pannello = screen.getByRole("dialog", { name: "Sposta in" });
    expect(within(pannello).getByRole("option", { name: /Lavoro/ })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await userEvent.click(within(pannello).getByRole("option", { name: "Personale" }));
    await waitFor(() => expect(api.spostaNota).toHaveBeenCalledWith("b", "Personale"));
    expect(screen.getByDisplayValue("Riunione di lunedì")).toBeInTheDocument();
  });

  it("il menu ··· ha Dettagli, Sposta in ed Elimina; il cestino si apre dalla riga in fondo (DEC-40, DEC-44)", async () => {
    vi.mocked(api.albero).mockResolvedValue({ ...alberoDiProva(), cestino: 2 });
    render(<FinestraPrincipale />);
    await screen.findByDisplayValue("Riunione di lunedì");
    expect(screen.getByRole("button", { name: /^Cestino/ })).toHaveTextContent("2");
    await userEvent.click(screen.getByRole("button", { name: "Altre azioni" }));
    expect(screen.getAllByRole("menuitem").map((v) => v.textContent)).toEqual([
      "Dettagli",
      "Sposta in…",
      "Elimina",
    ]);
  });

  it("Elimina manda la nota nel cestino senza conferma e mostra lo stato vuoto (RB-26, RB-67)", async () => {
    vi.mocked(api.cestinaNota).mockResolvedValue({
      id: "e",
      tipo: "nota",
      nome: "Riunione di lunedì",
      provenienza: "",
      eliminato: "2026-09-28T10:00:00Z",
    });
    render(<FinestraPrincipale />);
    await screen.findByDisplayValue("Riunione di lunedì");
    await userEvent.click(screen.getByRole("button", { name: "Altre azioni" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Elimina" }));
    expect(api.cestinaNota).toHaveBeenCalledWith("r");
    expect(await screen.findByText("Nessuna nota aperta")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Altre azioni" })).not.toBeInTheDocument();
  });
});

describe("SC-04 Cestino (RF-15)", () => {
  const elementi: ElementoCestino[] = [
    {
      id: "e1",
      tipo: "nota",
      nome: "Idee scartate",
      provenienza: "Lavoro/Clienti",
      eliminato: "2026-09-24T10:00:00Z",
    },
    {
      id: "e2",
      tipo: "cartella",
      nome: "Vecchi progetti",
      provenienza: "",
      eliminato: "2026-09-20T10:00:00Z",
      conteggio: 1,
    },
  ];

  beforeEach(() => {
    vi.mocked(api.albero).mockResolvedValue(alberoDiProva());
    vi.mocked(api.leggi).mockResolvedValue(nota("r", "Riunione di lunedì"));
    vi.mocked(api.cestino).mockResolvedValue(elementi);
  });

  const apriCestino = async () => {
    render(<FinestraPrincipale />);
    await screen.findByDisplayValue("Riunione di lunedì");
    await userEvent.click(screen.getByRole("button", { name: /^Cestino/ }));
    await screen.findByRole("heading", { name: "Cestino" });
  };

  it("mostra gli elementi con tipo, provenienza e data (CA-15.4)", async () => {
    await apriCestino();
    expect(
      screen.getByText("Nota · da Lavoro › Clienti · eliminata il 24/09/2026"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cartella con 1 nota · dalle cartelle · eliminata il 20/09/2026"),
    ).toBeInTheDocument();
  });

  it("con il cestino aperto, il clic sulla nota già aperta torna alla nota", async () => {
    await apriCestino();
    await userEvent.click(await riga("Riunione di lunedì"));
    expect(await screen.findByDisplayValue("Riunione di lunedì")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Cestino" })).not.toBeInTheDocument();
  });

  it("con il cestino aperto, un elemento eliminato dalla colonna compare subito", async () => {
    const personale: ElementoCestino = {
      id: "e3",
      tipo: "cartella",
      nome: "Personale",
      provenienza: "",
      eliminato: "2026-09-29T10:00:00Z",
      conteggio: 0,
    };
    vi.mocked(api.cestinaCartella).mockResolvedValue(personale);
    await apriCestino();
    vi.mocked(api.cestino).mockResolvedValue([personale, ...elementi]);
    fireEvent.contextMenu(await riga(/Personale/));
    await userEvent.click(screen.getByRole("menuitem", { name: "Elimina" }));
    expect(
      await screen.findByText("Cartella con 0 note · dalle cartelle · eliminata il 29/09/2026"),
    ).toBeInTheDocument();
  });

  it("Ripristina riporta l'elemento (CA-15.5, RB-28)", async () => {
    vi.mocked(api.ripristina).mockResolvedValue(nota("x", "Idee scartate"));
    await apriCestino();
    await userEvent.click(screen.getAllByRole("button", { name: "Ripristina" })[0]!);
    expect(api.ripristina).toHaveBeenCalledWith("e1");
  });

  it("Elimina definitivamente e Svuota chiedono conferma (CA-15.6, CA-15.7)", async () => {
    await apriCestino();
    await userEvent.click(screen.getAllByRole("button", { name: "Elimina definitivamente" })[1]!);
    const elimina = screen.getByRole("alertdialog", {
      name: "Eliminare per sempre «Vecchi progetti»?",
    });
    expect(elimina).toHaveTextContent("La cartella e la sua nota verranno eliminate per sempre.");
    await userEvent.click(within(elimina).getByRole("button", { name: "Annulla" }));
    expect(api.eliminaDefinitivamente).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Svuota cestino" }));
    const svuota = screen.getByRole("alertdialog", { name: "Svuotare il cestino?" });
    expect(svuota).toHaveTextContent("2 elementi verranno eliminati per sempre.");
    vi.mocked(api.cestino).mockResolvedValue([]);
    await userEvent.click(within(svuota).getByRole("button", { name: "Svuota" }));
    expect(api.svuotaCestino).toHaveBeenCalled();
    expect(await screen.findByText("Il cestino è vuoto")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Svuota cestino" })).not.toBeInTheDocument();
  });
});

describe("SC-07 quando l'API non risponde (RB-61, CA-01.7, CA-02.13)", () => {
  it("all'avvio mostra il blocco e Riprova carica le note", async () => {
    vi.mocked(api.albero)
      .mockRejectedValueOnce(new Error("spento"))
      .mockResolvedValue(albero([voce("a", "Lista della spesa")]));
    vi.mocked(api.leggi).mockResolvedValue(nota("a", "Lista della spesa"));
    render(<FinestraPrincipale />);
    expect(await screen.findByText("Memodu non riesce a collegarsi")).toBeInTheDocument();
    expect(
      screen.getByText("Il server delle note non risponde. Avvialo e premi Riprova."),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Riprova" }));
    expect(await screen.findByDisplayValue("Lista della spesa")).toBeInTheDocument();
    expect(screen.queryByText("Memodu non riesce a collegarsi")).not.toBeInTheDocument();
  });

  it("se Riprova non riesce, il blocco resta", async () => {
    vi.mocked(api.albero).mockRejectedValue(new Error("spento"));
    render(<FinestraPrincipale />);
    await userEvent.click(await screen.findByRole("button", { name: "Riprova" }));
    expect(await screen.findByText("Memodu non riesce a collegarsi")).toBeInTheDocument();
  });

  it("un salvataggio fallito blocca la finestra e Riprova salva il testo tenuto in memoria", async () => {
    vi.mocked(api.albero).mockResolvedValue(albero([voce("a", "Lista")]));
    vi.mocked(api.leggi).mockResolvedValue(nota("a", "Lista"));
    vi.mocked(api.salva)
      .mockRejectedValueOnce(new Error("spento"))
      .mockResolvedValue(nota("a", "Lista della spesa"));
    render(<FinestraPrincipale />);
    const titolo = await screen.findByDisplayValue("Lista");
    await userEvent.type(titolo, " della spesa");
    fireEvent.blur(window);
    expect(await screen.findByText("Memodu non riesce a collegarsi")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Riprova" }));
    await waitFor(() =>
      expect(api.salva).toHaveBeenLastCalledWith("a", { titolo: "Lista della spesa" }, undefined),
    );
    expect(screen.getByDisplayValue("Lista della spesa")).toBeInTheDocument();
  });
});

describe("nota eliminata da fuori mentre è aperta", () => {
  const nelCestino: ElementoCestino = {
    id: "a",
    tipo: "nota",
    nome: "Lista",
    provenienza: "",
    eliminato: "2026-09-29T10:00:00Z",
  };

  beforeEach(() => {
    vi.mocked(api.albero).mockResolvedValue(albero([voce("a", "Lista")]));
    vi.mocked(api.leggi).mockResolvedValue(nota("a", "Lista"));
  });

  it("nel cestino: la nota si chiude, Ripristina la riporta e salva il testo rimasto", async () => {
    vi.mocked(api.salva)
      .mockRejectedValueOnce(new ErroreApi(404, "nel cestino", undefined, "a"))
      .mockResolvedValue(nota("a", "Lista della spesa"));
    vi.mocked(api.cestino).mockResolvedValue([nelCestino]);
    vi.mocked(api.ripristina).mockResolvedValue(nota("a", "Lista"));
    render(<FinestraPrincipale />);
    await userEvent.type(await screen.findByDisplayValue("Lista"), " della spesa");
    fireEvent.blur(window);
    expect(await screen.findByText("La nota è nel cestino.")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Lista della spesa")).not.toBeInTheDocument();
    expect(screen.queryByText("Memodu non riesce a collegarsi")).not.toBeInTheDocument();

    vi.mocked(api.leggi).mockResolvedValue(nota("a", "Lista della spesa"));
    await userEvent.click(screen.getByRole("button", { name: "Ripristina" }));
    await waitFor(() => expect(api.ripristina).toHaveBeenCalledWith("a"));
    await waitFor(() =>
      expect(api.salva).toHaveBeenLastCalledWith("a", { titolo: "Lista della spesa" }),
    );
    expect(await screen.findByDisplayValue("Lista della spesa")).toBeInTheDocument();
    expect(screen.queryByText("La nota è nel cestino.")).not.toBeInTheDocument();
  });

  it("eliminata per sempre: avviso senza Ripristina", async () => {
    vi.mocked(api.salva).mockRejectedValue(new ErroreApi(404, "non c'è"));
    render(<FinestraPrincipale />);
    await userEvent.type(await screen.findByDisplayValue("Lista"), "!");
    fireEvent.blur(window);
    expect(await screen.findByText("La nota è stata eliminata.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ripristina" })).not.toBeInTheDocument();
  });
});
