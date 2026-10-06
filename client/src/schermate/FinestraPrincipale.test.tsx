import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Albero, Cartella, ElementoCestino, Nota, VoceElenco } from "@memodu/condiviso";
import { api, ErroreApi } from "../api";
import type { EventoSincronizzazione } from "../finestra";
import { FinestraPrincipale } from "./FinestraPrincipale";

// Il gestore degli eventi della sincronizzazione, per mandarne uno nelle prove.
const sinc = vi.hoisted(() => ({ gestore: null as null | ((e: EventoSincronizzazione) => void) }));
vi.mock("../finestra", async (originale) => ({
  ...(await originale<typeof import("../finestra")>()),
  allaSincronizzazione: (gestore: (e: EventoSincronizzazione) => void) => {
    sinc.gestore = gestore;
    return () => {};
  },
}));

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
    cerca: vi.fn(),
    elencaTag: vi.fn(),
    impostazioni: vi.fn(),
    statoSincronizzazione: vi.fn(),
    statoAccesso: vi.fn(),
    accedi: vi.fn(),
    esci: vi.fn(),
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
/** Il titolo della nota aperta nel percorso (CMP-26): un pulsante che apre Info (DEC-96). */
const titoloNota = (nome: string) => screen.findByRole("button", { name: nome, current: "page" });
/** Apre Info dal titolo e la restituisce (CMP-24, tipo Comparsa). */
const apriInfo = async (titolo: string) => {
  await userEvent.click(await titoloNota(titolo));
  return screen.findByRole("dialog", { name: new RegExp(`^Info di`) });
};
/** Rinomina la nota aperta dal campo del titolo di Info (CA-04.7). */
const scriviTitolo = async (titolo: string, aggiunta: string) => {
  const info = await apriInfo(titolo);
  await userEvent.type(within(info).getByRole("textbox", { name: "Titolo" }), aggiunta);
};

/**
 * Trascinamento con il puntatore (DEC-120): preme sulla riga e si sposta oltre la soglia; `sopra`
 * e `rilascia` portano il puntatore su un elemento (jsdom non calcola elementFromPoint).
 */
function trascina(sorgente: HTMLElement) {
  let bersaglio: Element | null = null;
  document.elementFromPoint = () => bersaglio;
  fireEvent.pointerDown(sorgente, { button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerMove(document, { clientX: 30, clientY: 30 });
  return {
    sopra(el: Element) {
      bersaglio = el;
      fireEvent.pointerMove(document, { clientX: 40, clientY: 40 });
    },
    rilascia(el: Element) {
      bersaglio = el;
      fireEvent.pointerUp(document, { clientX: 40, clientY: 40 });
    },
  };
}

/** Il + di CLOUD, poi «Nuova cartella» nel menu Aggiungi (DEC-119). */
async function nuovaCartellaDalPiu() {
  await userEvent.click(await screen.findByRole("button", { name: "Aggiungi" }));
  await userEvent.click(screen.getByRole("menuitem", { name: "Nuova cartella" }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.cestino).mockResolvedValue([]);
  vi.mocked(api.elencaTag).mockResolvedValue([]);
  // Di norma la nota lasciata non è vuota: l'API risponde 409 e non la cancella (DEC-39).
  vi.mocked(api.eliminaSeVuota).mockRejectedValue(new ErroreApi(409, "non vuota"));
  vi.mocked(api.statoAccesso).mockResolvedValue({ email: "manuel@esempio.it" });
  vi.mocked(api.esci).mockResolvedValue(undefined);
  vi.mocked(api.statoSincronizzazione).mockResolvedValue({
    collegata: false,
    ultimaRiuscita: null,
    problema: null,
  });
});

describe("SC-01, primo utilizzo (SF-16)", () => {
  it("mostra lo stato vuoto nell'area e nella sezione CLOUD, senza numero (DEC-119)", async () => {
    vi.mocked(api.albero).mockResolvedValue(albero());
    render(<FinestraPrincipale />);
    expect(await screen.findByText("Nessuna nota, per ora.")).toBeInTheDocument();
    expect(screen.getByText("Nessuna nota. Crea con +")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Cloud/ })).toHaveTextContent(/^Cloud$/);
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
    expect(await titoloNota("Lista della spesa")).toBeInTheDocument();
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
    expect(api.eliminaSeVuota).toHaveBeenCalledWith("v");
    await waitFor(() =>
      expect(screen.queryByRole("treeitem", { name: "Nota vuota" })).not.toBeInTheDocument(),
    );
    expect(await titoloNota("Lista")).toBeInTheDocument();
  });

  it("il + di CLOUD apre Nuova nota e Nuova cartella; la sezione si chiude dal titolo (DEC-119)", async () => {
    vi.mocked(api.albero).mockResolvedValue(albero(elenco));
    vi.mocked(api.leggi).mockResolvedValue(nota("a", "Lista della spesa"));
    render(<FinestraPrincipale />);
    await riga("Lista della spesa");
    await userEvent.hover(screen.getByRole("button", { name: "Aggiungi" }));
    expect(await screen.findByRole("tooltip", {}, { timeout: 1000 })).toHaveTextContent("Aggiungi");
    await userEvent.click(screen.getByRole("button", { name: "Aggiungi" }));
    const menu = screen.getByRole("menu", { name: "Aggiungi" });
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((v) => v.textContent),
    ).toEqual(["Nuova nota", "Nuova cartella"]);
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: /^Cloud/ }));
    expect(screen.queryByRole("treeitem", { name: "Lista della spesa" })).not.toBeInTheDocument();
  });

  it("Ctrl + N crea una nuova nota nella radice, come il + (FL-09, DEC-69)", async () => {
    vi.mocked(api.albero).mockResolvedValue(albero(elenco));
    vi.mocked(api.leggi).mockResolvedValue(nota("a", "Lista della spesa"));
    render(<FinestraPrincipale />);
    await riga("Lista della spesa");
    await userEvent.keyboard("{Control>}n{/Control}");
    await waitFor(() => expect(api.crea).toHaveBeenCalledWith({}));
  });
});

describe("SC-01, cartelle (RF-05)", () => {
  beforeEach(() => {
    vi.mocked(api.albero).mockResolvedValue(alberoDiProva());
    vi.mocked(api.leggi).mockImplementation(async (id) =>
      id === "b" ? nota("b", "Budget 2026", "", "Lavoro") : nota("r", "Riunione di lunedì"),
    );
  });

  it("aprendo una cartella mostra prima le note, poi le sottocartelle, con i numeri (CA-05.1, CA-05.2, DEC-119)", async () => {
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
      "Budget 2026",
      "Riunione con i fornitori",
      "Clienti1",
      "Progetti0",
    ]);
    // Il titolo delle note si allinea al nome delle sottocartelle: 12 + 24 + 24 (DEC-100).
    expect((await riga("Budget 2026")).style.paddingLeft).toContain("2 * var(--spazio-rientro)");
    expect((await riga(/^Clienti/)).style.paddingLeft).toContain("1 * var(--spazio-rientro)");
  });

  it("la cartella ha l'icona chiusa o aperta al posto della freccia; le note e le sezioni no (DEC-99)", async () => {
    render(<FinestraPrincipale />);
    const lavoro = await riga(/Lavoro/);
    expect(lavoro.querySelector("svg.lucide-folder")).toBeInTheDocument();
    expect(lavoro.querySelector("svg.lucide-folder-open")).not.toBeInTheDocument();
    expect(lavoro.querySelector("svg.lucide-chevron-right")).not.toBeInTheDocument();
    await userEvent.click(lavoro);
    expect(lavoro.querySelector("svg.lucide-folder-open")).toBeInTheDocument();
    expect(lavoro.querySelector("svg.lucide-folder")).not.toBeInTheDocument();
    // Anche la cartella senza sottocartelle né note ha l'icona; le note no.
    expect((await riga(/Personale/)).querySelector("svg.lucide-folder")).toBeInTheDocument();
    expect((await riga("Budget 2026")).querySelector("svg")).not.toBeInTheDocument();
    // I titoli di sezione tengono la freccia.
    const cartelle = screen.getByRole("button", { name: /^Cloud/, expanded: true });
    expect(cartelle.querySelector("svg.lucide-chevron-down")).toBeInTheDocument();
    expect(cartelle.querySelector("svg.lucide-folder")).not.toBeInTheDocument();
  });

  it("il campo «Nuova cartella» ha l'icona della cartella chiusa (DEC-99)", async () => {
    vi.mocked(api.albero).mockResolvedValue(alberoDiProva());
    render(<FinestraPrincipale />);
    await nuovaCartellaDalPiu();
    const campo = screen.getByRole("textbox", { name: "Nome della cartella" });
    expect(campo.parentElement!.querySelector("svg.lucide-folder")).toBeInTheDocument();
  });

  it("Nuova cartella dal + di CLOUD apre il campo con «Nuova cartella»; Invio crea, Esc annulla (CA-05.5, RB-48)", async () => {
    vi.mocked(api.creaCartella).mockResolvedValue({ cartella: cartella("Idee"), daRisolvere: [] });
    render(<FinestraPrincipale />);
    await riga(/Lavoro/);
    await nuovaCartellaDalPiu();
    expect(screen.getByRole("textbox", { name: "Nome della cartella" })).toHaveValue(
      "Nuova cartella",
    );
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("textbox", { name: "Nome della cartella" })).not.toBeInTheDocument();
    expect(api.creaCartella).not.toHaveBeenCalled();

    await nuovaCartellaDalPiu();
    await userEvent.keyboard("Idee{Enter}");
    expect(api.creaCartella).toHaveBeenCalledWith("", "Idee", "chiedi");
  });

  it("un nome già usato apre la finestra con tre scelte (CA-05.7, RB-31)", async () => {
    vi.mocked(api.creaCartella)
      .mockRejectedValueOnce(new ErroreApi(409, "conflitto", "Personale"))
      .mockResolvedValue({ cartella: cartella("personale (2)"), daRisolvere: [] });
    render(<FinestraPrincipale />);
    await riga(/Lavoro/);
    await nuovaCartellaDalPiu();
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
    // Dentro la cartella prima le note (DEC-119).
    await userEvent.keyboard("{ArrowDown}");
    expect(await riga("Budget 2026")).toHaveFocus();
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
    const nota1 = trascina(await riga("Riunione di lunedì"));
    expect(await screen.findByText("Trascina qui per eliminare")).toBeInTheDocument();
    const personale = await riga(/Personale/);
    nota1.sopra(personale);
    await waitFor(() => expect(personale).toHaveClass("riga-sopra"));
    nota1.rilascia(personale);
    await waitFor(() => expect(api.spostaNota).toHaveBeenCalledWith("r", "Personale"));

    await userEvent.click(await riga(/Lavoro/));
    const lavoro = trascina(await riga(/Lavoro/));
    const clienti = await riga(/Clienti/);
    lavoro.sopra(clienti);
    expect(clienti).not.toHaveClass("riga-sopra");
    lavoro.rilascia(clienti);
    expect(api.spostaCartella).not.toHaveBeenCalled();
  });

  it("trascinando, la pillola la disegna l'app e sparisce al rilascio (DEC-120)", async () => {
    render(<FinestraPrincipale />);
    const t = trascina(await riga("Riunione di lunedì"));
    const fantasma = document.querySelector(".fantasma");
    expect(fantasma).toHaveTextContent("Riunione di lunedì");
    expect(fantasma).toHaveAttribute("aria-hidden", "true");
    expect(fantasma).not.toHaveAttribute("role");
    t.rilascia(document.body);
    expect(document.querySelector(".fantasma")).toBeNull();
  });

  it("un clic senza muovere il puntatore apre la nota e non trascina (DEC-120)", async () => {
    vi.mocked(api.leggi).mockResolvedValue(nota("r", "Riunione di lunedì"));
    render(<FinestraPrincipale />);
    const r = await riga("Riunione di lunedì");
    fireEvent.pointerDown(r, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.pointerUp(document, { clientX: 11, clientY: 10 });
    await userEvent.click(r);
    expect(document.querySelector(".fantasma")).toBeNull();
    await waitFor(() => expect(api.leggi).toHaveBeenCalledWith("r"));
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
    const info = await apriInfo("Riunione di lunedì");
    await userEvent.click(within(info).getByRole("button", { name: /: Sposta in…$/ }));
    const pannello = screen.getByRole("dialog", { name: "Sposta in" });
    expect(within(pannello).getByRole("option", { name: /CLOUD/ })).toHaveAttribute(
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
    expect(
      screen.getByRole("button", { name: "Riunione di lunedì", current: "page" }),
    ).toBeInTheDocument();
    expect(await riga(/Lavoro/)).toHaveAttribute("aria-expanded", "true");
    expect(await riga(/Clienti/)).toHaveAttribute("aria-expanded", "true");
  });

  it("aperto da Info, Info resta sotto: Esc chiude solo il pannello, la cartella scelta compare in Info (CMP-24)", async () => {
    vi.mocked(api.spostaNota).mockResolvedValue(
      nota("r", "Riunione di lunedì", "", "Lavoro/Clienti"),
    );
    render(<FinestraPrincipale />);
    const info = await apriInfo("Riunione di lunedì");
    await userEvent.click(within(info).getByRole("button", { name: /: Sposta in…$/ }));
    expect(screen.getByRole("dialog", { name: "Sposta in" })).toBeInTheDocument();
    expect(info).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Sposta in" })).not.toBeInTheDocument();
    expect(info).toBeInTheDocument();
    const cartella = within(info).getByRole("button", { name: /: Sposta in…$/ });
    await waitFor(() => expect(cartella).toHaveFocus());
    await userEvent.click(cartella);
    const pannello = screen.getByRole("dialog", { name: "Sposta in" });
    await userEvent.click(within(pannello).getByRole("option", { name: "Lavoro" }));
    await waitFor(() =>
      expect(
        within(info).getByRole("button", { name: "Cartella Lavoro › Clienti: Sposta in…" }),
      ).toBeInTheDocument(),
    );
  });

  it("in Sposta in ogni cartella ha l'icona, «CLOUD» no; un clic sull'icona apre e chiude (DEC-99)", async () => {
    render(<FinestraPrincipale />);
    const info = await apriInfo("Riunione di lunedì");
    await userEvent.click(within(info).getByRole("button", { name: /: Sposta in…$/ }));
    const pannello = screen.getByRole("dialog", { name: "Sposta in" });
    const voce = (nome: string | RegExp) => within(pannello).getByRole("option", { name: nome });
    expect(voce(/CLOUD/).querySelector("svg.lucide-folder, svg.lucide-folder-open")).toBeNull();
    const lavoro = voce("Lavoro");
    expect(lavoro.querySelector("svg.lucide-folder")).toBeInTheDocument();
    // Anche la cartella senza sottocartelle ha la cartella chiusa.
    expect(voce("Personale").querySelector("svg.lucide-folder")).toBeInTheDocument();
    expect(within(pannello).queryByRole("option", { name: "Clienti" })).not.toBeInTheDocument();

    await userEvent.click(lavoro.querySelector("svg")!);
    expect(api.spostaNota).not.toHaveBeenCalled();
    expect(voce("Lavoro").querySelector("svg.lucide-folder-open")).toBeInTheDocument();
    // Le sottocartelle senza figli restano con la cartella chiusa.
    expect(voce("Clienti").querySelector("svg.lucide-folder")).toBeInTheDocument();
    expect(voce("Clienti").querySelector("span[style]")).toHaveStyle({
      paddingLeft: "calc(var(--spazio-controllo) + 1 * var(--spazio-rientro))",
    });

    await userEvent.click(voce("Lavoro").querySelector("svg")!);
    expect(voce("Lavoro").querySelector("svg.lucide-folder")).toBeInTheDocument();
    expect(within(pannello).queryByRole("option", { name: "Clienti" })).not.toBeInTheDocument();
  });

  it("il tasto destro su una nota della colonna dà Info, Sposta in ed Elimina, senza aprirla", async () => {
    vi.mocked(api.spostaNota).mockResolvedValue(nota("b", "Budget 2026", "", "Personale"));
    render(<FinestraPrincipale />);
    await titoloNota("Riunione di lunedì");
    await userEvent.click(await riga(/Lavoro/));
    fireEvent.contextMenu(await riga("Budget 2026"));
    expect(screen.getAllByRole("menuitem").map((v) => v.textContent)).toEqual([
      "Info",
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
    expect(
      screen.getByRole("button", { name: "Riunione di lunedì", current: "page" }),
    ).toBeInTheDocument();
  });

  it("il clic sul titolo apre Info con Sposta in, Chiudi nota ed Elimina; niente ···; il cestino si apre dalla riga in fondo (DEC-40, DEC-96)", async () => {
    vi.mocked(api.albero).mockResolvedValue({ ...alberoDiProva(), cestino: 2 });
    render(<FinestraPrincipale />);
    await titoloNota("Riunione di lunedì");
    expect(screen.getByRole("button", { name: /^Cestino/ })).toHaveTextContent("2");
    expect(screen.queryByRole("button", { name: "Altre azioni" })).not.toBeInTheDocument();
    const info = await apriInfo("Riunione di lunedì");
    expect(info).not.toHaveAttribute("aria-modal");
    expect(within(info).getByRole("textbox", { name: "Titolo" })).toHaveFocus();
    expect(within(info).getByRole("button", { name: /: Sposta in…$/ })).toBeInTheDocument();
    expect(within(info).getByRole("button", { name: /^Chiudi nota/ })).toHaveTextContent(
      "Chiudi notaCtrl + W",
    );
    expect(within(info).getByRole("button", { name: "Elimina" })).toBeInTheDocument();
    // Un altro clic sul titolo la chiude (CA-04.2).
    await userEvent.click(await titoloNota("Riunione di lunedì"));
    expect(screen.queryByRole("dialog", { name: /^Info di/ })).not.toBeInTheDocument();
  });

  it("dal tasto destro Info si apre al centro con il velo, senza Chiudi nota (CA-04.2, CA-04.8)", async () => {
    vi.mocked(api.leggi).mockImplementation(async (id) =>
      id === "b" ? nota("b", "Budget 2026", "", "Lavoro") : nota("r", "Riunione di lunedì"),
    );
    render(<FinestraPrincipale />);
    await titoloNota("Riunione di lunedì");
    await userEvent.click(await riga(/Lavoro/));
    fireEvent.contextMenu(await riga("Budget 2026"));
    await userEvent.click(screen.getByRole("menuitem", { name: "Info" }));
    const info = await screen.findByRole("dialog", { name: "Info di Budget 2026" });
    expect(info).toHaveAttribute("aria-modal", "true");
    expect(within(info).queryByRole("button", { name: /^Chiudi nota/ })).toBeNull();
    expect(within(info).getByRole("button", { name: "Elimina" })).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Info di Budget 2026" })).toBeNull();
    // La nota aperta resta quella di prima.
    expect(await titoloNota("Riunione di lunedì")).toBeInTheDocument();
  });

  it("il titolo cambiato in Info cambia subito nel percorso (CA-04.7)", async () => {
    vi.mocked(api.salva).mockResolvedValue(nota("r", "Riunione di martedì"));
    render(<FinestraPrincipale />);
    const info = await apriInfo("Riunione di lunedì");
    const campo = within(info).getByRole("textbox", { name: "Titolo" });
    await userEvent.clear(campo);
    expect(await titoloNota("Senza titolo")).toBeInTheDocument();
    await userEvent.type(campo, "Riunione di martedì");
    expect(await titoloNota("Riunione di martedì")).toBeInTheDocument();
    fireEvent.blur(window);
    await waitFor(() =>
      expect(api.salva).toHaveBeenLastCalledWith("r", { titolo: "Riunione di martedì" }),
    );
  });

  it("Ctrl + W con Info aperta chiude la nota e Info (CA-04.8)", async () => {
    render(<FinestraPrincipale />);
    await apriInfo("Riunione di lunedì");
    await userEvent.keyboard("{Control>}w{/Control}");
    expect(await screen.findByText("Nessuna nota aperta")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: /^Info di/ })).toBeNull();
  });

  it("Ctrl + W chiude la nota aperta come «Chiudi nota» (DEC-70)", async () => {
    render(<FinestraPrincipale />);
    await titoloNota("Riunione di lunedì");
    await userEvent.keyboard("{Control>}w{/Control}");
    expect(await screen.findByText("Nessuna nota aperta")).toBeInTheDocument();
    expect(screen.getByText("Riunione di lunedì")).toBeInTheDocument();
  });

  it("Ctrl + W chiude anche le impostazioni e il cestino, senza riaprire la nota di prima (DEC-116)", async () => {
    vi.mocked(api.impostazioni).mockResolvedValue({
      sistema: "windows",
      scorciatoia: "Control+Alt+KeyN",
      scorciatoiaPredefinita: true,
      tema: "sistema",
      avvioAutomatico: false,
      inPrimoPiano: false,
      cestinoInRicerca: true,
      nomeDispositivo: "Portatile",
    });
    vi.mocked(api.statoSincronizzazione).mockResolvedValue({
      collegata: false,
      ultimaRiuscita: null,
      problema: null,
    });
    render(<FinestraPrincipale />);
    await titoloNota("Riunione di lunedì");
    for (const voce of ["Impostazioni", "Cestino"]) {
      await userEvent.click(await screen.findByRole("button", { name: new RegExp(`^${voce}`) }));
      await userEvent.keyboard("{Control>}w{/Control}");
      expect(await screen.findByText("Nessuna nota aperta")).toBeInTheDocument();
      expect(screen.queryByRole("button", { current: "page" })).not.toBeInTheDocument();
    }
  });

  it("«Chiudi impostazioni» e «Chiudi cestino» nella colonna chiudono e lasciano l'area vuota (DEC-117)", async () => {
    vi.mocked(api.impostazioni).mockResolvedValue({
      sistema: "windows",
      scorciatoia: "Control+Alt+KeyN",
      scorciatoiaPredefinita: true,
      tema: "sistema",
      avvioAutomatico: false,
      inPrimoPiano: false,
      cestinoInRicerca: true,
      nomeDispositivo: "Portatile",
    });
    vi.mocked(api.statoSincronizzazione).mockResolvedValue({
      collegata: false,
      ultimaRiuscita: null,
      problema: null,
    });
    render(<FinestraPrincipale />);
    await titoloNota("Riunione di lunedì");
    for (const voce of ["Impostazioni", "Cestino"]) {
      await userEvent.click(await screen.findByRole("button", { name: new RegExp(`^${voce}`) }));
      const chiudi = await screen.findByRole("button", {
        name: `Chiudi ${voce.toLowerCase()}`,
        current: "page",
      });
      await userEvent.click(chiudi);
      expect(await screen.findByText("Nessuna nota aperta")).toBeInTheDocument();
      expect(screen.queryByRole("button", { current: "page" })).not.toBeInTheDocument();
    }
  });

  it("Chiudi nota lascia l'area vuota e la nota resta nella colonna (DEC-68)", async () => {
    render(<FinestraPrincipale />);
    const info = await apriInfo("Riunione di lunedì");
    await userEvent.click(within(info).getByRole("button", { name: /^Chiudi nota/ }));
    expect(await screen.findByText("Nessuna nota aperta")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Riunione di lunedì", current: "page" }),
    ).not.toBeInTheDocument();
    expect(api.cestinaNota).not.toHaveBeenCalled();
    expect(screen.getByText("Riunione di lunedì")).toBeInTheDocument();
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
    const info = await apriInfo("Riunione di lunedì");
    await userEvent.click(within(info).getByRole("button", { name: "Elimina" }));
    expect(api.cestinaNota).toHaveBeenCalledWith("r");
    expect(await screen.findByText("Nessuna nota aperta")).toBeInTheDocument();
    expect(screen.queryByRole("button", { current: "page" })).not.toBeInTheDocument();
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
    await titoloNota("Riunione di lunedì");
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
    expect(await titoloNota("Riunione di lunedì")).toBeInTheDocument();
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
    expect(await titoloNota("Lista della spesa")).toBeInTheDocument();
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
    await scriviTitolo("Lista", " della spesa");
    fireEvent.blur(window);
    expect(await screen.findByText("Memodu non riesce a collegarsi")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Riprova" }));
    await waitFor(() =>
      expect(api.salva).toHaveBeenLastCalledWith("a", { titolo: "Lista della spesa" }),
    );
    expect(
      screen.getByRole("button", { name: "Lista della spesa", current: "page" }),
    ).toBeInTheDocument();
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
    await scriviTitolo("Lista", " della spesa");
    fireEvent.blur(window);
    expect(await screen.findByText("La nota è nel cestino.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Lista della spesa", current: "page" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Memodu non riesce a collegarsi")).not.toBeInTheDocument();

    vi.mocked(api.leggi).mockResolvedValue(nota("a", "Lista della spesa"));
    await userEvent.click(screen.getByRole("button", { name: "Ripristina" }));
    await waitFor(() => expect(api.ripristina).toHaveBeenCalledWith("a"));
    await waitFor(() =>
      expect(api.salva).toHaveBeenLastCalledWith("a", { titolo: "Lista della spesa" }),
    );
    expect(await titoloNota("Lista della spesa")).toBeInTheDocument();
    expect(screen.queryByText("La nota è nel cestino.")).not.toBeInTheDocument();
  });

  it("eliminata per sempre: avviso senza Ripristina", async () => {
    vi.mocked(api.salva).mockRejectedValue(new ErroreApi(404, "non c'è"));
    render(<FinestraPrincipale />);
    await scriviTitolo("Lista", "!");
    fireEvent.blur(window);
    expect(await screen.findByText("La nota è stata eliminata.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ripristina" })).not.toBeInTheDocument();
  });
});

describe("colonna del foglio unico (DEC-55)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.albero).mockResolvedValue(alberoDiProva());
    vi.mocked(api.leggi).mockResolvedValue(nota("r", "Riunione di lunedì"));
  });
  const colonna = () => screen.getByRole("navigation", { name: "Note e cartelle" });

  it("all'inizio è chiusa; «| →» compare con il mouse vicino al bordo sinistro", async () => {
    render(<FinestraPrincipale />);
    await riga("Riunione di lunedì");
    expect(colonna()).toHaveClass("colonna-chiusa");
    const apri = screen.getByRole("button", { name: "Apri la colonna" });
    expect(apri).not.toHaveClass("barra-apri-visibile");
    fireEvent.mouseMove(colonna().parentElement!, { clientX: 20 });
    expect(apri).toHaveClass("barra-apri-visibile");
    fireEvent.mouseMove(colonna().parentElement!, { clientX: 400 });
    expect(apri).not.toHaveClass("barra-apri-visibile");
  });

  it("«| →» la apre sopra il foglio, «← |» la richiude; scegliere una nota non la chiude", async () => {
    render(<FinestraPrincipale />);
    await riga("Riunione di lunedì");
    await userEvent.click(screen.getByRole("button", { name: "Apri la colonna" }));
    expect(colonna()).toHaveClass("colonna-aperta");
    await userEvent.click(await riga(/Lavoro/));
    expect(colonna()).toHaveClass("colonna-aperta");
    await userEvent.click(screen.getByRole("button", { name: "Chiudi la colonna" }));
    expect(colonna()).toHaveClass("colonna-chiusa");
  });

  it("la puntina la fissa e Memodu lo ricorda alla riapertura; di nuovo la sblocca", async () => {
    const { unmount } = render(<FinestraPrincipale />);
    await riga("Riunione di lunedì");
    await userEvent.click(screen.getByRole("button", { name: "Apri la colonna" }));
    await userEvent.click(screen.getByRole("button", { name: "Fissa la colonna" }));
    expect(colonna()).toHaveClass("colonna-fissata");
    expect(screen.queryByRole("button", { name: "Apri la colonna" })).not.toBeInTheDocument();
    unmount();
    render(<FinestraPrincipale />);
    await riga("Riunione di lunedì");
    expect(colonna()).toHaveClass("colonna-fissata");
    const sblocca = screen.getByRole("button", { name: "Sblocca la colonna" });
    expect(sblocca).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(sblocca);
    expect(colonna()).toHaveClass("colonna-chiusa");
  });

  it("Ctrl + \\ fissa e sblocca la colonna; Ctrl + B no (DEC-102)", async () => {
    render(<FinestraPrincipale />);
    await riga("Riunione di lunedì");
    expect(screen.getByRole("button", { name: "Fissa la colonna" })).toHaveAttribute(
      "aria-keyshortcuts",
      "Control+\\",
    );
    await userEvent.keyboard("{Control>}b{/Control}");
    expect(colonna()).toHaveClass("colonna-chiusa");
    await userEvent.keyboard("{Control>}\\{/Control}");
    expect(colonna()).toHaveClass("colonna-fissata");
    expect(localStorage.getItem("memodu.colonna-fissata")).toBe("1");
    await userEvent.keyboard("{Control>}\\{/Control}");
    expect(colonna()).toHaveClass("colonna-chiusa");
  });
});

describe("clic fuori dalla colonna (DEC-56)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.albero).mockResolvedValue(alberoDiProva());
    vi.mocked(api.leggi).mockResolvedValue(nota("r", "Riunione di lunedì"));
  });
  const colonna = () => screen.getByRole("navigation", { name: "Note e cartelle" });

  it("un clic sul foglio chiude la colonna aperta, non quella fissata", async () => {
    render(<FinestraPrincipale />);
    await riga("Riunione di lunedì");
    await userEvent.click(screen.getByRole("button", { name: "Apri la colonna" }));
    fireEvent.mouseDown(screen.getByRole("main"));
    expect(colonna()).toHaveClass("colonna-chiusa");
    await userEvent.click(screen.getByRole("button", { name: "Apri la colonna" }));
    await userEvent.click(screen.getByRole("button", { name: "Fissa la colonna" }));
    fireEvent.mouseDown(screen.getByRole("main"));
    expect(colonna()).toHaveClass("colonna-fissata");
  });
});

describe("larghezza della colonna (DEC-62)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.albero).mockResolvedValue(alberoDiProva());
    vi.mocked(api.leggi).mockResolvedValue(nota("r", "Riunione di lunedì"));
  });

  it("la maniglia cambia la larghezza con le frecce, la ricorda e il doppio clic la riporta a 288", async () => {
    render(<FinestraPrincipale />);
    await riga("Riunione di lunedì");
    expect(
      screen.queryByRole("separator", { name: "Larghezza della colonna" }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Apri la colonna" }));
    const maniglia = screen.getByRole("separator", { name: "Larghezza della colonna" });
    fireEvent.keyDown(maniglia, { key: "ArrowLeft" });
    expect(maniglia).toHaveAttribute("aria-valuenow", "272");
    expect(screen.getByRole("navigation", { name: "Note e cartelle" })).toHaveStyle({
      width: "272px",
    });
    expect(localStorage.getItem("memodu.colonna-larghezza")).toBe("272");
    fireEvent.doubleClick(maniglia);
    expect(maniglia).toHaveAttribute("aria-valuenow", "288");
  });
});

describe("ricerca nella colonna (RF-08, DEC-94)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.albero).mockResolvedValue(alberoDiProva());
    vi.mocked(api.leggi).mockImplementation(async (id) =>
      id === "b"
        ? nota("b", "Budget 2026", "il rilascio", "Lavoro")
        : nota("r", "Riunione di lunedì"),
    );
    vi.mocked(api.cerca).mockResolvedValue([
      {
        id: "b",
        titolo: "Budget 2026",
        estratto: "il rilascio",
        evidenza: [3, 11],
        cartella: "Lavoro",
        data: "2026-09-28T08:00:00Z",
        nelCestino: false,
      },
      {
        id: "s",
        titolo: "Vecchia scaletta",
        estratto: "il rilascio era a settembre",
        evidenza: [3, 11],
        cartella: "Lavoro",
        data: "2026-09-02T08:00:00Z",
        nelCestino: true,
      },
    ]);
  });
  const colonna = () => screen.getByRole("navigation", { name: "Note e cartelle" });
  const campo = () => screen.getByRole("combobox", { name: "Cerca nelle note" });

  it("Ctrl + K apre la colonna con il cursore nel campo; aprendo un risultato si richiude (CA-08.1, CA-08.10)", async () => {
    render(<FinestraPrincipale />);
    await riga("Riunione di lunedì");
    expect(colonna()).toHaveClass("colonna-chiusa");
    await userEvent.keyboard("{Control>}k{/Control}");
    expect(colonna()).toHaveClass("colonna-aperta");
    await waitFor(() => expect(campo()).toHaveFocus());
    await userEvent.keyboard("rilascio");
    await userEvent.click(await screen.findByRole("option", { name: /Budget 2026/ }));
    await waitFor(() => expect(api.leggi).toHaveBeenCalledWith("b"));
    expect(colonna()).toHaveClass("colonna-chiusa");
  });

  it("aprendo un risultato, con il clic o con Invio, il cursore va nel testo della nota", async () => {
    const testo = () => document.querySelector(".nota-aperta [contenteditable=true]");
    render(<FinestraPrincipale />);
    await riga("Riunione di lunedì");
    await userEvent.keyboard("{Control>}k{/Control}");
    await waitFor(() => expect(campo()).toHaveFocus());
    await userEvent.keyboard("rilascio");
    await userEvent.click(await screen.findByRole("option", { name: /Budget 2026/ }));
    await titoloNota("Budget 2026");
    await waitFor(() => expect(testo()).toHaveFocus());
    await userEvent.keyboard("{Control>}k{/Control}");
    await waitFor(() => expect(campo()).toHaveFocus());
    await userEvent.keyboard("rilascio");
    await screen.findByRole("option", { name: /Budget 2026/ });
    await userEvent.keyboard("{ArrowDown}{Enter}");
    // La nota era già aperta: il cursore torna nel suo testo.
    await waitFor(() => expect(testo()).toHaveFocus());
  });

  it("Ctrl + Maiusc + K apre la ricerca avanzata; Esc torna alla card nella colonna (CA-08.17, CA-08.20)", async () => {
    render(<FinestraPrincipale />);
    await riga("Riunione di lunedì");
    await userEvent.keyboard("{Control>}{Shift>}k{/Shift}{/Control}");
    const finestra = await screen.findByRole("dialog", { name: "Ricerca avanzata" });
    await userEvent.type(
      within(finestra).getByRole("textbox", { name: "Cerca nelle note" }),
      "rilascio",
    );
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Ricerca avanzata" })).toBeNull();
    await waitFor(() => expect(campo()).toHaveFocus());
    expect(campo()).toHaveValue("rilascio");
    expect(colonna()).toHaveClass("colonna-aperta");
  });

  it("con Esc la colonna aperta da Ctrl + K si richiude; fissata resta (CA-08.11)", async () => {
    render(<FinestraPrincipale />);
    await riga("Riunione di lunedì");
    await userEvent.keyboard("{Control>}k{/Control}");
    await waitFor(() => expect(campo()).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    expect(colonna()).toHaveClass("colonna-chiusa");
    await userEvent.click(screen.getByRole("button", { name: "Apri la colonna" }));
    await userEvent.click(screen.getByRole("button", { name: "Fissa la colonna" }));
    await userEvent.keyboard("{Control>}k{/Control}");
    await waitFor(() => expect(campo()).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    expect(colonna()).toHaveClass("colonna-fissata");
  });

  it("una nota del cestino chiude quella aperta e mostra l'avviso con Ripristina (CA-08.9)", async () => {
    vi.mocked(api.leggi).mockImplementation(async (id) => {
      if (id === "s") throw new ErroreApi(404, "nel cestino", undefined, "s");
      return nota("r", "Riunione di lunedì");
    });
    render(<FinestraPrincipale />);
    await riga("Riunione di lunedì");
    await userEvent.keyboard("{Control>}k{/Control}");
    await waitFor(() => expect(campo()).toHaveFocus());
    await userEvent.keyboard("rilascio");
    await userEvent.click(await screen.findByRole("option", { name: /Vecchia scaletta/ }));
    expect(await screen.findByText("La nota è nel cestino.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ripristina" })).toBeInTheDocument();
    // L'avviso non sta sopra la nota di prima, che sembrerebbe quella nel cestino.
    expect(screen.getByText("Nessuna nota aperta")).toBeInTheDocument();
  });

  it("un clic nella colonna aperta da Ctrl + K chiude la card ma non la colonna", async () => {
    render(<FinestraPrincipale />);
    await riga("Riunione di lunedì");
    await userEvent.keyboard("{Control>}k{/Control}");
    await waitFor(() => expect(campo()).toHaveFocus());
    await userEvent.click(await riga(/Lavoro/));
    expect(screen.queryByRole("dialog", { name: "Risultati della ricerca" })).toBeNull();
    expect(colonna()).toHaveClass("colonna-aperta");
  });
});

describe("accesso (RF-14, DEC-121)", () => {
  const TESTO_SCADUTO =
    "Accedi di nuovo per sincronizzare. Le modifiche restano su questo computer.";

  /** La finestra con l'avviso dell'accesso scaduto e SC-05 aperta da lì. */
  const apriDallAvviso = async () => {
    vi.mocked(api.albero).mockResolvedValue(alberoDiProva());
    vi.mocked(api.leggi).mockResolvedValue(nota("r", "Riunione di lunedì", "testo"));
    render(<FinestraPrincipale />);
    await titoloNota("Riunione di lunedì");
    act(() => sinc.gestore?.({ tipo: "accesso-scaduto" }));
    expect(await screen.findByText(TESTO_SCADUTO)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Accedi" }));
    return screen.findByRole("dialog", { name: "Accedi a Memodu" });
  };

  it("l'accesso scaduto non blocca: avviso con Accedi, che apre SC-05 con l'email (CA-14.13)", async () => {
    const finestra = await apriDallAvviso();
    expect(within(finestra).getByLabelText("Email")).toHaveValue("manuel@esempio.it");
    expect(within(finestra).getByLabelText("Email")).toHaveFocus();
    expect(screen.queryByText("Memodu non riesce a collegarsi")).not.toBeInTheDocument();
  });

  it("email o password sbagliate: messaggio in linea, l'email resta; poi l'accesso riesce (CA-14.9, CA-14.10)", async () => {
    const finestra = await apriDallAvviso();
    vi.mocked(api.accedi).mockRejectedValueOnce(new ErroreApi(null, "credenziali"));
    await userEvent.type(within(finestra).getByLabelText("Password"), "sbagliata{Enter}");
    expect(await within(finestra).findByText("Email o password non corrette.")).toBeInTheDocument();
    expect(within(finestra).getByLabelText("Email")).toHaveValue("manuel@esempio.it");
    vi.mocked(api.accedi).mockResolvedValueOnce(undefined);
    await userEvent.click(within(finestra).getByRole("button", { name: "Accedi" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(api.accedi).toHaveBeenLastCalledWith("manuel@esempio.it", "sbagliata");
    expect(screen.queryByText(TESTO_SCADUTO)).not.toBeInTheDocument();
  });

  it("aprendo Memodu con l'accesso già scaduto l'avviso compare lo stesso (CA-14.13)", async () => {
    vi.mocked(api.albero).mockResolvedValue(alberoDiProva());
    vi.mocked(api.leggi).mockResolvedValue(nota("r", "Riunione di lunedì", "testo"));
    vi.mocked(api.statoSincronizzazione).mockResolvedValue({
      collegata: true,
      ultimaRiuscita: null,
      problema: "rifiutate",
    });
    render(<FinestraPrincipale />);
    expect(await screen.findByText(TESTO_SCADUTO)).toBeInTheDocument();
  });

  it("server irraggiungibile: il suo messaggio in linea (CA-14.11)", async () => {
    const finestra = await apriDallAvviso();
    vi.mocked(api.accedi).mockRejectedValueOnce(new ErroreApi(null, "rete"));
    await userEvent.type(within(finestra).getByLabelText("Password"), "una frase lunga{Enter}");
    expect(
      await within(finestra).findByText("Non riesco a raggiungere il server. Riprova tra poco."),
    ).toBeInTheDocument();
  });

  it("Esc chiude soltanto; «Non voglio usare il cloud» scollega e l'avviso sparisce (CA-14.15)", async () => {
    await apriDallAvviso();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(api.esci).not.toHaveBeenCalled();
    expect(screen.getByText(TESTO_SCADUTO)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Accedi" }));
    const finestra = await screen.findByRole("dialog", { name: "Accedi a Memodu" });
    await userEvent.click(
      within(finestra).getByRole("button", { name: "Non voglio usare il cloud" }),
    );
    await waitFor(() => expect(api.esci).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(TESTO_SCADUTO)).not.toBeInTheDocument();
  });
});
