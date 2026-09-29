import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Editor } from "./Editor";

function apri(contenuto: string) {
  const onModifica = vi.fn();
  const { container } = render(<Editor contenuto={contenuto} focus onModifica={onModifica} />);
  const testo = container.querySelector(".cm-content") as HTMLElement;
  testo.focus();
  return { testo, ultimo: () => onModifica.mock.calls.at(-1)?.[0] as string | undefined };
}

describe("CMP-20 testo puro (DEC-64)", () => {
  it("Tab rientra la riga e Maiusc + Tab la riporta indietro", () => {
    const { testo, ultimo } = apri("uno");
    fireEvent.keyDown(testo, { key: "Tab", code: "Tab", keyCode: 9 });
    expect(ultimo()).toBe("\tuno");
    fireEvent.keyDown(testo, { key: "Tab", code: "Tab", keyCode: 9, shiftKey: true });
    expect(ultimo()).toBe("uno");
  });

  it("il markdown resta testo: nessuna formattazione né simbolo nascosto", () => {
    const { testo } = apri("# titolo\n**grassetto**");
    expect(testo.textContent).toContain("# titolo");
    expect(testo.textContent).toContain("**grassetto**");
    expect(testo.querySelector(".md-titolo, .md-grassetto")).toBeNull();
  });
});
