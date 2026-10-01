// CMP-24 Finestra dei dettagli (DEC-44, RF-04, RF-06): modale al centro, livello 30 con il velo.
// Date (creazione scelta con quella di sistema sotto, fine validità), tag con suggerimenti,
// cartella in sola lettura. Ogni modifica vale subito; Esc o ✕ chiudono e il focus torna dove
// era. Suggerimenti, calendario e menu si aprono sopra la finestra; la conferma di
// eliminazione di un tag sopra tutto (livello 40).

import { Calendar, CircleAlert, Plus, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import type { DatiDettagli, Nota, VoceTag } from "@memodu/condiviso";
import { Calendario } from "../componenti/Calendario";
import { FinestraConferma } from "../componenti/FinestraConferma";
import { Icona } from "../componenti/Icona";
import { Menu, type VoceMenu } from "../componenti/Menu";
import { PulsanteIcona } from "../componenti/Pulsante";
import { Tag } from "../componenti/Tag";
import { leggiGiorno, scriviGiorno, testoCreata, testoModificata } from "../date";
import "./FinestraDettagli.css";

interface Proprieta {
  nota: Nota;
  /** Titolo da mostrare sotto «Info» (per le note senza titolo, le prime parole). */
  titolo: string;
  tutti: VoceTag[];
  onDettagli: (dati: DatiDettagli) => void;
  onAggiungiTag: (nome: string) => void;
  onTogliTag: (nome: string) => void;
  onEliminaTag: (nome: string) => void;
  onChiudi: () => void;
}

const stesso = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
/** Come l'API scrive un tag: livelli senza spazi ai lati, senza «/» superflui (RB-22). */
const pulito = (nome: string) =>
  nome
    .split("/")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l !== "")
    .join("/");

/** Testo della conferma di eliminazione con il numero di note (RB-19). */
function testoConferma(note: number): string {
  const sotto = "Vengono eliminati anche i suoi sotto-tag.";
  if (note === 0) return `Nessuna nota lo usa. ${sotto}`;
  if (note === 1) return `Lo usa 1 nota: resterà intatta, solo senza questo tag. ${sotto}`;
  return `Lo usano ${note} note: resteranno intatte, solo senza questo tag. ${sotto}`;
}

export function FinestraDettagli(p: Proprieta): ReactElement {
  const finestra = useRef<HTMLDivElement>(null);
  const campoTag = useRef<HTMLInputElement>(null);
  const [testoTag, setTestoTag] = useState("");
  /** Dove sta il campo dei tag: i suggerimenti si aprono sotto. */
  const [rettangoloCampo, setRettangoloCampo] = useState<DOMRect | null>(null);
  const [suggerimentiChiusi, setSuggerimentiChiusi] = useState(false);
  const [menuTag, setMenuTag] = useState<{ nome: string; x: number; y: number } | null>(null);
  const [daEliminare, setDaEliminare] = useState<string | null>(null);

  // All'apertura il focus va sulla prima data; alla chiusura torna dove era (CMP-24).
  useEffect(() => {
    const prima = document.activeElement as HTMLElement | null;
    finestra.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => prima?.focus?.();
  }, []);

  // Esc chiude anche se il focus non è più dentro la finestra; menu, calendario e conferma
  // lo usano prima di lei.
  useEffect(() => {
    const suEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || menuTag || daEliminare) return;
      if (finestra.current?.contains(document.activeElement)) return;
      e.preventDefault();
      p.onChiudi();
    };
    window.addEventListener("keydown", suEsc);
    return () => window.removeEventListener("keydown", suEsc);
  });

  const suTasto = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !e.defaultPrevented) {
      e.preventDefault();
      p.onChiudi();
    } else if (e.key === "Tab") {
      // Il focus resta dentro la finestra.
      const elementi = [
        ...(finestra.current?.querySelectorAll<HTMLElement>(
          "input, button:not([tabindex='-1']), [tabindex='0']",
        ) ?? []),
      ];
      const i = elementi.indexOf(document.activeElement as HTMLElement);
      const prossimo = (i + (e.shiftKey ? -1 : 1) + elementi.length) % elementi.length;
      e.preventDefault();
      elementi[prossimo]?.focus();
    }
  };

  // Suggerimenti: i tag che contengono il testo, non già sulla nota; poi «Crea il tag» (RB-17).
  const cercato = pulito(testoTag);
  const trovati = cercato
    ? p.tutti.filter(
        (t) =>
          t.nome.toLowerCase().includes(cercato.toLowerCase()) &&
          !p.nota.tag.some((n) => stesso(n, t.nome)),
      )
    : [];
  const esiste = p.tutti.some((t) => stesso(t.nome, cercato));
  const scegli = (nome: string) => {
    p.onAggiungiTag(nome);
    // Il campo resta con il focus: il menu dei suggerimenti non lo prende mai.
    setTestoTag("");
  };
  const vociSuggerimenti: VoceMenu[] = [
    ...trovati.map((t): VoceMenu => ({
      tipo: "voce",
      etichetta: t.nome,
      azione: () => scegli(t.nome),
      alTastoDestro: (x, y) => setMenuTag({ nome: t.nome, x, y }),
    })),
    ...(!esiste && cercato
      ? ([
          ...(trovati.length ? [{ tipo: "separatore" } as const] : []),
          {
            tipo: "voce",
            etichetta: `Crea il tag «${cercato}»`,
            icona: Plus,
            azione: () => scegli(cercato),
          },
        ] satisfies VoceMenu[])
      : []),
  ];
  const mostraSuggerimenti =
    !suggerimentiChiusi && vociSuggerimenti.length > 0 && daEliminare === null && rettangoloCampo;

  const note = (nome: string) => p.tutti.find((t) => stesso(t.nome, nome))?.note ?? 0;

  return createPortal(
    <div
      className="velo velo-overlay"
      // Un clic sul velo, fuori dalla finestra, la chiude come la ✕ (DEC-81); menu, calendario
      // e conferma aperti lo usano prima per chiudersi loro.
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget || menuTag || daEliminare) return;
        if (finestra.current?.querySelector(".dettagli-data-aperta")) return;
        p.onChiudi();
      }}
    >
      <div
        ref={finestra}
        className="finestra-dettagli"
        role="dialog"
        aria-modal="true"
        aria-label={`Info di ${p.titolo}`}
        onKeyDown={suTasto}
      >
        <div className="dettagli-intestazione">
          <div className="dettagli-titoli">
            <p className="interfaccia-titolo">Info</p>
            <p className="dettagli-nota interfaccia-messaggio">{p.titolo}</p>
          </div>
          <PulsanteIcona nome="Chiudi" icona={<Icona di={X} />} onClick={p.onChiudi} />
        </div>

        <p className="dettagli-gruppo interfaccia-titolo-gruppo">Date</p>
        <RigaData
          etichetta="Data di creazione"
          descrizione={testoCreata(p.nota.creata)}
          valore={p.nota.creataScelta}
          vuoto={scriviGiorno(p.nota.creata.slice(0, 10))}
          onCambia={(giorno) => p.onDettagli({ creataScelta: giorno })}
        />
        <RigaData
          etichetta="Fine validità"
          descrizione="Solo un promemoria: alla scadenza non succede nulla"
          valore={p.nota.fineValidita}
          vuoto="Nessuna"
          onCambia={(giorno) => p.onDettagli({ fineValidita: giorno })}
        />
        <p className="dettagli-rientro dettagli-tenue interfaccia-dettaglio">
          Ultima modifica: {testoModificata(p.nota.modificata).replace("Modificata ", "")}
        </p>

        <p className="dettagli-gruppo interfaccia-titolo-gruppo">Tag</p>
        <div className="dettagli-rientro dettagli-tag">
          {p.nota.tag.map((nome) => (
            <Tag
              key={nome}
              nome={nome}
              onTogli={() => {
                p.onTogliTag(nome);
                campoTag.current?.focus();
              }}
            />
          ))}
          <input
            ref={campoTag}
            className="dettagli-campo interfaccia-messaggio"
            aria-label="Aggiungi un tag"
            placeholder="Aggiungi un tag"
            value={testoTag}
            onKeyDown={(e) => {
              if (e.key === "Enter" && cercato && !mostraSuggerimenti) {
                e.preventDefault();
                p.onAggiungiTag(cercato);
                setTestoTag("");
              }
            }}
            onChange={(e) => {
              setTestoTag(e.target.value);
              setRettangoloCampo(e.currentTarget.getBoundingClientRect());
              setSuggerimentiChiusi(false);
            }}
          />
        </div>

        <p className="dettagli-gruppo interfaccia-titolo-gruppo">Cartella</p>
        <p className="dettagli-rientro interfaccia-messaggio">
          {p.nota.cartella === "" ? "Non organizzata" : p.nota.cartella.split("/").join(" › ")}
        </p>
      </div>

      {mostraSuggerimenti && (
        <Menu
          voci={vociSuggerimenti}
          etichetta="Suggerimenti dei tag"
          x={rettangoloCampo.left}
          y={rettangoloCampo.bottom + 4}
          sopra={rettangoloCampo.top}
          sopraOverlay
          attivaIniziale={0}
          inPausa={menuTag !== null}
          onChiudi={() => setSuggerimentiChiusi(true)}
          onFine={() => undefined}
        />
      )}
      {menuTag && (
        <Menu
          voci={[
            {
              tipo: "voce",
              etichetta: "Elimina tag…",
              icona: Trash2,
              errore: true,
              azione: () => setDaEliminare(menuTag.nome),
            },
          ]}
          etichetta={`Tag ${menuTag.nome}`}
          x={menuTag.x}
          y={menuTag.y}
          sopraOverlay
          onChiudi={() => setMenuTag(null)}
        />
      )}
      {daEliminare && (
        <FinestraConferma
          titolo={`Eliminare il tag «${daEliminare}»?`}
          testo={testoConferma(note(daEliminare))}
          azione="Elimina tag"
          onAnnulla={() => {
            setDaEliminare(null);
            setSuggerimentiChiusi(true);
            campoTag.current?.focus();
          }}
          onConferma={() => {
            p.onEliminaTag(daEliminare);
            setDaEliminare(null);
            setSuggerimentiChiusi(true);
            campoTag.current?.focus();
          }}
        />
      )}
    </div>,
    document.body,
  );
}

/** Riga di una data (CMP-18 con campo e calendario): si scrive GG/MM/AAAA o si sceglie. */
function RigaData(p: {
  etichetta: string;
  descrizione: string;
  valore: string | null;
  vuoto: string;
  onCambia: (giorno: string | null) => void;
}): ReactElement {
  const scritto = p.valore ? scriviGiorno(p.valore) : "";
  const [testo, setTesto] = useState(scritto);
  // Data scritta che non esiste, confermata con Invio: messaggio sotto il campo (CMP-03, DEC-52).
  const [errore, setErrore] = useState(false);
  const idErrore = useId();
  const [calendario, setCalendario] = useState<DOMRect | null>(null);
  const campo = useRef<HTMLDivElement>(null);
  const casella = useRef<HTMLInputElement>(null);
  // L'ultimo valore inviato: Invio e poi l'uscita dal campo non lo mandano due volte.
  const [inviato, setInviato] = useState(p.valore);
  // Quando il valore cambia da fuori, il campo lo mostra.
  const [precedente, setPrecedente] = useState(p.valore);
  if (precedente !== p.valore) {
    setPrecedente(p.valore);
    setInviato(p.valore);
    setTesto(scritto);
    setErrore(false);
  }

  const cambia = (giorno: string | null) => {
    if (giorno === inviato) return;
    setInviato(giorno);
    p.onCambia(giorno);
  };

  // Una data scritta vale quando si conferma. Una che non esiste: con Invio resta nel campo con
  // il messaggio; uscendo dal campo torna quella di prima e il messaggio sparisce (DEC-52).
  const conferma = (uscita: boolean) => {
    if (testo.trim() === "") {
      setErrore(false);
      cambia(null);
      return;
    }
    const giorno = leggiGiorno(testo);
    if (giorno) {
      setErrore(false);
      cambia(giorno);
    } else if (uscita) {
      setErrore(false);
      setTesto(scritto);
    } else setErrore(true);
  };

  return (
    <div className={`dettagli-riga ${errore ? "dettagli-riga-errore" : ""}`}>
      <div className="dettagli-testi">
        <span className="interfaccia-messaggio">{p.etichetta}</span>
        <span className="dettagli-tenue interfaccia-dettaglio">{p.descrizione}</span>
      </div>
      <div className="dettagli-colonna-data">
        <div
          ref={campo}
          className={`dettagli-data ${calendario ? "dettagli-data-aperta" : ""} ${errore ? "dettagli-data-errore" : ""}`}
        >
          <input
            ref={casella}
            className="dettagli-campo-data interfaccia-messaggio"
            aria-label={p.etichetta}
            aria-invalid={errore}
            aria-describedby={errore ? idErrore : undefined}
            placeholder={p.vuoto}
            value={testo}
            onChange={(e) => {
              const nuovo = e.target.value;
              setTesto(nuovo);
              // Il messaggio resta finché la data non è corretta.
              if (errore && (nuovo.trim() === "" || leggiGiorno(nuovo))) setErrore(false);
            }}
            onBlur={() => conferma(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                conferma(false);
              }
            }}
          />
          <button
            type="button"
            className="dettagli-apri-calendario"
            aria-label={`Scegli ${p.etichetta.toLowerCase()} dal calendario`}
            aria-expanded={calendario !== null}
            data-apre-calendario=""
            onClick={() =>
              setCalendario(calendario ? null : (campo.current?.getBoundingClientRect() ?? null))
            }
          >
            <Icona di={Calendar} />
          </button>
        </div>
        {errore && (
          <p id={idErrore} className="dettagli-errore-data interfaccia-dettaglio" role="alert">
            <Icona di={CircleAlert} />
            Data non valida: scrivi GG/MM/AAAA
          </p>
        )}
      </div>
      {calendario && (
        <Calendario
          valore={p.valore}
          ancora={calendario}
          sopraOverlay
          onScegli={(giorno) => {
            setCalendario(null);
            setErrore(false);
            setTesto(giorno ? scriviGiorno(giorno) : "");
            cambia(giorno);
            casella.current?.focus();
          }}
          onChiudi={() => {
            setCalendario(null);
            casella.current?.focus();
          }}
        />
      )}
    </div>
  );
}
