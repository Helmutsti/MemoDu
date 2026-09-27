// SC-01 Finestra principale, versione ridotta del frammento Must A: colonna con la sola
// sezione "Note" e il + (FL-09), area della nota a destra. Niente ricerca, cartelle, menu ···.

import { FileText } from "lucide-react";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import type { Nota, VoceElenco } from "@memodu/condiviso";
import { api } from "../api";
import { Pulsante } from "../componenti/Pulsante";
import { RigaNota, RigaSezione } from "../componenti/RigaColonna";
import { StatoVuoto, StatoVuotoColonna } from "../componenti/StatoVuoto";
import "./FinestraPrincipale.css";

export function FinestraPrincipale(): ReactElement {
  const [elenco, setElenco] = useState<VoceElenco[] | null>(null);
  const [aperta, setAperta] = useState<Nota | null>(null);
  const [sezioneAperta, setSezioneAperta] = useState(true);

  const apri = useCallback(async (id: string) => setAperta(await api.leggi(id)), []);

  // All'avvio si apre la nota modificata più di recente, se c'è.
  useEffect(() => {
    void (async () => {
      const note = await api.elenca();
      setElenco(note);
      if (note[0]) await apri(note[0].id);
    })();
  }, [apri]);

  // FL-09: la nota nasce vuota nella radice, in cima all'elenco, e si apre (RB-10, RB-60).
  const nuovaNota = async () => {
    const nota = await api.crea({});
    setElenco(await api.elenca());
    setAperta(nota);
    setSezioneAperta(true);
  };

  if (elenco === null) return <div className="finestra" />;

  return (
    <div className="finestra">
      <nav className="colonna" aria-label="Note">
        <RigaSezione
          titolo="Note"
          conteggio={elenco.length}
          aperta={sezioneAperta}
          onApriChiudi={() => setSezioneAperta(!sezioneAperta)}
          nomeAggiungi="Nuova nota"
          onAggiungi={nuovaNota}
        />
        {sezioneAperta &&
          (elenco.length === 0 ? (
            <StatoVuotoColonna testo="Le note che scrivi compaiono qui." />
          ) : (
            <ul className="colonna-elenco">
              {elenco.map((voce) => (
                <RigaNota
                  key={voce.id}
                  titolo={voce.titolo || voce.anteprima}
                  vuota={!voce.titolo && !voce.anteprima}
                  selezionata={voce.id === aperta?.id}
                  onApri={() => apri(voce.id)}
                />
              ))}
            </ul>
          ))}
      </nav>
      <main className="area-nota">
        {aperta ? (
          <article className="nota-aperta">
            {/* Provvisorio: l'editor della nota arriva con l'attività 5. */}
            <h1 className="nota-titolo">{aperta.titolo}</h1>
            <p className="nota-corpo">{aperta.contenuto}</p>
          </article>
        ) : (
          <div className="area-nota-vuota">
            <StatoVuoto
              icona={FileText}
              titolo="Nessuna nota, per ora."
              testo="Inizia a scrivere."
              azione={<Pulsante onClick={nuovaNota}>Nuova nota</Pulsante>}
            />
          </div>
        )}
      </main>
    </div>
  );
}
