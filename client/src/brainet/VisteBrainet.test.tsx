import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ElementoCestino } from "@memodu/condiviso";
import { Cestino } from "../schermate/Cestino";
import { brainet } from "./api";
import { GruppoBrainet } from "./GruppoBrainet";
import { SezioneBrainet } from "./SezioneBrainet";
import { VisteBrainet } from "./VisteBrainet";

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

describe("sezione Brainet della colonna (CA-18.1, CA-18.10)", () => {
  it("Database, Entità e Calendario; Database solo con «Mostra il Database»", () => {
    const onApri = vi.fn();
    const { rerender } = render(<SezioneBrainet mostraDatabase aperta="entita" onApri={onApri} />);
    expect(screen.getByRole("treeitem", { name: "Entità" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    fireEvent.click(screen.getByRole("button", { name: "Nuova nota Brainet" }));
    expect(onApri).toHaveBeenCalledWith("foglio");
    rerender(<SezioneBrainet mostraDatabase={false} aperta={null} onApri={onApri} />);
    expect(screen.queryByRole("treeitem", { name: "Database" })).toBeNull();
    expect(screen.getByRole("treeitem", { name: "Calendario" })).toBeInTheDocument();
  });
});

describe("Impostazioni, gruppo Brainet (CA-18.1, CA-18.15, CA-18.19)", () => {
  it("spento: solo l'interruttore; acceso: Mostra il Database e gli stati", async () => {
    vi.mocked(brainet.stato).mockResolvedValue({ acceso: false, mostraDatabase: true });
    vi.mocked(brainet.accendi).mockResolvedValue({ acceso: true, mostraDatabase: true });
    vi.mocked(brainet.elencaStati).mockResolvedValue([
      { id: "s", nome: "Importante", colore: "avviso", ordine: 1 },
    ]);
    const onCambiato = vi.fn();
    render(<GruppoBrainet esegui={esegui} versione={0} onCambiato={onCambiato} />);
    const usa = await screen.findByRole("switch", { name: "Usa Brainet" });
    expect(screen.queryByRole("switch", { name: "Mostra il Database" })).toBeNull();
    fireEvent.click(usa);
    expect(await screen.findByRole("switch", { name: "Mostra il Database" })).toBeInTheDocument();
    expect(await screen.findByText("Importante")).toBeInTheDocument();
    expect(onCambiato).toHaveBeenCalledWith({ acceso: true, mostraDatabase: true });
  });

  it("spegnere chiede conferma con «Annulla» e «Spegni e cancella tutto»", async () => {
    vi.mocked(brainet.stato).mockResolvedValue({ acceso: true, mostraDatabase: true });
    vi.mocked(brainet.spegni).mockResolvedValue({ acceso: false, mostraDatabase: true });
    render(<GruppoBrainet esegui={esegui} versione={0} onCambiato={() => {}} />);
    fireEvent.click(await screen.findByRole("switch", { name: "Usa Brainet" }));
    const finestra = await screen.findByRole("alertdialog");
    expect(within(finestra).getByText("Spegnere Brainet?")).toBeInTheDocument();
    fireEvent.click(within(finestra).getByRole("button", { name: "Annulla" }));
    expect(brainet.spegni).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("switch", { name: "Usa Brainet" }));
    fireEvent.click(await screen.findByRole("button", { name: "Spegni e cancella tutto" }));
    await waitFor(() => expect(brainet.spegni).toHaveBeenCalled());
  });

  it("uno stato nuovo con nome e colore; un nome già usato è rifiutato", async () => {
    vi.mocked(brainet.stato).mockResolvedValue({ acceso: true, mostraDatabase: true });
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

describe("Entità (CA-18.11, CA-18.12)", () => {
  it("elenco con quante volte e il tipo; Unisci a… con la conferma", async () => {
    vi.mocked(brainet.elencaEntita).mockResolvedValue([
      { entita: LUCA, nominata: 1, ultimaVolta: new Date().toISOString() },
      { entita: LB, nominata: 14, ultimaVolta: new Date().toISOString() },
    ]);
    vi.mocked(brainet.anteprimaUnione).mockResolvedValue({ citazioni: 1, aree: 2 });
    vi.mocked(brainet.unisciEntita).mockResolvedValue({ citazioni: 1, aree: 2 });
    render(<VisteBrainet vista="entita" versione={0} esegui={esegui} onCestino={() => {}} />);
    expect(await screen.findByText("nominato 1 volta · ultima volta oggi")).toBeInTheDocument();
    expect(screen.getByText("Senza tipo")).toBeInTheDocument();
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

describe("Database (CA-18.9)", () => {
  it("le note dal più recente; tasto destro › Elimina le manda nel Cestino", async () => {
    vi.mocked(brainet.elencaFrammenti).mockResolvedValue([
      {
        id: "f1",
        testo: "Riletto il progetto",
        natoIl: new Date().toISOString(),
        modificatoIl: "",
      },
    ]);
    vi.mocked(brainet.eliminaFrammento).mockResolvedValue({} as ElementoCestino);
    const onCestino = vi.fn();
    const { container } = render(
      <VisteBrainet vista="database" versione={0} esegui={esegui} onCestino={onCestino} />,
    );
    await waitFor(() => expect(container.querySelector(".nota-database")).not.toBeNull());
    expect(screen.getByText(/^oggi alle /)).toBeInTheDocument();
    fireEvent.contextMenu(container.querySelector(".nota-database")!);
    fireEvent.click(await screen.findByText("Elimina"));
    await waitFor(() => expect(brainet.eliminaFrammento).toHaveBeenCalledWith("f1"));
    expect(onCestino).toHaveBeenCalled();
  });
});

describe("Calendario (CA-18.14)", () => {
  it("un pallino per nota, fino a tre", async () => {
    const oggi = new Date();
    const due = (n: number) => String(n).padStart(2, "0");
    const mese = `${oggi.getFullYear()}-${due(oggi.getMonth() + 1)}`;
    vi.mocked(brainet.calendario).mockResolvedValue([{ giorno: `${mese}-01`, note: 5 }]);
    const { container } = render(
      <VisteBrainet vista="calendario" versione={0} esegui={esegui} onCestino={() => {}} />,
    );
    await waitFor(() =>
      expect(container.querySelectorAll(".giorno-brainet-pallino")).toHaveLength(3),
    );
    expect(brainet.calendario).toHaveBeenCalledWith(mese);
    expect(container.querySelector(".giorno-brainet-oggi")).not.toBeNull();
  });
});

describe("Cestino con la parte di Brainet (CA-18.9)", () => {
  it("due parti con il titolo, CLOUD e Brainet", () => {
    const e = (id: string, tipo: ElementoCestino["tipo"], nome: string): ElementoCestino => ({
      id,
      tipo,
      nome,
      provenienza: "",
      eliminato: "2026-10-14T10:00:00Z",
    });
    render(
      <Cestino
        elementi={[e("a", "nota", "Idee"), e("b", "frammento", "Chiamata con Luca")]}
        onRipristina={() => {}}
        onElimina={() => {}}
        onSvuota={() => {}}
      />,
    );
    expect(screen.getByText("CLOUD")).toBeInTheDocument();
    expect(screen.getByText("Brainet")).toBeInTheDocument();
    expect(screen.getByText("Nota di Brainet · eliminata il 14/10/2026")).toBeInTheDocument();
  });
});
