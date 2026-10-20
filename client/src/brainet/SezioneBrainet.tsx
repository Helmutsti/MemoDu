// Brainet nella colonna (RF-18, SC-01, DEC-154): sotto la ricerca, una barra di quattro tessere,
// Scrivi (DEC-168), Journal, Entità e Calendario (CMP-49, fatta di tessere CMP-48). La tessera della vista aperta è
// piena; la pagina di un'entità tiene piena Entità. Mentre si trascina una nota, il Journal la
// riceve: la tessera si accende e, rilasciata, chiede la conferma di «Sposta in Brainet» (FL-28).
// Senza Brainet acceso la barra non c'è.

import { BookOpen, Brain, Calendar, Pencil, type LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import { Icona } from "../componenti/Icona";
import "./SezioneBrainet.css";

/** «journal», «entita», «calendario», la pagina di un'entità, «entita:ID» (FL-26), o la pagina
 * nuova di «Scrivi», «scrivi:ID» (FL-29). */
export type VistaBrainet =
  | "journal"
  | "entita"
  | "calendario"
  | `entita:${string}`
  | `scrivi:${string}`;

/** Il Journal come destinazione del trascinamento, dalla colonna. */
export interface RilascioJournal {
  /** Una nota ci passa sopra. */
  sopra: boolean;
  /** Presente mentre si trascina una nota: rende la tessera una destinazione. */
  "data-destinazione"?: string;
}

interface Proprieta {
  /** La vista di Brainet aperta, se c'è. */
  aperta: VistaBrainet | null;
  onApri: (vista: VistaBrainet) => void;
  /** «Scrivi»: una pagina nuova in Brainet (RB-134). */
  onScrivi: () => void;
  journal?: RilascioJournal;
}

function Tessera({
  nome,
  icona,
  selezionata,
  onApri,
  rilascio,
}: {
  nome: string;
  icona: LucideIcon;
  selezionata: boolean;
  onApri: () => void;
  rilascio?: RilascioJournal;
}): ReactElement {
  const { sopra = false, ...destinazione } = rilascio ?? {};
  return (
    <li className="tessera-posto">
      <button
        type="button"
        className={`tessera interfaccia-etichetta ${selezionata ? "tessera-selezionata" : ""} ${sopra ? "tessera-sopra" : ""}`}
        aria-current={selezionata ? "page" : undefined}
        onClick={onApri}
        {...destinazione}
      >
        <Icona di={icona} misura={20} />
        {nome}
      </button>
      {sopra && (
        <span className="tessera-suggerimento interfaccia-dettaglio" role="status">
          Rilascia: va in Brainet
        </span>
      )}
    </li>
  );
}

export function SezioneBrainet({ aperta, onApri, onScrivi, journal }: Proprieta): ReactElement {
  return (
    <ul className="barra-tessere" aria-label="Brainet">
      <Tessera
        nome="Scrivi"
        icona={Pencil}
        selezionata={aperta?.startsWith("scrivi:") ?? false}
        onApri={onScrivi}
      />
      <Tessera
        nome="Journal"
        icona={BookOpen}
        selezionata={aperta === "journal"}
        onApri={() => onApri("journal")}
        rilascio={journal}
      />
      <Tessera
        nome="Entità"
        icona={Brain}
        selezionata={aperta?.startsWith("entita") ?? false}
        onApri={() => onApri("entita")}
      />
      <Tessera
        nome="Calendario"
        icona={Calendar}
        selezionata={aperta === "calendario"}
        onApri={() => onApri("calendario")}
      />
    </ul>
  );
}
