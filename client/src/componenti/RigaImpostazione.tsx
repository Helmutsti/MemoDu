// CMP-18 Riga di impostazione: etichetta e descrizione a sinistra, il controllo a destra. Il
// cambio vale subito, senza Salva (RB-06). Con l'interruttore tutta la riga è l'interruttore;
// con gli altri controlli si attiva solo il controllo. I titoli di gruppo separano le sezioni.

import { useId, type ReactElement, type ReactNode } from "react";
import { Interruttore } from "./Interruttore";
import "./RigaImpostazione.css";

interface Testi {
  etichetta: string;
  descrizione: string;
}

/** Varianti Campo, Scelta, Scorciatoia e Informazione: il controllo lo passa chi la usa. */
export function RigaImpostazione({
  etichetta,
  descrizione,
  children,
  id,
}: Testi & { children?: ReactNode; id?: string }): ReactElement {
  const proprio = useId();
  const idEtichetta = id ?? proprio;
  return (
    <div className="riga-impostazione">
      <span className="riga-impostazione-testi">
        <span id={idEtichetta} className="riga-impostazione-etichetta interfaccia-controllo">
          {etichetta}
        </span>
        <span className="riga-impostazione-descrizione interfaccia-dettaglio">{descrizione}</span>
      </span>
      {children}
    </div>
  );
}

/** Variante Interruttore: si clicca tutta la riga e Spazio la cambia. */
export function RigaInterruttore({
  etichetta,
  descrizione,
  acceso,
  onCambia,
}: Testi & { acceso: boolean; onCambia: (acceso: boolean) => void }): ReactElement {
  const idEtichetta = useId();
  const idDescrizione = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={acceso}
      aria-labelledby={idEtichetta}
      aria-describedby={idDescrizione}
      className="riga-impostazione riga-impostazione-interruttore"
      onClick={() => onCambia(!acceso)}
    >
      <span className="riga-impostazione-testi">
        <span id={idEtichetta} className="riga-impostazione-etichetta interfaccia-controllo">
          {etichetta}
        </span>
        <span id={idDescrizione} className="riga-impostazione-descrizione interfaccia-dettaglio">
          {descrizione}
        </span>
      </span>
      <Interruttore acceso={acceso} />
    </button>
  );
}

export function TitoloGruppo({ children }: { children: ReactNode }): ReactElement {
  return <h2 className="titolo-gruppo interfaccia-titolo-gruppo">{children}</h2>;
}
