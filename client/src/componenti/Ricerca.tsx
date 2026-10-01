// Ricerca di SC-01 (RF-08, FL-06): il campo (CMP-03, tipo Ricerca) in cima alla colonna e sotto
// la card dei risultati (CMP-13), larga 480 sopra il foglio, livello 20, senza velo.
// - La card si apre entrando nel campo, con i soli filtri (RB-33); la ricerca parte 150 ms dopo
//   l'ultimo tasto o filtro (DEC-95), sulla copia di lavoro.
// - Filtri Tag, Creazione e Modifica (DEC-94): menu CMP-09, il Tag con più scelte e il campo
//   «Cerca un tag», le date con i periodi e «Scegli le date…» sul calendario (CMP-12).
// - Mentre la card è aperta i risultati cambiano solo con testo e filtri (RB-45).
// - Chiudendo la card (Esc, clic fuori, risultato aperto) testo e filtri si svuotano (RB-72).
// - Tastiera: freccia giù entra nei risultati, su e giù si muovono, Invio apre, Esc chiude; Tab
//   passa tra il campo e i filtri (CMP-13).

import { ChevronDown, Search, X } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { api, type RisultatoRicerca } from "../api";
import {
  PAUSA_RICERCA_MS,
  PERIODI,
  dettagliRisultato,
  divisioneEstratto,
  intervallo,
  nomeFiltroTag,
  nomePeriodo,
  stessoPeriodo,
  type Periodo,
} from "../ricerca";
import { Calendario } from "./Calendario";
import { Icona } from "./Icona";
import { Menu, type VoceMenu } from "./Menu";
import "./Ricerca.css";

interface Proprieta {
  /** Cresce a ogni Ctrl + K (⌘ + K): il cursore va nel campo (RB-71). */
  focus: number;
  onApri: (risultato: RisultatoRicerca) => void;
  /** La card si è chiusa senza aprire niente; con Esc il cursore torna dov'era (RB-71). */
  onChiusa: (conEsc: boolean) => void;
  /** La ricerca non è riuscita: non vuol dire «nessuna nota» (RB-61, SF-32). */
  onErrore: (errore: unknown) => void;
}

type Filtro = "tag" | "creata" | "modificata";
/** Nell'ordine delle pillole nella card. */
const FILTRI: Filtro[] = ["tag", "creata", "modificata"];

/** Tra il campo e la card (spazio-flottante). */
const DISTANZA_CARD = 8;
/** Quanto la card segue il campo dopo l'apertura: la colonna scorre in 200 ms (DEC-55). */
const DURATA_INSEGUIMENTO_MS = 400;

export function Ricerca({ focus, onApri, onChiusa, onErrore }: Proprieta): ReactElement {
  const campo = useRef<HTMLInputElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const idElenco = useId();
  const [aperta, setAperta] = useState(false);
  const [testo, setTesto] = useState("");
  const [tag, setTag] = useState<string[]>([]);
  const [creata, setCreata] = useState<Periodo | null>(null);
  const [modificata, setModificata] = useState<Periodo | null>(null);
  const [risultati, setRisultati] = useState<RisultatoRicerca[] | null>(null);
  const [posizione, setPosizione] = useState({ x: 0, y: 0 });
  const [menu, setMenu] = useState<{ filtro: Filtro; ancora: DOMRect } | null>(null);
  const [calendario, setCalendario] = useState<{ filtro: Filtro; ancora: DOMRect } | null>(null);
  const [tuttiTag, setTuttiTag] = useState<string[]>([]);
  const [cercaTag, setCercaTag] = useState("");
  const suErrore = useRef(onErrore);
  useEffect(() => {
    suErrore.current = onErrore;
  });

  useEffect(() => {
    if (focus === 0 || !campo.current) return;
    // Già nel campo con la card chiusa: si rientra, così la card si apre (RB-33).
    if (document.activeElement === campo.current) campo.current.blur();
    campo.current.focus();
  }, [focus]);

  const filtri = { tag, creata, modificata };
  const cercabile = testo.trim() !== "" || tag.length > 0 || creata !== null || modificata !== null;
  const firma = JSON.stringify({ testo, ...filtri });
  // Senza testo e senza filtri la card mostra solo i filtri (RB-33).
  const mostrati = aperta && cercabile ? risultati : null;

  // La ricerca parte dopo la pausa; una risposta vecchia non sostituisce una più recente.
  useEffect(() => {
    if (!aperta || !cercabile) return;
    let valida = true;
    const attesa = setTimeout(() => {
      void api
        .cerca({
          testo,
          tag,
          creata: creata && intervallo(creata),
          modificata: modificata && intervallo(modificata),
        })
        .then(
          (trovati) => valida && setRisultati(trovati),
          // I risultati di prima restano: non si dice «Nessuna nota trovata» per un errore.
          (errore) => valida && suErrore.current(errore),
        );
    }, PAUSA_RICERCA_MS);
    return () => {
      valida = false;
      clearTimeout(attesa);
    };
    // La firma raccoglie testo e filtri.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aperta, firma]);

  // La card segue il campo mentre la colonna si apre scorrendo (DEC-55) e quando la finestra
  // cambia misura; poi resta ferma.
  useLayoutEffect(() => {
    if (!aperta) return;
    let giro = 0;
    const fine = performance.now() + DURATA_INSEGUIMENTO_MS;
    const segui = () => {
      const r = campo.current?.getBoundingClientRect();
      if (r) {
        setPosizione((p) =>
          p.x === r.left && p.y === r.bottom + DISTANZA_CARD
            ? p
            : { x: r.left, y: r.bottom + DISTANZA_CARD },
        );
      }
      if (performance.now() < fine) giro = requestAnimationFrame(segui);
    };
    giro = requestAnimationFrame(segui);
    const suMisura = () => requestAnimationFrame(segui);
    window.addEventListener("resize", suMisura);
    return () => {
      cancelAnimationFrame(giro);
      window.removeEventListener("resize", suMisura);
    };
  }, [aperta]);

  /** Entrando nel campo la card si apre subito sotto di lui (RB-33). */
  const entra = () => {
    const r = campo.current?.getBoundingClientRect();
    if (r) setPosizione({ x: r.left, y: r.bottom + DISTANZA_CARD });
    setAperta(true);
  };

  /** Card chiusa, testo e filtri svuotati (RB-72). */
  const svuota = () => {
    setAperta(false);
    setTesto("");
    setTag([]);
    setCreata(null);
    setModificata(null);
    setRisultati(null);
    setMenu(null);
    setCalendario(null);
  };

  const chiudi = (conEsc: boolean) => {
    svuota();
    onChiusa(conEsc);
  };

  // Clic fuori da campo, card, menu e calendario: la card si chiude (RB-72).
  useEffect(() => {
    if (!aperta) return;
    const suClic = (e: MouseEvent) => {
      const dove = e.target as Element;
      if (dove.closest?.(".ricerca, .card-ricerca, .menu, .calendario")) return;
      chiudi(false);
    };
    window.addEventListener("mousedown", suClic, true);
    return () => window.removeEventListener("mousedown", suClic, true);
  });

  const apri = (r: RisultatoRicerca) => {
    svuota();
    onApri(r);
  };

  const apriMenu = async (filtro: Filtro, pillola: HTMLElement) => {
    if (filtro === "tag") {
      setCercaTag("");
      setTuttiTag((await api.elencaTag().catch(() => [])).map((t) => t.nome));
    }
    setMenu({ filtro, ancora: pillola.getBoundingClientRect() });
  };

  const pillole = () => [...(card.current?.querySelectorAll<HTMLElement>(".filtro-ricerca") ?? [])];
  const righe = () => [
    ...(card.current?.querySelectorAll<HTMLElement>(".risultato-ricerca") ?? []),
  ];

  /**
   * Menu e calendario chiusi. Il focus torna sul filtro se era nel menu (il campo «Cerca un
   * tag», che sparisce con lui) o se è già caduto sulla pagina; un clic altrove lo lascia lì.
   */
  const chiudiMenu = () => {
    const filtro = calendario?.filtro ?? menu?.filtro;
    const attivo = document.activeElement;
    const perso = !attivo || attivo === document.body || attivo.closest(".menu, .calendario");
    setCalendario(null);
    setMenu(null);
    if (filtro && perso) pillole()[FILTRI.indexOf(filtro)]?.focus();
  };

  // Nel campo: freccia giù entra nei risultati, Tab va ai filtri, Esc chiude.
  const suTastoCampo = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      chiudi(true);
    } else if (e.key === "ArrowDown" && righe().length > 0) {
      e.preventDefault();
      righe()[0]?.focus();
    } else if (e.key === "Tab" && !e.shiftKey && aperta) {
      e.preventDefault();
      pillole()[0]?.focus();
    }
  };

  // Nella card: su e giù tra i risultati, Invio apre, Tab tra i filtri, Esc chiude.
  const suTastoCard = (e: KeyboardEvent<HTMLDivElement>) => {
    if (menu || calendario) return;
    const attuale = document.activeElement as HTMLElement;
    const r = righe();
    const i = r.indexOf(attuale);
    const p = pillole();
    const j = p.indexOf(attuale);
    const azioni: Record<string, (() => void) | undefined> = {
      Escape: () => chiudi(true),
      ArrowDown: i >= 0 ? () => r[Math.min(i + 1, r.length - 1)]?.focus() : undefined,
      ArrowUp: i >= 0 ? () => (i === 0 ? campo.current?.focus() : r[i - 1]?.focus()) : undefined,
      Enter: i >= 0 && mostrati ? () => apri(mostrati[i]!) : undefined,
      Tab:
        j >= 0
          ? () =>
              e.shiftKey
                ? (j === 0 ? campo.current : p[j - 1])?.focus()
                : (j === p.length - 1 ? campo.current : p[j + 1])?.focus()
          : // Da un risultato: avanti i filtri, indietro il campo; il focus non esce dalla card.
            i >= 0
            ? () => (e.shiftKey ? campo.current : p[0])?.focus()
            : undefined,
    };
    const azione = azioni[e.key];
    if (!azione) return;
    e.preventDefault();
    azione();
  };

  const vociData = (
    valore: Periodo | null,
    imposta: (p: Periodo | null) => void,
    filtro: Filtro,
  ): VoceMenu[] => [
    {
      tipo: "voce",
      etichetta: "Qualsiasi data",
      spunta: valore === null,
      azione: () => imposta(null),
    },
    ...PERIODI.map((p): VoceMenu => ({
      tipo: "voce",
      etichetta: p.etichetta,
      spunta: stessoPeriodo(valore, p.valore),
      azione: () => imposta(p.valore),
    })),
    { tipo: "separatore" },
    {
      tipo: "voce",
      etichetta: "Scegli le date…",
      spunta: typeof valore === "object" && valore !== null,
      azione: () => menu && setCalendario({ filtro, ancora: menu.ancora }),
    },
  ];

  const vociTag = (): VoceMenu[] => {
    const cercato = cercaTag.trim().toLowerCase();
    const scelti = (nome: string) => tag.some((t) => t.toLowerCase() === nome.toLowerCase());
    const elenco = tuttiTag
      .filter((nome) => nome.toLowerCase().includes(cercato))
      .map((nome): VoceMenu => ({
        tipo: "voce",
        etichetta: nome,
        spunta: scelti(nome),
        restaAperto: true,
        azione: () =>
          setTag((t) =>
            scelti(nome) ? t.filter((x) => x.toLowerCase() !== nome.toLowerCase()) : [...t, nome],
          ),
      }));
    return [
      ...elenco,
      ...(tag.length > 0
        ? [
            { tipo: "separatore" } as VoceMenu,
            { tipo: "voce", etichetta: "Togli il filtro", azione: () => setTag([]) } as VoceMenu,
          ]
        : []),
    ];
  };

  const pillola = (filtro: Filtro, nome: string, attivo: boolean) => (
    <button
      type="button"
      key={filtro}
      className={`filtro-ricerca interfaccia-controllo ${attivo ? "filtro-ricerca-attivo" : ""}`}
      aria-haspopup="menu"
      aria-expanded={menu?.filtro === filtro}
      onClick={(e) => void apriMenu(filtro, e.currentTarget)}
    >
      {nome}
      <span className="filtro-ricerca-freccia" aria-hidden="true">
        <Icona di={ChevronDown} misura={12} />
      </span>
    </button>
  );

  const annuncio =
    mostrati === null
      ? ""
      : mostrati.length === 1
        ? "1 nota trovata"
        : `${mostrati.length} note trovate`;

  return (
    <div className="ricerca">
      <span className="ricerca-lente" aria-hidden="true">
        <Icona di={Search} />
      </span>
      <input
        ref={campo}
        className="ricerca-campo interfaccia-controllo"
        placeholder="Cerca nelle note"
        aria-label="Cerca nelle note"
        role="combobox"
        aria-expanded={aperta}
        aria-controls={idElenco}
        aria-describedby={`${idElenco}-annuncio`}
        value={testo}
        onFocus={entra}
        onClick={() => !aperta && entra()}
        onChange={(e) => {
          if (!aperta) entra();
          setTesto(e.target.value);
        }}
        onKeyDown={suTastoCampo}
      />
      {testo !== "" && (
        <button
          type="button"
          className="ricerca-cancella"
          aria-label="Cancella la ricerca"
          tabIndex={-1}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setTesto("")}
        >
          <Icona di={X} />
        </button>
      )}
      <span id={`${idElenco}-annuncio`} className="solo-lettori" aria-live="polite">
        {annuncio}
      </span>
      {aperta &&
        createPortal(
          <div
            ref={card}
            className="card-ricerca"
            role="dialog"
            aria-label="Risultati della ricerca"
            style={{ left: posizione.x, top: posizione.y }}
            onKeyDown={suTastoCard}
          >
            <div className="card-ricerca-filtri" role="group" aria-label="Filtri">
              {pillola("tag", nomeFiltroTag(tag), tag.length > 0)}
              {pillola(
                "creata",
                creata ? `Creazione: ${nomePeriodo(creata)}` : "Creazione",
                creata !== null,
              )}
              {pillola(
                "modificata",
                modificata ? `Modifica: ${nomePeriodo(modificata)}` : "Modifica",
                modificata !== null,
              )}
            </div>
            {mostrati !== null && (
              <>
                <div className="menu-separatore" role="separator" />
                {mostrati.length === 0 ? (
                  <div className="card-ricerca-vuota">
                    <span className="interfaccia-titolo">Nessuna nota trovata</span>
                    <span className="interfaccia-controllo">
                      Prova con un&apos;altra parola o togli un filtro.
                    </span>
                  </div>
                ) : (
                  <ul
                    id={idElenco}
                    className="card-ricerca-elenco"
                    role="listbox"
                    aria-label="Note trovate"
                  >
                    {mostrati.map((r) => {
                      const [prima, parola, dopo] = divisioneEstratto(r);
                      return (
                        <li
                          key={r.id}
                          role="option"
                          aria-selected={false}
                          tabIndex={-1}
                          className={`risultato-ricerca ${r.nelCestino ? "risultato-ricerca-cestino" : ""}`}
                          onClick={() => apri(r)}
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
                )}
              </>
            )}
          </div>,
          document.body,
        )}
      {menu && !calendario && (
        <Menu
          etichetta={
            menu.filtro === "tag"
              ? "Filtro Tag"
              : menu.filtro === "creata"
                ? "Filtro Creazione"
                : "Filtro Modifica"
          }
          x={menu.ancora.left}
          y={menu.ancora.bottom + DISTANZA_CARD}
          sopra={menu.ancora.top}
          voci={
            menu.filtro === "tag"
              ? vociTag()
              : menu.filtro === "creata"
                ? vociData(creata, setCreata, "creata")
                : vociData(modificata, setModificata, "modificata")
          }
          testata={
            menu.filtro === "tag" ? (
              <input
                className="ricerca-campo-tag interfaccia-controllo"
                placeholder="Cerca un tag"
                aria-label="Cerca un tag"
                value={cercaTag}
                autoFocus
                onChange={(e) => setCercaTag(e.target.value)}
                onKeyDown={(e) => {
                  // Il menu sta fuori dalla card: Tab lo chiude e il focus torna sul filtro.
                  if (e.key !== "Tab") return;
                  e.preventDefault();
                  chiudiMenu();
                }}
              />
            ) : undefined
          }
          onChiudi={chiudiMenu}
        />
      )}
      {calendario && (
        <Calendario
          valore={(() => {
            const v = calendario.filtro === "creata" ? creata : modificata;
            return typeof v === "object" && v !== null ? v.giorno : null;
          })()}
          ancora={calendario.ancora}
          onScegli={(giorno) => {
            const periodo = giorno ? { giorno } : null;
            if (calendario.filtro === "creata") setCreata(periodo);
            else setModificata(periodo);
            chiudiMenu();
          }}
          onChiudi={chiudiMenu}
        />
      )}
    </div>
  );
}
