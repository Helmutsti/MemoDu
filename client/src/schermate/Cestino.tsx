// SC-04 Cestino (RF-15): al posto della nota, la colonna resta. Elementi dal più recente, con
// tipo, provenienza e data (CMP-17); Ripristina, Elimina definitivamente e Svuota cestino, con
// conferma prima di ogni eliminazione per sempre (RB-32, RB-55). Testi in 4-schermate.md.

import { FileText, Folder, Trash2 } from "lucide-react";
import { useState, type ReactElement } from "react";
import type { ElementoCestino } from "@memodu/condiviso";
import { FinestraConferma } from "../componenti/FinestraConferma";
import { Icona } from "../componenti/Icona";
import { Pulsante, PulsanteIcona } from "../componenti/Pulsante";
import { StatoVuoto } from "../componenti/StatoVuoto";
import { AreaScorrevole } from "../componenti/AreaScorrevole";
import "./Cestino.css";

interface Proprieta {
  elementi: ElementoCestino[];
  onRipristina: (elemento: ElementoCestino) => void;
  onElimina: (elemento: ElementoCestino) => void;
  onSvuota: () => void;
}

const data = (istante: string) =>
  new Date(istante).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const note = (n: number) => (n === 1 ? "1 nota" : `${n} note`);

/** «da Lavoro › Clienti», oppure dalla radice «da CLOUD», come nella colonna (DEC-119). */
function provenienza(e: ElementoCestino): string {
  if (e.provenienza !== "") return `da ${e.provenienza.split("/").join(" › ")}`;
  return "da CLOUD";
}

export function dettagli(e: ElementoCestino): string {
  const tipo = e.tipo === "nota" ? "Nota" : `Cartella con ${note(e.conteggio ?? 0)}`;
  return `${tipo} · ${provenienza(e)} · eliminata il ${data(e.eliminato)}`;
}

function testoElimina(e: ElementoCestino): string {
  if (e.tipo === "nota") return "La nota verrà eliminata per sempre.";
  const n = e.conteggio ?? 0;
  if (n === 0) return "La cartella verrà eliminata per sempre.";
  if (n === 1) return "La cartella e la sua nota verranno eliminate per sempre.";
  return `La cartella e le sue ${n} note verranno eliminate per sempre.`;
}

export function Cestino({ elementi, onRipristina, onElimina, onSvuota }: Proprieta): ReactElement {
  const [daEliminare, setDaEliminare] = useState<ElementoCestino | null>(null);
  const [svuota, setSvuota] = useState(false);

  if (elementi.length === 0) {
    return (
      <div className="area-nota-vuota">
        <StatoVuoto
          icona={Trash2}
          titolo="Il cestino è vuoto"
          testo="Le note e le cartelle eliminate restano qui finché non svuoti il cestino."
        />
      </div>
    );
  }

  const n = elementi.length;
  return (
    <section className="cestino" aria-labelledby="cestino-titolo">
      <AreaScorrevole className="cestino-scorrimento">
        <div className="cestino-corpo">
          <header className="cestino-intestazione">
            <h1 id="cestino-titolo" className="interfaccia-titolo-schermata">
              Cestino
            </h1>
            <Pulsante tipo="secondario" onClick={() => setSvuota(true)}>
              Svuota cestino
            </Pulsante>
          </header>
          <ul className="cestino-elenco">
            {elementi.map((e) => (
              <li key={e.id} className="elemento-cestino">
                <span className="elemento-cestino-contenuto">
                  <span className="elemento-cestino-icona">
                    <Icona di={e.tipo === "nota" ? FileText : Folder} />
                  </span>
                  <span className="elemento-cestino-testi">
                    <span className="elemento-cestino-nome interfaccia-titolo">
                      {e.nome || "Nota vuota"}
                    </span>
                    <span className="elemento-cestino-dettagli interfaccia-dettaglio">
                      {dettagli(e)}
                    </span>
                  </span>
                </span>
                <span className="elemento-cestino-azioni">
                  <Pulsante tipo="tenue" onClick={() => onRipristina(e)}>
                    Ripristina
                  </Pulsante>
                  <PulsanteIcona
                    nome="Elimina definitivamente"
                    icona={<Icona di={Trash2} />}
                    onClick={() => setDaEliminare(e)}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </AreaScorrevole>
      {daEliminare && (
        <FinestraConferma
          titolo={`Eliminare per sempre «${daEliminare.nome || "Nota vuota"}»?`}
          testo={testoElimina(daEliminare)}
          azione="Elimina definitivamente"
          onAnnulla={() => setDaEliminare(null)}
          onConferma={() => {
            onElimina(daEliminare);
            setDaEliminare(null);
          }}
        />
      )}
      {svuota && (
        <FinestraConferma
          titolo="Svuotare il cestino?"
          testo={
            n === 1
              ? "1 elemento verrà eliminato per sempre."
              : `${n} elementi verranno eliminati per sempre.`
          }
          azione="Svuota"
          onAnnulla={() => setSvuota(false)}
          onConferma={() => {
            onSvuota();
            setSvuota(false);
          }}
        />
      )}
    </section>
  );
}
