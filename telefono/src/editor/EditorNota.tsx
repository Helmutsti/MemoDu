"use dom";

// CMP-20 Testo della nota sul telefono (DEC-162): lo stesso editor del computer (CodeMirror con
// la vista Markdown di DEC-130: simboli nascosti, scrittura come in Word), dentro un componente
// DOM di Expo. Sopra il testo il titolo della nota. Misure alla scala del telefono (DEC-161) in
// editor-nota.css; colori dai token del computer, chiaro e scuro come il sistema.

import "@fontsource-variable/inter";
import "../../../client/src/stili/token.css";
import "../../../client/src/brainet/brainet.css";
import "./editor-nota.css";
import { useDOMImperativeHandle, type DOMImperativeFactory } from "expo/dom";
import { useEffect, useRef, useState, type Ref } from "react";
import type { EditorView } from "@codemirror/view";
import type { VoceFormato } from "../../../client/src/componenti/Bollicina";
import {
  aggiornaArea,
  aggiornaColoriStati,
  aggiornaEntita,
  creaArea,
  estensioneBrainet,
  inserisciCitazione,
  type VistaEntita,
} from "../../../client/src/brainet/estensione";
import { leggiSegni, legamiArea } from "../../../client/src/brainet/segni";
import { Editor, type ManigliaEditor } from "../../../client/src/editor/Editor";
import type { FormatoDove } from "../../../client/src/editor/formati";

export interface ManigliaEditorNota extends DOMImperativeFactory {
  /** Una voce del cassetto (VoceFormato): sul ponte passano solo stringhe. */
  applica: (voce: unknown) => void;
  chiudiTastiera: () => void;
  /** Al posto di «@lettere» la pillola dell'entità (RB-104): id e nome. */
  cita: (id: unknown, nome: unknown) => void;
  /** Accende o spegne uno stato o un'entità dell'area dove si sta (RB-107, RB-109). */
  alterna: (tipo: unknown, id: unknown) => void;
}

/**
 * Brainet dove sta il cursore, per il telefono (passo 2): @ con le lettere scritte, e l'area su
 * cui si lavora, una nuova dalla frase selezionata o quella in cui sta il cursore, con i legami.
 */
export interface BrainetQui {
  chiocciola: string | null;
  area: {
    id: string | null;
    frase: string;
    stati: string[];
    entita: string[];
    citate: string[];
  } | null;
}

/** Il formato dove sta il cursore, in JSON per il ponte verso il telefono. */
export interface FormatoInJson {
  riga: FormatoDove["riga"];
  caratteri: string[];
}

export default function EditorNota({
  ref,
  titolo,
  contenuto,
  nuova,
  cursore,
  entita,
  coloriStati,
  onCambia,
  onPillola,
  onFormato,
  onScrive,
  onBrainet,
}: {
  ref?: Ref<ManigliaEditorNota>;
  titolo: string;
  contenuto: string;
  /** Nota appena creata: il cursore va nel titolo. */
  nuova: boolean;
  /** Dove mettere il cursore nel testo all'apertura (pagina dell'entità, RB-124). */
  cursore?: number;
  /** Nomi e foto delle entità, per le pillole (CMP-38). */
  entita: Record<string, VistaEntita>;
  /** I colori degli stati, per le aree (CMP-40). */
  coloriStati: Record<string, string>;
  /** Un tocco su una pillola apre la pagina dell'entità (RB-124). */
  onPillola: (entita: string) => Promise<void>;
  onCambia: (titolo: string, contenuto: string) => Promise<void>;
  onFormato: (formato: FormatoInJson | null) => Promise<void>;
  onScrive: (scrive: boolean) => Promise<void>;
  /** Cambia @ o l'area dove si sta (passo 2 di Brainet). */
  onBrainet: (qui: BrainetQui) => Promise<void>;
  dom?: import("expo/dom").DOMProps;
}) {
  const editor = useRef<ManigliaEditor>(null);
  const vista = useRef<EditorView | null>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const ultimo = useRef({ titolo, contenuto });
  const [testoTitolo, setTestoTitolo] = useState(titolo);
  const suPillola = useRef(onPillola);
  suPillola.current = onPillola;
  const suBrainet = useRef(onBrainet);
  suBrainet.current = onBrainet;
  /** Dove comincia «@lettere», e la frase selezionata per un'area nuova. */
  const chiocciola = useRef<number | null>(null);
  const selezione = useRef<{ da: number; a: number } | null>(null);
  const areaQui = useRef<string | null>(null);
  const ultimoInviato = useRef("");
  /** Dice al telefono @ e l'area dove si sta, solo quando cambiano. */
  const avvisa = (q: string | null) => {
    const v = vista.current;
    let area: BrainetQui["area"] = null;
    if (v) {
      const testo = v.state.doc.toString();
      const sel = selezione.current;
      if (sel) {
        area = {
          id: null,
          frase: v.state.sliceDoc(sel.da, sel.a),
          stati: [],
          entita: [],
          citate: [],
        };
      } else {
        const p = v.state.selection.main.head;
        const qui = leggiSegni(testo).aree.find(
          (x) => x.apre.a <= p && p <= (x.chiude?.da ?? testo.length),
        );
        areaQui.current = qui?.id ?? null;
        const legami = qui ? legamiArea(testo, qui.id) : null;
        if (qui && legami)
          area = {
            id: qui.id,
            frase: testo.slice(qui.apre.a, qui.chiude?.da ?? testo.length),
            ...legami,
          };
      }
    }
    const stato: BrainetQui = { chiocciola: q, area };
    const json = JSON.stringify(stato);
    if (json === ultimoInviato.current) return;
    ultimoInviato.current = json;
    void suBrainet.current(stato);
  };
  // Brainet nella nota: pillole, aree e allegati si vedono come sul computer; @ e l'area si
  // scrivono dal telefono (passo 2), con i suggerimenti e il foglio dell'area nativi.
  const [brainet] = useState(() =>
    estensioneBrainet({
      onChiocciola: (q) => {
        chiocciola.current = q?.da ?? null;
        avvisa(q?.testo ?? null);
      },
      onSelezione: (s) => {
        selezione.current = s ? { da: s.da, a: s.a } : null;
        avvisa(chiocciola.current === null ? null : "");
      },
      onAreaSopra: () => undefined,
      onAllegato: () => undefined,
      onPillola: (id) => {
        void suPillola.current(id);
        return true;
      },
    }),
  );
  useEffect(() => {
    vista.current?.dispatch({
      effects: [aggiornaEntita.of(entita), aggiornaColoriStati.of(coloriStati)],
    });
  }, [entita, coloriStati]);

  useDOMImperativeHandle(
    ref as Ref<ManigliaEditorNota>,
    () => ({
      applica: (voce: unknown) => editor.current?.applica(voce as VoceFormato),
      chiudiTastiera: () => (document.activeElement as HTMLElement | null)?.blur(),
      cita: (id: unknown, nome: unknown) => {
        const v = vista.current;
        if (!v || chiocciola.current === null) return;
        inserisciCitazione(v, chiocciola.current, { id: String(id), nome: String(nome) });
        chiocciola.current = null;
        avvisa(null);
      },
      alterna: (tipo: unknown, id: unknown) => {
        const v = vista.current;
        if (!v) return;
        const testo = v.state.doc.toString();
        const sel = selezione.current;
        if (sel && !areaQui.current) {
          // La prima scelta trasforma la selezione in un'area (RB-107).
          const nuova = creaArea(
            v,
            sel.da,
            sel.a,
            tipo === "stato" ? [String(id)] : [],
            tipo === "entita" ? [String(id)] : [],
          );
          selezione.current = null;
          areaQui.current = nuova;
          // Il cursore va in fondo alla frase, dentro l'area: le prossime scelte valgono per lei.
          const fatta = leggiSegni(v.state.doc.toString()).aree.find((x) => x.id === nuova);
          if (fatta?.chiude) v.dispatch({ selection: { anchor: fatta.chiude.da } });
        } else if (areaQui.current) {
          const legami = legamiArea(testo, areaQui.current);
          if (!legami) return;
          const via = (lista: string[]) =>
            lista.includes(String(id)) ? lista.filter((x) => x !== id) : [...lista, String(id)];
          const stati = tipo === "stato" ? via(legami.stati) : legami.stati;
          const entita = tipo === "entita" ? via(legami.entita) : legami.entita;
          // Tolte tutte le voci l'area sparisce (RB-109).
          if (!aggiornaArea(v, areaQui.current, stati, entita)) areaQui.current = null;
        }
        avvisa(null);
      },
    }),
    [],
  );

  const cambia = (ti: string, co: string) => {
    ultimo.current = { titolo: ti, contenuto: co };
    void onCambia(ti, co);
  };

  // Il titolo va a capo da solo e cresce con il testo.
  const adatta = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  // Misurato prima che Inter arrivi o prima di avere la sua larghezza, il titolo può risultare
  // di più righe: si rimisura quando cambia la larghezza e quando il carattere è pronto.
  useEffect(() => {
    const el = campo.current;
    if (!el) return;
    let larghezza = 0;
    const osserva = new ResizeObserver(([voce]) => {
      if (voce.contentRect.width === larghezza) return;
      larghezza = voce.contentRect.width;
      adatta(el);
    });
    osserva.observe(el);
    void document.fonts.ready.then(() => adatta(el));
    return () => osserva.disconnect();
  }, []);

  return (
    <div
      className="nota"
      onFocus={() => void onScrive(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) void onScrive(false);
      }}
    >
      <textarea
        ref={(el) => {
          campo.current = el;
          adatta(el);
        }}
        className="nota-titolo titolo"
        rows={1}
        value={testoTitolo}
        placeholder="Titolo"
        aria-label="Titolo della nota"
        autoFocus={nuova}
        onChange={(e) => {
          setTestoTitolo(e.target.value);
          adatta(e.target);
          cambia(e.target.value, ultimo.current.contenuto);
        }}
        onKeyDown={(e) => {
          // Invio nel titolo passa al testo, come sul computer.
          if (e.key !== "Enter") return;
          e.preventDefault();
          vista.current?.focus();
        }}
      />
      <Editor
        ref={editor}
        contenuto={contenuto}
        cursore={cursore}
        focus={cursore !== undefined}
        markdown
        invito="Scrivi qui"
        onModifica={(co) => cambia(ultimo.current.titolo, co)}
        onFormato={(f) => void onFormato(f ? { riga: f.riga, caratteri: [...f.caratteri] } : null)}
        estensioni={brainet}
        onVista={(v) => {
          vista.current = v;
          v?.dispatch({
            effects: [aggiornaEntita.of(entita), aggiornaColoriStati.of(coloriStati)],
          });
        }}
      />
    </div>
  );
}
