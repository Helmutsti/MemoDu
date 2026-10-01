// CMP-24 Info (DEC-96, RF-04, RF-06): tutto ciò che riguarda la nota in un punto solo. Titolo,
// date (creazione scelta con quella di sistema sotto, fine validità), tag con suggerimenti,
// cartella con «Sposta in…», poi Chiudi nota ed Elimina. Ogni modifica vale subito.
// - Comparsa: con un clic sul titolo del percorso, sotto di lui, livello 20 e senza velo; si
//   chiude con un clic fuori o con Esc. In fondo Chiudi nota ed Elimina.
// - Finestra: da «Info» nel tasto destro su una nota della colonna, al centro con il velo
//   (livello 30); in testa «Info» e la ✕, senza Chiudi nota. Esc, ✕ o un clic sul velo chiudono
//   (DEC-81) e il focus torna dove era.
// Suggerimenti, calendario e menu si aprono sopra Info; la conferma di eliminazione di un tag
// sopra tutto (livello 40).

import { Calendar, CircleAlert, Plus, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import type { DatiDettagli, Nota, VoceTag } from "@memodu/condiviso";
import { Calendario } from "../componenti/Calendario";
import { FinestraConferma } from "../componenti/FinestraConferma";
import { Icona } from "../componenti/Icona";
import { Menu, type VoceMenu } from "../componenti/Menu";
import { Pulsante, PulsanteIcona } from "../componenti/Pulsante";
import { Tag } from "../componenti/Tag";
import { VoceAzione } from "../componenti/VoceAzione";
import { leggiGiorno, scriviGiorno, testoCreata, testoModificata } from "../date";
import { SU_MAC } from "../finestra";
import "./Info.css";

export type TipoInfo = "comparsa" | "finestra";

interface Proprieta {
  tipo: TipoInfo;
  nota: Nota;
  /** Titolo per il nome della finestra (per le note senza titolo, le prime parole). */
  titolo: string;
  tutti: VoceTag[];
  /** Comparsa: centro orizzontale e bordo inferiore del titolo del percorso. */
  ancora?: { x: number; y: number };
  onTitolo: (titolo: string) => void;
  onDettagli: (dati: DatiDettagli) => void;
  onAggiungiTag: (nome: string) => void;
  onTogliTag: (nome: string) => void;
  onEliminaTag: (nome: string) => void;
  /** «Sposta in…»: il pannello si apre accanto al pulsante. */
  onSpostaIn: (pulsante: DOMRect) => void;
  /** Solo nella Comparsa: la nota è aperta. */
  onChiudiNota?: () => void;
  onElimina: () => void;
  onChiudi: () => void;
}

const LARGHEZZA = 360;
/** Tra il titolo del percorso e la comparsa (spazio-icona). */
const DISTANZA = 8;
const MARGINE_FINESTRA = 8;

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

export function Info(p: Proprieta): ReactElement {
  const finestra = useRef<HTMLDivElement>(null);
  const campoTag = useRef<HTMLInputElement>(null);
  const [titolo, setTitolo] = useState(p.nota.titolo);
  const [testoTag, setTestoTag] = useState("");
  /** Dove sta il campo dei tag: i suggerimenti si aprono sotto. */
  const [rettangoloCampo, setRettangoloCampo] = useState<DOMRect | null>(null);
  const [suggerimentiChiusi, setSuggerimentiChiusi] = useState(false);
  const [menuTag, setMenuTag] = useState<{ nome: string; x: number; y: number } | null>(null);
  const [daEliminare, setDaEliminare] = useState<string | null>(null);
  const comparsa = p.tipo === "comparsa";
  const suChiudi = useRef(p.onChiudi);
  useEffect(() => {
    suChiudi.current = p.onChiudi;
  });

  // All'apertura il cursore va nel titolo (CA-04.2). La Finestra, chiudendosi, rimette il focus
  // dove era; la Comparsa lo lascia a chi la chiude (torna nel testo della nota).
  useEffect(() => {
    const prima = document.activeElement as HTMLElement | null;
    finestra.current?.querySelector<HTMLInputElement>("input")?.focus();
    return () => {
      if (!comparsa) prima?.focus?.();
    };
  }, [comparsa]);

  // Esc chiude anche se il focus non è più dentro Info; menu, calendario e conferma lo usano
  // prima di lei.
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

  // Comparsa: un clic fuori la chiude (come i menu). Non chiudono i clic dentro i suoi menu, il
  // calendario, la conferma e il titolo del percorso, che la apre e la chiude da sé.
  useEffect(() => {
    if (!comparsa) return;
    const suClic = (e: MouseEvent) => {
      const dove = e.target as Element;
      if (dove.closest?.(".info, .menu, .calendario, .velo, .percorso-titolo")) return;
      suChiudi.current();
    };
    window.addEventListener("mousedown", suClic, true);
    return () => window.removeEventListener("mousedown", suClic, true);
  }, [comparsa]);

  const suTasto = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && !e.defaultPrevented) {
      e.preventDefault();
      p.onChiudi();
    } else if (e.key === "Tab") {
      // Il focus resta dentro Info.
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

  // La comparsa sta sotto il titolo, centrata su di lui, senza uscire dalla finestra.
  const posizione =
    comparsa && p.ancora
      ? {
          left: Math.max(
            MARGINE_FINESTRA,
            Math.min(p.ancora.x - LARGHEZZA / 2, window.innerWidth - LARGHEZZA - MARGINE_FINESTRA),
          ),
          top: p.ancora.y + DISTANZA,
        }
      : undefined;

  const contenuto = (
    <div
      ref={finestra}
      className={`info info-${p.tipo}`}
      role="dialog"
      aria-modal={comparsa ? undefined : "true"}
      aria-label={`Info di ${p.titolo}`}
      style={posizione}
      onKeyDown={suTasto}
    >
      <div className="info-corpo">
        {!comparsa && (
          <div className="info-intestazione">
            <p className="interfaccia-titolo">Info</p>
            <PulsanteIcona nome="Chiudi" icona={<Icona di={X} />} onClick={p.onChiudi} />
          </div>
        )}

        <label className="info-blocco">
          <span className="interfaccia-controllo">Titolo</span>
          <input
            className="info-campo interfaccia-controllo"
            placeholder="Senza titolo"
            value={titolo}
            onChange={(e) => {
              setTitolo(e.target.value);
              p.onTitolo(e.target.value);
            }}
            onKeyDown={(e) => {
              // Invio conferma il titolo e chiude, come Esc: si torna a scrivere.
              if (e.key === "Enter") {
                e.preventDefault();
                p.onChiudi();
              }
            }}
          />
        </label>

        <div className="info-gruppo">
          <p className="info-titolo-gruppo interfaccia-titolo-gruppo">Date</p>
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
          <p className="info-tenue interfaccia-dettaglio">
            Ultima modifica: {testoModificata(p.nota.modificata).replace("Modificata ", "")}
          </p>
        </div>

        <div className="info-gruppo info-gruppo-stretto">
          <p className="info-titolo-gruppo interfaccia-titolo-gruppo">Tag</p>
          {p.nota.tag.length > 0 && (
            <div className="info-tag">
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
            </div>
          )}
          <input
            ref={campoTag}
            className="info-campo interfaccia-controllo"
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

        <div className="info-gruppo info-gruppo-stretto">
          <p className="info-titolo-gruppo interfaccia-titolo-gruppo">Cartella</p>
          <div className="info-cartella">
            <span className="interfaccia-controllo">
              {p.nota.cartella === "" ? "Non organizzata" : p.nota.cartella.split("/").join(" › ")}
            </span>
            <Pulsante
              tipo="tenue"
              onClick={(e) => p.onSpostaIn(e.currentTarget.getBoundingClientRect())}
            >
              Sposta in…
            </Pulsante>
          </div>
        </div>
      </div>

      <div className="menu-separatore" role="separator" />
      <div className="info-azioni">
        {comparsa && p.onChiudiNota && (
          <VoceAzione
            etichetta="Chiudi nota"
            icona={X}
            scorciatoia={`${SU_MAC ? "⌘" : "Ctrl"} + W`}
            onClick={p.onChiudiNota}
          />
        )}
        <VoceAzione etichetta="Elimina" icona={Trash2} errore onClick={p.onElimina} />
      </div>
    </div>
  );

  return createPortal(
    <>
      {comparsa ? (
        contenuto
      ) : (
        <div
          className="velo velo-overlay"
          // Un clic sul velo, fuori da Info, la chiude come la ✕ (DEC-81); menu, calendario e
          // conferma aperti lo usano prima per chiudersi loro.
          onMouseDown={(e) => {
            if (e.target !== e.currentTarget || menuTag || daEliminare) return;
            if (finestra.current?.querySelector(".info-data-aperta")) return;
            p.onChiudi();
          }}
        >
          {contenuto}
        </div>
      )}

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
    </>,
    document.body,
  );
}

/** Una data (CMP-03 con l'icona del calendario): si scrive GG/MM/AAAA o si sceglie. */
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
    <div className="info-blocco">
      <span className="interfaccia-controllo">{p.etichetta}</span>
      <div
        ref={campo}
        className={`info-data ${calendario ? "info-data-aperta" : ""} ${errore ? "info-data-errore" : ""}`}
      >
        <input
          ref={casella}
          className="info-campo-data interfaccia-controllo"
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
          className="info-apri-calendario"
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
      {errore ? (
        <p id={idErrore} className="info-errore-data interfaccia-dettaglio" role="alert">
          <Icona di={CircleAlert} />
          Data non valida: scrivi GG/MM/AAAA
        </p>
      ) : (
        <span className="info-tenue interfaccia-dettaglio">{p.descrizione}</span>
      )}
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
