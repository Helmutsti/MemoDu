// Una voce con l'aspetto di CMP-07 Voce di menu, ma fuori da un menu: un pulsante vero, che
// prende il focus con Tab (in fondo a Info e alla card della ricerca, DEC-96).

import type { ReactElement } from "react";
import type { LucideIcon } from "lucide-react";
import { Icona } from "./Icona";

interface Proprieta {
  etichetta: string;
  icona: LucideIcon;
  scorciatoia?: string;
  /** Azione che toglie qualcosa (Elimina): testo e icona di errore. */
  errore?: boolean;
  onClick: () => void;
}

export function VoceAzione({
  etichetta,
  icona,
  scorciatoia,
  errore,
  onClick,
}: Proprieta): ReactElement {
  return (
    <button
      type="button"
      className={`voce-menu voce-azione ${errore ? "voce-menu-errore" : ""}`}
      onClick={onClick}
    >
      <span className="voce-menu-riga interfaccia-controllo">
        <span className="voce-menu-icona">
          <Icona di={icona} />
        </span>
        <span className="voce-menu-etichetta">{etichetta}</span>
        {scorciatoia && (
          <span className="voce-menu-scorciatoia interfaccia-dettaglio">{scorciatoia}</span>
        )}
      </span>
    </button>
  );
}
