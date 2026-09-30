// CMP-09 Menu con le voci CMP-07. Livello 20, su sfondo-flottante con ombra.
// Il menu non prende il focus: mentre è aperto intercetta frecce, Invio ed Esc, così
// il cursore resta nel testo (menu "/") e il tasto destro non sposta la selezione.
// Si chiude al clic fuori, con Esc o quando il contenuto sotto scorre (4-schermate.md).

import { Check, ChevronRight } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import { Icona } from "./Icona";
import "./Menu.css";

export type VoceMenu =
  | {
      tipo: "voce";
      etichetta: string;
      icona?: LucideIcon;
      scorciatoia?: string;
      azione?: () => void;
      sottomenu?: VoceMenu[];
      /** Azione che toglie qualcosa (Elimina): testo e icona di errore (CMP-07). */
      errore?: boolean;
      /** Tasto destro sulla voce (per esempio «Elimina tag…» su un suggerimento). */
      alTastoDestro?: (x: number, y: number) => void;
      /** Scelta attiva di un filtro: la spunta a destra (filtri della ricerca, CMP-13). */
      spunta?: boolean;
      /** Dopo la scelta il menu resta aperto (filtro Tag: si scelgono più tag). */
      restaAperto?: boolean;
    }
  | { tipo: "separatore" };

interface Proprieta {
  voci: VoceMenu[];
  /** Punto in cui si apre, in coordinate della finestra. */
  x: number;
  y: number;
  etichetta: string;
  /** Chiude questo menu (Esc, freccia sinistra nel sottomenu, clic fuori). */
  onChiudi: () => void;
  /** Dopo una scelta: chiude tutti i menu aperti. Di default, onChiudi. */
  onFine?: () => void;
  /** Sottomenu: i tasti li gestisce lui finché è aperto. */
  annidato?: boolean;
  /** Bordo superiore del controllo che lo apre: se sotto non c'è spazio, si apre sopra. */
  sopra?: number;
  /** Aperto da dentro un overlay (finestra Dettagli): sta sopra di lui e si chiude con lui. */
  sopraOverlay?: boolean;
  /** Voce evidenziata all'apertura (suggerimenti: Invio sceglie subito la prima). */
  attivaIniziale?: number;
  /** Un altro menu è aperto sopra questo: tasti e clic fuori li gestisce l'altro. */
  inPausa?: boolean;
  /** Menu «/» mentre si scrive: Invio senza voce evidenziata chiude e va a capo. */
  invioAlTesto?: boolean;
  /** In cima, sopra le voci: il campo «Cerca un tag» del filtro Tag (CMP-09). */
  testata?: ReactNode;
}

interface Sottomenu {
  indice: number;
  x: number;
  y: number;
}

const MARGINE_FINESTRA = 8;
/** Tra il controllo che apre il menu e il menu (spazio-elemento). */
const DISTANZA_ANCORA = 4;

export function Menu({
  voci,
  x,
  y,
  etichetta,
  onChiudi,
  onFine = onChiudi,
  annidato = false,
  sopra,
  sopraOverlay = false,
  attivaIniziale = -1,
  inPausa = false,
  invioAlTesto = false,
  testata,
}: Proprieta): ReactElement {
  const elemento = useRef<HTMLDivElement>(null);
  const [posizione, setPosizione] = useState({ x, y });
  // Le voci cambiano mentre si scrive (suggerimenti): l'evidenziata torna quella iniziale.
  const firmaVoci = voci.map((v) => (v.tipo === "voce" ? v.etichetta : "|")).join("/");
  const [scelta, setScelta] = useState({ firma: firmaVoci, indice: attivaIniziale });
  const attiva = scelta.firma === firmaVoci ? scelta.indice : attivaIniziale;
  const setAttiva = (indice: number) => setScelta({ firma: firmaVoci, indice });
  const [sottomenu, setSottomenu] = useState<Sottomenu | null>(null);
  const scelte = voci.map((v, i) => (v.tipo === "voce" ? i : -1)).filter((i) => i >= 0);

  // Se esce dalla finestra, si sposta dentro (a sinistra o in alto).
  useLayoutEffect(() => {
    const r = elemento.current?.getBoundingClientRect();
    if (!r) return;
    const fuori = y + r.height > window.innerHeight - MARGINE_FINESTRA;
    if (sopra !== undefined && fuori) {
      setPosizione({
        x: Math.max(MARGINE_FINESTRA, Math.min(x, window.innerWidth - r.width - MARGINE_FINESTRA)),
        y: Math.max(MARGINE_FINESTRA, sopra - DISTANZA_ANCORA - r.height),
      });
      return;
    }
    setPosizione({
      x: Math.max(MARGINE_FINESTRA, Math.min(x, window.innerWidth - r.width - MARGINE_FINESTRA)),
      y: Math.max(MARGINE_FINESTRA, Math.min(y, window.innerHeight - r.height - MARGINE_FINESTRA)),
    });
  }, [x, y, sopra]);

  const apriSottomenu = (i: number) => {
    // Le voci, senza la testata: gli indici sono quelli di `voci`.
    const righe = elemento.current?.querySelectorAll(
      ":scope > .voce-menu, :scope > .menu-separatore",
    );
    const r = righe?.[i]?.getBoundingClientRect();
    if (r) setSottomenu({ indice: i, x: r.right, y: r.top - 8 });
  };

  const esegui = (i: number) => {
    const voce = voci[i];
    if (voce?.tipo !== "voce") return;
    if (voce.sottomenu) {
      apriSottomenu(i);
      return;
    }
    voce.azione?.();
    if (!voce.restaAperto) onFine();
  };

  useEffect(() => {
    if (inPausa) return;
    const suTasto = (e: KeyboardEvent) => {
      if (sottomenu !== null) return;
      const passo = (d: number) => {
        const pos = scelte.indexOf(attiva);
        setAttiva(scelte[(pos + d + scelte.length) % scelte.length]);
      };
      // Menu «/»: Invio senza voce evidenziata chiude il menu e va a capo nel testo.
      if (invioAlTesto && e.key === "Enter" && attiva < 0) {
        onChiudi();
        return;
      }
      const gestito: Record<string, () => void> = {
        ArrowDown: () => passo(1),
        ArrowUp: () => passo(attiva < 0 ? 0 : -1),
        Enter: () => (attiva >= 0 ? esegui(attiva) : onChiudi()),
        ArrowRight: () => attiva >= 0 && voci[attiva]?.tipo === "voce" && esegui(attiva),
        ArrowLeft: () => annidato && onChiudi(),
        Escape: onChiudi,
      };
      const azione = gestito[e.key];
      if (!azione) return;
      e.preventDefault();
      e.stopPropagation();
      azione();
    };
    const suClic = (e: MouseEvent) => {
      if (!(e.target as Element).closest?.(".menu")) onChiudi();
    };
    const suScorrimento = (e: Event) => {
      if (!(e.target as Element).closest?.(".menu")) onChiudi();
    };
    window.addEventListener("keydown", suTasto, true);
    if (!annidato) {
      window.addEventListener("mousedown", suClic, true);
      window.addEventListener("scroll", suScorrimento, true);
    }
    return () => {
      window.removeEventListener("keydown", suTasto, true);
      window.removeEventListener("mousedown", suClic, true);
      window.removeEventListener("scroll", suScorrimento, true);
    };
  });

  const voceAperta = sottomenu ? voci[sottomenu.indice] : undefined;

  return createPortal(
    <div
      ref={elemento}
      className="menu"
      role="menu"
      aria-label={etichetta}
      style={{
        left: posizione.x,
        top: posizione.y,
        ...(sopraOverlay ? { zIndex: "var(--z-overlay)" } : {}),
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {testata && (
        // Il campo della testata prende il focus: il menu non glielo toglie.
        <div className="menu-testata" onMouseDown={(e) => e.stopPropagation()}>
          {testata}
        </div>
      )}
      {voci.map((voce, i) =>
        voce.tipo === "separatore" ? (
          <div key={i} className="menu-separatore" role="separator" />
        ) : (
          <div
            key={i}
            role={voce.spunta === undefined ? "menuitem" : "menuitemcheckbox"}
            aria-checked={voce.spunta}
            aria-haspopup={voce.sottomenu ? "menu" : undefined}
            className={`voce-menu ${i === attiva ? "voce-menu-evidenziata" : ""} ${voce.errore ? "voce-menu-errore" : ""}`}
            onMouseEnter={() => {
              setAttiva(i);
              if (voce.sottomenu) apriSottomenu(i);
              else setSottomenu(null);
            }}
            onClick={() => esegui(i)}
            onContextMenu={
              voce.alTastoDestro
                ? (e) => {
                    e.preventDefault();
                    setAttiva(i);
                    voce.alTastoDestro?.(e.clientX, e.clientY);
                  }
                : undefined
            }
          >
            <span className="voce-menu-riga interfaccia-controllo">
              {voce.icona && (
                <span className="voce-menu-icona">
                  <Icona di={voce.icona} />
                </span>
              )}
              <span className="voce-menu-etichetta">{voce.etichetta}</span>
              {voce.scorciatoia && (
                <span className="voce-menu-scorciatoia interfaccia-dettaglio">
                  {voce.scorciatoia}
                </span>
              )}
              {voce.sottomenu && (
                <span className="voce-menu-icona">
                  <Icona di={ChevronRight} />
                </span>
              )}
              {voce.spunta && (
                <span className="voce-menu-icona" aria-hidden="true">
                  <Icona di={Check} />
                </span>
              )}
            </span>
          </div>
        ),
      )}
      {sottomenu && voceAperta?.tipo === "voce" && voceAperta.sottomenu && (
        <Menu
          annidato
          voci={voceAperta.sottomenu}
          etichetta={voceAperta.etichetta}
          x={sottomenu.x}
          y={sottomenu.y}
          onChiudi={() => setSottomenu(null)}
          onFine={onFine}
        />
      )}
    </div>,
    document.body,
  );
}
