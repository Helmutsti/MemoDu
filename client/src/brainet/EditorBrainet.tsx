// L'editor di una nota Brainet (RF-18): l'editor delle note in vista Testo, senza il Markdown (scelta di
// Manuel Cucca del 15/10/2026), con il compartimento Brainet (estensione.ts), il menu di @ (CMP-09 Suggerimenti), il menu dell'area (CMP-09 Area),
// la Linguetta (CMP-40) e gli allegati (CMP-09 Allegato, Foto allegata, Dimensioni; RB-114 …
// RB-121). Lo usano il foglio nuovo e il Database.

import type { EditorView } from "@codemirror/view";
import { listen } from "@tauri-apps/api/event";
import {
  ChevronDown,
  Eye,
  FolderOpen,
  Image as IconaImmagine,
  Paperclip,
  Plus,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { ErroreApi } from "../api";
import { Editor } from "../editor/Editor";
import { IN_TAURI } from "../finestra";
import { EVENTO_RILASCIO, ZONA_RILASCIO, type FileRilasciati } from "../locale/rilascio";
import { Icona } from "../componenti/Icona";
import { Menu, type VoceMenu } from "../componenti/Menu";
import { Pallino } from "../componenti/Pallino";
import {
  brainet,
  eFoto,
  TITOLO_TIPO,
  type Allegato,
  type Entita,
  type StatoArea,
  type TipoEntita,
} from "./api";
import {
  aggiornaAllegati,
  aggiornaArea,
  aggiornaEntita,
  cambiaForma,
  creaArea,
  estensioneBrainet,
  inserisciAllegato,
  inserisciCitazione,
  togliAllegato,
  EVENTO_FILE,
  type Ascolto,
  type FileIncollati,
  type VistaAllegato,
} from "./estensione";
import { legamiArea, leggiAllegati, leggiSegni, testoSemplice, type FormaAllegato } from "./segni";
import "./brainet.css";

interface Proprieta {
  testo: string;
  onModifica: (testo: string) => void;
  focus?: boolean;
  etichetta?: string;
  invito?: string;
  /** Un allegato che non entra o non si apre: l'avviso della finestra (SF-17, SF-21, SF-37). */
  onAvviso?: (testo: string) => void;
}

type Chiocciola = Parameters<Ascolto["onChiocciola"]>[0];
type Selezione = Parameters<Ascolto["onSelezione"]>[0];
type Sopra = NonNullable<Parameters<Ascolto["onAreaSopra"]>[0]>;
/** Il menu di un allegato aperto (RB-119). */
type MenuAllegato = Parameters<Ascolto["onAllegato"]>[0];
/** L'area sotto il mouse; `tenuta` mentre il mouse è sulla Linguetta. */
type Linguetta = (Sopra & { tenuta: boolean }) | null;

/** Il menu dell'area aperto: su una selezione nuova o su un'area che c'è (freccia della Linguetta). */
interface MenuArea {
  /** null finché la selezione non è diventata un'area. */
  id: string | null;
  da: number;
  a: number;
  /** La frase, per «Crea «…»». */
  frase: string;
  x: number;
  y: number;
  sopra: number;
}

const ORDINE_TIPI: (TipoEntita | null)[] = ["persona", "argomento", "evento", "oggetto", null];
/** Nome di un'entità nata da una selezione: come nel nucleo, al massimo 200 caratteri (EN-13). */
const LUNGHEZZA_NOME = 200;
/** Il mouse passa dall'area alla Linguetta senza farla sparire. */
const RITARDO_LINGUETTA = 250;

export const AVVISO_GRANDE = "Il file supera 25 MB: non si può allegare.";
export const AVVISO_TIPO =
  "Si allegano solo foto e documenti (JPG, PNG, PDF, Word, Excel, PowerPoint, testo).";
const AVVISO_LETTURA = "Non riesco a leggere il file.";
const AVVISO_RETE = "Non riesco a scaricare l'allegato. Riprova quando c'è la rete.";
const DIMENSIONI: { forma: FormaAllegato; etichetta: string }[] = [
  { forma: "piccola", etichetta: "Piccola" },
  { forma: "media", etichetta: "Media" },
  { forma: "grande", etichetta: "Grande" },
];

/** Il testo dell'avviso per un allegato che non entra o non si apre. */
function avvisoAllegato(errore: unknown): string {
  if (!(errore instanceof ErroreApi)) return AVVISO_LETTURA;
  if (errore.stato === 413) return AVVISO_GRANDE;
  if (errore.stato === 503) return AVVISO_RETE;
  if (errore.stato === 400) return errore.message === AVVISO_TIPO ? AVVISO_TIPO : errore.message;
  return AVVISO_LETTURA;
}

/** Le entità per tipo, con il titolo sopra ogni gruppo (CMP-09 Suggerimenti). */
function vociPerTipo(entita: Entita[], voce: (e: Entita) => VoceMenu): VoceMenu[] {
  const voci: VoceMenu[] = [];
  for (const tipo of ORDINE_TIPI) {
    const gruppo = entita.filter((e) => e.tipo === tipo);
    if (!gruppo.length) continue;
    voci.push({ tipo: "titolo", etichetta: TITOLO_TIPO[tipo ?? "nessuno"] });
    voci.push(...gruppo.map(voce));
  }
  return voci;
}

const eFotoForma = (forma: FormaAllegato) => forma !== "documento";

function abbrevia(testo: string, quanti = 30): string {
  const t = testo.replace(/\s+/g, " ").trim();
  return t.length > quanti ? `${t.slice(0, quanti)}…` : t;
}

/** Chi ascolta l'editor: solo funzioni che cambiano lo stato, così le estensioni nascono una volta. */
function creaAscolto(
  setChiocciola: (q: Chiocciola) => void,
  setSelezione: (s: Selezione) => void,
  setLinguetta: (l: Linguetta | ((prima: Linguetta) => Linguetta)) => void,
  setMenuAllegato: (m: MenuAllegato | null) => void,
): Ascolto {
  let timer: number | undefined;
  return {
    onChiocciola: setChiocciola,
    onSelezione: setSelezione,
    onAllegato: setMenuAllegato,
    onAreaSopra: (a) => {
      window.clearTimeout(timer);
      if (a) setLinguetta({ ...a, tenuta: false });
      else
        timer = window.setTimeout(
          () => setLinguetta((prima) => (prima?.tenuta ? prima : null)),
          RITARDO_LINGUETTA,
        );
    },
  };
}

export function EditorBrainet({
  testo,
  onModifica,
  focus = false,
  etichetta = "Testo della nota Brainet",
  invito = "Scrivi un pensiero…",
  onAvviso = () => {},
}: Proprieta): ReactElement {
  const [view, setView] = useState<EditorView | null>(null);
  const [testoAttuale, setTestoAttuale] = useState(testo);
  const [entita, setEntita] = useState<Record<string, Entita>>({});
  const [stati, setStati] = useState<StatoArea[]>([]);
  const [chiocciola, setChiocciola] = useState<Chiocciola>(null);
  const [chiusaA, setChiusaA] = useState<number | null>(null);
  const [suggerite, setSuggerite] = useState<Entita[]>([]);
  const [selezione, setSelezione] = useState<Selezione>(null);
  const [menuArea, setMenuArea] = useState<MenuArea | null>(null);
  const [perArea, setPerArea] = useState<Entita[]>([]);
  const [linguetta, setLinguetta] = useState<Linguetta>(null);
  const [menuAllegato, setMenuAllegato] = useState<MenuAllegato | null>(null);
  const [allegati, setAllegati] = useState<Record<string, VistaAllegato | null>>({});
  const [estensioni] = useState(() =>
    estensioneBrainet(creaAscolto(setChiocciola, setSelezione, setLinguetta, setMenuAllegato)),
  );

  // Nomi e foto delle entità citate o legate a un'area, dal nucleo: seguono le unioni (RB-108).
  const ricordaEntita = useCallback((nuove: Entita[]) => {
    if (!nuove.length) return;
    setEntita((prima) => ({ ...prima, ...Object.fromEntries(nuove.map((e) => [e.id, e])) }));
  }, []);
  useEffect(() => {
    // Le citate e quelle legate solo a un'area: i loro nomi servono anche alla Linguetta.
    const { citazioni, aree } = leggiSegni(testoAttuale);
    const ids = [
      ...new Set([...citazioni.map((c) => c.entita), ...aree.flatMap((a) => a.entita)]),
    ].filter((id) => !entita[id]);
    if (!ids.length) return;
    let vivo = true;
    void Promise.all(
      ids.map((id) =>
        brainet.leggiEntita(id).then(
          // Si ricorda con l'id citato, anche se l'entità è stata unita a un'altra.
          (e) => ({ ...e, id }),
          () => null,
        ),
      ),
    ).then((lette) => {
      if (vivo) ricordaEntita(lette.filter((e): e is Entita => e !== null));
    });
    return () => {
      vivo = false;
    };
  }, [testoAttuale, entita, ricordaEntita]);
  useEffect(() => {
    view?.dispatch({
      effects: aggiornaEntita.of(
        Object.fromEntries(
          Object.entries(entita).map(([id, e]) => [id, { nome: e.nome, foto: e.foto }]),
        ),
      ),
    });
  }, [view, entita]);

  useEffect(() => {
    void brainet.elencaStati().then(setStati, () => setStati([]));
  }, []);

  // ——— Allegati ———

  // Tipo e anteprima degli allegati nel testo, dal nucleo; tolto altrove: null (SF-20).
  useEffect(() => {
    const ids = [...new Set(leggiAllegati(testoAttuale).map((s) => s.id))].filter(
      (id) => !(id in allegati),
    );
    if (!ids.length) return;
    let vivo = true;
    void Promise.all(
      ids.map((id) =>
        brainet.leggiAllegato(id).then(
          (i): [string, VistaAllegato | null] => [id, { tipo: i.tipo, anteprima: i.anteprima }],
          (e): [string, VistaAllegato | null] | null =>
            e instanceof ErroreApi && e.stato === 404 ? [id, null] : null,
        ),
      ),
    ).then((letti) => {
      const validi = letti.filter((l) => l !== null);
      if (vivo && validi.length) setAllegati((p) => ({ ...p, ...Object.fromEntries(validi) }));
    });
    return () => {
      vivo = false;
    };
  }, [testoAttuale, allegati]);
  useEffect(() => {
    view?.dispatch({ effects: aggiornaAllegati.of(allegati) });
  }, [view, allegati]);
  // Una foto scaricata (RB-118): si rilegge, e compare da sola.
  useEffect(() => {
    if (!IN_TAURI) return;
    const promessa = listen<{ id: string }>("allegato-pronto", (e) =>
      setAllegati((p) =>
        Object.fromEntries(Object.entries(p).filter(([id]) => id !== e.payload.id)),
      ),
    );
    return () => void promessa.then((togli) => togli());
  }, []);

  /** Allega uno dopo l'altro; se qualcuno non entra, un avviso solo (FL-23). */
  const allega = async (chiamate: (() => Promise<Allegato | null>)[], da: number, a: number) => {
    if (!view) return;
    let avviso: string | null = null;
    let [dove, fino] = [da, a];
    for (const chiama of chiamate) {
      try {
        const nuovo = await chiama();
        if (!nuovo) continue;
        setAllegati((p) => ({
          ...p,
          [nuovo.id]: p[nuovo.id] ?? { tipo: nuovo.tipo, anteprima: null },
        }));
        dove = inserisciAllegato(view, dove, fino, nuovo);
        fino = dove;
        // L'anteprima di una foto appena allegata: dal nucleo.
        if (eFoto(nuovo.tipo))
          setAllegati((p) =>
            Object.fromEntries(Object.entries(p).filter(([id]) => id !== nuovo.id)),
          );
      } catch (errore) {
        avviso ??= avvisoAllegato(errore);
      }
    }
    if (avviso) onAvviso(avviso);
    view.focus();
  };
  // File incollati (RB-114): entrano uno dopo l'altro nel punto in cui si incolla.
  useEffect(() => {
    if (!view) return;
    const suFile = (e: Event) => {
      const { file, da, a } = (e as CustomEvent<FileIncollati>).detail;
      void allega(
        file.map(
          (f) => async () => brainet.allegaDati(f.name, new Uint8Array(await f.arrayBuffer())),
        ),
        da,
        a,
      );
    };
    // Trascinati da Esplora file o dal Finder (RB-114): nel punto in cui si lasciano.
    const suTrascinati = (e: Event) => {
      const { percorsi, x, y } = (e as CustomEvent<FileRilasciati>).detail;
      const dove = view.posAtCoords({ x, y }) ?? view.state.doc.length;
      void allega(
        percorsi.map((p) => () => brainet.allegaFile(p)),
        dove,
        dove,
      );
    };
    const zona = view.dom.closest(`[${ZONA_RILASCIO}]`);
    view.dom.addEventListener(EVENTO_FILE, suFile);
    zona?.addEventListener(EVENTO_RILASCIO, suTrascinati);
    return () => {
      view.dom.removeEventListener(EVENTO_FILE, suFile);
      zona?.removeEventListener(EVENTO_RILASCIO, suTrascinati);
    };
  });

  const vociAllegato: VoceMenu[] = [];
  if (menuAllegato && view) {
    const m = menuAllegato;
    const azione = (fa: (id: string) => Promise<void>) => () =>
      void fa(m.id).catch((e: unknown) => onAvviso(avvisoAllegato(e)));
    vociAllegato.push(
      { tipo: "voce", etichetta: "Apri", icona: Eye, azione: azione(brainet.apriAllegato) },
      {
        tipo: "voce",
        etichetta: "Mostra nella cartella",
        icona: FolderOpen,
        azione: azione(brainet.mostraAllegato),
      },
    );
    // Dimensioni solo per le foto fuori dal paragrafo (RB-120).
    if (DIMENSIONI.some((d) => d.forma === m.forma))
      vociAllegato.push({
        tipo: "voce",
        etichetta: "Dimensioni",
        icona: IconaImmagine,
        sottomenu: DIMENSIONI.map((d) => ({
          tipo: "voce",
          etichetta: d.etichetta,
          spunta: d.forma === m.forma,
          azione: () => cambiaForma(view, m, d.forma),
        })),
      });
    vociAllegato.push(
      { tipo: "separatore" },
      {
        tipo: "voce",
        etichetta: "Togli",
        icona: Trash2,
        errore: true,
        azione: () => togliAllegato(view, m),
      },
    );
  }

  // ——— @ ———

  // I suggerimenti seguono le lettere scritte (RB-104); Esc li chiude fino alla prossima @.
  const domanda = chiocciola && chiocciola.da !== chiusaA ? chiocciola.testo : null;
  useEffect(() => {
    if (domanda === null) return;
    let vivo = true;
    void brainet.suggerisciEntita(domanda).then(
      (e) => vivo && setSuggerite(e),
      () => vivo && setSuggerite([]),
    );
    return () => {
      vivo = false;
    };
  }, [domanda]);

  const scegliCitazione = (e: Entita) => {
    if (!view || !chiocciola) return;
    ricordaEntita([e]);
    inserisciCitazione(view, chiocciola.da, e);
    setChiocciola(null);
  };

  const vociChiocciola: VoceMenu[] = [];
  if (domanda !== null) {
    vociChiocciola.push(
      ...vociPerTipo(suggerite, (e) => ({
        tipo: "voce",
        etichetta: e.nome,
        azione: () => scegliCitazione(e),
      })),
    );
    const nome = domanda.trim();
    const esiste = suggerite.some((e) => e.nome.toLowerCase() === nome.toLowerCase());
    if (nome && !esiste) {
      if (vociChiocciola.length) vociChiocciola.push({ tipo: "separatore" });
      vociChiocciola.push({
        tipo: "voce",
        etichetta: `Crea «${nome}»`,
        icona: Plus,
        // Nasce senza tipo e la pillola entra subito: si continua a scrivere (RB-105).
        azione: () => void brainet.creaEntita(nome).then(scegliCitazione),
      });
    }
    // In fondo, la graffetta: la finestra del sistema per scegliere il file (RB-114).
    if (vociChiocciola.length && !(nome && !esiste)) vociChiocciola.push({ tipo: "separatore" });
    vociChiocciola.push({
      tipo: "voce",
      etichetta: "Allega un file…",
      icona: Paperclip,
      azione: () => {
        if (!view || !chiocciola) return;
        const [da, a] = [chiocciola.da, view.state.selection.main.head];
        setChiocciola(null);
        void allega([() => brainet.allegaFile()], da, a);
      },
    });
  }

  // ——— Aree ———

  // Selezionando con il mouse si apre il menu dell'area (RB-107).
  const suRilascio = () => {
    if (!selezione) return;
    setMenuArea({
      id: null,
      da: selezione.da,
      a: selezione.a,
      frase: testoSemplice(testoAttuale.slice(selezione.da, selezione.a)),
      x: selezione.x,
      y: selezione.y,
      sopra: selezione.sopra,
    });
  };

  useEffect(() => {
    if (!menuArea) return;
    let vivo = true;
    void brainet.suggerisciEntita("").then(
      (e) => vivo && setPerArea(e),
      () => vivo && setPerArea([]),
    );
    return () => {
      vivo = false;
    };
  }, [menuArea]);

  const legami = menuArea?.id ? legamiArea(testoAttuale, menuArea.id) : null;
  const legatiStati = legami?.stati ?? [];
  const legateEntita = legami?.entita ?? [];
  const citate = legami?.citate ?? [];

  /** Accende o spegne un legame; la prima scelta trasforma la selezione in un'area. */
  const alterna = (tipo: "stato" | "entita", id: string) => {
    if (!view || !menuArea) return;
    if (!menuArea.id) {
      const nuova = creaArea(
        view,
        menuArea.da,
        menuArea.a,
        tipo === "stato" ? [id] : [],
        tipo === "entita" ? [id] : [],
      );
      setMenuArea({ ...menuArea, id: nuova });
      return;
    }
    const via = (lista: string[]) =>
      lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
    const s = tipo === "stato" ? via(legatiStati) : legatiStati;
    const e = tipo === "entita" ? via(legateEntita) : legateEntita;
    // Tolte tutte le voci l'area sparisce, e il menu con lei (RB-109).
    if (!aggiornaArea(view, menuArea.id, s, e)) setMenuArea(null);
  };

  const vociArea: VoceMenu[] = [];
  if (menuArea) {
    if (stati.length) {
      vociArea.push({ tipo: "titolo", etichetta: "Stati" });
      for (const s of stati)
        vociArea.push({
          tipo: "voce",
          etichetta: s.nome,
          pallino: s.colore,
          spunta: legatiStati.includes(s.id),
          restaAperto: true,
          azione: () => alterna("stato", s.id),
        });
      vociArea.push({ tipo: "separatore" });
    }
    // Le entità già legate restano nel menu anche se non sono tra i suggerimenti.
    const elenco = [...perArea];
    for (const id of [...legateEntita, ...citate])
      if (!elenco.some((e) => e.id === id) && entita[id]) elenco.push(entita[id]);
    vociArea.push(
      ...vociPerTipo(elenco, (e) => ({
        tipo: "voce",
        etichetta: e.nome,
        spunta: legateEntita.includes(e.id) || citate.includes(e.id),
        restaAperto: true,
        // Un'entità citata dentro l'area è legata dalla sua pillola: si toglie togliendo la pillola.
        azione: citate.includes(e.id) ? undefined : () => alterna("entita", e.id),
      })),
    );
    const nome = menuArea.frase.trim().slice(0, LUNGHEZZA_NOME);
    if (nome) {
      if (vociArea.length) vociArea.push({ tipo: "separatore" });
      vociArea.push({
        tipo: "voce",
        etichetta: menuArea.id ? "Crea…" : `Crea «${abbrevia(nome)}»`,
        icona: Plus,
        restaAperto: true,
        azione: () =>
          void brainet.creaEntita(nome).then((e) => {
            ricordaEntita([e]);
            setPerArea((p) => (p.some((x) => x.id === e.id) ? p : [...p, e]));
            alterna("entita", e.id);
          }),
      });
    }
  }

  // ——— Linguetta ———

  const legamiLinguetta = linguetta ? legamiArea(testoAttuale, linguetta.id) : null;
  const statiLinguetta = (legamiLinguetta?.stati ?? [])
    .map((id) => stati.find((s) => s.id === id))
    .filter((s) => s !== undefined);
  const nomiLinguetta = [
    ...statiLinguetta.map((s) => s.nome),
    ...[...(legamiLinguetta?.entita ?? []), ...(legamiLinguetta?.citate ?? [])]
      .map((id) => entita[id]?.nome)
      .filter(Boolean),
  ];

  const apriDallaLinguetta = () => {
    if (!linguetta) return;
    const area = leggiSegni(testoAttuale).aree.find((a) => a.id === linguetta.id);
    if (!area) return;
    const fine = area.chiude?.da ?? testoAttuale.length;
    setMenuArea({
      id: area.id,
      da: area.apre.a,
      a: fine,
      frase: testoSemplice(testoAttuale.slice(area.apre.a, fine)),
      x: linguetta.x,
      y: linguetta.y,
      sopra: linguetta.y,
    });
    setLinguetta(null);
  };

  return (
    <div className="editor-brainet" onMouseUp={suRilascio} {...{ [ZONA_RILASCIO]: "" }}>
      <Editor
        contenuto={testo}
        onModifica={(t) => {
          setTestoAttuale(t);
          onModifica(t);
        }}
        onVista={setView}
        focus={focus}
        etichetta={etichetta}
        invito={invito}
        estensioni={estensioni}
      />
      {domanda !== null &&
        chiocciola &&
        vociChiocciola.length > 0 &&
        !menuArea &&
        !menuAllegato && (
          <Menu
            voci={vociChiocciola}
            etichetta="Collega"
            x={chiocciola.x}
            y={chiocciola.y}
            sopra={chiocciola.sopra}
            attivaIniziale={vociChiocciola.findIndex((v) => v.tipo === "voce")}
            onChiudi={() => setChiusaA(chiocciola.da)}
          />
        )}
      {menuAllegato && (
        <Menu
          voci={vociAllegato}
          etichetta={eFotoForma(menuAllegato.forma) ? "Foto allegata" : "Allegato"}
          x={menuAllegato.x}
          y={menuAllegato.y}
          sopra={menuAllegato.sopra}
          onChiudi={() => setMenuAllegato(null)}
        />
      )}
      {menuArea && (
        <Menu
          voci={vociArea}
          etichetta="Area"
          x={menuArea.x}
          y={menuArea.y}
          sopra={menuArea.sopra}
          onChiudi={() => setMenuArea(null)}
        />
      )}
      {linguetta &&
        nomiLinguetta.length > 0 &&
        !menuArea &&
        createPortal(
          <div
            className="bn-linguetta interfaccia-dettaglio"
            style={{ left: linguetta.x, top: linguetta.y }}
            onMouseEnter={() => setLinguetta((prima) => prima && { ...prima, tenuta: true })}
            onMouseLeave={() => setLinguetta(null)}
          >
            {statiLinguetta[0] && <Pallino colore={statiLinguetta[0].colore} />}
            <span>{nomiLinguetta.join(" · ")}</span>
            <button
              type="button"
              className="bn-linguetta-freccia"
              aria-label="Cambia stati ed entità"
              onClick={apriDallaLinguetta}
            >
              <Icona di={ChevronDown} />
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
