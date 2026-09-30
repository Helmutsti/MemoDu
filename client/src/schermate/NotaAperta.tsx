// SC-03 Schermata di scrittura: in alto, al centro, il percorso con le cartelle e il titolo
// (CMP-26, DEC-71), che passandoci sopra mostra ultima modifica e tag (CMP-27); nel foglio solo
// il testo della nota, che scorre tutto insieme (DEC-59).
// Le modifiche risalgono con onModifica: il salvataggio lo fa la finestra principale (RB-06).

import { useRef, type ReactElement } from "react";
import type { DatiNota, Nota, Percorso as PercorsoCartella } from "@memodu/condiviso";
import { AreaScorrevole } from "../componenti/AreaScorrevole";
import { Percorso } from "../componenti/Percorso";
import { cursoreDalClic, Editor } from "../editor/Editor";
import "./NotaAperta.css";

interface Proprieta {
  nota: Nota;
  /** Nota appena creata: il cursore va nel corpo (CA-02.1). */
  nuova: boolean;
  onModifica: (dati: DatiNota) => void;
  /** Una cartella del percorso: la si apre nella colonna. */
  onApriCartella: (percorso: PercorsoCartella) => void;
}

export function NotaAperta({ nota, nuova, onModifica, onApriCartella }: Proprieta): ReactElement {
  const pagina = useRef<HTMLElement>(null);
  return (
    <>
      <Percorso
        cartella={nota.cartella}
        titolo={nota.titolo}
        modificata={nota.modificata}
        tag={nota.tag}
        onTitolo={(titolo) => onModifica({ titolo })}
        onTornaAlTesto={() =>
          pagina.current?.querySelector<HTMLElement>("[contenteditable=true]")?.focus()
        }
        onApriCartella={onApriCartella}
      />
      <article
        ref={pagina}
        className="nota-aperta"
        // Un clic nel vuoto del foglio porta il cursore nel testo (DEC-66).
        onMouseDown={(e) => pagina.current && cursoreDalClic(pagina.current, e)}
      >
        <AreaScorrevole className="nota-aperta-scorrimento">
          <div className="nota-aperta-corpo">
            <div className="nota-aperta-misura">
              <Editor
                contenuto={nota.contenuto}
                focus={nuova}
                onModifica={(contenuto) => onModifica({ contenuto })}
              />
            </div>
          </div>
        </AreaScorrevole>
      </article>
    </>
  );
}
