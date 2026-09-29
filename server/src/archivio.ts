// Archivio di note, cartelle e cestino in SQLite (DEC-45, DEC-46, DEC-47), con lo schema di
// DEC-48. L'app vede le cartelle come percorsi di nomi ("Lavoro/Clienti", DEC-37); nel
// database hanno un id e una cartella madre. Un elemento è nel cestino se ha «eliminata il»:
// una cartella nel cestino porta con sé tutto ciò che contiene (RB-25).

import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import type {
  Albero,
  Cartella,
  DatiDettagli,
  DatiNota,
  DatiNuovaNota,
  ElementoCestino,
  EsitoCartella,
  Nota,
  Percorso,
  SeEsiste,
  VoceElenco,
  VoceTag,
} from "@memodu/condiviso";
import { anteprima } from "@memodu/condiviso";

/** Prime parole delle note senza titolo (RB-15): la funzione sta in condiviso, per l'app e l'API. */
export { anteprima };

const FILE_DATABASE = "memodu.db";
const VERSIONE_SCHEMA = 1;
const SENZA_TITOLO = "Senza titolo";
const NUOVA_CARTELLA = "Nuova cartella";
const LUNGHEZZA_MASSIMA_NOME = 100;
// Nomi che Windows non accetta come nome di file: restano esclusi anche per le cartelle (RB-63).
const NOMI_RISERVATI = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

const SCHEMA = `
  CREATE TABLE cartelle (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    chiave TEXT NOT NULL,
    madre TEXT REFERENCES cartelle(id) ON DELETE CASCADE,
    eliminata_il TEXT,
    provenienza TEXT
  );
  CREATE UNIQUE INDEX cartelle_nome_unico
    ON cartelle (ifnull(madre, ''), chiave) WHERE eliminata_il IS NULL;
  CREATE TABLE note (
    id TEXT PRIMARY KEY,
    titolo TEXT NOT NULL,
    contenuto TEXT NOT NULL,
    cartella TEXT REFERENCES cartelle(id) ON DELETE SET NULL,
    creata TEXT NOT NULL,
    creata_scelta TEXT,
    modificata TEXT NOT NULL,
    fine_validita TEXT,
    eliminata_il TEXT,
    provenienza TEXT
  );
  CREATE INDEX note_cartella ON note (cartella);
  CREATE TABLE tag (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    chiave TEXT NOT NULL,
    padre TEXT REFERENCES tag(id) ON DELETE CASCADE
  );
  CREATE UNIQUE INDEX tag_nome_unico ON tag (ifnull(padre, ''), chiave);
  CREATE TABLE note_tag (
    nota TEXT NOT NULL REFERENCES note(id) ON DELETE CASCADE,
    tag TEXT NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
    PRIMARY KEY (nota, tag)
  );
`;

/** Nota non trovata: l'API la traduce in 404. */
export class NotaNonTrovata extends Error {
  constructor(
    readonly id: string,
    /** Se la nota è nel cestino: l'id dell'elemento da ripristinare (lei o la sua cartella). */
    readonly cestino?: string,
  ) {
    super(`Nessuna nota con id ${id}`);
  }
}

/** Cartella non trovata (per esempio eliminata da un'altra finestra): 404 (SF-32). */
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

/** Percorso con parti vuote o «..», o nome vuoto: 400. */
export class PercorsoNonValido extends Error {}

/** Nome già usato nella destinazione, con seEsiste = "chiedi": 409 (RB-31, SF-19). */
export class NomeEsistente extends Error {
  constructor(readonly conflitto: string) {
    super(`Esiste già «${conflitto}»`);
  }
}

/** Cartella spostata dentro sé stessa o una sua sottocartella: 422 (RB-24, SF-18). */
export class SpostamentoImpossibile extends Error {}

/** Tag non trovato: 404. */
export class TagNonTrovato extends Error {
  constructor(readonly nome: string) {
    super(`Nessun tag «${nome}»`);
  }
}

/** Data che non è un giorno AAAA-MM-GG valido: 400. */
export class DataNonValida extends Error {}

/** La nota non è vuota e non si cancella da sola: 409 (DEC-39). */
export class NotaNonVuota extends Error {}

/**
 * Cartella del database: la cartella dei dati delle applicazioni (DEC-46), fuori da OneDrive
 * e iCloud; su Windows quella locale, che non segue il profilo nei domini aziendali.
 * MEMODU_CARTELLA la sostituisce, per le prove.
 */
export function cartellaPredefinita(): string {
  if (process.env.MEMODU_CARTELLA) return process.env.MEMODU_CARTELLA;
  if (process.platform === "win32") {
    return join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "Memodu");
  }
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "Memodu");
  }
  return join(homedir(), ".local", "share", "Memodu");
}

interface RigaNota {
  id: string;
  titolo: string;
  contenuto: string;
  cartella: string | null;
  creata: string;
  creata_scelta: string | null;
  modificata: string;
  fine_validita: string | null;
  eliminata_il: string | null;
  provenienza: string | null;
}

interface RigaTag {
  id: string;
  nome: string;
  padre: string | null;
}

interface RigaCartella {
  id: string;
  nome: string;
  madre: string | null;
  eliminata_il: string | null;
  provenienza: string | null;
}

const chiave = (nome: string) => nome.toLowerCase();
const stesso = (a: string, b: string) => chiave(a) === chiave(b);
const padre = (percorso: Percorso) => percorso.split("/").slice(0, -1).join("/");
const unisciPercorso = (a: Percorso, b: string) => (a === "" ? b : `${a}/${b}`);
const ordine = (a: string, b: string) => a.localeCompare(b, "it", { sensitivity: "base" });

export class ArchivioNote {
  private db: Database.Database;
  private readonly file: string;
  private chiuso = false;

  constructor(
    cartella: string,
    private readonly adesso: () => Date = () => new Date(),
  ) {
    mkdirSync(cartella, { recursive: true });
    this.file = join(cartella, FILE_DATABASE);
    this.db = apri(this.file);
    if (this.db.pragma("user_version", { simple: true }) === 0) {
      this.db.transaction(() => {
        this.db.exec(SCHEMA);
        this.db.pragma(`user_version = ${VERSIONE_SCHEMA}`);
      })();
    }
  }

  /** Chiude il database: dopo, ogni operazione fallisce. */
  chiudi(): void {
    this.chiuso = true;
    this.db.close();
  }

  /**
   * Unico punto di passaggio di ogni operazione. SQLite decide all'apertura se il file si può
   * scrivere: se era in sola lettura, la connessione resta tale anche quando il permesso
   * torna. Con un errore di sola lettura si riapre la connessione e si riprova una volta;
   * riprovare è sicuro, perché l'errore arriva prima di scrivere e le operazioni composte
   * stanno in transazioni. Un database chiuso con chiudi() resta chiuso.
   */
  private async conRiconnessione<T>(operazione: () => Promise<T>): Promise<T> {
    try {
      return await operazione();
    } catch (errore) {
      if (this.chiuso || !solaLettura(errore)) throw errore;
      this.db.close();
      this.db = apri(this.file);
      return await operazione();
    }
  }

  // ——— Note ———

  /** Elenco per GET /note: le non organizzate, la modificata più di recente in cima (RB-60). */
  async elenca(): Promise<VoceElenco[]> {
    return this.conRiconnessione(async () => {
      const righe = this.db
        .prepare(
          "SELECT * FROM note WHERE cartella IS NULL AND eliminata_il IS NULL ORDER BY modificata DESC",
        )
        .all() as RigaNota[];
      return righe.map(voce);
    });
  }

  /** Cancella per sempre la nota, solo se titolo e testo sono vuoti (RB-10, DEC-39). */
  async eliminaSeVuota(id: string): Promise<void> {
    return this.conRiconnessione(async () => {
      const riga = this.trova(id);
      if (riga.titolo.trim() !== "" || riga.contenuto.trim() !== "") {
        throw new NotaNonVuota("La nota non è vuota");
      }
      this.db.prepare("DELETE FROM note WHERE id = ?").run(id);
    });
  }

  async leggi(id: string): Promise<Nota> {
    return this.conRiconnessione(async () => {
      return this.nota(this.trova(id));
    });
  }

  /** Crea una nota nella radice (RB-01) o nella cartella indicata (RB-09), anche vuota (RB-10). */
  async crea(dati: DatiNuovaNota): Promise<Nota> {
    return this.conRiconnessione(async () => {
      const cartella = dati.cartella ?? "";
      valida(cartella);
      const idCartella = this.idCartella(cartella);
      const istante = this.adesso().toISOString();
      const id = randomUUID();
      this.db
        .prepare(
          "INSERT INTO note (id, titolo, contenuto, cartella, creata, modificata) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(id, dati.titolo ?? "", dati.contenuto ?? "", idCartella, istante, istante);
      return this.leggi(id);
    });
  }

  /** Salva titolo e contenuto e aggiorna la data di modifica (RB-06). */
  async salva(id: string, dati: DatiNota): Promise<Nota> {
    return this.conRiconnessione(async () => {
      const attuale = this.trova(id);
      this.db
        .prepare("UPDATE note SET titolo = ?, contenuto = ?, modificata = ? WHERE id = ?")
        .run(
          dati.titolo ?? attuale.titolo,
          dati.contenuto ?? attuale.contenuto,
          this.adesso().toISOString(),
          id,
        );
      return this.leggi(id);
    });
  }

  /** Sposta la nota in un'altra cartella; la data di modifica non cambia (FL-05). */
  async spostaNota(id: string, cartella: Percorso): Promise<Nota> {
    return this.conRiconnessione(async () => {
      valida(cartella);
      this.trova(id);
      const idCartella = this.idCartella(cartella);
      this.db.prepare("UPDATE note SET cartella = ? WHERE id = ?").run(idCartella, id);
      return this.leggi(id);
    });
  }

  // ——— Albero e cartelle ———

  /** Tutta la colonna: non organizzate (RB-60) e cartelle in ordine alfabetico (RB-64, RB-65). */
  async albero(): Promise<Albero> {
    return this.conRiconnessione(async () => {
      const note = await this.elenca();
      const cartelle = this.figlie(null).map((c) => this.descrivi(c.id, c.nome));
      return {
        nonOrganizzate: { conteggio: note.length, note },
        cartelle,
        cestino: (await this.elencaCestino()).length,
      };
    });
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
    return this.conRiconnessione(async () => {
      valida(genitore);
      const idGenitore = this.idCartella(genitore);
      const voluto = nome === undefined ? NUOVA_CARTELLA : nomeCartella(nome);
      // Il nome proposto prende da solo un numero (RB-48); un nome scelto segue RB-31.
      const scelta = this.risolvi(
        idGenitore,
        voluto,
        voluto === NUOVA_CARTELLA ? "numero" : seEsiste,
      );
      // Unendo una cartella nuova, e quindi vuota, a una esistente non c'è niente da spostare.
      const id = scelta.unisci ? scelta.id! : this.inserisciCartella(scelta.nome, idGenitore);
      return { cartella: this.descrivi(id, scelta.nome, genitore), daRisolvere: [] };
    });
  }

  /** Rinomina una cartella (RB-63); un nome già usato segue RB-31 (RB-23). */
  async rinominaCartella(
    percorso: Percorso,
    nome: string,
    seEsiste: SeEsiste = "chiedi",
  ): Promise<EsitoCartella> {
    return this.conRiconnessione(async () => {
      valida(percorso, false);
      const riga = this.cartella(this.idCartella(percorso)!);
      const nuovo = nomeCartella(nome);
      const genitore = padre(percorso);
      if (nuovo === riga.nome || stesso(nuovo, riga.nome)) {
        // Stesso nome, o solo maiuscole e minuscole diverse: nessun conflitto possibile.
        this.db
          .prepare("UPDATE cartelle SET nome = ?, chiave = ? WHERE id = ?")
          .run(nuovo, chiave(nuovo), riga.id);
        return { cartella: this.descrivi(riga.id, nuovo, genitore), daRisolvere: [] };
      }
      return this.metti(riga.id, riga.madre, genitore, nuovo, seEsiste);
    });
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
    return this.conRiconnessione(async () => {
      valida(percorso, false);
      valida(destinazione);
      const riga = this.cartella(this.idCartella(percorso)!);
      const idDestinazione = this.idCartella(destinazione);
      const dentro =
        stesso(destinazione, percorso) || chiave(destinazione).startsWith(`${chiave(percorso)}/`);
      if (dentro) throw new SpostamentoImpossibile("Una cartella non si sposta dentro sé stessa");
      if (stesso(padre(percorso), destinazione)) {
        return { cartella: this.descrivi(riga.id, riga.nome, destinazione), daRisolvere: [] };
      }
      const esito = this.metti(riga.id, idDestinazione, destinazione, riga.nome, seEsiste);
      if (daUnione && riga.madre !== null) this.togliSeVuota(riga.madre);
      return esito;
    });
  }

  // ——— Cestino ———

  /** Manda una nota nel cestino (RB-26). */
  async cestinaNota(id: string): Promise<ElementoCestino> {
    return this.conRiconnessione(async () => {
      const riga = this.trova(id);
      const provenienza = this.percorso(riga.cartella) ?? "";
      const eliminato = this.adesso().toISOString();
      this.db
        .prepare("UPDATE note SET eliminata_il = ?, provenienza = ? WHERE id = ?")
        .run(eliminato, provenienza, id);
      return {
        id,
        tipo: "nota",
        nome: riga.titolo || anteprima(riga.contenuto),
        provenienza,
        eliminato,
      };
    });
  }

  /** Manda una cartella nel cestino con tutto il contenuto (RB-25). */
  async cestinaCartella(percorso: Percorso): Promise<ElementoCestino> {
    return this.conRiconnessione(async () => {
      valida(percorso, false);
      const riga = this.cartella(this.idCartella(percorso)!);
      const conteggio = this.contaNote(riga.id);
      const eliminato = this.adesso().toISOString();
      this.db
        .prepare("UPDATE cartelle SET eliminata_il = ?, provenienza = ? WHERE id = ?")
        .run(eliminato, padre(percorso), riga.id);
      return {
        id: riga.id,
        tipo: "cartella",
        nome: riga.nome,
        provenienza: padre(percorso),
        eliminato,
        conteggio,
      };
    });
  }

  /** Gli elementi del cestino, l'eliminato più di recente in cima (SC-04). */
  async elencaCestino(): Promise<ElementoCestino[]> {
    return this.conRiconnessione(async () => {
      const note = this.db
        .prepare("SELECT * FROM note WHERE eliminata_il IS NOT NULL")
        .all() as RigaNota[];
      const cartelle = this.db
        .prepare("SELECT * FROM cartelle WHERE eliminata_il IS NOT NULL")
        .all() as RigaCartella[];
      const elementi: ElementoCestino[] = [
        ...note.map((n) => ({
          id: n.id,
          tipo: "nota" as const,
          nome: n.titolo || anteprima(n.contenuto),
          provenienza: n.provenienza ?? "",
          eliminato: n.eliminata_il!,
        })),
        ...cartelle.map((c) => ({
          id: c.id,
          tipo: "cartella" as const,
          nome: c.nome,
          provenienza: c.provenienza ?? "",
          eliminato: c.eliminata_il!,
          conteggio: this.contaNote(c.id),
        })),
      ];
      return elementi.sort((a, b) => b.eliminato.localeCompare(a.eliminato));
    });
  }

  /** Riporta l'elemento nella radice (RB-28); una cartella con un nome già usato segue RB-31. */
  async ripristina(id: string, seEsiste: SeEsiste = "chiedi"): Promise<Nota | EsitoCartella> {
    return this.conRiconnessione(async () => {
      const nota = this.db
        .prepare("SELECT * FROM note WHERE id = ? AND eliminata_il IS NOT NULL")
        .get(id) as RigaNota | undefined;
      if (nota) {
        this.db
          .prepare(
            "UPDATE note SET cartella = NULL, eliminata_il = NULL, provenienza = NULL WHERE id = ?",
          )
          .run(id);
        return this.leggi(id);
      }
      const cartella = this.db
        .prepare("SELECT * FROM cartelle WHERE id = ? AND eliminata_il IS NOT NULL")
        .get(id) as RigaCartella | undefined;
      if (!cartella) throw new ElementoNonTrovato(id);
      const scelta = this.risolvi(null, cartella.nome, seEsiste);
      // Con Unisci la cartella esce prima con un nome libero, poi si unisce come in uno spostamento.
      const nome = scelta.unisci ? this.risolvi(null, cartella.nome, "numero").nome : scelta.nome;
      return this.db.transaction(() => {
        this.db
          .prepare(
            "UPDATE cartelle SET madre = NULL, nome = ?, chiave = ?, eliminata_il = NULL, provenienza = NULL WHERE id = ?",
          )
          .run(nome, chiave(nome), id);
        if (!scelta.unisci) return { cartella: this.descrivi(id, nome, ""), daRisolvere: [] };
        const daRisolvere = this.unisci(id, nome, scelta.id!);
        return { cartella: this.descrivi(scelta.id!, scelta.nome, ""), daRisolvere };
      })();
    });
  }

  /** Cancella per sempre un elemento del cestino (RB-55). */
  async eliminaDefinitivamente(id: string): Promise<void> {
    return this.conRiconnessione(async () => {
      const nota = this.db
        .prepare("DELETE FROM note WHERE id = ? AND eliminata_il IS NOT NULL")
        .run(id);
      if (nota.changes > 0) return;
      const cartella = this.db
        .prepare("SELECT id FROM cartelle WHERE id = ? AND eliminata_il IS NOT NULL")
        .get(id);
      if (!cartella) throw new ElementoNonTrovato(id);
      this.cancellaCartella(id);
    });
  }

  /** Svuota il cestino (RB-32). */
  async svuotaCestino(): Promise<void> {
    return this.conRiconnessione(async () => {
      this.db.transaction(() => {
        this.db.prepare("DELETE FROM note WHERE eliminata_il IS NOT NULL").run();
        const cartelle = this.db
          .prepare("SELECT id FROM cartelle WHERE eliminata_il IS NOT NULL")
          .all() as { id: string }[];
        for (const { id } of cartelle) {
          if (this.db.prepare("SELECT 1 FROM cartelle WHERE id = ?").get(id))
            this.cancellaCartella(id);
        }
      })();
    });
  }

  // ——— Dettagli e tag (DEC-51) ———

  /** Cambia data di creazione scelta e fine validità; aggiorna l'ultima modifica (DEC-51). */
  async salvaDettagli(id: string, dati: DatiDettagli): Promise<Nota> {
    return this.conRiconnessione(async () => {
      const attuale = this.trova(id);
      const creata = dati.creataScelta === undefined ? attuale.creata_scelta : dati.creataScelta;
      const fine = dati.fineValidita === undefined ? attuale.fine_validita : dati.fineValidita;
      for (const giorno of [creata, fine]) if (giorno !== null) validaGiorno(giorno);
      this.db
        .prepare(
          "UPDATE note SET creata_scelta = ?, fine_validita = ?, modificata = ? WHERE id = ?",
        )
        .run(creata, fine, this.adesso().toISOString(), id);
      return this.leggi(id);
    });
  }

  /**
   * Tutti i tag, anche senza note (RB-49), con quante note fuori dal cestino usano il tag o un
   * suo sotto-tag: è il numero della conferma di eliminazione (RB-19).
   */
  async elencaTag(): Promise<VoceTag[]> {
    return this.conRiconnessione(async () => {
      const righe = this.db.prepare("SELECT id FROM tag").all() as { id: string }[];
      const conta = this.db.prepare(
        `WITH RECURSIVE ramo(id) AS (
           SELECT ?
           UNION ALL
           SELECT t.id FROM tag t JOIN ramo r ON t.padre = r.id
         )
         SELECT count(DISTINCT nt.nota) AS n FROM note_tag nt
         JOIN note n ON n.id = nt.nota
         WHERE nt.tag IN (SELECT id FROM ramo) AND n.eliminata_il IS NULL`,
      );
      return righe
        .map((r) => ({ nome: this.percorsoTag(r.id), note: (conta.get(r.id) as { n: number }).n }))
        .sort((a, b) => ordine(a.nome, b.nome));
    });
  }

  /** Aggiunge un tag alla nota; se non esiste nasce con i livelli mancanti (RB-17, RB-18). */
  async aggiungiTag(id: string, nome: string): Promise<Nota> {
    return this.conRiconnessione(async () => {
      this.trova(id);
      const livelli = livelliTag(nome);
      return this.db.transaction(() => {
        const tag = this.idTag(livelli, true)!;
        const nuovo = this.db
          .prepare("INSERT OR IGNORE INTO note_tag (nota, tag) VALUES (?, ?)")
          .run(id, tag);
        if (nuovo.changes > 0) this.tocca(id);
        return this.nota(this.trova(id));
      })();
    });
  }

  /** Toglie un tag dalla nota; il tag resta anche se nessuna nota lo usa più (RB-49). */
  async togliTag(id: string, nome: string): Promise<Nota> {
    return this.conRiconnessione(async () => {
      this.trova(id);
      const tag = this.idTag(livelliTag(nome), false);
      if (!tag) throw new TagNonTrovato(nome);
      const tolto = this.db.prepare("DELETE FROM note_tag WHERE nota = ? AND tag = ?").run(id, tag);
      if (tolto.changes > 0) this.tocca(id);
      return this.leggi(id);
    });
  }

  /** Elimina un tag e i suoi sotto-tag da tutte le note, senza toccare altro (RB-19). */
  async eliminaTag(nome: string): Promise<void> {
    return this.conRiconnessione(async () => {
      const tag = this.idTag(livelliTag(nome), false);
      if (!tag) throw new TagNonTrovato(nome);
      this.db.prepare("DELETE FROM tag WHERE id = ?").run(tag);
    });
  }

  // ——— Interni ———

  /** La nota fuori dal cestino e non dentro una cartella eliminata: altrimenti 404. */
  private trova(id: string): RigaNota {
    const riga = this.db.prepare("SELECT * FROM note WHERE id = ?").get(id) as RigaNota | undefined;
    if (!riga) throw new NotaNonTrovata(id);
    if (riga.eliminata_il !== null) throw new NotaNonTrovata(id, id);
    const cartella = this.cartellaNelCestino(riga.cartella);
    if (cartella) throw new NotaNonTrovata(id, cartella);
    return riga;
  }

  /** La cartella più vicina nel cestino tra `id` e le sue madri, se c'è. */
  private cartellaNelCestino(id: string | null): string | undefined {
    for (let attuale = id; attuale !== null;) {
      const riga = this.cartella(attuale);
      if (riga.eliminata_il !== null) return riga.id;
      attuale = riga.madre;
    }
    return undefined;
  }

  private nota(riga: RigaNota): Nota {
    return {
      id: riga.id,
      titolo: riga.titolo,
      contenuto: riga.contenuto,
      creata: riga.creata,
      modificata: riga.modificata,
      cartella: this.percorso(riga.cartella) ?? "",
      creataScelta: riga.creata_scelta,
      fineValidita: riga.fine_validita,
      tag: this.tagDellaNota(riga.id),
    };
  }

  /** I tag della nota come percorsi completi, in ordine alfabetico (RB-18). */
  private tagDellaNota(id: string): string[] {
    const righe = this.db.prepare("SELECT tag FROM note_tag WHERE nota = ?").all(id) as {
      tag: string;
    }[];
    return righe.map((r) => this.percorsoTag(r.tag)).sort(ordine);
  }

  /** Percorso completo di un tag: i nomi dai livelli più alti, separati da "/". */
  private percorsoTag(id: string): string {
    const nomi: string[] = [];
    for (let attuale: string | null = id; attuale !== null;) {
      const riga = this.db.prepare("SELECT * FROM tag WHERE id = ?").get(attuale) as RigaTag;
      nomi.unshift(riga.nome);
      attuale = riga.padre;
    }
    return nomi.join("/");
  }

  /** Id del tag con quei livelli, senza distinguere maiuscole e minuscole (RB-22). */
  private idTag(livelli: string[], crea: boolean): string | undefined {
    let padre: string | null = null;
    for (const nome of livelli) {
      const riga = this.db
        .prepare("SELECT id FROM tag WHERE ifnull(padre, '') = ? AND chiave = ?")
        .get(padre ?? "", chiave(nome)) as { id: string } | undefined;
      if (riga) {
        padre = riga.id;
        continue;
      }
      if (!crea) return undefined;
      // Un tag nuovo nasce con i livelli che mancano, scritti come la prima volta (RB-17, RB-18).
      const id = randomUUID();
      this.db
        .prepare("INSERT INTO tag (id, nome, chiave, padre) VALUES (?, ?, ?, ?)")
        .run(id, nome, chiave(nome), padre);
      padre = id;
    }
    return padre ?? undefined;
  }

  private tocca(id: string): void {
    this.db
      .prepare("UPDATE note SET modificata = ? WHERE id = ?")
      .run(this.adesso().toISOString(), id);
  }

  private cartella(id: string): RigaCartella {
    return this.db.prepare("SELECT * FROM cartelle WHERE id = ?").get(id) as RigaCartella;
  }

  /** Id della cartella visibile con quel percorso, senza distinguere le maiuscole; "" è null. */
  private idCartella(percorso: Percorso): string | null {
    if (percorso === "") return null;
    let madre: string | null = null;
    for (const nome of percorso.split("/")) {
      const riga = this.db
        .prepare(
          "SELECT id FROM cartelle WHERE ifnull(madre, '') = ? AND chiave = ? AND eliminata_il IS NULL",
        )
        .get(madre ?? "", chiave(nome)) as { id: string } | undefined;
      if (!riga) throw new CartellaNonTrovata(percorso);
      madre = riga.id;
    }
    return madre;
  }

  /** Percorso di una cartella visibile; null se lei o una madre è nel cestino. */
  private percorso(id: string | null): Percorso | null {
    const nomi: string[] = [];
    for (let attuale = id; attuale !== null;) {
      const riga = this.cartella(attuale);
      if (!riga || riga.eliminata_il !== null) return null;
      nomi.unshift(riga.nome);
      attuale = riga.madre;
    }
    return nomi.join("/");
  }

  /** Sottocartelle visibili in ordine alfabetico (RB-64). */
  private figlie(madre: string | null): RigaCartella[] {
    const righe = this.db
      .prepare("SELECT * FROM cartelle WHERE ifnull(madre, '') = ? AND eliminata_il IS NULL")
      .all(madre ?? "") as RigaCartella[];
    return righe.sort((a, b) => ordine(a.nome, b.nome));
  }

  /** La cartella con sottocartelle e note in ordine alfabetico e il numero di note (RB-56, RB-65). */
  private descrivi(id: string, nome: string, genitore?: Percorso): Cartella {
    const percorso = unisciPercorso(genitore ?? padre(this.percorso(id) ?? nome), nome);
    const cartelle = this.figlie(id).map((c) => this.descrivi(c.id, c.nome, percorso));
    const note = (
      this.db
        .prepare("SELECT * FROM note WHERE cartella = ? AND eliminata_il IS NULL")
        .all(id) as RigaNota[]
    )
      .map(voce)
      .sort((a, b) => ordine(a.titolo || a.anteprima, b.titolo || b.anteprima));
    const conteggio = note.length + cartelle.reduce((somma, c) => somma + c.conteggio, 0);
    return { nome, percorso, conteggio, cartelle, note };
  }

  /** Id della cartella e di tutte le sottocartelle non eliminate a parte. */
  private sottoalbero(id: string): string[] {
    const righe = this.db
      .prepare(
        `WITH RECURSIVE albero(id) AS (
           SELECT ?
           UNION ALL
           SELECT c.id FROM cartelle c JOIN albero a ON c.madre = a.id WHERE c.eliminata_il IS NULL
         )
         SELECT id FROM albero`,
      )
      .all(id) as { id: string }[];
    return righe.map((r) => r.id);
  }

  /** Note della cartella e delle sottocartelle, senza quelle eliminate a parte (RB-56). */
  private contaNote(id: string): number {
    const ids = this.sottoalbero(id);
    const riga = this.db
      .prepare(
        `SELECT count(*) AS n FROM note WHERE eliminata_il IS NULL AND cartella IN (${ids.map(() => "?").join(",")})`,
      )
      .get(...ids) as { n: number };
    return riga.n;
  }

  private inserisciCartella(nome: string, madre: string | null): string {
    const id = randomUUID();
    this.db
      .prepare("INSERT INTO cartelle (id, nome, chiave, madre) VALUES (?, ?, ?, ?)")
      .run(id, nome, chiave(nome), madre);
    return id;
  }

  /** Nome da usare nella destinazione secondo RB-31: libero, numerato o da unire. */
  private risolvi(
    madre: string | null,
    nome: string,
    seEsiste: SeEsiste,
    escluso?: string,
  ): { nome: string; unisci: boolean; id?: string } {
    const presenti = this.figlie(madre).filter((c) => c.id !== escluso);
    const esistente = presenti.find((c) => stesso(c.nome, nome));
    if (!esistente) return { nome, unisci: false };
    if (seEsiste === "unisci") return { nome: esistente.nome, unisci: true, id: esistente.id };
    if (seEsiste === "chiedi") throw new NomeEsistente(esistente.nome);
    for (let n = 2; ; n++) {
      const candidato = `${nome} (${n})`;
      if (!presenti.some((c) => stesso(c.nome, candidato)))
        return { nome: candidato, unisci: false };
    }
  }

  /** Mette la cartella `id` dentro `madre` con il nome `nome`, secondo RB-31. */
  private metti(
    id: string,
    madre: string | null,
    genitore: Percorso,
    nome: string,
    seEsiste: SeEsiste,
  ): EsitoCartella {
    const scelta = this.risolvi(madre, nome, seEsiste, id);
    return this.db.transaction(() => {
      if (scelta.unisci) {
        const origine = this.percorso(id)!;
        const daRisolvere = this.unisci(id, origine, scelta.id!);
        return { cartella: this.descrivi(scelta.id!, scelta.nome, genitore), daRisolvere };
      }
      this.db
        .prepare("UPDATE cartelle SET madre = ?, nome = ?, chiave = ? WHERE id = ?")
        .run(madre, scelta.nome, chiave(scelta.nome), id);
      return { cartella: this.descrivi(id, scelta.nome, genitore), daRisolvere: [] };
    })();
  }

  /**
   * Unisce `origine` in `arrivo` (RB-31): le note passano (i titoli possono ripetersi, RB-16),
   * le sottocartelle senza omonimi passano anche loro, quelle con un omonimo restano e si
   * restituiscono. L'origine sparisce se resta vuota.
   */
  private unisci(origine: string, percorsoOrigine: Percorso, arrivo: string): Percorso[] {
    const daRisolvere: Percorso[] = [];
    const presenti = this.figlie(arrivo);
    for (const figlia of this.figlie(origine)) {
      if (presenti.some((p) => stesso(p.nome, figlia.nome))) {
        daRisolvere.push(unisciPercorso(percorsoOrigine, figlia.nome));
      } else {
        this.db.prepare("UPDATE cartelle SET madre = ? WHERE id = ?").run(arrivo, figlia.id);
      }
    }
    this.db
      .prepare("UPDATE note SET cartella = ? WHERE cartella = ? AND eliminata_il IS NULL")
      .run(arrivo, origine);
    this.togliSeVuota(origine);
    return daRisolvere;
  }

  /**
   * Toglie la cartella se non ha più contenuto visibile. Gli elementi nel cestino che venivano
   * da lì si staccano prima: tornano comunque nella radice (RB-28) e la provenienza resta.
   */
  private togliSeVuota(id: string): void {
    const cartelle = this.db
      .prepare("SELECT 1 FROM cartelle WHERE madre = ? AND eliminata_il IS NULL")
      .get(id);
    const note = this.db
      .prepare("SELECT 1 FROM note WHERE cartella = ? AND eliminata_il IS NULL")
      .get(id);
    if (cartelle || note) return;
    this.db.prepare("UPDATE cartelle SET madre = NULL WHERE madre = ?").run(id);
    this.db.prepare("UPDATE note SET cartella = NULL WHERE cartella = ?").run(id);
    this.db.prepare("DELETE FROM cartelle WHERE id = ?").run(id);
  }

  /**
   * Cancella per sempre una cartella eliminata con il suo contenuto. Le sottocartelle e le
   * note eliminate a parte restano nel cestino: si staccano prima di cancellare.
   */
  private cancellaCartella(id: string): void {
    this.db.transaction(() => {
      const ids = this.sottoalbero(id);
      const segnaposto = ids.map(() => "?").join(",");
      this.db
        .prepare(
          `UPDATE cartelle SET madre = NULL WHERE madre IN (${segnaposto}) AND eliminata_il IS NOT NULL AND id <> ?`,
        )
        .run(...ids, id);
      this.db
        .prepare(`DELETE FROM note WHERE cartella IN (${segnaposto}) AND eliminata_il IS NULL`)
        .run(...ids);
      this.db.prepare("DELETE FROM cartelle WHERE id = ?").run(id);
    })();
  }
}

/** Apre il database con le impostazioni di ogni connessione. */
function apri(file: string): Database.Database {
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

/** Errore di SQLite per un file che non si può scrivere (SQLITE_READONLY e varianti). */
function solaLettura(errore: unknown): boolean {
  const codice = (errore as { code?: unknown }).code;
  return typeof codice === "string" && codice.startsWith("SQLITE_READONLY");
}

/**
 * Livelli di un tag (RB-18, RB-22): separati da "/", senza spazi ai lati; i "/" all'inizio,
 * alla fine e ripetuti si tolgono. Senza livelli il nome è vuoto: 400.
 */
export function livelliTag(nome: string): string[] {
  const livelli = nome
    .split("/")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l !== "");
  if (livelli.length === 0) throw new PercorsoNonValido("Il nome del tag è vuoto");
  return livelli;
}

/** Un giorno del calendario AAAA-MM-GG che esiste davvero (DEC-28, RB-20). */
function validaGiorno(giorno: string): void {
  const data = new Date(`${giorno}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(giorno) || data.toISOString().slice(0, 10) !== giorno) {
    throw new DataNonValida(`Data non valida: ${giorno}`);
  }
}

/** Controlla un percorso di cartella (DEC-37); `radice` dice se "" è ammesso. */
function valida(percorso: Percorso, radice = true): void {
  if (percorso === "") {
    if (radice) return;
    throw new PercorsoNonValido("La radice non è una cartella");
  }
  const parti = percorso.split("/");
  if (parti.some((p) => p === "" || p === "." || p === ".." || p.includes("\\"))) {
    throw new PercorsoNonValido(`Percorso non valido: ${percorso}`);
  }
}

/** Nome di una cartella: i caratteri vietati diventano "-" (RB-63); vuoto non è ammesso. */
function nomeCartella(nome: string): string {
  if (nome.trim() === "") throw new PercorsoNonValido("Il nome è vuoto");
  return baseNome(nome);
}

function voce(riga: RigaNota): VoceElenco {
  return {
    id: riga.id,
    titolo: riga.titolo,
    anteprima: anteprima(riga.contenuto),
    modificata: riga.modificata,
  };
}

/** Nome pulito: i caratteri vietati nei nomi dei file diventano "-" (RB-63). */
export function baseNome(titolo: string): string {
  const intero = titolo
    .replace(/[<>:"/\\|?*\p{Cc}]/gu, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "");
  // Si contano i caratteri veri, non le unità interne: un'emoji non si spezza a metà.
  const pulito = Array.from(intero).slice(0, LUNGHEZZA_MASSIMA_NOME).join("").trim();
  if (pulito === "" || /^[-.]+$/.test(pulito)) return SENZA_TITOLO;
  return NOMI_RISERVATI.test(pulito) ? `${pulito}-` : pulito;
}
