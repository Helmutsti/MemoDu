// CMP-22 Modulo di accesso (SC-05, DEC-121, DEC-132): una finestra sopra le note, livello 40,
// con il guscio della finestra di conferma (CMP-16). Email e password, «Password dimenticata?»,
// «Non voglio usare il cloud», che scollega come Esci (RB-89), e Accedi. Il focus parte dall'email
// e resta dentro; Invio da un campo accede; Esc e un clic sul velo chiudono soltanto, senza
// scollegare (DEC-124). Un solo messaggio per email o password sbagliate, senza dire quale delle
// due; l'email non si svuota. «Password dimenticata?» porta al recupero nella stessa finestra
// (RB-99), che finisce con la chiave di recupero nuova. Testi in 4-schermate.md.

import { useState, type ReactElement } from "react";
import { Casella } from "./Casella";
import {
  CampoFinestra,
  ChiaveNuova,
  FinestraAccount,
  MessaggioInLinea,
  PulsantiFinestra,
  TESTO_PASSWORD_DIVERSE,
  TESTO_SERVER_IRRAGGIUNGIBILE,
} from "./FinestraAccount";
import { Pulsante } from "./Pulsante";

export { TESTO_SERVER_IRRAGGIUNGIBILE };
export const TESTO_CREDENZIALI_ERRATE = "Email o password non corrette.";

interface Proprieta {
  emailIniziale?: string;
  /** Prova l'accesso: null se è riuscito, altrimenti il messaggio da mostrare. */
  onAccedi: (email: string, password: string) => Promise<string | null>;
  /**
   * Recupera l'account (RB-99): la chiave di recupero nuova se è riuscito, altrimenti il
   * messaggio da mostrare.
   */
  onRecupera?: (
    email: string,
    chiave: string,
    nuova: string,
    scollegaAltri: boolean,
  ) => Promise<{ chiave: string } | { errore: string }>;
  /** Dopo «Ho conservato la chiave»: il dispositivo è già collegato. */
  onRecuperato?: () => void;
  /** «Non voglio usare il cloud». */
  onSenzaCloud: () => void;
  /** Esc o un clic sul velo: si chiude soltanto. */
  onChiudi: () => void;
}

export function ModuloAccesso({
  emailIniziale = "",
  onAccedi,
  onRecupera,
  onRecuperato,
  onSenzaCloud,
  onChiudi,
}: Proprieta): ReactElement {
  const [modo, setModo] = useState<"accesso" | "recupero">("accesso");
  const [email, setEmail] = useState(emailIniziale);
  const [password, setPassword] = useState("");
  const [chiave, setChiave] = useState("");
  const [nuova, setNuova] = useState("");
  const [ripetuta, setRipetuta] = useState("");
  const [scollega, setScollega] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [chiaveNuova, setChiaveNuova] = useState<string | null>(null);

  const accedi = async () => {
    if (!email.trim() || !password) return;
    setInCorso(true);
    setErrore(null);
    const messaggio = await onAccedi(email, password);
    setInCorso(false);
    if (messaggio) setErrore(messaggio);
  };

  const recupera = async () => {
    if (!onRecupera || !email.trim() || !chiave.trim() || !nuova || !ripetuta) return;
    if (nuova !== ripetuta) return setErrore(TESTO_PASSWORD_DIVERSE);
    setInCorso(true);
    setErrore(null);
    const esito = await onRecupera(email, chiave, nuova, scollega);
    setInCorso(false);
    if ("errore" in esito) setErrore(esito.errore);
    else setChiaveNuova(esito.chiave);
  };

  const vaiA = (nuovoModo: "accesso" | "recupero") => {
    setModo(nuovoModo);
    setErrore(null);
  };

  if (chiaveNuova) return <ChiaveNuova chiave={chiaveNuova} onFatto={() => onRecuperato?.()} />;

  if (modo === "recupero") {
    return (
      <FinestraAccount
        titolo="Recupera l'account"
        sottotitolo="Scrivi la chiave di recupero e scegli una password nuova. Le tue note restano tutte."
        inCorso={inCorso}
        onChiudi={onChiudi}
        onInvia={() => void recupera()}
      >
        <CampoFinestra
          etichetta="Email"
          tipo="email"
          autoComplete="username"
          valore={email}
          onCambia={setEmail}
        />
        <CampoFinestra
          etichetta="Chiave di recupero"
          autoComplete="off"
          valore={chiave}
          onCambia={setChiave}
        />
        <CampoFinestra
          etichetta="Password nuova"
          password
          autoComplete="new-password"
          valore={nuova}
          onCambia={setNuova}
        />
        <CampoFinestra
          etichetta="Ripeti la password nuova"
          password
          autoComplete="new-password"
          valore={ripetuta}
          onCambia={setRipetuta}
        />
        <Casella
          etichetta="Scollega gli altri miei dispositivi"
          spuntata={scollega}
          onCambia={setScollega}
          disabled={inCorso}
        />
        {errore && <MessaggioInLinea testo={errore} />}
        <PulsantiFinestra>
          <Pulsante tipo="secondario" onClick={() => vaiA("accesso")} disabled={inCorso}>
            Torna all'accesso
          </Pulsante>
          <Pulsante type="submit" inCorso={inCorso}>
            Recupera
          </Pulsante>
        </PulsantiFinestra>
      </FinestraAccount>
    );
  }

  return (
    <FinestraAccount
      titolo="Accedi a Memodu"
      sottotitolo="Accedi alla tua installazione."
      inCorso={inCorso}
      onChiudi={onChiudi}
      onInvia={() => void accedi()}
    >
      <CampoFinestra
        etichetta="Email"
        tipo="email"
        autoComplete="username"
        valore={email}
        onCambia={setEmail}
        invalido={errore === TESTO_CREDENZIALI_ERRATE}
      />
      <CampoFinestra
        etichetta="Password"
        password
        autoComplete="current-password"
        valore={password}
        onCambia={setPassword}
        invalido={errore === TESTO_CREDENZIALI_ERRATE}
      />
      {onRecupera && (
        <Pulsante tipo="tenue" onClick={() => vaiA("recupero")} disabled={inCorso}>
          Password dimenticata?
        </Pulsante>
      )}
      {errore && <MessaggioInLinea testo={errore} />}
      <PulsantiFinestra>
        <Pulsante tipo="secondario" onClick={onSenzaCloud} disabled={inCorso}>
          Non voglio usare il cloud
        </Pulsante>
        <Pulsante type="submit" inCorso={inCorso}>
          Accedi
        </Pulsante>
      </PulsantiFinestra>
    </FinestraAccount>
  );
}
