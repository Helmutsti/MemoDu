// CMP-28 Scelta a segmenti: uno tra pochi valori, tutti in vista (DEC-91). Un solo arresto di
// Tab, sul segmento scelto; le frecce cambiano la scelta, che vale subito (RB-06). Un segmento
// spento non si sceglie e le frecce lo saltano (DEC-145).

import { useRef, type KeyboardEvent, type ReactElement } from "react";
import "./SceltaSegmenti.css";

interface Proprieta<T extends string> {
  /** Nome dell'impostazione, per i lettori di schermo («Tema»). */
  nome: string;
  opzioni: { valore: T; etichetta: string; spento?: boolean }[];
  valore: T;
  onScegli: (valore: T) => void;
}

export function SceltaSegmenti<T extends string>({
  nome,
  opzioni,
  valore,
  onScegli,
}: Proprieta<T>): ReactElement {
  const gruppo = useRef<HTMLDivElement>(null);
  const suTasto = (e: KeyboardEvent) => {
    const passo = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key as "ArrowLeft"];
    if (passo === undefined) return;
    e.preventDefault();
    const attuale = opzioni.findIndex((o) => o.valore === valore);
    let prossimo = attuale;
    for (let i = 0; i < opzioni.length; i++) {
      prossimo = (prossimo + passo + opzioni.length) % opzioni.length;
      if (!opzioni[prossimo].spento) break;
    }
    if (prossimo === attuale || opzioni[prossimo].spento) return;
    onScegli(opzioni[prossimo].valore);
    gruppo.current?.querySelectorAll<HTMLElement>('[role="radio"]')[prossimo]?.focus();
  };
  return (
    <div
      ref={gruppo}
      className="scelta-segmenti"
      role="radiogroup"
      aria-label={nome}
      onKeyDown={suTasto}
    >
      {opzioni.map((o) => {
        const scelto = o.valore === valore;
        return (
          <button
            key={o.valore}
            type="button"
            role="radio"
            aria-checked={scelto}
            tabIndex={scelto ? 0 : -1}
            disabled={o.spento}
            className={`segmento ${scelto ? "segmento-scelto interfaccia-controllo-attivo" : "interfaccia-controllo"}`}
            onClick={() => onScegli(o.valore)}
          >
            {o.etichetta}
          </button>
        );
      })}
    </div>
  );
}
