// CMP-08 Suggerimento: nome di un controllo con sola icona. Compare 8 px sopra, centrato,
// o sotto se sopra non c'è spazio; dopo 500 ms di sosta del mouse o subito al focus da
// tastiera; sparisce lasciando il controllo o con Esc. Sta sopra a tutto (livello 20),
// quindi si disegna fuori dal contenitore, che altrimenti lo taglierebbe.

import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./Suggerimento.css";

const RITARDO_MS = 500;
const DISTANZA = 8;
const ALTEZZA = 24;

// Il focus arriva dalla tastiera? (":focus-visible" non esiste in tutti gli ambienti di prova.)
function daTastiera(elemento: Element): boolean {
  try {
    return elemento.matches(":focus-visible");
  } catch {
    return true;
  }
}

interface Posizione {
  x: number;
  y: number;
  sotto: boolean;
}

export function Suggerimento({
  testo,
  children,
}: {
  testo: string;
  children: ReactNode;
}): ReactElement {
  const [posizione, setPosizione] = useState<Posizione | null>(null);
  const ancora = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const mostra = () => {
    const r = ancora.current?.getBoundingClientRect();
    if (!r) return;
    const sotto = r.top < ALTEZZA + DISTANZA;
    setPosizione({
      x: r.left + r.width / 2,
      y: sotto ? r.bottom + DISTANZA : r.top - DISTANZA,
      sotto,
    });
  };
  const mostraDopo = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(mostra, RITARDO_MS);
  };
  const nascondi = () => {
    window.clearTimeout(timer.current);
    setPosizione(null);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <span
      ref={ancora}
      className="suggerimento-ancora"
      onMouseEnter={mostraDopo}
      onMouseLeave={nascondi}
      onFocus={(e) => daTastiera(e.target) && mostra()}
      onBlur={nascondi}
      onMouseDown={nascondi}
      onKeyDown={(e) => e.key === "Escape" && nascondi()}
    >
      {children}
      {posizione &&
        createPortal(
          <span
            role="tooltip"
            className={`suggerimento interfaccia-dettaglio ${posizione.sotto ? "suggerimento-sotto" : ""}`}
            style={{ left: posizione.x, top: posizione.y }}
          >
            {testo}
          </span>,
          document.body,
        )}
    </span>
  );
}
