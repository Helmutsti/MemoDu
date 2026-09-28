// Finestre dell'app (Tauri) e del browser usato per lo sviluppo: chiusura con conferma
// (RB-62), finestra principale che resta in background (RF-01), note rapide (SC-02).

import { emit, emitTo, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

export const IN_TAURI = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** Questa finestra è una nota rapida? (index.html?rapida, aperta dal nucleo Rust) */
export const NOTA_RAPIDA = new URLSearchParams(window.location.search).has("rapida");

/**
 * Registra cosa fare quando si chiude la finestra. `puoChiudere` salva quello che può e
 * risponde se la finestra si può chiudere; se no, la chiusura si ferma e l'app mostra la
 * conferma. `nonSalvato` dice subito se c'è testo non salvato (serve al browser, che non
 * aspetta). Nell'app la finestra principale non si chiude ma si nasconde: Memodu resta
 * attivo in background per la nota rapida (RF-01). Restituisce la funzione che toglie la
 * registrazione.
 */
export function alChiudere(
  puoChiudere: () => Promise<boolean>,
  nonSalvato: () => boolean,
): () => void {
  if (IN_TAURI) {
    const promessa = getCurrentWindow().onCloseRequested(async (evento) => {
      evento.preventDefault();
      if (await puoChiudere()) await getCurrentWindow().hide();
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

/** "Chiudi comunque" dalla finestra principale: si nasconde e dimentica il testo non salvato. */
export async function chiudiFinestra(): Promise<void> {
  if (IN_TAURI) {
    await getCurrentWindow().hide();
    window.location.reload();
  } else {
    window.close();
  }
}

/** Chiude una nota rapida. */
export async function chiudiNotaRapida(): Promise<void> {
  if (IN_TAURI) await getCurrentWindow().destroy();
  else window.close();
}

/** "Apri nel programma" (RB-05): la finestra principale apre la nota `id` e si mostra. */
export async function apriNelProgramma(id: string | null): Promise<void> {
  if (IN_TAURI) await emitTo("main", "apri-nota", { id });
}

/** Nella finestra principale: quando una nota rapida chiede di aprire una nota. */
export function allaRichiestaDiApertura(apri: (id: string | null) => void): () => void {
  if (!IN_TAURI) return () => {};
  const promessa = listen<{ id: string | null }>("apri-nota", async (evento) => {
    const finestra = getCurrentWindow();
    await finestra.unminimize();
    await finestra.show();
    await finestra.setFocus();
    apri(evento.payload.id);
  });
  return () => void promessa.then((togli) => togli());
}

/**
 * In una nota rapida: il nucleo apre un'altra nota rapida (la scorciatoia premuta di nuovo)
 * o un'altra nota rapida prende il focus. In questi casi la perdita del focus non chiude.
 */
export function alleAltreNoteRapide(avviso: () => void): () => void {
  if (!IN_TAURI) return () => {};
  const promesse = [listen("nuova-rapida", avviso), listen("rapida-attiva", avviso)];
  return () => promesse.forEach((p) => void p.then((togli) => togli()));
}

/** Avvisa le altre note rapide che questa ha preso il focus. */
export async function annunciaFocus(): Promise<void> {
  if (IN_TAURI) await emit("rapida-attiva");
}
