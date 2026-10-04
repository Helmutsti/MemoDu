// Stato di Locale (RF-17) condiviso tra la sezione della colonna e il file aperto: le cartelle
// dell'elenco, il contenuto di quelle aperte, i cambi fatti sul disco da altri programmi
// (evento «locale-cambiato», RB-84), che arrivano anche al file aperto.

import { listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useCallback, useEffect, useRef, useState } from "react";
import { IN_TAURI } from "../finestra";
import { apiLocale, cartellaDi, type Aggiunti, type CartellaLocale, type VoceLocale } from "./api";

/** Memodu ricorda quali cartelle di Locale sono aperte (come la colonna, DEC-55). */
const CHIAVE_APERTE = "memodu.locale-aperte";

function leggiAperte(): Set<string> {
  try {
    const salvate = JSON.parse(localStorage.getItem(CHIAVE_APERTE) ?? "[]") as unknown;
    return new Set(Array.isArray(salvate) ? salvate.filter((v) => typeof v === "string") : []);
  } catch {
    return new Set();
  }
}

function salvaAperte(aperte: Set<string>): void {
  try {
    localStorage.setItem(CHIAVE_APERTE, JSON.stringify([...aperte]));
  } catch {
    // Senza memoria del browser la scelta vale fino alla chiusura.
  }
}

export interface StatoLocale {
  cartelle: CartellaLocale[];
  /** Contenuto delle cartelle aperte, per percorso. */
  contenuti: Record<string, VoceLocale[]>;
  aperte: Set<string>;
  apriChiudi: (percorso: string, apri?: boolean) => void;
  ricaricaCartelle: () => Promise<void>;
  ricaricaCartella: (percorso: string) => Promise<void>;
  /** Rilegge la cartella che contiene il file (dopo un salvataggio o una modifica sospesa). */
  ricaricaAttorno: (percorso: string) => Promise<void>;
  /** Registra chi vuole sapere dei cambi sul disco (il file aperto); restituisce chi lo toglie. */
  alCambio: (gestore: (percorsi: string[]) => void) => () => void;
  /** Si sta trascinando dentro la finestra qualcosa da Esplora file o dal Finder (DEC-120). */
  esterno: boolean;
}

/** Il rilascio da Esplora file è finito: cosa è entrato in Locale (DEC-120). */
export type AlRilascio = (esito: Aggiunti) => void;

export function useLocale(alRilascio?: AlRilascio): StatoLocale {
  const [cartelle, setCartelle] = useState<CartellaLocale[]>([]);
  const [contenuti, setContenuti] = useState<Record<string, VoceLocale[]>>({});
  const [aperte, setAperte] = useState<Set<string>>(leggiAperte);
  const aperteAttuali = useRef(aperte);
  const gestori = useRef(new Set<(percorsi: string[]) => void>());
  const [esterno, setEsterno] = useState(false);
  const suRilascio = useRef(alRilascio);
  useEffect(() => {
    suRilascio.current = alRilascio;
  });

  const ricaricaCartella = useCallback(
    (percorso: string) =>
      apiLocale
        .elenca(percorso)
        // Cartella sparita o fuori da Locale: non c'è più niente da mostrare.
        .catch(() => null)
        .then((voci) =>
          setContenuti((c) =>
            voci
              ? { ...c, [percorso]: voci }
              : Object.fromEntries(Object.entries(c).filter(([p]) => p !== percorso)),
          ),
        ),
    [],
  );

  const ricaricaCartelle = useCallback(
    () =>
      apiLocale
        .cartelle()
        .catch(() => [] as CartellaLocale[])
        .then(async (elenco) => {
          setCartelle(elenco);
          await Promise.all([...aperteAttuali.current].map((p) => ricaricaCartella(p)));
        }),
    [ricaricaCartella],
  );

  const apriChiudi = useCallback(
    (percorso: string, apri?: boolean) => {
      setAperte((prima) => {
        const nuove = new Set(prima);
        if (apri ?? !nuove.has(percorso)) {
          nuove.add(percorso);
          void ricaricaCartella(percorso);
        } else {
          nuove.delete(percorso);
        }
        aperteAttuali.current = nuove;
        salvaAperte(nuove);
        return nuove;
      });
    },
    [ricaricaCartella],
  );

  const ricaricaAttorno = useCallback(
    async (percorso: string) => {
      const cartella = cartellaDi(percorso);
      if (aperteAttuali.current.has(cartella)) await ricaricaCartella(cartella);
    },
    [ricaricaCartella],
  );

  const alCambio = useCallback((gestore: (percorsi: string[]) => void) => {
    gestori.current.add(gestore);
    return () => void gestori.current.delete(gestore);
  }, []);

  // All'avvio e quando Memodu torna in primo piano: una cartella rimessa al suo posto torna
  // piena (CA-17.4).
  useEffect(() => {
    void ricaricaCartelle();
    const suFocus = () => void ricaricaCartelle();
    window.addEventListener("focus", suFocus);
    return () => window.removeEventListener("focus", suFocus);
  }, [ricaricaCartelle]);

  // Cambi sul disco (RB-84): si rileggono le cartelle aperte e si avvisa il file aperto.
  useEffect(() => {
    if (!IN_TAURI) return;
    const promessa = listen<{ percorsi: string[] }>("locale-cambiato", (evento) => {
      void ricaricaCartelle();
      for (const g of gestori.current) g(evento.payload.percorsi);
    });
    return () => void promessa.then((togli) => togli());
  }, [ricaricaCartelle]);

  // File e cartelle trascinati dentro la finestra da Esplora file o dal Finder: ovunque si
  // rilascino entrano in Locale (DEC-120). Le cartelle aggiunte si aprono.
  useEffect(() => {
    if (!IN_TAURI) return;
    const promessa = getCurrentWebview().onDragDropEvent((evento) => {
      const p = evento.payload;
      if (p.type === "enter" || p.type === "over") setEsterno(true);
      else if (p.type === "leave") setEsterno(false);
      else if (p.type === "drop") {
        setEsterno(false);
        void apiLocale
          .aggiungiPercorsi(p.paths)
          .then(async (esito) => {
            await ricaricaCartelle();
            for (const c of esito.aggiunti) if (c.tipo === "cartella") apriChiudi(c.percorso, true);
            suRilascio.current?.(esito);
          })
          .catch(() => undefined);
      }
    });
    return () => void promessa.then((togli) => togli());
  }, [apriChiudi, ricaricaCartelle]);

  return {
    esterno,
    cartelle,
    contenuti,
    aperte,
    apriChiudi,
    ricaricaCartelle,
    ricaricaCartella,
    ricaricaAttorno,
    alCambio,
  };
}
