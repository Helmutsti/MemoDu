// Salvataggio automatico (RB-06, CA-02.7): ogni modifica si salva da sola dopo 2 s di pausa
// di scrittura, e subito quando si cambia nota, si chiude o la finestra perde il focus.
// Nessun pulsante Salva e nessun messaggio: il salvataggio è silenzioso (SC-03).
// I salvataggi della stessa nota partono uno alla volta, nell'ordine delle modifiche.

import type { DatiNota, Nota } from "@memodu/condiviso";

export const PAUSA_MS = 2000;

type Salva = (id: string, dati: DatiNota) => Promise<Nota>;

export class CodaSalvataggio {
  private id: string | null = null;
  private pendenti: DatiNota = {};
  private timer: ReturnType<typeof setTimeout> | undefined;
  private inCorso: Promise<void> = Promise.resolve();
  /** Numero dell'ultima modifica di ogni campo: un salvataggio fallito non rimette un testo
   * più vecchio sopra uno scritto dopo. */
  private versioni = new Map<string, number>();
  private contatore = 0;

  constructor(
    private readonly salva: Salva,
    /** Dopo ogni salvataggio riuscito: per aggiornare l'elenco (RB-60). */
    private readonly onSalvata: (nota: Nota) => void,
    /** Salvataggio non riuscito: l'app mostra SC-07 e tiene il testo (RB-61). */
    private readonly onErrore: (errore: unknown) => void,
  ) {}

  /** C'è qualcosa che non è ancora arrivato all'API? */
  get haModifiche(): boolean {
    return this.id !== null && Object.keys(this.pendenti).length > 0;
  }

  /** Toglie dalla coda le modifiche non salvate e le restituisce, senza salvarle. */
  abbandona(): { id: string | null; dati: DatiNota } {
    clearTimeout(this.timer);
    const resto = { id: this.id, dati: this.pendenti };
    this.id = null;
    this.pendenti = {};
    return resto;
  }

  /** Una modifica alla nota aperta: si salva dopo la pausa. */
  modifica(id: string, dati: DatiNota): void {
    if (this.id !== null && this.id !== id) void this.scarica();
    this.id = id;
    this.pendenti = { ...this.pendenti, ...dati };
    for (const campo of Object.keys(dati)) this.versioni.set(campo, ++this.contatore);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.scarica(), PAUSA_MS);
  }

  /** Salva subito quello che resta (cambio di nota, chiusura, perdita del focus). */
  scarica(): Promise<void> {
    clearTimeout(this.timer);
    if (!this.haModifiche) return this.inCorso;
    const id = this.id!;
    const dati = this.pendenti;
    const versioni = new Map(Object.keys(dati).map((c) => [c, this.versioni.get(c)]));
    this.pendenti = {};
    this.inCorso = this.inCorso.then(async () => {
      try {
        this.onSalvata(await this.salva(id, dati));
      } catch (errore) {
        // Il testo non va perso: torna tra le modifiche da salvare, ma solo i campi che nel
        // frattempo non sono stati riscritti (RB-61).
        if (this.id === id) {
          const ancora = Object.fromEntries(
            Object.entries(dati).filter(([c]) => this.versioni.get(c) === versioni.get(c)),
          );
          this.pendenti = { ...ancora, ...this.pendenti };
        }
        this.onErrore(errore);
      }
    });
    return this.inCorso;
  }
}
