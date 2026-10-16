import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ErroreApi } from "../api";
import { brainet } from "./api";
import { GruppoBrainet } from "./GruppoBrainet";
import { SezioneBrainet } from "./SezioneBrainet";
import { mesiCronologia, quandoNota, VisteBrainet } from "./VisteBrainet";

vi.mock("../api", async (originale) => ({
  ...(await originale<typeof import("../api")>()),
  api: { salva: vi.fn(), cestinaNota: vi.fn() },
}));

vi.mock("./api", async (originale) => {
  const vero = await originale<typeof import("./api")>();
  const fn = () => vi.fn();
  return {
    ...vero,
    brainet: Object.fromEntries(Object.keys(vero.brainet).map((k) => [k, fn()])),
  };
});

const esegui = <T,>(c: () => Promise<T>) => c().catch(() => undefined);
const LUCA = { id: "11111111-1111-4111-8111-111111111111", nome: "Luca", tipo: null, foto: null };
const LB = {
  id: "22222222-2222-4222-8222-222222222222",
  nome: "Luca Bianchi",
  tipo: "persona" as const,
  foto: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(brainet.elencaStati).mockResolvedValue([]);
  vi.mocked(brainet.leggiEntita).mockResolvedValue(LB);
  vi.mocked(brainet.suggerisciEntita).mockResolvedValue([]);
});

describe("sezione Brainet della colonna (CA-18.32)", () => {
  it("Entità e Calendario, senza + e senza Database; la pagina di un'entità tiene Entità", () => {
    const onApri = vi.fn();
    const { rerender } = render(<SezioneBrainet aperta="entita" onApri={onApri} />);
    expect(screen.getByRole("treeitem", { name: "Entità" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("button", { name: /Nuova nota/ })).toBeNull();
    expect(screen.queryByRole("treeitem", { name: "Database" })).toBeNull();
    fireEvent.click(screen.getByRole("treeitem", { name: "Calendario" }));
    expect(onApri).toHaveBeenCalledWith("calendario");
    rerender(<SezioneBrainet aperta={`entita:${LUCA.id}`} onApri={onApri} />);
    expect(screen.getByRole("treeitem", { name: "Entità" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

describe("Impostazioni, gruppo Brainet (CA-18.32, CA-18.15, CA-18.35)", () => {
  it("spento: solo l'interruttore; acceso: gli stati, senza Mostra il Database", async () => {
    vi.mocked(brainet.stato).mockResolvedValue({ acceso: false });
    vi.mocked(brainet.accendi).mockResolvedValue({ acceso: true });
    vi.mocked(brainet.elencaStati).mockResolvedValue([
      { id: "s", nome: "Importante", colore: "avviso", ordine: 1 },
    ]);
    const onCambiato = vi.fn();
    render(<GruppoBrainet esegui={esegui} versione={0} onCambiato={onCambiato} />);
    fireEvent.click(await screen.findByRole("switch", { name: "Usa Brainet" }));
    expect(await screen.findByText("Importante")).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Mostra il Database" })).toBeNull();
    expect(onCambiato).toHaveBeenCalledWith({ acceso: true });
  });

  it("spegnere non chiede conferma e non cancella", async () => {
    vi.mocked(brainet.stato).mockResolvedValue({ acceso: true });
    vi.mocked(brainet.spegni).mockResolvedValue({ acceso: false });
    render(<GruppoBrainet esegui={esegui} versione={0} onCambiato={() => {}} />);
    fireEvent.click(await screen.findByRole("switch", { name: "Usa Brainet" }));
    await waitFor(() => expect(brainet.spegni).toHaveBeenCalled());
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("uno stato nuovo con nome e colore; un nome già usato è rifiutato", async () => {
    vi.mocked(brainet.stato).mockResolvedValue({ acceso: true });
    vi.mocked(brainet.elencaStati).mockResolvedValue([
      { id: "s", nome: "Importante", colore: "avviso", ordine: 1 },
    ]);
    vi.mocked(brainet.creaStato).mockResolvedValue({
      id: "t",
      nome: "Urgente",
      colore: "errore",
      ordine: 2,
    });
    render(<GruppoBrainet esegui={esegui} versione={0} onCambiato={() => {}} />);
    fireEvent.click(await screen.findByRole("button", { name: "Aggiungi uno stato" }));
    const campo = await screen.findByLabelText("Nome dello stato");
    await userEvent.type(campo, "importante{Enter}");
    expect(await screen.findByText("C'è già uno stato con questo nome")).toBeInTheDocument();
    await userEvent.clear(campo);
    fireEvent.click(screen.getByRole("radio", { name: "rosso" }));
    await userEvent.type(campo, "Urgente{Enter}");
    await waitFor(() => expect(brainet.creaStato).toHaveBeenCalledWith("Urgente", "errore"));
  });
});

const oggiGiorno = () => {
  const d = new Date();
  const due = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`;
};

const viste = { onApri: () => {}, onApriNota: () => {}, onAvviso: () => {} };

describe("Entità (CA-18.11, CA-18.12)", () => {
  it("elenco con quante volte e il tipo; Unisci a… con la conferma", async () => {
    vi.mocked(brainet.elencaEntita).mockResolvedValue([
      { entita: LUCA, nominata: 1, ultimaVolta: oggiGiorno() },
      { entita: LB, nominata: 14, ultimaVolta: oggiGiorno() },
    ]);
    vi.mocked(brainet.anteprimaUnione).mockResolvedValue({ citazioni: 1, aree: 2 });
    vi.mocked(brainet.unisciEntita).mockResolvedValue({ citazioni: 1, aree: 2 });
    render(<VisteBrainet vista="entita" versione={0} esegui={esegui} {...viste} />);
    expect(await screen.findByText("nominato 1 volta · ultima volta oggi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tipo di Luca: Senza tipo" })).toBeInTheDocument();
    fireEvent.contextMenu(screen.getByText("Luca"));
    fireEvent.click(await screen.findByText("Unisci a…"));
    await userEvent.type(screen.getByRole("textbox", { name: "Cerca un'entità" }), "bian");
    fireEvent.click(await screen.findByRole("menuitem", { name: "Luca Bianchi" }));
    expect(await screen.findByText("Unire «Luca» a «Luca Bianchi»?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "1 citazione e 2 aree passano a «Luca Bianchi», che tiene il suo nome. L'unione non si annulla.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Unisci" }));
    await waitFor(() => expect(brainet.unisciEntita).toHaveBeenCalledWith(LUCA.id, LB.id));
  });
});

describe("Entità divise per tipo (CA-18.49, CA-18.50)", () => {
  const GIORGIO = {
    id: "33333333-3333-4333-8333-333333333333",
    nome: "Giorgio",
    tipo: "persona" as const,
    foto: "Zm90bw==",
  };
  const CONCERTO = {
    id: "44444444-4444-4444-8444-444444444444",
    nome: "Concerto",
    tipo: "evento" as const,
    foto: null,
  };
  const TRASLOCO = {
    id: "55555555-5555-4555-8555-555555555555",
    nome: "Trasloco",
    tipo: "argomento" as const,
    foto: null,
  };

  it("i gruppi nell'ordine di @; le persone come un cast con foto o iniziali", async () => {
    vi.mocked(brainet.elencaEntita).mockResolvedValue([
      { entita: LUCA, nominata: 1, ultimaVolta: oggiGiorno() },
      { entita: CONCERTO, nominata: 2, ultimaVolta: oggiGiorno() },
      { entita: LB, nominata: 14, ultimaVolta: oggiGiorno() },
      { entita: TRASLOCO, nominata: 3, ultimaVolta: oggiGiorno() },
      { entita: GIORGIO, nominata: 5, ultimaVolta: oggiGiorno() },
    ]);
    const { container } = render(
      <VisteBrainet vista="entita" versione={0} esegui={esegui} {...viste} />,
    );
    await screen.findByText("Concerto");
    expect(screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)).toEqual([
      "Persone",
      "Argomenti",
      "Eventi",
      "Senza tipo",
    ]);
    const cast = screen.getByRole("region", { name: "Persone" });
    expect(cast.querySelectorAll(".volto-entita")).toHaveLength(2);
    expect(cast.querySelector(".volto-entita-iniziali")?.textContent).toBe("LB");
    expect(cast.querySelector(".volto-entita-foto")).toHaveAttribute(
      "src",
      "data:image/jpeg;base64,Zm90bw==",
    );
    // Nel cast il nome e basta: quante volte sta nel suggerimento del mouse.
    expect(screen.queryByText("nominato 14 volte · ultima volta oggi")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".riga-entita-icona")).toHaveLength(2);
  });

  it("una persona: clic apre la pagina, tasto destro › Tipo cambia il tipo", async () => {
    vi.mocked(brainet.elencaEntita).mockResolvedValue([
      { entita: LB, nominata: 14, ultimaVolta: oggiGiorno() },
    ]);
    vi.mocked(brainet.impostaTipo).mockResolvedValue({ ...LB, tipo: "argomento" });
    const onApri = vi.fn();
    render(<VisteBrainet vista="entita" versione={0} esegui={esegui} {...viste} onApri={onApri} />);
    fireEvent.click(await screen.findByText("Luca Bianchi"));
    expect(onApri).toHaveBeenCalledWith(`entita:${LB.id}`);
    fireEvent.contextMenu(screen.getByText("Luca Bianchi"));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Tipo" }));
    expect(await screen.findByRole("menuitemcheckbox", { name: "Persona" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Argomento" }));
    await waitFor(() => expect(brainet.impostaTipo).toHaveBeenCalledWith(LB.id, "argomento"));
  });
});

describe("Entità, il tipo (CA-18.31)", () => {
  it("clic sul tipo: i tipi con la spunta su quello attuale e «Senza tipo» in fondo", async () => {
    vi.mocked(brainet.elencaEntita).mockResolvedValue([
      { entita: LUCA, nominata: 1, ultimaVolta: oggiGiorno() },
    ]);
    vi.mocked(brainet.impostaTipo).mockResolvedValue({ ...LUCA, tipo: "persona" });
    render(<VisteBrainet vista="entita" versione={0} esegui={esegui} {...viste} />);
    fireEvent.click(await screen.findByRole("button", { name: "Tipo di Luca: Senza tipo" }));
    const voci = await screen.findAllByRole("menuitemcheckbox");
    expect(voci.map((v) => v.textContent)).toEqual([
      "Persona",
      "Argomento",
      "Evento",
      "Oggetto",
      "Senza tipo",
    ]);
    expect(screen.getByRole("menuitemcheckbox", { name: "Senza tipo" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "Persona" }));
    await waitFor(() => expect(brainet.impostaTipo).toHaveBeenCalledWith(LUCA.id, "persona"));
    await waitFor(() => expect(brainet.elencaEntita).toHaveBeenCalledTimes(2));
  });
});

describe("Entità, Scegli una foto… (CA-18.13)", () => {
  it("un file che non è un'immagine: il suo messaggio, la foto non cambia (DEC-141)", async () => {
    vi.mocked(brainet.elencaEntita).mockResolvedValue([
      { entita: LUCA, nominata: 1, ultimaVolta: oggiGiorno() },
    ]);
    vi.mocked(brainet.scegliFoto).mockRejectedValue(
      new ErroreApi(400, "Il file scelto non è un'immagine: la foto non cambia."),
    );
    const onAvviso = vi.fn();
    render(
      <VisteBrainet vista="entita" versione={0} esegui={esegui} {...viste} onAvviso={onAvviso} />,
    );
    fireEvent.contextMenu(await screen.findByText("Luca"));
    fireEvent.click(await screen.findByText("Scegli una foto…"));
    await waitFor(() =>
      expect(onAvviso).toHaveBeenCalledWith(
        "Il file scelto non è un'immagine: la foto non cambia.",
      ),
    );
    expect(brainet.scegliFoto).toHaveBeenCalledWith(LUCA.id);
  });
});

describe("Entità, clic su una riga (CA-18.39)", () => {
  it("apre la pagina dell'entità; la pillola del tipo no", async () => {
    vi.mocked(brainet.elencaEntita).mockResolvedValue([
      { entita: LUCA, nominata: 1, ultimaVolta: oggiGiorno() },
    ]);
    const onApri = vi.fn();
    render(<VisteBrainet vista="entita" versione={0} esegui={esegui} {...viste} onApri={onApri} />);
    fireEvent.click(await screen.findByRole("button", { name: "Tipo di Luca: Senza tipo" }));
    expect(onApri).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Luca"));
    expect(onApri).toHaveBeenCalledWith(`entita:${LUCA.id}`);
  });
});

describe("Pagina dell'entità (CA-18.39, CA-18.40, CA-18.41)", () => {
  it("testata, passaggi per giorno con pillole e aree; clic apre la nota", async () => {
    vi.mocked(brainet.elencaStati).mockResolvedValue([
      { id: "s", nome: "Importante", colore: "avviso", ordine: 1 },
    ]);
    vi.mocked(brainet.passaggiEntita).mockResolvedValue({
      entita: LB,
      nominata: 2,
      ultimaVolta: "2026-10-16",
      giorni: [
        {
          giorno: "2026-10-16",
          passaggi: [
            {
              nota: "n1",
              titolo: "Preventivi",
              ora: "18:40",
              testo: `## Arrivato: <area id="a" s="s" e="${LB.id}">costa **1.200 €**</area id="a">`,
              inizio: 12,
            },
          ],
        },
        {
          giorno: "2026-10-09",
          passaggi: [
            {
              nota: "n2",
              titolo: "Chiamata",
              ora: "10:30",
              testo: `- Chiamata con <cita e="${LB.id}">Luca</cita>`,
              inizio: 0,
            },
          ],
        },
      ],
    });
    const onApriNota = vi.fn();
    const onApri = vi.fn();
    const { container } = render(
      <VisteBrainet
        vista={`entita:${LB.id}`}
        versione={0}
        esegui={esegui}
        {...viste}
        onApri={onApri}
        onApriNota={onApriNota}
      />,
    );
    expect(await screen.findByRole("heading", { name: "Luca Bianchi" })).toBeInTheDocument();
    expect(screen.getByText("Nominata 2 volte · l'ultima il 16/10/2026")).toBeInTheDocument();
    expect(screen.getByText(/venerdì 16 ottobre/i)).toBeInTheDocument();
    expect(screen.getByText("Preventivi · 18:40")).toBeInTheDocument();
    // I simboli del Markdown non si vedono; l'area è evidenziata, con il pallino dello stato.
    expect(container.querySelector("mark.bn-area")?.textContent).toBe("costa 1.200 €");
    expect(screen.getByText("Arrivato:", { exact: false }).textContent).not.toContain("##");
    await waitFor(() => expect(container.querySelector(".pallino-avviso")).not.toBeNull());
    // La pillola mostra il nome attuale dell'entità.
    expect(container.querySelector(".bn-collegamento")?.textContent).toBe("Luca Bianchi");
    fireEvent.click(screen.getByText("Preventivi · 18:40"));
    expect(onApriNota).toHaveBeenCalledWith("n1", 12);
    fireEvent.click(screen.getByRole("button", { name: "Entità" }));
    expect(onApri).toHaveBeenCalledWith("entita");
  });

  it("un'entità che nessuna nota nomina: lo stato vuoto", async () => {
    vi.mocked(brainet.passaggiEntita).mockResolvedValue({
      entita: { ...LUCA, nome: "Giorgio" },
      nominata: 0,
      ultimaVolta: null,
      giorni: [],
    });
    render(<VisteBrainet vista={`entita:${LUCA.id}`} versione={0} esegui={esegui} {...viste} />);
    expect(await screen.findByText("Mai nominata")).toBeInTheDocument();
    expect(screen.getByText("Nessuna nota parla ancora di «Giorgio».")).toBeInTheDocument();
    expect(screen.getByText("Scrivi @ in una nota per citarla.")).toBeInTheDocument();
  });
});

describe("Calendario (CA-18.33)", () => {
  it("un pallino solo per giorno", async () => {
    const oggi = new Date();
    const due = (n: number) => String(n).padStart(2, "0");
    const mese = `${oggi.getFullYear()}-${due(oggi.getMonth() + 1)}`;
    vi.mocked(brainet.calendario).mockResolvedValue([
      { giorno: `${mese}-01` },
      { giorno: `${mese}-02` },
    ]);
    const { container } = render(
      <VisteBrainet vista="calendario" versione={0} esegui={esegui} {...viste} />,
    );
    await waitFor(() =>
      expect(container.querySelectorAll(".giorno-brainet-pallino")).toHaveLength(2),
    );
    expect(brainet.calendario).toHaveBeenCalledWith(mese);
    expect(container.querySelector(".giorno-brainet-oggi")).not.toBeNull();
  });
});

describe("Journal (RB-131, DEC-147)", () => {
  const nota = (id: string, contenuto: string, creata: string) => ({
    id,
    titolo: "",
    contenuto,
    creata,
    modificata: creata,
    cartella: "",
    creataScelta: null,
    fineValidita: null,
    tag: [],
    vista: "markdown" as const,
    brainet: true,
  });

  it("le note in Brainet con il giorno e l'ora; tasto destro › Elimina le manda nel Cestino", async () => {
    vi.mocked(brainet.elencaJournal).mockResolvedValue([
      nota("n1", "Pranzo con Luca", new Date().toISOString()),
      nota("n2", "Telefonata di ieri", "2026-10-01T09:00:00Z"),
    ]);
    vi.mocked(api.cestinaNota).mockResolvedValue({} as never);
    const onCestino = vi.fn();
    const { container } = render(
      <VisteBrainet
        vista="journal"
        versione={0}
        esegui={esegui}
        {...viste}
        onCestino={onCestino}
      />,
    );
    expect(await screen.findByRole("heading", { name: "Journal" })).toBeInTheDocument();
    await waitFor(() => expect(container.querySelectorAll(".nota-journal")).toHaveLength(2));
    expect(screen.getByText(/^oggi alle /)).toBeInTheDocument();
    expect(container.querySelector(".cm-content")?.textContent).toBe("Pranzo con Luca");
    fireEvent.contextMenu(container.querySelector(".nota-journal")!);
    fireEvent.click(await screen.findByText("Elimina"));
    await waitFor(() => expect(api.cestinaNota).toHaveBeenCalledWith("n1"));
    expect(onCestino).toHaveBeenCalled();
  });

  it("vuoto: come spostare una nota in Brainet", async () => {
    vi.mocked(brainet.elencaJournal).mockResolvedValue([]);
    render(<VisteBrainet vista="journal" versione={0} esegui={esegui} {...viste} />);
    expect(await screen.findByText("Nessuna nota in Brainet")).toBeInTheDocument();
  });
});

describe("Journal, la data sopra la nota (RB-131)", () => {
  const nota = {
    id: "n",
    titolo: "",
    contenuto: "",
    creata: "2026-10-16T08:30:00.000Z",
    modificata: "2026-10-16T08:30:00.000Z",
    cartella: "",
    creataScelta: null as string | null,
    fineValidita: null,
    tag: [],
    vista: "markdown" as const,
    brainet: true,
  };
  const adesso = new Date(2026, 9, 16, 12);
  it("senza data scelta: il giorno e l'ora in cui è nata", () => {
    expect(quandoNota(nota, adesso)).toMatch(/^oggi alle \d\d:\d\d$/);
  });
  it("con la data scelta: quel giorno, senza ora, come nell'ordine", () => {
    expect(quandoNota({ ...nota, creataScelta: "2026-10-09" }, adesso)).toBe("il 09/10/2026");
    expect(quandoNota({ ...nota, creataScelta: "2026-10-16" }, adesso)).toBe("oggi");
  });
});

describe("Cronologia della pagina dell'entità (CA-18.51, RB-133)", () => {
  const passaggio = { nota: "n", titolo: "Nota", ora: "10:00", testo: "testo", inizio: 0 };
  const giorni = [
    { giorno: "2026-12-08", passaggi: [passaggio] },
    { giorno: "2026-10-16", passaggi: [passaggio, passaggio] },
    { giorno: "2026-10-02", passaggi: [passaggio] },
  ];
  it("i mesi dal primo all'ultimo, con quelli vuoti in mezzo", () => {
    const mesi = mesiCronologia(giorni);
    expect(mesi.map((m) => [m.etichetta, m.paragrafi, m.giorno])).toEqual([
      ["ott 26", 3, "2026-10-16"],
      ["nov 26", 0, null],
      ["dic 26", 1, "2026-12-08"],
    ]);
  });
  it("nella pagina: un pulsante per i mesi con paragrafi, il pallino cresce; clic porta al giorno", async () => {
    vi.mocked(brainet.elencaStati).mockResolvedValue([]);
    vi.mocked(brainet.passaggiEntita).mockResolvedValue({
      entita: LB,
      nominata: 4,
      ultimaVolta: "2026-12-08",
      giorni,
    });
    const scorri = vi.fn();
    Element.prototype.scrollIntoView = scorri;
    const { container } = render(
      <VisteBrainet vista={`entita:${LB.id}`} versione={0} esegui={esegui} {...viste} />,
    );
    const ottobre = await screen.findByRole("button", { name: "ottobre 2026: 3 paragrafi" });
    expect(screen.getByLabelText("novembre 2026: nessun paragrafo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "dicembre 2026: 1 paragrafo" })).toBeInTheDocument();
    expect(ottobre.querySelector(".cronologia-alcuni")).not.toBeNull();
    fireEvent.click(ottobre);
    expect(scorri).toHaveBeenCalled();
    expect(scorri.mock.contexts[0]).toBe(container.querySelector("#giorno-2026-10-16"));
  });
});
