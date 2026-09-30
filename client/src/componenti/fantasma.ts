// Fantasma del trascinamento di note e cartelle nella colonna (RF-05, RF-11). L'immagine che
// disegna il sistema perde la trasparenza su Windows (WebView2): gli angoli arrotondati della
// pillola diventano neri. Per questo l'immagine del sistema è un pixel trasparente e la
// pillola che segue il puntatore la disegna l'app.

import type { DragEvent } from "react";
import "./fantasma.css";

const TRASPARENTE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
let pixel: HTMLImageElement | undefined;

/** Fa partire il fantasma della riga trascinata; sparisce da solo al rilascio. */
export function avviaFantasma(e: DragEvent): void {
  if (!e.dataTransfer?.setDragImage) return;
  if (!pixel) {
    pixel = new Image();
    pixel.src = TRASPARENTE;
  }
  const riga = e.currentTarget as HTMLElement;
  const r = riga.getBoundingClientRect();
  // Il puntatore resta nello stesso punto della pillola in cui l'ha presa.
  const dx = e.clientX - r.left;
  const dy = e.clientY - r.top;
  const copia = riga.cloneNode(true) as HTMLElement;
  // Solo l'aspetto: senza ruolo, id e dati, la copia non si confonde con la riga vera.
  for (const nome of copia.getAttributeNames()) {
    if (nome !== "class" && nome !== "style") copia.removeAttribute(nome);
  }
  copia.setAttribute("aria-hidden", "true");
  copia.classList.add("fantasma");
  copia.style.width = `${r.width}px`;
  copia.style.height = `${r.height}px`;
  const sposta = (x: number, y: number) => {
    copia.style.transform = `translate(${x - dx}px, ${y - dy}px)`;
  };
  sposta(e.clientX, e.clientY);
  document.body.appendChild(copia);
  e.dataTransfer.setDragImage(pixel, 0, 0);

  // Durante il trascinamento il puntatore arriva con dragover; fuori dalla finestra si ferma.
  const suPassaggio = (ev: globalThis.DragEvent) => sposta(ev.clientX, ev.clientY);
  const fine = () => {
    copia.remove();
    document.removeEventListener("dragover", suPassaggio, true);
    document.removeEventListener("dragend", fine, true);
    document.removeEventListener("drop", fine, true);
  };
  document.addEventListener("dragover", suPassaggio, true);
  document.addEventListener("dragend", fine, true);
  document.addEventListener("drop", fine, true);
}
