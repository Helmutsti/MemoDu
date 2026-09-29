import { afterEach, describe, expect, it, vi } from "vitest";
import { LIMITE_CORPO_BYTE } from "@memodu/condiviso";
import { api, ErroreApi, LIMITE_KEEPALIVE_BYTE } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("chiamate all'API", () => {
  it("oltre 10 MB non chiama l'API e dà un errore 413 (EN-01, SF-17)", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const contenuto = "x".repeat(LIMITE_CORPO_BYTE);
    await expect(api.salva("n1", { contenuto })).rejects.toMatchObject({ stato: 413 });
    await expect(api.salva("n1", { contenuto })).rejects.toBeInstanceOf(ErroreApi);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sotto il limite chiama l'API", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "n1" })));
    vi.stubGlobal("fetch", fetch);
    await api.salva("n1", { contenuto: "breve" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("alla chiusura usa keepalive solo sotto il limite del browser (64 KB)", async () => {
    const fetch = vi
      .fn()
      .mockImplementation(async () => new Response(JSON.stringify({ id: "n1" })));
    vi.stubGlobal("fetch", fetch);
    await api.salva("n1", { contenuto: "breve" }, { keepalive: true });
    await api.salva(
      "n1",
      { contenuto: "x".repeat(LIMITE_KEEPALIVE_BYTE + 1) },
      { keepalive: true },
    );
    expect(fetch.mock.calls.map((c) => (c[1] as RequestInit).keepalive)).toEqual([true, false]);
  });
});
