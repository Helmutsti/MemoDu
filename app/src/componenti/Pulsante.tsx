// CMP-01 Pulsante: primario, secondario, tenue e solo icona. Alto 32, pillola.
// Il solo icona ha sempre nome accessibile e suggerimento con lo stesso testo.

import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { Suggerimento } from "./Suggerimento";
import "./Pulsante.css";

type Tipo = "primario" | "secondario" | "tenue";

interface Proprieta extends ButtonHTMLAttributes<HTMLButtonElement> {
  tipo?: Tipo;
  icona?: ReactNode;
}

export function Pulsante({
  tipo = "primario",
  icona,
  children,
  className,
  ...resto
}: Proprieta): ReactElement {
  return (
    <button
      type="button"
      className={`pulsante pulsante-${tipo} interfaccia-controllo-attivo ${className ?? ""}`}
      {...resto}
    >
      {icona}
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
