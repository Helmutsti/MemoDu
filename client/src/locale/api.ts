// Locale (RF-17, DEC-118): i comandi del nucleo su file e cartelle del disco, come descritti in
// docs/architettura/api.md. Niente passa dal server.

import { comando } from "../api";

/** Un elemento dell'elenco: una cartella o un file trascinato da solo (DEC-120). */
export interface CartellaLocale {
  percorso: string;
  nome: string;
  stato: "presente" | "non trovata" | "non accessibile";
  tipo: "cartella" | "file";
  /** Un file con modifiche non salvate (RB-77). */
  sospeso: boolean;
}

/** Esito del rilascio da Esplora file (DEC-120). */
export interface Aggiunti {
  aggiunti: CartellaLocale[];
  /** Già in Locale: l'elemento che c'è. */
  gia: string[];
  /** Né cartelle né file .md o .txt. */
  scartati: string[];
}

export interface VoceLocale {
  nome: string;
  percorso: string;
  tipo: "cartella" | "file";
  /** Ha modifiche non salvate (RB-77). */
  sospeso: boolean;
  /** File nuovo, non ancora sul disco (RB-81). */
  nuovo: boolean;
}

export interface FileLocale {
  testo: string;
  sospeso: boolean;
  nuovo: boolean;
  codifica: string;
  solaLettura: boolean;
  /** Impronta del file sul disco adesso; null se non c'è. */
  impronta: string | null;
  cambiatoFuori: boolean;
  sparito: boolean;
}

export interface Salvato {
  percorso: string;
  convertitoInUtf8: boolean;
  impronta: string;
}

/** Un file locale si apre fino a 10 MB (SF-17), più il resto della richiesta. */
const LIMITE = 10 * 1024 * 1024 + 64 * 1024;

export const apiLocale = {
  cartelle: () => comando<CartellaLocale[]>("cartelle_locali"),
  /** Apre la finestra di scelta del sistema; null se si annulla. */
  aggiungi: () => comando<CartellaLocale | null>("aggiungi_cartella_locale"),
  aggiungiPercorsi: (percorsi: string[]) =>
    comando<Aggiunti>("aggiungi_percorsi_locali", { percorsi }),
  togli: (percorso: string) => comando<void>("togli_cartella_locale", { percorso }),
  elenca: (percorso: string) => comando<VoceLocale[]>("elenca_locale", { percorso }),
  apri: (percorso: string) => comando<FileLocale>("apri_file_locale", { percorso }),
  nuovo: (cartella: string) => comando<{ percorso: string }>("nuovo_file_locale", { cartella }),
  sospendi: (percorso: string, testo: string, impronta: string | null) =>
    comando<void>("sospendi_file_locale", { percorso, testo, impronta }, LIMITE),
  salva: (percorso: string, testo: string, impronta: string | null) =>
    comando<Salvato>("salva_file_locale", { percorso, testo, impronta }, LIMITE),
  scarta: (percorso: string) => comando<void>("scarta_file_locale", { percorso }),
  creaCartella: (dentro: string, nome: string) =>
    comando<{ percorso: string }>("crea_cartella_locale", { dentro, nome }),
  rinomina: (percorso: string, nome: string) =>
    comando<{ percorso: string }>("rinomina_locale", { percorso, nome }),
  sposta: (percorso: string, dentro: string) =>
    comando<{ percorso: string }>("sposta_locale", { percorso, dentro }),
  elimina: (percorso: string, perSempre = false) =>
    comando<void>("elimina_locale", { percorso, perSempre }),
};

/** La cartella che contiene il percorso (separatore di Windows o del Mac). */
export function cartellaDi(percorso: string): string {
  const i = Math.max(percorso.lastIndexOf("\\"), percorso.lastIndexOf("/"));
  return i > 0 ? percorso.slice(0, i) : percorso;
}

/** L'ultima parte del percorso. */
export function nomeDi(percorso: string): string {
  const i = Math.max(percorso.lastIndexOf("\\"), percorso.lastIndexOf("/"));
  return percorso.slice(i + 1);
}

/** `percorso` sta dentro `cartella` (o è lei)? */
export function dentroDi(percorso: string, cartella: string): boolean {
  if (percorso === cartella) return true;
  return percorso.startsWith(`${cartella}\\`) || percorso.startsWith(`${cartella}/`);
}
