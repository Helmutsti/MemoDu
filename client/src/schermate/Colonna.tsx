// Colonna di SC-01 (CMP-14): una sola sezione CLOUD (DEC-119) con nella radice le note non
// organizzate, per ultima modifica (RB-60), e poi l'albero delle cartelle; a ogni livello prima le
// note, poi le sottocartelle, in ordine alfabetico (RB-64, RB-65), con il numero di note (RB-56).
// Il + del titolo apre il menu Aggiungi: Nuova nota e Nuova cartella. Trascinamento su cartelle, titoli di sezione e cestino in fondo
// (FL-05, RB-24); tasto destro su una cartella o su una nota; tastiera come CMP-06 (RNF-04).
// In fondo la riga Cestino, che durante il trascinamento diventa la zona di rilascio (DEC-40), e
// sotto la riga Impostazioni (DEC-91). In cima, sotto la riga della puntina, la ricerca (DEC-94).
// Dopo Cartelle la sezione Locale, con i file del disco (RF-17).

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import type { Albero, Cartella, Percorso, VoceElenco } from "@memodu/condiviso";
import {
  CampoNomeCartella,
  CestinoTrascinamento,
  RigaCartella,
  RigaCestino,
  RigaImpostazioni,
  RigaNota,
  RigaSezione,
} from "../componenti/RigaColonna";
import { StatoVuotoColonna } from "../componenti/StatoVuoto";
import { Menu } from "../componenti/Menu";
import { FileText, Folder } from "lucide-react";
import { avviaFantasma } from "../componenti/fantasma";
import { AreaScorrevole } from "../componenti/AreaScorrevole";

/** Cosa si sta trascinando. */
export type Trascinato =
  { tipo: "nota"; id: string; cartella: Percorso } | { tipo: "cartella"; percorso: Percorso };

/** Dove si rilascia: una cartella, la radice (titolo della sezione) o il cestino. */
export type Destinazione =
  { tipo: "cartella"; percorso: Percorso } | { tipo: "radice" } | { tipo: "cestino" };

/** Campo del nome aperto nell'albero (CMP-14). */
export type Campo =
  | { tipo: "nuova"; genitore: Percorso; proposta: string }
  | { tipo: "rinomina"; percorso: Percorso; nome: string };

interface Proprieta {
  albero: Albero;
  apertaId: string | null;
  cartelleAperte: Set<Percorso>;
  onApriChiudiCartella: (percorso: Percorso, apri?: boolean) => void;
  onApriNota: (id: string) => void;
  onNuovaNota: () => void;
  onNuovaCartella: (genitore: Percorso) => void;
  campo: Campo | null;
  onConfermaCampo: (valore: string, daTastiera: boolean) => void;
  onAnnullaCampo: () => void;
  onMenuCartella: (percorso: Percorso, x: number, y: number) => void;
  onMenuNota: (id: string, cartella: Percorso, x: number, y: number) => void;
  onRinomina: (percorso: Percorso) => void;
  trascinato: Trascinato | null;
  onTrascina: (trascinato: Trascinato | null) => void;
  onRilascia: (destinazione: Destinazione) => void;
  /** Il cestino è aperto nell'area della nota. */
  cestinoAperto: boolean;
  onApriCestino: () => void;
  /** Le impostazioni sono aperte nell'area della nota (DEC-91). */
  impostazioniAperte: boolean;
  onApriImpostazioni: () => void;
  /** «Chiudi cestino» e «Chiudi impostazioni»: l'area torna vuota (DEC-117). */
  onChiudiVista: () => void;
  /** Chiusa (non si vede), aperta sopra il foglio o fissata accanto (DEC-55). */
  stato: "chiusa" | "aperta" | "fissata";
  /** In cima alla colonna: «← |» e la puntina (DEC-55). */
  testata: ReactNode;
  /** Sotto la testata: il campo di ricerca (RF-08, DEC-94). */
  ricerca?: ReactNode;
  /** Larghezza scelta trascinando la maniglia (DEC-62). */
  larghezza: number;
  /** Sotto Cartelle: la sezione Locale (RF-17). */
  locale?: ReactNode;
}

const stesso = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const padre = (percorso: Percorso) => percorso.split("/").slice(0, -1).join("/");
const ordine = (a: string, b: string) => a.localeCompare(b, "it", { sensitivity: "base" });
const chiave = (d: Destinazione) => (d.tipo === "cartella" ? `c:${d.percorso}` : d.tipo);

/** Una destinazione può ricevere ciò che si trascina? Mai una cartella dentro sé stessa (RB-24). */
export function accetta(t: Trascinato, d: Destinazione): boolean {
  if (d.tipo === "cestino") return true;
  if (t.tipo === "nota") {
    return d.tipo === "radice" ? t.cartella !== "" : !stesso(d.percorso, t.cartella);
  }
  const dove = d.tipo === "radice" ? "" : d.percorso;
  const dentro =
    stesso(dove, t.percorso) || dove.toLowerCase().startsWith(`${t.percorso.toLowerCase()}/`);
  return !dentro && !stesso(dove, padre(t.percorso));
}

export function Colonna(p: Proprieta): ReactElement {
  const [cloudAperta, setCloudAperta] = useState(true);
  /** Menu Aggiungi del + di CLOUD (DEC-119). */
  const [aggiungi, setAggiungi] = useState<{ x: number; y: number } | null>(null);
  const [sopra, setSopra] = useState<string | null>(null);

  // CMP-30: l'ombra del fondo compare solo quando l'ultima sezione finisce sotto di lui, cioè
  // quando note e cartelle gli scorrono sotto. Si ricontrolla scorrendo, cambiando misura e
  // quando il contenuto cambia.
  const colonna = useRef<HTMLElement>(null);
  const contenuto = useRef<HTMLDivElement>(null);
  const fondo = useRef<HTMLDivElement>(null);
  const [contenutoSotto, setContenutoSotto] = useState(false);
  useEffect(() => {
    const controlla = () => {
      const ultima = contenuto.current?.lastElementChild;
      if (!ultima || !fondo.current) return;
      setContenutoSotto(
        ultima.getBoundingClientRect().bottom > fondo.current.getBoundingClientRect().top + 0.5,
      );
    };
    controlla();
    const nav = colonna.current;
    nav?.addEventListener("scroll", controlla, true);
    window.addEventListener("resize", controlla);
    const osserva = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(controlla);
    if (osserva && contenuto.current) osserva.observe(contenuto.current);
    if (osserva && nav) osserva.observe(nav);
    return () => {
      nav?.removeEventListener("scroll", controlla, true);
      window.removeEventListener("resize", controlla);
      osserva?.disconnect();
    };
  }, []);

  /** Gestori del trascinamento per una destinazione. */
  const destinazione = (d: Destinazione) => ({
    onDragOver: (e: DragEvent) => {
      if (!p.trascinato || !accetta(p.trascinato, d)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setSopra(chiave(d));
    },
    onDragLeave: () => setSopra((s) => (s === chiave(d) ? null : s)),
    onDrop: (e: DragEvent) => {
      if (!p.trascinato || !accetta(p.trascinato, d)) return;
      e.preventDefault();
      setSopra(null);
      p.onRilascia(d);
    },
  });

  const sorgente = (t: Trascinato) => ({
    draggable: true,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", t.tipo === "nota" ? t.id : t.percorso);
      avviaFantasma(e);
      p.onTrascina(t);
    },
    onDragEnd: () => {
      setSopra(null);
      p.onTrascina(null);
    },
  });

  const rigaNota = (v: VoceElenco, cartella: Percorso, livelloCartella?: number) => (
    <RigaNota
      key={v.id}
      id={v.id}
      titolo={v.titolo || v.anteprima}
      vuota={!v.titolo && !v.anteprima}
      selezionata={v.id === p.apertaId}
      livelloCartella={livelloCartella}
      onApri={() => p.onApriNota(v.id)}
      onMenu={(e) => p.onMenuNota(v.id, cartella, e.clientX, e.clientY)}
      {...sorgente({ tipo: "nota", id: v.id, cartella })}
    />
  );

  const campoNuova = (genitore: Percorso, livello: number) =>
    p.campo?.tipo === "nuova" && p.campo.genitore === genitore ? (
      <li role="none" key="campo-nuova">
        <CampoNomeCartella
          valore={p.campo.proposta}
          livello={livello}
          onConferma={p.onConfermaCampo}
          onAnnulla={p.onAnnullaCampo}
        />
      </li>
    ) : null;

  /** Sottocartelle in ordine alfabetico, con il campo della nuova cartella al suo posto. */
  const sottocartelle = (elenco: Cartella[], genitore: Percorso, livello: number) => {
    const righe: { nome: string; nodo: ReactNode }[] = elenco.map((c) => ({
      nome: c.nome,
      nodo: cartella(c, livello),
    }));
    const nuovo = campoNuova(genitore, livello);
    if (nuovo && p.campo?.tipo === "nuova") righe.push({ nome: p.campo.proposta, nodo: nuovo });
    return righe.sort((a, b) => ordine(a.nome, b.nome)).map((r) => r.nodo);
  };

  const cartella = (c: Cartella, livello: number): ReactNode => {
    const aperta = p.cartelleAperte.has(c.percorso);
    // Una cartella aperta ma vuota non ha l'elenco: il suo margine sposterebbe le righe sotto.
    const conContenuto =
      c.cartelle.length > 0 ||
      c.note.length > 0 ||
      (p.campo?.tipo === "nuova" && p.campo.genitore === c.percorso);
    const d: Destinazione = { tipo: "cartella", percorso: c.percorso };
    return (
      <li role="none" key={c.percorso}>
        {p.campo?.tipo === "rinomina" && p.campo.percorso === c.percorso ? (
          <CampoNomeCartella
            valore={p.campo.nome}
            livello={livello}
            onConferma={p.onConfermaCampo}
            onAnnulla={p.onAnnullaCampo}
          />
        ) : (
          <RigaCartella
            nome={c.nome}
            percorso={c.percorso}
            conteggio={c.conteggio}
            aperta={aperta}
            livello={livello}
            sopra={sopra === chiave(d)}
            onApriChiudi={() => p.onApriChiudiCartella(c.percorso)}
            onMenu={(e) => p.onMenuCartella(c.percorso, e.clientX, e.clientY)}
            {...sorgente({ tipo: "cartella", percorso: c.percorso })}
            {...destinazione(d)}
          />
        )}
        {aperta && conContenuto && (
          <ul role="group" className="colonna-elenco">
            {c.note.map((v) => rigaNota(v, c.percorso, livello))}
            {sottocartelle(c.cartelle, c.percorso, livello + 1)}
          </ul>
        )}
      </li>
    );
  };

  // Frecce su e giù tra le righe, destra e sinistra aprono e chiudono, F2 rinomina (CMP-06).
  const suTasto = (e: React.KeyboardEvent) => {
    const righe = [...e.currentTarget.querySelectorAll<HTMLElement>("[data-riga]")];
    const attuale = document.activeElement as HTMLElement;
    const i = righe.indexOf(attuale);
    if (i < 0) return;
    const percorso = attuale.dataset.cartella;
    const aperta = attuale.getAttribute("aria-expanded") === "true";
    const azioni: Record<string, () => void> = {
      ArrowDown: () => righe[Math.min(i + 1, righe.length - 1)]?.focus(),
      ArrowUp: () => righe[Math.max(i - 1, 0)]?.focus(),
      ArrowRight: () => percorso !== undefined && !aperta && p.onApriChiudiCartella(percorso, true),
      ArrowLeft: () => percorso !== undefined && aperta && p.onApriChiudiCartella(percorso, false),
      F2: () => percorso !== undefined && p.onRinomina(percorso),
    };
    const azione = azioni[e.key];
    if (!azione) return;
    e.preventDefault();
    azione();
  };

  const { nonOrganizzate, cartelle } = p.albero;
  const radice: Destinazione = { tipo: "radice" };
  const vuota =
    nonOrganizzate.note.length === 0 && cartelle.length === 0 && p.campo?.tipo !== "nuova";

  return (
    <nav
      ref={colonna}
      className={`colonna colonna-${p.stato}`}
      aria-label="Note e cartelle"
      style={{ width: p.larghezza, "--larghezza-colonna": `${p.larghezza}px` } as CSSProperties}
    >
      <AreaScorrevole className="colonna-scorrimento">
        <div className="colonna-dentro">
          <div className="colonna-testata" data-tauri-drag-region>
            {p.testata}
          </div>
          {p.ricerca}
          <div
            ref={contenuto}
            className="colonna-contenuto"
            role="tree"
            aria-label="Note e cartelle"
            onKeyDown={suTasto}
          >
            <div className="colonna-sezione">
              <RigaSezione
                titolo="Cloud"
                aperta={cloudAperta}
                onApriChiudi={() => setCloudAperta((a) => !a)}
                nomeAggiungi="Aggiungi"
                onAggiungi={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setAggiungi(aggiungi ? null : { x: r.left, y: r.bottom + 4 });
                }}
                sopra={p.trascinato !== null && sopra === chiave(radice)}
                {...(p.trascinato ? destinazione(radice) : {})}
              />
              {cloudAperta &&
                (vuota ? (
                  <StatoVuotoColonna testo="Nessuna nota. Crea con +" />
                ) : (
                  <ul role="group" className="colonna-elenco">
                    {nonOrganizzate.note.map((v) => rigaNota(v, ""))}
                    {sottocartelle(cartelle, "", 0)}
                  </ul>
                ))}
              {aggiungi && (
                <Menu
                  etichetta="Aggiungi"
                  x={aggiungi.x}
                  y={aggiungi.y}
                  voci={[
                    {
                      tipo: "voce",
                      etichetta: "Nuova nota",
                      icona: FileText,
                      azione: p.onNuovaNota,
                    },
                    {
                      tipo: "voce",
                      etichetta: "Nuova cartella",
                      icona: Folder,
                      azione: () => {
                        setCloudAperta(true);
                        p.onNuovaCartella("");
                      },
                    },
                  ]}
                  onChiudi={() => setAggiungi(null)}
                />
              )}
            </div>
            {p.locale}
          </div>
          <div
            ref={fondo}
            className={`colonna-fondo ${contenutoSotto ? "colonna-fondo-sopra-contenuto" : ""}`}
          >
            {p.trascinato ? (
              <CestinoTrascinamento
                sopra={sopra === "cestino"}
                {...destinazione({ tipo: "cestino" })}
              />
            ) : (
              <RigaCestino
                conteggio={p.albero.cestino}
                selezionata={p.cestinoAperto}
                onApri={p.onApriCestino}
                onChiudi={p.onChiudiVista}
              />
            )}
            <RigaImpostazioni
              selezionata={p.impostazioniAperte}
              onApri={p.onApriImpostazioni}
              onChiudi={p.onChiudiVista}
            />
          </div>
        </div>
      </AreaScorrevole>
    </nav>
  );
}
