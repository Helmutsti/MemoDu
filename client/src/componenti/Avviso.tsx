// CMP-15 Avviso: in cima all'area della nota, livello 50, non ruba il focus. Tipo Errore, Avviso
// o Informazione; un'azione facoltativa (per esempio «Ripristina») accanto a «Ho capito», che lo
// chiude. Per i file locali i due pulsanti sono le due scelte (RB-85): il secondo cambia
// etichetta. Annunciato senza interrompere, con il tipo (CMP-15).

import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import type { ReactElement } from "react";
import { Icona } from "./Icona";
import { Pulsante } from "./Pulsante";
import "./Avviso.css";

interface Proprieta {
  testo: string;
  tipo?: "errore" | "avviso" | "informazione";
  azione?: { etichetta: string; onClick: () => void };
  onChiudi: () => void;
  /** Il pulsante che chiude: di solito «Ho capito». */
  etichettaChiudi?: string;
}

const ICONE = { errore: CircleAlert, avviso: TriangleAlert, informazione: Info };
const NOMI = { errore: "Errore", avviso: "Avviso", informazione: "Informazione" };

export function Avviso({
  testo,
  tipo = "errore",
  azione,
  onChiudi,
  etichettaChiudi = "Ho capito",
}: Proprieta): ReactElement {
  return (
    <div className={`avviso avviso-${tipo}`} role="status" aria-label={NOMI[tipo]}>
      <span className="avviso-icona">
        <Icona di={ICONE[tipo]} />
      </span>
      <p className="avviso-testo interfaccia-messaggio">{testo}</p>
      {azione && (
        <Pulsante tipo="tenue" onClick={azione.onClick}>
          {azione.etichetta}
        </Pulsante>
      )}
      <Pulsante tipo="tenue" onClick={onChiudi}>
        {etichettaChiudi}
      </Pulsante>
    </div>
  );
}
