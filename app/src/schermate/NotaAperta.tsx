// SC-03 Schermata di scrittura, frammento Must A: campo titolo (può restare vuoto, RB-15)
// e testo della nota. Il titolo resta fisso e scorre il solo corpo.
// Il salvataggio arriva con l'attività 7: qui le modifiche risalgono con onModifica.

import type { ReactElement } from "react";
import type { DatiNota, Nota } from "@memodu/condiviso";
import { Editor } from "../editor/Editor";
import "./NotaAperta.css";

interface Proprieta {
  nota: Nota;
  /** Nota appena creata: il cursore va nel corpo (CA-02.1). */
  nuova: boolean;
  onModifica: (dati: DatiNota) => void;
}

export function NotaAperta({ nota, nuova, onModifica }: Proprieta): ReactElement {
  return (
    <article className="nota-aperta">
      <header className="nota-aperta-intestazione">
        <input
          className="nota-aperta-titolo nota-titolo"
          aria-label="Titolo della nota"
          placeholder="Titolo"
          defaultValue={nota.titolo}
          onChange={(e) => onModifica({ titolo: e.target.value })}
        />
      </header>
      <div className="nota-aperta-corpo">
        <div className="nota-aperta-misura">
          <Editor
            contenuto={nota.contenuto}
            focus={nuova}
            onModifica={(contenuto) => onModifica({ contenuto })}
          />
        </div>
      </div>
    </article>
  );
}
