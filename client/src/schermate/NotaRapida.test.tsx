import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api";
import { apriNelProgramma, chiudiNotaRapida, confermaUscita } from "../finestra";
import { NotaRapida } from "./NotaRapida";

vi.mock("../api", () => ({
  api: { elenca: vi.fn(), leggi: vi.fn(), crea: vi.fn(), salva: vi.fn(), eliminaSeVuota: vi.fn() },
}));
const sistema = vi.hoisted(() => ({
  chiusura: undefined as undefined | (() => void),
  uscita: undefined as undefined | (() => Promise<boolean>),
}));
vi.mock("../finestra", () => ({
  allaRichiestaDiChiusura: (g: () => void) => {
    sistema.chiusura = g;
    return () => {};
  },
  allUscita: (p: () => Promise<boolean>) => {
    sistema.uscita = p;
    return () => {};
  },
  annullaUscita: vi.fn(),
  confermaUscita: vi.fn(),
  apriNelProgramma: vi.fn(),
  chiudiNotaRapida: vi.fn(),
}));
// L'editor vero è CodeMirror; qui basta un campo che riporta le modifiche.
vi.mock("../editor/Editor", () => ({
  Editor: ({ onModifica }: { onModifica: (t: string) => void }) => (
    <textarea aria-label="Testo" onChange={(e) => onModifica(e.target.value)} />
  ),
  cursoreDalClic: () => false,
}));

const nota = {
  id: "r1",
  titolo: "",
  contenuto: "idea",
  creata: "c",
  modificata: "m",
  cartella: "",
  creataScelta: null,
  fineValidita: null,
  tag: [],
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.crea).mockResolvedValue(nota);
  vi.mocked(api.salva).mockResolvedValue(nota);
  vi.mocked(api.eliminaSeVuota).mockResolvedValue(undefined);
});

describe("SC-02 Nota rapida (FL-01)", () => {
  it("mostra solo Chiudi con la freccia, senza ✕ né Esc per chiudere (DEC-34, DEC-50)", () => {
    render(<NotaRapida />);
    expect(screen.getByRole("button", { name: "Chiudi" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Altre azioni" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Esc per chiudere" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salva" })).not.toBeInTheDocument();
  });

  it("Chiudi salva e chiude (CA-01.2, RB-02)", async () => {
    render(<NotaRapida />);
    await userEvent.type(screen.getByLabelText("Testo"), "idea");
    await userEvent.click(screen.getByRole("button", { name: "Chiudi" }));
    await waitFor(() => expect(chiudiNotaRapida).toHaveBeenCalledTimes(1));
    expect(api.crea).toHaveBeenCalledWith({ contenuto: "idea" });
  });

  it("Esc salva la nota nella radice e chiude (CA-01.2, RB-01, RB-02)", async () => {
    render(<NotaRapida />);
    await userEvent.type(screen.getByLabelText("Testo"), "idea");
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(chiudiNotaRapida).toHaveBeenCalled());
    expect(api.crea).toHaveBeenCalledWith({ contenuto: "idea" });
  });

  it("chiusa vuota non crea nessuna nota (CA-01.3, RB-03)", async () => {
    render(<NotaRapida />);
    await userEvent.click(screen.getByRole("button", { name: "Chiudi" }));
    await waitFor(() => expect(chiudiNotaRapida).toHaveBeenCalled());
    expect(api.crea).not.toHaveBeenCalled();
  });

  it("dopo 2 s di pausa crea la nota, poi salva le modifiche sulla stessa (RB-06)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<NotaRapida />);
    fireEvent.change(screen.getByLabelText("Testo"), { target: { value: "id" } });
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(api.crea).toHaveBeenCalledWith({ contenuto: "id" });
    fireEvent.change(screen.getByLabelText("Testo"), { target: { value: "idea" } });
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(api.salva).toHaveBeenCalledWith("r1", { contenuto: "idea" });
    expect(api.crea).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("dalla freccia di Chiudi, Apri nel programma salva e passa la nota alla finestra principale (CA-01.5, RB-05)", async () => {
    render(<NotaRapida />);
    await userEvent.type(screen.getByLabelText("Testo"), "idea");
    await userEvent.click(screen.getByRole("button", { name: "Altre azioni" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Apri nel programma" }));
    await waitFor(() => expect(apriNelProgramma).toHaveBeenCalledWith("r1"));
    expect(chiudiNotaRapida).toHaveBeenCalled();
  });

  it("con l'API spenta mostra SC-07 e chiudendo chiede conferma (CA-01.7, CA-01.8)", async () => {
    vi.mocked(api.crea).mockRejectedValue(new Error("spento"));
    render(<NotaRapida />);
    await userEvent.type(screen.getByLabelText("Testo"), "da non perdere");
    await userEvent.click(screen.getByRole("button", { name: "Chiudi" }));
    expect(await screen.findByText("Memodu non riesce a collegarsi")).toBeInTheDocument();
    expect(
      await screen.findByRole("alertdialog", { name: "La nota non è salvata" }),
    ).toBeInTheDocument();
    expect(chiudiNotaRapida).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Annulla" }));
    vi.mocked(api.crea).mockResolvedValue(nota);
    await userEvent.click(screen.getByRole("button", { name: "Riprova" }));
    await waitFor(() => expect(api.crea).toHaveBeenLastCalledWith({ contenuto: "da non perdere" }));
    expect(screen.queryByText("Memodu non riesce a collegarsi")).not.toBeInTheDocument();
  });

  it("con SC-07 davanti, Esc chiede conferma e si può chiudere lo stesso (RB-62)", async () => {
    vi.mocked(api.crea).mockRejectedValue(new Error("spento"));
    render(<NotaRapida />);
    await userEvent.type(screen.getByLabelText("Testo"), "da non perdere");
    await userEvent.click(screen.getByRole("button", { name: "Chiudi" }));
    await userEvent.click(await screen.findByRole("button", { name: "Annulla" }));
    fireEvent.keyDown(window, { key: "Escape" });
    await userEvent.click(await screen.findByRole("button", { name: "Chiudi comunque" }));
    expect(chiudiNotaRapida).toHaveBeenCalled();
  });

  it("scritta, salvata e poi svuotata, chiudendo non lascia una nota vuota (CA-01.3, DEC-39)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<NotaRapida />);
    fireEvent.change(screen.getByLabelText("Testo"), { target: { value: "x" } });
    await act(() => vi.advanceTimersByTimeAsync(2000));
    fireEvent.change(screen.getByLabelText("Testo"), { target: { value: "" } });
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(chiudiNotaRapida).toHaveBeenCalled());
    expect(api.eliminaSeVuota).toHaveBeenCalledWith("r1");
    vi.useRealTimers();
  });

  it("con SC-07 davanti il contenuto non riceve la tastiera (RB-61)", async () => {
    vi.mocked(api.crea).mockRejectedValue(new Error("spento"));
    render(<NotaRapida />);
    await userEvent.type(screen.getByLabelText("Testo"), "testo");
    await userEvent.click(screen.getByRole("button", { name: "Chiudi" }));
    await screen.findByText("Memodu non riesce a collegarsi");
    expect(screen.getByLabelText("Testo").closest("[inert]")).not.toBeNull();
  });

  it("Alt + F4 salva e chiude come Chiudi (RB-02)", async () => {
    render(<NotaRapida />);
    await userEvent.type(screen.getByLabelText("Testo"), "idea");
    act(() => sistema.chiusura?.());
    await waitFor(() => expect(chiudiNotaRapida).toHaveBeenCalled());
    expect(api.crea).toHaveBeenCalledWith({ contenuto: "idea" });
  });

  it("Esci da Memodu con il server spento chiede conferma prima di uscire (RB-62)", async () => {
    vi.mocked(api.crea).mockRejectedValue(new Error("spento"));
    render(<NotaRapida />);
    await userEvent.type(screen.getByLabelText("Testo"), "da non perdere");
    let pronta: boolean | undefined;
    await act(async () => {
      pronta = await sistema.uscita?.();
    });
    expect(pronta).toBe(false);
    await userEvent.click(await screen.findByRole("button", { name: "Chiudi comunque" }));
    expect(confermaUscita).toHaveBeenCalled();
    expect(chiudiNotaRapida).not.toHaveBeenCalled();
  });

  it("perdendo il focus salva e resta aperta: si chiude solo con Chiudi o Esc (RB-02, RB-04, DEC-53)", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<NotaRapida />);
    fireEvent.change(screen.getByLabelText("Testo"), { target: { value: "prima" } });
    fireEvent.blur(window);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(api.crea).toHaveBeenCalledWith({ contenuto: "prima" });
    expect(chiudiNotaRapida).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("Maiusc + Invio salva e chiude come Chiudi, e il pulsante mostra la scorciatoia (DEC-65)", async () => {
    render(<NotaRapida />);
    await userEvent.type(screen.getByLabelText("Testo"), "idea");
    expect(screen.getByRole("button", { name: /Chiudi/ })).toHaveAttribute(
      "aria-keyshortcuts",
      "Shift+Enter",
    );
    fireEvent.keyDown(screen.getByLabelText("Testo"), { key: "Enter", shiftKey: true });
    await waitFor(() => expect(chiudiNotaRapida).toHaveBeenCalled());
    expect(api.crea).toHaveBeenCalledWith({ contenuto: "idea" });
  });
});
