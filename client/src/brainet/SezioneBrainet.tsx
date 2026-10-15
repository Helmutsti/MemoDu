// La sezione Brainet della colonna (RF-18, SC-01), sotto CLOUD e sopra LOCALE: il + accanto al
// titolo apre un foglio nuovo (RB-101); sotto Database, Entità e Calendario. Database non c'è
// con «Mostra il Database» spento (RB-106). Senza Brainet acceso la sezione non c'è.

import { Brain, Calendar, Database } from "lucide-react";
import { useState, type ReactElement } from "react";
import { RigaSezione, RigaVoce } from "../componenti/RigaColonna";

export type VistaBrainet = "foglio" | "database" | "entita" | "calendario";

interface Proprieta {
  mostraDatabase: boolean;
  /** La vista di Brainet aperta, se c'è. */
  aperta: VistaBrainet | null;
  onApri: (vista: VistaBrainet) => void;
}

export function SezioneBrainet({ mostraDatabase, aperta, onApri }: Proprieta): ReactElement {
  const [espansa, setEspansa] = useState(true);
  return (
    <div className="colonna-sezione">
      <RigaSezione
        titolo="Brainet"
        aperta={espansa}
        onApriChiudi={() => setEspansa((a) => !a)}
        nomeAggiungi="Nuova nota Brainet"
        onAggiungi={() => onApri("foglio")}
      />
      {espansa && (
        <ul role="group" className="colonna-elenco">
          {mostraDatabase && (
            <RigaVoce
              nome="Database"
              icona={Database}
              selezionata={aperta === "database"}
              onApri={() => onApri("database")}
            />
          )}
          <RigaVoce
            nome="Entità"
            icona={Brain}
            selezionata={aperta === "entita"}
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
