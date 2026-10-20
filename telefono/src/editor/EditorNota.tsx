"use dom";

// CMP-20 Testo della nota sul telefono (DEC-162): lo stesso editor del computer (CodeMirror con
// la vista Markdown di DEC-130: simboli nascosti, scrittura come in Word), dentro un componente
// DOM di Expo. Sopra il testo il titolo della nota. Misure alla scala del telefono (DEC-161) in
// editor-nota.css; colori dai token del computer, chiaro e scuro come il sistema.

import "@fontsource-variable/inter";
import "../../../client/src/stili/token.css";
import "./editor-nota.css";
import { useDOMImperativeHandle, type DOMImperativeFactory } from "expo/dom";
import { useEffect, useRef, useState, type Ref } from "react";
import type { EditorView } from "@codemirror/view";
import type { VoceFormato } from "../../../client/src/componenti/Bollicina";
import { Editor, type ManigliaEditor } from "../../../client/src/editor/Editor";
import type { FormatoDove } from "../../../client/src/editor/formati";

export interface ManigliaEditorNota extends DOMImperativeFactory {
  /** Una voce del cassetto (VoceFormato): sul ponte passano solo stringhe. */
  applica: (voce: unknown) => void;
  chiudiTastiera: () => void;
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
  onCambia,
  onFormato,
  onScrive,
}: {
  ref?: Ref<ManigliaEditorNota>;
  titolo: string;
  contenuto: string;
  /** Nota appena creata: il cursore va nel titolo. */
  nuova: boolean;
  onCambia: (titolo: string, contenuto: string) => Promise<void>;
  onFormato: (formato: FormatoInJson | null) => Promise<void>;
  onScrive: (scrive: boolean) => Promise<void>;
  dom?: import("expo/dom").DOMProps;
}) {
  const editor = useRef<ManigliaEditor>(null);
  const vista = useRef<EditorView | null>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const ultimo = useRef({ titolo, contenuto });
  const [testoTitolo, setTestoTitolo] = useState(titolo);

  useDOMImperativeHandle(
    ref as Ref<ManigliaEditorNota>,
    () => ({
      applica: (voce: unknown) => editor.current?.applica(voce as VoceFormato),
      chiudiTastiera: () => (document.activeElement as HTMLElement | null)?.blur(),
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
        markdown
        invito="Scrivi qui"
        onModifica={(co) => cambia(ultimo.current.titolo, co)}
        onFormato={(f) => void onFormato(f ? { riga: f.riga, caratteri: [...f.caratteri] } : null)}
        onVista={(v) => (vista.current = v)}
      />
    </div>
  );
}
