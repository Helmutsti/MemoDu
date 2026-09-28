// SC-07 Collegamento bloccato, nel frammento Must A quando l'API delle note non risponde o
// non riesce a salvare (RB-61): al posto del contenuto della finestra. Il testo non salvato
// resta in memoria e si salva appena Riprova riesce.

import { CircleAlert } from "lucide-react";
import type { ReactElement } from "react";
import { Pulsante } from "../componenti/Pulsante";
import { StatoVuoto } from "../componenti/StatoVuoto";
import "./Blocco.css";

export function Blocco({
  inCorso,
  onRiprova,
}: {
  inCorso: boolean;
  onRiprova: () => void;
}): ReactElement {
  return (
    <div className="blocco" role="alert">
      <StatoVuoto
        errore
        icona={CircleAlert}
        titolo="Memodu non riesce a collegarsi"
        testo="Il server delle note non risponde. Avvialo e premi Riprova."
        azione={
          <Pulsante inCorso={inCorso} onClick={onRiprova}>
            Riprova
          </Pulsante>
        }
      />
    </div>
  );
}
