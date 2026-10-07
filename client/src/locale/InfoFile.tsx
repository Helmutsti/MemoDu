// CMP-24, Info del file (DEC-123): con un clic sul nome di un file di Locale nel percorso, sotto
// di lui come la Comparsa di Info, livello 20 e senza velo. Il campo del nome (rinomina, RB-82),
// il divisore e le voci Chiudi file e, solo per un file aggiunto da solo all'elenco, Togli da
// Locale. Niente cartella, date o tag (RF-17). Si chiude con Invio, Esc o un clic fuori, e il
// nome scritto vale come per il titolo di una nota; un file nuovo mai salvato prende il nome al
// primo Ctrl + S (RB-81), quindi il campo non si cambia.

import { FolderMinus, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { VoceAzione } from "../componenti/VoceAzione";
import { SU_MAC } from "../finestra";
import "../schermate/Info.css";

interface Proprieta {
  nome: string;
  /** File nuovo mai salvato: il campo non cambia il nome. */
  nuovo: boolean;
  /** File aggiunto da solo all'elenco (DEC-120): c'è Togli da Locale. */
  siPuoTogliere: boolean;
  /** Centro orizzontale e bordo inferiore del nome nel percorso. */
  ancora: { x: number; y: number };
  /** Si chiude: con il nome scritto nel campo, che vale se è cambiato. */
  onChiudi: (nome: string) => void;
  onChiudiFile: () => void;
  onTogli: () => void;
}

const LARGHEZZA = 360;
/** Tra il nome nel percorso e la comparsa (spazio-icona). */
const DISTANZA = 8;
const MARGINE_FINESTRA = 8;

export function InfoFile(p: Proprieta): ReactElement {
  const finestra = useRef<HTMLDivElement>(null);
  const [nome, setNome] = useState(p.nome);
  const chiudi = useRef(() => p.onChiudi(nome));
  useEffect(() => {
    chiudi.current = () => p.onChiudi(nome);
  });

  // All'apertura il cursore va nel campo del nome, con il nome selezionato.
  useEffect(() => {
    const campo = finestra.current?.querySelector("input");
    campo?.focus();
    campo?.select();
  }, []);

  // Esc chiude anche se il focus non è più dentro; un clic fuori la chiude, tranne sul nome nel
  // percorso, che la apre e la chiude da sé.
  useEffect(() => {
    const suEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      chiudi.current();
    };
    const suClic = (e: MouseEvent) => {
      if ((e.target as Element).closest?.(".info, .percorso-titolo")) return;
      chiudi.current();
    };
    window.addEventListener("keydown", suEsc);
    window.addEventListener("mousedown", suClic, true);
    return () => {
      window.removeEventListener("keydown", suEsc);
      window.removeEventListener("mousedown", suClic, true);
    };
  }, []);

  const larghezza = Math.min(LARGHEZZA, window.innerWidth - 2 * MARGINE_FINESTRA);
  const posizione = {
    width: larghezza,
    maxWidth: "none",
    left: Math.max(
      MARGINE_FINESTRA,
      Math.min(p.ancora.x - larghezza / 2, window.innerWidth - larghezza - MARGINE_FINESTRA),
    ),
    top: p.ancora.y + DISTANZA,
  };

  return createPortal(
    <div
      ref={finestra}
      className="info info-comparsa"
      role="dialog"
      aria-label={`Info di ${p.nome}`}
      style={posizione}
    >
      <div className="info-contenuto">
        <input
          className="info-campo interfaccia-controllo"
          aria-label="Nome del file"
          value={nome}
          readOnly={p.nuovo}
          title={p.nuovo ? "Il nome viene dalla prima riga al primo salvataggio" : undefined}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => {
            // Invio conferma il nome e chiude, come Esc: si torna a scrivere.
            if (e.key === "Enter") {
              e.preventDefault();
              chiudi.current();
            }
          }}
        />
        <div className="menu-separatore" role="separator" />
        <div className="info-azioni">
          <VoceAzione
            etichetta="Chiudi file"
            icona={X}
            scorciatoia={`${SU_MAC ? "⌘" : "Ctrl"} + W`}
            onClick={p.onChiudiFile}
          />
          {p.siPuoTogliere && (
            <VoceAzione etichetta="Togli da Locale" icona={FolderMinus} onClick={p.onTogli} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
