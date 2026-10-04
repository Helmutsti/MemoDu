// Mentre si trascina dentro Memodu qualcosa da Esplora file o dal Finder, tutta la finestra si
// oscura con il velo e dice dove andrà: rilasciando, entra in Locale (DEC-120).

import { FolderInput } from "lucide-react";
import type { ReactElement } from "react";
import { Icona } from "../componenti/Icona";
import "./VeloRilascio.css";

export function VeloRilascio(): ReactElement {
  return (
    <div className="velo-rilascio" role="status" aria-live="polite">
      <div className="velo-rilascio-messaggio">
        <Icona di={FolderInput} misura={24} />
        <p className="interfaccia-titolo">Rilascia per aggiungere a Locale</p>
      </div>
    </div>
  );
}
