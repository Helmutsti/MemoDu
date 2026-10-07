import { EditorView } from "@codemirror/view";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErroreApi } from "../api";
import { apiLocale, type FileLocale } from "./api";
import { FileAperto } from "./FileAperto";
import { SezioneLocale } from "./SezioneLocale";
import { useLocale } from "./useLocale";
import { VeloRilascio } from "./VeloRilascio";
import { Editor } from "../editor/Editor";
import type { StatoLocale } from "./useLocale";

vi.mock("./api", async (originale) => ({
  ...(await originale<typeof import("./api")>()),
  apiLocale: {
    cartelle: vi.fn(),
    aggiungi: vi.fn(),
    togli: vi.fn(),
    elenca: vi.fn(),
    apri: vi.fn(),
    nuovo: vi.fn(),
    sospendi: vi.fn(),
    salva: vi.fn(),
    scarta: vi.fn(),
    creaCartella: vi.fn(),
    rinomina: vi.fn(),
    sposta: vi.fn(),
    elimina: vi.fn(),
  },
}));

const RADICE = "C:\\prove-locale";
const APPUNTI = `${RADICE}\\appunti`;
const RIUNIONE = `${APPUNTI}\\riunione.txt`;

function stato(altro: Partial<StatoLocale> = {}): StatoLocale {
  return {
    cartelle: [
      {
        percorso: RADICE,
        nome: "prove-locale",
        stato: "presente",
        tipo: "cartella",
        sospeso: false,
      },
      {
        percorso: "D:\\chiavetta-appunti",
        nome: "chiavetta-appunti",
        stato: "non trovata",
        tipo: "cartella",
        sospeso: false,
      },
      {
        percorso: "D:\\lettera.txt",
        nome: "lettera.txt",
        stato: "presente",
        tipo: "file",
        sospeso: true,
      },
    ],
    contenuti: {
      [RADICE]: [
        { nome: "appunti", percorso: APPUNTI, tipo: "cartella", sospeso: false, nuovo: false },
        {
          nome: "idee.md",
          percorso: `${RADICE}\\idee.md`,
          tipo: "file",
          sospeso: false,
          nuovo: false,
        },
      ],
      [APPUNTI]: [
        { nome: "riunione.txt", percorso: RIUNIONE, tipo: "file", sospeso: true, nuovo: false },
      ],
    },
    aperte: new Set([RADICE, APPUNTI]),
    apriChiudi: vi.fn(),
    ricaricaCartelle: vi.fn(async () => {}),
    ricaricaCartella: vi.fn(async () => {}),
    ricaricaAttorno: vi.fn(async () => {}),
    alCambio: vi.fn(() => () => {}),
    esterno: false,
    ...altro,
  };
}

const letto = (altro: Partial<FileLocale> = {}): FileLocale => ({
  testo: "prima",
  sospeso: false,
  nuovo: false,
  codifica: "utf-8",
  solaLettura: false,
  impronta: "aaa",
  cambiatoFuori: false,
  sparito: false,
  ...altro,
});

/** Scrive nell'editor come farebbe l'utente. */
function scrivi(testo: string) {
  const radice = document.querySelector(".cm-editor") as HTMLElement;
  const view = EditorView.findFromDOM(radice)!;
  act(() => view.dispatch({ changes: { from: view.state.doc.length, insert: testo } }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(apiLocale.sospendi).mockResolvedValue(undefined);
  vi.mocked(apiLocale.scarta).mockResolvedValue(undefined);
});

describe("sezione Locale della colonna (RF-17)", () => {
  it("mostra cartelle, file con il pallino delle modifiche non salvate e la cartella non trovata", () => {
    render(
      <SezioneLocale
        locale={stato()}
        fileAperto={null}
        onApriFile={() => {}}
        onFileSpostato={() => {}}
        onErrore={() => {}}
      />,
    );
    expect(screen.getByText("prove-locale")).toBeInTheDocument();
    expect(screen.getByText("idee.md")).toBeInTheDocument();
    const riunione = screen.getByText("riunione.txt").closest("button")!;
    expect(within(riunione).getByRole("img", { name: "non salvato" })).toBeInTheDocument();
    expect(screen.getByText("non trovata")).toBeInTheDocument();
    // Un file trascinato da solo sta nella radice, con il suo pallino (DEC-120).
    const lettera = screen.getByText("lettera.txt").closest("button")!;
    expect(within(lettera).getByRole("img", { name: "non salvato" })).toBeInTheDocument();
  });

  it("mentre si trascina da Esplora file il velo copre la finestra con il messaggio (DEC-120)", () => {
    render(<VeloRilascio />);
    expect(screen.getByRole("status")).toHaveTextContent("Rilascia per aggiungere a Locale");
  });

  it("un file rilasciato sul testo non entra nell'editor (DEC-120)", () => {
    vi.mocked(apiLocale.cartelle).mockResolvedValue([]);
    const onModifica = vi.fn();
    function Prova() {
      useLocale();
      return <Editor contenuto="testo" onModifica={onModifica} />;
    }
    const { container } = render(<Prova />);
    const evento = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(evento, "dataTransfer", {
      value: {
        files: [new File(["incollato"], "lettera.txt")],
        types: ["Files"],
        getData: () => "",
      },
    });
    container.querySelector(".cm-content")!.dispatchEvent(evento);
    expect(evento.defaultPrevented).toBe(true);
    expect(onModifica).not.toHaveBeenCalled();
  });

  it("senza cartelle invita ad aggiungerne una (SF-16)", () => {
    render(
      <SezioneLocale
        locale={stato({ cartelle: [], contenuti: {}, aperte: new Set() })}
        fileAperto={null}
        onApriFile={() => {}}
        onFileSpostato={() => {}}
        onErrore={() => {}}
      />,
    );
    expect(screen.getByText("Nessuna cartella. Aggiungine una con +")).toBeInTheDocument();
  });

  it("dove non c'è il Cestino chiede prima di eliminare per sempre (RB-83)", async () => {
    vi.mocked(apiLocale.elimina)
      .mockRejectedValueOnce(
        new ErroreApi(409, "Questo disco non ha un Cestino", undefined, undefined, "cestino"),
      )
      .mockResolvedValueOnce(undefined);
    render(
      <SezioneLocale
        locale={stato()}
        fileAperto={null}
        onApriFile={() => {}}
        onFileSpostato={() => {}}
        onErrore={() => {}}
      />,
    );
    await userEvent.pointer({ keys: "[MouseRight]", target: screen.getByText("idee.md") });
    await userEvent.click(await screen.findByRole("menuitem", { name: /Elimina/ }));
    const conferma = await screen.findByRole("alertdialog");
    expect(within(conferma).getByText("Eliminare per sempre «idee.md»?")).toBeInTheDocument();
    await userEvent.click(within(conferma).getByRole("button", { name: "Elimina per sempre" }));
    expect(apiLocale.elimina).toHaveBeenLastCalledWith(`${RADICE}\\idee.md`, true);
  });
});

describe("file locale aperto (RF-17, FL-11, FL-13)", () => {
  it("scrivendo compare il pallino; Ctrl + S salva con l'impronta letta e lo toglie (RB-77, RB-79)", async () => {
    vi.mocked(apiLocale.apri).mockResolvedValue(letto());
    vi.mocked(apiLocale.salva).mockResolvedValue({
      percorso: RIUNIONE,
      convertitoInUtf8: false,
      impronta: "bbb",
    });
    render(
      <FileAperto percorso={RIUNIONE} locale={stato()} onPercorso={() => {}} onChiudi={() => {}} />,
    );
    await screen.findByRole("textbox", { name: "Testo di riunione.txt" });
    expect(screen.queryByRole("img", { name: "non salvato" })).toBeNull();
    scrivi(", dopo");
    expect(screen.getByRole("img", { name: "non salvato" })).toBeInTheDocument();
    await userEvent.keyboard("{Control>}s{/Control}");
    await waitFor(() =>
      expect(apiLocale.salva).toHaveBeenCalledWith(RIUNIONE, "prima, dopo", "aaa"),
    );
    await waitFor(() => expect(screen.queryByRole("img", { name: "non salvato" })).toBeNull());
  });

  it("se il disco è cambiato non scrive sopra: avviso con Ricarica e Tieni la mia versione (RB-85)", async () => {
    vi.mocked(apiLocale.apri).mockResolvedValue(letto());
    vi.mocked(apiLocale.salva).mockRejectedValue(
      new ErroreApi(409, "Il file è cambiato sul disco", undefined, undefined, "cambiato"),
    );
    render(
      <FileAperto percorso={RIUNIONE} locale={stato()} onPercorso={() => {}} onChiudi={() => {}} />,
    );
    await screen.findByRole("textbox", { name: "Testo di riunione.txt" });
    scrivi("!");
    await userEvent.keyboard("{Control>}s{/Control}");
    const avviso = await screen.findByRole("status", { name: "Avviso" });
    expect(within(avviso).getByText("riunione.txt è cambiato sul disco.")).toBeInTheDocument();
    vi.mocked(apiLocale.apri).mockResolvedValue(
      letto({ testo: "di Blocco note", impronta: "ccc" }),
    );
    await userEvent.click(within(avviso).getByRole("button", { name: "Ricarica" }));
    expect(apiLocale.scarta).toHaveBeenCalledWith(RIUNIONE);
    await waitFor(() =>
      expect(document.querySelector(".cm-content")?.textContent).toBe("di Blocco note"),
    );
  });

  it("un file oltre 10 MB non si apre e lo dice (SF-17)", async () => {
    vi.mocked(apiLocale.apri).mockRejectedValue(new ErroreApi(413, "Il file pesa 24 MB"));
    render(
      <FileAperto percorso={RIUNIONE} locale={stato()} onPercorso={() => {}} onChiudi={() => {}} />,
    );
    expect(await screen.findByText("Questo file è troppo grande per Memodu")).toBeInTheDocument();
    expect(screen.getByText(/Il file pesa 24 MB/)).toBeInTheDocument();
  });

  it("un file nuovo prende il percorso definitivo al primo salvataggio (RB-81)", async () => {
    const provvisorio = `${APPUNTI}\\.memodu-nuovo-1.md`;
    vi.mocked(apiLocale.apri).mockResolvedValue(
      letto({ testo: "", nuovo: true, sospeso: true, impronta: null }),
    );
    vi.mocked(apiLocale.salva).mockResolvedValue({
      percorso: `${APPUNTI}\\Lista per il trasloco.md`,
      convertitoInUtf8: false,
      impronta: "ddd",
    });
    const onPercorso = vi.fn();
    render(
      <FileAperto
        percorso={provvisorio}
        locale={stato()}
        onPercorso={onPercorso}
        onChiudi={() => {}}
      />,
    );
    await screen.findByRole("textbox", { name: "Testo di Senza titolo" });
    scrivi("Lista per il trasloco");
    await userEvent.keyboard("{Control>}s{/Control}");
    await waitFor(() =>
      expect(onPercorso).toHaveBeenCalledWith(`${APPUNTI}\\Lista per il trasloco.md`),
    );
    expect(apiLocale.salva).toHaveBeenCalledWith(provvisorio, "Lista per il trasloco", null);
  });
});

describe("comparsa del file (DEC-123)", () => {
  it("dentro una cartella ha il nome e solo Chiudi file; Esc la chiude (CA-17.20)", async () => {
    vi.mocked(apiLocale.apri).mockResolvedValue(letto());
    render(
      <FileAperto percorso={RIUNIONE} locale={stato()} onPercorso={() => {}} onChiudi={() => {}} />,
    );
    await userEvent.click(await screen.findByRole("button", { name: "riunione.txt" }));
    const comparsa = screen.getByRole("dialog", { name: "Info di riunione.txt" });
    expect(within(comparsa).getByRole("textbox", { name: "Nome del file" })).toHaveValue(
      "riunione.txt",
    );
    expect(within(comparsa).getByRole("button", { name: /Chiudi file/ })).toBeInTheDocument();
    expect(within(comparsa).queryByRole("button", { name: "Togli da Locale" })).toBeNull();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(apiLocale.rinomina).not.toHaveBeenCalled();
  });

  it("un file aggiunto da solo ha anche Togli da Locale, che lo toglie e chiude (CA-17.20, CA-17.23)", async () => {
    vi.mocked(apiLocale.apri).mockResolvedValue(letto());
    vi.mocked(apiLocale.togli).mockResolvedValue(undefined);
    const locale = stato();
    const onChiudi = vi.fn();
    render(
      <FileAperto
        percorso={"D:\\lettera.txt"}
        locale={locale}
        onPercorso={() => {}}
        onChiudi={onChiudi}
      />,
    );
    await userEvent.click(await screen.findByRole("button", { name: "lettera.txt" }));
    await userEvent.click(screen.getByRole("button", { name: "Togli da Locale" }));
    await waitFor(() => expect(onChiudi).toHaveBeenCalled());
    expect(apiLocale.togli).toHaveBeenCalledWith("D:\\lettera.txt");
    expect(locale.ricaricaCartelle).toHaveBeenCalled();
  });

  it("il nome cambiato con Invio rinomina il file (CA-17.21)", async () => {
    vi.mocked(apiLocale.apri).mockResolvedValue(letto());
    vi.mocked(apiLocale.rinomina).mockResolvedValue({ percorso: `${APPUNTI}\\verbale.txt` });
    const onPercorso = vi.fn();
    render(
      <FileAperto
        percorso={RIUNIONE}
        locale={stato()}
        onPercorso={onPercorso}
        onChiudi={() => {}}
      />,
    );
    await userEvent.click(await screen.findByRole("button", { name: "riunione.txt" }));
    const campo = screen.getByRole("textbox", { name: "Nome del file" });
    await userEvent.clear(campo);
    await userEvent.type(campo, "verbale.txt{Enter}");
    await waitFor(() => expect(onPercorso).toHaveBeenCalledWith(`${APPUNTI}\\verbale.txt`));
    expect(apiLocale.rinomina).toHaveBeenCalledWith(RIUNIONE, "verbale.txt");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Chiudi file con modifiche non salvate chiude senza domande e le lascia in sospeso (CA-17.22)", async () => {
    vi.mocked(apiLocale.apri).mockResolvedValue(letto());
    const onChiudi = vi.fn();
    const { unmount } = render(
      <FileAperto percorso={RIUNIONE} locale={stato()} onPercorso={() => {}} onChiudi={onChiudi} />,
    );
    await screen.findByRole("textbox", { name: "Testo di riunione.txt" });
    scrivi(", dopo");
    await userEvent.click(screen.getByRole("button", { name: "riunione.txt" }));
    await userEvent.click(screen.getByRole("button", { name: /Chiudi file/ }));
    expect(onChiudi).toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).toBeNull();
    unmount();
    await waitFor(() =>
      expect(apiLocale.sospendi).toHaveBeenCalledWith(RIUNIONE, "prima, dopo", "aaa"),
    );
    expect(apiLocale.salva).not.toHaveBeenCalled();
  });

  it("un file nuovo mai salvato ha solo Chiudi file e il nome non si cambia (CA-17.24)", async () => {
    vi.mocked(apiLocale.apri).mockResolvedValue(
      letto({ testo: "", nuovo: true, sospeso: true, impronta: null }),
    );
    render(
      <FileAperto
        percorso={`${APPUNTI}\\.memodu-nuovo-1.md`}
        locale={stato()}
        onPercorso={() => {}}
        onChiudi={() => {}}
      />,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Senza titolo" }));
    expect(screen.getByRole("textbox", { name: "Nome del file" })).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "Togli da Locale" })).toBeNull();
    await userEvent.keyboard("{Enter}");
    expect(apiLocale.rinomina).not.toHaveBeenCalled();
  });
});
