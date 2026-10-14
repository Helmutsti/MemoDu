// Il guscio comune delle finestre dell'account (CMP-22, CMP-35, CMP-36): quello della finestra di
// conferma (CMP-16), sopra il resto con il velo, livello 40. Il focus parte dal primo campo e
// resta dentro; Esc e un clic sul velo chiudono soltanto (DEC-124), ma non mentre una richiesta è
// in corso. Qui ci sono anche i pezzi che le finestre si scambiano: i campi con l'etichetta
// piccola, il messaggio in linea e la chiave di recupero nuova.

import { CircleAlert, Eye, EyeOff } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChiaveDaConservare } from "./ChiaveDaConservare";
import { Icona } from "./Icona";
import { Pulsante } from "./Pulsante";
import { useClicSulVelo } from "./velo";
import "./FinestraConferma.css";
import "./ModuloAccesso.css";

export const TESTO_SERVER_IRRAGGIUNGIBILE = "Non riesco a raggiungere il server. Riprova tra poco.";
export const TESTO_PASSWORD_DIVERSE = "Le due password non sono uguali.";
export const TESTO_CHIAVE_ERRATA = "Chiave di recupero non corretta.";

interface Proprieta {
  titolo: string;
  sottotitolo?: string;
  /** Una richiesta in corso: Esc e il clic fuori non contano. */
  inCorso: boolean;
  onChiudi: () => void;
  onInvia?: () => void;
  /** Il nome della classe in più, per gli spazi propri di una finestra. */
  className?: string;
  children: ReactNode;
}

export function FinestraAccount({
  titolo,
  sottotitolo,
  inCorso,
  onChiudi,
  onInvia,
  className,
  children,
}: Proprieta): ReactElement {
  const finestra = useRef<HTMLFormElement>(null);
  const id = useId();
  const velo = useClicSulVelo(onChiudi, !inCorso);

  useEffect(() => {
    finestra.current?.querySelector<HTMLElement>("input, button")?.focus();
  }, [titolo]);

  const suTasto = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (!inCorso) onChiudi();
    } else if (e.key === "Tab") {
      // Il focus resta dentro la finestra.
      const fermate = [
        ...(finestra.current?.querySelectorAll<HTMLElement>("input, button:not(:disabled)") ?? []),
      ];
      const i = fermate.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      fermate[(i + (e.shiftKey ? -1 : 1) + fermate.length) % fermate.length]?.focus();
    }
  };

  const invia = (e: FormEvent) => {
    e.preventDefault();
    if (!inCorso) onInvia?.();
  };

  return createPortal(
    <div className="velo" {...velo}>
      <form
        ref={finestra}
        className={`finestra-conferma modulo-accesso ${className ?? ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-titolo`}
        aria-describedby={sottotitolo ? `${id}-sottotitolo` : undefined}
        onKeyDown={suTasto}
        onSubmit={invia}
      >
        <div>
          <p id={`${id}-titolo`} className="interfaccia-titolo">
            {titolo}
          </p>
          {sottotitolo && (
            <p id={`${id}-sottotitolo`} className="finestra-conferma-testo interfaccia-messaggio">
              {sottotitolo}
            </p>
          )}
        </div>
        {children}
      </form>
    </div>,
    document.body,
  );
}

/** Un campo con la sua etichetta piccola; con `password` l'occhio che la mostra. */
export function CampoFinestra({
  etichetta,
  valore,
  onCambia,
  password = false,
  autoComplete,
  tipo = "text",
  invalido,
  descrittoDa,
}: {
  etichetta: string;
  valore: string;
  onCambia: (valore: string) => void;
  password?: boolean;
  autoComplete?: string;
  tipo?: "text" | "email";
  invalido?: boolean;
  descrittoDa?: string;
}): ReactElement {
  const [visibile, setVisibile] = useState(false);
  const input = (
    <input
      className="campo-impostazione interfaccia-controllo"
      type={password ? (visibile ? "text" : "password") : tipo}
      autoComplete={autoComplete}
      spellCheck={false}
      value={valore}
      aria-invalid={invalido || undefined}
      aria-describedby={descrittoDa}
      onChange={(e) => onCambia(e.target.value)}
    />
  );
  return (
    <label className="modulo-accesso-campo">
      <span className="interfaccia-etichetta">{etichetta}</span>
      {password ? (
        <span className="modulo-accesso-password">
          {input}
          <button
            type="button"
            className="modulo-accesso-occhio"
            aria-label={visibile ? "Nascondi la password" : "Mostra la password"}
            aria-pressed={visibile}
            onClick={() => setVisibile((v) => !v)}
          >
            <Icona di={visibile ? EyeOff : Eye} />
          </button>
        </span>
      ) : (
        input
      )}
    </label>
  );
}

/** Il messaggio in linea sopra i pulsanti, annunciato quando compare. */
export function MessaggioInLinea({ id, testo }: { id?: string; testo: string }): ReactElement {
  return (
    <p id={id} className="modulo-accesso-errore interfaccia-dettaglio" role="alert">
      <Icona di={CircleAlert} />
      {testo}
    </p>
  );
}

/** I pulsanti in fondo a destra. */
export function PulsantiFinestra({ children }: { children: ReactNode }): ReactElement {
  return <div className="finestra-conferma-pulsanti modulo-accesso-pulsanti">{children}</div>;
}

/**
 * La chiave di recupero nuova, mostrata una volta sola dopo la conferma del server (RB-99): dopo
 * il recupero e dopo un cambio della password fatto con la chiave.
 */
export function ChiaveNuova({
  chiave,
  onFatto,
}: {
  chiave: string;
  onFatto: () => void;
}): ReactElement {
  return (
    <FinestraAccount
      titolo="La tua nuova chiave di recupero"
      sottotitolo="La vedi solo adesso. Conservala: ti serve se dimentichi la password. Quella di prima non vale più."
      inCorso={false}
      // Esc e il clic fuori non la chiudono: la chiave non si rivede (RB-99).
      onChiudi={() => undefined}
      onInvia={onFatto}
    >
      <ChiaveDaConservare chiave={chiave} />
      <p className="modulo-accesso-promemoria interfaccia-messaggio">
        Durante la prova mandala a Manuel Cucca, che conserva le chiavi di tutti.
      </p>
      <PulsantiFinestra>
        <Pulsante type="submit">Ho conservato la chiave</Pulsante>
      </PulsantiFinestra>
    </FinestraAccount>
  );
}
