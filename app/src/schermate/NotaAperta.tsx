// SC-03 Schermata di scrittura: campo titolo (può restare vuoto, RB-15), sotto la riga dei
// metadati (ultima modifica e tag in sola lettura, DEC-44) e il testo della nota. Titolo e
// riga restano fissi e scorre il solo corpo.
// Le modifiche risalgono con onModifica: il salvataggio lo fa la finestra principale (RB-06).

import type { ReactElement } from "react";
import type { DatiNota, Nota } from "@memodu/condiviso";
import { Tag } from "../componenti/Tag";
import { testoModificata } from "../date";
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
        <div className="nota-aperta-metadati">
          <p className="nota-aperta-modificata interfaccia-dettaglio">
            {testoModificata(nota.modificata)}
          </p>
          {nota.tag.length > 0 && (
            <div className="nota-aperta-tag" aria-label="Tag">
              {nota.tag.map((nome) => (
                <Tag key={nome} nome={nome} />
              ))}
            </div>
          )}
        </div>
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
