// Salvataggio di una nota Brainet mentre si scrive, come le note (RB-102): poco dopo l'ultimo
// tasto, una scrittura alla volta. Il foglio nuovo crea la nota al primo testo che non è vuoto;
// un testo vuoto la cancella, così un foglio chiuso vuoto non lascia niente.

import { brainet, type Frammento } from "./api";
import { testoSemplice } from "./segni";

/** Dopo l'ultimo tasto, come la coda delle note. */
const RITARDO = 400;

export class SalvaFrammento {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private inAttesa: string | null = null;
  private catena: Promise<void> = Promise.resolve();

  constructor(
    private id: string | null,
    /** Come `esegui` della finestra: se non riesce, l'avviso o SC-07, e undefined. */
    private readonly esegui: <T>(chiamata: () => Promise<T>) => Promise<T | undefined>,
    private readonly onSalvato: (f: Frammento | null) => void = () => {},
  ) {}

  modifica(testo: string): void {
    this.inAttesa = testo;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.scarica(), RITARDO);
  }

  /** Scrive subito quello che aspetta (chiudendo il foglio, cambiando vista). */
  scarica(): Promise<void> {
    clearTimeout(this.timer);
    const testo = this.inAttesa;
    this.inAttesa = null;
    if (testo === null) return this.catena;
    this.catena = this.catena.then(() => this.scrivi(testo));
    return this.catena;
  }

  private async scrivi(testo: string): Promise<void> {
    const vuoto = !testoSemplice(testo).trim();
    if (this.id === null) {
      if (vuoto) return;
      const f = await this.esegui(() => brainet.creaFrammento(testo));
      if (!f) return;
      this.id = f.id;
      this.onSalvato(f);
      return;
    }
    const id = this.id;
    const f = await this.esegui(() => brainet.salvaFrammento(id, testo));
    if (f === undefined) return;
    if (f === null) this.id = null;
    this.onSalvato(f);
  }
}
