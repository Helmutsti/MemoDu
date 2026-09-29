// Pulsanti della finestra su Windows (DEC-55): Riduci a icona, Ingrandisci o Ripristina, Chiudi.
// La finestra non ha la cornice del sistema, quindi Memodu li disegna: tondi da 24 nella pillola
// flottante in alto a destra; Chiudi diventa rosso al passaggio.

import { Copy, Minus, Square, X } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import { allIngrandimento, finestraSistema } from "../finestra";
import { Icona } from "./Icona";
import "./PulsantiFinestra.css";

export function PulsantiFinestra(): ReactElement {
  const [ingrandita, setIngrandita] = useState(false);
  useEffect(() => allIngrandimento(setIngrandita), []);
  return (
    <div className="pulsanti-finestra barra-pillola">
      <button
        type="button"
        className="pulsante-finestra"
        aria-label="Riduci a icona"
        onClick={() => void finestraSistema.riduci()}
      >
        <Icona di={Minus} />
      </button>
      <button
        type="button"
        className="pulsante-finestra"
        aria-label={ingrandita ? "Ripristina" : "Ingrandisci"}
        onClick={() => void finestraSistema.ingrandisci()}
      >
        <Icona di={ingrandita ? Copy : Square} />
      </button>
      <button
        type="button"
        className="pulsante-finestra pulsante-finestra-chiudi"
        aria-label="Chiudi"
        onClick={() => void finestraSistema.chiudi()}
      >
        <Icona di={X} />
      </button>
    </div>
  );
}
