// CMP-31 Gruppo di impostazioni (DEC-122): il titolo di gruppo di CMP-18 sopra e le righe in un
// riquadro (sfondo-colonna, ruolo elenco), separate da un divisore.

import { Children, Fragment, useId, type ReactElement, type ReactNode } from "react";
import { TitoloGruppo } from "./RigaImpostazione";
import "./GruppoImpostazioni.css";

/** Le righe dentro un riquadro, con un divisore tra l'una e l'altra (anche in CMP-32). */
export function Riquadro({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): ReactElement {
  const righe = Children.toArray(children);
  return (
    <div className={`riquadro-impostazioni ${className ?? ""}`}>
      {righe.map((riga, i) => (
        <Fragment key={i}>
          {i > 0 && <hr className="divisore-impostazioni" />}
          {riga}
        </Fragment>
      ))}
    </div>
  );
}

export function GruppoImpostazioni({
  titolo,
  children,
}: {
  titolo: string;
  children: ReactNode;
}): ReactElement {
  const id = useId();
  return (
    <section className="gruppo-impostazioni" aria-labelledby={id}>
      <div className="gruppo-impostazioni-intestazione">
        <TitoloGruppo id={id}>{titolo}</TitoloGruppo>
      </div>
      <Riquadro>{children}</Riquadro>
    </section>
  );
}
