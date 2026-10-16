// La pulizia degli allegati quando si chiude una nota (RB-121, DEC-146): le note si salvano con la
// coda della finestra; qui si aspetta l'ultima scrittura prima di pulire.

import { brainet } from "./api";

/** Scritture in corso di note che si chiudono: la pulizia degli allegati aspetta tutte. */
let chiusure: Promise<void>[] = [];

/**
 * Una nota si è chiusa: quando è scritto (con gli altri che si chiudono insieme), gli allegati
 * che nessuna nota usa più se ne vanno (RB-121). Prima no, così Ctrl+Z dopo «Togli» lo rimette.
 */
export function pulisciDopo(scritto: Promise<void>): void {
  chiusure.push(scritto);
  if (chiusure.length > 1) return;
  setTimeout(() => {
    const attese = chiusure;
    chiusure = [];
    void Promise.all(attese)
      .then(() => brainet.pulisciAllegati())
      .catch(() => undefined);
  }, 0);
}
