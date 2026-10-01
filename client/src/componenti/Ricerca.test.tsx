// Prove della ricerca (RF-08): CA-08.1, CA-08.2, CA-08.5 … CA-08.8, CA-08.10, CA-08.11 e
// CA-08.14 per la parte dell'interfaccia. Il nucleo è finto: le regole della ricerca le provano
// le prove del nucleo (archivio_ricerca_test.rs).

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, type RisultatoRicerca } from "../api";
import { Ricerca } from "./Ricerca";

vi.mock("../api", async (originale) => ({
  ...(await originale<typeof import("../api")>()),
  api: { cerca: vi.fn(), elencaTag: vi.fn() },
}));

const risultato = (altro: Partial<RisultatoRicerca> = {}): RisultatoRicerca => ({
  id: "1",
  titolo: "Rilascio della versione 2",
  estratto: "…il rilascio è fissato per venerdì…",
  evidenza: [4, 12],
  cartella: "Lavoro",
  data: "2026-09-25T09:12:00Z",
  nelCestino: false,
  ...altro,
});

const TROVATI = [
  risultato(),
  risultato({
    id: "2",
    titolo: "Vecchia scaletta",
    estratto: "il rilascio era a settembre",
    evidenza: [3, 11],
    nelCestino: true,
  }),
];

const disegna = (focus = 0) => {
  const onApri = vi.fn();
  const onChiusa = vi.fn();
  const onErrore = vi.fn();
  const utils = render(
    <Ricerca
      focus={focus}
      avanzata={0}
      onTornaAllaCard={vi.fn()}
      onApri={onApri}
      onChiusa={onChiusa}
      onErrore={onErrore}
    />,
  );
  return { onApri, onChiusa, onErrore, ...utils };
};

const campo = () => screen.getByRole("combobox", { name: "Cerca nelle note" });
const card = () => screen.getByRole("dialog", { name: "Risultati della ricerca" });

beforeEach(() => {
  vi.mocked(api.cerca).mockReset().mockResolvedValue(TROVATI);
  vi.mocked(api.elencaTag).mockResolvedValue([
    { nome: "clienti", note: 1 },
    { nome: "lavoro", note: 3 },
    { nome: "lavoro/fornitori", note: 1 },
  ]);
});

describe("Ricerca (RF-08, CMP-13)", () => {
  it("entrando nel campo la card mostra solo i filtri (CA-08.1)", async () => {
    disegna();
    await userEvent.click(campo());
    const filtri = within(card()).getByRole("group", { name: "Filtri" });
    expect(
      within(filtri)
        .getAllByRole("button")
        .map((b) => b.textContent),
    ).toEqual(["Tag", "Creazione", "Modifica"]);
    expect(within(card()).queryByRole("listbox")).toBeNull();
    expect(api.cerca).not.toHaveBeenCalled();
  });

  it("Ctrl + K porta il cursore nel campo e apre la card, anche se il cursore era già lì (RB-71)", async () => {
    const { rerender, onApri, onChiusa, onErrore } = disegna(0);
    rerender(
      <Ricerca
        focus={1}
        avanzata={0}
        onTornaAllaCard={vi.fn()}
        onApri={onApri}
        onChiusa={onChiusa}
        onErrore={onErrore}
      />,
    );
    expect(campo()).toHaveFocus();
    expect(card()).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    campo().focus();
    rerender(
      <Ricerca
        focus={2}
        avanzata={0}
        onTornaAllaCard={vi.fn()}
        onApri={onApri}
        onChiusa={onChiusa}
        onErrore={onErrore}
      />,
    );
    expect(card()).toBeInTheDocument();
  });

  it("scrivendo nel campo attivo la card si riapre", async () => {
    disegna();
    await userEvent.click(campo());
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("rilascio");
    expect(await within(card()).findByRole("listbox")).toBeInTheDocument();
  });

  it("scrivendo, dopo la pausa, mostra i risultati con la parola evidenziata (CA-08.2)", async () => {
    disegna();
    await userEvent.type(campo(), "rilascio");
    const elenco = await within(card()).findByRole("listbox", { name: "Note trovate" });
    expect(api.cerca).toHaveBeenLastCalledWith({
      testo: "rilascio",
      tag: [],
      creata: null,
      modificata: null,
    });
    const righe = within(elenco).getAllByRole("option");
    expect(righe).toHaveLength(2);
    expect(within(righe[0]!).getByText("rilascio")).toHaveClass("risultato-ricerca-parola");
    expect(righe[0]).toHaveTextContent(/Lavoro · \d\d\/09\/2026/);
    expect(righe[1]).toHaveClass("risultato-ricerca-cestino");
    expect(within(righe[1]!).getByText("nel cestino")).toBeInTheDocument();
    expect(screen.getByText("2 note trovate")).toBeInTheDocument();
  });

  it("senza risultati la card resta aperta con il messaggio (CA-08.8)", async () => {
    vi.mocked(api.cerca).mockResolvedValue([]);
    disegna();
    await userEvent.type(campo(), "fattura di marzo");
    expect(await within(card()).findByText("Nessuna nota trovata")).toBeInTheDocument();
    expect(
      within(card()).getByText("Prova con un'altra parola o togli un filtro."),
    ).toBeInTheDocument();
    expect(within(card()).getByRole("button", { name: "Tag" })).toBeInTheDocument();
  });

  it("nel filtro Tag si scelgono più tag e il menu resta aperto (CA-08.5)", async () => {
    disegna();
    await userEvent.click(campo());
    await userEvent.click(within(card()).getByRole("button", { name: "Tag" }));
    const menu = await screen.findByRole("menu", { name: "Filtro Tag" });
    await userEvent.click(within(menu).getByText("lavoro"));
    await userEvent.click(within(menu).getByText("clienti"));
    expect(within(menu).getByRole("menuitemcheckbox", { name: "lavoro" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(within(card()).getByRole("button", { name: "Tag: 2" })).toBeInTheDocument();
    await waitFor(() =>
      expect(api.cerca).toHaveBeenLastCalledWith(
        expect.objectContaining({ testo: "", tag: ["lavoro", "clienti"] }),
      ),
    );
    // Il campo «Cerca un tag» filtra l'elenco.
    await userEvent.type(within(menu).getByRole("textbox", { name: "Cerca un tag" }), "forn");
    expect(
      within(menu)
        .getAllByRole("menuitemcheckbox")
        .map((v) => v.textContent),
    ).toEqual(["lavoro/fornitori"]);
    await userEvent.click(within(menu).getByText("Togli il filtro"));
    expect(within(card()).getByRole("button", { name: "Tag" })).toBeInTheDocument();
  });

  it("il filtro Modifica manda il periodo in UTC (CA-08.7)", async () => {
    disegna();
    await userEvent.click(campo());
    await userEvent.click(within(card()).getByRole("button", { name: "Modifica" }));
    const menu = await screen.findByRole("menu", { name: "Filtro Modifica" });
    expect(
      within(menu)
        .getAllByRole("menuitemcheckbox")
        .map((v) => v.textContent),
    ).toEqual([
      "Qualsiasi data",
      "Oggi",
      "Ultimi 7 giorni",
      "Ultimi 30 giorni",
      "Quest'anno",
      "Scegli le date…",
    ]);
    await userEvent.click(within(menu).getByText("Ultimi 7 giorni"));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(
      within(card()).getByRole("button", { name: "Modifica: ultimi 7 giorni" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(api.cerca).toHaveBeenCalled());
    const richiesta = vi.mocked(api.cerca).mock.lastCall![0];
    expect(richiesta.modificata?.a).toBeNull();
    const da = new Date(richiesta.modificata!.da!);
    expect(da.getHours()).toBe(0);
    expect(richiesta.creata).toBeNull();
  });

  it("con la tastiera si scende nei risultati e Invio apre, poi la ricerca si svuota (CA-08.10, CA-08.14)", async () => {
    const { onApri } = disegna();
    await userEvent.type(campo(), "rilascio");
    await within(card()).findByRole("listbox");
    await userEvent.keyboard("{ArrowDown}");
    expect(within(card()).getAllByRole("option")[0]).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}{ArrowUp}{Enter}");
    expect(onApri).toHaveBeenCalledWith(TROVATI[0]);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(campo()).toHaveValue("");
  });

  it("Tab passa dal campo ai filtri e torna al campo", async () => {
    disegna();
    await userEvent.click(campo());
    await userEvent.keyboard("{Tab}");
    expect(within(card()).getByRole("button", { name: "Tag" })).toHaveFocus();
    await userEvent.keyboard("{Tab}{Tab}{Tab}");
    expect(campo()).toHaveFocus();
  });

  it("nel menu Tag, Tab ed Esc chiudono il menu e il focus torna sul filtro (CA-08.14)", async () => {
    disegna();
    await userEvent.click(campo());
    await userEvent.keyboard("{Tab}{Enter}");
    const cercaTag = await screen.findByRole("textbox", { name: "Cerca un tag" });
    await waitFor(() => expect(cercaTag).toHaveFocus());
    await userEvent.keyboard("{Tab}");
    expect(screen.queryByRole("menu")).toBeNull();
    const tag = within(card()).getByRole("button", { name: "Tag" });
    expect(tag).toHaveFocus();
    // Scelto un tag con freccia giù e Invio, Esc chiude il menu: il focus non cade sulla pagina.
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("textbox", { name: "Cerca un tag" });
    await userEvent.keyboard("lav{ArrowDown}{Enter}{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(within(card()).getByRole("button", { name: "Tag: lavoro" })).toHaveFocus();
    // La card è ancora aperta e un altro Esc la chiude.
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Tab da un risultato va ai filtri, Maiusc + Tab al campo: il focus resta nella card", async () => {
    disegna();
    await userEvent.type(campo(), "rilascio");
    await within(card()).findByRole("listbox");
    await userEvent.keyboard("{ArrowDown}{Tab}");
    expect(within(card()).getByRole("button", { name: "Tag" })).toHaveFocus();
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}{ArrowDown}{Shift>}{Tab}{/Shift}");
    expect(campo()).toHaveFocus();
  });

  it("Esc chiude la card e svuota la ricerca (CA-08.11)", async () => {
    const { onChiusa } = disegna();
    await userEvent.type(campo(), "rilascio");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(campo()).toHaveValue("");
    expect(onChiusa).toHaveBeenCalledWith(true);
  });

  it("un clic fuori chiude la card senza aprire niente (RB-72)", async () => {
    const { onChiusa, onApri } = disegna();
    await userEvent.type(campo(), "rilascio");
    await within(card()).findByRole("listbox");
    await userEvent.click(document.body);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onChiusa).toHaveBeenCalledWith(false);
    expect(onApri).not.toHaveBeenCalled();
  });

  it("una ricerca non riuscita non dice «Nessuna nota trovata» (RB-61)", async () => {
    const errore = new Error("non risponde");
    vi.mocked(api.cerca).mockRejectedValue(errore);
    const { onErrore } = disegna();
    await userEvent.type(campo(), "rilascio");
    await waitFor(() => expect(onErrore).toHaveBeenCalledWith(errore));
    expect(within(card()).queryByText("Nessuna nota trovata")).toBeNull();
  });

  // ——— Ricerca avanzata (CMP-29, DEC-96) ———

  const avanzata = () => screen.getByRole("dialog", { name: "Ricerca avanzata" });
  const disegnaAvanzata = () => {
    const onApri = vi.fn();
    const onTornaAllaCard = vi.fn();
    const props = { focus: 0, onApri, onChiusa: vi.fn(), onErrore: vi.fn(), onTornaAllaCard };
    const utils = render(<Ricerca {...props} avanzata={0} />);
    const apriConScorciatoia = () => utils.rerender(<Ricerca {...props} avanzata={1} />);
    return { onApri, onTornaAllaCard, apriConScorciatoia };
  };

  it("in fondo alla card «Mostra tutti i risultati» apre la ricerca avanzata con lo stesso testo (CA-08.17)", async () => {
    disegnaAvanzata();
    await userEvent.type(campo(), "rilascio");
    await within(card()).findByRole("listbox");
    await userEvent.click(
      within(card()).getByRole("button", { name: /^Mostra tutti i risultati \(2\)/ }),
    );
    expect(screen.queryByRole("dialog", { name: "Risultati della ricerca" })).toBeNull();
    const finestra = avanzata();
    expect(finestra).toHaveAttribute("aria-modal", "true");
    const campoGrande = within(finestra).getByRole("textbox", { name: "Cerca nelle note" });
    expect(campoGrande).toHaveValue("rilascio");
    expect(campoGrande).toHaveFocus();
    expect(within(finestra).getAllByRole("option")).toHaveLength(2);
    expect(within(finestra).getByText("«rilascio» · 2 note")).toBeInTheDocument();
  });

  it("Ctrl + Maiusc + K con la card chiusa apre la ricerca avanzata vuota (CA-08.17)", async () => {
    const { apriConScorciatoia } = disegnaAvanzata();
    apriConScorciatoia();
    const finestra = await screen.findByRole("dialog", { name: "Ricerca avanzata" });
    expect(within(finestra).getByRole("textbox", { name: "Cerca nelle note" })).toHaveValue("");
    expect(within(finestra).getByText("Scrivi una parola o scegli un filtro.")).toBeInTheDocument();
  });

  it("i filtri sempre aperti valgono subito: più tag e un solo periodo (CA-08.18)", async () => {
    const { apriConScorciatoia } = disegnaAvanzata();
    apriConScorciatoia();
    const finestra = await screen.findByRole("dialog", { name: "Ricerca avanzata" });
    const lavoro = await within(finestra).findByRole("menuitemcheckbox", { name: "lavoro" });
    await userEvent.click(lavoro);
    await userEvent.click(within(finestra).getByRole("menuitemcheckbox", { name: "clienti" }));
    expect(lavoro).toHaveAttribute("aria-checked", "true");
    await waitFor(() =>
      expect(vi.mocked(api.cerca).mock.lastCall![0].tag).toEqual(["lavoro", "clienti"]),
    );
    const modifica = within(finestra).getByRole("group", { name: "Modifica" });
    await userEvent.click(within(modifica).getByRole("menuitemradio", { name: "Ultimi 7 giorni" }));
    expect(
      within(modifica).getByRole("menuitemradio", { name: "Ultimi 7 giorni" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(within(modifica).getByRole("menuitemradio", { name: "Qualsiasi data" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await waitFor(() => expect(vi.mocked(api.cerca).mock.lastCall![0].modificata).not.toBeNull());
  });

  it("Esc torna alla card con lo stesso testo; aprire un risultato svuota la ricerca (CA-08.20)", async () => {
    const { onApri, onTornaAllaCard } = disegnaAvanzata();
    await userEvent.type(campo(), "rilascio");
    await within(card()).findByRole("listbox");
    await userEvent.click(
      within(card()).getByRole("button", { name: /^Mostra tutti i risultati/ }),
    );
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Ricerca avanzata" })).toBeNull();
    expect(onTornaAllaCard).toHaveBeenCalledTimes(1);
    expect(campo()).toHaveValue("rilascio");
    // Riaperta, un clic su un risultato lo apre e svuota tutto.
    campo().focus();
    await userEvent.click(await within(card()).findByRole("button", { name: /^Mostra tutti/ }));
    await userEvent.click(within(avanzata()).getAllByRole("option")[1]!);
    expect(onApri).toHaveBeenCalledWith(TROVATI[1]);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(campo()).toHaveValue("");
  });

  it("con la tastiera: freccia giù entra nei risultati, Invio apre (CA-08.21)", async () => {
    const { onApri } = disegnaAvanzata();
    await userEvent.type(campo(), "rilascio");
    await within(card()).findByRole("listbox");
    await userEvent.click(within(card()).getByRole("button", { name: /^Mostra tutti/ }));
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}{Enter}");
    expect(onApri).toHaveBeenCalledWith(TROVATI[0]);
  });
});
