// Prime parole di una nota senza titolo (RB-15), uguali nell'API e nell'app.

const LUNGHEZZA_ANTEPRIMA = 80;

/** Prime parole del contenuto senza simboli markdown, al massimo 80 caratteri. */
export function anteprima(contenuto: string): string {
  const testo = contenuto
    // I segni di Brainet: la pillola e l'allegato si leggono con il nome, l'area con la frase.
    .replace(/<cita e="[^"]+">([^<]*)<\/cita>/g, "$1")
    .replace(/<allegato id="[^"]+" f="[a-z]+">([^<]*)<\/allegato>/g, "$1")
    .replace(/<\/?area id="[^"]+"[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/<\/?u>/g, "")
    .replace(/^\s*(#{1,6}|[-*+]|\d+\.)\s+(\[[ xX]\]\s+)?/gm, "")
    .replace(/(\*\*|__|\*|_|~~)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (testo.length <= LUNGHEZZA_ANTEPRIMA) return testo;
  const taglio = testo.slice(0, LUNGHEZZA_ANTEPRIMA);
  const spazio = taglio.lastIndexOf(" ");
  return spazio > 0 ? taglio.slice(0, spazio) : taglio;
}
