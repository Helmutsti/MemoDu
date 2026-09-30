// CMP-01 Pulsante: primario, secondario, tenue, solo icona e diviso. Alto 32, pillola.
// Il solo icona ha sempre nome accessibile e suggerimento con lo stesso testo.

import { ChevronDown, LoaderCircle, type LucideIcon } from "lucide-react";
import {
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { Icona } from "./Icona";
import { Menu, type VoceMenu } from "./Menu";
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
  ref?: Ref<HTMLButtonElement>;
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

interface ProprietaDiviso {
  etichetta: string;
  onClick: () => void;
  /** Nome della freccia, anche come suggerimento. */
  nomeAltre: string;
  voci: VoceMenu[];
  /** Scorciatoia dell'azione, mostrata con le icone dei tasti accanto all'etichetta (DEC-65);
   * `tasti` per i lettori di schermo, nel formato di aria-keyshortcuts (es. "Shift+Enter"). */
  scorciatoia?: { icone: LucideIcon[]; tasti: string };
}

/** Variante divisa (DEC-34): l'azione a sinistra, la freccia ▾ apre il menu delle azioni collegate. */
export function PulsanteDiviso({
  etichetta,
  onClick,
  nomeAltre,
  voci,
  scorciatoia,
}: ProprietaDiviso): ReactElement {
  const freccia = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; sopra: number } | null>(null);

  const apri = () => {
    const r = freccia.current?.closest(".pulsante-diviso")?.getBoundingClientRect();
    if (r) setMenu({ x: r.left, y: r.bottom + 4, sopra: r.top });
  };

  return (
    <span className="pulsante-diviso">
      <button
        type="button"
        className="pulsante-diviso-azione interfaccia-controllo-attivo"
        aria-keyshortcuts={scorciatoia?.tasti}
        onClick={onClick}
      >
        {etichetta}
        {scorciatoia && (
          <span className="pulsante-diviso-scorciatoia" aria-hidden>
            {scorciatoia.icone.map((icona, i) => (
              <Icona key={i} di={icona} misura={12} />
            ))}
          </span>
        )}
      </button>
      <span className="pulsante-diviso-divisore" aria-hidden />
      <Suggerimento testo={nomeAltre}>
        <button
          ref={freccia}
          type="button"
          aria-label={nomeAltre}
          aria-haspopup="menu"
          aria-expanded={menu !== null}
          className={`pulsante-diviso-freccia ${menu ? "pulsante-diviso-aperto" : ""}`}
          onMouseDown={(e) => menu && e.preventDefault()}
          onClick={() => (menu ? setMenu(null) : apri())}
        >
          <Icona di={ChevronDown} />
        </button>
      </Suggerimento>
      {menu && (
        <Menu
          voci={voci}
          etichetta={nomeAltre}
          x={menu.x}
          y={menu.y}
          sopra={menu.sopra}
          onChiudi={() => setMenu(null)}
        />
      )}
    </span>
  );
}
