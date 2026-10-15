// Le viste di Brainet nell'area della nota (RF-18): il foglio nuovo (SC-01), il Database (SC-10),
// Entità (SC-11) e il Calendario (SC-12). Si aggiornano quando la sincronizzazione porta modifiche
// di Brainet (`versione` cambia).

import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Database,
  FolderInput,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { quando } from "../date";
import { AreaScorrevole } from "../componenti/AreaScorrevole";
import { FinestraConferma } from "../componenti/FinestraConferma";
import { Icona } from "../componenti/Icona";
import { Menu, type VoceMenu } from "../componenti/Menu";
import { PulsanteIcona } from "../componenti/Pulsante";
import { StatoVuoto } from "../componenti/StatoVuoto";
import { Tag } from "../componenti/Tag";
import { brainet, TITOLO_TIPO, type Entita, type Frammento, type VoceEntita } from "./api";
import { EditorBrainet } from "./EditorBrainet";
import { pulisciDopo, SalvaFrammento } from "./salvataggio";
import type { VistaBrainet } from "./SezioneBrainet";
import "./viste.css";

interface Proprieta {
  vista: VistaBrainet;
  /** Cambia quando la sincronizzazione porta modifiche di Brainet: le viste si rileggono. */
  versione: number;
  /** Esegue un comando: se non riesce, l'avviso o SC-07 come nel resto della finestra. */
  esegui: <T>(chiamata: () => Promise<T>) => Promise<T | undefined>;
  /** Una nota è andata nel Cestino: la colonna aggiorna il numero. */
  onCestino: () => void;
  /** Un allegato che non entra o non si apre: l'avviso della finestra. */
  onAvviso: (testo: string) => void;
}

export function VisteBrainet({
  vista,
  versione,
  esegui,
  onCestino,
  onAvviso,
}: Proprieta): ReactElement {
  if (vista === "foglio") return <FoglioNuovo esegui={esegui} onAvviso={onAvviso} />;
  if (vista === "database")
    return (
      <DatabaseBrainet
        versione={versione}
        esegui={esegui}
        onCestino={onCestino}
        onAvviso={onAvviso}
      />
    );
  if (vista === "entita") return <EntitaBrainet versione={versione} esegui={esegui} />;
  return <CalendarioBrainet versione={versione} esegui={esegui} />;
}

type Esegui = Proprieta["esegui"];

// ——— Foglio nuovo (RB-101, RB-102) ———

function FoglioNuovo({
  esegui,
  onAvviso,
}: {
  esegui: Esegui;
  onAvviso: (testo: string) => void;
}): ReactElement {
  const [salva] = useState(() => new SalvaFrammento(null, esegui));
  // Chiudendo il foglio si scrive quello che aspetta, poi via gli allegati tolti.
  useEffect(() => () => pulisciDopo(salva.scarica()), [salva]);
  return (
    <article className="nota-aperta">
      <AreaScorrevole className="nota-aperta-scorrimento">
        <div className="nota-aperta-corpo">
          <div className="nota-aperta-misura">
            <EditorBrainet
              testo=""
              focus
              onModifica={(t) => salva.modifica(t)}
              onAvviso={onAvviso}
            />
          </div>
        </div>
      </AreaScorrevole>
    </article>
  );
}

// ——— Database (SC-10) ———

/** Una nota del Database: il giorno e l'ora, sotto il testo che si modifica (RB-103). */
function NotaDelDatabase({
  frammento,
  esegui,
  onMenu,
  onAvviso,
}: {
  frammento: Frammento;
  esegui: Esegui;
  onMenu: (x: number, y: number) => void;
  onAvviso: (testo: string) => void;
}): ReactElement {
  const [salva] = useState(() => new SalvaFrammento(frammento.id, esegui));
  useEffect(() => () => pulisciDopo(salva.scarica()), [salva]);
  return (
    <li
      className="nota-database"
      onContextMenu={(e) => {
        e.preventDefault();
        onMenu(e.clientX, e.clientY);
      }}
    >
      <span className="nota-database-quando interfaccia-dettaglio">{quando(frammento.natoIl)}</span>
      <EditorBrainet
        testo={frammento.testo}
        onModifica={(t) => salva.modifica(t)}
        onAvviso={onAvviso}
      />
    </li>
  );
}

function DatabaseBrainet({
  versione,
  esegui,
  onCestino,
  onAvviso,
}: {
  versione: number;
  esegui: Esegui;
  onCestino: () => void;
  onAvviso: (testo: string) => void;
}): ReactElement {
  const [note, setNote] = useState<Frammento[] | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [rilette, setRilette] = useState(0);

  useEffect(() => {
    let vivo = true;
    void esegui(() => brainet.elencaFrammenti()).then((f) => {
      if (vivo && f) setNote(f);
    });
    return () => {
      vivo = false;
    };
  }, [esegui, versione, rilette]);

  // Le pagine dopo la prima, quando si arriva in fondo.
  const fondo = useRef<HTMLDivElement>(null);
  const finite = useRef(false);
  const altre = useCallback(async () => {
    if (!note?.length || finite.current) return;
    const dopo = await esegui(() => brainet.elencaFrammenti(note[note.length - 1].natoIl));
    if (!dopo?.length) finite.current = true;
    else setNote((n) => [...(n ?? []), ...dopo]);
  }, [esegui, note]);
  useEffect(() => {
    const el = fondo.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const osserva = new IntersectionObserver(
      (v) => v.some((x) => x.isIntersecting) && void altre(),
    );
    osserva.observe(el);
    return () => osserva.disconnect();
  }, [altre]);

  if (note === null) return <div className="area-nota-vuota" />;
  if (note.length === 0) {
    return (
      <div className="area-nota-vuota">
        <StatoVuoto
          icona={Database}
          titolo="Nessuna nota Brainet"
          testo="Scrivi la prima con il + accanto a Brainet."
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
        void esegui(() => brainet.eliminaFrammento(id)).then(() => {
          onCestino();
          setRilette((n) => n + 1);
        }),
    },
  ];
  return (
    <section className="vista-brainet" aria-labelledby="database-titolo">
      <AreaScorrevole className="vista-brainet-scorrimento">
        <div className="vista-brainet-corpo">
          <h1 id="database-titolo" className="interfaccia-titolo-schermata">
            Database
          </h1>
          <ul className="database-elenco">
            {note.map((f) => (
              <NotaDelDatabase
                key={`${f.id}:${f.modificatoIl}:${versione}`}
                frammento={f}
                esegui={esegui}
                onMenu={(x, y) => setMenu({ id: f.id, x, y })}
                onAvviso={onAvviso}
              />
            ))}
          </ul>
          <div ref={fondo} />
        </div>
      </AreaScorrevole>
      {menu && (
        <Menu
          voci={voci(menu.id)}
          etichetta="Nota Brainet"
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

/** «nominato 3 volte · ultima volta oggi» (CMP-41). */
function dettagliEntita(v: VoceEntita, adesso = new Date()): string {
  if (!v.ultimaVolta) return volte(v.nominata);
  const d = new Date(v.ultimaVolta);
  const oggi = d.toDateString() === adesso.toDateString();
  const giorno = d.toLocaleDateString("it-IT", { day: "numeric", month: "long" });
  return `${volte(v.nominata)} · ultima volta ${oggi ? "oggi" : `il ${giorno}`}`;
}

function EntitaBrainet({ versione, esegui }: { versione: number; esegui: Esegui }): ReactElement {
  const [voci, setVoci] = useState<VoceEntita[] | null>(null);
  const [rilette, setRilette] = useState(0);
  const [menu, setMenu] = useState<{ entita: Entita; x: number; y: number } | null>(null);
  const [unisci, setUnisci] = useState<{ entita: Entita; x: number; y: number } | null>(null);
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
          testo="Nascono quando scrivi @ in una nota Brainet."
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
      azione: () =>
        void esegui(() => brainet.scegliFoto(e.id)).then(() => setRilette((n) => n + 1)),
    },
  ];

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
  for (const tipo of ["persona", "argomento", "evento", "oggetto", null] as const) {
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
    const verbo = c.citazioni + c.aree === 1 ? "passa" : "passano";
    return `${cit} e ${aree} ${verbo} a «${c.verso.nome}», che tiene il suo nome. L'unione non si annulla.`;
  };

  return (
    <section className="vista-brainet" aria-labelledby="entita-titolo">
      <AreaScorrevole className="vista-brainet-scorrimento">
        <div className="vista-brainet-corpo">
          <h1 id="entita-titolo" className="interfaccia-titolo-schermata">
            Entità
          </h1>
          <ul className="entita-elenco">
            {voci.map((v) => (
              <li
                key={v.entita.id}
                className="riga-entita"
                tabIndex={0}
                onContextMenu={(ev) => {
                  ev.preventDefault();
                  setMenu({ entita: v.entita, x: ev.clientX, y: ev.clientY });
                }}
                onKeyDown={(ev) => {
                  if (ev.key === "ContextMenu" || (ev.shiftKey && ev.key === "F10")) {
                    ev.preventDefault();
                    const r = ev.currentTarget.getBoundingClientRect();
                    setMenu({ entita: v.entita, x: r.left, y: r.bottom });
                  }
                }}
              >
                {v.entita.foto && (
                  <img
                    className="riga-entita-foto"
                    src={`data:image/jpeg;base64,${v.entita.foto}`}
                    alt=""
                  />
                )}
                <span className="riga-entita-testi">
                  <span className="interfaccia-controllo">{v.entita.nome}</span>
                  <span className="riga-entita-dettagli interfaccia-dettaglio">
                    {dettagliEntita(v)}
                  </span>
                </span>
                <Tag nome={TITOLO_TIPO_SINGOLARE[v.entita.tipo ?? "nessuno"]} />
              </li>
            ))}
          </ul>
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
  const [note, setNote] = useState<Record<string, number>>({});
  const chiave = `${mese.getFullYear()}-${due(mese.getMonth() + 1)}`;

  useEffect(() => {
    let vivo = true;
    void esegui(() => brainet.calendario(chiave)).then((g) => {
      if (vivo && g) setNote(Object.fromEntries(g.map((x) => [x.giorno, x.note])));
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
                      const n = note[k] ?? 0;
                      const stato = k === oggiChiave ? "oggi" : k > oggiChiave ? "futuro" : "";
                      return (
                        <td
                          key={j}
                          aria-label={n ? `${g}: ${n === 1 ? "1 nota" : `${n} note`}` : String(g)}
                        >
                          <span
                            className={`giorno-brainet ${stato ? `giorno-brainet-${stato}` : ""}`}
                          >
                            <span className="giorno-brainet-numero interfaccia-controllo">{g}</span>
                            <span className="giorno-brainet-pallini" aria-hidden="true">
                              {Array.from({ length: Math.min(n, 3) }, (_, x) => (
                                <span key={x} className="giorno-brainet-pallino" />
                              ))}
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
