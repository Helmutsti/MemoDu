// Le zone che prendono da sole i file trascinati da Esplora file o dal Finder (DEC-120, RB-114):
// oggi il testo di una nota Brainet, che li allega nel punto in cui si lasciano. Sopra di loro
// il velo di Locale non compare e il file non va in Locale; la zona riceve l'evento
// EVENTO_RILASCIO con i percorsi e il punto.

/** L'attributo che segna una zona così. */
export const ZONA_RILASCIO = "data-rilascio-proprio";
export const EVENTO_RILASCIO = "rilascio-file";

export interface FileRilasciati {
  percorsi: string[];
  /** Il punto, in coordinate della finestra. */
  x: number;
  y: number;
}

/** La zona sotto il punto che Tauri dà in pixel fisici, se c'è. */
export function zonaSotto(fisico: { x: number; y: number }): {
  zona: Element;
  x: number;
  y: number;
} | null {
  const x = fisico.x / window.devicePixelRatio;
  const y = fisico.y / window.devicePixelRatio;
  const zona = document.elementFromPoint(x, y)?.closest(`[${ZONA_RILASCIO}]`);
  return zona ? { zona, x, y } : null;
}
