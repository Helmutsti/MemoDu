import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Albero, Cartella, ElementoCestino, Nota, VoceElenco } from "@memodu/condiviso";
import { api, ErroreApi } from "../api";
import type { EventoSincronizzazione } from "../finestra";
import { brainet } from "../brainet/api";
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
    cambiaVista: vi.fn(),
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
    conflittoDaMostrare: vi.fn(),
    statoAccesso: vi.fn(),
    accedi: vi.fn(),
    esci: vi.fn(),
  },
}));

vi.mock("../brainet/api", async (originale) => {
  const vero = await originale<typeof import("../brainet/api")>();
  return {
    ...vero,
    brainet: Object.fromEntries(Object.keys(vero.brainet).map((k) => [k, vi.fn()])),
  };
});

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
  vista: "testo",
});
const voce = (id: string, titolo: string): VoceElenco => ({
  id,
  titolo,
  anteprima: "",
  modificata: "2026-09-28T08:00:00Z",
});
const albero = (note: VoceElenco[]): Albero => ({
  nonOrganizzate: { conteggio: note.length, note },
  cartelle: [] as Cartella[],
  cestino: 0,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.cestino).mockResolvedValue([] as ElementoCestino[]);
  vi.mocked(api.elencaTag).mockResolvedValue([]);
  vi.mocked(api.eliminaSeVuota).mockRejectedValue(new ErroreApi(409, "non vuota"));
  vi.mocked(api.statoAccesso).mockResolvedValue({ email: "manuel@esempio.it" });
  vi.mocked(api.statoSincronizzazione).mockResolvedValue({
    collegata: false,
    ultimaRiuscita: null,
    problema: null,
  });
  vi.mocked(api.conflittoDaMostrare).mockResolvedValue(null);
  vi.mocked(brainet.stato).mockResolvedValue({ acceso: true });
  vi.mocked(brainet.elencaStati).mockResolvedValue([]);
  vi.mocked(brainet.elencaJournal).mockResolvedValue([]);
  vi.mocked(api.albero).mockResolvedValue(albero([voce("a", "Spesa")]));
  vi.mocked(api.leggi).mockResolvedValue(nota("a", "Spesa", "pane"));
});

describe("Sposta in Brainet (RB-130, DEC-147)", () => {
  it("dal tasto destro, con la conferma; dopo si apre il Journal", async () => {
    vi.mocked(brainet.spostaInBrainet).mockResolvedValue({
      ...nota("a", "Spesa", "pane"),
      brainet: true,
    });
    render(<FinestraPrincipale />);
    fireEvent.contextMenu(await screen.findByRole("treeitem", { name: "Spesa" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Sposta in Brainet" }));
    const finestra = await screen.findByRole("alertdialog");
    expect(within(finestra).getByText("Spostare la nota in Brainet?")).toBeInTheDocument();
    expect(
      within(finestra).getByText(
        "La nota esce da CLOUD e dalla ricerca e non si riporta indietro. Nel Journal puoi collegarla a persone, oggetti e argomenti.",
      ),
    ).toBeInTheDocument();
    vi.mocked(api.albero).mockResolvedValue(albero([]));
    vi.mocked(brainet.elencaJournal).mockResolvedValue([
      { ...nota("a", "Spesa", "pane"), brainet: true },
    ]);
    await userEvent.click(within(finestra).getByRole("button", { name: "Sposta" }));
    await waitFor(() => expect(brainet.spostaInBrainet).toHaveBeenCalledWith("a"));
    expect(await screen.findByRole("heading", { name: "Journal" })).toBeInTheDocument();
  });

  it("«Annulla» non sposta niente", async () => {
    render(<FinestraPrincipale />);
    fireEvent.contextMenu(await screen.findByRole("treeitem", { name: "Spesa" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Sposta in Brainet" }));
    await userEvent.click(await screen.findByRole("button", { name: "Annulla" }));
    expect(brainet.spostaInBrainet).not.toHaveBeenCalled();
  });

  it("con Brainet spento la voce non c'è", async () => {
    vi.mocked(brainet.stato).mockResolvedValue({ acceso: false });
    render(<FinestraPrincipale />);
    fireEvent.contextMenu(await screen.findByRole("treeitem", { name: "Spesa" }));
    await screen.findByRole("menuitem", { name: "Sposta in…" });
    expect(screen.queryByRole("menuitem", { name: "Sposta in Brainet" })).toBeNull();
  });
});
