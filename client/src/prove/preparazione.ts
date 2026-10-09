import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

// jsdom non misura il testo: CodeMirror chiede i rettangoli di un intervallo quando riporta il
// cursore in vista (per esempio dopo una voce della bollicina). Rettangoli vuoti bastano.
if (typeof Range !== "undefined") {
  Range.prototype.getClientRects ??= () =>
    ({
      length: 0,
      item: () => null,
      [Symbol.iterator]: [][Symbol.iterator],
    }) as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect ??= () => new DOMRect();
}
