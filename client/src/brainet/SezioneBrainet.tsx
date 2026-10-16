// La sezione Brainet della colonna (RF-18, SC-01, DEC-145, DEC-147), sotto CLOUD e sopra LOCALE,
// senza il +: le note nascono in CLOUD e ci arrivano con «Sposta in Brainet». Sotto, Journal,
// Entità e Calendario; la pagina di un'entità tiene selezionata Entità. Senza Brainet acceso la
// sezione non c'è.

import { BookOpen, Brain, Calendar } from "lucide-react";
import { useState, type ReactElement } from "react";
import { RigaSezione, RigaVoce } from "../componenti/RigaColonna";

/** «journal», «entita», «calendario» o la pagina di un'entità, «entita:ID» (FL-26). */
export type VistaBrainet = "journal" | "entita" | "calendario" | `entita:${string}`;

interface Proprieta {
  /** La vista di Brainet aperta, se c'è. */
  aperta: VistaBrainet | null;
  onApri: (vista: VistaBrainet) => void;
}

export function SezioneBrainet({ aperta, onApri }: Proprieta): ReactElement {
  const [espansa, setEspansa] = useState(true);
  return (
    <div className="colonna-sezione">
      <RigaSezione titolo="Brainet" aperta={espansa} onApriChiudi={() => setEspansa((a) => !a)} />
      {espansa && (
        <ul role="group" className="colonna-elenco">
          <RigaVoce
            nome="Journal"
            icona={BookOpen}
            selezionata={aperta === "journal"}
            onApri={() => onApri("journal")}
          />
          <RigaVoce
            nome="Entità"
            icona={Brain}
            selezionata={aperta?.startsWith("entita") ?? false}
            onApri={() => onApri("entita")}
          />
          <RigaVoce
            nome="Calendario"
            icona={Calendar}
            selezionata={aperta === "calendario"}
            onApri={() => onApri("calendario")}
          />
        </ul>
      )}
    </div>
  );
}
