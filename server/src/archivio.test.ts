import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  analizza,
  anteprima,
  ArchivioNote,
  baseNome,
  componi,
  NotaNonTrovata,
} from "./archivio.ts";

let cartella: string;
let orologio: Date;
let archivio: ArchivioNote;
const passa = (secondi: number) => (orologio = new Date(orologio.getTime() + secondi * 1000));

beforeEach(async () => {
  cartella = await mkdtemp(join(tmpdir(), "memodu-"));
  orologio = new Date("2026-09-28T08:00:00Z");
  archivio = new ArchivioNote(cartella, () => orologio);
});
afterEach(() => rm(cartella, { recursive: true, force: true }));

describe("formato del file (DEC-28)", () => {
  it("scrive intestazione YAML, titolo come prima riga e contenuto", async () => {
    const nota = await archivio.crea({
      titolo: "Lista della spesa",
      contenuto: "- latte\n- <u>pane</u>",
    });
    const testo = await readFile(join(cartella, "Lista della spesa.md"), "utf8");
    expect(testo).toBe(
      `---\nid: ${nota.id}\ncreata: 2026-09-28T08:00:00.000Z\nmodificata: 2026-09-28T08:00:00.000Z\n---\n# Lista della spesa\n\n- latte\n- <u>pane</u>`,
    );
  });

  it("rilegge esattamente ciò che ha scritto, anche con titolo vuoto e contenuto che inizia con un titolo", () => {
    const nota = {
      id: "a",
      titolo: "",
      contenuto: "## Sottotitolo\n\ntesto",
      creata: "c",
      modificata: "m",
    };
    expect(analizza(componi(nota))).toEqual(nota);
  });

  it("ignora i file senza intestazione di Memodu", async () => {
    await writeFile(join(cartella, "estraneo.md"), "# Non è di Memodu\n");
    expect(await archivio.elenca()).toEqual([]);
  });
});

describe("creazione (RB-01, RB-10)", () => {
  it("crea una nota vuota con id UUID e le date uguali", async () => {
    const nota = await archivio.crea({});
    expect(nota.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(nota).toMatchObject({ titolo: "", contenuto: "", creata: nota.modificata });
    expect(await readdir(cartella)).toEqual(["Senza titolo.md"]);
  });

  it("crea la cartella se non esiste", async () => {
    const nuova = new ArchivioNote(join(cartella, "sotto"), () => orologio);
    await nuova.crea({ contenuto: "x" });
    expect(await readdir(join(cartella, "sotto"))).toEqual(["Senza titolo.md"]);
  });
});

describe("nomi dei file (DEC-29)", () => {
  it("numera i titoli già usati e le note senza titolo", async () => {
    await archivio.crea({ titolo: "Idee" });
    await archivio.crea({ titolo: "idee" });
    await archivio.crea({});
    await archivio.crea({});
    expect((await readdir(cartella)).sort()).toEqual([
      "Idee.md",
      "Senza titolo 2.md",
      "Senza titolo.md",
      "idee 2.md",
    ]);
  });

  it("sostituisce i caratteri vietati e rende validi i nomi riservati", () => {
    expect(baseNome('Piano: a/b "c"?')).toBe("Piano- a-b -c--");
    expect(baseNome("fine. ")).toBe("fine");
    expect(baseNome("CON")).toBe("CON-");
    expect(baseNome("   ")).toBe("Senza titolo");
    expect(baseNome("x".repeat(300))).toHaveLength(100);
  });

  it("rinomina il file quando cambia il titolo, senza cambiare l'id", async () => {
    const nota = await archivio.crea({ titolo: "Bozza" });
    const salvata = await archivio.salva(nota.id, { titolo: "Definitiva" });
    expect(salvata.id).toBe(nota.id);
    expect(await readdir(cartella)).toEqual(["Definitiva.md"]);
  });

  it("cambiando solo maiuscole e minuscole non perde la nota", async () => {
    const nota = await archivio.crea({ titolo: "Idee" });
    await archivio.salva(nota.id, { titolo: "idee", contenuto: "ancora qui" });
    expect(await archivio.leggi(nota.id)).toMatchObject({
      titolo: "idee",
      contenuto: "ancora qui",
    });
    expect(await readdir(cartella)).toHaveLength(1);
  });
});

describe("salvataggio (RB-06)", () => {
  it("aggiorna contenuto e data di modifica, non la data di creazione", async () => {
    const nota = await archivio.crea({ titolo: "T", contenuto: "uno" });
    passa(5);
    const salvata = await archivio.salva(nota.id, { contenuto: "due" });
    expect(salvata).toMatchObject({ titolo: "T", contenuto: "due", creata: nota.creata });
    expect(salvata.modificata).toBe("2026-09-28T08:00:05.000Z");
    expect(await archivio.leggi(nota.id)).toEqual(salvata);
  });

  it("non lascia file temporanei", async () => {
    const nota = await archivio.crea({ titolo: "T" });
    await archivio.salva(nota.id, { contenuto: "x" });
    expect(await readdir(cartella)).toEqual(["T.md"]);
  });

  it("segnala una nota che non esiste", async () => {
    await expect(archivio.salva("manca", { contenuto: "x" })).rejects.toBeInstanceOf(
      NotaNonTrovata,
    );
    await expect(archivio.leggi("manca")).rejects.toBeInstanceOf(NotaNonTrovata);
  });
});

describe("elenco (RB-60, RB-15)", () => {
  it("ordina per ultima modifica, la più recente in cima", async () => {
    const a = await archivio.crea({ titolo: "A" });
    passa(1);
    await archivio.crea({ titolo: "B" });
    passa(1);
    await archivio.salva(a.id, { contenuto: "modificata" });
    expect((await archivio.elenca()).map((v) => v.titolo)).toEqual(["A", "B"]);
  });

  it("dà le prime parole senza simboli markdown", () => {
    expect(anteprima("## Titolo\n- [ ] **comprare** il <u>latte</u>\n1. ~~pane~~")).toBe(
      "Titolo comprare il latte pane",
    );
    expect(anteprima("parola ".repeat(30)).length).toBeLessThanOrEqual(80);
  });

  it("è vuoto se la cartella non esiste ancora", async () => {
    expect(await new ArchivioNote(join(cartella, "manca")).elenca()).toEqual([]);
  });
});
