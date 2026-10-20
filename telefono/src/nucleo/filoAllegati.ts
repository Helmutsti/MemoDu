// Il viaggio dei file degli allegati (RF-18, DEC-135, DEC-169), come client/src-tauri/src/allegati.rs:
// dopo ogni sincronizzazione si cancella sul server quello che nessuno usa più, si caricano i
// file nuovi e si scaricano le anteprime chieste. I file partono cifrati con la chiave dati e
// arrivano al deposito con indirizzi firmati dal server; senza rete si riprova al giro dopo
// (SF-08). È a parte dalle note, così un file grande non ferma la sincronizzazione (RB-118).

import { AVVISO_NON_DISPONIBILE, AVVISO_SCARICA, LIMITE_BYTE } from "./allegati";
import type { Archivio } from "./archivio";
import { apriFile, chiudiFile } from "./cifratura";
import { ErroreSinc, INDIRIZZO, richiesta, type Credenziali } from "./sinc";

type Chiamata = typeof fetch;
const ATTESA_FILE_MS = 60000;

class Rete extends Error {}
class Altro extends Error {}

async function api(
  cred: Credenziali,
  metodo: string,
  percorso: string,
  corpo: unknown,
  chiama: Chiamata,
  indirizzo: string,
): Promise<Record<string, unknown>> {
  let r;
  try {
    r = await richiesta(cred, metodo, percorso, corpo, chiama, indirizzo);
  } catch (e) {
    if (e instanceof ErroreSinc && e.problema === "rete") throw new Rete();
    throw e;
  }
  if (r.stato === 204) return {};
  if (r.stato < 200 || r.stato >= 300) throw new Altro(String(r.stato));
  return (r.json ?? {}) as Record<string, unknown>;
}

/** Una richiesta a un indirizzo firmato: la firma è l'unico permesso. */
async function aFile(
  chiama: Chiamata,
  indirizzo: string,
  metodo: "PUT" | "GET",
  byte?: Uint8Array,
): Promise<Uint8Array> {
  const fine = new AbortController();
  const timer = setTimeout(() => fine.abort(), ATTESA_FILE_MS);
  let r: Response;
  try {
    r = await chiama(indirizzo, {
      method: metodo,
      headers: byte ? { "Content-Type": "application/octet-stream" } : undefined,
      body: byte as BodyInit | undefined,
      signal: fine.signal,
    });
  } catch {
    throw new Rete();
  } finally {
    clearTimeout(timer);
  }
  if (!r.ok) throw new Altro(String(r.status));
  if (metodo === "PUT") return new Uint8Array();
  const dati = new Uint8Array(await r.arrayBuffer());
  if (dati.length > LIMITE_BYTE + 1024) throw new Altro("troppo");
  return dati;
}

async function carica(a: Archivio, cred: Credenziali, id: string, chiama: Chiamata, ind: string) {
  const { file, anteprima } = await a.fileDaCaricare(id);
  const chiuso = chiudiFile(cred.chiave, id, file);
  const chiusa = anteprima ? chiudiFile(cred.chiave, `${id}-anteprima`, anteprima) : null;
  const indirizzi = await api(
    cred,
    "POST",
    `/allegati/${id}/caricamento`,
    { grandezza: chiuso.length, anteprima: chiusa?.length ?? 0 },
    chiama,
    ind,
  );
  if (typeof indirizzi.file !== "string") throw new Altro("indirizzo");
  await aFile(chiama, indirizzi.file, "PUT", chiuso);
  if (chiusa && typeof indirizzi.anteprima === "string")
    await aFile(chiama, indirizzi.anteprima, "PUT", chiusa);
  await api(cred, "POST", `/allegati/${id}/fatto`, undefined, chiama, ind);
}

async function scaricamento(cred: Credenziali, id: string, chiama: Chiamata, ind: string) {
  return api(cred, "GET", `/allegati/${id}/scaricamento`, undefined, chiama, ind);
}

/**
 * Un giro: cancella, carica, scarica le anteprime chieste. Restituisce gli allegati la cui
 * anteprima è appena arrivata; quelle non scaricate per la rete restano chieste.
 */
export async function giroAllegati(
  a: Archivio,
  cred: Credenziali,
  anteprime: Set<string>,
  chiama: Chiamata = fetch,
  indirizzo = INDIRIZZO,
): Promise<string[]> {
  await a.togliFileRicevuti();
  try {
    for (const id of await a.allegatiConStato("da_cancellare")) {
      try {
        await api(cred, "DELETE", `/allegati/${id}`, undefined, chiama, indirizzo);
        await a.allegatoCancellato(id);
      } catch (e) {
        if (e instanceof Rete) throw e;
      }
    }
    for (const id of await a.allegatiConStato("da_caricare")) {
      try {
        await carica(a, cred, id, chiama, indirizzo);
        await a.allegatoCaricato(id);
      } catch (e) {
        if (e instanceof Rete) throw e;
      }
    }
  } catch (e) {
    if (e instanceof Rete) return [];
    throw e;
  }
  const pronte: string[] = [];
  for (const id of [...anteprime]) {
    try {
      const indirizzi = await scaricamento(cred, id, chiama, indirizzo);
      if (typeof indirizzi.anteprima !== "string") throw new Altro("anteprima");
      const chiusa = await aFile(chiama, indirizzi.anteprima, "GET");
      const byte = apriFile(cred.chiave, `${id}-anteprima`, chiusa);
      if (!byte) throw new Altro("chiave");
      await a.salvaAnteprimaScaricata(id, byte);
      anteprime.delete(id);
      pronte.push(id);
    } catch (e) {
      // Senza rete si riprova al giro dopo; se il file non è ancora sul server (l'altro
      // dispositivo lo sta caricando) si riprova quando la nota lo chiede di nuovo.
      if (e instanceof Rete) break;
      anteprime.delete(id);
    }
  }
  return pronte;
}

/** Il file sul telefono, scaricandolo se serve (RB-118), per «Apri». L'errore ha il testo dell'avviso. */
export async function fileSulTelefono(
  a: Archivio,
  cred: Credenziali | null,
  id: string,
  chiama: Chiamata = fetch,
  indirizzo = INDIRIZZO,
): Promise<string> {
  const percorso = await a.percorsoAllegato(id);
  if (!percorso) throw new Error(AVVISO_NON_DISPONIBILE);
  if (await a.allegatoScaricato(id)) return percorso;
  if (!cred) throw new Error(AVVISO_SCARICA);
  try {
    const indirizzi = await scaricamento(cred, id, chiama, indirizzo);
    if (typeof indirizzi.file !== "string") throw new Altro("file");
    const byte = apriFile(cred.chiave, id, await aFile(chiama, indirizzi.file, "GET"));
    if (!byte) throw new Altro("chiave");
    return await a.salvaScaricato(id, byte);
  } catch (e) {
    if (e instanceof Rete) throw new Error(AVVISO_SCARICA, { cause: e });
    // SF-20: sul server non c'è (più), o non si apre.
    throw new Error(AVVISO_NON_DISPONIBILE, { cause: e });
  }
}
