// CMP-35 Cambia password (SC-08, DEC-132, RB-98): una finestra sopra le impostazioni. La password
// attuale, o al suo posto la chiave di recupero; la password nuova due volte; la casella per
// scollegare gli altri dispositivi. Questo dispositivo resta collegato. Fatto con la chiave di
// recupero, mostra la chiave nuova una volta sola (RB-99). Testi in 4-schermate.md.

import { useState, type ReactElement } from "react";
import { Casella } from "./Casella";
import {
  CampoFinestra,
  ChiaveNuova,
  FinestraAccount,
  MessaggioInLinea,
  PulsantiFinestra,
  TESTO_PASSWORD_DIVERSE,
} from "./FinestraAccount";
import { Pulsante } from "./Pulsante";

interface Proprieta {
  /**
   * Cambia la password: la chiave di recupero nuova (o null) se è riuscito, altrimenti il
   * messaggio da mostrare.
   */
  onCambia: (
    verifica: { attuale: string } | { chiaveRecupero: string },
    nuova: string,
    scollegaAltri: boolean,
  ) => Promise<{ chiave: string | null } | { errore: string }>;
  onChiudi: () => void;
}

export function CambiaPassword({ onCambia, onChiudi }: Proprieta): ReactElement {
  const [conChiave, setConChiave] = useState(false);
  const [verifica, setVerifica] = useState("");
  const [nuova, setNuova] = useState("");
  const [ripetuta, setRipetuta] = useState("");
  const [scollega, setScollega] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [chiaveNuova, setChiaveNuova] = useState<string | null>(null);

  const cambia = async () => {
    if (!verifica || !nuova || !ripetuta) return;
    if (nuova !== ripetuta) return setErrore(TESTO_PASSWORD_DIVERSE);
    setInCorso(true);
    setErrore(null);
    const esito = await onCambia(
      conChiave ? { chiaveRecupero: verifica } : { attuale: verifica },
      nuova,
      scollega,
    );
    setInCorso(false);
    if ("errore" in esito) setErrore(esito.errore);
    else if (esito.chiave) setChiaveNuova(esito.chiave);
    else onChiudi();
  };

  if (chiaveNuova) return <ChiaveNuova chiave={chiaveNuova} onFatto={onChiudi} />;

  return (
    <FinestraAccount
      titolo="Cambia password"
      inCorso={inCorso}
      onChiudi={onChiudi}
      onInvia={() => void cambia()}
    >
      <CampoFinestra
        key={conChiave ? "chiave" : "password"}
        etichetta={conChiave ? "Chiave di recupero" : "Password attuale"}
        password={!conChiave}
        autoComplete={conChiave ? "off" : "current-password"}
        valore={verifica}
        onCambia={setVerifica}
      />
      <Pulsante
        tipo="tenue"
        disabled={inCorso}
        onClick={() => {
          setConChiave((c) => !c);
          setVerifica("");
          setErrore(null);
        }}
      >
        {conChiave ? "Usa la password attuale" : "Usa la chiave di recupero"}
      </Pulsante>
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
        <Pulsante tipo="secondario" onClick={onChiudi} disabled={inCorso}>
          Annulla
        </Pulsante>
        <Pulsante type="submit" inCorso={inCorso}>
          Cambia password
        </Pulsante>
      </PulsantiFinestra>
    </FinestraAccount>
  );
}
