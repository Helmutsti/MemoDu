// Lo stato dell'app sul telefono: la copia di lavoro, la sessione e la sincronizzazione in
// background, come il nucleo del computer (DEC-80): all'avvio, poco dopo ogni modifica, ogni 30
// secondi e quando l'app torna in primo piano; senza rete si riprova a intervalli che crescono
// fino a 30 secondi (DEC-138). Con l'accesso rifiutato si ferma fino a un nuovo accesso (RB-87).
// Senza accesso, se si è scelto «Non voglio usare il cloud», si lavora solo sul telefono (DEC-84).

import { randomUUID } from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import {
  accedi as accediAlServer,
  esci as esciDalServer,
  mandaNome,
  sessioneDaTesto,
  sessioneInTesto,
  type Sessione,
} from "@/nucleo/accesso";
import { Archivio } from "@/nucleo/archivio";
import { apriDb } from "@/nucleo/db-expo";
import { ErroreSinc, sincronizza, type Problema } from "@/nucleo/sinc";

const VOCE_SESSIONE = "sessione";
const INTERVALLO_MS = 30000;
const DOPO_UNA_MODIFICA_MS = 2000;
const PRIMO_RITENTATIVO_MS = 2000;
const ULTIMO_RITENTATIVO_MS = 30000;

export const TESTO_CREDENZIALI_ERRATE = "Email o password non corrette.";
export const TESTO_SERVER_IRRAGGIUNGIBILE = "Non riesco a raggiungere il server. Riprova tra poco.";

interface Negozio {
  archivio: Archivio | null;
  /** Cresce a ogni cambio della copia di lavoro: le schermate rileggono. */
  versione: number;
  sessione: Sessione | null;
  /** Ha scelto di non usare il cloud (DEC-84). */
  senzaCloud: boolean;
  pronto: boolean;
  problema: Problema | null;
  /** L'ultima sincronizzazione riuscita, per il riquadro dell'account. */
  ultimaRiuscita: string | null;
  accedi: (email: string, password: string) => Promise<string | null>;
  esci: () => Promise<void>;
  usaSenzaCloud: () => Promise<void>;
  /** Da chiamare dopo ogni modifica: la sincronizzazione parte poco dopo. */
  modificato: () => void;
}

const Contesto = createContext<Negozio | null>(null);

export function useNegozio(): Negozio {
  const n = useContext(Contesto);
  if (!n) throw new Error("useNegozio fuori da NegozioProvider");
  return n;
}

export function NegozioProvider({ children }: { children: ReactNode }) {
  const [archivio, setArchivio] = useState<Archivio | null>(null);
  const [sessione, setSessione] = useState<Sessione | null>(null);
  const [senzaCloud, setSenzaCloud] = useState(false);
  const [pronto, setPronto] = useState(false);
  const [versione, setVersione] = useState(0);
  const [problema, setProblema] = useState<Problema | null>(null);
  const [ultimaRiuscita, setUltimaRiuscita] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ritentativo = useRef(PRIMO_RITENTATIVO_MS);
  const inCorso = useRef(false);
  const fermo = useRef(false);
  const stato = useRef({ archivio, sessione });
  stato.current = { archivio, sessione };

  useEffect(() => {
    void (async () => {
      const a = await Archivio.apri(await apriDb("memodu.db"), undefined, () => randomUUID());
      const s = sessioneDaTesto(await SecureStore.getItemAsync(VOCE_SESSIONE));
      setSenzaCloud((await a.statoSinc("senza_cloud")) === "1");
      setUltimaRiuscita(await a.statoSinc("ultima_riuscita"));
      setArchivio(a);
      setSessione(s);
      setPronto(true);
    })();
  }, []);

  // Il giro si richiama da solo dopo un'attesa: lo si tiene in un ref.
  const giroRef = useRef<() => Promise<void>>(async () => undefined);
  const programma = useCallback((ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void giroRef.current(), ms);
  }, []);

  const giro = useCallback(async () => {
    const { archivio: a, sessione: s } = stato.current;
    if (!a || !s || fermo.current) return;
    if (inCorso.current) return programma(DOPO_UNA_MODIFICA_MS);
    inCorso.current = true;
    try {
      const esito = await sincronizza(a, s);
      setProblema(null);
      setUltimaRiuscita(await a.statoSinc("ultima_riuscita"));
      ritentativo.current = PRIMO_RITENTATIVO_MS;
      if (esito.cambiato) setVersione((v) => v + 1);
      programma(INTERVALLO_MS);
    } catch (e) {
      const p = e instanceof ErroreSinc ? e.problema : "errore";
      setProblema(p);
      if (p === "rifiutate") fermo.current = true;
      else {
        programma(ritentativo.current);
        ritentativo.current = Math.min(ritentativo.current * 2, ULTIMO_RITENTATIVO_MS);
      }
    } finally {
      inCorso.current = false;
    }
  }, [programma]);
  giroRef.current = giro;

  // All'avvio con la sessione, e quando l'app torna in primo piano.
  useEffect(() => {
    if (!archivio || !sessione) return;
    fermo.current = false;
    void giro();
    const ascolto = AppState.addEventListener("change", (s) => {
      if (s === "active") void giro();
    });
    return () => {
      ascolto.remove();
      clearTimeout(timer.current);
    };
  }, [archivio, sessione, giro]);

  const modificato = useCallback(() => {
    setVersione((v) => v + 1);
    if (stato.current.sessione) programma(DOPO_UNA_MODIFICA_MS);
  }, [programma]);

  const accedi = useCallback(async (email: string, password: string) => {
    try {
      const s = await accediAlServer(email, password, fetch);
      await SecureStore.setItemAsync(VOCE_SESSIONE, sessioneInTesto(s));
      void mandaNome(s, "iPhone");
      setSessione(s);
      return null;
    } catch (e) {
      return e === "credenziali" ? TESTO_CREDENZIALI_ERRATE : TESTO_SERVER_IRRAGGIUNGIBILE;
    }
  }, []);

  const esci = useCallback(async () => {
    const { archivio: a, sessione: s } = stato.current;
    if (s && a) {
      try {
        await sincronizza(a, s);
      } catch {
        // Le modifiche non mandate restano sul telefono.
      }
      await esciDalServer(s);
    }
    await SecureStore.deleteItemAsync(VOCE_SESSIONE);
    setSessione(null);
  }, []);

  const usaSenzaCloud = useCallback(async () => {
    await stato.current.archivio?.impostaStatoSinc("senza_cloud", "1");
    setSenzaCloud(true);
  }, []);

  const valore = useMemo(
    () => ({
      archivio,
      versione,
      sessione,
      senzaCloud,
      pronto,
      problema,
      ultimaRiuscita,
      accedi,
      esci,
      usaSenzaCloud,
      modificato,
    }),
    [
      archivio,
      versione,
      sessione,
      senzaCloud,
      pronto,
      problema,
      ultimaRiuscita,
      accedi,
      esci,
      usaSenzaCloud,
      modificato,
    ],
  );
  return <Contesto.Provider value={valore}>{children}</Contesto.Provider>;
}
