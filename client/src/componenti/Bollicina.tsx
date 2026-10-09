// CMP-10 Bollicina del formato (DEC-131): mostra il formato dove sta il cursore (CA-02.4); con un
// clic si apre il cassetto dei formati (CA-02.21). Una voce scelta vale subito e il cassetto resta
// aperto; si chiude quando si riprende a scrivere, con Esc, con un clic fuori o con un altro clic
// sulla bollicina. Non ruba il focus mentre si scrive: un clic sulle voci lascia il cursore nel
// testo. Il cassetto va su due righe se accanto non c'è posto. Le scorciatoie e Alt + F10 sono
// rinviati: da tastiera la bollicina si raggiunge come ogni pulsante.

import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  RemoveFormatting,
  Strikethrough,
  Type,
  Underline,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactElement } from "react";
import type { FormatoDove, FormatoRiga, FormatoTesto } from "../editor/formati";
import { Icona } from "./Icona";
import { Suggerimento } from "./Suggerimento";
import "./Pillola.css";
import "./Bollicina.css";

/** Una voce del cassetto. */
export type VoceFormato = FormatoRiga | "testo" | FormatoTesto | "rimuovi";

const RIGA: { voce: FormatoRiga | "testo"; nome: string; icona: LucideIcon }[] = [
  { voce: "testo", nome: "Testo normale", icona: Type },
  { voce: "titolo", nome: "Titolo", icona: Heading1 },
  { voce: "sottotitolo", nome: "Sottotitolo", icona: Heading2 },
  { voce: "puntato", nome: "Elenco puntato", icona: List },
  { voce: "numerato", nome: "Elenco numerato", icona: ListOrdered },
  { voce: "checklist", nome: "Casella", icona: ListChecks },
];

const CARATTERE: { voce: FormatoTesto; nome: string; icona: LucideIcon }[] = [
  { voce: "grassetto", nome: "Grassetto", icona: Bold },
  { voce: "corsivo", nome: "Corsivo", icona: Italic },
  { voce: "barrato", nome: "Barrato", icona: Strikethrough },
  { voce: "sottolineato", nome: "Sottolineato", icona: Underline },
];

/** Larghezza del cassetto su una riga con la bollicina accanto (CMP-10: 426 + 8 + 60). */
const LARGHEZZA_UNA_RIGA = 494;

interface Proprieta {
  formato: FormatoDove;
  /** Da che parte si apre il cassetto: a sinistra nel foglio, a destra nella nota rapida. */
  lato: "sinistra" | "destra";
  onScegli: (voce: VoceFormato) => void;
}

function nomeRiga(riga: FormatoDove["riga"]): string {
  if (riga === "misto") return "righe diverse";
  return RIGA.find((r) => r.voce === riga)!.nome.toLowerCase();
}

export function Bollicina({ formato, lato, onScegli }: Proprieta): ReactElement {
  const [aperta, setAperta] = useState(false);
  const [dueRighe, setDueRighe] = useState(false);
  const radice = useRef<HTMLDivElement>(null);

  // Su due righe se il contenitore non lascia posto per una (CMP-10, Righe=Due).
  useLayoutEffect(() => {
    const contenitore = radice.current?.parentElement;
    if (!contenitore) return;
    const misura = () => setDueRighe(contenitore.clientWidth < LARGHEZZA_UNA_RIGA);
    misura();
    const osservatore = new ResizeObserver(misura);
    osservatore.observe(contenitore);
    return () => osservatore.disconnect();
  }, []);

  // Si chiude scrivendo, con Esc o con un clic fuori.
  useEffect(() => {
    if (!aperta) return;
    const suTasto = (e: KeyboardEvent) => {
      if (radice.current?.contains(e.target as Node) && e.key !== "Escape") return;
      if (
        e.key === "Escape" ||
        e.key.length === 1 ||
        ["Enter", "Backspace", "Delete"].includes(e.key)
      )
        setAperta(false);
    };
    const suClic = (e: MouseEvent) => {
      if (!radice.current?.contains(e.target as Node)) setAperta(false);
    };
    document.addEventListener("keydown", suTasto, true);
    document.addEventListener("mousedown", suClic, true);
    return () => {
      document.removeEventListener("keydown", suTasto, true);
      document.removeEventListener("mousedown", suClic, true);
    };
  }, [aperta]);

  const iconaRiga =
    formato.riga === "misto" ? Minus : RIGA.find((r) => r.voce === formato.riga)!.icona;
  const caratteri = CARATTERE.filter((c) => formato.caratteri.has(c.voce));
  const descrizione = [nomeRiga(formato.riga), ...caratteri.map((c) => c.nome.toLowerCase())].join(
    ", ",
  );

  const strumento = (nome: string, icona: LucideIcon, voce: VoceFormato, attivo?: boolean) => (
    <Suggerimento key={voce} testo={nome}>
      <button
        type="button"
        aria-label={nome}
        aria-pressed={attivo}
        className={`strumento ${attivo ? "strumento-attivo" : ""}`}
        onClick={() => onScegli(voce)}
      >
        <Icona di={icona} />
      </button>
    </Suggerimento>
  );

  const formatiRiga = RIGA.map((r) => strumento(r.nome, r.icona, r.voce, formato.riga === r.voce));
  const formatiCarattere = CARATTERE.map((c) =>
    strumento(c.nome, c.icona, c.voce, formato.caratteri.has(c.voce)),
  );
  const rimuovi = strumento("Rimuovi formattazione", RemoveFormatting, "rimuovi");
  const divisore = (k: string) => <span key={k} className="pillola-divisore" aria-hidden="true" />;

  return (
    <div
      ref={radice}
      className={`bollicina bollicina-${lato}`}
      // Il clic su bollicina e cassetto non toglie il cursore dal testo.
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="bollicina-pillola">
        <button
          type="button"
          className={`bollicina-pulsante ${aperta ? "bollicina-aperta" : ""}`}
          aria-label={`Formato: ${descrizione}`}
          aria-expanded={aperta}
          onClick={() => setAperta((a) => !a)}
        >
          <Icona di={iconaRiga} />
          {caratteri.map((c) => (
            <Icona key={c.voce} di={c.icona} />
          ))}
        </button>
      </div>
      {aperta && (
        <div
          role="toolbar"
          aria-label="Formato"
          className={`bollicina-cassetto ${dueRighe ? "bollicina-due-righe" : ""}`}
        >
          {dueRighe ? (
            <>
              <div className="bollicina-gruppo">{formatiRiga}</div>
              <div className="bollicina-gruppo">
                {formatiCarattere}
                {divisore("d")}
                {rimuovi}
              </div>
            </>
          ) : (
            <>
              {formatiRiga}
              {divisore("d1")}
              {formatiCarattere}
              {divisore("d2")}
              {rimuovi}
            </>
          )}
        </div>
      )}
    </div>
  );
}
