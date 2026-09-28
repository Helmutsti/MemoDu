// Forma di cartelle, albero e cestino scambiati tra app e API (architettura/api.md, DEC-37).

import type { VoceElenco } from "./nota.ts";

/** Percorso di una cartella dalla radice, nomi separati da "/"; "" è la radice (DEC-37). */
export type Percorso = string;

/** Cosa fare se il nome esiste già nella destinazione (RB-31). */
export type SeEsiste = "chiedi" | "numero" | "unisci";

/** Una cartella dell'albero, con sottocartelle e note in ordine alfabetico (RB-64, RB-65). */
export interface Cartella {
  nome: string;
  percorso: Percorso;
  /** Note della cartella e delle sottocartelle, senza quelle nel cestino (RB-56). */
  conteggio: number;
  cartelle: Cartella[];
  note: VoceElenco[];
}

/** Risposta di GET /albero: tutta la colonna. */
export interface Albero {
  nonOrganizzate: { conteggio: number; note: VoceElenco[] };
  cartelle: Cartella[];
  /** Quanti elementi ci sono nel cestino: il numero della riga Cestino (DEC-40). */
  cestino: number;
}

/** Risposta di creazione, rinomina e spostamento: con Unisci, le sottocartelle da risolvere. */
export interface EsitoCartella {
  cartella: Cartella;
  daRisolvere: Percorso[];
}

/** Un elemento del cestino (SC-04, CMP-17). */
export interface ElementoCestino {
  id: string;
  tipo: "nota" | "cartella";
  /** Titolo della nota o nome della cartella. */
  nome: string;
  /** Percorso da cui veniva; "" la radice. */
  provenienza: Percorso;
  /** Istante di eliminazione, UTC in ISO 8601. */
  eliminato: string;
  /** Solo per le cartelle: quante note contiene. */
  conteggio?: number;
}

/** Il nome è già usato nella destinazione: l'API risponde 409 (RB-31, SF-19). */
export interface Conflitto {
  conflitto: string;
}
