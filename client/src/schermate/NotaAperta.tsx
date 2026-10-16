// SC-03 Schermata di scrittura: in alto, al centro, il percorso con le cartelle e il titolo
// (CMP-26, DEC-71); un clic sul titolo apre Info (CMP-24, DEC-96). Nel foglio solo il testo
// della nota, che scorre tutto insieme (DEC-59). In vista Markdown in basso a destra c'è la
// bollicina del formato (CMP-10, DEC-131), ferma mentre il testo scorre.
// Le modifiche risalgono con onModifica: il salvataggio lo fa la finestra principale (RB-06).
// Brainet (DEC-145, DEC-146): in vista Markdown pillole, aree e allegati; i menu di Brainet solo
// con Brainet acceso. Chiudendo la nota, gli allegati tolti che nessuna nota usa più se ne vanno
// (RB-121), dopo l'ultimo salvataggio.

import { useEffect, useRef, useState, type ReactElement } from "react";
import type { DatiNota, Nota, Percorso as PercorsoCartella } from "@memodu/condiviso";
import { AreaScorrevole } from "../componenti/AreaScorrevole";
import { Bollicina } from "../componenti/Bollicina";
import { Percorso } from "../componenti/Percorso";
import { EditorBrainet } from "../brainet/EditorBrainet";
import { pulisciDopo } from "../brainet/salvataggio";
import { cursoreDalClic, type ManigliaEditor } from "../editor/Editor";
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
  /** Brainet acceso: menu di @, dell'area e clic sulle pillole (RB-111). */
  brainet: boolean;
  /** Clic su una pillola: la pagina della sua entità (RB-124). */
  onApriEntita: (id: string) => void;
  /** Un allegato che non entra o non si apre: l'avviso della finestra. */
  onAvviso: (testo: string) => void;
  /** Dove mettere il cursore aprendo la nota (da un passaggio della pagina dell'entità). */
  cursore?: number;
  /** Scrive quello che aspetta: alla chiusura, prima di pulire gli allegati. */
  scarica: () => Promise<void>;
}

export function NotaAperta({
  nota,
  nuova,
  infoAperta,
  onModifica,
  onApriInfo,
  onApriCartella,
  brainet,
  onApriEntita,
  onAvviso,
  cursore,
  scarica,
}: Proprieta): ReactElement {
  const pagina = useRef<HTMLElement>(null);
  const editor = useRef<ManigliaEditor>(null);
  const [formato, setFormato] = useState<FormatoDove | null>(null);
  const markdown = nota.vista === "markdown";
  // Il nucleo conta i caratteri, l'editor le unità di JavaScript (le emoji ne valgono due).
  const [inizio] = useState(() =>
    cursore === undefined
      ? undefined
      : Array.from(nota.contenuto).slice(0, cursore).join("").length,
  );
  const ultimaScarica = useRef(scarica);
  useEffect(() => {
    ultimaScarica.current = scarica;
  });
  useEffect(() => () => pulisciDopo(ultimaScarica.current()), []);
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
              <EditorBrainet
                ref={editor}
                testo={nota.contenuto}
                focus={nuova || inizio !== undefined}
                cursore={inizio}
                markdown={markdown}
                // Pillole e aree solo nelle note in Brainet (DEC-147).
                attivo={brainet && markdown && nota.brainet === true}
                allegati={markdown}
                onModifica={(contenuto) => onModifica({ contenuto })}
                onFormato={setFormato}
                onApriEntita={onApriEntita}
                onAvviso={onAvviso}
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
