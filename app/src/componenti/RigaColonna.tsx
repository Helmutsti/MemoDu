// CMP-06 Riga della colonna: una nota o il titolo di una sezione. Alta 32, pillola.
// Hover: tutto il testo passa a testo-primario (regola 7). Selezionata: sfondo pieno.

import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { ReactElement } from "react";
import { Icona } from "./Icona";
import { Suggerimento } from "./Suggerimento";
import "./RigaColonna.css";

interface ProprietaNota {
  titolo: string;
  /** Senza titolo né testo: «Nota vuota» in testo tenue (RB-15). */
  vuota: boolean;
  selezionata: boolean;
  onApri: () => void;
}

export function RigaNota({ titolo, vuota, selezionata, onApri }: ProprietaNota): ReactElement {
  return (
    <li>
      <button
        type="button"
        className={`riga riga-nota ${selezionata ? "riga-selezionata interfaccia-controllo-attivo" : "interfaccia-controllo"} ${vuota ? "riga-vuota" : ""}`}
        aria-current={selezionata ? "true" : undefined}
        onClick={onApri}
      >
        <span className="riga-nome">{vuota ? "Nota vuota" : titolo}</span>
      </button>
    </li>
  );
}

interface ProprietaSezione {
  titolo: string;
  conteggio: number;
  aperta: boolean;
  onApriChiudi: () => void;
  nomeAggiungi: string;
  onAggiungi: () => void;
}

export function RigaSezione(p: ProprietaSezione): ReactElement {
  return (
    <div className="riga riga-sezione">
      <button
        type="button"
        className="riga-sezione-titolo"
        aria-expanded={p.aperta}
        onClick={p.onApriChiudi}
      >
        <Icona di={p.aperta ? ChevronDown : ChevronRight} misura={12} />
        <span className="riga-nome interfaccia-titolo-sezione">{p.titolo}</span>
        <span className="riga-conteggio interfaccia-dettaglio">{p.conteggio}</span>
      </button>
      <Suggerimento testo={p.nomeAggiungi}>
        <button
          type="button"
          className="riga-aggiungi"
          aria-label={p.nomeAggiungi}
          onClick={p.onAggiungi}
        >
          <Icona di={Plus} />
        </button>
      </Suggerimento>
    </div>
  );
}
