// Comandi di Brainet nel nucleo (architettura/api.md, «Brainet»), con le forme che restituiscono.
// Dalla DEC-145 Brainet non ha note sue: pillole, aree e allegati stanno nelle note di CLOUD.

import { comando, comandoGrezzo } from "../api";
import type { ColoreStato } from "../componenti/Menu";
import type { Nota } from "@memodu/condiviso";

export interface StatoBrainet {
  acceso: boolean;
}

export type TipoEntita = "persona" | "argomento" | "evento" | "oggetto";

export interface Entita {
  id: string;
  nome: string;
  tipo: TipoEntita | null;
  foto: string | null;
}

export interface VoceEntita {
  entita: Entita;
  nominata: number;
  ultimaVolta: string | null;
}

export interface StatoArea {
  id: string;
  nome: string;
  colore: ColoreStato;
  ordine: number;
}

/** Un giorno con almeno una nota con Brainet (RB-113). */
export interface GiornoCalendario {
  giorno: string;
}

/** Un paragrafo che nomina l'entità (RB-124). */
export interface Passaggio {
  nota: string;
  titolo: string;
  /** HH:MM, vuota per una data scelta senza ora. */
  ora: string;
  /** Il paragrafo con i suoi segni. */
  testo: string;
  /** Dove comincia nella nota, in caratteri. */
  inizio: number;
}

/** La pagina dell'entità (FL-26). */
export interface PaginaEntita {
  entita: Entita;
  nominata: number;
  ultimaVolta: string | null;
  giorni: { giorno: string; passaggi: Passaggio[] }[];
}

export type TipoAllegato = "jpg" | "png" | "pdf" | "word" | "excel" | "powerpoint" | "testo";

/** Un allegato appena entrato: «documento» o «piccola» per le foto (RB-116, RB-117). */
export interface Allegato {
  id: string;
  nome: string;
  tipo: TipoAllegato;
  forma: "documento" | "piccola";
}

export interface InfoAllegato {
  nome: string;
  tipo: TipoAllegato;
  grandezza: number;
  /** L'anteprima di una foto come indirizzo `data:`, o null se non è ancora sul computer. */
  anteprima: string | null;
}

export const eFoto = (tipo: TipoAllegato): boolean => tipo === "jpg" || tipo === "png";

export interface Unione {
  citazioni: number;
  aree: number;
}

export const brainet = {
  stato: () => comando<StatoBrainet>("brainet_stato"),
  accendi: () => comando<StatoBrainet>("accendi_brainet"),
  spegni: () => comando<StatoBrainet>("spegni_brainet"),
  calendario: (mese: string) => comando<GiornoCalendario[]>("calendario", { mese }),
  suggerisciEntita: (testo: string) => comando<Entita[]>("suggerisci_entita", { testo }),
  creaEntita: (nome: string) => comando<Entita>("crea_entita", { nome }),
  leggiEntita: (id: string) => comando<Entita>("leggi_entita", { id }),
  elencaEntita: () => comando<VoceEntita[]>("elenca_entita"),
  /** «Sposta in Brainet»: senza ritorno (RB-130, DEC-147). */
  spostaInBrainet: (id: string) => comando<Nota>("sposta_in_brainet", { id }),
  /** «Scrivi»: una pagina nuova e vuota, già in Brainet (RB-134, DEC-168). */
  creaNotaBrainet: () => comando<Nota>("crea_nota_brainet"),
  /** Le note in Brainet, dalla più recente (RB-131). */
  elencaJournal: () => comando<Nota[]>("elenca_journal"),
  passaggiEntita: (id: string) => comando<PaginaEntita>("passaggi_entita", { id }),
  anteprimaUnione: (da: string, verso: string) =>
    comando<Unione>("anteprima_unione", { da, verso }),
  unisciEntita: (da: string, verso: string) => comando<Unione>("unisci_entita", { da, verso }),
  impostaTipo: (id: string, tipo: TipoEntita | null) =>
    comando<Entita>("imposta_tipo", { id, tipo }),
  scegliFoto: (id: string) => comando<Entita | null>("scegli_foto", { id }),
  elencaStati: () => comando<StatoArea[]>("elenca_stati"),
  creaStato: (nome: string, colore: ColoreStato) =>
    comando<StatoArea>("crea_stato", { nome, colore }),
  areeConStato: (id: string) => comando<number>("aree_con_stato", { id }),
  togliStato: (id: string, sostituto?: string) =>
    comando<{ areeCambiate: number; areeSparite: number }>("togli_stato", {
      id,
      sostituto: sostituto ?? null,
    }),

  // Allegati (RF-18, DEC-135): un file grande viaggia come corpo della richiesta, non in JSON.
  /** Senza percorso apre la finestra del sistema; null se si annulla. */
  allegaFile: (percorso?: string) =>
    comando<Allegato | null>("allega_file", { percorso: percorso ?? null }),
  allegaDati: (nome: string, byte: Uint8Array) =>
    comandoGrezzo<Allegato>("allega_dati", byte, { "memodu-nome": encodeURIComponent(nome) }),
  leggiAllegato: (id: string) => comando<InfoAllegato>("leggi_allegato", { id }),
  apriAllegato: (id: string) => comando<void>("apri_allegato", { id }),
  mostraAllegato: (id: string) => comando<void>("mostra_allegato", { id }),
  pulisciAllegati: () => comando<number>("pulisci_allegati"),
};

/** Titoli delle sezioni dei menu, nell'ordine dei suggerimenti (CMP-09 Suggerimenti). */
export const TITOLO_TIPO: Record<TipoEntita | "nessuno", string> = {
  persona: "Persone",
  argomento: "Argomenti",
  evento: "Eventi",
  oggetto: "Oggetti",
  nessuno: "Senza tipo",
};
