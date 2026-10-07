import { render, screen, waitFor, within } from "@testing-library/react";
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
    statoAccesso: vi.fn(),
    esci: vi.fn(),
  },
}));

const accedi = vi.fn();

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
  vi.mocked(api.statoAccesso).mockResolvedValue({ email: "manuel@esempio.it" });
  vi.mocked(api.esci).mockResolvedValue(undefined);
});

describe("SC-06 Impostazioni (DEC-91, DEC-122)", () => {
  it("mostra il box dell'account e i gruppi Generale e Ricerca con i valori attuali", async () => {
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
    await screen.findByRole("heading", { name: "Impostazioni" });
    expect(screen.getByRole("region", { name: "Account" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 }).map((t) => t.textContent)).toEqual([
      "Generale",
      "Ricerca",
    ]);
    expect(screen.getByRole("region", { name: "Generale" })).toContainElement(
      screen.getByRole("radio", { name: "Sistema" }),
    );
    expect(screen.getByRole("textbox", { name: "Scorciatoia della nota rapida" })).toHaveValue(
      "Ctrl + Alt + N",
    );
    expect(screen.getByRole("button", { name: "Ripristina" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Avvia Memodu all'accensione" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("radio", { name: "Sistema" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(/^Sincronizzata · oggi alle \d\d:\d\d$/)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Nome del dispositivo" })).toHaveValue(
      "Portatile di lavoro",
    );
  });

  it("la scorciatoia si cambia premendo la combinazione nel campo", async () => {
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
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
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
    const campo = await screen.findByRole("textbox", { name: "Scorciatoia della nota rapida" });
    await userEvent.click(campo);
    await userEvent.keyboard("{Control>}{Alt>}m{/Alt}{/Control}");
    expect(await screen.findByRole("alert")).toHaveTextContent("Già usata da un altro programma");
    expect(campo).toHaveValue("Ctrl + Alt + N");
    expect(campo).toHaveAttribute("aria-invalid", "true");
  });

  it("una combinazione con un solo modificatore non si prova nemmeno", async () => {
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
    const campo = await screen.findByRole("textbox", { name: "Scorciatoia della nota rapida" });
    await userEvent.click(campo);
    await userEvent.keyboard("{Control>}c{/Control}");
    expect(api.cambiaScorciatoia).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(/almeno due tasti/);
  });

  it("tema e avvio all'accensione valgono subito", async () => {
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
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
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
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
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
    const interruttore = await screen.findByRole("switch", { name: "Tieni Memodu in primo piano" });
    await userEvent.click(interruttore);
    expect(api.cambiaPrimoPiano).toHaveBeenCalledWith(true);
    expect(interruttore).toHaveAttribute("aria-checked", "true");
  });

  it("se l'avvio all'accensione non si cambia, l'interruttore torna com'era", async () => {
    vi.mocked(api.cambiaAvvio).mockRejectedValue(new ErroreApi(null, "non disponibile"));
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
    const interruttore = await screen.findByRole("switch", { name: "Avvia Memodu all'accensione" });
    await userEvent.click(interruttore);
    await waitFor(() => expect(interruttore).toHaveAttribute("aria-checked", "false"));
  });

  it("il nome del dispositivo si salva lasciando il campo; vuoto torna quello del computer", async () => {
    vi.mocked(api.cambiaNomeDispositivo).mockResolvedValue("PC-UFFICIO");
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
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

  it("senza accesso il box invita ad accedere, senza il nome del dispositivo; Accedi apre SC-05 (CA-14.18)", async () => {
    vi.mocked(api.statoSincronizzazione).mockResolvedValue(
      stato({ collegata: false, ultimaRiuscita: null }),
    );
    vi.mocked(api.statoAccesso).mockResolvedValue({ email: null });
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
    const box = await screen.findByRole("region", { name: "Account" });
    expect(within(box).getByText("Non hai fatto l'accesso")).toBeInTheDocument();
    expect(within(box).getByText("Le note restano su questo computer.")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Nome del dispositivo" })).not.toBeInTheDocument();
    await userEvent.click(within(box).getByRole("button", { name: "Accedi" }));
    expect(accedi).toHaveBeenCalledWith(undefined);
  });

  it("collegato mostra iniziale, email, stato e nome del dispositivo; Esci scollega e rilegge (CA-14.19, CA-14.20)", async () => {
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
    const box = await screen.findByRole("region", { name: "Account" });
    expect(within(box).getByText("M")).toBeInTheDocument();
    expect(within(box).getByText("manuel@esempio.it")).toBeInTheDocument();
    expect(within(box).getByRole("textbox", { name: "Nome del dispositivo" })).toBeInTheDocument();
    vi.mocked(api.statoSincronizzazione).mockResolvedValue(
      stato({ collegata: false, ultimaRiuscita: null }),
    );
    vi.mocked(api.statoAccesso).mockResolvedValue({ email: null });
    await userEvent.click(within(box).getByRole("button", { name: "Esci" }));
    expect(api.esci).toHaveBeenCalled();
    expect(await screen.findByText("Non hai fatto l'accesso")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Nome del dispositivo" })).not.toBeInTheDocument();
  });

  it("subito dopo l'accesso il pallino grigio aspetta la prima sincronizzazione (CA-14.19)", async () => {
    vi.mocked(api.statoSincronizzazione).mockResolvedValue(stato({ ultimaRiuscita: null }));
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
    const testo = await screen.findByText("In attesa della prima sincronizzazione");
    expect(testo.querySelector(".box-account-pallino-attesa")).not.toBeNull();
  });

  it("con il server irraggiungibile il pallino ambra dice l'ora dell'ultimo backup ed Esci resta (CA-14.21)", async () => {
    const ultima = new Date();
    ultima.setHours(9, 5, 0, 0);
    vi.mocked(api.statoSincronizzazione).mockResolvedValue(
      stato({ problema: "rete", ultimaRiuscita: ultima.toISOString() }),
    );
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
    const testo = await screen.findByText("Server non raggiungibile: ultimo backup 09:05");
    expect(testo.querySelector(".box-account-pallino-avviso")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Esci" })).toBeInTheDocument();
  });

  it("con un errore del server il pallino ambra dice che riprova da sola (CA-14.21)", async () => {
    vi.mocked(api.statoSincronizzazione).mockResolvedValue(stato({ problema: "errore" }));
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
    const testo = await screen.findByText("Non riuscita: riprovo da sola");
    expect(testo.querySelector(".box-account-pallino-avviso")).not.toBeNull();
  });

  it("con l'accesso scaduto il pallino rosso e Accedi al posto di Esci, con l'email di prima (CA-14.22)", async () => {
    vi.mocked(api.statoSincronizzazione).mockResolvedValue(stato({ problema: "rifiutate" }));
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
    const testo = await screen.findByText("Accedi di nuovo per sincronizzare");
    expect(testo.querySelector(".box-account-pallino-errore")).not.toBeNull();
    expect(screen.getByText("manuel@esempio.it")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Esci" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Accedi" }));
    expect(accedi).toHaveBeenCalledWith("manuel@esempio.it");
  });

  it("con versioni diverse il pallino rosso ed Esci resta (CA-14.22)", async () => {
    vi.mocked(api.statoSincronizzazione).mockResolvedValue(stato({ problema: "protocollo" }));
    render(<Impostazioni esegui={esegui} onAccedi={accedi} />);
    const testo = await screen.findByText("Memodu e il server hanno versioni diverse");
    expect(testo.querySelector(".box-account-pallino-errore")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Esci" })).toBeInTheDocument();
  });
});
