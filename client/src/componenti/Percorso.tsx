// CMP-26 Percorso: le cartelle che contengono la nota aperta e il suo titolo, al centro della
// fascia in alto del foglio (DEC-71). Una cartella apre quella cartella nella colonna; con
// più di due cartelle quelle di mezzo diventano «…», che apre un menu con le nascoste.
// Il titolo è un campo che sembra testo: si modifica cliccandolo, Invio o Esc tornano al
// testo della nota; vuoto si legge «Senza titolo» (RB-15). Passando sul titolo, dopo 500 ms,
// o con il focus da tastiera, compare la Comparsa dei metadati (CMP-27).

import { ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import type { Percorso as PercorsoCartella } from "@memodu/condiviso";
import { ComparsaMetadati } from "./ComparsaMetadati";
import { Icona } from "./Icona";
import { Menu } from "./Menu";
import "./Percorso.css";

const RITARDO_MS = 500;

interface Proprieta {
  /** Percorso della cartella della nota; "" per le non organizzate. */
  cartella: PercorsoCartella;
  titolo: string;
  modificata: string;
  tag: string[];
  onTitolo: (titolo: string) => void;
  /** Invio o Esc nel titolo: si torna a scrivere nel testo. */
  onTornaAlTesto: () => void;
  onApriCartella: (percorso: PercorsoCartella) => void;
}

interface Pezzo {
  nome: string;
  percorso: PercorsoCartella;
}

// Il focus arriva dalla tastiera? (":focus-visible" non esiste in tutti gli ambienti di prova.)
function daTastiera(elemento: Element): boolean {
  try {
    return elemento.matches(":focus-visible");
  } catch {
    return true;
  }
}

export function Percorso({
  cartella,
  titolo,
  modificata,
  tag,
  onTitolo,
  onTornaAlTesto,
  onApriCartella,
}: Proprieta): ReactElement {
  const [valore, setValore] = useState(titolo);
  const [comparsa, setComparsa] = useState<{ x: number; y: number } | null>(null);
  const [nascoste, setNascoste] = useState<{ x: number; y: number } | null>(null);
  const zonaTitolo = useRef<HTMLLIElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const idComparsa = useId();

  const pezzi: Pezzo[] =
    cartella === ""
      ? []
      : cartella.split("/").map((nome, i, parti) => ({
          nome,
          percorso: parti.slice(0, i + 1).join("/"),
        }));
  const mezzo = pezzi.length > 2 ? pezzi.slice(1, -1) : [];
  const visibili = pezzi.length > 2 ? [pezzi[0], pezzi[pezzi.length - 1]] : pezzi;

  const mostra = () => {
    const r = zonaTitolo.current?.getBoundingClientRect();
    if (r) setComparsa({ x: r.left + r.width / 2, y: r.bottom });
  };
  const mostraDopo = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(mostra, RITARDO_MS);
  };
  const nascondi = () => {
    window.clearTimeout(timer.current);
    setComparsa(null);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const separatore = (
    <span className="percorso-separatore" aria-hidden="true">
      <Icona di={ChevronRight} misura={12} />
    </span>
  );

  const pulsanteCartella = (p: Pezzo) => (
    <li key={p.percorso} className="percorso-elemento">
      <button
        type="button"
        className="percorso-segmento percorso-cartella interfaccia-controllo"
        onClick={() => onApriCartella(p.percorso)}
      >
        {p.nome}
      </button>
      {separatore}
    </li>
  );

  return (
    <nav className="percorso" aria-label="Percorso della nota">
      <ol className="percorso-elenco">
        {visibili[0] && pulsanteCartella(visibili[0])}
        {mezzo.length > 0 && (
          <li className="percorso-elemento">
            <button
              type="button"
              className="percorso-segmento percorso-cartella interfaccia-controllo"
              aria-label="Cartelle nascoste"
              aria-haspopup="menu"
              aria-expanded={nascoste !== null}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setNascoste(nascoste ? null : { x: r.left, y: r.bottom + 4 });
              }}
            >
              …
            </button>
            {separatore}
          </li>
        )}
        {visibili.slice(1).map(pulsanteCartella)}
        <li
          ref={zonaTitolo}
          className="percorso-elemento"
          onMouseEnter={mostraDopo}
          onMouseLeave={nascondi}
        >
          <span
            className="percorso-titolo interfaccia-controllo-attivo"
            data-valore={valore || "Senza titolo"}
          >
            <input
              className="percorso-segmento percorso-campo"
              aria-label="Titolo della nota"
              // La misura la dà la copia invisibile del valore: il campo da solo non si allarga.
              size={1}
              aria-current="page"
              aria-describedby={comparsa ? idComparsa : undefined}
              placeholder="Senza titolo"
              value={valore}
              onChange={(e) => {
                setValore(e.target.value);
                onTitolo(e.target.value);
              }}
              onMouseDown={nascondi}
              onFocus={(e) => daTastiera(e.target) && mostra()}
              onBlur={nascondi}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== "Escape") return;
                e.preventDefault();
                e.stopPropagation();
                nascondi();
                onTornaAlTesto();
              }}
            />
          </span>
        </li>
      </ol>
      {comparsa && (
        <ComparsaMetadati
          id={idComparsa}
          modificata={modificata}
          tag={tag}
          x={comparsa.x}
          y={comparsa.y}
        />
      )}
      {nascoste && (
        <Menu
          etichetta="Cartelle nascoste"
          x={nascoste.x}
          y={nascoste.y}
          voci={mezzo.map((p) => ({
            tipo: "voce",
            etichetta: p.nome,
            azione: () => onApriCartella(p.percorso),
          }))}
          onChiudi={() => setNascoste(null)}
        />
      )}
    </nav>
  );
}
