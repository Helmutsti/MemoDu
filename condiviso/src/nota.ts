// Forma delle note scambiate tra app e API (architettura/api.md, EN-01).

/** Una nota completa, come la restituiscono GET /note/:id, POST /note e PUT /note/:id. */
export interface Nota {
  /** UUID generato dall'API alla creazione; non cambia con il titolo. */
  id: string;
  /** Può essere vuoto (RB-15). */
  titolo: string;
  /** Markdown, può essere vuoto (RB-10). */
  contenuto: string;
  /** Istante di creazione di sistema, UTC in ISO 8601 (DEC-28). */
  creata: string;
  /** Istante dell'ultima modifica, UTC in ISO 8601 (DEC-28). */
  modificata: string;
  /** Percorso della cartella che la contiene; "" per le non organizzate (DEC-37). */
  cartella: string;
}

/** Una riga dell'elenco di GET /note, ordinato per ultima modifica (RB-60). */
export interface VoceElenco {
  id: string;
  titolo: string;
  /** Prime parole del contenuto, per le note senza titolo (RB-15). */
  anteprima: string;
  modificata: string;
}

/** Corpo di PUT /note/:id. */
export interface DatiNota {
  titolo?: string;
  contenuto?: string;
}

/** Corpo di POST /note: senza cartella, o con "", la nota nasce nella radice (RB-09). */
export interface DatiNuovaNota extends DatiNota {
  cartella?: string;
}
