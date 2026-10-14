// CMP-33 Casella (DEC-132): una scelta sì o no con la sua etichetta, nelle finestre
// dell'account. Quadrata da 16; si clicca su tutta la riga, Spazio la cambia. La casella tonda
// delle checklist nelle note è un'altra cosa (CMP-20).

import { Check } from "lucide-react";
import type { ReactElement } from "react";
import { Icona } from "./Icona";
import "./Casella.css";

interface Proprieta {
  etichetta: string;
  spuntata: boolean;
  onCambia: (spuntata: boolean) => void;
  disabled?: boolean;
}

export function Casella({ etichetta, spuntata, onCambia, disabled }: Proprieta): ReactElement {
  return (
    <label className="casella interfaccia-controllo">
      <input
        type="checkbox"
        className="casella-input"
        checked={spuntata}
        disabled={disabled}
        onChange={(e) => onCambia(e.target.checked)}
      />
      <span className="casella-riquadro" aria-hidden="true">
        {spuntata && <Icona di={Check} misura={12} />}
      </span>
      {etichetta}
    </label>
  );
}
