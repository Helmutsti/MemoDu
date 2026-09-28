// CMP-15 Avviso, variante Errore: in cima all'area della nota, livello 50, non ruba il focus.
// «Ho capito» lo chiude. Annunciato senza interrompere, con il tipo (CMP-15).

import { CircleAlert } from "lucide-react";
import type { ReactElement } from "react";
import { Icona } from "./Icona";
import { Pulsante } from "./Pulsante";
import "./Avviso.css";

export function Avviso({ testo, onChiudi }: { testo: string; onChiudi: () => void }): ReactElement {
  return (
    <div className="avviso avviso-errore" role="status" aria-label="Errore">
      <span className="avviso-icona">
        <Icona di={CircleAlert} />
      </span>
      <p className="avviso-testo interfaccia-messaggio">{testo}</p>
      <Pulsante tipo="tenue" onClick={onChiudi}>
        Ho capito
      </Pulsante>
    </div>
  );
}
