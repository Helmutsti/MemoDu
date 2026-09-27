// Chiamate all'API delle note (docs/architettura/api.md). L'app non salva niente da sé:
// per il frammento Must A le note passano tutte dall'API (DEC-30).

import { INDIRIZZO_API, type DatiNota, type Nota, type VoceElenco } from "@memodu/condiviso";

/** L'API non risponde o risponde con un errore: l'app mostra SC-07 (RB-61). */
export class ErroreApi extends Error {
  constructor(
    readonly stato: number | null,
    messaggio: string,
  ) {
    super(messaggio);
  }
}

async function chiama<T>(metodo: string, percorso: string, corpo?: DatiNota): Promise<T> {
  let risposta: Response;
  try {
    risposta = await fetch(INDIRIZZO_API + percorso, {
      method: metodo,
      headers: corpo ? { "Content-Type": "application/json" } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroreApi(null, "L'API non risponde");
  }
  if (!risposta.ok) throw new ErroreApi(risposta.status, `L'API ha risposto ${risposta.status}`);
  return (await risposta.json()) as T;
}

export const api = {
  elenca: () => chiama<VoceElenco[]>("GET", "/note"),
  leggi: (id: string) => chiama<Nota>("GET", `/note/${id}`),
  crea: (dati: DatiNota = {}) => chiama<Nota>("POST", "/note", dati),
  salva: (id: string, dati: DatiNota) => chiama<Nota>("PUT", `/note/${id}`, dati),
};
