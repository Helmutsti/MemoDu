import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ErroreApi, type Impostazioni as Valori, type StatoSincronizzazione } from "../api";
import { Impostazioni } from "./Impostazioni";

vi.mock("../api", async (originale) => ({
  ...(await originale<typeof import("../api")>()),
  api: {
    impostazioni: vi.fn(),
    statoSincronizzazione: vi.fn(),
    cambiaScorciatoia: vi.fn(),
    cambiaTema: vi.fn(),
    cambiaAvvio: vi.fn(),
    cambiaPrimoPiano: vi.fn(),
    cambiaNomeDispositivo: vi.fn(),
    cambiaCestinoInRicerca: vi.fn(),
  },
}));

const valori = (altri: Partial<Valori> = {}): Valori => ({
  sistema: "windows",
  scorciatoia: "Control+Alt+KeyN",
  scorciatoiaPredefinita: true,
  tema: "sistema",
  avvioAutomatico: false,
  inPrimoPiano: false,
  cestinoInRicerca: true,
  nomeDispositivo: "Portatile di lavoro",
  ...altri,
});
const stato = (altro: Partial<StatoSincronizzazione> = {}): StatoSincronizzazione => ({
  collegata: true,
  ultimaRiuscita: new Date().toISOString(),
  problema: null,
  ...altro,
});

/** Come quello della finestra principale: un errore diventa undefined. */
const esegui = async <T,>(chiamata: () => Promise<T>) => {
  try {
    return await chiamata();
  } catch {
    return undefined;
  }
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.impostazioni).mockResolvedValue(valori());
  vi.mocked(api.statoSincronizzazione).mockResolvedValue(stato());
  vi.mocked(api.cambiaScorciatoia).mockResolvedValue(undefined);
  vi.mocked(api.cambiaTema).mockResolvedValue(undefined);
  vi.mocked(api.cambiaAvvio).mockResolvedValue(undefined);
});

describe("SC-06 Impostazioni (DEC-91)", () => {
  it("mostra i cinque gruppi con i valori attuali", async () => {
    render(<Impostazioni esegui={esegui} />);
    await screen.findByRole("heading", { name: "Impostazioni" });
    expect(screen.getAllByRole("heading", { level: 2 }).map((t) => t.textContent)).toEqual([
      "Generale",
      "Tema",
      "Sincronizzazione",
      "Ricerca",
      "Dispositivo",
    ]);
    expect(screen.getByRole("textbox", { name: "Scorciatoia della nota rapida" })).toHaveValue(
      "Ctrl + Alt + N",
    );
    expect(screen.getByRole("button", { name: "Ripristina" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Avvia Memodu all'accensione" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("radio", { name: "Sistema" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Sincronizzata")).toBeInTheDocument();
    expect(screen.getByText(/^Oggi alle/)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Nome del dispositivo" })).toHaveValue(
      "Portatile di lavoro",
    );
  });

  it("la scorciatoia si cambia premendo la combinazione nel campo", async () => {
    render(<Impostazioni esegui={esegui} />);
    const campo = await screen.findByRole("textbox", { name: "Scorciatoia della nota rapida" });
    await userEvent.click(campo);
    vi.mocked(api.impostazioni).mockResolvedValue(
      valori({ scorciatoia: "Control+Shift+Space", scorciatoiaPredefinita: false }),
    );
    await userEvent.keyboard("{Control>}{Shift>}[Space]{/Shift}{/Control}");
    expect(api.cambiaScorciatoia).toHaveBeenCalledWith("Control+Shift+Space");
    await waitFor(() => expect(campo).toHaveValue("Ctrl + Maiusc + Spazio"));
    await userEvent.click(screen.getByRole("button", { name: "Ripristina" }));
    expect(api.cambiaScorciatoia).toHaveBeenLastCalledWith(null);
  });

  it("se un altro programma usa la combinazione lo dice e resta quella di prima", async () => {
    vi.mocked(api.cambiaScorciatoia).mockRejectedValue(new ErroreApi(409, "occupata"));
    render(<Impostazioni esegui={esegui} />);
    const campo = await screen.findByRole("textbox", { name: "Scorciatoia della nota rapida" });
    await userEvent.click(campo);
    await userEvent.keyboard("{Control>}{Alt>}m{/Alt}{/Control}");
    expect(await screen.findByRole("alert")).toHaveTextContent("Già usata da un altro programma");
    expect(campo).toHaveValue("Ctrl + Alt + N");
    expect(campo).toHaveAttribute("aria-invalid", "true");
  });

  it("una combinazione con un solo modificatore non si prova nemmeno", async () => {
    render(<Impostazioni esegui={esegui} />);
    const campo = await screen.findByRole("textbox", { name: "Scorciatoia della nota rapida" });
    await userEvent.click(campo);
    await userEvent.keyboard("{Control>}c{/Control}");
    expect(api.cambiaScorciatoia).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(/almeno due tasti/);
  });

  it("tema e avvio all'accensione valgono subito", async () => {
    render(<Impostazioni esegui={esegui} />);
    await userEvent.click(await screen.findByRole("radio", { name: "Scuro" }));
    expect(api.cambiaTema).toHaveBeenCalledWith("scuro");
    expect(screen.getByRole("radio", { name: "Scuro" })).toHaveAttribute("aria-checked", "true");
    await userEvent.click(screen.getByRole("switch", { name: "Avvia Memodu all'accensione" }));
    expect(api.cambiaAvvio).toHaveBeenCalledWith(true);
    expect(screen.getByRole("switch", { name: "Avvia Memodu all'accensione" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("«Mostra le note del cestino nei risultati» parte acceso e si cambia (RB-29, DEC-94)", async () => {
    vi.mocked(api.cambiaCestinoInRicerca).mockResolvedValue(undefined);
    render(<Impostazioni esegui={esegui} />);
    const interruttore = await screen.findByRole("switch", {
      name: "Mostra le note del cestino nei risultati",
    });
    expect(interruttore).toHaveAttribute("aria-checked", "true");
    await userEvent.click(interruttore);
    expect(api.cambiaCestinoInRicerca).toHaveBeenCalledWith(false);
    expect(interruttore).toHaveAttribute("aria-checked", "false");
  });

  it("«Tieni Memodu in primo piano» vale subito (DEC-93)", async () => {
    vi.mocked(api.cambiaPrimoPiano).mockResolvedValue(undefined);
    render(<Impostazioni esegui={esegui} />);
    const interruttore = await screen.findByRole("switch", { name: "Tieni Memodu in primo piano" });
    await userEvent.click(interruttore);
    expect(api.cambiaPrimoPiano).toHaveBeenCalledWith(true);
    expect(interruttore).toHaveAttribute("aria-checked", "true");
  });

  it("se l'avvio all'accensione non si cambia, l'interruttore torna com'era", async () => {
    vi.mocked(api.cambiaAvvio).mockRejectedValue(new ErroreApi(null, "non disponibile"));
    render(<Impostazioni esegui={esegui} />);
    const interruttore = await screen.findByRole("switch", { name: "Avvia Memodu all'accensione" });
    await userEvent.click(interruttore);
    await waitFor(() => expect(interruttore).toHaveAttribute("aria-checked", "false"));
  });

  it("il nome del dispositivo si salva lasciando il campo; vuoto torna quello del computer", async () => {
    vi.mocked(api.cambiaNomeDispositivo).mockResolvedValue("PC-UFFICIO");
    render(<Impostazioni esegui={esegui} />);
    const campo = await screen.findByRole("textbox", { name: "Nome del dispositivo" });
    await userEvent.clear(campo);
    await userEvent.tab();
    expect(api.cambiaNomeDispositivo).toHaveBeenCalledWith("");
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "Nome del dispositivo" })).toHaveValue(
        "PC-UFFICIO",
      ),
    );
  });

  it("senza credenziali dice che si lavora in locale", async () => {
    vi.mocked(api.statoSincronizzazione).mockResolvedValue(
      stato({ collegata: false, ultimaRiuscita: null }),
    );
    render(<Impostazioni esegui={esegui} />);
    expect(
      await screen.findByText("Senza collegamento: le note restano su questo computer"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Ultima sincronizzazione")).not.toBeInTheDocument();
  });
});
