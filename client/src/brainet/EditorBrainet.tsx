// L'editor di una nota Brainet (RF-18): l'editor delle note in vista Markdown con il compartimento
// Brainet (estensione.ts), il menu di @ (CMP-09 Suggerimenti), il menu dell'area (CMP-09 Area) e
// la Linguetta (CMP-40). Lo usano il foglio nuovo e il Database.

import type { EditorView } from "@codemirror/view";
import { ChevronDown, Plus } from "lucide-react";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { Editor } from "../editor/Editor";
import { Icona } from "../componenti/Icona";
import { Menu, type VoceMenu } from "../componenti/Menu";
import { Pallino } from "../componenti/Pallino";
import { brainet, TITOLO_TIPO, type Entita, type StatoArea, type TipoEntita } from "./api";
import {
  aggiornaArea,
  aggiornaEntita,
  creaArea,
  estensioneBrainet,
  inserisciCitazione,
  type Ascolto,
} from "./estensione";
import { legamiArea, leggiSegni, testoSemplice } from "./segni";
import "./brainet.css";

interface Proprieta {
  testo: string;
  onModifica: (testo: string) => void;
  focus?: boolean;
  etichetta?: string;
  invito?: string;
}

type Chiocciola = Parameters<Ascolto["onChiocciola"]>[0];
type Selezione = Parameters<Ascolto["onSelezione"]>[0];
type Sopra = NonNullable<Parameters<Ascolto["onAreaSopra"]>[0]>;
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

function abbrevia(testo: string, quanti = 30): string {
  const t = testo.replace(/\s+/g, " ").trim();
  return t.length > quanti ? `${t.slice(0, quanti)}…` : t;
}

/** Chi ascolta l'editor: solo funzioni che cambiano lo stato, così le estensioni nascono una volta. */
function creaAscolto(
  setChiocciola: (q: Chiocciola) => void,
  setSelezione: (s: Selezione) => void,
  setLinguetta: (l: Linguetta | ((prima: Linguetta) => Linguetta)) => void,
): Ascolto {
  let timer: number | undefined;
  return {
    onChiocciola: setChiocciola,
    onSelezione: setSelezione,
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
  const [estensioni] = useState(() =>
    estensioneBrainet(creaAscolto(setChiocciola, setSelezione, setLinguetta)),
  );

  // Nomi e foto delle entità citate, dal nucleo: seguono le unioni (RB-108).
  const ricordaEntita = useCallback((nuove: Entita[]) => {
    if (!nuove.length) return;
    setEntita((prima) => ({ ...prima, ...Object.fromEntries(nuove.map((e) => [e.id, e])) }));
  }, []);
  useEffect(() => {
    const ids = [...new Set(leggiSegni(testoAttuale).citazioni.map((c) => c.entita))].filter(
      (id) => !entita[id],
    );
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
    <div className="editor-brainet" onMouseUp={suRilascio}>
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
        markdown
        estensioni={estensioni}
      />
      {domanda !== null && chiocciola && vociChiocciola.length > 0 && !menuArea && (
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
