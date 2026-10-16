// Il compartimento Brainet dell'editor (RF-18, architettura «Brainet», «Editor»), sopra la vista
// Markdown delle note di CLOUD (DEC-146): i segni si nascondono come i simboli del Markdown
// (anteprima.ts), e la scrittura come in Word (scrittura.ts) salta pillole e allegati come un
// carattere solo. Il collegamento
// diventa la pillola CMP-38 ed è un intervallo atomico, che Backspace toglie tutto (RB-104);
// l'area diventa il fondo CMP-40. Un allegato diventa la pillola Documento (CMP-38) o la Foto
// allegata (CMP-44), come blocco unico. Menu di @, menu dell'area, menu dell'allegato e Linguetta
// sono dell'interfaccia (EditorBrainet.tsx): qui si dice dove sono e si scrivono i segni.

import {
  EditorState,
  type Extension,
  RangeSetBuilder,
  StateEffect,
  StateField,
  type Transaction,
} from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { FileText, Image as IconaImmagine, type LucideIcon } from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Icona } from "../componenti/Icona";
import { atomiciScrittura } from "../editor/scrittura";
import { eFoto, type TipoAllegato } from "./api";
import {
  chiusureOrfane,
  leggiAllegati,
  leggiSegni,
  segniFinti,
  segnoAllegato,
  segnoApre,
  segnoChiude,
  segnoCita,
  testoSemplice,
  type AllegatoSegno,
  type FormaAllegato,
} from "./segni";

/** Quello che serve per disegnare una pillola. */
export interface VistaEntita {
  nome: string;
  /** JPEG in base64, se c'è. */
  foto: string | null;
}

/** Nomi e foto delle entità citate, che l'interfaccia legge dal nucleo. */
export const aggiornaEntita = StateEffect.define<Record<string, VistaEntita>>();
const entitaNote = StateField.define<Record<string, VistaEntita>>({
  create: () => ({}),
  update: (valore, tr) => {
    for (const e of tr.effects) if (e.is(aggiornaEntita)) valore = { ...valore, ...e.value };
    return valore;
  },
});

/** I colori degli stati: l'area prende quello del suo primo stato (CMP-40, scelta di Manuel Cucca
 *  del 16/10/2026); senza stati resta azzurra. */
export const aggiornaColoriStati = StateEffect.define<Record<string, string>>();
const coloriStati = StateField.define<Record<string, string>>({
  create: () => ({}),
  update: (valore, tr) => {
    for (const e of tr.effects) if (e.is(aggiornaColoriStati)) valore = e.value;
    return valore;
  },
});

/** Il colore di un'area: quello del suo primo stato che si conosce, se no «informazione». */
export function coloreArea(stati: string[], colori: Record<string, string>): string {
  for (const s of stati) if (colori[s]) return colori[s];
  return "informazione";
}

/** L'area con il mouse sopra (Stato = Mouse sopra di CMP-40). */
export const segnaAreaSopra = StateEffect.define<string | null>();
const areaSopra = StateField.define<string | null>({
  create: () => null,
  update: (valore, tr) => {
    for (const e of tr.effects) if (e.is(segnaAreaSopra)) valore = e.value;
    return valore;
  },
});

class Pillola extends WidgetType {
  constructor(
    readonly entita: string,
    readonly nome: string,
    readonly foto: string | null,
  ) {
    super();
  }
  eq(altra: Pillola): boolean {
    return altra.entita === this.entita && altra.nome === this.nome && altra.foto === this.foto;
  }
  /** Il clic arriva all'editor, che apre la pagina dell'entità (RB-124). */
  ignoreEvent(): boolean {
    return false;
  }
  toDOM(): HTMLElement {
    const el = document.createElement("span");
    el.dataset.entita = this.entita;
    el.className = `bn-collegamento interfaccia-dettaglio${this.foto ? " bn-collegamento-foto" : ""}`;
    if (this.foto) {
      const img = document.createElement("img");
      img.src = `data:image/jpeg;base64,${this.foto}`;
      img.alt = "";
      el.append(img);
    }
    el.append(this.nome);
    return el;
  }
}

/** Quello che serve per disegnare un allegato, letto dal nucleo. */
export interface VistaAllegato {
  tipo: TipoAllegato;
  /** L'anteprima di una foto (`data:`), o null se non è ancora sul computer. */
  anteprima: string | null;
}

/** Allegati letti dal nucleo; null vuol dire tolto altrove (SF-20). */
export const aggiornaAllegati = StateEffect.define<Record<string, VistaAllegato | null>>();
const allegatiNoti = StateField.define<Record<string, VistaAllegato | null>>({
  create: () => ({}),
  update: (valore, tr) => {
    for (const e of tr.effects) if (e.is(aggiornaAllegati)) valore = { ...valore, ...e.value };
    return valore;
  },
});

const NON_DISPONIBILE = "Allegato non più disponibile";
/** Le icone dentro l'editor sono DOM semplice: lo stesso disegno di CMP-02, una volta sola. */
const svg = new Map<LucideIcon, string>();
function iconaDom(di: LucideIcon): HTMLElement {
  if (!svg.has(di)) svg.set(di, renderToStaticMarkup(createElement(Icona, { di })));
  const el = document.createElement("span");
  el.className = "bn-allegato-icona";
  el.innerHTML = svg.get(di)!;
  return el;
}

class AllegatoWidget extends WidgetType {
  constructor(
    readonly id: string,
    readonly forma: FormaAllegato,
    readonly nome: string,
    /** undefined finché non si sa; null se è stato tolto altrove. */
    readonly vista: VistaAllegato | null | undefined,
  ) {
    super();
  }
  eq(altra: AllegatoWidget): boolean {
    return (
      altra.id === this.id &&
      altra.forma === this.forma &&
      altra.nome === this.nome &&
      altra.vista?.tipo === this.vista?.tipo &&
      altra.vista?.anteprima === this.vista?.anteprima &&
      (altra.vista === null) === (this.vista === null)
    );
  }
  toDOM(): HTMLElement {
    const foto = this.forma !== "documento";
    let el: HTMLElement;
    if (this.vista === null || !foto) {
      // CMP-38 Documento: l'icona e il nome; tolto altrove, il messaggio al posto del nome.
      el = document.createElement("span");
      el.className = "bn-collegamento bn-allegato-documento interfaccia-dettaglio";
      el.append(iconaDom(FileText), this.vista === null ? NON_DISPONIBILE : this.nome);
    } else if (this.vista?.anteprima) {
      const img = document.createElement("img");
      img.src = this.vista.anteprima;
      img.alt = this.nome;
      img.className = `bn-foto bn-foto-${this.forma}`;
      el = img;
    } else if (this.forma === "bolla") {
      el = document.createElement("span");
      el.className = "bn-foto bn-foto-bolla bn-foto-vuota";
    } else {
      // CMP-44 Non scaricata: il riquadro con l'icona e il nome (RB-118).
      el = document.createElement("span");
      el.className = "bn-foto bn-foto-non-scaricata interfaccia-dettaglio";
      el.append(iconaDom(IconaImmagine), this.nome);
    }
    el.dataset.allegato = this.id;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", this.nome);
    return el;
  }
  /** Il clic arriva all'editor, che apre il menu dell'allegato. */
  ignoreEvent(): boolean {
    return false;
  }
}

class Minore extends WidgetType {
  eq(): boolean {
    return true;
  }
  toDOM(): HTMLElement {
    const el = document.createElement("span");
    el.textContent = "<";
    return el;
  }
}

/** Le decorazioni dei segni: pura sullo stato, così si prova senza il DOM. */
export function decorazioniBrainet(state: EditorState): {
  tutte: DecorationSet;
  atomiche: DecorationSet;
} {
  const testo = state.doc.toString();
  const { citazioni, aree } = leggiSegni(testo);
  const nomi = state.field(entitaNote, false) ?? {};
  const allegati = state.field(allegatiNoti, false) ?? {};
  const sopra = state.field(areaSopra, false) ?? null;
  const colori = state.field(coloriStati, false) ?? {};
  const tutti: { da: number; a: number; dec: Decoration; atomica: boolean }[] = [];
  for (const c of citazioni) {
    const e = nomi[c.entita];
    tutti.push({
      da: c.da,
      a: c.a,
      dec: Decoration.replace({
        widget: new Pillola(c.entita, e?.nome ?? c.nome, e?.foto ?? null),
      }),
      atomica: true,
    });
  }
  for (const s of leggiAllegati(testo)) {
    tutti.push({
      da: s.da,
      a: s.a,
      dec: Decoration.replace({
        widget: new AllegatoWidget(s.id, s.forma, s.nome, allegati[s.id]),
      }),
      atomica: true,
    });
  }
  for (const area of aree) {
    const fine = area.chiude?.da ?? testo.length;
    tutti.push({ da: area.apre.da, a: area.apre.a, dec: Decoration.replace({}), atomica: true });
    if (fine > area.apre.a) {
      const colore = coloreArea(area.stati, colori);
      const classe = `bn-area bn-area-${colore}${sopra === area.id ? " bn-area-sopra" : ""}`;
      tutti.push({
        da: area.apre.a,
        a: fine,
        dec: Decoration.mark({ class: classe, attributes: { "data-area": area.id } }),
        atomica: false,
      });
    }
    if (area.chiude)
      tutti.push({
        da: area.chiude.da,
        a: area.chiude.a,
        dec: Decoration.replace({}),
        atomica: true,
      });
  }
  for (const m of testo.matchAll(/&lt;(?=\/?(?:cita|area|allegato)\b)/g)) {
    tutti.push({
      da: m.index,
      a: m.index + 4,
      dec: Decoration.replace({ widget: new Minore() }),
      atomica: true,
    });
  }
  tutti.sort((x, y) => x.da - y.da || x.dec.startSide - y.dec.startSide || x.a - y.a);
  const builder = new RangeSetBuilder<Decoration>();
  const atomiche = new RangeSetBuilder<Decoration>();
  for (const d of tutti) {
    builder.add(d.da, d.a, d.dec);
    if (d.atomica) atomiche.add(d.da, d.a, d.dec);
  }
  return { tutte: builder.finish(), atomiche: atomiche.finish() };
}

const pluginBrainet = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    atomiche: DecorationSet;
    constructor(view: EditorView) {
      ({ tutte: this.decorations, atomiche: this.atomiche } = decorazioniBrainet(view.state));
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.transactions.some((t) => t.effects.length)) {
        ({ tutte: this.decorations, atomiche: this.atomiche } = decorazioniBrainet(u.state));
      }
    }
  },
  { decorations: (p) => p.decorations },
);

/**
 * Un `<cita` o un `<area` scritto o incollato dall'utente non diventa mai un segno: il suo `<`
 * diventa `&lt;` (architettura «Brainet»). I segni veri li scrivono solo i comandi qui sotto.
 */
function trovaFinti(tr: Transaction): { from: number; to: number; insert: string }[] {
  if (
    !tr.docChanged ||
    !(tr.isUserEvent("input") || tr.isUserEvent("paste") || tr.isUserEvent("drop"))
  )
    return [];
  const testo = tr.newDoc.toString();
  // I segni veri che c'erano prima del cambio, al loro posto dopo: non si toccano mai.
  const prima = leggiSegni(tr.startState.doc.toString());
  const veri = new Set(
    [
      ...prima.citazioni.map((c) => c.da),
      ...prima.aree.flatMap((a) => [a.apre.da, ...(a.chiude ? [a.chiude.da] : [])]),
      ...leggiAllegati(tr.startState.doc.toString()).map((s) => s.da),
    ].map((p) => tr.changes.mapPos(p, 1)),
  );
  const posizioni = new Set<number>();
  tr.changes.iterChangedRanges((_fa, _ta, daB, aB) => {
    const inizio = Math.max(0, daB - 6);
    const fine = Math.min(testo.length, aB + 6);
    for (const p of segniFinti(testo.slice(inizio, fine))) {
      const pos = inizio + p;
      // Solo i `<` che il cambio ha toccato: i segni veri accanto restano.
      if (pos + 5 >= daB && pos <= aB && !veri.has(pos)) posizioni.add(pos);
    }
  });
  return [...posizioni].sort((x, y) => x - y).map((p) => ({ from: p, to: p + 1, insert: "&lt;" }));
}

const statoFiltro = EditorState.transactionFilter.of((tr) => {
  const finti = trovaFinti(tr);
  if (!finti.length) return tr;
  return [tr, { changes: finti, sequential: true }];
});

/**
 * Un'area è sempre legata a qualcosa (RB-107): se un cambio del testo le toglie l'ultimo legame
 * (per esempio Backspace sulla sua sola pillola), l'area sparisce e resta la frase (RB-109).
 * Sparisce anche un'area rimasta senza testo, o a metà perché un pezzo di testo cancellato si è
 * portato via la sua apertura o la sua chiusura: altrimenti i suoi segni, invisibili, non si
 * toglierebbero più (prove a mano del 16/10/2026). Nella stessa transazione, così Ctrl+Z rimette
 * tutto insieme.
 */
const areeSenzaLegami = EditorState.transactionFilter.of((tr) => {
  if (!tr.docChanged) return tr;
  const testo = tr.newDoc.toString();
  const { citazioni, aree } = leggiSegni(testo);
  const vuote = aree.filter((a) => {
    if (!a.chiude || a.chiude.da <= a.apre.a) return true;
    const fine = a.chiude.da;
    return (
      !a.stati.length && !a.entita.length && !citazioni.some((c) => c.da >= a.apre.a && c.a <= fine)
    );
  });
  const orfane = chiusureOrfane(testo);
  if (!vuote.length && !orfane.length) return tr;
  const via = [...vuote.flatMap((a) => [a.apre, ...(a.chiude ? [a.chiude] : [])]), ...orfane]
    .sort((x, y) => x.da - y.da)
    .map((t) => ({ from: t.da, to: t.a }));
  return [tr, { changes: via, sequential: true }];
});

/** Per la scrittura come in Word: pillole, allegati e `&lt;` sono blocchi, i segni delle aree nascosti. */
function atomiciBrainet(state: EditorState) {
  const testo = state.doc.toString();
  const { citazioni, aree } = leggiSegni(testo);
  const blocchi = [
    ...citazioni,
    ...leggiAllegati(testo),
    ...[...testo.matchAll(/&lt;(?=\/?(?:cita|area|allegato)\b)/g)].map((m) => ({
      da: m.index,
      a: m.index + 4,
    })),
  ].map((t) => ({ da: t.da, a: t.a }));
  const nascosti = aree.flatMap((a) => [a.apre, ...(a.chiude ? [a.chiude] : [])]);
  return { blocchi, nascosti };
}

/** Copiando si porta via il testo che si legge, senza segni. */
const copiaSenzaSegni = EditorView.clipboardOutputFilter.of((testo) => testoSemplice(testo));

/** Chi ascolta l'editor: dove si scrive @, la selezione, l'area sotto il mouse. */
export interface Ascolto {
  /** @ seguita dalle lettere scritte fin qui, oppure null. */
  onChiocciola: (
    q: { da: number; testo: string; x: number; y: number; sopra: number } | null,
  ) => void;
  /** Frase selezionata per un'area nuova, oppure null. */
  onSelezione: (s: { da: number; a: number; x: number; y: number; sopra: number } | null) => void;
  /** L'area sotto il mouse, con il rettangolo dove inizia, oppure null. */
  onAreaSopra: (a: { id: string; x: number; y: number } | null) => void;
  /** Clic su un allegato: il suo segno e dove aprire il menu (RB-119). */
  onAllegato: (a: AllegatoSegno & { x: number; y: number; sopra: number }) => void;
  /** Clic su una pillola: true se apre la pagina dell'entità (RB-124). */
  onPillola?: (entita: string) => boolean;
}

/** File incollati nel testo (RB-114): l'evento sul DOM dell'editor, con il punto in cui entrano. */
export const EVENTO_FILE = "bn-file";
export interface FileIncollati {
  file: File[];
  da: number;
  a: number;
}

/**
 * @ e il nome che si sta scrivendo: fino a tre parole, separate da uno spazio, senza punteggiatura
 * («Luca Bianchi»); alla quarta parola o a un segno di punteggiatura il menu si chiude, così non
 * resta aperto mentre si continua la frase.
 */
const CHIOCCIOLA = /(?:^|\s)@((?:[^\s@<>.,;:!?()"«»]+ ?){0,3})$/;
/** Il nome più lungo che il menu segue. */
const LUNGHEZZA_DOMANDA = 40;
/** Tra il testo e il menu che si apre sotto (spazio-elemento, come in CMP-09). */
const DISTANZA = 4;

/** Dove sta un punto del testo; senza impaginazione (prove) l'angolo dell'editor. */
function coordinate(view: EditorView, pos: number): { left: number; top: number; bottom: number } {
  return view.coordsAtPos(pos) ?? view.contentDOM.getBoundingClientRect();
}

/** Le estensioni di Brainet, con chi le ascolta. */
export function estensioneBrainet(ascolto: Ascolto): Extension {
  let ultimaArea: string | null = null;
  return [
    entitaNote,
    allegatiNoti,
    coloriStati,
    areaSopra,
    pluginBrainet,
    EditorView.atomicRanges.of((view) => view.plugin(pluginBrainet)?.atomiche ?? Decoration.none),
    statoFiltro,
    areeSenzaLegami,
    copiaSenzaSegni,
    atomiciScrittura.of(atomiciBrainet),
    EditorView.updateListener.of((u) => {
      if (!(u.docChanged || u.selectionSet || u.focusChanged)) return;
      const sel = u.state.selection.main;
      const a = ascolto;
      if (sel.empty && u.view.hasFocus) {
        const riga = u.state.doc.lineAt(sel.head);
        const prima = riga.text.slice(0, sel.head - riga.from);
        const m = CHIOCCIOLA.exec(prima);
        if (m && m[1].length <= LUNGHEZZA_DOMANDA) {
          const da = sel.head - m[1].length - 1;
          const r = coordinate(u.view, da);
          a.onChiocciola({ da, testo: m[1], x: r.left, y: r.bottom + DISTANZA, sopra: r.top });
        } else a.onChiocciola(null);
      } else a.onChiocciola(null);
      if (!sel.empty && testoSemplice(u.state.sliceDoc(sel.from, sel.to)).trim()) {
        const r = coordinate(u.view, sel.from);
        const f = coordinate(u.view, sel.to);
        a.onSelezione({ da: sel.from, a: sel.to, x: r.left, y: f.bottom + DISTANZA, sopra: r.top });
      } else a.onSelezione(null);
    }),
    EditorView.domEventHandlers({
      mousedown: (e, view) => {
        const pillola = (e.target as Element).closest?.("[data-entita]");
        if (pillola && e.button === 0) {
          const entita = pillola.getAttribute("data-entita")!;
          if (ascolto.onPillola?.(entita)) {
            e.preventDefault();
            return true;
          }
          return false;
        }
        const el = (e.target as Element).closest?.("[data-allegato]");
        if (!el || e.button !== 0) return false;
        const pos = view.posAtDOM(el);
        const segno = leggiAllegati(view.state.doc.toString()).find(
          (s) => s.da <= pos && pos < s.a,
        );
        if (!segno) return false;
        const r = el.getBoundingClientRect();
        ascolto.onAllegato({ ...segno, x: r.left, y: r.bottom + DISTANZA, sopra: r.top });
        return true;
      },
      paste: (e, view) => {
        const file = [...(e.clipboardData?.files ?? [])];
        if (!file.length) return false;
        const sel = view.state.selection.main;
        const detail: FileIncollati = { file, da: sel.from, a: sel.to };
        view.dom.dispatchEvent(new CustomEvent(EVENTO_FILE, { detail }));
        return true;
      },
      mousemove: (e, view) => {
        const el = (e.target as Element).closest?.("[data-area]");
        const id = el?.getAttribute("data-area") ?? null;
        if (id === ultimaArea) return false;
        ultimaArea = id;
        view.dispatch({ effects: segnaAreaSopra.of(id) });
        if (!id) {
          ascolto.onAreaSopra(null);
          return false;
        }
        // La linguetta sta sopra l'inizio dell'area.
        const primo = view.contentDOM.querySelector(`[data-area="${CSS.escape(id)}"]`);
        const r = primo?.getBoundingClientRect();
        ascolto.onAreaSopra(r ? { id, x: r.left, y: r.top } : null);
        return false;
      },
      mouseleave: (_e, view) => {
        if (ultimaArea === null) return false;
        ultimaArea = null;
        view.dispatch({ effects: segnaAreaSopra.of(null) });
        ascolto.onAreaSopra(null);
        return false;
      },
    }),
  ];
}

// ——— Comandi: scrivono i segni ———

/** Al posto di «@lettere» la pillola dell'entità, e uno spazio per continuare (RB-104). */
export function inserisciCitazione(
  view: EditorView,
  da: number,
  entita: { id: string; nome: string },
): void {
  const a = view.state.selection.main.head;
  const segno = segnoCita(entita);
  view.dispatch({
    changes: { from: da, to: a, insert: `${segno} ` },
    selection: { anchor: da + segno.length + 1 },
    effects: aggiornaEntita.of({ [entita.id]: { nome: entita.nome, foto: null } }),
    userEvent: "brainet.cita",
  });
  view.focus();
}

/** Un'area nuova sulla frase selezionata, con gli stati e le entità scelti (RB-107). */
export function creaArea(
  view: EditorView,
  da: number,
  a: number,
  stati: string[],
  entita: string[],
): string {
  const id = crypto.randomUUID();
  view.dispatch({
    changes: [
      { from: da, insert: segnoApre(id, stati, entita) },
      { from: a, insert: segnoChiude(id) },
    ],
    userEvent: "brainet.area",
  });
  return id;
}

/**
 * Riscrive i legami dell'area; senza più legami (né scritti né citati dentro) l'area sparisce e
 * resta la frase (RB-109). Restituisce false se l'area non c'è più.
 */
export function aggiornaArea(
  view: EditorView,
  id: string,
  stati: string[],
  entita: string[],
): boolean {
  const testo = view.state.doc.toString();
  const { citazioni, aree } = leggiSegni(testo);
  const area = aree.find((x) => x.id === id);
  if (!area) return false;
  const fine = area.chiude?.da ?? testo.length;
  const citate = citazioni.some((c) => c.da >= area.apre.a && c.a <= fine);
  if (!stati.length && !entita.length && !citate) {
    view.dispatch({
      changes: [
        { from: area.apre.da, to: area.apre.a },
        ...(area.chiude ? [{ from: area.chiude.da, to: area.chiude.a }] : []),
      ],
      userEvent: "brainet.area",
    });
    return false;
  }
  view.dispatch({
    changes: { from: area.apre.da, to: area.apre.a, insert: segnoApre(id, stati, entita) },
    userEvent: "brainet.area",
  });
  return true;
}

// ——— Allegati (RB-114 … RB-121) ———

/**
 * Mette l'allegato al posto di [da, a]. Un documento è una pillola seguita da uno spazio; una
 * foto dentro un paragrafo scritto è una bolla, altrimenti arriva piccola su una riga sua
 * (RB-116, RB-117). Restituisce dove finisce, per il prossimo file.
 */
export function inserisciAllegato(
  view: EditorView,
  da: number,
  a: number,
  allegato: { id: string; nome: string; tipo: TipoAllegato },
): number {
  const riga = view.state.doc.lineAt(da);
  const fuori = view.state.sliceDoc(riga.from, da) + view.state.sliceDoc(a, riga.to);
  let forma: FormaAllegato = "documento";
  if (eFoto(allegato.tipo)) forma = testoSemplice(fuori).trim() ? "bolla" : "piccola";
  const segno = segnoAllegato(allegato.id, forma, allegato.nome);
  const dopo = forma === "piccola" ? "\n" : " ";
  const fine = da + segno.length + dopo.length;
  view.dispatch({
    changes: { from: da, to: a, insert: segno + dopo },
    selection: { anchor: fine },
    effects: aggiornaAllegati.of({ [allegato.id]: { tipo: allegato.tipo, anteprima: null } }),
    userEvent: "brainet.allegato",
  });
  return fine;
}

/** Dimensioni › Piccola, Media, Grande: riscrive solo la forma (RB-120). */
export function cambiaForma(view: EditorView, segno: AllegatoSegno, forma: FormaAllegato): void {
  view.dispatch({
    changes: { from: segno.da, to: segno.a, insert: segnoAllegato(segno.id, forma, segno.nome) },
    userEvent: "brainet.allegato",
  });
}

/** Toglie l'allegato dalla nota; Ctrl+Z lo rimette (RB-121). Una foto su una riga sua porta
 * via anche il suo a capo. */
export function togliAllegato(view: EditorView, segno: AllegatoSegno): void {
  const suaRiga = !["documento", "bolla"].includes(segno.forma);
  const a = suaRiga && view.state.sliceDoc(segno.a, segno.a + 1) === "\n" ? segno.a + 1 : segno.a;
  view.dispatch({ changes: { from: segno.da, to: a }, userEvent: "brainet.allegato" });
  view.focus();
}
