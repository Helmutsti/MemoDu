// CMP-37 Pallino dello stato: il colore di uno stato di Brainet (EN-16), grande come un'icona e
// disegnato come lei, con il cerchio pieno dentro. Decorativo: accanto c'è sempre il nome.

import type { ReactElement } from "react";
import type { ColoreStato } from "./Menu";
import "./Pallino.css";

export function Pallino({ colore }: { colore: ColoreStato }): ReactElement {
  return (
    <svg
      className={`pallino pallino-${colore}`}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="5" fill="currentColor" />
    </svg>
  );
}
