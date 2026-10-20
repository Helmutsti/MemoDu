// Allegati di Brainet sul telefono (RF-18, DEC-135, DEC-169), con le regole di
// client/src-tauri/src/archivio_allegati.rs: nel testo un allegato è un segno nascosto,
//   <allegato id="ID" f="documento|bolla|piccola|media|grande">nome del file</allegato>
// il blocco `allegato` (EN-17) si sincronizza come gli altri, i file stanno nella cartella
// dell'app (`allegati/ID/nome` e, per le foto, `allegati/ID-anteprima.jpg`): se ci sono sono
// scaricati, se mancano si scaricano quando servono (RB-118).

import { sha256 } from "@noble/hashes/sha2.js";

/** 25 MB (RB-115). */
export const LIMITE_BYTE = 25 * 1024 * 1024;
/** Lato lungo dell'anteprima di una foto, come sul computer. */
export const LATO_ANTEPRIMA = 1440;
const LUNGHEZZA_NOME = 255;
export const AVVISO_TIPO =
  "Si allegano solo foto e documenti (JPG, PNG, PDF, Word, Excel, PowerPoint, testo).";
export const AVVISO_GRANDE = "Il file supera 25 MB: non si può allegare.";
export const AVVISO_NON_DISPONIBILE = "Allegato non più disponibile";
export const AVVISO_SCARICA = "Non riesco a scaricare l'allegato. Riprova quando c'è la rete.";
export const AVVISO_LEGGERE = "Non riesco a leggere il file.";

export type TipoAllegato = "jpg" | "png" | "pdf" | "word" | "excel" | "powerpoint" | "testo";

/** Stati del file su questo telefono, come `allegati_file` sul computer. */
export const DA_CARICARE = "da_caricare";
export const CARICATO = "caricato";
export const DA_CANCELLARE = "da_cancellare";
/** Arrivato da un altro dispositivo: il file è sul server. */
export const REMOTO = "remoto";

const SEGNO = /<allegato id="([^"]+)" f="([a-z]+)">([^<]*)<\/allegato>/g;

/** Gli id degli allegati scritti in un testo. */
export const allegatiNelTesto = (testo: string): string[] =>
  [...testo.matchAll(SEGNO)].map((m) => m[1]);

export const eFoto = (tipo: string) => tipo === "jpg" || tipo === "png";

const inizia = (byte: Uint8Array, firma: number[]) =>
  byte.length >= firma.length && firma.every((b, i) => byte[i] === b);

/** Il tipo dal nome e dai primi byte del file (RB-115, SF-21); null se non si allega. */
export function tipoDelFile(nome: string, byte: Uint8Array): TipoAllegato | null {
  const punto = nome.lastIndexOf(".");
  const estensione = punto >= 0 ? nome.slice(punto + 1).toLowerCase() : "";
  // I documenti di Office di oggi sono archivi zip, quelli di prima file OLE.
  const zip = inizia(byte, [0x50, 0x4b, 0x03, 0x04]);
  const ole = inizia(byte, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  switch (estensione) {
    case "jpg":
    case "jpeg":
      return inizia(byte, [0xff, 0xd8, 0xff]) ? "jpg" : null;
    case "png":
      return inizia(byte, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) ? "png" : null;
    case "pdf":
      return inizia(byte, [0x25, 0x50, 0x44, 0x46]) ? "pdf" : null;
    case "docx":
      return zip ? "word" : null;
    case "doc":
      return ole ? "word" : null;
    case "xlsx":
      return zip ? "excel" : null;
    case "xls":
      return ole ? "excel" : null;
    case "pptx":
      return zip ? "powerpoint" : null;
    case "ppt":
      return ole ? "powerpoint" : null;
    case "txt":
      return byte.includes(0) ? null : "testo";
    default:
      return null;
  }
}

/** Il nome è valido? Come sul computer: non vuoto, fino a 255 caratteri. */
export const nomeValido = (nome: string) => {
  const n = nome.trim();
  return n.length > 0 && [...n].length <= LUNGHEZZA_NOME;
};

/** Un nome che va bene come nome di file. */
export function nomeSulDisco(nome: string): string {
  const pulito = [...nome]
    .map((c) => ('<>:"/\\|?*'.includes(c) || c.charCodeAt(0) < 32 ? "_" : c))
    .join("")
    .trim()
    .replace(/\.+$/, "");
  return pulito || "allegato";
}

export const impronta = (byte: Uint8Array) =>
  Array.from(sha256(byte), (b) => b.toString(16).padStart(2, "0")).join("");

export const percorsoFile = (id: string, nome: string) => `allegati/${id}/${nomeSulDisco(nome)}`;
export const percorsoAnteprima = (id: string) => `allegati/${id}-anteprima.jpg`;

/** I file sul telefono, con i percorsi relativi alla cartella dell'app (disco-expo.ts). */
export interface Disco {
  leggi(percorso: string): Promise<Uint8Array | null>;
  /** Scrive tutto o niente: un file a metà non sembra mai scaricato. */
  scrivi(percorso: string, byte: Uint8Array): Promise<void>;
  esiste(percorso: string): Promise<boolean>;
  /** Un file o una cartella con tutto quello che contiene. */
  togli(percorso: string): Promise<void>;
  /** L'indirizzo `file://` per l'anteprima di iOS. */
  indirizzo(percorso: string): string;
}

/** La foto ridotta per la nota (JPEG, lato lungo 1440) e le sue misure originali. */
export type RiduciFoto = (
  byte: Uint8Array,
  tipo: "jpg" | "png",
) => Promise<{ jpeg: Uint8Array; larghezza: number; altezza: number }>;

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
  /** L'anteprima di una foto come indirizzo `data:`, o null se non è ancora sul telefono. */
  anteprima: string | null;
}

/** Un allegato che non entra, con il testo dell'avviso (RB-115, SF-17, SF-21). */
export class AllegatoRifiutato extends Error {}

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function inBase64(byte: Uint8Array): string {
  let s = "";
  for (let i = 0; i < byte.length; i += 3) {
    const [a, b = 0, c = 0] = [byte[i], byte[i + 1], byte[i + 2]];
    const n = (a << 16) | (b << 8) | c;
    s += BASE64[(n >> 18) & 63] + BASE64[(n >> 12) & 63];
    s += i + 1 < byte.length ? BASE64[(n >> 6) & 63] : "=";
    s += i + 2 < byte.length ? BASE64[n & 63] : "=";
  }
  return s;
}

export function daBase64(testo: string): Uint8Array {
  const pulito = testo.replace(/[^A-Za-z0-9+/]/g, "");
  const fuori = new Uint8Array(Math.floor((pulito.length * 3) / 4));
  let j = 0;
  for (let i = 0; i < pulito.length; i += 4) {
    const n =
      (BASE64.indexOf(pulito[i]) << 18) |
      (BASE64.indexOf(pulito[i + 1]) << 12) |
      ((BASE64.indexOf(pulito[i + 2] ?? "A") & 63) << 6) |
      (BASE64.indexOf(pulito[i + 3] ?? "A") & 63);
    if (j < fuori.length) fuori[j++] = (n >> 16) & 255;
    if (j < fuori.length) fuori[j++] = (n >> 8) & 255;
    if (j < fuori.length) fuori[j++] = n & 255;
  }
  return fuori;
}
