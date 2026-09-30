// CMP-05 Tag: pillola alta 24 su sfondo-campo con il nome come scritto, senza «#». Rimovibile:
// la ✕ lo toglie dalla nota; con il focus sul tag, Canc o Backspace fanno lo stesso.

import { X } from "lucide-react";
import type { ReactElement } from "react";
import { Icona } from "./Icona";
import "./Tag.css";

interface Proprieta {
  nome: string;
  /** Con la ✕: toglie il tag dalla nota. Senza: tag in sola lettura. */
  onTogli?: () => void;
}

export function Tag({ nome, onTogli }: Proprieta): ReactElement {
  if (!onTogli) return <span className="tag interfaccia-controllo">{nome}</span>;
  return (
    <span
      className="tag tag-rimovibile interfaccia-controllo"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          onTogli();
        }
      }}
    >
      {nome}
      <button
        type="button"
        className="tag-togli"
        aria-label={`Togli il tag ${nome}`}
        tabIndex={-1}
        onClick={onTogli}
      >
        <Icona di={X} misura={12} />
      </button>
    </span>
  );
}
