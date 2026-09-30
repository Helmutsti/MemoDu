// Finestre dell'app (Tauri) e del browser usato per lo sviluppo: chiusura con conferma
// (RB-62), finestra principale che resta in background (RF-01), note rapide (SC-02).

import { invoke } from "@tauri-apps/api/core";
import { emitTo, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";

export const IN_TAURI = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** Su macOS i pulsanti della finestra sono i tre pallini del sistema, su una barra trasparente. */
export const SU_MAC = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);

/** Nell'app su Windows la finestra non ha cornice: i pulsanti _ [] X li disegna Memodu (DEC-55). */
export const PULSANTI_FINESTRA = IN_TAURI && !SU_MAC;

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

/** Chiude una nota rapida; la finestra principale aggiorna la colonna, dove la nota è nuova. */
export async function chiudiNotaRapida(): Promise<void> {
  if (IN_TAURI) {
    await emitTo("main", "nota-rapida-chiusa");
    await getCurrentWindow().destroy();
  } else window.close();
}

/** Nella finestra principale: quando una nota rapida si chiude. */
export function allaChiusuraDiUnaNotaRapida(aggiorna: () => void): () => void {
  if (!IN_TAURI) return () => {};
  const promessa = listen("nota-rapida-chiusa", () => aggiorna());
  return () => void promessa.then((togli) => togli());
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
 * Chiusura della finestra dal sistema (Alt + F4, Cmd + W): la nota rapida la tratta come
 * Chiudi, cioè salva e chiude, o chiede conferma (RB-02, RB-62).
 */
export function allaRichiestaDiChiusura(gestore: () => void): () => void {
  if (!IN_TAURI) return () => {};
  const promessa = getCurrentWindow().onCloseRequested((evento) => {
    evento.preventDefault();
    gestore();
  });
  return () => void promessa.then((togli) => togli());
}

/**
 * «Esci da Memodu» dall'icona: `prepara` salva e risponde se la finestra può uscire. Se no,
 * la finestra mostra la conferma (RB-62) e poi chiama `confermaUscita` o `annullaUscita`.
 */
export function allUscita(prepara: () => Promise<boolean>): () => void {
  if (!IN_TAURI) return () => {};
  const promessa = listen("esci-richiesto", async () => {
    if (await prepara()) await confermaUscita();
  });
  return () => void promessa.then((togli) => togli());
}

/** Questa finestra è pronta: quando lo sono tutte, Memodu esce. */
export async function confermaUscita(): Promise<void> {
  if (IN_TAURI) await invoke("pronta_a_uscire");
}

/** Annulla nella conferma durante l'uscita: Memodu resta aperto. */
export async function annullaUscita(): Promise<void> {
  if (IN_TAURI) await invoke("uscita_annullata");
}

/** Mostra questa finestra in primo piano (la principale può essere nascosta). */
export async function mostraFinestra(): Promise<void> {
  if (!IN_TAURI) return;
  const finestra = getCurrentWindow();
  await finestra.unminimize();
  await finestra.show();
  await finestra.setFocus();
}

/** Pulsanti della finestra su Windows (DEC-55). Chiudi passa da alChiudere: si salva e si nasconde. */
export const finestraSistema = {
  riduci: async () => {
    if (IN_TAURI) await getCurrentWindow().minimize();
  },
  ingrandisci: async () => {
    if (IN_TAURI) await getCurrentWindow().toggleMaximize();
  },
  chiudi: async () => {
    if (IN_TAURI) await getCurrentWindow().close();
  },
};

/** Avvisa quando la finestra si ingrandisce o torna com'era (icona Ingrandisci o Ripristina). */
export function allIngrandimento(avvisa: (ingrandita: boolean) => void): () => void {
  if (!IN_TAURI) return () => {};
  const finestra = getCurrentWindow();
  const aggiorna = () => void finestra.isMaximized().then(avvisa);
  aggiorna();
  const promessa = finestra.onResized(aggiorna);
  return () => void promessa.then((togli) => togli());
}
