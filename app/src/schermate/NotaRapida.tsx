// SC-02 Nota rapida (FL-01, CMP-23): finestra di sistema senza cornice, pronta alla scrittura, senza
// titolo (RB-15). Si salva dopo 2 s di pausa e perdendo il focus (RB-06); si chiude solo con
// Chiudi o il tasto Esc, che salvano: Esc vuol dire «ho finito», non annulla (RB-02, DEC-34,
// DEC-50, DEC-53); chiusa vuota non crea niente (RB-03). Un clic altrove o la scorciatoia
// premuta di nuovo la salvano e la lasciano aperta (RB-04). "Apri nel programma", dalla freccia di Chiudi, la porta nella
// finestra principale (RB-05). Se l'API non risponde: SC-07 e conferma alla chiusura
// (RB-61, RB-62).

import { ArrowBigUp, CornerDownLeft } from "lucide-react";
import { useEffect, useRef, useState, type ReactElement } from "react";
import { api } from "../api";
import { FinestraConferma } from "../componenti/FinestraConferma";
import { PulsanteDiviso } from "../componenti/Pulsante";
import { cursoreDalClic, Editor } from "../editor/Editor";
import {
  allaRichiestaDiChiusura,
  allUscita,
  annullaUscita,
  apriNelProgramma,
  chiudiNotaRapida,
  confermaUscita,
} from "../finestra";
import { PAUSA_MS } from "../salvataggio";
import { Blocco } from "./Blocco";
import "./NotaRapida.css";

export function NotaRapida(): ReactElement {
  const testo = useRef("");
  const salvato = useRef("");
  const id = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inCorso = useRef<Promise<boolean>>(Promise.resolve(true));
  const [bloccata, setBloccata] = useState(false);
  const [riprovando, setRiprovando] = useState(false);
  const [conferma, setConferma] = useState(false);
  /** La conferma è comparsa per «Esci da Memodu». */
  const uscendo = useRef(false);

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

  /** Salva; una nota nata e poi svuotata si cancella (RB-03, DEC-39). `false` se l'API non
   * risponde. */
  const salvaPerChiudere = async (): Promise<boolean> => {
    if (!(await salva())) return false;
    if (id.current !== null && testo.current.trim() === "") {
      await api.eliminaSeVuota(id.current).catch(() => {});
    }
    return true;
  };

  const chiudi = async () => {
    if (await salvaPerChiudere()) await chiudiNotaRapida();
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

  // Esc chiude, se nessuna pillola, menu o finestra l'ha già usato. Con SC-07 davanti il
  // testo non è salvato: Esc chiede conferma (RB-62), così la finestra si può sempre chiudere.
  useEffect(() => {
    const suTasto = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || conferma) return;
      e.preventDefault();
      if (bloccata) setConferma(true);
      else void chiudi();
    };
    window.addEventListener("keydown", suTasto);
    return () => window.removeEventListener("keydown", suTasto);
  });

  // Maiusc + Invio chiude come Chiudi (DEC-65): si intercetta prima dell'editor, che
  // altrimenti andrebbe a capo. Con SC-07 davanti chiede conferma, come Esc (RB-62).
  useEffect(() => {
    const suTasto = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || !e.shiftKey || e.ctrlKey || e.altKey || e.metaKey || conferma)
        return;
      if ((e.target as Element).closest?.(".menu")) return;
      e.preventDefault();
      e.stopPropagation();
      if (bloccata) setConferma(true);
      else void chiudi();
    };
    window.addEventListener("keydown", suTasto, true);
    return () => window.removeEventListener("keydown", suTasto, true);
  });

  // Chiusura dal sistema (Alt + F4) come Chiudi; con SC-07 davanti, la conferma (RB-62).
  // «Esci da Memodu»: salva, o chiede conferma prima di uscire.
  const gestori = useRef({ chiudi, salvaPerChiudere, bloccata });
  useEffect(() => {
    gestori.current = { chiudi, salvaPerChiudere, bloccata };
  });
  useEffect(() => {
    const togliChiusura = allaRichiestaDiChiusura(() => {
      if (gestori.current.bloccata) setConferma(true);
      else void gestori.current.chiudi();
    });
    const togliUscita = allUscita(async () => {
      if (await gestori.current.salvaPerChiudere()) return true;
      uscendo.current = true;
      setConferma(true);
      return false;
    });
    return () => {
      togliChiusura();
      togliUscita();
    };
  }, []);

  // Perdendo il focus (clic altrove, un'altra nota rapida) si salva e si resta aperti: la
  // nota rapida si chiude solo con Chiudi o Esc (RB-02, RB-04, DEC-53).
  const salvaOra = useRef(salva);
  useEffect(() => {
    salvaOra.current = salva;
  });
  useEffect(() => {
    const suPerdita = () => void salvaOra.current();
    window.addEventListener("blur", suPerdita);
    return () => window.removeEventListener("blur", suPerdita);
  }, []);

  return (
    <div className="nota-rapida">
      <div className="nota-rapida-fascia" data-tauri-drag-region inert={bloccata} />
      <div
        className="nota-rapida-area"
        inert={bloccata}
        // Un clic nel vuoto porta il cursore nel testo (DEC-66).
        onMouseDown={(e) => cursoreDalClic(e.currentTarget, e)}
      >
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
      <div className="nota-rapida-azioni" data-tauri-drag-region inert={bloccata}>
        <PulsanteDiviso
          etichetta="Chiudi"
          scorciatoia={{ icone: [ArrowBigUp, CornerDownLeft], tasti: "Shift+Enter" }}
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
          onAnnulla={() => {
            setConferma(false);
            if (uscendo.current) void annullaUscita();
            uscendo.current = false;
          }}
          onConferma={() => void (uscendo.current ? confermaUscita() : chiudiNotaRapida())}
        />
      )}
    </div>
  );
}
