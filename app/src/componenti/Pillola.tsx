// CMP-10 Pillola degli strumenti: formattazione sopra la selezione, inserimento sopra il
// punto del clic sul vuoto. Compare 8 px sopra, centrata; se sopra non c'è spazio, sotto.
// Non ruba il focus mentre si scrive; Alt + F10 ci porta il focus, le frecce passano da uno
// strumento all'altro ed Esc torna al testo.

import { forwardRef, useImperativeHandle, useRef, type ReactElement } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import { Icona } from "./Icona";
import { Suggerimento } from "./Suggerimento";
import "./Pillola.css";

export type Strumento =
  | { tipo: "strumento"; nome: string; icona: LucideIcon; attivo?: boolean; azione: () => void }
  | { tipo: "divisore" };

export interface ManigliaPillola {
  /** Porta il focus sul primo strumento (Alt + F10). */
  focus: () => void;
}

interface Proprieta {
  etichetta: string;
  strumenti: Strumento[];
  /** Centro orizzontale e bordo dell'ancora (sopra: il bordo alto; sotto: il bordo basso). */
  x: number;
  y: number;
  sotto: boolean;
  /** Esc dalla pillola: il focus torna al testo. */
  onEsci: () => void;
}

export const Pillola = forwardRef<ManigliaPillola, Proprieta>(function Pillola(
  { etichetta, strumenti, x, y, sotto, onEsci },
  maniglia,
): ReactElement {
  const barra = useRef<HTMLDivElement>(null);
  const pulsanti = () => [...(barra.current?.querySelectorAll("button") ?? [])];

  useImperativeHandle(maniglia, () => ({ focus: () => pulsanti()[0]?.focus() }));

  const suTasto = (e: React.KeyboardEvent) => {
    const elenco = pulsanti();
    const i = elenco.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const passo = e.key === "ArrowRight" ? 1 : -1;
      elenco[(i + passo + elenco.length) % elenco.length]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onEsci();
    }
  };

  return createPortal(
    <div
      ref={barra}
      role="toolbar"
      aria-label={etichetta}
      className={`pillola ${sotto ? "pillola-sotto" : ""}`}
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.preventDefault()}
      onKeyDown={suTasto}
    >
      {strumenti.map((s, i) =>
        s.tipo === "divisore" ? (
          <span key={i} className="pillola-divisore" aria-hidden="true" />
        ) : (
          <Suggerimento key={i} testo={s.nome}>
            <button
              type="button"
              aria-label={s.nome}
              aria-pressed={s.attivo === undefined ? undefined : s.attivo}
              className={`strumento ${s.attivo ? "strumento-attivo" : ""}`}
              tabIndex={-1}
              onClick={s.azione}
            >
              <Icona di={s.icona} />
            </button>
          </Suggerimento>
        ),
      )}
    </div>,
    document.body,
  );
});
