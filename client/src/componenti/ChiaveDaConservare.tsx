// CMP-34 Chiave da conservare (DEC-132, RB-99): la chiave di recupero nuova come un campo di sola
// lettura, in un carattere più piccolo e su due righe a gruppi interi (scelta di Manuel Cucca del
// 14/10/2026: 64 caratteri non stanno su una riga della finestra), con «Copia» a destra; dopo il
// clic «Copiata». Si copia la chiave intera, senza l'a capo.

import { useState, type ReactElement } from "react";
import { Pulsante } from "./Pulsante";
import "./ChiaveDaConservare.css";

/** La chiave in due righe: i primi 7 gruppi di 4 e gli altri. */
export function righeDellaChiave(chiave: string): [string, string] {
  const gruppi = chiave.split("-");
  const meta = Math.ceil(gruppi.length / 2);
  return [gruppi.slice(0, meta).join("-"), gruppi.slice(meta).join("-")];
}

export function ChiaveDaConservare({ chiave }: { chiave: string }): ReactElement {
  const [copiata, setCopiata] = useState(false);
  const [prima, seconda] = righeDellaChiave(chiave);
  return (
    <div className="chiave-da-conservare">
      <span className="chiave-da-conservare-testo interfaccia-dettaglio" aria-label={chiave}>
        <span>{`${prima}-`}</span>
        <span>{seconda}</span>
      </span>
      <Pulsante
        tipo="tenue"
        onClick={() =>
          void navigator.clipboard.writeText(chiave).then(
            () => setCopiata(true),
            () => undefined,
          )
        }
      >
        {copiata ? "Copiata" : "Copia"}
      </Pulsante>
    </div>
  );
}
