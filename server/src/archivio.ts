// Archivio delle note come file markdown (DEC-28, DEC-29): un file per nota, intestazione
// YAML con id e date, titolo come prima riga. Le cartelle di Memodu sono sottocartelle vere
// con lo stesso nome, il cestino è la cartella nascosta .cestino (DEC-36, DEC-37).
// L'API è l'unica che scrive questi file (DEC-30); le modifiche fatte da altri programmi si
// ignorano (DEC-29, rischio accettato).

import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rename, rm, rmdir, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import type {
  Albero,
  Cartella,
  DatiNota,
  DatiNuovaNota,
  ElementoCestino,
  EsitoCartella,
  Nota,
  Percorso,
  SeEsiste,
  VoceElenco,
} from "@memodu/condiviso";

const ESTENSIONE = ".md";
const SENZA_TITOLO = "Senza titolo";
const NUOVA_CARTELLA = "Nuova cartella";
const CESTINO = ".cestino";
const SCHEDA_CESTINO = "elemento.json";
// Cartella di passaggio di una rinomina che cambia solo maiuscole e minuscole.
const INTERMEDIA = /^\.[0-9a-f-]{36}$/i;
const LUNGHEZZA_MASSIMA_NOME = 100;
const LUNGHEZZA_ANTEPRIMA = 80;
// Nomi che Windows non accetta come nome di file, con qualsiasi estensione.
const NOMI_RISERVATI = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/** Una nota come sta nel file: la cartella dipende da dove si trova il file. */
export type NotaSulDisco = Omit<Nota, "cartella">;

/** Nota non trovata: l'API la traduce in 404. */
export class NotaNonTrovata extends Error {
  constructor(readonly id: string) {
    super(`Nessuna nota con id ${id}`);
  }
}

/** Cartella non trovata (per esempio tolta da fuori): 404 (SF-32). */
export class CartellaNonTrovata extends Error {
  constructor(readonly percorso: string) {
    super(`Nessuna cartella «${percorso}»`);
  }
}

/** Elemento non trovato nel cestino: 404. */
export class ElementoNonTrovato extends Error {
  constructor(readonly id: string) {
    super(`Nessun elemento ${id} nel cestino`);
  }
}

/** Percorso con parti vuote, «..» o «.cestino», o nome vuoto: 400. */
export class PercorsoNonValido extends Error {}

/** Nome già usato nella destinazione, con seEsiste = "chiedi": 409 (RB-31, SF-19). */
export class NomeEsistente extends Error {
  constructor(readonly conflitto: string) {
    super(`Esiste già «${conflitto}»`);
  }
}

/** Cartella spostata dentro sé stessa o una sua sottocartella: 422 (RB-24, SF-18). */
export class SpostamentoImpossibile extends Error {}

/** La nota non è vuota e non si cancella da sola: 409 (DEC-39). */
export class NotaNonVuota extends Error {}

/** Cartella predefinita: Documenti/Memodu (DEC-29). MEMODU_CARTELLA la sostituisce. */
export function cartellaPredefinita(): string {
  return process.env.MEMODU_CARTELLA ?? join(homedir(), "Documents", "Memodu");
}

interface FileNota {
  nomeFile: string;
  cartella: Percorso;
  nota: NotaSulDisco;
}

interface SchedaCestino {
  tipo: "nota" | "cartella";
  nome: string;
  provenienza: Percorso;
  eliminato: string;
  conteggio?: number;
}

const stesso = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const padre = (percorso: Percorso) => percorso.split("/").slice(0, -1).join("/");
const ultimo = (percorso: Percorso) => percorso.split("/").pop() ?? "";
const unisciPercorso = (a: Percorso, b: string) => (a === "" ? b : `${a}/${b}`);
const ordine = (a: string, b: string) => a.localeCompare(b, "it", { sensitivity: "base" });

export class ArchivioNote {
  constructor(
    private readonly cartella: string,
    private readonly adesso: () => Date = () => new Date(),
  ) {}

  // ——— Note ———

  /** Elenco per GET /note: le non organizzate, la modificata più di recente in cima (RB-60). */
  async elenca(): Promise<VoceElenco[]> {
    const file = await this.noteIn("");
    return file.map(voce).sort((a, b) => b.modificata.localeCompare(a.modificata));
  }

  /** Cancella per sempre la nota, solo se titolo e testo sono vuoti (RB-10, DEC-39). */
  async eliminaSeVuota(id: string): Promise<void> {
    const f = await this.trova(id);
    if (f.nota.titolo.trim() !== "" || f.nota.contenuto.trim() !== "") {
      throw new NotaNonVuota("La nota non è vuota");
    }
    await rm(join(this.percorsoDisco(f.cartella), f.nomeFile));
  }

  async leggi(id: string): Promise<Nota> {
    return completa(await this.trova(id));
  }

  /** Crea una nota nella radice (RB-01) o nella cartella indicata (RB-09), anche vuota (RB-10). */
  async crea(dati: DatiNuovaNota): Promise<Nota> {
    const cartella = dati.cartella ?? "";
    valida(cartella);
    if (cartella === "") await mkdir(this.cartella, { recursive: true });
    else await this.richiediCartella(cartella);
    const istante = this.adesso().toISOString();
    const nota: NotaSulDisco = {
      id: randomUUID(),
      titolo: dati.titolo ?? "",
      contenuto: dati.contenuto ?? "",
      creata: istante,
      modificata: istante,
    };
    const nomeFile = await this.nomeLibero(cartella, nota.titolo);
    await this.scriviSicuro(cartella, nomeFile, nota);
    return { ...nota, cartella };
  }

  /** Salva titolo e contenuto e aggiorna la data di modifica (RB-06, DEC-28). */
  async salva(id: string, dati: DatiNota): Promise<Nota> {
    const attuale = await this.trova(id);
    const nota: NotaSulDisco = {
      ...attuale.nota,
      titolo: dati.titolo ?? attuale.nota.titolo,
      contenuto: dati.contenuto ?? attuale.nota.contenuto,
      modificata: this.adesso().toISOString(),
    };
    // Il nome segue il titolo (DEC-29); se non cambia, il file resta lo stesso.
    const nomeFile =
      baseNome(nota.titolo) === baseNome(attuale.nota.titolo)
        ? attuale.nomeFile
        : await this.nomeLibero(attuale.cartella, nota.titolo, attuale.nomeFile);
    await this.scriviSicuro(attuale.cartella, nomeFile, nota);
    // Su Windows e macOS "Idee.md" e "idee.md" sono lo stesso file: lo scambio l'ha già sostituito.
    if (!stesso(nomeFile, attuale.nomeFile)) {
      await rm(join(this.percorsoDisco(attuale.cartella), attuale.nomeFile));
    }
    return { ...nota, cartella: attuale.cartella };
  }

  /** Sposta la nota in un'altra cartella; la data di modifica non cambia (FL-05). */
  async spostaNota(id: string, cartella: Percorso): Promise<Nota> {
    valida(cartella);
    const attuale = await this.trova(id);
    if (cartella === "") await mkdir(this.cartella, { recursive: true });
    else await this.richiediCartella(cartella);
    if (stesso(cartella, attuale.cartella)) return completa(attuale);
    const nomeFile = await this.nomeLibero(cartella, attuale.nota.titolo);
    await rename(
      join(this.percorsoDisco(attuale.cartella), attuale.nomeFile),
      join(this.percorsoDisco(cartella), nomeFile),
    );
    return { ...attuale.nota, cartella };
  }

  // ——— Albero e cartelle ———

  /** Tutta la colonna: non organizzate (RB-60) e cartelle in ordine alfabetico (RB-64, RB-65). */
  async albero(): Promise<Albero> {
    const note = await this.elenca();
    const cartelle = await Promise.all(
      (await this.sottocartelle("")).map((nome) => this.descrivi(nome)),
    );
    const cestino = (await this.elencaCestino()).length;
    return { nonOrganizzate: { conteggio: note.length, note }, cartelle, cestino };
  }

  /**
   * Crea una cartella dentro `genitore`. Senza nome: «Nuova cartella», con un numero se c'è
   * già (RB-48); con un nome già usato segue RB-31.
   */
  async creaCartella(
    genitore: Percorso,
    nome?: string,
    seEsiste: SeEsiste = "chiedi",
  ): Promise<EsitoCartella> {
    valida(genitore);
    if (genitore === "") await mkdir(this.cartella, { recursive: true });
    else await this.richiediCartella(genitore);
    const voluto = nome === undefined ? NUOVA_CARTELLA : nomeCartella(nome);
    // Il nome proposto prende da solo un numero (RB-48); un nome scelto segue RB-31.
    const scelta = await this.risolvi(
      genitore,
      voluto,
      voluto === NUOVA_CARTELLA ? "numero" : seEsiste,
    );
    const percorso = unisciPercorso(genitore, scelta.nome);
    // Unendo una cartella nuova, e quindi vuota, a una esistente non c'è niente da spostare.
    if (!scelta.unisci) await mkdir(this.percorsoDisco(percorso));
    return { cartella: await this.descrivi(percorso), daRisolvere: [] };
  }

  /** Rinomina una cartella (RB-63); un nome già usato segue RB-31 (RB-23). */
  async rinominaCartella(
    percorso: Percorso,
    nome: string,
    seEsiste: SeEsiste = "chiedi",
  ): Promise<EsitoCartella> {
    valida(percorso, false);
    await this.richiediCartella(percorso);
    const nuovo = nomeCartella(nome);
    const genitore = padre(percorso);
    if (nuovo === ultimo(percorso))
      return { cartella: await this.descrivi(percorso), daRisolvere: [] };
    if (stesso(nuovo, ultimo(percorso))) {
      // Solo maiuscole e minuscole: su macOS e Windows serve un passaggio intermedio.
      const intermedio = unisciPercorso(genitore, `.${randomUUID()}`);
      await rename(this.percorsoDisco(percorso), this.percorsoDisco(intermedio));
      await rename(
        this.percorsoDisco(intermedio),
        this.percorsoDisco(unisciPercorso(genitore, nuovo)),
      );
      return { cartella: await this.descrivi(unisciPercorso(genitore, nuovo)), daRisolvere: [] };
    }
    return this.metti(percorso, genitore, nuovo, seEsiste, ultimo(percorso));
  }

  /**
   * Sposta una cartella con tutto il contenuto dentro `destinazione` (RB-24). Con `daUnione`
   * la cartella di partenza, origine di un'unione, si toglie se resta vuota.
   */
  async spostaCartella(
    percorso: Percorso,
    destinazione: Percorso,
    seEsiste: SeEsiste = "chiedi",
    daUnione = false,
  ): Promise<EsitoCartella> {
    valida(percorso, false);
    valida(destinazione);
    await this.richiediCartella(percorso);
    if (destinazione !== "") await this.richiediCartella(destinazione);
    const dentro =
      stesso(destinazione, percorso) ||
      destinazione.toLowerCase().startsWith(`${percorso.toLowerCase()}/`);
    if (dentro) throw new SpostamentoImpossibile("Una cartella non si sposta dentro sé stessa");
    const origine = padre(percorso);
    if (stesso(origine, destinazione))
      return { cartella: await this.descrivi(percorso), daRisolvere: [] };
    const esito = await this.metti(percorso, destinazione, ultimo(percorso), seEsiste);
    if (daUnione && origine !== "") await rmdirSeVuota(this.percorsoDisco(origine));
    return esito;
  }

  // ——— Cestino ———

  /** Manda una nota nel cestino (RB-26). */
  async cestinaNota(id: string): Promise<ElementoCestino> {
    const f = await this.trova(id);
    const elementoId = randomUUID();
    const cartellaElemento = join(this.cartella, CESTINO, elementoId);
    await mkdir(cartellaElemento, { recursive: true });
    await rename(
      join(this.percorsoDisco(f.cartella), f.nomeFile),
      join(cartellaElemento, f.nomeFile),
    );
    return this.scriviScheda(elementoId, {
      tipo: "nota",
      nome: f.nota.titolo || anteprima(f.nota.contenuto),
      provenienza: f.cartella,
      eliminato: this.adesso().toISOString(),
    });
  }

  /** Manda una cartella nel cestino con tutto il contenuto (RB-25). */
  async cestinaCartella(percorso: Percorso): Promise<ElementoCestino> {
    valida(percorso, false);
    await this.richiediCartella(percorso);
    const conteggio = (await this.descrivi(percorso)).conteggio;
    const elementoId = randomUUID();
    const cartellaElemento = join(this.cartella, CESTINO, elementoId);
    await mkdir(cartellaElemento, { recursive: true });
    await rename(this.percorsoDisco(percorso), join(cartellaElemento, ultimo(percorso)));
    return this.scriviScheda(elementoId, {
      tipo: "cartella",
      nome: ultimo(percorso),
      provenienza: padre(percorso),
      eliminato: this.adesso().toISOString(),
      conteggio,
    });
  }

  /** Gli elementi del cestino, l'eliminato più di recente in cima (SC-04). */
  async elencaCestino(): Promise<ElementoCestino[]> {
    const elementi: ElementoCestino[] = [];
    for (const id of await cartelleIn(join(this.cartella, CESTINO))) {
      const scheda = await this.leggiScheda(id).catch(() => null);
      if (scheda) elementi.push({ id, ...scheda });
    }
    return elementi.sort((a, b) => b.eliminato.localeCompare(a.eliminato));
  }

  /** Riporta l'elemento nella radice (RB-28); una cartella con un nome già usato segue RB-31. */
  async ripristina(id: string, seEsiste: SeEsiste = "chiedi"): Promise<Nota | EsitoCartella> {
    const scheda = await this.leggiScheda(id).catch(() => {
      throw new ElementoNonTrovato(id);
    });
    const cartellaElemento = join(this.cartella, CESTINO, id);
    if (scheda.tipo === "nota") {
      const nomeFile = (await readdir(cartellaElemento)).find((n) => n.endsWith(ESTENSIONE));
      if (!nomeFile) throw new ElementoNonTrovato(id);
      const nota = analizza(await readFile(join(cartellaElemento, nomeFile), "utf8"));
      if (!nota) throw new ElementoNonTrovato(id);
      const libero = await this.nomeLibero("", nota.titolo);
      await rename(join(cartellaElemento, nomeFile), join(this.cartella, libero));
      await rm(cartellaElemento, { recursive: true, force: true });
      return { ...nota, cartella: "" };
    }
    const scelta = await this.risolvi("", scheda.nome, seEsiste);
    if (!scelta.unisci) {
      await rename(join(cartellaElemento, scheda.nome), this.percorsoDisco(scelta.nome));
      await rm(cartellaElemento, { recursive: true, force: true });
      return { cartella: await this.descrivi(scelta.nome), daRisolvere: [] };
    }
    // Unisci: prima la cartella esce dal cestino con un nome libero, così le sottocartelle da
    // risolvere hanno un percorso normale; poi si unisce come in uno spostamento.
    const appoggio = (await this.risolvi("", scheda.nome, "numero")).nome;
    await rename(join(cartellaElemento, scheda.nome), this.percorsoDisco(appoggio));
    await rm(cartellaElemento, { recursive: true, force: true });
    const daRisolvere = await this.unisci(appoggio, scelta.nome);
    return { cartella: await this.descrivi(scelta.nome), daRisolvere };
  }

  /** Cancella per sempre un elemento del cestino (RB-55). */
  async eliminaDefinitivamente(id: string): Promise<void> {
    await this.leggiScheda(id).catch(() => {
      throw new ElementoNonTrovato(id);
    });
    await rm(join(this.cartella, CESTINO, id), { recursive: true, force: true });
  }

  /** Svuota il cestino (RB-32). */
  async svuotaCestino(): Promise<void> {
    for (const id of await cartelleIn(join(this.cartella, CESTINO))) {
      await rm(join(this.cartella, CESTINO, id), { recursive: true, force: true });
    }
  }

  // ——— Interni ———

  private percorsoDisco(percorso: Percorso): string {
    return percorso === "" ? this.cartella : join(this.cartella, ...percorso.split("/"));
  }

  private async richiediCartella(percorso: Percorso): Promise<void> {
    const info = await stat(this.percorsoDisco(percorso)).catch(() => null);
    if (!info?.isDirectory()) throw new CartellaNonTrovata(percorso);
  }

  /** Sottocartelle in ordine alfabetico; nella radice senza il cestino (RB-64). */
  private async sottocartelle(percorso: Percorso): Promise<string[]> {
    const nomi = await cartelleIn(this.percorsoDisco(percorso));
    return nomi
      .filter((n) => !(percorso === "" && n === CESTINO) && !INTERMEDIA.test(n))
      .sort(ordine);
  }

  /** La cartella con sottocartelle e note in ordine alfabetico e il numero di note (RB-56, RB-65). */
  private async descrivi(percorso: Percorso): Promise<Cartella> {
    const cartelle = await Promise.all(
      (await this.sottocartelle(percorso)).map((nome) =>
        this.descrivi(unisciPercorso(percorso, nome)),
      ),
    );
    const note = (await this.noteIn(percorso))
      .map(voce)
      .sort((a, b) => ordine(a.titolo || a.anteprima, b.titolo || b.anteprima));
    const conteggio = note.length + cartelle.reduce((somma, c) => somma + c.conteggio, 0);
    return { nome: ultimo(percorso), percorso, conteggio, cartelle, note };
  }

  /** Le note di una sola cartella. */
  private async noteIn(percorso: Percorso): Promise<FileNota[]> {
    let nomi: string[];
    try {
      nomi = await readdir(this.percorsoDisco(percorso));
    } catch (errore) {
      if ((errore as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw errore;
    }
    const risultato: FileNota[] = [];
    for (const nomeFile of nomi.filter((n) => n.endsWith(ESTENSIONE))) {
      const nota = analizza(await readFile(join(this.percorsoDisco(percorso), nomeFile), "utf8"));
      // I file senza intestazione di Memodu non sono note sue: si ignorano.
      if (nota) risultato.push({ nomeFile, cartella: percorso, nota });
    }
    return risultato;
  }

  /** Tutte le note fuori dal cestino, in ogni cartella. */
  private async tutte(percorso: Percorso = ""): Promise<FileNota[]> {
    const note = await this.noteIn(percorso);
    for (const nome of await this.sottocartelle(percorso)) {
      note.push(...(await this.tutte(unisciPercorso(percorso, nome))));
    }
    return note;
  }

  private async trova(id: string): Promise<FileNota> {
    const trovato = (await this.tutte()).find((f) => f.nota.id === id);
    if (!trovato) throw new NotaNonTrovata(id);
    return trovato;
  }

  /** Primo nome libero nella cartella: "Idee", "Idee 2", "Idee 3"… (DEC-29). */
  private async nomeLibero(cartella: Percorso, titolo: string, escluso?: string): Promise<string> {
    const occupati = new Set(
      (await elencoIn(this.percorsoDisco(cartella)))
        .filter((n) => n !== escluso)
        .map((n) => n.toLowerCase()),
    );
    const base = baseNome(titolo);
    for (let n = 1; ; n++) {
      const nome = (n === 1 ? base : `${base} ${n}`) + ESTENSIONE;
      if (!occupati.has(nome.toLowerCase())) return nome;
    }
  }

  /** Nome da usare nella destinazione secondo RB-31: libero, numerato o da unire. */
  private async risolvi(
    genitore: Percorso,
    nome: string,
    seEsiste: SeEsiste,
    escluso?: string,
  ): Promise<{ nome: string; unisci: boolean }> {
    const presenti = (await cartelleIn(this.percorsoDisco(genitore))).filter(
      (n) => n !== escluso && !(genitore === "" && n === CESTINO),
    );
    const esistente = presenti.find((n) => stesso(n, nome));
    if (!esistente) return { nome, unisci: false };
    if (seEsiste === "unisci") return { nome: esistente, unisci: true };
    if (seEsiste === "chiedi") throw new NomeEsistente(esistente);
    for (let n = 2; ; n++) {
      const candidato = `${nome} (${n})`;
      if (!presenti.some((p) => stesso(p, candidato))) return { nome: candidato, unisci: false };
    }
  }

  /** Mette la cartella `percorso` dentro `genitore` con il nome `nome`, secondo RB-31. */
  private async metti(
    percorso: Percorso,
    genitore: Percorso,
    nome: string,
    seEsiste: SeEsiste,
    escluso?: string,
  ): Promise<EsitoCartella> {
    const scelta = await this.risolvi(
      genitore,
      nome,
      seEsiste,
      stesso(padre(percorso), genitore) ? escluso : undefined,
    );
    const arrivo = unisciPercorso(genitore, scelta.nome);
    if (scelta.unisci) {
      const daRisolvere = await this.unisci(percorso, arrivo);
      return { cartella: await this.descrivi(arrivo), daRisolvere };
    }
    await rename(this.percorsoDisco(percorso), this.percorsoDisco(arrivo));
    return { cartella: await this.descrivi(arrivo), daRisolvere: [] };
  }

  /**
   * Unisce `origine` in `arrivo` (RB-31): i file passano con un nome libero, le sottocartelle
   * senza omonimi passano anche loro, quelle con un omonimo restano e si restituiscono.
   * L'origine sparisce se resta vuota.
   */
  private async unisci(origine: Percorso, arrivo: Percorso): Promise<Percorso[]> {
    const daRisolvere: Percorso[] = [];
    const cartellaOrigine = this.percorsoDisco(origine);
    const presenti = await cartelleIn(this.percorsoDisco(arrivo));
    for (const voce of await readdir(cartellaOrigine, { withFileTypes: true })) {
      if (voce.isDirectory()) {
        if (presenti.some((p) => stesso(p, voce.name))) {
          daRisolvere.push(unisciPercorso(origine, voce.name));
        } else {
          await rename(
            join(cartellaOrigine, voce.name),
            join(this.percorsoDisco(arrivo), voce.name),
          );
        }
        continue;
      }
      const nota = voce.name.endsWith(ESTENSIONE)
        ? analizza(await readFile(join(cartellaOrigine, voce.name), "utf8"))
        : null;
      const libero = nota
        ? await this.nomeLibero(arrivo, nota.titolo)
        : await fileLibero(this.percorsoDisco(arrivo), voce.name);
      await rename(join(cartellaOrigine, voce.name), join(this.percorsoDisco(arrivo), libero));
    }
    await rmdirSeVuota(cartellaOrigine);
    return daRisolvere;
  }

  private async scriviScheda(id: string, scheda: SchedaCestino): Promise<ElementoCestino> {
    await writeFile(
      join(this.cartella, CESTINO, id, SCHEDA_CESTINO),
      JSON.stringify(scheda, null, 2),
      "utf8",
    );
    return { id, ...scheda };
  }

  private async leggiScheda(id: string): Promise<SchedaCestino> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new ElementoNonTrovato(id);
    const testo = await readFile(join(this.cartella, CESTINO, id, SCHEDA_CESTINO), "utf8");
    return JSON.parse(testo) as SchedaCestino;
  }

  /** Prima un file temporaneo, poi lo scambio: una chiusura a metà non rompe la nota (RB-06). */
  private async scriviSicuro(
    cartella: Percorso,
    nomeFile: string,
    nota: NotaSulDisco,
  ): Promise<void> {
    const dove = this.percorsoDisco(cartella);
    const temporaneo = join(dove, `.${nomeFile}.${randomUUID()}.tmp`);
    await writeFile(temporaneo, componi(nota), "utf8");
    await rename(temporaneo, join(dove, nomeFile));
  }
}

/** Controlla un percorso di cartella (DEC-37); `radice` dice se "" è ammesso. */
function valida(percorso: Percorso, radice = true): void {
  if (percorso === "") {
    if (radice) return;
    throw new PercorsoNonValido("La radice non è una cartella");
  }
  const parti = percorso.split("/");
  const cattiva = parti.some((p) => p === "" || p === "." || p === ".." || p.includes("\\"));
  if (cattiva || stesso(parti[0]!, CESTINO))
    throw new PercorsoNonValido(`Percorso non valido: ${percorso}`);
}

/** Nome di una cartella: le regole dei nomi dei file (RB-63); vuoto non è ammesso. */
function nomeCartella(nome: string): string {
  if (nome.trim() === "") throw new PercorsoNonValido("Il nome è vuoto");
  return baseNome(nome);
}

function completa(f: FileNota): Nota {
  return { ...f.nota, cartella: f.cartella };
}

function voce({ nota }: FileNota): VoceElenco {
  return {
    id: nota.id,
    titolo: nota.titolo,
    anteprima: anteprima(nota.contenuto),
    modificata: nota.modificata,
  };
}

async function elencoIn(cartella: string): Promise<string[]> {
  try {
    return await readdir(cartella);
  } catch (errore) {
    if ((errore as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw errore;
  }
}

async function cartelleIn(cartella: string): Promise<string[]> {
  try {
    return (await readdir(cartella, { withFileTypes: true }))
      .filter((v) => v.isDirectory())
      .map((v) => v.name);
  } catch (errore) {
    if ((errore as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw errore;
  }
}

async function rmdirSeVuota(cartella: string): Promise<void> {
  if ((await elencoIn(cartella)).length === 0) await rmdir(cartella);
}

/** Nome libero per un file che non è una nota: "foto.png", "foto 2.png"… */
async function fileLibero(cartella: string, nome: string): Promise<string> {
  const occupati = new Set((await elencoIn(cartella)).map((n) => n.toLowerCase()));
  const punto = nome.lastIndexOf(".");
  const base = punto > 0 ? nome.slice(0, punto) : nome;
  const estensione = punto > 0 ? nome.slice(punto) : "";
  for (let n = 1; ; n++) {
    const candidato = n === 1 ? nome : `${base} ${n}${estensione}`;
    if (!occupati.has(candidato.toLowerCase())) return candidato;
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
export function componi(nota: NotaSulDisco): string {
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
export function analizza(testo: string): NotaSulDisco | null {
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
