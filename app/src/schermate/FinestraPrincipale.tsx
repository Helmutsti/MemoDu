// SC-01 Finestra principale, versione ridotta del frammento Must A: colonna con la sola
// sezione "Note" e il + (FL-09), area della nota a destra. Niente ricerca, cartelle, menu ···.
// Se l'API non risponde compare SC-07 al posto del contenuto, che resta in memoria (RB-61);
// chiudendo con testo non salvato si chiede conferma (RB-62).

import { FileText } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import type { Nota, VoceElenco } from "@memodu/condiviso";
import { api } from "../api";
import { FinestraConferma } from "../componenti/FinestraConferma";
import { Pulsante } from "../componenti/Pulsante";
import { RigaNota, RigaSezione } from "../componenti/RigaColonna";
import { StatoVuoto, StatoVuotoColonna } from "../componenti/StatoVuoto";
import { alChiudere, chiudiFinestra } from "../finestra";
import { CodaSalvataggio } from "../salvataggio";
import { Blocco } from "./Blocco";
import { NotaAperta } from "./NotaAperta";
import "./FinestraPrincipale.css";

export function FinestraPrincipale(): ReactElement {
  const [elenco, setElenco] = useState<VoceElenco[] | null>(null);
  const [aperta, setAperta] = useState<Nota | null>(null);
  const [sezioneAperta, setSezioneAperta] = useState(true);
  const [nuovaId, setNuovaId] = useState<string | null>(null);
  const [bloccata, setBloccata] = useState(false);
  const [riprovando, setRiprovando] = useState(false);
  const [confermaChiusura, setConfermaChiusura] = useState(false);
  const apertaAttuale = useRef<Nota | null>(null);

  // Dopo ogni salvataggio l'elenco si aggiorna: titolo e ordine per ultima modifica (RB-60).
  const [coda] = useState(
    () =>
      new CodaSalvataggio(
        api.salva,
        () => void api.elenca().then(setElenco, () => setBloccata(true)),
        () => setBloccata(true),
      ),
  );

  useEffect(() => {
    apertaAttuale.current = aperta;
  }, [aperta]);

  /** Esegue una chiamata all'API; se non riesce, SC-07 (RB-61). */
  const protetto = useCallback(async <T,>(chiamata: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await chiamata();
    } catch {
      setBloccata(true);
      return undefined;
    }
  }, []);

  // Aprendo un'altra nota, quella corrente si salva prima (RB-06); se non si salva, si resta.
  const apri = useCallback(
    async (id: string) => {
      await coda.scarica();
      if (coda.haModifiche) return;
      const nota = await protetto(() => api.leggi(id));
      if (!nota) return;
      setNuovaId(null);
      setAperta(nota);
    },
    [coda, protetto],
  );

  // Carica l'elenco e, se non c'è una nota aperta, apre la modificata più di recente.
  const carica = useCallback(async () => {
    const note = await api.elenca();
    setElenco(note);
    if (!apertaAttuale.current && note[0]) setAperta(await api.leggi(note[0].id));
  }, []);

  // All'avvio: se l'API non risponde, SC-07 (RB-61).
  useEffect(() => {
    void (async () => {
      try {
        await carica();
      } catch {
        setBloccata(true);
      }
    })();
  }, [carica]);

  // Si salva subito anche quando la finestra perde il focus o si chiude (RB-06).
  useEffect(() => {
    const suPerditaFocus = () => void coda.scarica();
    window.addEventListener("blur", suPerditaFocus);
    const togli = alChiudere(
      async () => {
        await coda.scarica({ keepalive: true });
        if (!coda.haModifiche) return true;
        setConfermaChiusura(true);
        return false;
      },
      () => coda.haModifiche,
    );
    return () => {
      window.removeEventListener("blur", suPerditaFocus);
      togli();
    };
  }, [coda]);

  // Riprova: prima il testo in attesa, poi di nuovo l'elenco.
  const riprova = async () => {
    setRiprovando(true);
    try {
      await coda.scarica();
      if (coda.haModifiche) return;
      await carica();
      setBloccata(false);
    } catch {
      setBloccata(true);
    } finally {
      setRiprovando(false);
    }
  };

  // FL-09: la nota nasce vuota nella radice, in cima all'elenco, e si apre (RB-10, RB-60).
  const nuovaNota = async () => {
    await coda.scarica();
    if (coda.haModifiche) return;
    const nota = await protetto(() => api.crea({}));
    if (!nota) return;
    const note = await protetto(api.elenca);
    if (note) setElenco(note);
    setNuovaId(nota.id);
    setAperta(nota);
    setSezioneAperta(true);
  };

  return (
    <>
      {elenco !== null && (
        <div className={`finestra ${bloccata ? "finestra-nascosta" : ""}`} inert={bloccata}>
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
              <NotaAperta
                key={aperta.id}
                nota={aperta}
                nuova={aperta.id === nuovaId}
                onModifica={(dati) => coda.modifica(aperta.id, dati)}
              />
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
      )}
      {bloccata && <Blocco inCorso={riprovando} onRiprova={riprova} />}
      {confermaChiusura && (
        <FinestraConferma
          titolo="La nota non è salvata"
          testo="Chiudendo, il testo va perso."
          azione="Chiudi comunque"
          onAnnulla={() => setConfermaChiusura(false)}
          onConferma={() => void chiudiFinestra()}
        />
      )}
    </>
  );
}
