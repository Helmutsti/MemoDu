// CMP-16 Finestra di conferma: al centro, livello 40, con il velo sul resto. Il focus parte
// da Annulla e resta dentro la finestra; Esc e un clic sul velo equivalgono ad Annulla
// (DEC-124). Variante Tre scelte: una
// seconda azione secondaria tra Annulla e quella principale (RB-31).

import { useEffect, useRef, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { Pulsante } from "./Pulsante";
import { useClicSulVelo } from "./velo";
import "./FinestraConferma.css";

interface Proprieta {
  titolo: string;
  testo: string;
  azione: string;
  onAnnulla: () => void;
  onConferma: () => void;
  /** Tre scelte: l'azione secondaria (per esempio «Unisci»). */
  altra?: { etichetta: string; onClick: () => void };
}

export function FinestraConferma({
  titolo,
  testo,
  azione,
  onAnnulla,
  onConferma,
  altra,
}: Proprieta): ReactElement {
  const finestra = useRef<HTMLDivElement>(null);
  const velo = useClicSulVelo(onAnnulla);

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
    <div className="velo" {...velo}>
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
          {altra && (
            <Pulsante tipo="secondario" onClick={altra.onClick}>
              {altra.etichetta}
            </Pulsante>
          )}
          <Pulsante onClick={onConferma}>{azione}</Pulsante>
        </div>
      </div>
    </div>,
    document.body,
  );
}
