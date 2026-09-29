// Pulsanti della finestra su Windows (DEC-55): Riduci a icona, Ingrandisci o Ripristina, Chiudi.
// La finestra non ha la cornice del sistema, quindi Memodu li disegna come quelli di Windows 11:
// 46 × 32, a filo del bordo in alto a destra; Chiudi diventa rosso al passaggio del mouse.

import { Copy, Minus, Square, X } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import { allIngrandimento, finestraSistema } from "../finestra";
import { Icona } from "./Icona";
import "./PulsantiFinestra.css";

export function PulsantiFinestra(): ReactElement {
  const [ingrandita, setIngrandita] = useState(false);
  useEffect(() => allIngrandimento(setIngrandita), []);
  return (
    <div className="pulsanti-finestra">
      <button
        type="button"
        className="pulsante-finestra"
        aria-label="Riduci a icona"
        onClick={() => void finestraSistema.riduci()}
      >
        <Icona di={Minus} misura={12} />
      </button>
      <button
        type="button"
        className="pulsante-finestra"
        aria-label={ingrandita ? "Ripristina" : "Ingrandisci"}
        onClick={() => void finestraSistema.ingrandisci()}
      >
        <Icona di={ingrandita ? Copy : Square} misura={12} />
      </button>
      <button
        type="button"
        className="pulsante-finestra pulsante-finestra-chiudi"
        aria-label="Chiudi"
        onClick={() => void finestraSistema.chiudi()}
      >
        <Icona di={X} misura={12} />
      </button>
    </div>
  );
}
