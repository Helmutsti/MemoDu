// Archivio delle note come file markdown (DEC-28, DEC-29): un file per nota nella
// cartella delle note, intestazione YAML con id e date, titolo come prima riga.
// L'API è l'unica che scrive questi file (DEC-30); le modifiche fatte da altri
// programmi si ignorano (DEC-29, rischio accettato).

import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type { DatiNota, Nota, VoceElenco } from "@memodu/condiviso";

const ESTENSIONE = ".md";
const SENZA_TITOLO = "Senza titolo";
const LUNGHEZZA_MASSIMA_NOME = 100;
const LUNGHEZZA_ANTEPRIMA = 80;
// Nomi che Windows non accetta come nome di file, con qualsiasi estensione.
const NOMI_RISERVATI = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/** Nota non trovata: l'API la traduce in 404. */
export class NotaNonTrovata extends Error {
  constructor(readonly id: string) {
    super(`Nessuna nota con id ${id}`);
  }
}

/** Cartella predefinita: Documenti/Memodu (DEC-29). MEMODU_CARTELLA la sostituisce. */
export function cartellaPredefinita(): string {
  return process.env.MEMODU_CARTELLA ?? join(homedir(), "Documents", "Memodu");
}

interface FileNota {
  nomeFile: string;
  nota: Nota;
}

export class ArchivioNote {
  constructor(
    private readonly cartella: string,
    private readonly adesso: () => Date = () => new Date(),
  ) {}

  /** Elenco per GET /note: la modificata più di recente in cima (RB-60). */
  async elenca(): Promise<VoceElenco[]> {
    const file = await this.leggiTutti();
    return file
      .map(({ nota }) => ({
        id: nota.id,
        titolo: nota.titolo,
        anteprima: anteprima(nota.contenuto),
        modificata: nota.modificata,
      }))
      .sort((a, b) => b.modificata.localeCompare(a.modificata));
  }

  async leggi(id: string): Promise<Nota> {
    return (await this.trova(id)).nota;
  }

  /** Crea una nota nella radice (RB-01), anche vuota (RB-10). */
  async crea(dati: DatiNota): Promise<Nota> {
    await mkdir(this.cartella, { recursive: true });
    const istante = this.adesso().toISOString();
    const nota: Nota = {
      id: randomUUID(),
      titolo: dati.titolo ?? "",
      contenuto: dati.contenuto ?? "",
      creata: istante,
      modificata: istante,
    };
    const nomeFile = await this.nomeLibero(nota.titolo);
    await this.scriviSicuro(nomeFile, nota);
    return nota;
  }

  /** Salva titolo e contenuto e aggiorna la data di modifica (RB-06, DEC-28). */
  async salva(id: string, dati: DatiNota): Promise<Nota> {
    const attuale = await this.trova(id);
    const nota: Nota = {
      ...attuale.nota,
      titolo: dati.titolo ?? attuale.nota.titolo,
      contenuto: dati.contenuto ?? attuale.nota.contenuto,
      modificata: this.adesso().toISOString(),
    };
    // Il nome segue il titolo (DEC-29); se non cambia, il file resta lo stesso.
    const nomeFile =
      baseNome(nota.titolo) === baseNome(attuale.nota.titolo)
        ? attuale.nomeFile
        : await this.nomeLibero(nota.titolo, attuale.nomeFile);
    await this.scriviSicuro(nomeFile, nota);
    // Su Windows e macOS "Idee.md" e "idee.md" sono lo stesso file: lo scambio l'ha già sostituito.
    if (nomeFile.toLowerCase() !== attuale.nomeFile.toLowerCase()) {
      await rm(join(this.cartella, attuale.nomeFile));
    }
    return nota;
  }

  private async trova(id: string): Promise<FileNota> {
    const trovato = (await this.leggiTutti()).find((f) => f.nota.id === id);
    if (!trovato) throw new NotaNonTrovata(id);
    return trovato;
  }

  private async leggiTutti(): Promise<FileNota[]> {
    let nomi: string[];
    try {
      nomi = await readdir(this.cartella);
    } catch (errore) {
      if ((errore as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw errore;
    }
    const risultato: FileNota[] = [];
    for (const nomeFile of nomi.filter((n) => n.endsWith(ESTENSIONE))) {
      const nota = analizza(await readFile(join(this.cartella, nomeFile), "utf8"));
      // I file senza intestazione di Memodu non sono note sue: si ignorano.
      if (nota) risultato.push({ nomeFile, nota });
    }
    return risultato;
  }

  /** Primo nome libero per il titolo: "Idee", "Idee 2", "Idee 3"… (DEC-29). */
  private async nomeLibero(titolo: string, escluso?: string): Promise<string> {
    const occupati = new Set(
      (await this.elencoFile()).filter((n) => n !== escluso).map((n) => n.toLowerCase()),
    );
    const base = baseNome(titolo);
    for (let n = 1; ; n++) {
      const nome = (n === 1 ? base : `${base} ${n}`) + ESTENSIONE;
      if (!occupati.has(nome.toLowerCase())) return nome;
    }
  }

  private async elencoFile(): Promise<string[]> {
    try {
      return await readdir(this.cartella);
    } catch (errore) {
      if ((errore as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw errore;
    }
  }

  /** Prima un file temporaneo, poi lo scambio: una chiusura a metà non rompe la nota (RB-06). */
  private async scriviSicuro(nomeFile: string, nota: Nota): Promise<void> {
    const temporaneo = join(this.cartella, `.${nomeFile}.${randomUUID()}.tmp`);
    await writeFile(temporaneo, componi(nota), "utf8");
    await rename(temporaneo, join(this.cartella, nomeFile));
  }
}

/** Nome del file dal titolo, senza estensione; i caratteri vietati diventano "-". */
export function baseNome(titolo: string): string {
  const pulito = titolo
    .replace(/[<>:"/\\|?*\p{Cc}]/gu, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "")
    .slice(0, LUNGHEZZA_MASSIMA_NOME)
    .trim();
  if (pulito === "" || /^[-.]+$/.test(pulito)) return SENZA_TITOLO;
  return NOMI_RISERVATI.test(pulito) ? `${pulito}-` : pulito;
}

/** Testo del file: intestazione YAML, `# Titolo`, riga vuota, contenuto (DEC-28). */
export function componi(nota: Nota): string {
  const intestazione = [
    "---",
    `id: ${nota.id}`,
    `creata: ${nota.creata}`,
    `modificata: ${nota.modificata}`,
    "---",
  ].join("\n");
  return `${intestazione}\n# ${nota.titolo}\n\n${nota.contenuto}`;
}

/** Legge un file composto da componi(); null se non è una nota di Memodu. */
export function analizza(testo: string): Nota | null {
  const righe = testo.replace(/\r\n/g, "\n").split("\n");
  if (righe[0] !== "---") return null;
  const fine = righe.indexOf("---", 1);
  if (fine < 0) return null;
  const campi = new Map<string, string>();
  for (const riga of righe.slice(1, fine)) {
    const separatore = riga.indexOf(":");
    if (separatore > 0)
      campi.set(riga.slice(0, separatore).trim(), riga.slice(separatore + 1).trim());
  }
  const id = campi.get("id");
  const creata = campi.get("creata");
  const modificata = campi.get("modificata");
  if (!id || !creata || !modificata) return null;

  const corpo = righe.slice(fine + 1);
  let titolo = "";
  if (corpo[0]?.startsWith("#") && !corpo[0].startsWith("##")) {
    titolo = corpo.shift()!.replace(/^#\s?/, "");
    if (corpo[0] === "") corpo.shift();
  }
  return { id, titolo, contenuto: corpo.join("\n"), creata, modificata };
}

/** Prime parole del contenuto senza simboli markdown, per le note senza titolo (RB-15). */
export function anteprima(contenuto: string): string {
  const testo = contenuto
    .replace(/<\/?u>/g, "")
    .replace(/^\s*(#{1,6}|[-*+]|\d+\.)\s+(\[[ xX]\]\s+)?/gm, "")
    .replace(/(\*\*|__|\*|_|~~)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (testo.length <= LUNGHEZZA_ANTEPRIMA) return testo;
  const taglio = testo.slice(0, LUNGHEZZA_ANTEPRIMA);
  const spazio = taglio.lastIndexOf(" ");
  return spazio > 0 ? taglio.slice(0, spazio) : taglio;
}
