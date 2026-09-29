// CMP-12 Date picker: largo 240, stesso guscio del menu. Mese e anno con ‹ ›, giorni dal lunedì,
// sempre 6 righe; oggi con il puntino, il giorno scelto con sfondo-hover (DEC-35). In fondo
// «Oggi» e «Nessuna data». Tastiera: frecce tra i giorni, Pagina su e giù per il mese, Invio
// sceglie, Esc chiude. Scegliere salva e chiude (RB-06). Nessuna data è vietata (RB-20).

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { Icona } from "./Icona";
import { Pulsante, PulsanteIcona } from "./Pulsante";
import "./Calendario.css";

const MESI = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];
const GIORNI = ["L", "M", "M", "G", "V", "S", "D"];
const MARGINE_FINESTRA = 8;
const DISTANZA = 8;

/** Giorno del calendario come AAAA-MM-GG, senza fusi orari (DEC-28). */
export const giornoDi = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dataDi = (giorno: string) => {
  const [a, m, g] = giorno.split("-").map(Number);
  return new Date(a!, m! - 1, g!);
};
const piuGiorni = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const piuMesi = (d: Date, n: number) => {
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const ultimo = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  return new Date(r.getFullYear(), r.getMonth(), Math.min(d.getDate(), ultimo));
};

interface Proprieta {
  /** Giorno scelto (AAAA-MM-GG) o null. */
  valore: string | null;
  /** Rettangolo del campo: il calendario si apre 8 px sotto, o sopra se sotto non c'è spazio. */
  ancora: DOMRect;
  onScegli: (giorno: string | null) => void;
  onChiudi: () => void;
  /** Aperto da dentro la finestra Dettagli: sta sopra di lei. */
  sopraOverlay?: boolean;
  /** Oggi, per le prove. */
  oggi?: Date;
}

export function Calendario({
  valore,
  ancora,
  onScegli,
  onChiudi,
  sopraOverlay = false,
  oggi = new Date(),
}: Proprieta): ReactElement {
  const elemento = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(() => (valore ? dataDi(valore) : oggi));
  const [posizione, setPosizione] = useState({
    x: ancora.right - 240,
    y: ancora.bottom + DISTANZA,
  });

  useLayoutEffect(() => {
    const r = elemento.current?.getBoundingClientRect();
    if (!r) return;
    const sotto = ancora.bottom + DISTANZA + r.height <= window.innerHeight - MARGINE_FINESTRA;
    setPosizione({
      x: Math.max(MARGINE_FINESTRA, Math.min(ancora.right - r.width, window.innerWidth - r.width)),
      y: sotto
        ? ancora.bottom + DISTANZA
        : Math.max(MARGINE_FINESTRA, ancora.top - DISTANZA - r.height),
    });
  }, [ancora]);

  // All'apertura e a ogni spostamento il focus va sul giorno (CMP-12).
  useEffect(() => {
    elemento.current
      ?.querySelector<HTMLButtonElement>(`[data-giorno="${giornoDi(focus)}"]`)
      ?.focus();
  }, [focus]);

  // Clic fuori: si chiude.
  useEffect(() => {
    const suClic = (e: MouseEvent) => {
      if (!elemento.current?.contains(e.target as Node)) onChiudi();
    };
    window.addEventListener("mousedown", suClic, true);
    return () => window.removeEventListener("mousedown", suClic, true);
  }, [onChiudi]);

  const primo = new Date(focus.getFullYear(), focus.getMonth(), 1);
  const inizio = piuGiorni(primo, -((primo.getDay() + 6) % 7));
  const giorni = Array.from({ length: 42 }, (_, i) => piuGiorni(inizio, i));

  const suTasto = (e: React.KeyboardEvent) => {
    const passi: Record<string, () => Date> = {
      ArrowLeft: () => piuGiorni(focus, -1),
      ArrowRight: () => piuGiorni(focus, 1),
      ArrowUp: () => piuGiorni(focus, -7),
      ArrowDown: () => piuGiorni(focus, 7),
      PageUp: () => piuMesi(focus, -1),
      PageDown: () => piuMesi(focus, 1),
    };
    if (passi[e.key]) {
      e.preventDefault();
      setFocus(passi[e.key]!());
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onChiudi();
    }
  };

  const nomeGiorno = (d: Date) =>
    d.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return createPortal(
    <div
      ref={elemento}
      className="calendario"
      role="dialog"
      aria-label="Calendario"
      style={{
        left: posizione.x,
        top: posizione.y,
        ...(sopraOverlay ? { zIndex: "var(--z-overlay)" } : {}),
      }}
      onKeyDown={suTasto}
    >
      <div className="calendario-intestazione">
        <span className="interfaccia-titolo">
          {MESI[focus.getMonth()]} {focus.getFullYear()}
        </span>
        <span className="calendario-frecce">
          <PulsanteIcona
            nome="Mese precedente"
            icona={<Icona di={ChevronLeft} />}
            onClick={() => setFocus(piuMesi(focus, -1))}
          />
          <PulsanteIcona
            nome="Mese successivo"
            icona={<Icona di={ChevronRight} />}
            onClick={() => setFocus(piuMesi(focus, 1))}
          />
        </span>
      </div>
      <div role="grid" aria-label={`${MESI[focus.getMonth()]} ${focus.getFullYear()}`}>
        <div role="row" className="calendario-riga">
          {GIORNI.map((g, i) => (
            <span
              key={i}
              role="columnheader"
              className="calendario-settimana interfaccia-etichetta"
            >
              {g}
            </span>
          ))}
        </div>
        {Array.from({ length: 6 }, (_, r) => (
          <div key={r} role="row" className="calendario-riga">
            {giorni.slice(r * 7, r * 7 + 7).map((d) => {
              const g = giornoDi(d);
              const scelto = g === valore;
              const eOggi = g === giornoDi(oggi);
              return (
                <button
                  key={g}
                  type="button"
                  role="gridcell"
                  data-giorno={g}
                  tabIndex={g === giornoDi(focus) ? 0 : -1}
                  aria-selected={scelto}
                  aria-label={`${nomeGiorno(d)}${eOggi ? ", oggi" : ""}${scelto ? ", selezionato" : ""}`}
                  className={`calendario-giorno interfaccia-controllo ${d.getMonth() !== focus.getMonth() ? "calendario-altro-mese" : ""} ${scelto ? "calendario-scelto" : ""} ${eOggi ? "calendario-oggi" : ""}`}
                  onClick={() => onScegli(g)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="calendario-piede">
        <Pulsante tipo="tenue" onClick={() => onScegli(giornoDi(oggi))}>
          Oggi
        </Pulsante>
        <Pulsante tipo="tenue" onClick={() => onScegli(null)}>
          Nessuna data
        </Pulsante>
      </div>
    </div>,
    document.body,
  );
}
