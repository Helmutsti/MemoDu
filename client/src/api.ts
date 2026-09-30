// Note, cartelle e cestino (docs/architettura/api.md). Nell'app stanno nella copia di lavoro
// sul dispositivo, che il nucleo Rust legge e scrive (DEC-67): il client funziona senza API.
// Nel browser usato per le prove non c'è il nucleo: le stesse chiamate vanno all'API locale.

import { invoke, type InvokeArgs } from "@tauri-apps/api/core";
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
import { IN_TAURI } from "./finestra";

/** I dati non rispondono (stato null) o rispondono con un errore (RB-61, SF-32). */
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

/** Byte del corpo; oltre 10 MB si rifiuta con 413 prima di chiamare (EN-01, SF-17). */
function misura(corpo?: object): { testo?: string; byte: number } {
  const testo = corpo ? JSON.stringify(corpo) : undefined;
  const byte = testo ? new TextEncoder().encode(testo).length : 0;
  if (byte > LIMITE_CORPO_BYTE) {
    throw new ErroreApi(413, "Il corpo supera il limite dell'API");
  }
  return { testo, byte };
}

/** Un comando del nucleo; i suoi errori hanno la stessa forma di quelli dell'API. */
async function comando<T>(nome: string, argomenti: InvokeArgs, corpo?: object): Promise<T> {
  misura(corpo);
  try {
    return await invoke<T>(nome, argomenti);
  } catch (errore) {
    const e = errore as {
      stato?: number | null;
      messaggio?: string;
      conflitto?: string;
      cestino?: string;
    };
    throw new ErroreApi(e.stato ?? null, e.messaggio ?? String(errore), e.conflitto, e.cestino);
  }
}

async function chiama<T>(
  metodo: string,
  percorso: string,
  corpo?: object,
  keepalive = false,
): Promise<T> {
  // Oltre il limite l'API rifiuta il corpo e chiude la connessione prima di rispondere 413:
  // lo si controlla qui, così l'errore è quello giusto.
  const { testo, byte } = misura(corpo);
  let risposta: Response;
  try {
    risposta = await fetch(INDIRIZZO_API + percorso, {
      method: metodo,
      headers: corpo ? { "Content-Type": "application/json" } : undefined,
      body: testo,
      // Alla chiusura della finestra la richiesta deve arrivare anche se la pagina se ne va.
      // Il browser rifiuta keepalive oltre 64 KB: le note più grandi partono senza.
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

/** Nell'app il comando del nucleo, nel browser la chiamata all'API con lo stesso corpo. */
function via<T>(
  nome: string,
  argomenti: InvokeArgs,
  metodo: string,
  percorso: string,
  corpo?: object,
  keepalive?: boolean,
): Promise<T> {
  return IN_TAURI
    ? comando<T>(nome, argomenti, corpo)
    : chiama<T>(metodo, percorso, corpo, keepalive);
}

export const api = {
  elenca: () => via<VoceElenco[]>("elenca_note", {}, "GET", "/note"),
  leggi: (id: string) => via<Nota>("leggi_nota", { id }, "GET", `/note/${id}`),
  crea: (dati: DatiNuovaNota = {}) =>
    via<Nota>("crea_nota", { nuova: dati }, "POST", "/note", dati),
  salva: (id: string, dati: DatiNota, opzioni?: { keepalive?: boolean }) =>
    via<Nota>("salva_nota", { id, nota: dati }, "PUT", `/note/${id}`, dati, opzioni?.keepalive),
  /** Cancella la nota solo se è vuota (DEC-39); per una nota con del testo l'errore è 409. */
  eliminaSeVuota: (id: string, opzioni?: { keepalive?: boolean }) =>
    via<void>("elimina_se_vuota", { id }, "DELETE", `/note/${id}`, undefined, opzioni?.keepalive),
  spostaNota: (id: string, cartella: Percorso) =>
    via<Nota>("sposta_nota", { id, cartella }, "PUT", `/note/${id}/cartella`, { cartella }),

  // Dettagli e tag della nota (DEC-51).
  salvaDettagli: (id: string, dati: DatiDettagli) =>
    via<Nota>("salva_dettagli", { id, dettagli: dati }, "PUT", `/note/${id}/dettagli`, dati),
  elencaTag: () => via<VoceTag[]>("elenca_tag", {}, "GET", "/tag"),
  aggiungiTag: (id: string, nome: string) =>
    via<Nota>("aggiungi_tag", { id, nome }, "POST", `/note/${id}/tag`, { nome }),
  togliTag: (id: string, nome: string) =>
    via<Nota>("togli_tag", { id, nome }, "DELETE", `/note/${id}/tag`, { nome }),
  eliminaTag: (nome: string) => via<void>("elimina_tag", { nome }, "DELETE", "/tag", { nome }),

  albero: () => via<Albero>("albero", {}, "GET", "/albero"),
  creaCartella: (genitore: Percorso, nome?: string, seEsiste?: SeEsiste) =>
    via<EsitoCartella>("crea_cartella", { genitore, nome, seEsiste }, "POST", "/cartelle", {
      genitore,
      nome,
      seEsiste,
    }),
  rinominaCartella: (percorso: Percorso, nome: string, seEsiste?: SeEsiste) =>
    via<EsitoCartella>("rinomina_cartella", { percorso, nome, seEsiste }, "PATCH", "/cartelle", {
      percorso,
      nome,
      seEsiste,
    }),
  spostaCartella: (
    percorso: Percorso,
    destinazione: Percorso,
    seEsiste?: SeEsiste,
    daUnione?: boolean,
  ) => {
    const corpo = { percorso, destinazione, seEsiste, daUnione };
    return via<EsitoCartella>("sposta_cartella", corpo, "POST", "/cartelle/sposta", corpo);
  },

  cestinaNota: (id: string) =>
    via<ElementoCestino>("cestina_nota", { id }, "POST", "/cestino", { tipo: "nota", id }),
  cestinaCartella: (percorso: Percorso) =>
    via<ElementoCestino>("cestina_cartella", { percorso }, "POST", "/cestino", {
      tipo: "cartella",
      percorso,
    }),
  cestino: () => via<ElementoCestino[]>("elenca_cestino", {}, "GET", "/cestino"),
  ripristina: (id: string, seEsiste?: SeEsiste) =>
    via<Nota | EsitoCartella>("ripristina", { id, seEsiste }, "POST", `/cestino/${id}/ripristina`, {
      seEsiste,
    }),
  eliminaDefinitivamente: (id: string) =>
    via<void>("elimina_definitivamente", { id }, "DELETE", `/cestino/${id}`),
  svuotaCestino: () => via<void>("svuota_cestino", {}, "DELETE", "/cestino"),
};
