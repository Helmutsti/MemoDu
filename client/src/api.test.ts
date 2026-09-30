import { beforeEach, describe, expect, it, vi } from "vitest";
import { LIMITE_CORPO_BYTE } from "@memodu/condiviso";

const invoke = vi.hoisted(() => vi.fn());
vi.mock("@tauri-apps/api/core", () => ({ invoke }));

import { api, ErroreApi } from "./api";

beforeEach(() => {
  invoke.mockReset();
});

describe("comandi del nucleo (DEC-85)", () => {
  it("oltre 10 MB non chiama il nucleo e dà un errore 413 (EN-01, SF-17)", async () => {
    const contenuto = "x".repeat(LIMITE_CORPO_BYTE);
    await expect(api.salva("n1", { contenuto })).rejects.toMatchObject({ stato: 413 });
    await expect(api.salva("n1", { contenuto })).rejects.toBeInstanceOf(ErroreApi);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("chiama il comando con i suoi argomenti", async () => {
    invoke.mockResolvedValue({ id: "n1" });
    await api.salva("n1", { contenuto: "breve" });
    expect(invoke).toHaveBeenCalledWith("salva_nota", { id: "n1", nota: { contenuto: "breve" } });
  });

  it("gli errori del nucleo tengono codice, nome in conflitto ed elemento del cestino", async () => {
    invoke.mockImplementation(async () => {
      throw { stato: 409, messaggio: "Esiste già «Idee»", conflitto: "Idee" };
    });
    const conflitto = await errore(api.creaCartella("", "idee"));
    expect([conflitto.stato, conflitto.conflitto]).toEqual([409, "Idee"]);
    invoke.mockImplementation(async () => {
      throw { stato: 404, messaggio: "nel cestino", cestino: "n1" };
    });
    const cestino = await errore(api.leggi("n1"));
    expect([cestino.stato, cestino.cestino]).toEqual([404, "n1"]);
  });

  it("senza il nucleo (nel browser) l'archivio non risponde: stato null", async () => {
    invoke.mockImplementation(async () => {
      throw new Error("window.__TAURI_INTERNALS__ is undefined");
    });
    expect((await errore(api.elenca())).stato).toBeNull();
  });
});

/** L'errore con cui finisce la chiamata. */
async function errore(chiamata: Promise<unknown>): Promise<ErroreApi> {
  try {
    await chiamata;
  } catch (e) {
    expect(e).toBeInstanceOf(ErroreApi);
    return e as ErroreApi;
  }
  throw new Error("la chiamata non è fallita");
}
