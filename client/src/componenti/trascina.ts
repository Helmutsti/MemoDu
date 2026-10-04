// Trascinamento dentro la colonna (note, cartelle, file di Locale) con gli eventi del puntatore
// (DEC-120). Il trascinamento HTML5 su Windows non convive con il rilascio di Tauri, che serve a
// prendere file e cartelle da Esplora file: per questo l'app segue da sola il puntatore.
// - Parte dopo 4 px di movimento, così un clic resta un clic.
// - Le destinazioni hanno l'attributo `data-destinazione`; sotto il puntatore si cerca la più
//   vicina con elementFromPoint.
// - Il fantasma è una copia della riga che segue il puntatore (RF-05).
// - Esc annulla; dopo un rilascio il clic che il browser genera non apre la riga.

import type { PointerEvent as PuntatoreReact } from "react";
import "./fantasma.css";

const SOGLIA_PX = 4;

export interface Gestori {
  /** Il trascinamento è partito. */
  onInizio: () => void;
  /** Sotto il puntatore c'è questa destinazione (null se nessuna). */
  onSopra: (destinazione: string | null) => void;
  /** Rilasciato su questa destinazione (null se nessuna). */
  onRilascio: (destinazione: string | null) => void;
  /** Finito, rilasciato o annullato. */
  onFine: () => void;
}

/** La destinazione sotto il punto, cioè il `data-destinazione` più vicino. */
export function destinazioneIn(x: number, y: number): string | null {
  const sotto = document.elementFromPoint?.(x, y) ?? null;
  return sotto?.closest<HTMLElement>("[data-destinazione]")?.dataset.destinazione ?? null;
}

/** Da chiamare su pointerdown della riga che si può trascinare. */
export function avviaTrascinamento(e: PuntatoreReact<HTMLElement>, g: Gestori): void {
  if (e.button !== 0 || (e.target as Element).closest("input, textarea")) return;
  const riga = e.currentTarget;
  const x0 = e.clientX;
  const y0 = e.clientY;
  let partito = false;
  let fantasma: HTMLElement | null = null;
  let dx = 0;
  let dy = 0;

  const creaFantasma = () => {
    const r = riga.getBoundingClientRect();
    dx = x0 - r.left;
    dy = y0 - r.top;
    const copia = riga.cloneNode(true) as HTMLElement;
    // Solo l'aspetto: senza ruolo, id e dati, la copia non si confonde con la riga vera.
    for (const nome of copia.getAttributeNames()) {
      if (nome !== "class" && nome !== "style") copia.removeAttribute(nome);
    }
    copia.setAttribute("aria-hidden", "true");
    copia.classList.add("fantasma");
    copia.style.width = `${r.width}px`;
    copia.style.height = `${r.height}px`;
    document.body.appendChild(copia);
    fantasma = copia;
  };
  const sposta = (x: number, y: number) => {
    if (fantasma) fantasma.style.transform = `translate(${x - dx}px, ${y - dy}px)`;
  };

  const suMovimento = (ev: PointerEvent) => {
    if (!partito) {
      if (Math.hypot(ev.clientX - x0, ev.clientY - y0) < SOGLIA_PX) return;
      partito = true;
      creaFantasma();
      g.onInizio();
    }
    sposta(ev.clientX, ev.clientY);
    g.onSopra(destinazioneIn(ev.clientX, ev.clientY));
  };
  const chiudi = () => {
    fantasma?.remove();
    document.removeEventListener("pointermove", suMovimento, true);
    document.removeEventListener("pointerup", suRilascio, true);
    document.removeEventListener("pointercancel", annulla, true);
    document.removeEventListener("keydown", suTasto, true);
  };
  const suRilascio = (ev: PointerEvent) => {
    chiudi();
    if (!partito) return;
    // Il clic che segue il rilascio non deve aprire la riga.
    const ferma = (c: MouseEvent) => {
      c.stopPropagation();
      c.preventDefault();
    };
    document.addEventListener("click", ferma, { capture: true, once: true });
    setTimeout(() => document.removeEventListener("click", ferma, true), 0);
    g.onRilascio(destinazioneIn(ev.clientX, ev.clientY));
    g.onFine();
  };
  const annulla = () => {
    chiudi();
    if (partito) g.onFine();
  };
  const suTasto = (ev: KeyboardEvent) => {
    if (ev.key !== "Escape") return;
    ev.preventDefault();
    ev.stopPropagation();
    annulla();
  };
  document.addEventListener("pointermove", suMovimento, true);
  document.addEventListener("pointerup", suRilascio, true);
  document.addEventListener("pointercancel", annulla, true);
  document.addEventListener("keydown", suTasto, true);
}
