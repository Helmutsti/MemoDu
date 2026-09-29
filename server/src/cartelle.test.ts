import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { EsitoCartella } from "@memodu/condiviso";
import {
  ArchivioNote,
  CartellaNonTrovata,
  ElementoNonTrovato,
  NomeEsistente,
  NotaNonTrovata,
  NotaNonVuota,
  PercorsoNonValido,
  SpostamentoImpossibile,
} from "./archivio.ts";

let cartella: string;
let archivio: ArchivioNote;
let orologio: Date;
const passa = (secondi: number) => {
  orologio = new Date(orologio.getTime() + secondi * 1000);
};

beforeEach(async () => {
  cartella = await mkdtemp(join(tmpdir(), "memodu-cartelle-"));
  orologio = new Date("2026-09-28T08:00:00Z");
  archivio = new ArchivioNote(cartella, () => orologio);
});
afterEach(async () => {
  archivio.chiudi();
  await rm(cartella, { recursive: true, force: true });
});

const nuova = async (genitore: string, nome: string) =>
  (await archivio.creaCartella(genitore, nome)).cartella.percorso;
const radice = async () => (await archivio.albero()).cartelle;

describe("albero (RB-56, RB-64, RB-65)", () => {
  it("mette sottocartelle e note in ordine alfabetico e conta le note delle sottocartelle", async () => {
    await nuova("", "Lavoro");
    await nuova("Lavoro", "progetti");
    await nuova("Lavoro", "Clienti");
    await archivio.crea({ titolo: "budget", cartella: "Lavoro" });
    await archivio.crea({ titolo: "Agenda", cartella: "Lavoro" });
    await archivio.crea({ titolo: "Rossi", cartella: "Lavoro/Clienti" });
    await archivio.crea({ titolo: "Radice" });

    const albero = await archivio.albero();
    expect(albero.nonOrganizzate.conteggio).toBe(1);
    const lavoro = albero.cartelle[0]!;
    expect(lavoro.cartelle.map((c) => c.nome)).toEqual(["Clienti", "progetti"]);
    expect(lavoro.cartelle[0]).toMatchObject({ percorso: "Lavoro/Clienti", conteggio: 1 });
    expect(lavoro.note.map((n) => n.titolo)).toEqual(["Agenda", "budget"]);
    expect(lavoro.conteggio).toBe(3);
  });

  it("non conta le note eliminate", async () => {
    await nuova("", "Lavoro");
    const nota = await archivio.crea({ titolo: "Via", cartella: "Lavoro" });
    await archivio.cestinaNota(nota.id);
    const albero = await archivio.albero();
    expect(albero.cartelle.map((c) => c.nome)).toEqual(["Lavoro"]);
    expect(albero.cartelle[0]!.conteggio).toBe(0);
    expect(albero.cestino).toBe(1);
  });

  it("GET /note resta sulle sole non organizzate", async () => {
    await nuova("", "Lavoro");
    await archivio.crea({ titolo: "Dentro", cartella: "Lavoro" });
    await archivio.crea({ titolo: "Fuori" });
    expect((await archivio.elenca()).map((v) => v.titolo)).toEqual(["Fuori"]);
  });
});

describe("note nelle cartelle", () => {
  it("crea la nota nella sottocartella e la ritrova per id (RB-09)", async () => {
    await nuova("", "Lavoro");
    const nota = await archivio.crea({ titolo: "Budget", cartella: "Lavoro" });
    expect(nota.cartella).toBe("Lavoro");
    expect(await archivio.leggi(nota.id)).toMatchObject({ titolo: "Budget", cartella: "Lavoro" });
    const salvata = await archivio.salva(nota.id, { titolo: "Budget 2026" });
    expect(salvata.cartella).toBe("Lavoro");
  });

  it("trova la cartella senza distinguere le maiuscole", async () => {
    await nuova("", "Lavoro");
    expect((await archivio.crea({ cartella: "lavoro" })).cartella).toBe("Lavoro");
  });

  it("rifiuta una cartella che non esiste", async () => {
    await expect(archivio.crea({ cartella: "Manca" })).rejects.toBeInstanceOf(CartellaNonTrovata);
  });

  it("sposta la nota senza cambiare la data di modifica, anche con un titolo già presente", async () => {
    await nuova("", "Lavoro");
    await archivio.crea({ titolo: "Idee", cartella: "Lavoro" });
    const nota = await archivio.crea({ titolo: "Idee" });
    passa(10);
    const spostata = await archivio.spostaNota(nota.id, "Lavoro");
    expect(spostata).toMatchObject({ cartella: "Lavoro", modificata: nota.modificata });
    expect((await radice())[0]!.note.map((n) => n.titolo)).toEqual(["Idee", "Idee"]);
    await archivio.spostaNota(nota.id, "");
    expect(await archivio.leggi(nota.id)).toMatchObject({ cartella: "" });
  });
});

describe("cartelle (RB-23, RB-24, RB-31, RB-48, RB-63)", () => {
  it("dà il nome «Nuova cartella» con un numero se c'è già", async () => {
    expect((await archivio.creaCartella("")).cartella.nome).toBe("Nuova cartella");
    expect((await archivio.creaCartella("")).cartella.nome).toBe("Nuova cartella (2)");
    expect((await archivio.creaCartella("", "Nuova cartella")).cartella.nome).toBe(
      "Nuova cartella (3)",
    );
  });

  it("sostituisce i caratteri vietati e rifiuta un nome vuoto", async () => {
    expect(await nuova("", "Idee: 2026?")).toBe("Idee- 2026-");
    await expect(archivio.creaCartella("", "  ")).rejects.toBeInstanceOf(PercorsoNonValido);
  });

  it("chiede se il nome esiste già, anche con maiuscole diverse e lettere accentate", async () => {
    await nuova("", "Clienti");
    await expect(archivio.creaCartella("", "clienti")).rejects.toMatchObject({
      conflitto: "Clienti",
    });
    await expect(archivio.creaCartella("", "clienti")).rejects.toBeInstanceOf(NomeEsistente);
    expect((await archivio.creaCartella("", "clienti", "numero")).cartella.nome).toBe(
      "clienti (2)",
    );
    await nuova("", "Èventi");
    await expect(archivio.creaCartella("", "èventi")).rejects.toBeInstanceOf(NomeEsistente);
  });

  it("rinomina, anche cambiando solo maiuscole e minuscole", async () => {
    await nuova("", "idee");
    await archivio.crea({ titolo: "Una", cartella: "idee" });
    await archivio.rinominaCartella("idee", "Idee");
    expect((await radice()).map((c) => c.nome)).toEqual(["Idee"]);
    const esito = await archivio.rinominaCartella("Idee", "Progetti");
    expect(esito.cartella).toMatchObject({ nome: "Progetti", percorso: "Progetti", conteggio: 1 });
  });

  it("sposta una cartella con il contenuto", async () => {
    await nuova("", "Lavoro");
    await nuova("", "Personale");
    await nuova("Personale", "Idee");
    await archivio.crea({ titolo: "Una", cartella: "Personale/Idee" });
    const esito = await archivio.spostaCartella("Personale/Idee", "Lavoro");
    expect(esito.cartella).toMatchObject({ percorso: "Lavoro/Idee", conteggio: 1 });
    expect((await radice()).find((c) => c.nome === "Personale")!.cartelle).toEqual([]);
  });

  it("non sposta una cartella dentro sé stessa o una sua sottocartella", async () => {
    await nuova("", "Lavoro");
    await nuova("Lavoro", "Clienti");
    await expect(archivio.spostaCartella("Lavoro", "Lavoro/Clienti")).rejects.toBeInstanceOf(
      SpostamentoImpossibile,
    );
    await expect(archivio.spostaCartella("Lavoro", "lavoro")).rejects.toBeInstanceOf(
      SpostamentoImpossibile,
    );
  });

  it("unisce: note insieme, sottocartelle omonime da risolvere, origine tolta se vuota", async () => {
    await nuova("", "A");
    await nuova("A", "Archivio");
    await nuova("A", "Solo in A");
    await archivio.crea({ titolo: "Nota", cartella: "A" });
    await nuova("", "B");
    await nuova("B", "archivio");
    await archivio.crea({ titolo: "Nota", cartella: "B" });

    const esito: EsitoCartella = await archivio.rinominaCartella("A", "b", "unisci");
    expect(esito.cartella.percorso).toBe("B");
    expect(esito.daRisolvere).toEqual(["A/Archivio"]);
    expect(esito.cartella.cartelle.map((c) => c.nome)).toEqual(["archivio", "Solo in A"]);
    expect(esito.cartella.note.map((n) => n.titolo)).toEqual(["Nota", "Nota"]);

    // L'app risolve la sottocartella rimasta: con daUnione, «A» sparisce quando si svuota.
    const secondo = await archivio.spostaCartella("A/Archivio", "B", "unisci", true);
    expect(secondo.daRisolvere).toEqual([]);
    expect((await radice()).map((c) => c.nome)).toEqual(["B"]);
  });

  it("unendo, l'origine sparisce anche se ha elementi nel cestino, che restano ripristinabili", async () => {
    await nuova("", "A");
    await nuova("", "B");
    const via = await archivio.crea({ titolo: "Via", cartella: "A" });
    await archivio.crea({ titolo: "Resta", cartella: "A" });
    await archivio.cestinaNota(via.id);
    await archivio.rinominaCartella("A", "B", "unisci");
    expect((await radice()).map((c) => `${c.nome} ${c.conteggio}`)).toEqual(["B 1"]);
    expect((await archivio.elencaCestino()).map((e) => e.nome)).toEqual(["Via"]);
    expect(await archivio.ripristina(via.id)).toMatchObject({ cartella: "" });
  });

  it("ripristinando con Unisci non resta la cartella di appoggio numerata", async () => {
    await nuova("", "Clienti");
    await nuova("Clienti", "Archivio");
    const vecchia = await archivio.crea({ titolo: "Vecchia", cartella: "Clienti/Archivio" });
    await archivio.cestinaNota(vecchia.id);
    const c = await archivio.cestinaCartella("Clienti");
    await nuova("", "clienti");
    await nuova("clienti", "Archivio");
    const esito = (await archivio.ripristina(c.id, "unisci")) as EsitoCartella;
    expect(esito.daRisolvere).toEqual(["Clienti (2)/Archivio"]);
    await archivio.spostaCartella("Clienti (2)/Archivio", "clienti", "unisci", true);
    expect((await radice()).map((x) => x.nome)).toEqual(["clienti"]);
  });

  it("rifiuta percorsi non validi", async () => {
    for (const percorso of ["../fuori", "a//b", "a/./b"]) {
      await expect(archivio.creaCartella(percorso, "x")).rejects.toBeInstanceOf(PercorsoNonValido);
    }
    await expect(archivio.rinominaCartella("", "x")).rejects.toBeInstanceOf(PercorsoNonValido);
  });

  it("segnala una cartella eliminata nel frattempo", async () => {
    await nuova("", "Lavoro");
    await archivio.cestinaCartella("Lavoro");
    await expect(archivio.rinominaCartella("Lavoro", "X")).rejects.toBeInstanceOf(
      CartellaNonTrovata,
    );
  });
});

describe("cestino (RB-25 … RB-28, RB-32, RB-55)", () => {
  it("elenca con provenienza e data, il più recente in cima", async () => {
    await nuova("", "Lavoro");
    await nuova("Lavoro", "Clienti");
    const nota = await archivio.crea({ titolo: "Riunione", cartella: "Lavoro/Clienti" });
    await archivio.crea({ titolo: "Dentro", cartella: "Lavoro/Clienti" });
    await archivio.cestinaNota(nota.id);
    passa(60);
    await archivio.cestinaCartella("Lavoro/Clienti");

    const elementi = await archivio.elencaCestino();
    expect(elementi).toMatchObject([
      { tipo: "cartella", nome: "Clienti", provenienza: "Lavoro", conteggio: 1 },
      { tipo: "nota", nome: "Riunione", provenienza: "Lavoro/Clienti" },
    ]);
    expect(elementi[1]!.eliminato).toBe("2026-09-28T08:00:00.000Z");
    expect((await radice())[0]!.cartelle).toEqual([]);
  });

  it("le note di una cartella eliminata non si aprono più", async () => {
    await nuova("", "Lavoro");
    const nota = await archivio.crea({ titolo: "Dentro", cartella: "Lavoro" });
    await archivio.cestinaCartella("Lavoro");
    await expect(archivio.leggi(nota.id)).rejects.toBeInstanceOf(NotaNonTrovata);
  });

  it("ripristina nella radice: la nota tra le non organizzate, la cartella al primo livello", async () => {
    await nuova("", "Lavoro");
    await nuova("Lavoro", "Clienti");
    const nota = await archivio.crea({ titolo: "Riunione", cartella: "Lavoro" });
    const n = await archivio.cestinaNota(nota.id);
    const c = await archivio.cestinaCartella("Lavoro/Clienti");

    expect(await archivio.ripristina(n.id)).toMatchObject({ id: nota.id, cartella: "" });
    expect(await archivio.ripristina(c.id)).toMatchObject({ cartella: { percorso: "Clienti" } });
    expect(await archivio.elencaCestino()).toEqual([]);
  });

  it("ripristinando una cartella con un nome già usato segue RB-31", async () => {
    await nuova("", "Clienti");
    await archivio.crea({ titolo: "Vecchia", cartella: "Clienti" });
    const c = await archivio.cestinaCartella("Clienti");
    await nuova("", "clienti");
    await expect(archivio.ripristina(c.id)).rejects.toBeInstanceOf(NomeEsistente);
    const esito = await archivio.ripristina(c.id, "unisci");
    expect(esito).toMatchObject({ cartella: { percorso: "clienti", conteggio: 1 } });
    expect((await radice()).map((x) => x.nome)).toEqual(["clienti"]);
    expect(await archivio.elencaCestino()).toEqual([]);
  });

  it("elimina per sempre un elemento e svuota il cestino", async () => {
    const a = await archivio.cestinaNota((await archivio.crea({ titolo: "A" })).id);
    await archivio.cestinaNota((await archivio.crea({ titolo: "B" })).id);
    await archivio.eliminaDefinitivamente(a.id);
    expect((await archivio.elencaCestino()).map((e) => e.nome)).toEqual(["B"]);
    await archivio.svuotaCestino();
    expect(await archivio.elencaCestino()).toEqual([]);
    await expect(archivio.eliminaDefinitivamente(a.id)).rejects.toBeInstanceOf(ElementoNonTrovato);
  });

  it("cancellando per sempre una cartella, gli elementi eliminati a parte restano nel cestino", async () => {
    await nuova("", "Lavoro");
    await nuova("Lavoro", "Clienti");
    const sola = await archivio.crea({ titolo: "Sola", cartella: "Lavoro" });
    const dentro = await archivio.crea({ titolo: "Dentro", cartella: "Lavoro" });
    await archivio.cestinaNota(sola.id);
    await archivio.cestinaCartella("Lavoro/Clienti");
    const lavoro = await archivio.cestinaCartella("Lavoro");
    await archivio.eliminaDefinitivamente(lavoro.id);

    expect((await archivio.elencaCestino()).map((e) => e.nome).sort()).toEqual(["Clienti", "Sola"]);
    await expect(archivio.leggi(dentro.id)).rejects.toBeInstanceOf(NotaNonTrovata);
    expect(await archivio.ripristina(sola.id)).toMatchObject({ cartella: "" });
  });
});

describe("note vuote (RB-10, DEC-39)", () => {
  it("cancella per sempre una nota vuota, non una con del testo", async () => {
    const vuota = await archivio.crea({ titolo: "  ", contenuto: "\n" });
    const piena = await archivio.crea({ contenuto: "x" });
    await archivio.eliminaSeVuota(vuota.id);
    await expect(archivio.eliminaSeVuota(piena.id)).rejects.toBeInstanceOf(NotaNonVuota);
    expect((await archivio.elenca()).map((v) => v.id)).toEqual([piena.id]);
    expect(await archivio.elencaCestino()).toEqual([]);
  });
});
