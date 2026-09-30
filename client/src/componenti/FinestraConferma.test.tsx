import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FinestraConferma } from "./FinestraConferma";

function apri() {
  const onAnnulla = vi.fn();
  const onConferma = vi.fn();
  render(
    <FinestraConferma
      titolo="La nota non è salvata"
      testo="Chiudendo, il testo va perso."
      azione="Chiudi comunque"
      onAnnulla={onAnnulla}
      onConferma={onConferma}
    />,
  );
  return { onAnnulla, onConferma };
}

describe("CMP-16 Finestra di conferma (RB-62, CA-01.8)", () => {
  it("mostra i testi e parte con il focus su Annulla", () => {
    apri();
    expect(
      screen.getByRole("alertdialog", { name: "La nota non è salvata" }),
    ).toHaveAccessibleDescription("Chiudendo, il testo va perso.");
    expect(screen.getByRole("button", { name: "Annulla" })).toHaveFocus();
  });

  it("Esc equivale ad Annulla, il focus resta dentro e Chiudi comunque conferma", async () => {
    const { onAnnulla, onConferma } = apri();
    await userEvent.keyboard("{Escape}");
    expect(onAnnulla).toHaveBeenCalled();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Chiudi comunque" })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Annulla" })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "Chiudi comunque" }));
    expect(onConferma).toHaveBeenCalled();
  });
});
