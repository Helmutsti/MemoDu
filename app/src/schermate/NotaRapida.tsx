// SC-02 Nota rapida (FL-01, CMP-23): finestra di sistema senza cornice, pronta alla scrittura, senza
// titolo (RB-15). Si salva dopo 2 s di pausa (RB-06); Salva, Esc per chiudere, il tasto Esc
// o un clic altrove salvano e chiudono: Esc vuol dire «ho finito», non annulla (RB-02,
// DEC-34); chiusa vuota non crea niente (RB-03). La scorciatoia premuta di nuovo la salva e
// la lascia aperta (RB-04). "Apri nel programma", dalla freccia di Salva, la porta nella
// finestra principale (RB-05). Se l'API non risponde: SC-07 e conferma alla chiusura
// (RB-61, RB-62).

import { useEffect, useRef, useState, type ReactElement } from "react";
import { api } from "../api";
import { FinestraConferma } from "../componenti/FinestraConferma";
import { Pulsante, PulsanteDiviso } from "../componenti/Pulsante";
import { Editor } from "../editor/Editor";
import {
  alleAltreNoteRapide,
  annunciaFocus,
  apriNelProgramma,
  chiudiNotaRapida,
} from "../finestra";
import { PAUSA_MS } from "../salvataggio";
import { Blocco } from "./Blocco";
import "./NotaRapida.css";

/** Attesa dopo la perdita del focus: un'altra nota rapida può averlo preso nel frattempo. */
const ATTESA_CLIC_ALTROVE_MS = 200;

export function NotaRapida(): ReactElement {
  const testo = useRef("");
  const salvato = useRef("");
  const id = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inCorso = useRef<Promise<boolean>>(Promise.resolve(true));
  const restaAperta = useRef(false);
  const [bloccata, setBloccata] = useState(false);
  const [riprovando, setRiprovando] = useState(false);
  const [conferma, setConferma] = useState(false);

  /** Salva quello che manca; `false` se l'API non risponde (SC-07). */
  const salva = (): Promise<boolean> => {
    clearTimeout(timer.current);
    inCorso.current = inCorso.current.then(async () => {
      const contenuto = testo.current;
      if (contenuto === salvato.current) return true;
      // Nota rapida vuota: non si crea niente (RB-03).
      if (id.current === null && contenuto.trim() === "") return true;
      try {
        if (id.current === null) id.current = (await api.crea({ contenuto })).id;
        else await api.salva(id.current, { contenuto });
        salvato.current = contenuto;
        return true;
      } catch {
        setBloccata(true);
        return false;
      }
    });
    return inCorso.current;
  };

  const chiudi = async () => {
    if (await salva()) await chiudiNotaRapida();
    else setConferma(true);
  };

  const apriNelProgrammaCompleto = async () => {
    if (!(await salva())) return;
    await apriNelProgramma(id.current);
    await chiudiNotaRapida();
  };

  const riprova = async () => {
    setRiprovando(true);
    if (await salva()) setBloccata(false);
    setRiprovando(false);
  };

  // Esc chiude, se nessuna pillola, menu o finestra l'ha già usato.
  useEffect(() => {
    const suTasto = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || bloccata || conferma) return;
      e.preventDefault();
      void chiudi();
    };
    window.addEventListener("keydown", suTasto);
    return () => window.removeEventListener("keydown", suTasto);
  });

  // Clic altrove: salva e chiude. Non se il focus passa a un'altra nota rapida o se la
  // scorciatoia ne apre un'altra: allora si salva e resta aperta (RB-04).
  useEffect(() => {
    let attesa: ReturnType<typeof setTimeout> | undefined;
    const suPerdita = () => {
      void salva();
      restaAperta.current = false;
      attesa = setTimeout(() => {
        if (!restaAperta.current && !bloccata && !conferma) void chiudi();
      }, ATTESA_CLIC_ALTROVE_MS);
    };
    const suFocus = () => {
      clearTimeout(attesa);
      void annunciaFocus();
    };
    const togli = alleAltreNoteRapide(() => {
      restaAperta.current = true;
      void salva();
    });
    window.addEventListener("blur", suPerdita);
    window.addEventListener("focus", suFocus);
    return () => {
      clearTimeout(attesa);
      togli();
      window.removeEventListener("blur", suPerdita);
      window.removeEventListener("focus", suFocus);
    };
  });

  return (
    <div className="nota-rapida">
      <div className="nota-rapida-fascia" data-tauri-drag-region />
      <div className="nota-rapida-area">
        <Editor
          contenuto=""
          focus
          invito="Scrivi qui…"
          onModifica={(nuovo) => {
            testo.current = nuovo;
            clearTimeout(timer.current);
            timer.current = setTimeout(() => void salva(), PAUSA_MS);
          }}
        />
      </div>
      <div className="nota-rapida-azioni" data-tauri-drag-region>
        <Pulsante tipo="tenue" onClick={() => void chiudi()}>
          Esc per chiudere
        </Pulsante>
        <PulsanteDiviso
          etichetta="Salva"
          onClick={() => void chiudi()}
          nomeAltre="Altre azioni"
          voci={[
            {
              tipo: "voce",
              etichetta: "Apri nel programma",
              azione: () => void apriNelProgrammaCompleto(),
            },
          ]}
        />
      </div>
      {bloccata && <Blocco inCorso={riprovando} onRiprova={() => void riprova()} />}
      {conferma && (
        <FinestraConferma
          titolo="La nota non è salvata"
          testo="Chiudendo, il testo va perso."
          azione="Chiudi comunque"
          onAnnulla={() => setConferma(false)}
          onConferma={() => void chiudiNotaRapida()}
        />
      )}
    </div>
  );
}
