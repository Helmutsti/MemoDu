// Chiusura della finestra, nell'app (Tauri) e nel browser usato per lo sviluppo.
// Serve a RB-62: con testo non salvato, prima di chiudere si chiede conferma.

import { getCurrentWindow } from "@tauri-apps/api/window";

const IN_TAURI = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/**
 * Registra cosa fare quando si chiude la finestra. `puoChiudere` salva quello che può e
 * risponde se la finestra si può chiudere; se no, la chiusura si ferma e l'app mostra la
 * conferma. `nonSalvato` dice subito se c'è testo non salvato (serve al browser, che non
 * aspetta). Restituisce la funzione che toglie la registrazione.
 */
export function alChiudere(
  puoChiudere: () => Promise<boolean>,
  nonSalvato: () => boolean,
): () => void {
  if (IN_TAURI) {
    const promessa = getCurrentWindow().onCloseRequested(async (evento) => {
      if (!(await puoChiudere())) evento.preventDefault();
    });
    return () => void promessa.then((togli) => togli());
  }
  // Nel browser usato per lo sviluppo la conferma è quella del browser.
  const suUscita = (evento: BeforeUnloadEvent) => {
    void puoChiudere();
    if (nonSalvato()) evento.preventDefault();
  };
  window.addEventListener("beforeunload", suUscita);
  return () => window.removeEventListener("beforeunload", suUscita);
}

/** "Chiudi comunque": chiude senza chiedere più niente. */
export async function chiudiFinestra(): Promise<void> {
  if (IN_TAURI) await getCurrentWindow().destroy();
  else window.close();
}
