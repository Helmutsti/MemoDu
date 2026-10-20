// Le viste di Brainet nell'area della nota (RF-18, DEC-145, DEC-147): il Journal (SC-10),
// Entità (SC-11), la pagina di un'entità (SC-13) e il Calendario (SC-12). Le note arrivano nel
// Journal con «Sposta in Brainet», o nascono lì con «Scrivi» (DEC-168), nella pagina nuova. Si aggiornano quando
// la sincronizzazione porta modifiche di Brainet (`versione` cambia).

import {
  BookOpen,
  Brain,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderInput,
  Image as ImageIcon,
  Lightbulb,
  Tag,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import {
  Fragment,
  useEffect,
  useState,
  type KeyboardEvent as EventoTastiera,
  type MouseEvent as EventoMouse,
  type ReactElement,
  type ReactNode,
} from "react";
import type { Nota } from "@memodu/condiviso";
import { api, ErroreApi } from "../api";
import { quando, scriviGiorno } from "../date";
import { CodaSalvataggio } from "../salvataggio";
import { AreaScorrevole } from "../componenti/AreaScorrevole";
import { FinestraConferma } from "../componenti/FinestraConferma";
import { Icona } from "../componenti/Icona";
import { Menu, type VoceMenu } from "../componenti/Menu";
import { Pallino } from "../componenti/Pallino";
import { Pulsante, PulsanteIcona } from "../componenti/Pulsante";
import { StatoVuoto } from "../componenti/StatoVuoto";
import {
  brainet,
  TITOLO_TIPO,
  type Entita,
  type PaginaEntita as DatiPagina,
  type StatoArea,
  type TipoEntita,
  type VoceEntita,
} from "./api";
import { EditorBrainet } from "./EditorBrainet";
import { coloreArea } from "./estensione";
import { pulisciDopo } from "./salvataggio";
import type { VistaBrainet } from "./SezioneBrainet";
import "../componenti/Ricerca.css";
import "./brainet.css";
import "./viste.css";

interface Proprieta {
  vista: VistaBrainet;
  /** Cambia quando la sincronizzazione porta modifiche di Brainet: le viste si rileggono. */
  versione: number;
  /** Esegue un comando: se non riesce, l'avviso o SC-07 come nel resto della finestra. */
  esegui: <T>(chiamata: () => Promise<T>) => Promise<T | undefined>;
  /** Un'entità senza foto valida e simili: l'avviso della finestra. */
  onAvviso: (testo: string) => void;
  /** Un'altra vista di Brainet: la pagina di un'entità, o di nuovo l'elenco (FL-26). */
  onApri: (vista: VistaBrainet) => void;
  /** Clic su un passaggio: la nota, con il cursore all'inizio del paragrafo (RB-124). */
  onApriNota: (id: string, inizio: number) => void;
  /** Una nota del Journal è andata nel Cestino: la colonna aggiorna il numero. */
  onCestino?: () => void;
}

export function VisteBrainet({
  vista,
  versione,
  esegui,
  onAvviso,
  onApri,
  onApriNota,
  onCestino = () => {},
}: Proprieta): ReactElement {
  if (vista === "journal")
    return (
      <Journal
        versione={versione}
        esegui={esegui}
        onAvviso={onAvviso}
        onApriEntita={(id) => onApri(`entita:${id}`)}
        onCestino={onCestino}
      />
    );
  if (vista.startsWith("scrivi:"))
    return (
      <PaginaNuova
        id={vista.slice("scrivi:".length)}
        esegui={esegui}
        onAvviso={onAvviso}
        onApriEntita={(id) => onApri(`entita:${id}`)}
      />
    );
  if (vista.startsWith("entita:"))
    return (
      <PaginaEntita
        id={vista.slice("entita:".length)}
        versione={versione}
        esegui={esegui}
        onIndietro={() => onApri("entita")}
        onApriNota={onApriNota}
      />
    );
  if (vista === "entita")
    return (
      <EntitaBrainet
        versione={versione}
        esegui={esegui}
        onAvviso={onAvviso}
        onApriEntita={(id) => onApri(`entita:${id}`)}
      />
    );
  return <CalendarioBrainet versione={versione} esegui={esegui} />;
}

type Esegui = Proprieta["esegui"];

// ——— Journal (SC-10, RB-131, DEC-147) ———

/** Sopra la nota del Journal: la data scelta in Info, se c'è, senza ora come nella pagina
 * dell'entità; se no il giorno e l'ora in cui è nata (RB-131). È la stessa data dell'ordine. */
export function quandoNota(nota: Nota, adesso = new Date()): string {
  if (!nota.creataScelta) return quando(nota.creata, adesso);
  const due = (n: number) => String(n).padStart(2, "0");
  const oggi = `${adesso.getFullYear()}-${due(adesso.getMonth() + 1)}-${due(adesso.getDate())}`;
  return nota.creataScelta === oggi ? "oggi" : `il ${scriviGiorno(nota.creataScelta)}`;
}

/** Una nota del Journal: il giorno e l'ora sopra, il testo che si modifica lì. */
function NotaDelJournal({
  nota,
  esegui,
  onMenu,
  onAvviso,
  onApriEntita,
}: {
  nota: Nota;
  esegui: Esegui;
  onMenu: (x: number, y: number) => void;
  onAvviso: (testo: string) => void;
  onApriEntita: (id: string) => void;
}): ReactElement {
  // Ogni nota si salva da sola, come quella aperta (RB-06); chiudendo il Journal si scrive
  // quello che aspetta e poi si puliscono gli allegati tolti (RB-121).
  const [coda] = useState(
    () =>
      new CodaSalvataggio(
        api.salva,
        () => {},
        // Come nel resto della finestra: l'avviso o SC-07 (RB-61).
        (e) => void esegui(() => Promise.reject(e)),
      ),
  );
  useEffect(() => () => pulisciDopo(coda.scarica()), [coda]);
  return (
    <li
      className="nota-journal"
      onContextMenu={(e) => {
        e.preventDefault();
        onMenu(e.clientX, e.clientY);
      }}
    >
      <span className="nota-journal-quando interfaccia-dettaglio">{quandoNota(nota)}</span>
      <EditorBrainet
        testo={nota.contenuto}
        onModifica={(contenuto) => coda.modifica(nota.id, { contenuto })}
        onAvviso={onAvviso}
        onApriEntita={onApriEntita}
      />
    </li>
  );
}

// ——— Scrivi (FL-29, RB-134, DEC-168) ———

/** La pagina nuova di «Scrivi»: il giorno e l'ora sopra, il cursore nel testo, niente titolo.
 * Lasciata vuota sparisce, come una nota vuota in CLOUD (RB-10). */
function PaginaNuova({
  id,
  esegui,
  onAvviso,
  onApriEntita,
}: {
  id: string;
  esegui: Esegui;
  onAvviso: (testo: string) => void;
  onApriEntita: (id: string) => void;
}): ReactElement {
  const [nota, setNota] = useState<Nota | null>(null);
  const [coda] = useState(
    () =>
      new CodaSalvataggio(
        api.salva,
        () => {},
        (e) => void esegui(() => Promise.reject(e)),
      ),
  );
  useEffect(() => {
    let vivo = true;
    void esegui(() => api.leggi(id)).then((n) => {
      if (vivo && n) setNota(n);
    });
    return () => {
      vivo = false;
    };
  }, [esegui, id]);
  // Chiudendo la pagina si scrive quello che aspetta; vuota se ne va (409 se c'è del testo).
  useEffect(
    () => () =>
      pulisciDopo(
        coda
          .scarica()
          .then(() => api.eliminaSeVuota(id))
          .catch(() => undefined),
      ),
    [coda, id],
  );
  if (!nota) return <div className="area-nota-vuota" />;
  return (
    <section className="vista-brainet" aria-label="Pagina nuova in Brainet">
      <AreaScorrevole className="vista-brainet-scorrimento">
        <div className="vista-brainet-corpo">
          <div className="nota-journal">
            <span className="nota-journal-quando interfaccia-dettaglio">{quandoNota(nota)}</span>
            <EditorBrainet
              testo={nota.contenuto}
              focus
              invito="Scrivi qui"
              onModifica={(contenuto) => coda.modifica(id, { contenuto })}
              onAvviso={onAvviso}
              onApriEntita={onApriEntita}
            />
          </div>
        </div>
      </AreaScorrevole>
    </section>
  );
}

function Journal({
  versione,
  esegui,
  onAvviso,
  onApriEntita,
  onCestino,
}: {
  versione: number;
  esegui: Esegui;
  onAvviso: (testo: string) => void;
  onApriEntita: (id: string) => void;
  onCestino: () => void;
}): ReactElement {
  const [note, setNote] = useState<Nota[] | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [rilette, setRilette] = useState(0);
  useEffect(() => {
    let vivo = true;
    void esegui(() => brainet.elencaJournal()).then((n) => {
      if (vivo && n) setNote(n);
    });
    return () => {
      vivo = false;
    };
  }, [esegui, versione, rilette]);

  if (note === null) return <div className="area-nota-vuota" />;
  if (note.length === 0) {
    return (
      <div className="area-nota-vuota">
        <StatoVuoto
          icona={BookOpen}
          titolo="Nessuna nota in Brainet"
          testo="Sposta una nota qui dal suo menu: tasto destro › «Sposta in Brainet»."
        />
      </div>
    );
  }
  const voci = (id: string): VoceMenu[] => [
    {
      tipo: "voce",
      etichetta: "Elimina",
      icona: Trash2,
      errore: true,
      azione: () =>
        void esegui(() => api.cestinaNota(id)).then(() => {
          onCestino();
          setRilette((n) => n + 1);
        }),
    },
  ];
  return (
    <section className="vista-brainet" aria-labelledby="journal-titolo">
      <AreaScorrevole className="vista-brainet-scorrimento">
        <div className="vista-brainet-corpo">
          <h1 id="journal-titolo" className="interfaccia-titolo-schermata">
            Journal
          </h1>
          <ul className="journal-elenco">
            {note.map((n) => (
              <NotaDelJournal
                key={`${n.id}:${versione}`}
                nota={n}
                esegui={esegui}
                onMenu={(x, y) => setMenu({ id: n.id, x, y })}
                onAvviso={onAvviso}
                onApriEntita={onApriEntita}
              />
            ))}
          </ul>
        </div>
      </AreaScorrevole>
      {menu && (
        <Menu
          voci={voci(menu.id)}
          etichetta="Nota in Brainet"
          x={menu.x}
          y={menu.y}
          onChiudi={() => setMenu(null)}
        />
      )}
    </section>
  );
}

// ——— Entità (SC-11) ———

const volte = (n: number) => (n === 1 ? "nominato 1 volta" : `nominato ${n} volte`);

/** «AAAA-MM-GG» come data del computer (il giorno della nota, RB-113). */
function data(giorno: string): Date {
  const [a, m, g] = giorno.split("-").map(Number);
  return new Date(a, m - 1, g);
}

/** «nominato 3 volte · ultima volta oggi» (CMP-41). */
function dettagliEntita(
  v: { nominata: number; ultimaVolta: string | null },
  adesso = new Date(),
): string {
  if (!v.ultimaVolta) return volte(v.nominata);
  const d = data(v.ultimaVolta);
  const oggi = d.toDateString() === adesso.toDateString();
  const giorno = d.toLocaleDateString("it-IT", { day: "numeric", month: "long" });
  return `${volte(v.nominata)} · ultima volta ${oggi ? "oggi" : `il ${giorno}`}`;
}

function EntitaBrainet({
  versione,
  esegui,
  onAvviso,
  onApriEntita,
}: {
  versione: number;
  esegui: Esegui;
  onAvviso: (testo: string) => void;
  onApriEntita: (id: string) => void;
}): ReactElement {
  const [voci, setVoci] = useState<VoceEntita[] | null>(null);
  const [rilette, setRilette] = useState(0);
  const [menu, setMenu] = useState<{ entita: Entita; x: number; y: number } | null>(null);
  const [unisci, setUnisci] = useState<{ entita: Entita; x: number; y: number } | null>(null);
  const [sceltaTipo, setSceltaTipo] = useState<{ entita: Entita; ancora: DOMRect } | null>(null);
  const [cerca, setCerca] = useState("");
  const [conferma, setConferma] = useState<{
    da: Entita;
    verso: Entita;
    citazioni: number;
    aree: number;
  } | null>(null);

  useEffect(() => {
    let vivo = true;
    void esegui(() => brainet.elencaEntita()).then((v) => {
      if (vivo && v) setVoci(v);
    });
    return () => {
      vivo = false;
    };
  }, [esegui, versione, rilette]);

  if (voci === null) return <div className="area-nota-vuota" />;
  if (voci.length === 0) {
    return (
      <div className="area-nota-vuota">
        <StatoVuoto
          icona={Brain}
          titolo="Nessuna entità"
          testo="Nascono quando scrivi @ in una nota."
        />
      </div>
    );
  }

  const vociMenu = (e: Entita, x: number, y: number): VoceMenu[] => [
    {
      tipo: "voce",
      etichetta: "Unisci a…",
      icona: FolderInput,
      azione: () => {
        setCerca("");
        setUnisci({ entita: e, x, y });
      },
    },
    {
      tipo: "voce",
      etichetta: "Scegli una foto…",
      icona: ImageIcon,
      // Un file che non è un'immagine: il suo messaggio, non quello generico (CA-18.13, DEC-141).
      azione: () =>
        void esegui(async () => {
          try {
            return await brainet.scegliFoto(e.id);
          } catch (errore) {
            if (errore instanceof ErroreApi && errore.stato === 400) {
              onAvviso(errore.message);
              return null;
            }
            throw errore;
          }
        }).then(() => setRilette((n) => n + 1)),
    },
    // Il tipo anche da qui: le persone nel cast non hanno la pillola (CMP-46).
    { tipo: "voce", etichetta: "Tipo", icona: Tag, sottomenu: vociTipo(e) },
  ];

  // Riga o volto: un clic apre la pagina dell'entità (FL-26), la pillola del tipo no; tasto destro
  // o il tasto Menu aprono il menu dell'entità.
  const apribile = (e: Entita) => ({
    onClick: (ev: EventoMouse<HTMLLIElement>) => {
      if ((ev.target as Element).closest("button")) return;
      onApriEntita(e.id);
    },
    onContextMenu: (ev: EventoMouse<HTMLLIElement>) => {
      ev.preventDefault();
      setMenu({ entita: e, x: ev.clientX, y: ev.clientY });
    },
    onKeyDown: (ev: EventoTastiera<HTMLLIElement>) => {
      if (ev.key === "Enter" && ev.target === ev.currentTarget) {
        ev.preventDefault();
        onApriEntita(e.id);
      } else if (ev.key === "ContextMenu" || (ev.shiftKey && ev.key === "F10")) {
        ev.preventDefault();
        const r = ev.currentTarget.getBoundingClientRect();
        setMenu({ entita: e, x: r.left, y: r.bottom });
      }
    },
  });

  // Clic sul tipo: i tipi nell'ordine di @, «Senza tipo» in fondo, spuntato quello attuale (RB-122).
  const vociTipo = (e: Entita): VoceMenu[] => {
    const voce = (tipo: TipoEntita | null): VoceMenu => ({
      tipo: "voce",
      etichetta: TITOLO_TIPO_SINGOLARE[tipo ?? "nessuno"],
      spunta: e.tipo === tipo,
      azione: () =>
        void esegui(() => brainet.impostaTipo(e.id, tipo)).then(() => setRilette((n) => n + 1)),
    });
    return [...TIPI_IN_ORDINE.map(voce), { tipo: "separatore" }, voce(null)];
  };

  // «Unisci a…»: le altre entità per tipo, con la ricerca in cima (CMP-11 Unisci a).
  const altre = unisci
    ? voci
        .map((v) => v.entita)
        .filter(
          (e) =>
            e.id !== unisci.entita.id && e.nome.toLowerCase().includes(cerca.trim().toLowerCase()),
        )
    : [];
  const vociUnisci: VoceMenu[] = [];
  for (const tipo of [...TIPI_IN_ORDINE, null]) {
    const gruppo = altre.filter((e) => e.tipo === tipo);
    if (!gruppo.length) continue;
    vociUnisci.push({ tipo: "titolo", etichetta: TITOLO_TIPO[tipo ?? "nessuno"] });
    for (const e of gruppo)
      vociUnisci.push({
        tipo: "voce",
        etichetta: e.nome,
        azione: () =>
          void esegui(() => brainet.anteprimaUnione(unisci!.entita.id, e.id)).then(
            (u) => u && setConferma({ da: unisci!.entita, verso: e, ...u }),
          ),
      });
  }

  const testoConferma = (c: NonNullable<typeof conferma>) => {
    const cit = c.citazioni === 1 ? "1 citazione" : `${c.citazioni} citazioni`;
    const aree = c.aree === 1 ? "1 area" : `${c.aree} aree`;
    // Una parte a zero non si scrive: «1 citazione passa…», non «1 citazione e 0 aree passa…».
    const parti = [c.citazioni && cit, c.aree && aree].filter(Boolean);
    const soggetto = parti.length ? parti.join(" e ") : `${cit} e ${aree}`;
    const verbo = parti.length === 1 && c.citazioni + c.aree === 1 ? "passa" : "passano";
    return `${soggetto} ${verbo} a «${c.verso.nome}», che tiene il suo nome. L'unione non si annulla.`;
  };

  return (
    <section className="vista-brainet" aria-labelledby="entita-titolo">
      <AreaScorrevole className="vista-brainet-scorrimento">
        <div className="vista-brainet-corpo">
          <h1 id="entita-titolo" className="interfaccia-titolo-schermata">
            Entità
          </h1>
          {[...TIPI_IN_ORDINE, null].map((tipo) => {
            const gruppo = voci.filter((v) => v.entita.tipo === tipo);
            if (!gruppo.length) return null;
            const titolo = TITOLO_TIPO[tipo ?? "nessuno"];
            return (
              <section key={tipo ?? "nessuno"} className="entita-gruppo" aria-label={titolo}>
                <h2 className="menu-titolo interfaccia-titolo-sezione">{titolo}</h2>
                {tipo === "persona" ? (
                  // Le persone come il cast di un film: foto tonda o iniziali, il nome sotto (CMP-46).
                  <ul className="entita-cast">
                    {gruppo.map((v) => (
                      <li
                        key={v.entita.id}
                        className="volto-entita"
                        tabIndex={0}
                        title={dettagliEntita(v)}
                        {...apribile(v.entita)}
                      >
                        {v.entita.foto ? (
                          <img
                            className="volto-entita-foto"
                            src={`data:image/jpeg;base64,${v.entita.foto}`}
                            alt=""
                          />
                        ) : (
                          <span
                            className="volto-entita-iniziali nota-sottotitolo"
                            aria-hidden="true"
                          >
                            {iniziali(v.entita.nome)}
                          </span>
                        )}
                        <span className="volto-entita-nome interfaccia-controllo">
                          {v.entita.nome}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="entita-elenco">
                    {gruppo.map((v) => {
                      const icona = ICONA_TIPO[v.entita.tipo ?? "nessuno"];
                      return (
                        <li
                          key={v.entita.id}
                          className="riga-entita riga-entita-apribile"
                          tabIndex={0}
                          {...apribile(v.entita)}
                        >
                          {v.entita.foto ? (
                            <img
                              className="riga-entita-foto"
                              src={`data:image/jpeg;base64,${v.entita.foto}`}
                              alt=""
                            />
                          ) : (
                            icona && (
                              <span className="riga-entita-icona" aria-hidden="true">
                                <Icona di={icona} misura={16} />
                              </span>
                            )
                          )}
                          <span className="riga-entita-testi">
                            <span className="interfaccia-controllo">{v.entita.nome}</span>
                            <span className="riga-entita-dettagli interfaccia-dettaglio">
                              {dettagliEntita(v)}
                            </span>
                          </span>
                          <button
                            type="button"
                            className="filtro-ricerca interfaccia-controllo"
                            aria-haspopup="menu"
                            aria-expanded={sceltaTipo?.entita.id === v.entita.id}
                            aria-label={`Tipo di ${v.entita.nome}: ${TITOLO_TIPO_SINGOLARE[v.entita.tipo ?? "nessuno"]}`}
                            onClick={(ev) =>
                              setSceltaTipo({
                                entita: v.entita,
                                ancora: ev.currentTarget.getBoundingClientRect(),
                              })
                            }
                          >
                            {TITOLO_TIPO_SINGOLARE[v.entita.tipo ?? "nessuno"]}
                            <span className="filtro-ricerca-freccia" aria-hidden="true">
                              <Icona di={ChevronDown} misura={12} />
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </AreaScorrevole>
      {menu && (
        <Menu
          voci={vociMenu(menu.entita, menu.x, menu.y)}
          etichetta={menu.entita.nome}
          x={menu.x}
          y={menu.y}
          onChiudi={() => setMenu(null)}
        />
      )}
      {sceltaTipo && (
        <Menu
          voci={vociTipo(sceltaTipo.entita)}
          etichetta={`Tipo di ${sceltaTipo.entita.nome}`}
          x={sceltaTipo.ancora.left}
          y={sceltaTipo.ancora.bottom + DISTANZA_MENU}
          sopra={sceltaTipo.ancora.top}
          onChiudi={() => setSceltaTipo(null)}
        />
      )}
      {unisci && !conferma && (
        <Menu
          voci={vociUnisci.length ? vociUnisci : [{ tipo: "titolo", etichetta: "Nessuna entità" }]}
          etichetta={`Unisci «${unisci.entita.nome}» a`}
          x={unisci.x}
          y={unisci.y}
          onChiudi={() => setUnisci(null)}
          testata={
            <input
              className="campo-ricerca-menu interfaccia-controllo"
              autoFocus
              placeholder="Cerca un'entità"
              aria-label="Cerca un'entità"
              value={cerca}
              onChange={(e) => setCerca(e.target.value)}
            />
          }
        />
      )}
      {conferma && (
        <FinestraConferma
          titolo={`Unire «${conferma.da.nome}» a «${conferma.verso.nome}»?`}
          testo={testoConferma(conferma)}
          azione="Unisci"
          onAnnulla={() => setConferma(null)}
          onConferma={() => {
            const { da, verso } = conferma;
            setConferma(null);
            setUnisci(null);
            void esegui(() => brainet.unisciEntita(da.id, verso.id)).then(() =>
              setRilette((n) => n + 1),
            );
          }}
        />
      )}
    </section>
  );
}

const TITOLO_TIPO_SINGOLARE: Record<keyof typeof TITOLO_TIPO, string> = {
  persona: "Persona",
  argomento: "Argomento",
  evento: "Evento",
  oggetto: "Oggetto",
  nessuno: "Senza tipo",
};

/** L'ordine dei tipi nel menu di @ (CMP-09 Suggerimenti), anche per «Unisci a…» e il tipo. */
const TIPI_IN_ORDINE: TipoEntita[] = ["persona", "argomento", "evento", "oggetto"];
/** L'icona della riga per tipo: calendario per gli eventi, lampadina per gli argomenti (SC-11). */
const ICONA_TIPO: Record<TipoEntita | "nessuno", LucideIcon | null> = {
  persona: null,
  argomento: Lightbulb,
  evento: Calendar,
  oggetto: null,
  nessuno: null,
};

/** «Luca Bianchi» → «LB», «Giorgio» → «G»: al posto della foto che manca (CMP-46). */
export function iniziali(nome: string): string {
  const parole = nome.trim().split(/\s+/).filter(Boolean);
  return parole
    .slice(0, 2)
    .map((p) => Array.from(p)[0] ?? "")
    .join("")
    .toLocaleUpperCase("it-IT");
}
/** Tra la pillola del tipo e il suo menu, come per i filtri della ricerca (CMP-13). */
const DISTANZA_MENU = 8;

// ——— La pagina dell'entità (SC-13, FL-26) ———

/** «Venerdì 16 ottobre», con l'anno se non è quello di oggi (CMP-39). */
/** Un mese della cronologia: «2026-10», il nome breve e quanti paragrafi (RB-133). */
export interface MeseCronologia {
  mese: string;
  etichetta: string;
  nome: string;
  paragrafi: number;
  /** Il giorno più recente del mese nell'elenco, dove porta il clic. */
  giorno: string | null;
}

/** I mesi dal primo all'ultimo con paragrafi, dal più vecchio; i mesi vuoti in mezzo restano. */
export function mesiCronologia(
  giorni: { giorno: string; passaggi: unknown[] }[],
): MeseCronologia[] {
  if (!giorni.length) return [];
  const conti = new Map<string, number>();
  const primo = new Map<string, string>();
  for (const g of giorni) {
    const m = g.giorno.slice(0, 7);
    conti.set(m, (conti.get(m) ?? 0) + g.passaggi.length);
    if (!primo.has(m) || g.giorno > primo.get(m)!) primo.set(m, g.giorno);
  }
  const ordinati = [...conti.keys()].sort();
  const [a1, m1] = ordinati[ordinati.length - 1].split("-").map(Number);
  const mesi: MeseCronologia[] = [];
  let [a, m] = ordinati[0].split("-").map(Number);
  while (a < a1 || (a === a1 && m <= m1)) {
    const chiave = `${a}-${String(m).padStart(2, "0")}`;
    const d = new Date(a, m - 1, 1);
    const breve = d.toLocaleDateString("it-IT", { month: "short" }).replace(".", "");
    mesi.push({
      mese: chiave,
      etichetta: `${breve} ${String(a).slice(2)}`,
      nome: d.toLocaleDateString("it-IT", { month: "long", year: "numeric" }),
      paragrafi: conti.get(chiave) ?? 0,
      giorno: primo.get(chiave) ?? null,
    });
    if (m === 12) {
      a += 1;
      m = 1;
    } else m += 1;
  }
  return mesi;
}

/** Tre misure del pallino: 1 paragrafo, da 2 a 4, 5 o più (CMP-47). */
const misuraPallino = (n: number) => (n >= 5 ? "molti" : n >= 2 ? "alcuni" : "uno");

/** CMP-47 Cronologia dell'entità: la striscia dei mesi sotto la testata (RB-133, DEC-150). */
function Cronologia({
  giorni,
}: {
  giorni: { giorno: string; passaggi: unknown[] }[];
}): ReactElement {
  const mesi = mesiCronologia(giorni);
  return (
    <ol
      className="cronologia"
      aria-label="Cronologia"
      // Parte dal mese più recente, a destra, se i mesi non ci stanno.
      ref={(el) => {
        if (el) el.scrollLeft = el.scrollWidth;
      }}
    >
      {mesi.map((m) => (
        <li key={m.mese}>
          {m.giorno ? (
            <button
              type="button"
              className="cronologia-mese"
              aria-label={`${m.nome}: ${m.paragrafi === 1 ? "1 paragrafo" : `${m.paragrafi} paragrafi`}`}
              onClick={() =>
                document
                  .getElementById(`giorno-${m.giorno}`)
                  ?.scrollIntoView?.({ block: "start", behavior: "smooth" })
              }
            >
              <span className="cronologia-posto" aria-hidden="true">
                <span className={`cronologia-pallino cronologia-${misuraPallino(m.paragrafi)}`} />
              </span>
              <span className="interfaccia-dettaglio">{m.etichetta}</span>
            </button>
          ) : (
            <span
              className="cronologia-mese cronologia-mese-vuoto"
              aria-label={`${m.nome}: nessun paragrafo`}
            >
              <span className="cronologia-posto" aria-hidden="true">
                <span className="cronologia-pallino cronologia-vuoto" />
              </span>
              <span className="interfaccia-dettaglio" aria-hidden="true">
                {m.etichetta}
              </span>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function titoloGiorno(giorno: string, adesso = new Date()): string {
  const d = data(giorno);
  const t = d.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(d.getFullYear() === adesso.getFullYear() ? {} : { year: "numeric" }),
  });
  return t[0].toUpperCase() + t.slice(1);
}

const SEGNI =
  /<cita e="([^"]+)">([^<]*)<\/cita>|<area id="([^"]+)"(?: s="([^"]*)")?(?: e="[^"]*")?>|<\/area id="([^"]+)">|<allegato id="[^"]+" f="[a-z]+">([^<]*)<\/allegato>/g;

/** Il testo che si legge, senza i simboli del Markdown: si legge soltanto (RB-124). */
function senzaMarkdown(testo: string, inizioRiga: boolean): string {
  let t = testo.replace(/\*\*|__|~~|<\/?u>/g, "").replace(/&lt;/g, "<");
  if (inizioRiga) t = t.replace(/^\s*(#{1,6}\s+|[-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d+[.)]\s+)/, "");
  return t;
}

/** Il paragrafo di un passaggio con le pillole, le aree e i pallini degli stati (CMP-38, CMP-40). */
function Paragrafo({
  testo,
  entita,
  stati,
}: {
  testo: string;
  entita: Record<string, Entita>;
  stati: StatoArea[];
}): ReactElement {
  const pezzi: ReactNode[] = [];
  const aperte = new Map<string, string[]>();
  const colori = Object.fromEntries(stati.map((s) => [s.id, s.colore]));
  let ultimo = 0;
  const testoPiano = (fino: number) => {
    if (fino <= ultimo) return;
    const t = senzaMarkdown(testo.slice(ultimo, fino), ultimo === 0);
    if (t)
      pezzi.push(
        aperte.size ? (
          // L'area prende il colore del primo stato della prima area aperta (CMP-40).
          <mark
            key={pezzi.length}
            className={`bn-area bn-area-${coloreArea([...aperte.values()][0] ?? [], colori)}`}
          >
            {t}
          </mark>
        ) : (
          t
        ),
      );
  };
  for (const m of testo.matchAll(SEGNI)) {
    testoPiano(m.index);
    ultimo = m.index + m[0].length;
    if (m[1]) {
      const e = entita[m[1]];
      pezzi.push(
        <span
          key={pezzi.length}
          className={`bn-collegamento interfaccia-dettaglio${e?.foto ? " bn-collegamento-foto" : ""}`}
        >
          {e?.foto && <img src={`data:image/jpeg;base64,${e.foto}`} alt="" />}
          {e?.nome ?? m[2]}
        </span>,
      );
    } else if (m[3]) {
      aperte.set(m[3], m[4] ? m[4].split(",").filter(Boolean) : []);
    } else if (m[5]) {
      // A fine area i pallini dei suoi stati.
      for (const id of aperte.get(m[5]) ?? []) {
        const s = stati.find((x) => x.id === id);
        if (s) pezzi.push(<Pallino key={pezzi.length} colore={s.colore} />);
      }
      aperte.delete(m[5]);
    } else {
      pezzi.push(
        <span
          key={pezzi.length}
          className="bn-collegamento bn-allegato-documento interfaccia-dettaglio"
        >
          <Icona di={FileText} />
          {m[6]}
        </span>,
      );
    }
  }
  testoPiano(testo.length);
  return <p className="passaggio-testo nota-corpo">{pezzi}</p>;
}

function PaginaEntita({
  id,
  versione,
  esegui,
  onIndietro,
  onApriNota,
}: {
  id: string;
  versione: number;
  esegui: Esegui;
  onIndietro: () => void;
  onApriNota: (id: string, inizio: number) => void;
}): ReactElement {
  const [pagina, setPagina] = useState<DatiPagina | null>(null);
  const [entita, setEntita] = useState<Record<string, Entita>>({});
  const [stati, setStati] = useState<StatoArea[]>([]);
  const [sceltaTipo, setSceltaTipo] = useState<DOMRect | null>(null);
  const [rilette, setRilette] = useState(0);

  useEffect(() => {
    let vivo = true;
    void esegui(() => brainet.passaggiEntita(id)).then((p) => {
      if (vivo && p) setPagina(p);
    });
    void brainet.elencaStati().then(
      (s) => vivo && setStati(s),
      () => undefined,
    );
    return () => {
      vivo = false;
    };
  }, [esegui, id, versione, rilette]);

  // Nomi e foto delle altre entità citate nei passaggi, per le loro pillole.
  useEffect(() => {
    if (!pagina) return;
    const ids = new Set<string>();
    for (const g of pagina.giorni)
      for (const p of g.passaggi)
        for (const m of p.testo.matchAll(/<cita e="([^"]+)">/g)) ids.add(m[1]);
    const mancanti = [...ids].filter((x) => !entita[x]);
    if (!mancanti.length) return;
    let vivo = true;
    void Promise.all(
      mancanti.map((x) =>
        brainet.leggiEntita(x).then(
          (e) => ({ ...e, id: x }),
          () => null,
        ),
      ),
    ).then((lette) => {
      if (!vivo) return;
      const valide = lette.filter((e): e is Entita => e !== null);
      setEntita((prima) => ({ ...prima, ...Object.fromEntries(valide.map((e) => [e.id, e])) }));
    });
    return () => {
      vivo = false;
    };
  }, [pagina, entita]);

  // Esc torna all'elenco, come «Entità» in cima.
  useEffect(() => {
    const suTasto = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !sceltaTipo && !e.defaultPrevented) onIndietro();
    };
    window.addEventListener("keydown", suTasto);
    return () => window.removeEventListener("keydown", suTasto);
  }, [onIndietro, sceltaTipo]);

  if (!pagina) return <div className="area-nota-vuota" />;
  const e = pagina.entita;
  const tipo = TITOLO_TIPO_SINGOLARE[e.tipo ?? "nessuno"];
  const vociTipo: VoceMenu[] = [
    ...[...TIPI_IN_ORDINE, null].map((t): VoceMenu => ({
      tipo: "voce",
      etichetta: TITOLO_TIPO_SINGOLARE[t ?? "nessuno"],
      spunta: e.tipo === t,
      azione: () =>
        void esegui(() => brainet.impostaTipo(e.id, t)).then(() => setRilette((n) => n + 1)),
    })),
  ];
  vociTipo.splice(TIPI_IN_ORDINE.length, 0, { tipo: "separatore" });
  const dettagli = pagina.nominata
    ? `${pagina.nominata === 1 ? "Nominata 1 volta" : `Nominata ${pagina.nominata} volte`}${
        pagina.ultimaVolta
          ? ` · l'ultima il ${data(pagina.ultimaVolta).toLocaleDateString("it-IT")}`
          : ""
      }`
    : "Mai nominata";
  return (
    <section className="vista-brainet" aria-labelledby="pagina-entita-titolo">
      <AreaScorrevole className="vista-brainet-scorrimento">
        <div className="vista-brainet-corpo pagina-entita">
          {/* CMP-45 Testata dell'entità */}
          <header className="testata-entita">
            <Pulsante tipo="tenue" icona={<Icona di={ChevronLeft} />} onClick={onIndietro}>
              Entità
            </Pulsante>
            <div className="testata-entita-nome">
              {e.foto && (
                <img
                  className="testata-entita-foto"
                  src={`data:image/jpeg;base64,${e.foto}`}
                  alt=""
                />
              )}
              <h1 id="pagina-entita-titolo" className="interfaccia-titolo-schermata">
                {e.nome}
              </h1>
              <button
                type="button"
                className="filtro-ricerca interfaccia-controllo"
                aria-haspopup="menu"
                aria-expanded={sceltaTipo !== null}
                aria-label={`Tipo di ${e.nome}: ${tipo}`}
                onClick={(ev) => setSceltaTipo(ev.currentTarget.getBoundingClientRect())}
              >
                {tipo}
                <span className="filtro-ricerca-freccia" aria-hidden="true">
                  <Icona di={ChevronDown} misura={12} />
                </span>
              </button>
            </div>
            <span className="testata-entita-dettagli interfaccia-dettaglio">{dettagli}</span>
          </header>
          {pagina.giorni.length > 0 && <Cronologia giorni={pagina.giorni} />}
          {pagina.giorni.length === 0 ? (
            <div className="pagina-entita-vuota">
              <StatoVuoto
                icona={Brain}
                titolo={`Nessuna nota parla ancora di «${e.nome}».`}
                testo="Scrivi @ in una nota per citarla."
              />
            </div>
          ) : (
            <ul className="passaggi">
              {pagina.giorni.map((g) => (
                <Fragment key={g.giorno}>
                  <li
                    id={`giorno-${g.giorno}`}
                    className="menu-titolo interfaccia-titolo-sezione"
                    role="presentation"
                  >
                    {titoloGiorno(g.giorno)}
                  </li>
                  {g.passaggi.map((p) => (
                    <li key={`${p.nota}:${p.inizio}`}>
                      <button
                        type="button"
                        className="passaggio"
                        onClick={() => onApriNota(p.nota, p.inizio)}
                      >
                        <span className="passaggio-quando interfaccia-dettaglio">
                          {p.ora ? `${p.titolo} · ${p.ora}` : p.titolo}
                        </span>
                        <Paragrafo
                          testo={p.testo}
                          entita={{ ...entita, [e.id]: e }}
                          stati={stati}
                        />
                      </button>
                    </li>
                  ))}
                </Fragment>
              ))}
            </ul>
          )}
        </div>
      </AreaScorrevole>
      {sceltaTipo && (
        <Menu
          voci={vociTipo}
          etichetta={`Tipo di ${e.nome}`}
          x={sceltaTipo.left}
          y={sceltaTipo.bottom + DISTANZA_MENU}
          sopra={sceltaTipo.top}
          onChiudi={() => setSceltaTipo(null)}
        />
      )}
    </section>
  );
}

// ——— Calendario (SC-12) ———

const GIORNI = ["L", "M", "M", "G", "V", "S", "D"];
const due = (n: number) => String(n).padStart(2, "0");

function CalendarioBrainet({
  versione,
  esegui,
}: {
  versione: number;
  esegui: Esegui;
}): ReactElement {
  const oggi = new Date();
  const [mese, setMese] = useState(() => new Date(oggi.getFullYear(), oggi.getMonth(), 1));
  const [giorni, setGiorni] = useState<Set<string>>(new Set());
  const chiave = `${mese.getFullYear()}-${due(mese.getMonth() + 1)}`;

  useEffect(() => {
    let vivo = true;
    void esegui(() => brainet.calendario(chiave)).then((g) => {
      if (vivo && g) setGiorni(new Set(g.map((x) => x.giorno)));
    });
    return () => {
      vivo = false;
    };
  }, [esegui, chiave, versione]);

  const primo = (mese.getDay() + 6) % 7;
  const giorniMese = new Date(mese.getFullYear(), mese.getMonth() + 1, 0).getDate();
  const celle: (number | null)[] = [
    ...Array<null>(primo).fill(null),
    ...Array.from({ length: giorniMese }, (_, i) => i + 1),
  ];
  while (celle.length % 7) celle.push(null);
  const settimane = Array.from({ length: celle.length / 7 }, (_, i) =>
    celle.slice(i * 7, i * 7 + 7),
  );
  const oggiChiave = `${oggi.getFullYear()}-${due(oggi.getMonth() + 1)}-${due(oggi.getDate())}`;
  const nome = mese.toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  return (
    <section className="vista-brainet" aria-labelledby="calendario-titolo">
      <AreaScorrevole className="vista-brainet-scorrimento">
        <div className="vista-brainet-corpo">
          <h1 id="calendario-titolo" className="interfaccia-titolo-schermata">
            Calendario
          </h1>
          <div className="calendario-brainet">
            <div className="calendario-brainet-mese">
              <PulsanteIcona
                nome="Mese prima"
                icona={<Icona di={ChevronLeft} />}
                onClick={() => setMese(new Date(mese.getFullYear(), mese.getMonth() - 1, 1))}
              />
              <span className="interfaccia-controllo-attivo">
                {nome[0].toUpperCase() + nome.slice(1)}
              </span>
              <PulsanteIcona
                nome="Mese dopo"
                icona={<Icona di={ChevronRight} />}
                onClick={() => setMese(new Date(mese.getFullYear(), mese.getMonth() + 1, 1))}
              />
            </div>
            <table className="calendario-brainet-giorni" aria-label={`Note di ${nome}`}>
              <thead>
                <tr>
                  {GIORNI.map((g, i) => (
                    <th key={i} scope="col" className="interfaccia-titolo-sezione">
                      {g}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {settimane.map((s, i) => (
                  <tr key={i}>
                    {s.map((g, j) => {
                      if (g === null) return <td key={j} />;
                      const k = `${chiave}-${due(g)}`;
                      const conNote = giorni.has(k);
                      const stato = k === oggiChiave ? "oggi" : k > oggiChiave ? "futuro" : "";
                      return (
                        <td key={j} aria-label={conNote ? `${g}: con note` : String(g)}>
                          <span
                            className={`giorno-brainet ${stato ? `giorno-brainet-${stato}` : ""}`}
                          >
                            <span className="giorno-brainet-numero interfaccia-controllo">{g}</span>
                            <span className="giorno-brainet-pallini" aria-hidden="true">
                              {/* Un pallino solo per giorno (RB-113). */}
                              {conNote && <span className="giorno-brainet-pallino" />}
                            </span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AreaScorrevole>
    </section>
  );
}
