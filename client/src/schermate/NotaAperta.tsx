// SC-03 Schermata di scrittura: in alto, al centro, il percorso con le cartelle e il titolo
// (CMP-26, DEC-71); un clic sul titolo apre Info (CMP-24, DEC-96). Nel foglio solo il testo
// della nota, che scorre tutto insieme (DEC-59). In vista Markdown in basso a destra c'è la
// bollicina del formato (CMP-10, DEC-131), ferma mentre il testo scorre.
// Le modifiche risalgono con onModifica: il salvataggio lo fa la finestra principale (RB-06).

import { useRef, useState, type ReactElement } from "react";
import type { DatiNota, Nota, Percorso as PercorsoCartella } from "@memodu/condiviso";
import { AreaScorrevole } from "../componenti/AreaScorrevole";
import { Bollicina } from "../componenti/Bollicina";
import { Percorso } from "../componenti/Percorso";
import { cursoreDalClic, Editor, type ManigliaEditor } from "../editor/Editor";
import type { FormatoDove } from "../editor/formati";
import "./NotaAperta.css";

interface Proprieta {
  nota: Nota;
  /** Nota appena creata: il cursore va nel corpo (CA-02.1). */
  nuova: boolean;
  /** Info è aperta sotto il titolo. */
  infoAperta: boolean;
  onModifica: (dati: DatiNota) => void;
  /** Clic sul titolo del percorso: Info si apre sotto (DEC-96). */
  onApriInfo: (ancora: { x: number; y: number }) => void;
  /** Una cartella del percorso: la si apre nella colonna. */
  onApriCartella: (percorso: PercorsoCartella) => void;
}

export function NotaAperta({
  nota,
  nuova,
  infoAperta,
  onModifica,
  onApriInfo,
  onApriCartella,
}: Proprieta): ReactElement {
  const pagina = useRef<HTMLElement>(null);
  const editor = useRef<ManigliaEditor>(null);
  const [formato, setFormato] = useState<FormatoDove | null>(null);
  return (
    <>
      <Percorso
        cartella={nota.cartella}
        titolo={nota.titolo}
        infoAperta={infoAperta}
        onApriInfo={onApriInfo}
        onApriCartella={onApriCartella}
      />
      <article
        ref={pagina}
        className={`nota-aperta ${formato ? "nota-aperta-con-bollicina" : ""}`}
        // Un clic nel vuoto del foglio porta il cursore nel testo (DEC-66).
        onMouseDown={(e) => pagina.current && cursoreDalClic(pagina.current, e)}
      >
        <AreaScorrevole className="nota-aperta-scorrimento">
          <div className="nota-aperta-corpo">
            <div className="nota-aperta-misura">
              <Editor
                ref={editor}
                contenuto={nota.contenuto}
                focus={nuova}
                markdown={nota.vista === "markdown"}
                onModifica={(contenuto) => onModifica({ contenuto })}
                onFormato={setFormato}
              />
            </div>
          </div>
        </AreaScorrevole>
        {formato && (
          <div className="nota-aperta-bollicina">
            <Bollicina
              formato={formato}
              lato="sinistra"
              onScegli={(voce) => editor.current?.applica(voce)}
            />
          </div>
        )}
      </article>
    </>
  );
}
