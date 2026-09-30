import { describe, expect, it } from "vitest";
import { daTasto, scriviScorciatoia } from "./scorciatoia";

const tasto = (code: string, key: string, mod: Partial<KeyboardEventInit> = {}) =>
  new KeyboardEvent("keydown", { code, key, ...mod });

describe("scorciatoia della nota rapida (DEC-91)", () => {
  it("dal tasto premuto al formato del nucleo, con i modificatori in ordine", () => {
    expect(daTasto(tasto("KeyN", "n", { altKey: true, ctrlKey: true }))).toBe("Control+Alt+KeyN");
    expect(daTasto(tasto("Space", " ", { shiftKey: true, ctrlKey: true }))).toBe(
      "Control+Shift+Space",
    );
    expect(daTasto(tasto("Digit5", "5", { metaKey: true, altKey: true }))).toBe("Alt+Super+Digit5");
  });

  it("mentre si premono solo i modificatori aspetta", () => {
    expect(daTasto(tasto("ControlLeft", "Control", { ctrlKey: true }))).toBeNull();
    expect(daTasto(tasto("AltRight", "Alt", { ctrlKey: true, altKey: true }))).toBeNull();
  });

  it("con meno di due modificatori o un tasto che non si usa non vale", () => {
    expect(daTasto(tasto("KeyC", "c", { ctrlKey: true }))).toBe("non valida");
    expect(daTasto(tasto("KeyN", "n"))).toBe("non valida");
    expect(daTasto(tasto("Comma", ",", { ctrlKey: true, altKey: true }))).toBe("non valida");
  });

  it("si scrive con i nomi dei tasti di ogni sistema", () => {
    expect(scriviScorciatoia("Control+Alt+KeyN", "windows")).toBe("Ctrl + Alt + N");
    expect(scriviScorciatoia("Control+Alt+KeyN", "macos")).toBe("Control + Option + N");
    expect(scriviScorciatoia("Control+Shift+Space", "windows")).toBe("Ctrl + Maiusc + Spazio");
    expect(scriviScorciatoia("Alt+Super+Digit5", "windows")).toBe("Alt + Win + 5");
  });
});
