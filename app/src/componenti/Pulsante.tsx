// CMP-01 Pulsante: primario, secondario, tenue e solo icona. Alto 32, pillola.
// Il solo icona ha sempre nome accessibile e suggerimento con lo stesso testo.

import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { Icona } from "./Icona";
import { Suggerimento } from "./Suggerimento";
import "./Pulsante.css";

type Tipo = "primario" | "secondario" | "tenue";

interface Proprieta extends ButtonHTMLAttributes<HTMLButtonElement> {
  tipo?: Tipo;
  icona?: ReactNode;
  /** Caricamento: l'icona gira, l'etichetta resta, niente altri clic. */
  inCorso?: boolean;
}

export function Pulsante({
  tipo = "primario",
  icona,
  inCorso = false,
  children,
  className,
  onClick,
  ...resto
}: Proprieta): ReactElement {
  return (
    <button
      type="button"
      className={`pulsante pulsante-${tipo} interfaccia-controllo-attivo ${className ?? ""}`}
      aria-busy={inCorso || undefined}
      onClick={inCorso ? undefined : onClick}
      {...resto}
    >
      {inCorso ? (
        <span className="pulsante-caricamento">
          <Icona di={LoaderCircle} />
        </span>
      ) : (
        icona
      )}
      {children}
    </button>
  );
}

interface ProprietaIcona extends ButtonHTMLAttributes<HTMLButtonElement> {
  nome: string;
  icona: ReactNode;
}

export function PulsanteIcona({ nome, icona, className, ...resto }: ProprietaIcona): ReactElement {
  return (
    <Suggerimento testo={nome}>
      <button
        type="button"
        aria-label={nome}
        className={`pulsante-icona ${className ?? ""}`}
        {...resto}
      >
        {icona}
      </button>
    </Suggerimento>
  );
}
