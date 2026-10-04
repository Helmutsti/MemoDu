// CMP-06 Riga della colonna: una nota, una cartella o il titolo di una sezione. Alta 32,
// pillola con spazio-controllo ai lati (DEC-100). Hover: tutto il testo passa a testo-primario
// (regola 7). Selezionata: come l'hover (DEC-35). Nell'albero (CMP-14) il rientro allarga il
// margine: spazio-rientro (24) per livello, e il titolo di una nota si allinea al nome delle
// sottocartelle sorelle (icona 16 + spazio-icona 8). La cartella ha l'icona chiusa o aperta al
// posto della freccia (DEC-99); i titoli di sezione tengono la freccia.

import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  type PointerEvent,
  type MouseEvent,
  type ReactElement,
  type CSSProperties,
} from "react";
import { Icona } from "./Icona";
import { Suggerimento } from "./Suggerimento";
import "./RigaColonna.css";

/**
 * Trascinamento con il puntatore (DEC-120, `trascina.ts`): la riga che si prende ha
 * onPointerDown, quella che riceve l'attributo `data-destinazione`.
 */
export interface Trascinamento {
  onPointerDown?: (e: PointerEvent<HTMLElement>) => void;
  "data-destinazione"?: string;
}

/** Margine sinistro di una cartella al livello `livello` (0 = primo livello). */
const rientroCartella = (livello: number): CSSProperties | undefined =>
  livello > 0
    ? { paddingLeft: `calc(var(--spazio-controllo) + ${livello} * var(--spazio-rientro))` }
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
  // Il titolo si allinea al nome delle sottocartelle sorelle: un livello sotto la cartella che la
  // contiene, più icona e distanza (24, come un altro livello).
  const stile =
    livelloCartella === undefined
      ? undefined
      : {
          paddingLeft: `calc(var(--spazio-controllo) + ${livelloCartella + 2} * var(--spazio-rientro))`,
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

interface ProprietaFile extends Trascinamento {
  nome: string;
  percorso: string;
  selezionata: boolean;
  /** Modifiche non salvate: il pallino a destra (RB-77). */
  sospeso: boolean;
  /** File nuovo non ancora sul disco: «Senza titolo» in testo tenue (RB-81). */
  nuovo: boolean;
  /** Livello della cartella che lo contiene (0 = cartella dell'elenco; -2 = file da solo). */
  livelloCartella: number;
  /** Un file da solo di Locale che non c'è più: «non trovata» a destra (DEC-120). */
  stato?: string;
  onApri: () => void;
  onMenu: (e: MouseEvent) => void;
}

/** Riga di un file di Locale (CMP-06 File, RF-17): come una nota, il nome con l'estensione. */
export function RigaFile({
  nome,
  percorso,
  selezionata,
  sospeso,
  nuovo,
  livelloCartella,
  stato,
  onApri,
  onMenu,
  ...trascinamento
}: ProprietaFile): ReactElement {
  return (
    <li role="none">
      <button
        type="button"
        role="treeitem"
        data-riga=""
        data-file={percorso}
        aria-level={livelloCartella + 2}
        aria-selected={selezionata}
        aria-current={selezionata ? "true" : undefined}
        className={`riga riga-nota ${selezionata ? "riga-selezionata interfaccia-controllo-attivo" : "interfaccia-controllo"} ${nuovo || stato ? "riga-vuota" : ""}`}
        style={{
          paddingLeft: `calc(var(--spazio-controllo) + ${livelloCartella + 2} * var(--spazio-rientro))`,
        }}
        onClick={onApri}
        onContextMenu={(e) => {
          e.preventDefault();
          onMenu(e);
        }}
        {...trascinamento}
      >
        <span className="riga-nome">{nome}</span>
        {sospeso && <span className="riga-non-salvato" role="img" aria-label="non salvato" />}
        {stato && <span className="riga-conteggio interfaccia-dettaglio">{stato}</span>}
      </button>
    </li>
  );
}

interface ProprietaCartella extends Trascinamento {
  nome: string;
  percorso: string;
  /** Numero di note; assente per le cartelle di Locale. */
  conteggio?: number;
  /** Al posto del numero, per una cartella di Locale che non c'è («non trovata»). */
  stato?: string;
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
  stato,
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
      aria-expanded={stato ? undefined : aperta}
      className={`riga riga-cartella interfaccia-controllo ${sopra ? "riga-sopra" : ""} ${stato ? "riga-cartella-assente" : ""}`}
      style={rientroCartella(livello)}
      onClick={onApriChiudi}
      onContextMenu={(e) => {
        e.preventDefault();
        onMenu(e);
      }}
      {...trascinamento}
    >
      <span className="riga-icona">
        <Icona di={aperta ? FolderOpen : Folder} />
      </span>
      <span className="riga-nome">{nome}</span>
      {(conteggio !== undefined || stato) && (
        <span className="riga-conteggio interfaccia-dettaglio">{stato ?? conteggio}</span>
      )}
    </button>
  );
}

interface ProprietaCampo {
  valore: string;
  livello: number;
  /** Il campo rinomina un file di Locale: senza icona della cartella, allineato ai file. */
  file?: boolean;
  /** `daTastiera` è falso quando conferma il clic altrove. */
  onConferma: (valore: string, daTastiera: boolean) => void;
  onAnnulla: () => void;
}

/** Campo nome nell'albero (CMP-14): il nome è già selezionato (RB-48); Invio conferma, Esc annulla. */
export function CampoNomeCartella({
  valore,
  livello,
  file = false,
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
    <div className="riga riga-campo" style={rientroCartella(file ? livello + 1 : livello)}>
      {!file && (
        <span className="riga-icona">
          <Icona di={Folder} />
        </span>
      )}
      <input
        ref={campo}
        className="riga-campo-nome interfaccia-controllo"
        aria-label={file ? "Nome del file" : "Nome della cartella"}
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

interface ProprietaSezione extends Pick<Trascinamento, "data-destinazione"> {
  titolo: string;
  /** Assente per la sezione Cartelle, dove il numero non si mostra (CMP-06). */
  conteggio?: number;
  aperta: boolean;
  onApriChiudi: () => void;
  nomeAggiungi: string;
  /** Il + del titolo; con il pulsante, per aprire un menu sotto di lui (DEC-119). */
  onAggiungi: (e: React.MouseEvent<HTMLButtonElement>) => void;
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

/**
 * Riga Cestino, fissa in fondo alla colonna, con il numero di elementi (CMP-06, DEC-40). Con il
 * cestino aperto diventa «Chiudi cestino» con la ×, senza numero, e lo chiude (DEC-117).
 */
export function RigaCestino({
  conteggio,
  selezionata,
  onApri,
  onChiudi,
}: {
  conteggio: number;
  selezionata: boolean;
  onApri: () => void;
  onChiudi: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      className={`riga riga-cartella riga-cestino ${selezionata ? "riga-selezionata interfaccia-controllo-attivo" : "interfaccia-controllo"}`}
      aria-current={selezionata ? "page" : undefined}
      onClick={selezionata ? onChiudi : onApri}
    >
      <span className="riga-icona">
        <Icona di={selezionata ? X : Trash2} />
      </span>
      <span className="riga-nome">{selezionata ? "Chiudi cestino" : "Cestino"}</span>
      {!selezionata && <span className="riga-conteggio interfaccia-dettaglio">{conteggio}</span>}
    </button>
  );
}

/**
 * Riga Impostazioni, sotto il Cestino e senza numero (CMP-06, DEC-91). Con le impostazioni
 * aperte diventa «Chiudi impostazioni» con la × e le chiude (DEC-117).
 */
export function RigaImpostazioni({
  selezionata,
  onApri,
  onChiudi,
}: {
  selezionata: boolean;
  onApri: () => void;
  onChiudi: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      className={`riga riga-cartella riga-cestino ${selezionata ? "riga-selezionata interfaccia-controllo-attivo" : "interfaccia-controllo"}`}
      aria-current={selezionata ? "page" : undefined}
      onClick={selezionata ? onChiudi : onApri}
    >
      <span className="riga-icona">
        <Icona di={selezionata ? X : Settings} />
      </span>
      <span className="riga-nome">{selezionata ? "Chiudi impostazioni" : "Impostazioni"}</span>
    </button>
  );
}

/** Cestino di trascinamento (CMP-14): compare in fondo alla colonna solo mentre si trascina. */
export function CestinoTrascinamento({
  sopra,
  ...destinazione
}: { sopra: boolean } & Pick<Trascinamento, "data-destinazione">): ReactElement {
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
