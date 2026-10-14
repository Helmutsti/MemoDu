// CMP-36 Dispositivi collegati (SC-09, DEC-132, RB-100): una finestra sopra le impostazioni con i
// dispositivi dell'account in un riquadro come CMP-31: nome, tipo e ultima sincronizzazione.
// Questo dispositivo è il primo, segnato, senza «Scollega» (si esce con Esci, RB-89). «Scollega»
// chiede conferma nella riga stessa; dopo, la riga sparisce. Senza server un messaggio in linea
// al posto dell'elenco. Testi in 4-schermate.md.

import { useEffect, useState, type ReactElement } from "react";
import type { DispositivoCollegato } from "../api";
import { quando } from "../date";
import { FinestraAccount, MessaggioInLinea, PulsantiFinestra } from "./FinestraAccount";
import { Riquadro } from "./GruppoImpostazioni";
import { Pulsante } from "./Pulsante";
import "./DispositiviCollegati.css";

export const TESTO_ELENCO_IRRAGGIUNGIBILE = "Server non raggiungibile. Riprova tra poco.";

interface Proprieta {
  /** L'elenco dal server; un errore se non risponde. */
  onElenca: () => Promise<DispositivoCollegato[]>;
  onScollega: (id: string) => Promise<void>;
  onChiudi: () => void;
}

/** Il nome da mostrare: quello scelto, o il tipo se il dispositivo non l'ha ancora mandato. */
const nomeDi = (d: DispositivoCollegato) => d.nome ?? (d.tipo === "macos" ? "Mac" : "PC Windows");
const tipoDi = (d: DispositivoCollegato) => (d.tipo === "macos" ? "macOS" : "Windows");

function dettaglio(d: DispositivoCollegato): string {
  if (d.questo) return `${tipoDi(d)} · questo dispositivo`;
  if (!d.ultimaSincronizzazione) return `${tipoDi(d)} · non ancora sincronizzato`;
  return `${tipoDi(d)} · sincronizzato ${quando(d.ultimaSincronizzazione)}`;
}

export function DispositiviCollegati({ onElenca, onScollega, onChiudi }: Proprieta): ReactElement {
  const [elenco, setElenco] = useState<DispositivoCollegato[] | null>(null);
  const [errore, setErrore] = useState(false);
  const [daConfermare, setDaConfermare] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState(false);

  useEffect(() => {
    onElenca().then(setElenco, () => setErrore(true));
  }, [onElenca]);

  const scollega = async (id: string) => {
    setInCorso(true);
    try {
      await onScollega(id);
      setElenco((e) => e?.filter((d) => d.id !== id) ?? null);
      setDaConfermare(null);
    } catch {
      setErrore(true);
    } finally {
      setInCorso(false);
    }
  };

  return (
    <FinestraAccount
      titolo="Dispositivi collegati"
      sottotitolo={
        errore
          ? "Scollega un dispositivo perso o che non usi più."
          : "Scollega un dispositivo perso o che non usi più. Le note su quel dispositivo restano, ma non si sincronizzano più."
      }
      inCorso={inCorso}
      onChiudi={() => (daConfermare ? setDaConfermare(null) : onChiudi())}
      onInvia={onChiudi}
    >
      {errore ? (
        <MessaggioInLinea testo={TESTO_ELENCO_IRRAGGIUNGIBILE} />
      ) : (
        elenco && (
          <Riquadro className="dispositivi-collegati">
            {elenco.map((d) =>
              daConfermare === d.id ? (
                <div
                  key={d.id}
                  className="dispositivo dispositivo-conferma"
                  role="group"
                  aria-label={`Scollegare ${nomeDi(d)}`}
                >
                  <span className="dispositivo-testi">
                    <span className="dispositivo-nome interfaccia-controllo">{`Scollegare «${nomeDi(d)}»?`}</span>
                    <span className="dispositivo-dettaglio interfaccia-dettaglio">
                      Le note su quel computer restano, ma non si sincronizzano più.
                    </span>
                  </span>
                  <span className="dispositivo-azioni">
                    <Pulsante
                      tipo="secondario"
                      disabled={inCorso}
                      onClick={() => setDaConfermare(null)}
                    >
                      Annulla
                    </Pulsante>
                    <Pulsante inCorso={inCorso} onClick={() => void scollega(d.id)}>
                      Scollega
                    </Pulsante>
                  </span>
                </div>
              ) : (
                <div key={d.id} className="dispositivo">
                  <span className="dispositivo-testi">
                    <span className="dispositivo-nome interfaccia-controllo">{nomeDi(d)}</span>
                    <span className="dispositivo-dettaglio interfaccia-dettaglio">
                      {dettaglio(d)}
                    </span>
                  </span>
                  {!d.questo && (
                    <Pulsante
                      tipo="secondario"
                      disabled={inCorso}
                      aria-label={`Scollega ${nomeDi(d)}`}
                      onClick={() => setDaConfermare(d.id)}
                    >
                      Scollega
                    </Pulsante>
                  )}
                </div>
              ),
            )}
          </Riquadro>
        )
      )}
      <PulsantiFinestra>
        <Pulsante tipo="secondario" type="submit" disabled={inCorso}>
          Chiudi
        </Pulsante>
      </PulsantiFinestra>
    </FinestraAccount>
  );
}
