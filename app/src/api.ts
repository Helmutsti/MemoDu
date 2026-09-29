// Chiamate all'API di note, cartelle e cestino (docs/architettura/api.md). L'app non salva
// niente da sé: note, cartelle e cestino passano tutti dall'API (DEC-30, DEC-37).

import {
  INDIRIZZO_API,
  LIMITE_CORPO_BYTE,
  type Albero,
  type DatiDettagli,
  type DatiNota,
  type DatiNuovaNota,
  type ElementoCestino,
  type EsitoCartella,
  type Nota,
  type Percorso,
  type SeEsiste,
  type VoceElenco,
  type VoceTag,
} from "@memodu/condiviso";

/** L'API non risponde (stato null) o risponde con un errore (RB-61, SF-32). */
export class ErroreApi extends Error {
  constructor(
    readonly stato: number | null,
    messaggio: string,
    /** Con 409: il nome già usato nella destinazione (RB-31). */
    readonly conflitto?: string,
    /** Con 404 su una nota nel cestino: l'elemento da ripristinare. */
    readonly cestino?: string,
  ) {
    super(messaggio);
  }
}

/** Limite del browser per i corpi delle richieste keepalive (standard fetch: 64 KiB). */
export const LIMITE_KEEPALIVE_BYTE = 60 * 1024;

async function chiama<T>(
  metodo: string,
  percorso: string,
  corpo?: object,
  keepalive = false,
): Promise<T> {
  const testo = corpo ? JSON.stringify(corpo) : undefined;
  const byte = testo ? new TextEncoder().encode(testo).length : 0;
  // Oltre il limite l'API rifiuta il corpo e chiude la connessione prima di rispondere 413:
  // lo si controlla qui, così l'errore è quello giusto (EN-01, SF-17).
  if (byte > LIMITE_CORPO_BYTE) {
    throw new ErroreApi(413, "Il corpo supera il limite dell'API");
  }
  let risposta: Response;
  try {
    risposta = await fetch(INDIRIZZO_API + percorso, {
      method: metodo,
      headers: corpo ? { "Content-Type": "application/json" } : undefined,
      body: testo,
      // Alla chiusura della finestra la richiesta deve arrivare anche se la pagina se ne va.
      // Il browser rifiuta keepalive oltre 64 KB: le note più grandi partono senza (nell'app
      // la finestra si nasconde soltanto, quindi la richiesta arriva lo stesso).
      keepalive: keepalive && byte <= LIMITE_KEEPALIVE_BYTE,
    });
  } catch {
    throw new ErroreApi(null, "L'API non risponde");
  }
  if (!risposta.ok) {
    const dettagli = (await risposta.json().catch(() => ({}))) as {
      conflitto?: string;
      cestino?: string;
    };
    throw new ErroreApi(
      risposta.status,
      `L'API ha risposto ${risposta.status}`,
      dettagli.conflitto,
      dettagli.cestino,
    );
  }
  if (risposta.status === 204) return undefined as T;
  return (await risposta.json()) as T;
}

export const api = {
  elenca: () => chiama<VoceElenco[]>("GET", "/note"),
  leggi: (id: string) => chiama<Nota>("GET", `/note/${id}`),
  crea: (dati: DatiNuovaNota = {}) => chiama<Nota>("POST", "/note", dati),
  salva: (id: string, dati: DatiNota, opzioni?: { keepalive?: boolean }) =>
    chiama<Nota>("PUT", `/note/${id}`, dati, opzioni?.keepalive),
  /** Cancella la nota solo se è vuota (DEC-39); per una nota con del testo l'API risponde 409. */
  eliminaSeVuota: (id: string, opzioni?: { keepalive?: boolean }) =>
    chiama<void>("DELETE", `/note/${id}`, undefined, opzioni?.keepalive),
  spostaNota: (id: string, cartella: Percorso) =>
    chiama<Nota>("PUT", `/note/${id}/cartella`, { cartella }),

  // Dettagli e tag della nota (DEC-51).
  salvaDettagli: (id: string, dati: DatiDettagli) =>
    chiama<Nota>("PUT", `/note/${id}/dettagli`, dati),
  elencaTag: () => chiama<VoceTag[]>("GET", "/tag"),
  aggiungiTag: (id: string, nome: string) => chiama<Nota>("POST", `/note/${id}/tag`, { nome }),
  togliTag: (id: string, nome: string) => chiama<Nota>("DELETE", `/note/${id}/tag`, { nome }),
  eliminaTag: (nome: string) => chiama<void>("DELETE", "/tag", { nome }),

  albero: () => chiama<Albero>("GET", "/albero"),
  creaCartella: (genitore: Percorso, nome?: string, seEsiste?: SeEsiste) =>
    chiama<EsitoCartella>("POST", "/cartelle", { genitore, nome, seEsiste }),
  rinominaCartella: (percorso: Percorso, nome: string, seEsiste?: SeEsiste) =>
    chiama<EsitoCartella>("PATCH", "/cartelle", { percorso, nome, seEsiste }),
  spostaCartella: (
    percorso: Percorso,
    destinazione: Percorso,
    seEsiste?: SeEsiste,
    daUnione?: boolean,
  ) =>
    chiama<EsitoCartella>("POST", "/cartelle/sposta", {
      percorso,
      destinazione,
      seEsiste,
      daUnione,
    }),

  cestinaNota: (id: string) => chiama<ElementoCestino>("POST", "/cestino", { tipo: "nota", id }),
  cestinaCartella: (percorso: Percorso) =>
    chiama<ElementoCestino>("POST", "/cestino", { tipo: "cartella", percorso }),
  cestino: () => chiama<ElementoCestino[]>("GET", "/cestino"),
  ripristina: (id: string, seEsiste?: SeEsiste) =>
    chiama<Nota | EsitoCartella>("POST", `/cestino/${id}/ripristina`, { seEsiste }),
  eliminaDefinitivamente: (id: string) => chiama<void>("DELETE", `/cestino/${id}`),
  svuotaCestino: () => chiama<void>("DELETE", "/cestino"),
};
