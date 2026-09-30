// CMP-11 Pannello a comparsa, variante Sposta in: campo di ricerca, poi «Non organizzate» e
// l'albero delle cartelle come voci di menu, con 16 px di rientro per livello e la spunta
// sulla cartella attuale. Scrivendo si filtra l'albero, le frecce scelgono, Invio sposta,
// Esc o un clic fuori chiudono (CMP-11, FL-05).

import { Check, ChevronDown, ChevronRight, Search } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import type { Cartella, Percorso } from "@memodu/condiviso";
import { Icona } from "./Icona";
import "./Menu.css";
import "./PannelloSpostaIn.css";

interface Voce {
  percorso: Percorso;
  nome: string;
  livello: number;
  /** undefined per «Non organizzate», che non ha freccia. */
  aperta?: boolean;
  haFigli: boolean;
}

interface Proprieta {
  cartelle: Cartella[];
  /** Cartella in cui sta la nota: ha la spunta. */
  attuale: Percorso;
  /** Bordo destro e basso del ··· da cui si apre, in coordinate della finestra. */
  destra: number;
  y: number;
  onScegli: (percorso: Percorso) => void;
  onChiudi: () => void;
}

const MARGINE_FINESTRA = 8;
const contiene = (nome: string, filtro: string) =>
  nome.toLocaleLowerCase("it").includes(filtro.toLocaleLowerCase("it"));

/** Gli antenati di un percorso: «A/B/C» → «A», «A/B». */
const antenati = (percorso: Percorso) =>
  percorso
    .split("/")
    .slice(0, -1)
    .map((_, i, parti) => parti.slice(0, i + 1).join("/"));

export function PannelloSpostaIn({
  cartelle,
  attuale,
  destra,
  y,
  onScegli,
  onChiudi,
}: Proprieta): ReactElement {
  const pannello = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const [filtro, setFiltro] = useState("");
  const [aperte, setAperte] = useState(() => new Set(antenati(attuale).concat(attuale)));
  /** Voce evidenziata; -1 finché non ci si muove: vale la prima cartella che corrisponde. */
  const [attiva, setAttiva] = useState(-1);
  const [posizione, setPosizione] = useState({ x: destra, y });

  // Si apre sotto il ···, allineato a destra, e resta dentro la finestra.
  useLayoutEffect(() => {
    const r = pannello.current?.getBoundingClientRect();
    if (!r) return;
    setPosizione({
      x: Math.max(MARGINE_FINESTRA, destra - r.width),
      y: Math.max(MARGINE_FINESTRA, Math.min(y, window.innerHeight - r.height - MARGINE_FINESTRA)),
    });
  }, [destra, y]);

  useEffect(() => campo.current?.focus(), []);

  const voci = useMemo(() => {
    const risultato: Voce[] = [
      { percorso: "", nome: "Non organizzate", livello: 0, haFigli: false },
    ];
    const visita = (elenco: Cartella[], livello: number): boolean => {
      let trovata = false;
      for (const c of elenco) {
        const posizione = risultato.length;
        const aperta = filtro !== "" || aperte.has(c.percorso);
        risultato.push({
          percorso: c.percorso,
          nome: c.nome,
          livello,
          aperta,
          haFigli: c.cartelle.length > 0,
        });
        const figliTrovati = aperta ? visita(c.cartelle, livello + 1) : false;
        // Con il filtro restano le cartelle che corrispondono e i loro antenati.
        if (filtro !== "" && !contiene(c.nome, filtro) && !figliTrovati) {
          risultato.splice(posizione);
        } else {
          trovata = true;
        }
      }
      return trovata;
    };
    visita(cartelle, 0);
    if (filtro !== "" && !contiene("Non organizzate", filtro)) risultato.shift();
    return risultato;
  }, [cartelle, aperte, filtro]);

  // La voce evidenziata resta dentro l'elenco anche quando il filtro lo accorcia.
  const indice =
    attiva < 0
      ? Math.max(0, filtro === "" ? 0 : voci.findIndex((v) => contiene(v.nome, filtro)))
      : Math.min(attiva, Math.max(0, voci.length - 1));

  const apriChiudi = (percorso: Percorso, apri?: boolean) =>
    setAperte((prima) => {
      const dopo = new Set(prima);
      if (apri ?? !dopo.has(percorso)) dopo.add(percorso);
      else dopo.delete(percorso);
      return dopo;
    });

  useEffect(() => {
    const suClic = (e: MouseEvent) => {
      if (!pannello.current?.contains(e.target as Node)) onChiudi();
    };
    window.addEventListener("mousedown", suClic, true);
    return () => window.removeEventListener("mousedown", suClic, true);
  }, [onChiudi]);

  const idElenco = useId();
  const idVoce = (i: number) => `${idElenco}-${i}`;

  const suTasto = (e: React.KeyboardEvent) => {
    const voce = voci[indice];
    const azioni: Record<string, () => void> = {
      ArrowDown: () => setAttiva((indice + 1) % voci.length),
      ArrowUp: () => setAttiva((indice - 1 + voci.length) % voci.length),
      ArrowRight: () => voce?.haFigli && apriChiudi(voce.percorso, true),
      ArrowLeft: () => voce?.haFigli && apriChiudi(voce.percorso, false),
      Enter: () => voce && onScegli(voce.percorso),
      Escape: onChiudi,
    };
    const azione = azioni[e.key];
    if (!azione || voci.length === 0) {
      if (e.key === "Escape") onChiudi();
      return;
    }
    if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && filtro !== "") return;
    e.preventDefault();
    e.stopPropagation();
    azione();
  };

  return createPortal(
    <div
      ref={pannello}
      className="menu pannello-sposta"
      role="dialog"
      aria-label="Sposta in"
      style={{ left: posizione.x, top: posizione.y }}
      onKeyDown={suTasto}
    >
      <div className="pannello-sposta-ricerca">
        <span className="pannello-sposta-cerca">
          <Icona di={Search} />
        </span>
        <input
          ref={campo}
          className="pannello-sposta-campo interfaccia-controllo"
          placeholder="Cerca una cartella"
          aria-label="Cerca una cartella"
          // Il focus resta nel campo: il lettore di schermo annuncia la voce evidenziata.
          role="combobox"
          aria-expanded="true"
          aria-controls={idElenco}
          aria-activedescendant={indice >= 0 && voci[indice] ? idVoce(indice) : undefined}
          value={filtro}
          onChange={(e) => {
            setFiltro(e.target.value);
            setAttiva(-1);
          }}
        />
      </div>
      <div className="menu-separatore" role="separator" />
      <ul id={idElenco} className="pannello-sposta-elenco" role="listbox" aria-label="Cartelle">
        {voci.map((voce, i) => (
          <li
            key={voce.percorso || "radice"}
            id={idVoce(i)}
            role="option"
            aria-selected={i === indice}
            aria-current={voce.percorso === attuale ? "true" : undefined}
            className={`voce-menu ${i === indice ? "voce-menu-evidenziata" : ""}`}
            onMouseEnter={() => setAttiva(i)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onScegli(voce.percorso)}
          >
            <span
              className="voce-menu-riga interfaccia-controllo"
              style={{ paddingLeft: `calc(var(--spazio-controllo) + ${voce.livello * 16}px)` }}
            >
              <span
                className="voce-menu-icona"
                onClick={(e) => {
                  if (!voce.haFigli || filtro !== "") return;
                  e.stopPropagation();
                  apriChiudi(voce.percorso);
                }}
              >
                {voce.haFigli ? (
                  <Icona di={voce.aperta ? ChevronDown : ChevronRight} />
                ) : (
                  <span className="pannello-sposta-vuoto" />
                )}
              </span>
              <span className="voce-menu-etichetta">{voce.nome}</span>
              {voce.percorso === attuale && (
                <span className="voce-menu-icona" aria-label="attuale">
                  <Icona di={Check} />
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>,
    document.body,
  );
}
