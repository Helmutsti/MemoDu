// Colonna di SC-01, frammento Must B (CMP-14): sezione Non organizzate (RB-60) e sezione
// Cartelle con l'albero: sottocartelle poi note, in ordine alfabetico (RB-64, RB-65), con il
// numero di note (RB-56). Trascinamento su cartelle, titoli di sezione e cestino in fondo
// (FL-05, RB-24); tasto destro su una cartella o su una nota; tastiera come CMP-06 (RNF-04).
// In fondo la riga Cestino, che durante il trascinamento diventa la zona di rilascio (DEC-40).

import { useState, type DragEvent, type ReactElement, type ReactNode } from "react";
import type { Albero, Cartella, Percorso, VoceElenco } from "@memodu/condiviso";
import {
  CampoNomeCartella,
  CestinoTrascinamento,
  RigaCartella,
  RigaCestino,
  RigaNota,
  RigaSezione,
} from "../componenti/RigaColonna";
import { StatoVuotoColonna } from "../componenti/StatoVuoto";

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
  /** Chiusa (non si vede), aperta sopra il foglio o fissata accanto (DEC-55). */
  stato: "chiusa" | "aperta" | "fissata";
  /** In cima alla colonna: «← |» e la puntina (DEC-55). */
  testata: ReactNode;
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
  const [sezioni, setSezioni] = useState({ nonOrganizzate: true, cartelle: true });
  const [sopra, setSopra] = useState<string | null>(null);

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
            {sottocartelle(c.cartelle, c.percorso, livello + 1)}
            {c.note.map((v) => rigaNota(v, c.percorso, livello))}
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
  const alberoVuoto = cartelle.length === 0 && p.campo?.tipo !== "nuova";

  return (
    <nav className={`colonna colonna-${p.stato}`} aria-label="Note e cartelle">
      <div className="colonna-testata" data-tauri-drag-region>
        {p.testata}
      </div>
      <div
        className="colonna-contenuto"
        role="tree"
        aria-label="Note e cartelle"
        onKeyDown={suTasto}
      >
        <div className="colonna-sezione">
          <RigaSezione
            titolo="Non organizzate"
            conteggio={nonOrganizzate.conteggio}
            aperta={sezioni.nonOrganizzate}
            onApriChiudi={() => setSezioni((s) => ({ ...s, nonOrganizzate: !s.nonOrganizzate }))}
            nomeAggiungi="Nuova nota"
            onAggiungi={p.onNuovaNota}
            sopra={p.trascinato?.tipo === "nota" && sopra === chiave(radice)}
            {...(p.trascinato?.tipo === "nota" ? destinazione(radice) : {})}
          />
          {sezioni.nonOrganizzate &&
            (nonOrganizzate.note.length === 0 ? (
              <StatoVuotoColonna testo="Le note che scrivi compaiono qui." />
            ) : (
              <ul role="group" className="colonna-elenco">
                {nonOrganizzate.note.map((v) => rigaNota(v, ""))}
              </ul>
            ))}
        </div>
        <div className="colonna-sezione">
          <RigaSezione
            titolo="Cartelle"
            aperta={sezioni.cartelle}
            onApriChiudi={() => setSezioni((s) => ({ ...s, cartelle: !s.cartelle }))}
            nomeAggiungi="Nuova cartella"
            onAggiungi={() => {
              setSezioni((s) => ({ ...s, cartelle: true }));
              p.onNuovaCartella("");
            }}
            sopra={p.trascinato?.tipo === "cartella" && sopra === chiave(radice)}
            {...(p.trascinato?.tipo === "cartella" ? destinazione(radice) : {})}
          />
          {sezioni.cartelle &&
            (alberoVuoto ? (
              <StatoVuotoColonna testo="Nessuna cartella. Creane una con +" />
            ) : (
              <ul role="group" className="colonna-elenco">
                {sottocartelle(cartelle, "", 0)}
              </ul>
            ))}
        </div>
      </div>
      <div className="colonna-fondo">
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
          />
        )}
      </div>
    </nav>
  );
}
