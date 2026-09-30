// CMP-27 Comparsa dei metadati: ultima modifica e tag della nota aperta in un riquadro
// flottante 8 px sotto il titolo del percorso, centrato (DEC-71). Livello 20: si disegna
// fuori dal contenitore, che altrimenti lo taglierebbe. Non si clicca: date e tag si
// modificano da Dettagli (CMP-24).

import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { testoModificata } from "../date";
import { Tag } from "./Tag";
import "./ComparsaMetadati.css";

interface Proprieta {
  id: string;
  modificata: string;
  tag: string[];
  /** Centro orizzontale e bordo inferiore del titolo, in coordinate della finestra. */
  x: number;
  y: number;
}

export function ComparsaMetadati({ id, modificata, tag, x, y }: Proprieta): ReactElement {
  return createPortal(
    <div id={id} role="tooltip" className="comparsa-metadati" style={{ left: x, top: y + 8 }}>
      <p className="comparsa-metadati-data interfaccia-dettaglio">{testoModificata(modificata)}</p>
      {tag.length > 0 && (
        <div className="comparsa-metadati-tag" aria-label="Tag">
          {tag.map((nome) => (
            <Tag key={nome} nome={nome} />
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
