// CMP-29 Ricerca avanzata (DEC-96, ID-33, RF-08): la ricerca in una finestra grande al centro,
// livello 30 con il velo, quando i risultati non stanno nella card. Testo, filtri e risultati
// sono quelli della ricerca della colonna (Ricerca li tiene): qui si vedono e si cambiano.
// - In alto il campo e la ✕; a sinistra i filtri sempre aperti (Tag con più scelte, Creazione e
//   Modifica con i periodi e «Scegli le date…»), con la spunta a destra come nei menu dei filtri;
//   a destra il conteggio e i risultati, nello stesso ordine della card.
// - Invio o un clic su un risultato lo aprono; Esc, la ✕ o un clic sul velo chiudono e si torna
//   alla card con lo stesso testo e gli stessi filtri (CA-08.20).
// - Tastiera: freccia giù dal campo entra nei risultati, su e giù si muovono; Tab passa dal campo
//   ai filtri e ai risultati e resta nella finestra (CA-08.21).

import { Check, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import { createPortal } from "react-dom";
import type { RisultatoRicerca } from "../api";
import {
  dettagliRisultato,
  divisioneEstratto,
  nomePeriodo,
  PERIODI,
  stessoPeriodo,
  type Periodo,
} from "../ricerca";
import { Calendario } from "./Calendario";
import { Icona } from "./Icona";
import { PulsanteIcona } from "./Pulsante";
import "./Ricerca.css";
import "./RicercaAvanzata.css";

type FiltroData = "creata" | "modificata";

interface Proprieta {
  testo: string;
  onTesto: (testo: string) => void;
  tag: string[];
  onTag: (tag: string[]) => void;
  creata: Periodo | null;
  onCreata: (periodo: Periodo | null) => void;
  modificata: Periodo | null;
  onModificata: (periodo: Periodo | null) => void;
  /** Tutti i tag, per i filtri. */
  tuttiTag: string[];
  /** Null: niente testo e nessun filtro, non si cerca ancora. */
  risultati: RisultatoRicerca[] | null;
  onApri: (risultato: RisultatoRicerca) => void;
  onChiudi: () => void;
}

/** «"rilascio" con il tag lavoro · 4 note» (CA-08.19). */
function conteggio(testo: string, tag: string[], n: number): string {
  const parti: string[] = [];
  if (testo.trim()) parti.push(`«${testo.trim()}»`);
  if (tag.length === 1) parti.push(`con il tag ${tag[0]}`);
  else if (tag.length > 1) parti.push(`con ${tag.length} tag`);
  const note = n === 1 ? "1 nota" : `${n} note`;
  return parti.length ? `${parti.join(" ")} · ${note}` : note;
}

export function RicercaAvanzata(p: Proprieta): ReactElement {
  const finestra = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const [calendario, setCalendario] = useState<{ filtro: FiltroData; ancora: DOMRect } | null>(
    null,
  );
  const suChiudi = useRef(p.onChiudi);
  useEffect(() => {
    suChiudi.current = p.onChiudi;
  });

  // All'apertura il cursore va nel campo (CA-08.21).
  useEffect(() => {
    campo.current?.focus();
  }, []);

  const righe = () => [
    ...(finestra.current?.querySelectorAll<HTMLElement>(".risultato-avanzata") ?? []),
  ];

  const suTasto = (e: KeyboardEvent<HTMLDivElement>) => {
    if (calendario) return;
    const attuale = document.activeElement as HTMLElement;
    const r = righe();
    const i = r.indexOf(attuale);
    if (e.key === "Escape") {
      e.preventDefault();
      suChiudi.current();
    } else if (e.key === "ArrowDown" && (attuale === campo.current || i >= 0) && r.length) {
      e.preventDefault();
      r[Math.min(i + 1, r.length - 1)]?.focus();
    } else if (e.key === "ArrowUp" && i >= 0) {
      e.preventDefault();
      (i === 0 ? campo.current : r[i - 1])?.focus();
    } else if (e.key === "Enter" && i >= 0 && p.risultati) {
      e.preventDefault();
      p.onApri(p.risultati[i]!);
    } else if (e.key === "Tab") {
      // Il focus resta nella finestra.
      const elementi = [
        ...(finestra.current?.querySelectorAll<HTMLElement>(
          "input, button:not([tabindex='-1']), [tabindex='0']",
        ) ?? []),
      ];
      const j = elementi.indexOf(attuale);
      e.preventDefault();
      elementi[(j + (e.shiftKey ? -1 : 1) + elementi.length) % elementi.length]?.focus();
    }
  };

  const voce = (
    nome: string,
    scelta: boolean,
    azione: (e: React.MouseEvent<HTMLButtonElement>) => void,
    ruolo: "checkbox" | "radio",
    dettaglio?: string,
  ) => (
    <button
      key={nome}
      type="button"
      role={ruolo === "checkbox" ? "menuitemcheckbox" : "menuitemradio"}
      aria-checked={scelta}
      className="voce-menu voce-azione filtro-avanzato"
      onClick={azione}
    >
      <span className="voce-menu-riga interfaccia-controllo">
        <span className="voce-menu-etichetta">{nome}</span>
        {dettaglio && (
          <span className="voce-menu-scorciatoia interfaccia-dettaglio">{dettaglio}</span>
        )}
        {scelta && (
          <span className="voce-menu-icona" aria-hidden="true">
            <Icona di={Check} />
          </span>
        )}
      </span>
    </button>
  );

  const gruppoData = (titolo: string, filtro: FiltroData) => {
    const valore = filtro === "creata" ? p.creata : p.modificata;
    const imposta = filtro === "creata" ? p.onCreata : p.onModificata;
    const giorno = typeof valore === "object" && valore !== null;
    return (
      <div className="filtri-avanzati-gruppo" role="group" aria-label={titolo}>
        <p className="filtri-avanzati-titolo interfaccia-titolo-gruppo">{titolo}</p>
        {voce("Qualsiasi data", valore === null, () => imposta(null), "radio")}
        {PERIODI.map((periodo) =>
          voce(
            periodo.etichetta,
            stessoPeriodo(valore, periodo.valore),
            () => imposta(periodo.valore),
            "radio",
          ),
        )}
        {voce(
          "Scegli le date…",
          giorno,
          (e) => setCalendario({ filtro, ancora: e.currentTarget.getBoundingClientRect() }),
          "radio",
          giorno ? nomePeriodo(valore) : undefined,
        )}
      </div>
    );
  };

  const n = p.risultati?.length ?? 0;

  return createPortal(
    <div
      className="velo velo-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !calendario) p.onChiudi();
      }}
    >
      <div
        ref={finestra}
        className="ricerca-avanzata"
        role="dialog"
        aria-modal="true"
        aria-label="Ricerca avanzata"
        onKeyDown={suTasto}
      >
        <div className="ricerca-avanzata-barra">
          <div className="ricerca-avanzata-campo">
            <span className="ricerca-lente" aria-hidden="true">
              <Icona di={Search} />
            </span>
            <input
              ref={campo}
              className="ricerca-campo interfaccia-controllo"
              placeholder="Cerca nelle note"
              aria-label="Cerca nelle note"
              aria-describedby="ricerca-avanzata-conteggio"
              value={p.testo}
              onChange={(e) => p.onTesto(e.target.value)}
            />
            {p.testo !== "" && (
              <button
                type="button"
                className="ricerca-cancella"
                aria-label="Cancella la ricerca"
                tabIndex={-1}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => p.onTesto("")}
              >
                <Icona di={X} />
              </button>
            )}
          </div>
          <PulsanteIcona nome="Chiudi" icona={<Icona di={X} />} onClick={p.onChiudi} />
        </div>
        <div className="ricerca-avanzata-corpo">
          <div className="filtri-avanzati" role="group" aria-label="Filtri">
            <div className="filtri-avanzati-gruppo" role="group" aria-label="Tag">
              <p className="filtri-avanzati-titolo interfaccia-titolo-gruppo">Tag</p>
              {p.tuttiTag.map((nome) => {
                const scelto = p.tag.some((t) => t.toLowerCase() === nome.toLowerCase());
                return voce(
                  nome,
                  scelto,
                  () =>
                    p.onTag(
                      scelto
                        ? p.tag.filter((t) => t.toLowerCase() !== nome.toLowerCase())
                        : [...p.tag, nome],
                    ),
                  "checkbox",
                );
              })}
            </div>
            {gruppoData("Creazione", "creata")}
            {gruppoData("Modifica", "modificata")}
          </div>
          <div className="risultati-avanzati">
            <p
              id="ricerca-avanzata-conteggio"
              className="risultati-avanzati-conteggio interfaccia-messaggio"
              aria-live="polite"
            >
              {p.risultati === null
                ? "Scrivi una parola o scegli un filtro."
                : conteggio(p.testo, p.tag, n)}
            </p>
            {p.risultati !== null && n === 0 ? (
              <div className="card-ricerca-vuota">
                <span className="interfaccia-titolo">Nessuna nota trovata</span>
                <span className="interfaccia-controllo">
                  Prova con un&apos;altra parola o togli un filtro.
                </span>
              </div>
            ) : (
              p.risultati !== null && (
                <ul className="card-ricerca-elenco" role="listbox" aria-label="Note trovate">
                  {p.risultati.map((r) => {
                    const [prima, parola, dopo] = divisioneEstratto(r);
                    return (
                      <li
                        key={r.id}
                        role="option"
                        aria-selected={false}
                        tabIndex={-1}
                        className={`risultato-ricerca risultato-avanzata ${r.nelCestino ? "risultato-ricerca-cestino" : ""}`}
                        onClick={() => p.onApri(r)}
                      >
                        <span className="risultato-ricerca-titolo interfaccia-titolo">
                          {r.titolo}
                        </span>
                        <span className="risultato-ricerca-estratto interfaccia-controllo">
                          {prima}
                          {parola && <span className="risultato-ricerca-parola">{parola}</span>}
                          {dopo}
                        </span>
                        <span className="risultato-ricerca-dettagli interfaccia-dettaglio">
                          {dettagliRisultato(r)}
                          {r.nelCestino && (
                            <span className="risultato-ricerca-etichetta">nel cestino</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )
            )}
          </div>
        </div>
      </div>
      {calendario && (
        <Calendario
          valore={(() => {
            const v = calendario.filtro === "creata" ? p.creata : p.modificata;
            return typeof v === "object" && v !== null ? v.giorno : null;
          })()}
          ancora={calendario.ancora}
          sopraOverlay
          onScegli={(giorno) => {
            const periodo = giorno ? { giorno } : null;
            if (calendario.filtro === "creata") p.onCreata(periodo);
            else p.onModificata(periodo);
            setCalendario(null);
          }}
          onChiudi={() => setCalendario(null)}
        />
      )}
    </div>,
    document.body,
  );
}
