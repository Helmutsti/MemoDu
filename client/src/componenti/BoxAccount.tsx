// CMP-32 Box dell'account (DEC-122): in cima a SC-06. Senza accesso invita ad accedere; dopo
// l'accesso l'iniziale, l'email, lo stato della sincronizzazione con il pallino del suo colore,
// Esci (o Accedi con il gettone rifiutato, RB-87) e sotto il nome del dispositivo.

import { User } from "lucide-react";
import type { ReactElement, ReactNode } from "react";
import type { StatoSincronizzazione } from "../api";
import { orario, quando } from "../date";
import { Icona } from "./Icona";
import { Pulsante } from "./Pulsante";
import { Riquadro } from "./GruppoImpostazioni";
import "./BoxAccount.css";

type Tono = "attesa" | "successo" | "avviso" | "errore";

/** Testo e colore del pallino per un dispositivo collegato (DEC-122, CA-14.19 … CA-14.22). */
export function statoDelBox(s: StatoSincronizzazione): { testo: string; tono: Tono } {
  switch (s.problema) {
    case "rete":
      return {
        testo: s.ultimaRiuscita
          ? `Server non raggiungibile: ultimo backup ${orario(s.ultimaRiuscita)}`
          : "Server non raggiungibile",
        tono: "avviso",
      };
    case "errore":
      return { testo: "Non riuscita: riprovo da sola", tono: "avviso" };
    case "rifiutate":
      return { testo: "Accedi di nuovo per sincronizzare", tono: "errore" };
    case "protocollo":
      return { testo: "Memodu e il server hanno versioni diverse", tono: "errore" };
    default:
      return s.ultimaRiuscita
        ? { testo: `Sincronizzata · ${quando(s.ultimaRiuscita)}`, tono: "successo" }
        : { testo: "In attesa della prima sincronizzazione", tono: "attesa" };
  }
}

interface Proprieta {
  /** L'email di chi ha fatto l'accesso; null senza accesso. */
  email: string | null;
  stato: StatoSincronizzazione;
  uscendo: boolean;
  onAccedi: () => void;
  onEsci: () => void;
  /** La riga Nome del dispositivo, solo dopo l'accesso. */
  children?: ReactNode;
}

export function BoxAccount({
  email,
  stato,
  uscendo,
  onAccedi,
  onEsci,
  children,
}: Proprieta): ReactElement {
  if (!email) {
    return (
      <section className="box-account" aria-label="Account">
        <Riquadro>
          <div className="box-account-intestazione">
            <span className="box-account-iniziale box-account-iniziale-vuota" aria-hidden="true">
              <Icona di={User} misura={20} />
            </span>
            <span className="box-account-testi">
              <span className="box-account-titolo interfaccia-titolo">Non hai fatto l'accesso</span>
              <span className="box-account-stato interfaccia-dettaglio">
                Le note restano su questo computer.
              </span>
            </span>
            <Pulsante tipo="primario" onClick={onAccedi}>
              Accedi
            </Pulsante>
          </div>
        </Riquadro>
      </section>
    );
  }
  const { testo, tono } = statoDelBox(stato);
  const scaduto = stato.problema === "rifiutate";
  return (
    <section className="box-account" aria-label="Account">
      <Riquadro>
        <div className="box-account-intestazione">
          <span className="box-account-iniziale interfaccia-titolo-schermata" aria-hidden="true">
            {email.charAt(0).toUpperCase()}
          </span>
          <span className="box-account-testi">
            <span className="box-account-titolo interfaccia-titolo">{email}</span>
            <span className="box-account-stato interfaccia-dettaglio">
              <span className={`box-account-pallino box-account-pallino-${tono}`} />
              {testo}
            </span>
          </span>
          {scaduto ? (
            <Pulsante tipo="primario" onClick={onAccedi}>
              Accedi
            </Pulsante>
          ) : (
            <Pulsante tipo="secondario" inCorso={uscendo} onClick={onEsci}>
              Esci
            </Pulsante>
          )}
        </div>
        {children}
      </Riquadro>
    </section>
  );
}
