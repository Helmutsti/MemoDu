// Una sincronizzazione completa, come client/src-tauri/src/sincronizzazione.rs: prima si riceve,
// poi si invia (DEC-76). Ogni blocco viaggia chiuso con la chiave dati (DEC-121); una busta che
// non si apre ferma tutto (CA-10.15). Se l'archivio del server è un altro si riparte da zero
// (DEC-105); al primo giro cifrato ogni elemento torna da inviare (CA-10.13).

import type { Archivio, Ricevuta } from "./archivio";
import { apriBlocco, chiudiBlocco } from "./cifratura";

export const PROTOCOLLO = "1";
export const INDIRIZZO = "https://memodu-api.vercel.app";
const ATTESA_MS = 15000;

export type Problema = "rete" | "rifiutate" | "protocollo" | "errore";

export class ErroreSinc extends Error {
  constructor(public problema: Problema) {
    super(problema);
  }
}

export interface Credenziali {
  gettone: string;
  chiave: Uint8Array;
}

type Chiamata = typeof fetch;

/** Una richiesta al server con il gettone del dispositivo e la versione del protocollo. */
export async function richiesta(
  c: { gettone?: string },
  metodo: string,
  percorso: string,
  corpo?: unknown,
  chiama: Chiamata = fetch,
  indirizzo = INDIRIZZO,
): Promise<{ stato: number; json: unknown }> {
  const fine = new AbortController();
  const timer = setTimeout(() => fine.abort(), ATTESA_MS);
  let r: Response;
  try {
    r = await chiama(`${indirizzo}${percorso}`, {
      method: metodo,
      headers: {
        "Memodu-Protocollo": PROTOCOLLO,
        ...(c.gettone ? { Authorization: `Bearer ${c.gettone}` } : {}),
        ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: fine.signal,
    });
  } catch {
    throw new ErroreSinc("rete");
  } finally {
    clearTimeout(timer);
  }
  const testo = await r.text();
  let json: unknown;
  try {
    json = testo ? JSON.parse(testo) : null;
  } catch {
    json = null;
  }
  return { stato: r.status, json };
}

const ricevuta = (v: Record<string, unknown>): Ricevuta | null =>
  typeof v.id === "string" && typeof v.versione === "number" && typeof v.dati === "string"
    ? { id: v.id, versione: v.versione, dati: v.dati }
    : null;

export interface EsitoSinc {
  /** Qualcosa è cambiato nella copia di lavoro: l'interfaccia rilegge. */
  cambiato: boolean;
}

export async function sincronizza(
  a: Archivio,
  cred: Credenziali,
  chiama: Chiamata = fetch,
  indirizzo = INDIRIZZO,
): Promise<EsitoSinc> {
  const chiedi = async (metodo: string, percorso: string, corpo?: unknown) => {
    const r = await richiesta(cred, metodo, percorso, corpo, chiama, indirizzo);
    if (r.stato === 401) throw new ErroreSinc("rifiutate");
    if (r.stato === 426) throw new ErroreSinc("protocollo");
    return r;
  };
  const apri = (r: Ricevuta): Ricevuta => {
    const dati = apriBlocco(cred.chiave, r.id, r.dati);
    if (dati === null) throw new ErroreSinc("errore");
    return { ...r, dati };
  };
  if (!(await a.statoSinc("primo_tentativo")))
    await a.impostaStatoSinc("primo_tentativo", new Date().toISOString());
  let cambiato = false;

  // Ricevere: le versioni attuali cambiate dopo l'ultimo numero d'ordine visto.
  for (;;) {
    const dopo = Number((await a.statoSinc("ultimo_ordine")) ?? 0) || 0;
    const r = await chiedi("GET", `/sincronizzazione/modifiche?dopo=${dopo}`);
    if (r.stato !== 200) throw new ErroreSinc("errore");
    const risposta = r.json as {
      modifiche?: Record<string, unknown>[];
      ultimo?: number;
      altre?: boolean;
      archivio?: string;
    };
    if (typeof risposta.archivio === "string") {
      const visto = await a.statoSinc("archivio");
      if (visto !== risposta.archivio) {
        const sincronizzata = visto !== null || (await a.statoSinc("ultimo_ordine")) !== null;
        if (sincronizzata) await a.azzeraSinc();
        await a.impostaStatoSinc("archivio", risposta.archivio);
        if (sincronizzata) continue;
      }
    }
    const ricevute = (risposta.modifiche ?? [])
      .map(ricevuta)
      .filter((x): x is Ricevuta => x !== null)
      .map(apri);
    if (await a.ricevi(ricevute)) cambiato = true;
    await a.impostaStatoSinc("ultimo_ordine", String(risposta.ultimo ?? dopo));
    if (risposta.altre !== true) break;
  }

  // Il primo giro cifrato: sul server non resta niente in chiaro.
  const giaCifrata = (await a.statoSinc("cifrata")) !== null;
  if (!giaCifrata) await a.segnaTuttoDaInviare();

  // Inviare, dalla versione da cui parte ogni elemento; se il server ne ha una più nuova si
  // fonde e si riprova, al massimo tre giri.
  for (let giro = 0; giro < 3; giro++) {
    const blocchi = await a.daInviare();
    if (!blocchi.length) break;
    const superati: Ricevuta[] = [];
    for (const b of blocchi) {
      const busta = chiudiBlocco(cred.chiave, b.id, b.dati);
      const r = await chiedi("PUT", `/sincronizzazione/elementi/${b.id}`, {
        base: b.versione,
        dati: busta,
      });
      if (r.stato === 200) {
        const versione = (r.json as { versione?: number })?.versione ?? b.versione + 1;
        await a.inviato(b, versione);
      } else if (r.stato === 409) {
        const attuale = ricevuta(
          ((r.json as { attuale?: Record<string, unknown> })?.attuale ?? {}) as Record<
            string,
            unknown
          >,
        );
        if (attuale) superati.push(apri(attuale));
      } else {
        throw new ErroreSinc("errore");
      }
    }
    if (!superati.length) break;
    if (await a.ricevi(superati)) cambiato = true;
  }

  if (!giaCifrata && !(await a.daInviare()).length) await a.impostaStatoSinc("cifrata", "1");
  await a.impostaStatoSinc("ultima_riuscita", new Date().toISOString());
  return { cambiato };
}
