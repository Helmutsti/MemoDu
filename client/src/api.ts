// Note, cartelle, cestino e tag: comandi del nucleo Rust sulla copia di lavoro (DEC-67, DEC-85),
// con i dati e i codici di errore descritti in docs/architettura/api.md. Nel browser, senza il
// nucleo, i comandi falliscono come un archivio che non risponde (SC-07).

import { invoke, type InvokeArgs } from "@tauri-apps/api/core";
import {
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

/** L'archivio non risponde (stato null) o risponde con un errore (RB-61, SF-32). */
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

/**
 * Un comando del nucleo. Oltre 10 MB si rifiuta con 413 prima di chiamarlo (EN-01, SF-17); gli
 * errori del nucleo arrivano come { stato, messaggio, conflitto?, cestino? }.
 */
async function comando<T>(nome: string, argomenti: InvokeArgs = {}): Promise<T> {
  const byte = new TextEncoder().encode(JSON.stringify(argomenti)).length;
  if (byte > LIMITE_CORPO_BYTE) throw new ErroreApi(413, "Il testo supera il limite di 10 MB");
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

export const api = {
  elenca: () => comando<VoceElenco[]>("elenca_note"),
  leggi: (id: string) => comando<Nota>("leggi_nota", { id }),
  crea: (dati: DatiNuovaNota = {}) => comando<Nota>("crea_nota", { nuova: dati }),
  salva: (id: string, dati: DatiNota) => comando<Nota>("salva_nota", { id, nota: dati }),
  /** Cancella la nota solo se è vuota (DEC-39); per una nota con del testo l'errore è 409. */
  eliminaSeVuota: (id: string) => comando<void>("elimina_se_vuota", { id }),
  spostaNota: (id: string, cartella: Percorso) => comando<Nota>("sposta_nota", { id, cartella }),

  // Dettagli e tag della nota (DEC-51).
  salvaDettagli: (id: string, dati: DatiDettagli) =>
    comando<Nota>("salva_dettagli", { id, dettagli: dati }),
  elencaTag: () => comando<VoceTag[]>("elenca_tag"),
  aggiungiTag: (id: string, nome: string) => comando<Nota>("aggiungi_tag", { id, nome }),
  togliTag: (id: string, nome: string) => comando<Nota>("togli_tag", { id, nome }),
  eliminaTag: (nome: string) => comando<void>("elimina_tag", { nome }),

  albero: () => comando<Albero>("albero"),
  creaCartella: (genitore: Percorso, nome?: string, seEsiste?: SeEsiste) =>
    comando<EsitoCartella>("crea_cartella", { genitore, nome, seEsiste }),
  rinominaCartella: (percorso: Percorso, nome: string, seEsiste?: SeEsiste) =>
    comando<EsitoCartella>("rinomina_cartella", { percorso, nome, seEsiste }),
  spostaCartella: (
    percorso: Percorso,
    destinazione: Percorso,
    seEsiste?: SeEsiste,
    daUnione?: boolean,
  ) => comando<EsitoCartella>("sposta_cartella", { percorso, destinazione, seEsiste, daUnione }),

  cestinaNota: (id: string) => comando<ElementoCestino>("cestina_nota", { id }),
  cestinaCartella: (percorso: Percorso) =>
    comando<ElementoCestino>("cestina_cartella", { percorso }),
  cestino: () => comando<ElementoCestino[]>("elenca_cestino"),
  ripristina: (id: string, seEsiste?: SeEsiste) =>
    comando<Nota | EsitoCartella>("ripristina", { id, seEsiste }),
  eliminaDefinitivamente: (id: string) => comando<void>("elimina_definitivamente", { id }),
  svuotaCestino: () => comando<void>("svuota_cestino"),

  // Impostazioni (SC-06, DEC-91).
  impostazioni: () => comando<Impostazioni>("leggi_impostazioni"),
  /** Nel formato del nucleo («Control+Alt+KeyN»); null torna a quella di default. Se un altro
   * programma la usa già l'errore è 409, se non si può usare 400. */
  cambiaScorciatoia: (combinazione: string | null) =>
    comando<void>("cambia_scorciatoia", { combinazione }),
  cambiaTema: (tema: Tema) => comando<void>("cambia_tema", { tema }),
  cambiaAvvio: (attivo: boolean) => comando<void>("cambia_avvio", { attivo }),
  cambiaPrimoPiano: (attivo: boolean) => comando<void>("cambia_primo_piano", { attivo }),
  /** Restituisce il nome che vale: vuoto torna il nome del computer (RB-51). */
  cambiaNomeDispositivo: (nome: string) => comando<string>("cambia_nome_dispositivo", { nome }),
  statoSincronizzazione: () => comando<StatoSincronizzazione>("stato_sincronizzazione"),
};

export type Tema = "sistema" | "chiaro" | "scuro";

export interface Impostazioni {
  sistema: "windows" | "macos";
  scorciatoia: string;
  scorciatoiaPredefinita: boolean;
  tema: Tema;
  avvioAutomatico: boolean;
  inPrimoPiano: boolean;
  nomeDispositivo: string;
}

export interface StatoSincronizzazione {
  /** C'è il file delle credenziali (DEC-84). */
  collegata: boolean;
  ultimaRiuscita: string | null;
  problema: "rete" | "rifiutate" | "protocollo" | "errore" | null;
}
