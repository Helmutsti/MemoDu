import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { DatiNota, Nota } from "@memodu/condiviso";
import { CodaSalvataggio, PAUSA_MS } from "./salvataggio";

const nota = (id: string, dati: DatiNota): Nota => ({
  id,
  titolo: dati.titolo ?? "",
  contenuto: dati.contenuto ?? "",
  creata: "c",
  modificata: "m",
  cartella: "",
  creataScelta: null,
  fineValidita: null,
  tag: [],
});

let salva: Mock<(id: string, dati: DatiNota) => Promise<Nota>>;
let onSalvata: Mock<(nota: Nota) => void>;
let onErrore: Mock<(errore: unknown) => void>;
let coda: CodaSalvataggio;

beforeEach(() => {
  vi.useFakeTimers();
  salva = vi.fn(async (id: string, dati: DatiNota) => nota(id, dati));
  onSalvata = vi.fn();
  onErrore = vi.fn();
  coda = new CodaSalvataggio(salva, onSalvata, onErrore);
});
afterEach(() => vi.useRealTimers());

describe("salvataggio automatico (RB-06, CA-02.7)", () => {
  it("salva dopo 2 s di pausa, una volta sola, con l'ultima versione", async () => {
    coda.modifica("a", { contenuto: "c" });
    await vi.advanceTimersByTimeAsync(1500);
    coda.modifica("a", { contenuto: "ci" });
    await vi.advanceTimersByTimeAsync(1500);
    coda.modifica("a", { contenuto: "ciao" });
    await vi.advanceTimersByTimeAsync(PAUSA_MS - 1);
    expect(salva).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(salva).toHaveBeenCalledTimes(1);
    expect(salva).toHaveBeenCalledWith("a", { contenuto: "ciao" });
    expect(onSalvata).toHaveBeenCalled();
  });

  it("unisce titolo e contenuto modificati nella stessa pausa", async () => {
    coda.modifica("a", { titolo: "T" });
    coda.modifica("a", { contenuto: "testo" });
    await vi.advanceTimersByTimeAsync(PAUSA_MS);
    expect(salva).toHaveBeenCalledWith("a", { titolo: "T", contenuto: "testo" });
  });

  it("salva subito quando si cambia nota, si chiude o si perde il focus", async () => {
    coda.modifica("a", { contenuto: "uno" });
    await coda.scarica();
    expect(salva).toHaveBeenCalledWith("a", { contenuto: "uno" });
    await vi.advanceTimersByTimeAsync(PAUSA_MS);
    expect(salva).toHaveBeenCalledTimes(1);
  });

  it("passando a un'altra nota salva prima quella precedente", async () => {
    coda.modifica("a", { contenuto: "uno" });
    coda.modifica("b", { contenuto: "due" });
    await vi.advanceTimersByTimeAsync(PAUSA_MS);
    expect(salva.mock.calls.map((c) => c[0])).toEqual(["a", "b"]);
  });

  it("senza modifiche non chiama l'API", async () => {
    await coda.scarica();
    expect(salva).not.toHaveBeenCalled();
  });

  it("se il salvataggio fallisce tiene il testo e lo riprova alla volta dopo (RB-61)", async () => {
    salva.mockRejectedValueOnce(new Error("spento"));
    coda.modifica("a", { contenuto: "importante" });
    await coda.scarica();
    expect(onErrore).toHaveBeenCalled();
    expect(coda.haModifiche).toBe(true);
    await coda.scarica();
    expect(salva).toHaveBeenLastCalledWith("a", { contenuto: "importante" });
    expect(coda.haModifiche).toBe(false);
  });

  it("due salvataggi falliti di fila non rimettono il testo più vecchio (RB-61)", async () => {
    salva.mockRejectedValueOnce(new Error("spento")).mockRejectedValueOnce(new Error("spento"));
    coda.modifica("a", { contenuto: "A" });
    const primo = coda.scarica();
    coda.modifica("a", { contenuto: "B" });
    const secondo = coda.scarica();
    await primo;
    await secondo;
    expect(coda.haModifiche).toBe(true);
    await coda.scarica();
    expect(salva).toHaveBeenLastCalledWith("a", { contenuto: "B" });
    expect(coda.haModifiche).toBe(false);
  });

  it("un salvataggio fallito prima di uno riuscito non sovrascrive il testo nuovo", async () => {
    salva.mockRejectedValueOnce(new Error("spento"));
    coda.modifica("a", { contenuto: "A" });
    const primo = coda.scarica();
    coda.modifica("a", { contenuto: "B" });
    await coda.scarica();
    await primo;
    expect(coda.haModifiche).toBe(false);
  });
});
