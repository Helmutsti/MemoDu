// SC-07 Collegamento bloccato, quando la copia di lavoro non si apre o non si scrive, o una
// nota supera 4 MB (RB-61, DEC-127): al posto del contenuto della finestra. Il testo non
// salvato resta in memoria e si salva appena Riprova riesce.

import { CircleAlert } from "lucide-react";
import type { ReactElement } from "react";
import { Pulsante } from "../componenti/Pulsante";
import { StatoVuoto } from "../componenti/StatoVuoto";
import "./Blocco.css";

export function Blocco({
  inCorso,
  onRiprova,
  testo = "Memodu non riesce a salvare le note su questo computer. Premi Riprova; se non basta, controlla lo spazio sul disco.",
}: {
  inCorso: boolean;
  onRiprova: () => void;
  /** Cosa correggere: di default la copia di lavoro che non si scrive (RB-61, DEC-127). */
  testo?: string;
}): ReactElement {
  return (
    <div className="blocco" role="alert">
      <StatoVuoto
        errore
        icona={CircleAlert}
        titolo="Memodu non riesce a collegarsi"
        testo={testo}
        azione={
          <Pulsante inCorso={inCorso} onClick={onRiprova}>
            Riprova
          </Pulsante>
        }
      />
    </div>
  );
}
