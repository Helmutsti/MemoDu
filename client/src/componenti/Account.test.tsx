// Le finestre dell'account (DEC-132): recupero e chiave nuova (CMP-22), cambio della password
// (CMP-35), dispositivi collegati (CMP-36), la casella (CMP-33) e la chiave da conservare (CMP-34).

import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { DispositivoCollegato } from "../api";
import { BoxAccount } from "./BoxAccount";
import { CambiaPassword } from "./CambiaPassword";
import { Casella } from "./Casella";
import { righeDellaChiave } from "./ChiaveDaConservare";
import { DispositiviCollegati } from "./DispositiviCollegati";
import { ModuloAccesso } from "./ModuloAccesso";

const CHIAVE = "TT84-GQ8K-AU43-L55M-LRDJ-4Z4K-WSX2-SQCQ-B982-5WXC-FJYQ-SVHY-3NTS";

describe("CMP-33 Casella e CMP-34 Chiave da conservare", () => {
  it("la casella cambia con un clic sull'etichetta", async () => {
    const onCambia = vi.fn();
    render(
      <Casella
        etichetta="Scollega gli altri miei dispositivi"
        spuntata={false}
        onCambia={onCambia}
      />,
    );
    await userEvent.click(screen.getByText("Scollega gli altri miei dispositivi"));
    expect(onCambia).toHaveBeenCalledWith(true);
  });

  it("la chiave sta in due righe a gruppi interi", () => {
    expect(righeDellaChiave(CHIAVE)).toEqual([
      "TT84-GQ8K-AU43-L55M-LRDJ-4Z4K-WSX2",
      "SQCQ-B982-5WXC-FJYQ-SVHY-3NTS",
    ]);
  });
});

describe("CMP-22 recupero dell'account (CA-14.26 … CA-14.28)", () => {
  const apri = (
    onRecupera = vi.fn(async () => ({ chiave: CHIAVE }) as { chiave: string } | { errore: string }),
  ) => {
    const onRecuperato = vi.fn();
    render(
      <ModuloAccesso
        emailIniziale="manuel@esempio.it"
        onAccedi={async () => null}
        onRecupera={onRecupera}
        onRecuperato={onRecuperato}
        onSenzaCloud={() => undefined}
        onChiudi={() => undefined}
      />,
    );
    return { onRecupera, onRecuperato };
  };
  const compila = async (nuova = "una frase lunga e mia", ripetuta = nuova) => {
    await userEvent.click(screen.getByRole("button", { name: "Password dimenticata?" }));
    await userEvent.type(screen.getByLabelText("Chiave di recupero"), CHIAVE);
    await userEvent.type(screen.getByLabelText("Password nuova"), nuova);
    await userEvent.type(screen.getByLabelText("Ripeti la password nuova"), ripetuta);
  };

  it("«Password dimenticata?» apre il recupero con l'email già scritta; «Torna all'accesso» torna", async () => {
    apri();
    await userEvent.click(screen.getByRole("button", { name: "Password dimenticata?" }));
    expect(screen.getByRole("dialog", { name: "Recupera l'account" })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("manuel@esempio.it");
    expect(
      screen.getByRole("checkbox", { name: "Scollega gli altri miei dispositivi" }),
    ).not.toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Torna all'accesso" }));
    expect(screen.getByRole("dialog", { name: "Accedi a Memodu" })).toBeInTheDocument();
  });

  it("due password diverse: il messaggio, e la richiesta non parte", async () => {
    const { onRecupera } = apri();
    await compila("una frase lunga e mia", "una frase lunga e tua");
    await userEvent.click(screen.getByRole("button", { name: "Recupera" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Le due password non sono uguali.");
    expect(onRecupera).not.toHaveBeenCalled();
  });

  it("l'errore del recupero si mostra sopra i pulsanti", async () => {
    apri(vi.fn(async () => ({ errore: "Chiave di recupero non corretta." })));
    await compila();
    await userEvent.click(screen.getByRole("button", { name: "Recupera" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Chiave di recupero non corretta.");
  });

  it("riuscito: la chiave nuova, che Esc non chiude; «Ho conservato la chiave» chiude", async () => {
    const { onRecupera, onRecuperato } = apri();
    await compila();
    await userEvent.click(screen.getByLabelText("Scollega gli altri miei dispositivi"));
    await userEvent.click(screen.getByRole("button", { name: "Recupera" }));
    expect(onRecupera).toHaveBeenCalledWith(
      "manuel@esempio.it",
      CHIAVE,
      "una frase lunga e mia",
      true,
    );
    const finestra = await screen.findByRole("dialog", { name: "La tua nuova chiave di recupero" });
    expect(within(finestra).getByLabelText(CHIAVE)).toBeInTheDocument();
    fireEvent.keyDown(finestra, { key: "Escape" });
    expect(onRecuperato).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Ho conservato la chiave" }));
    expect(onRecuperato).toHaveBeenCalled();
  });
});

describe("CMP-35 Cambia password (CA-14.31 … CA-14.33)", () => {
  it("con la password attuale: si chiude; con la chiave di recupero: mostra la chiave nuova", async () => {
    const onCambia = vi.fn(async (v: object) => ({ chiave: "attuale" in v ? null : CHIAVE }));
    const onChiudi = vi.fn();
    const { unmount } = render(<CambiaPassword onCambia={onCambia} onChiudi={onChiudi} />);
    await userEvent.type(screen.getByLabelText("Password attuale"), "una frase lunga e mia");
    await userEvent.type(screen.getByLabelText("Password nuova"), "una frase nuova e mia");
    await userEvent.type(
      screen.getByLabelText("Ripeti la password nuova"),
      "una frase nuova e mia",
    );
    await userEvent.click(screen.getByRole("button", { name: "Cambia password" }));
    expect(onCambia).toHaveBeenCalledWith(
      { attuale: "una frase lunga e mia" },
      "una frase nuova e mia",
      false,
    );
    expect(onChiudi).toHaveBeenCalled();
    unmount();

    render(<CambiaPassword onCambia={onCambia} onChiudi={onChiudi} />);
    await userEvent.click(screen.getByRole("button", { name: "Usa la chiave di recupero" }));
    expect(screen.getByRole("button", { name: "Usa la password attuale" })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Chiave di recupero"), CHIAVE);
    await userEvent.type(screen.getByLabelText("Password nuova"), "una frase nuova e mia");
    await userEvent.type(
      screen.getByLabelText("Ripeti la password nuova"),
      "una frase nuova e mia",
    );
    await userEvent.click(screen.getByRole("button", { name: "Cambia password" }));
    expect(
      await screen.findByRole("dialog", { name: "La tua nuova chiave di recupero" }),
    ).toBeInTheDocument();
  });

  it("verifica sbagliata: il messaggio e la finestra resta", async () => {
    const onChiudi = vi.fn();
    render(
      <CambiaPassword
        onCambia={async () => ({ errore: "Password attuale non corretta." })}
        onChiudi={onChiudi}
      />,
    );
    await userEvent.type(screen.getByLabelText("Password attuale"), "sbagliata del tutto");
    await userEvent.type(screen.getByLabelText("Password nuova"), "una frase nuova e mia");
    await userEvent.type(
      screen.getByLabelText("Ripeti la password nuova"),
      "una frase nuova e mia",
    );
    await userEvent.click(screen.getByRole("button", { name: "Cambia password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Password attuale non corretta.");
    expect(onChiudi).not.toHaveBeenCalled();
  });
});

describe("CMP-36 Dispositivi collegati (CA-16.1 … CA-16.4)", () => {
  const elenco: DispositivoCollegato[] = [
    {
      id: "a",
      nome: "Portatile di casa",
      tipo: "windows",
      ultimaSincronizzazione: null,
      questo: true,
    },
    {
      id: "b",
      nome: "MacBook dell'ufficio",
      tipo: "macos",
      ultimaSincronizzazione: new Date().toISOString(),
      questo: false,
    },
  ];

  it("questo dispositivo è il primo e non ha «Scollega»; la conferma sta nella riga", async () => {
    const onScollega = vi.fn(async () => undefined);
    render(
      <DispositiviCollegati
        onElenca={async () => elenco}
        onScollega={onScollega}
        onChiudi={() => undefined}
      />,
    );
    expect(await screen.findByText("Windows · questo dispositivo")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Scollega Portatile di casa" }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Scollega MacBook dell'ufficio" }));
    const riga = screen.getByRole("group", { name: "Scollegare MacBook dell'ufficio" });
    await userEvent.click(within(riga).getByRole("button", { name: "Annulla" }));
    expect(screen.getByText("MacBook dell'ufficio")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Scollega MacBook dell'ufficio" }));
    await userEvent.click(
      within(screen.getByRole("group")).getByRole("button", { name: "Scollega" }),
    );
    expect(onScollega).toHaveBeenCalledWith("b");
    expect(screen.queryByText("MacBook dell'ufficio")).not.toBeInTheDocument();
  });

  it("senza server il messaggio al posto dell'elenco", async () => {
    render(
      <DispositiviCollegati
        onElenca={() => Promise.reject(new Error("rete"))}
        onScollega={async () => undefined}
        onChiudi={() => undefined}
      />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Server non raggiungibile. Riprova tra poco.",
    );
  });
});

describe("CMP-32 i collegamenti dell'account (CA-14.30)", () => {
  const stato = { collegata: true, ultimaRiuscita: null, problema: null } as never;
  it("collegato ci sono; con l'accesso chiuso no", () => {
    const { rerender } = render(
      <BoxAccount
        email="manuel@esempio.it"
        stato={stato}
        uscendo={false}
        onAccedi={() => undefined}
        onEsci={() => undefined}
      />,
    );
    expect(screen.getByRole("button", { name: "Cambia password" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dispositivi collegati" })).toBeInTheDocument();
    rerender(
      <BoxAccount
        email="manuel@esempio.it"
        stato={{ collegata: true, ultimaRiuscita: null, problema: "rifiutate" } as never}
        uscendo={false}
        onAccedi={() => undefined}
        onEsci={() => undefined}
      />,
    );
    expect(screen.queryByRole("button", { name: "Cambia password" })).not.toBeInTheDocument();
  });
});
