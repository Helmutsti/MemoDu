// CMP-26 Percorso: le cartelle che contengono la nota aperta e il suo titolo, al centro della
// fascia in alto del foglio (DEC-71). Una cartella apre quella cartella nella colonna; con
// più di due cartelle quelle di mezzo diventano «…», che apre un menu con le nascoste.
// Il titolo è un pulsante: un clic apre Info (CMP-24) sotto di lui, dove si cambiano titolo,
// date, tag e cartella (DEC-96); vuoto si legge «Senza titolo» (RB-15).

import { ChevronRight } from "lucide-react";
import { useState, type ReactElement } from "react";
import type { Percorso as PercorsoCartella } from "@memodu/condiviso";
import { Icona } from "./Icona";
import { Menu } from "./Menu";
import "./Percorso.css";

interface Proprieta {
  /** Percorso della cartella della nota; "" per le non organizzate. */
  cartella: PercorsoCartella;
  titolo: string;
  /** Info è aperta sotto il titolo: il titolo resta in hover. */
  infoAperta: boolean;
  /** Clic sul titolo: centro orizzontale e bordo inferiore, per mettere Info sotto. */
  onApriInfo: (ancora: { x: number; y: number }) => void;
  onApriCartella: (percorso: PercorsoCartella) => void;
}

interface Pezzo {
  nome: string;
  percorso: PercorsoCartella;
}

export function Percorso({
  cartella,
  titolo,
  infoAperta,
  onApriInfo,
  onApriCartella,
}: Proprieta): ReactElement {
  const [nascoste, setNascoste] = useState<{ x: number; y: number } | null>(null);

  const pezzi: Pezzo[] =
    cartella === ""
      ? []
      : cartella.split("/").map((nome, i, parti) => ({
          nome,
          percorso: parti.slice(0, i + 1).join("/"),
        }));
  const mezzo = pezzi.length > 2 ? pezzi.slice(1, -1) : [];
  const visibili = pezzi.length > 2 ? [pezzi[0], pezzi[pezzi.length - 1]] : pezzi;

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
        <li className="percorso-elemento">
          <button
            type="button"
            className={`percorso-segmento percorso-titolo interfaccia-controllo-attivo ${titolo ? "" : "percorso-senza-titolo"} ${infoAperta ? "percorso-titolo-aperto" : ""}`}
            aria-current="page"
            aria-haspopup="dialog"
            aria-expanded={infoAperta}
            // Il titolo lungo finisce con i puntini: passandoci sopra si legge intero.
            title={titolo || "Senza titolo"}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              onApriInfo({ x: r.left + r.width / 2, y: r.bottom });
            }}
          >
            {titolo || "Senza titolo"}
          </button>
        </li>
      </ol>
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
