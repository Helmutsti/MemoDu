// Comandi di Brainet nel nucleo (architettura/api.md, «Brainet»), con le forme che restituiscono.

import { comando } from "../api";
import type { ColoreStato } from "../componenti/Menu";
import type { ElementoCestino } from "@memodu/condiviso";

export interface StatoBrainet {
  acceso: boolean;
  mostraDatabase: boolean;
}

export interface Frammento {
  id: string;
  testo: string;
  natoIl: string;
  modificatoIl: string;
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

export interface GiornoCalendario {
  giorno: string;
  note: number;
}

export interface Unione {
  citazioni: number;
  aree: number;
}

export const brainet = {
  stato: () => comando<StatoBrainet>("brainet_stato"),
  accendi: () => comando<StatoBrainet>("accendi_brainet"),
  spegni: () => comando<StatoBrainet>("spegni_brainet"),
  mostraDatabase: (si: boolean) => comando<StatoBrainet>("mostra_database", { si }),
  creaFrammento: (testo: string) => comando<Frammento>("crea_frammento", { testo }),
  salvaFrammento: (id: string, testo: string) =>
    comando<Frammento | null>("salva_frammento", { id, testo }),
  leggiFrammento: (id: string) => comando<Frammento>("leggi_frammento", { id }),
  elencaFrammenti: (primaDi?: string) =>
    comando<Frammento[]>("elenca_frammenti", { primaDi: primaDi ?? null }),
  eliminaFrammento: (id: string) => comando<ElementoCestino>("elimina_frammento", { id }),
  calendario: (mese: string) => comando<GiornoCalendario[]>("calendario", { mese }),
  suggerisciEntita: (testo: string) => comando<Entita[]>("suggerisci_entita", { testo }),
  creaEntita: (nome: string) => comando<Entita>("crea_entita", { nome }),
  leggiEntita: (id: string) => comando<Entita>("leggi_entita", { id }),
  elencaEntita: () => comando<VoceEntita[]>("elenca_entita"),
  anteprimaUnione: (da: string, verso: string) =>
    comando<Unione>("anteprima_unione", { da, verso }),
  unisciEntita: (da: string, verso: string) => comando<Unione>("unisci_entita", { da, verso }),
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
  importa: (nota: string, sposta: boolean) =>
    comando<Frammento>("importa_in_brainet", { nota, sposta }),
};

/** Titoli delle sezioni dei menu, nell'ordine dei suggerimenti (CMP-09 Suggerimenti). */
export const TITOLO_TIPO: Record<TipoEntita | "nessuno", string> = {
  persona: "Persone",
  argomento: "Argomenti",
  evento: "Eventi",
  oggetto: "Oggetti",
  nessuno: "Senza tipo",
};
