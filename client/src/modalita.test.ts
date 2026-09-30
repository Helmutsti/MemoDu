import { fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { seguiModalita } from "./modalita";

let togli = () => {};
afterEach(() => {
  togli();
  delete document.documentElement.dataset.tastiera;
  document.body.innerHTML = "";
});

describe("anello del focus solo da tastiera (DEC-74)", () => {
  it("Tab accende l'anello, un clic lo spegne", () => {
    togli = seguiModalita();
    const radice = document.documentElement;
    expect(radice).not.toHaveAttribute("data-tastiera");
    fireEvent.keyDown(document.body, { key: "Tab" });
    expect(radice).toHaveAttribute("data-tastiera");
    fireEvent.pointerDown(document.body);
    expect(radice).not.toHaveAttribute("data-tastiera");
  });

  it("scrivendo non si accende: frecce nei campi, Tab e frecce nel testo della nota", () => {
    togli = seguiModalita();
    const campo = document.createElement("input");
    const testo = document.createElement("div");
    testo.setAttribute("contenteditable", "true");
    document.body.append(campo, testo);
    fireEvent.keyDown(campo, { key: "ArrowLeft" });
    fireEvent.keyDown(testo, { key: "Tab" });
    fireEvent.keyDown(testo, { key: "ArrowDown" });
    fireEvent.keyDown(document.body, { key: "a" });
    expect(document.documentElement).not.toHaveAttribute("data-tastiera");
    fireEvent.keyDown(campo, { key: "Tab" });
    expect(document.documentElement).toHaveAttribute("data-tastiera");
  });
});
