// CMP-22 Modulo di accesso (SC-05, DEC-121): una finestra sopra le note, livello 40, con il
// guscio della finestra di conferma (CMP-16). Email e password, «Non voglio usare il cloud»,
// che scollega come Esci (RB-89), e Accedi. Il focus parte dall'email e resta dentro; Invio
// da un campo accede; Esc e un clic sul velo chiudono soltanto, senza scollegare (DEC-124).
// Un solo messaggio per email o password sbagliate, senza dire quale delle due; l'email non si
// svuota. Testi in 4-schermate.md.

import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { Icona } from "./Icona";
import { Pulsante } from "./Pulsante";
import { useClicSulVelo } from "./velo";
import "./FinestraConferma.css";
import "./ModuloAccesso.css";

export const TESTO_CREDENZIALI_ERRATE = "Email o password non corrette.";
export const TESTO_SERVER_IRRAGGIUNGIBILE = "Non riesco a raggiungere il server. Riprova tra poco.";

interface Proprieta {
  emailIniziale?: string;
  /** Prova l'accesso: null se è riuscito, altrimenti il messaggio da mostrare. */
  onAccedi: (email: string, password: string) => Promise<string | null>;
  /** «Non voglio usare il cloud». */
  onSenzaCloud: () => void;
  /** Esc o un clic sul velo: si chiude soltanto. */
  onChiudi: () => void;
}

export function ModuloAccesso({
  emailIniziale = "",
  onAccedi,
  onSenzaCloud,
  onChiudi,
}: Proprieta): ReactElement {
  const finestra = useRef<HTMLFormElement>(null);
  const campoEmail = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(emailIniziale);
  const [password, setPassword] = useState("");
  const [visibile, setVisibile] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const id = useId();
  // Mentre l'accesso è in corso il clic fuori non conta, come i pulsanti fermi.
  const velo = useClicSulVelo(onChiudi, !inCorso);

  useEffect(() => {
    campoEmail.current?.focus();
  }, []);

  const accedi = async (e?: FormEvent) => {
    e?.preventDefault();
    if (inCorso || !email.trim() || !password) return;
    setInCorso(true);
    setErrore(null);
    const messaggio = await onAccedi(email, password);
    setInCorso(false);
    if (messaggio) setErrore(messaggio);
  };

  const suTasto = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onChiudi();
    } else if (e.key === "Tab") {
      // Il focus resta dentro la finestra.
      const fermate = [...(finestra.current?.querySelectorAll<HTMLElement>("input, button") ?? [])];
      const i = fermate.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      fermate[(i + (e.shiftKey ? -1 : 1) + fermate.length) % fermate.length]?.focus();
    }
  };

  return createPortal(
    <div className="velo" {...velo}>
      <form
        ref={finestra}
        className="finestra-conferma modulo-accesso"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-titolo`}
        aria-describedby={`${id}-sottotitolo`}
        onKeyDown={suTasto}
        onSubmit={(e) => void accedi(e)}
      >
        <div>
          <p id={`${id}-titolo`} className="interfaccia-titolo">
            Accedi a Memodu
          </p>
          <p id={`${id}-sottotitolo`} className="finestra-conferma-testo interfaccia-messaggio">
            Accedi alla tua installazione.
          </p>
        </div>
        <label className="modulo-accesso-campo">
          <span className="interfaccia-etichetta">Email</span>
          <input
            ref={campoEmail}
            className="campo-impostazione interfaccia-controllo"
            type="email"
            autoComplete="username"
            value={email}
            aria-invalid={errore === TESTO_CREDENZIALI_ERRATE || undefined}
            aria-describedby={errore ? `${id}-errore` : undefined}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="modulo-accesso-campo">
          <span className="interfaccia-etichetta">Password</span>
          <span className="modulo-accesso-password">
            <input
              className="campo-impostazione interfaccia-controllo"
              type={visibile ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              aria-invalid={errore === TESTO_CREDENZIALI_ERRATE || undefined}
              aria-describedby={errore ? `${id}-errore` : undefined}
              onChange={(e) => setPassword(e.target.value)}
            />
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
        </label>
        {errore && (
          <p
            id={`${id}-errore`}
            className="modulo-accesso-errore interfaccia-dettaglio"
            role="alert"
          >
            <Icona di={CircleAlert} />
            {errore}
          </p>
        )}
        <div className="finestra-conferma-pulsanti modulo-accesso-pulsanti">
          <Pulsante tipo="secondario" onClick={onSenzaCloud} disabled={inCorso}>
            Non voglio usare il cloud
          </Pulsante>
          <Pulsante type="submit" inCorso={inCorso}>
            Accedi
          </Pulsante>
        </div>
      </form>
    </div>,
    document.body,
  );
}
