import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ArchivioNote,
  DataNonValida,
  livelliTag,
  PercorsoNonValido,
  TagNonTrovato,
} from "./archivio.ts";

let cartella: string;
let archivio: ArchivioNote;
let orologio: Date;
const passa = (secondi: number) => {
  orologio = new Date(orologio.getTime() + secondi * 1000);
};

beforeEach(async () => {
  cartella = await mkdtemp(join(tmpdir(), "memodu-tag-"));
  orologio = new Date("2026-09-29T08:00:00Z");
  archivio = new ArchivioNote(cartella, () => orologio);
});
afterEach(async () => {
  archivio.chiudi();
  await rm(cartella, { recursive: true, force: true });
});

describe("nomi dei tag (RB-18, RB-22)", () => {
  it("toglie i / superflui e gli spazi ai lati di ogni livello", () => {
    expect(livelliTag("  /viaggi//estate 🏖️/ ")).toEqual(["viaggi", "estate 🏖️"]);
    expect(livelliTag("lavoro / clienti")).toEqual(["lavoro", "clienti"]);
  });

  it("rifiuta un nome vuoto", () => {
    expect(() => livelliTag(" / ")).toThrow(PercorsoNonValido);
  });
});

describe("tag delle note (RB-17, RB-18, RB-22, RB-49)", () => {
  it("una nota nuova non ha tag né date scelte", async () => {
    const nota = await archivio.crea({ titolo: "A" });
    expect(nota).toMatchObject({ tag: [], creataScelta: null, fineValidita: null });
  });

  it("aggiunge un tag nuovo con i livelli che mancano, scritti come la prima volta", async () => {
    const nota = await archivio.crea({ titolo: "A" });
    passa(5);
    const con = await archivio.aggiungiTag(nota.id, "Lavoro/Clienti");
    expect(con.tag).toEqual(["Lavoro/Clienti"]);
    expect(con.modificata).toBe("2026-09-29T08:00:05.000Z");
    expect(await archivio.elencaTag()).toEqual([
      { nome: "Lavoro", note: 0 },
      { nome: "Lavoro/Clienti", note: 1 },
    ]);
  });

  it("usa il tag esistente senza distinguere maiuscole e minuscole", async () => {
    const a = await archivio.crea({ titolo: "A" });
    const b = await archivio.crea({ titolo: "B" });
    await archivio.aggiungiTag(a.id, "lavoro");
    const con = await archivio.aggiungiTag(b.id, "LAVORO/Clienti");
    expect(con.tag).toEqual(["lavoro/Clienti"]);
    expect((await archivio.elencaTag()).map((t) => t.nome)).toEqual(["lavoro", "lavoro/Clienti"]);
  });

  it("toglie il tag dalla nota e il tag resta (RB-49)", async () => {
    const nota = await archivio.crea({ titolo: "A" });
    await archivio.aggiungiTag(nota.id, "riunioni");
    const senza = await archivio.togliTag(nota.id, "Riunioni");
    expect(senza.tag).toEqual([]);
    expect(await archivio.elencaTag()).toEqual([{ nome: "riunioni", note: 0 }]);
    await expect(archivio.togliTag(nota.id, "manca")).rejects.toBeInstanceOf(TagNonTrovato);
  });

  it("non conta le note nel cestino", async () => {
    const nota = await archivio.crea({ titolo: "A" });
    await archivio.aggiungiTag(nota.id, "riunioni");
    await archivio.cestinaNota(nota.id);
    expect(await archivio.elencaTag()).toEqual([{ nome: "riunioni", note: 0 }]);
  });
});

describe("eliminare un tag (RB-19)", () => {
  it("toglie il tag e i sotto-tag da tutte le note, senza cambiarle altrimenti", async () => {
    const a = await archivio.crea({ titolo: "A" });
    const b = await archivio.crea({ titolo: "B" });
    await archivio.aggiungiTag(a.id, "lavoro");
    await archivio.aggiungiTag(b.id, "lavoro/fornitori");
    await archivio.aggiungiTag(b.id, "riunioni");
    const prima = (await archivio.leggi(b.id)).modificata;
    passa(60);
    await archivio.eliminaTag("Lavoro");
    expect((await archivio.leggi(a.id)).tag).toEqual([]);
    expect(await archivio.leggi(b.id)).toMatchObject({ tag: ["riunioni"], modificata: prima });
    expect((await archivio.elencaTag()).map((t) => t.nome)).toEqual(["riunioni"]);
    await expect(archivio.eliminaTag("lavoro")).rejects.toBeInstanceOf(TagNonTrovato);
  });
});

describe("dettagli (RF-04, RB-20, RB-21)", () => {
  it("salva data scelta e fine validità, aggiorna l'ultima modifica, non la creazione", async () => {
    const nota = await archivio.crea({ titolo: "A" });
    passa(10);
    const salvata = await archivio.salvaDettagli(nota.id, {
      creataScelta: "2020-01-01",
      fineValidita: "2026-01-31",
    });
    expect(salvata).toMatchObject({
      creataScelta: "2020-01-01",
      fineValidita: "2026-01-31",
      creata: nota.creata,
      modificata: "2026-09-29T08:00:10.000Z",
    });
    const tolta = await archivio.salvaDettagli(nota.id, { fineValidita: null });
    expect(tolta).toMatchObject({ creataScelta: "2020-01-01", fineValidita: null });
  });

  it("rifiuta un giorno che non esiste", async () => {
    const nota = await archivio.crea({ titolo: "A" });
    for (const giorno of ["2026-02-30", "29/09/2026", "2026-9-1"]) {
      await expect(
        archivio.salvaDettagli(nota.id, { creataScelta: giorno }),
      ).rejects.toBeInstanceOf(DataNonValida);
    }
  });
});
