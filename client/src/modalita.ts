// Come ci si muove nell'app (DEC-74): con Tab e le frecce fuori dal testo la radice riceve
// data-tastiera e gli anelli del focus si vedono; un clic o un tocco li spegne. Così un clic su
// un campo, o il focus spostato dal codice dopo un'azione con il mouse, non accende l'anello.

const TASTI_DI_NAVIGAZIONE = new Set([
  "Tab",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

/** Nel testo le frecce muovono il cursore e Tab scrive una tabulazione: non si naviga. */
function nelTesto(elemento: EventTarget | null): boolean {
  if (!(elemento instanceof HTMLElement)) return false;
  if (
    elemento.isContentEditable ||
    elemento.closest('[contenteditable]:not([contenteditable="false"])')
  )
    return true;
  return elemento instanceof HTMLTextAreaElement;
}

export function seguiModalita(documento: Document = document): () => void {
  const radice = documento.documentElement;
  const suTasto = (e: KeyboardEvent) => {
    if (!TASTI_DI_NAVIGAZIONE.has(e.key)) return;
    const campo = e.target instanceof HTMLInputElement;
    // In un campo di una riga le frecce muovono il cursore; Tab invece passa oltre.
    if (nelTesto(e.target) || (campo && e.key !== "Tab")) return;
    radice.dataset.tastiera = "";
  };
  const suPuntatore = () => {
    delete radice.dataset.tastiera;
  };
  documento.addEventListener("keydown", suTasto, true);
  documento.addEventListener("pointerdown", suPuntatore, true);
  return () => {
    documento.removeEventListener("keydown", suTasto, true);
    documento.removeEventListener("pointerdown", suPuntatore, true);
  };
}
