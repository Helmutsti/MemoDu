// Barra di scorrimento discreta (DEC-58): quella del sistema è nascosta e non occupa spazio;
// al suo posto un cursore sottile sopra il contenuto, che compare mentre si scorre o con il
// mouse sull'area e sparisce poco dopo, come su macOS. Si può trascinare. Il cursore sta dentro
// l'area: si muove con lei quando la colonna si apre o si chiude e sparisce insieme a lei.
// L'area deve avere la classe SCORRIMENTO_DISCRETO nel suo className: aggiunta da qui, React la
// toglierebbe al primo cambio di classe e tornerebbe la barra del sistema, sotto questa.

import { useEffect, type RefObject } from "react";
import "./BarraScorrimento.css";

/** Dopo quanto sparisce, se non si scorre e il mouse non è sul cursore. */
const RITARDO_SCOMPARSA_MS = 800;
/** Distanza del cursore dai bordi dell'area e sua altezza minima. */
const MARGINE = 2;
const ALTEZZA_MINIMA = 24;

/** Classe che nasconde la barra del sistema, da mettere nel className dell'area. */
export const SCORRIMENTO_DISCRETO = "scorrimento-discreto";

export function useBarraScorrimento(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const area = ref.current;
    if (!area) return;
    const cursore = document.createElement("div");
    cursore.className = "barra-scorrimento";
    cursore.setAttribute("aria-hidden", "true");
    area.appendChild(cursore);

    let timer: ReturnType<typeof setTimeout> | undefined;
    let trascinamento: { y: number; scorrimento: number; passo: number } | null = null;
    let sopraIlCursore = false;

    /** Posizione e altezza del cursore; false se non c'è niente da scorrere. */
    const aggiorna = (): boolean => {
      const { scrollHeight, clientHeight, scrollTop } = area;
      if (scrollHeight <= clientHeight + 1) return false;
      const corsa = clientHeight - 2 * MARGINE;
      const altezza = Math.max(ALTEZZA_MINIMA, (corsa * clientHeight) / scrollHeight);
      const quanto = scrollTop / (scrollHeight - clientHeight);
      // Dentro l'area il cursore scorrerebbe con il contenuto: la sua posizione parte da quanto
      // si è scorso, così resta dentro la parte visibile.
      cursore.style.top = `${scrollTop + MARGINE + (corsa - altezza) * quanto}px`;
      cursore.style.height = `${altezza}px`;
      return true;
    };
    const nascondi = () => {
      if (trascinamento || sopraIlCursore) return;
      cursore.classList.remove("barra-scorrimento-visibile");
    };
    const mostra = () => {
      clearTimeout(timer);
      if (!aggiorna()) return cursore.classList.remove("barra-scorrimento-visibile");
      cursore.classList.add("barra-scorrimento-visibile");
      timer = setTimeout(nascondi, RITARDO_SCOMPARSA_MS);
    };

    const suPressione = (e: PointerEvent) => {
      const corsa = area.clientHeight - 2 * MARGINE - cursore.offsetHeight;
      trascinamento = {
        y: e.clientY,
        scorrimento: area.scrollTop,
        passo: corsa > 0 ? (area.scrollHeight - area.clientHeight) / corsa : 0,
      };
      cursore.setPointerCapture(e.pointerId);
      cursore.classList.add("barra-scorrimento-trascinata");
      e.preventDefault();
    };
    const suMovimento = (e: PointerEvent) => {
      if (!trascinamento) return;
      area.scrollTop =
        trascinamento.scorrimento + (e.clientY - trascinamento.y) * trascinamento.passo;
    };
    const suRilascio = () => {
      trascinamento = null;
      cursore.classList.remove("barra-scorrimento-trascinata");
      mostra();
    };
    const entra = () => {
      sopraIlCursore = true;
      mostra();
    };
    const esce = () => {
      sopraIlCursore = false;
      mostra();
    };

    area.addEventListener("scroll", mostra, { passive: true });
    area.addEventListener("mousemove", mostra);
    cursore.addEventListener("pointerdown", suPressione);
    cursore.addEventListener("pointermove", suMovimento);
    cursore.addEventListener("pointerup", suRilascio);
    cursore.addEventListener("mouseenter", entra);
    cursore.addEventListener("mouseleave", esce);
    return () => {
      clearTimeout(timer);
      area.removeEventListener("scroll", mostra);
      area.removeEventListener("mousemove", mostra);
      cursore.remove();
    };
  }, [ref]);
}
