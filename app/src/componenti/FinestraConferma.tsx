// CMP-16 Finestra di conferma: al centro, livello 40, con il velo sul resto. Il focus parte
// da Annulla e resta dentro la finestra; Esc equivale ad Annulla.

import { useEffect, useRef, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { Pulsante } from "./Pulsante";
import "./FinestraConferma.css";

interface Proprieta {
  titolo: string;
  testo: string;
  azione: string;
  onAnnulla: () => void;
  onConferma: () => void;
}

export function FinestraConferma({
  titolo,
  testo,
  azione,
  onAnnulla,
  onConferma,
}: Proprieta): ReactElement {
  const finestra = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finestra.current?.querySelector("button")?.focus();
  }, []);

  const suTasto = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onAnnulla();
    } else if (e.key === "Tab") {
      // Il focus resta dentro la finestra.
      const pulsanti = [...(finestra.current?.querySelectorAll("button") ?? [])];
      const i = pulsanti.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault();
      pulsanti[(i + (e.shiftKey ? -1 : 1) + pulsanti.length) % pulsanti.length]?.focus();
    }
  };

  return createPortal(
    <div className="velo">
      <div
        ref={finestra}
        className="finestra-conferma"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="conferma-titolo"
        aria-describedby="conferma-testo"
        onKeyDown={suTasto}
      >
        <p id="conferma-titolo" className="interfaccia-titolo">
          {titolo}
        </p>
        <p id="conferma-testo" className="finestra-conferma-testo interfaccia-messaggio">
          {testo}
        </p>
        <div className="finestra-conferma-pulsanti">
          <Pulsante tipo="secondario" onClick={onAnnulla}>
            Annulla
          </Pulsante>
          <Pulsante onClick={onConferma}>{azione}</Pulsante>
        </div>
      </div>
    </div>,
    document.body,
  );
}
