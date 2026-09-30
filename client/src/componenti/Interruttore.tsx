// CMP-04 Interruttore: pista 28 × 16 con il pallino. Senza etichetta e senza clic propri: nella
// riga di impostazione (CMP-18) si clicca tutta la riga, che è lei l'interruttore.

import type { ReactElement } from "react";
import "./Interruttore.css";

export function Interruttore({ acceso }: { acceso: boolean }): ReactElement {
  return (
    <span className={`interruttore ${acceso ? "interruttore-acceso" : ""}`} aria-hidden="true">
      <span className="interruttore-pallino" />
    </span>
  );
}
