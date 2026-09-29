import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { anteprima, ArchivioNote, baseNome, NotaNonTrovata } from "./archivio.ts";

let cartella: string;
let orologio: Date;
let archivio: ArchivioNote;
const aperti: ArchivioNote[] = [];
const apri = (dove = cartella) => {
  const a = new ArchivioNote(dove, () => orologio);
  aperti.push(a);
  return a;
};
const passa = (secondi: number) => (orologio = new Date(orologio.getTime() + secondi * 1000));

beforeEach(async () => {
  cartella = await mkdtemp(join(tmpdir(), "memodu-"));
  orologio = new Date("2026-09-28T08:00:00Z");
  archivio = apri();
});
afterEach(async () => {
  for (const a of aperti.splice(0)) a.chiudi();
  await rm(cartella, { recursive: true, force: true });
});

describe("database (DEC-46, DEC-48)", () => {
  it("crea il file del database e la cartella se non esiste", async () => {
    apri(join(cartella, "sotto"));
    expect(await readdir(join(cartella, "sotto"))).toContain("memodu.db");
  });

  it("segna la versione dello schema", () => {
    archivio.chiudi();
    aperti.splice(0);
    const db = new Database(join(cartella, "memodu.db"));
    expect(db.pragma("user_version", { simple: true })).toBe(1);
    db.close();
  });

  it("ritrova le note riaprendo il database", async () => {
    const nota = await archivio.crea({ titolo: "Lista della spesa", contenuto: "- <u>pane</u>" });
    archivio.chiudi();
    aperti.splice(0);
    expect(await apri().leggi(nota.id)).toEqual(nota);
  });
});

describe("creazione (RB-01, RB-10)", () => {
  it("crea una nota vuota con id UUID e le date uguali", async () => {
    const nota = await archivio.crea({});
    expect(nota.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(nota).toMatchObject({
      titolo: "",
      contenuto: "",
      creata: nota.modificata,
      cartella: "",
    });
  });

  it("ammette titoli ripetuti (RB-16)", async () => {
    await archivio.crea({ titolo: "Idee" });
    await archivio.crea({ titolo: "Idee" });
    expect((await archivio.elenca()).map((v) => v.titolo)).toEqual(["Idee", "Idee"]);
  });
});

describe("nomi delle cartelle (RB-63)", () => {
  it("sostituisce i caratteri vietati e rende validi i nomi riservati", () => {
    expect(baseNome('Piano: a/b "c"?')).toBe("Piano- a-b -c--");
    expect(baseNome("fine. ")).toBe("fine");
    expect(baseNome("CON")).toBe("CON-");
    expect(baseNome("   ")).toBe("Senza titolo");
    expect(baseNome("x".repeat(300))).toHaveLength(100);
    expect(baseNome("a".repeat(99) + "🚀")).toBe("a".repeat(99) + "🚀");
    expect(baseNome("📁 Progetti 🚀")).toBe("📁 Progetti 🚀");
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

  it("cambia il titolo senza cambiare l'id", async () => {
    const nota = await archivio.crea({ titolo: "Bozza" });
    const salvata = await archivio.salva(nota.id, { titolo: "Definitiva" });
    expect(salvata).toMatchObject({ id: nota.id, titolo: "Definitiva" });
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

  it("è vuoto con un database nuovo", async () => {
    expect(await archivio.elenca()).toEqual([]);
  });
});
