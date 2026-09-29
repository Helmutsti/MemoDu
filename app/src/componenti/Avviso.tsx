// CMP-15 Avviso: in cima all'area della nota, livello 50, non ruba il focus. Tipo Errore o
// Avviso; un'azione facoltativa (per esempio «Ripristina») accanto a «Ho capito», che lo
// chiude. Annunciato senza interrompere, con il tipo (CMP-15).

import { CircleAlert, TriangleAlert } from "lucide-react";
import type { ReactElement } from "react";
import { Icona } from "./Icona";
import { Pulsante } from "./Pulsante";
import "./Avviso.css";

interface Proprieta {
  testo: string;
  tipo?: "errore" | "avviso";
  azione?: { etichetta: string; onClick: () => void };
  onChiudi: () => void;
}

export function Avviso({ testo, tipo = "errore", azione, onChiudi }: Proprieta): ReactElement {
  return (
    <div
      className={`avviso avviso-${tipo}`}
      role="status"
      aria-label={tipo === "errore" ? "Errore" : "Avviso"}
    >
      <span className="avviso-icona">
        <Icona di={tipo === "errore" ? CircleAlert : TriangleAlert} />
      </span>
      <p className="avviso-testo interfaccia-messaggio">{testo}</p>
      {azione && (
        <Pulsante tipo="tenue" onClick={azione.onClick}>
          {azione.etichetta}
        </Pulsante>
      )}
      <Pulsante tipo="tenue" onClick={onChiudi}>
        Ho capito
      </Pulsante>
    </div>
  );
}
