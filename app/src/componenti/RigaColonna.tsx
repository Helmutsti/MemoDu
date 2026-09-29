// CMP-06 Riga della colonna: una nota, una cartella o il titolo di una sezione. Alta 32,
// pillola. Hover: tutto il testo passa a testo-primario (regola 7). Selezionata: come
// l'hover (DEC-35). Nell'albero (CMP-14) il rientro allarga il margine: 16 px per livello,
// e il titolo di una nota si allinea al nome delle sottocartelle sorelle (+20).

import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import {
  useEffect,
  useRef,
  type DragEvent,
  type MouseEvent,
  type ReactElement,
  type CSSProperties,
} from "react";
import { Icona } from "./Icona";
import { Suggerimento } from "./Suggerimento";
import "./RigaColonna.css";

/** Gestori del trascinamento: sorgente (start, end) e destinazione (over, leave, drop). */
export interface Trascinamento {
  draggable?: boolean;
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: (e: DragEvent) => void;
  onDragOver?: (e: DragEvent) => void;
  onDragLeave?: (e: DragEvent) => void;
  onDrop?: (e: DragEvent) => void;
}

const PASSO = 16;
/** Freccia (16) e distanza (4): il titolo della nota si allinea al nome delle cartelle. */
const SPAZIO_FRECCIA = 20;

/** Margine sinistro di una cartella al livello `livello` (0 = primo livello). */
const rientroCartella = (livello: number): CSSProperties | undefined =>
  livello > 0
    ? { paddingLeft: `calc(var(--spazio-controllo-piccolo) + ${livello * PASSO}px)` }
    : undefined;

interface ProprietaNota extends Trascinamento {
  id: string;
  titolo: string;
  /** Senza titolo né testo: «Nota vuota» in testo tenue (RB-15). */
  vuota: boolean;
  selezionata: boolean;
  onApri: () => void;
  /** Tasto destro: il menu della nota (Sposta in…, Elimina). */
  onMenu: (e: MouseEvent) => void;
  /** Livello della cartella che la contiene (0 = primo livello); assente tra le non organizzate. */
  livelloCartella?: number;
}

export function RigaNota({
  id,
  titolo,
  vuota,
  selezionata,
  onApri,
  onMenu,
  livelloCartella,
  ...trascinamento
}: ProprietaNota): ReactElement {
  const stile =
    livelloCartella === undefined
      ? undefined
      : {
          paddingLeft: `calc(var(--spazio-controllo-piccolo) + ${(livelloCartella + 1) * PASSO + SPAZIO_FRECCIA}px)`,
        };
  return (
    <li role="none">
      <button
        type="button"
        role="treeitem"
        data-riga=""
        data-nota={id}
        aria-level={livelloCartella === undefined ? 1 : livelloCartella + 2}
        aria-selected={selezionata}
        aria-current={selezionata ? "true" : undefined}
        className={`riga riga-nota ${selezionata ? "riga-selezionata interfaccia-controllo-attivo" : "interfaccia-controllo"} ${vuota ? "riga-vuota" : ""}`}
        style={stile}
        onClick={onApri}
        onContextMenu={(e) => {
          e.preventDefault();
          onMenu(e);
        }}
        {...trascinamento}
      >
        <span className="riga-nome">{vuota ? "Nota vuota" : titolo}</span>
      </button>
    </li>
  );
}

interface ProprietaCartella extends Trascinamento {
  nome: string;
  percorso: string;
  conteggio: number;
  aperta: boolean;
  livello: number;
  /** Mentre si trascina sopra una nota o una cartella che la cartella può ricevere. */
  sopra: boolean;
  onApriChiudi: () => void;
  onMenu: (e: MouseEvent) => void;
}

export function RigaCartella({
  nome,
  percorso,
  conteggio,
  aperta,
  livello,
  sopra,
  onApriChiudi,
  onMenu,
  ...trascinamento
}: ProprietaCartella): ReactElement {
  return (
    <button
      type="button"
      role="treeitem"
      data-riga=""
      data-cartella={percorso}
      aria-level={livello + 1}
      aria-expanded={aperta}
      className={`riga riga-cartella interfaccia-controllo ${sopra ? "riga-sopra" : ""}`}
      style={rientroCartella(livello)}
      onClick={onApriChiudi}
      onContextMenu={(e) => {
        e.preventDefault();
        onMenu(e);
      }}
      {...trascinamento}
    >
      <span className="riga-freccia">
        <Icona di={aperta ? ChevronDown : ChevronRight} />
      </span>
      <span className="riga-nome">{nome}</span>
      <span className="riga-conteggio interfaccia-dettaglio">{conteggio}</span>
    </button>
  );
}

interface ProprietaCampo {
  valore: string;
  livello: number;
  /** `daTastiera` è falso quando conferma il clic altrove. */
  onConferma: (valore: string, daTastiera: boolean) => void;
  onAnnulla: () => void;
}

/** Campo nome nell'albero (CMP-14): il nome è già selezionato (RB-48); Invio conferma, Esc annulla. */
export function CampoNomeCartella({
  valore,
  livello,
  onConferma,
  onAnnulla,
}: ProprietaCampo): ReactElement {
  const campo = useRef<HTMLInputElement>(null);
  const finito = useRef(false);

  useEffect(() => {
    campo.current?.focus();
    campo.current?.select();
  }, []);

  const chiudi = (conferma: boolean, daTastiera = true) => {
    if (finito.current) return;
    finito.current = true;
    if (conferma) onConferma(campo.current?.value ?? valore, daTastiera);
    else onAnnulla();
  };

  return (
    <div className="riga riga-campo" style={rientroCartella(livello)}>
      <span className="riga-freccia">
        <Icona di={ChevronRight} />
      </span>
      <input
        ref={campo}
        className="riga-campo-nome interfaccia-controllo"
        aria-label="Nome della cartella"
        defaultValue={valore}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            chiudi(true);
          } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            chiudi(false);
          }
        }}
        onBlur={() => chiudi(true, false)}
      />
    </div>
  );
}

interface ProprietaSezione extends Pick<Trascinamento, "onDragOver" | "onDragLeave" | "onDrop"> {
  titolo: string;
  /** Assente per la sezione Cartelle, dove il numero non si mostra (CMP-06). */
  conteggio?: number;
  aperta: boolean;
  onApriChiudi: () => void;
  nomeAggiungi: string;
  onAggiungi: () => void;
  sopra?: boolean;
}

export function RigaSezione({
  titolo,
  conteggio,
  aperta,
  onApriChiudi,
  nomeAggiungi,
  onAggiungi,
  sopra = false,
  ...destinazione
}: ProprietaSezione): ReactElement {
  return (
    <div className={`riga riga-sezione ${sopra ? "riga-sopra" : ""}`} {...destinazione}>
      <button
        type="button"
        className="riga-sezione-titolo"
        aria-expanded={aperta}
        onClick={onApriChiudi}
      >
        <Icona di={aperta ? ChevronDown : ChevronRight} misura={12} />
        <span className="riga-nome interfaccia-titolo-sezione">{titolo}</span>
        {conteggio !== undefined && (
          <span className="riga-conteggio interfaccia-dettaglio">{conteggio}</span>
        )}
      </button>
      <Suggerimento testo={nomeAggiungi}>
        <button
          type="button"
          className="riga-aggiungi"
          aria-label={nomeAggiungi}
          onClick={onAggiungi}
        >
          <Icona di={Plus} />
        </button>
      </Suggerimento>
    </div>
  );
}

/** Riga Cestino, fissa in fondo alla colonna, con il numero di elementi (CMP-06, DEC-40). */
export function RigaCestino({
  conteggio,
  selezionata,
  onApri,
}: {
  conteggio: number;
  selezionata: boolean;
  onApri: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      className={`riga riga-cartella riga-cestino ${selezionata ? "riga-selezionata interfaccia-controllo-attivo" : "interfaccia-controllo"}`}
      aria-current={selezionata ? "page" : undefined}
      onClick={onApri}
    >
      <span className="riga-freccia">
        <Icona di={Trash2} />
      </span>
      <span className="riga-nome">Cestino</span>
      <span className="riga-conteggio interfaccia-dettaglio">{conteggio}</span>
    </button>
  );
}

/** Cestino di trascinamento (CMP-14): compare in fondo alla colonna solo mentre si trascina. */
export function CestinoTrascinamento({
  sopra,
  ...destinazione
}: { sopra: boolean } & Pick<
  Trascinamento,
  "onDragOver" | "onDragLeave" | "onDrop"
>): ReactElement {
  return (
    <div
      className={`cestino-trascinamento interfaccia-controllo ${sopra ? "cestino-trascinamento-sopra" : ""}`}
      aria-live="polite"
      {...destinazione}
    >
      <Icona di={Trash2} />
      {sopra ? "Rilascia per spostare nel cestino" : "Trascina qui per eliminare"}
    </div>
  );
}
