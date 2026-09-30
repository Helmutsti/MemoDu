// CMP-19 Stato vuoto: perché non c'è niente e cosa fare (SF-16).

import type { LucideIcon } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import { Icona } from "./Icona";
import "./StatoVuoto.css";

interface Proprieta {
  icona: LucideIcon;
  titolo: string;
  testo: string;
  azione?: ReactNode;
  /** Variante Blocco: icona in icona-errore (SC-07). */
  errore?: boolean;
}

/** Variante Nota, Cestino o Blocco: al centro dell'area. */
export function StatoVuoto({
  icona,
  titolo,
  testo,
  azione,
  errore = false,
}: Proprieta): ReactElement {
  return (
    <div className="stato-vuoto">
      <span className={`stato-vuoto-icona ${errore ? "stato-vuoto-icona-errore" : ""}`}>
        <Icona di={icona} misura={24} />
      </span>
      <p className="stato-vuoto-titolo interfaccia-titolo">{titolo}</p>
      <p className="stato-vuoto-testo interfaccia-messaggio">{testo}</p>
      {azione && <div className="stato-vuoto-azione">{azione}</div>}
    </div>
  );
}

/** Variante Colonna: una riga di testo tenue. */
export function StatoVuotoColonna({ testo }: { testo: string }): ReactElement {
  return <p className="stato-vuoto-colonna interfaccia-dettaglio">{testo}</p>;
}
