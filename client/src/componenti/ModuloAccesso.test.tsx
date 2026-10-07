import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModuloAccesso } from "./ModuloAccesso";

function apri(onAccedi = vi.fn(async () => null as string | null)) {
  const onChiudi = vi.fn();
  const onSenzaCloud = vi.fn();
  render(<ModuloAccesso onAccedi={onAccedi} onChiudi={onChiudi} onSenzaCloud={onSenzaCloud} />);
  const velo = screen.getByRole("dialog", { name: "Accedi a Memodu" }).parentElement!;
  return { onChiudi, onSenzaCloud, velo };
}

describe("CMP-22 Modulo di accesso: clic fuori (DEC-124)", () => {
  it("un clic sul velo chiude soltanto, senza scollegare", () => {
    const { onChiudi, onSenzaCloud, velo } = apri();
    fireEvent.mouseDown(velo);
    fireEvent.click(velo);
    expect(onChiudi).toHaveBeenCalledTimes(1);
    expect(onSenzaCloud).not.toHaveBeenCalled();
  });

  it("selezionare trascinando da un campo fino al velo non chiude", () => {
    const { onChiudi, velo } = apri();
    fireEvent.mouseDown(screen.getByLabelText("Email"));
    fireEvent.click(velo);
    expect(onChiudi).not.toHaveBeenCalled();
  });

  it("mentre l'accesso è in corso il clic fuori non conta", async () => {
    let finisci: (v: string | null) => void = () => {};
    const onAccedi = vi.fn(() => new Promise<string | null>((r) => (finisci = r)));
    const { onChiudi, velo } = apri(onAccedi);
    await userEvent.type(screen.getByLabelText("Email"), "manuel@esempio.it");
    await userEvent.type(screen.getByLabelText("Password"), "una frase lunga e mia{Enter}");
    expect(onAccedi).toHaveBeenCalled();
    fireEvent.mouseDown(velo);
    fireEvent.click(velo);
    expect(onChiudi).not.toHaveBeenCalled();
    finisci("Email o password non corrette.");
    await screen.findByRole("alert");
    fireEvent.mouseDown(velo);
    fireEvent.click(velo);
    expect(onChiudi).toHaveBeenCalledTimes(1);
  });
});
