// CMP-24 Info (DEC-96, proposta C di DEC-97, RF-04, RF-06): tutto ciò che riguarda la nota in un
// punto solo. In cima il titolo; sotto una riga per cosa, con la sua icona e la frase intera
// (cartella, data di creazione con «Ripristina» se è stata cambiata, fine validità, tag con
// «+ Tag»); l'ultima modifica; poi Chiudi nota ed Elimina. Ogni riga si apre con un clic; ogni
// modifica vale subito.
// - Comparsa: con un clic sul titolo del percorso, sotto di lui, livello 20 e senza velo; si
//   chiude con un clic fuori o con Esc. In fondo Chiudi nota ed Elimina.
// - Finestra: da «Info» nel tasto destro su una nota della colonna, al centro con il velo
//   (livello 30); in testa «Info» e la ✕, senza Chiudi nota. Esc, ✕ o un clic sul velo chiudono
//   (DEC-81) e il focus torna dove era.
// Suggerimenti, calendario e menu si aprono sopra Info; la conferma di eliminazione di un tag
// sopra tutto (livello 40).

import { Calendar, CircleAlert, Folder, Plus, Tag as TagIcona, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import type { DatiDettagli, Nota, VoceTag } from "@memodu/condiviso";
import { AreaScorrevole } from "../componenti/AreaScorrevole";
import { Calendario } from "../componenti/Calendario";
import { FinestraConferma } from "../componenti/FinestraConferma";
import { Icona } from "../componenti/Icona";
import { Menu, type VoceMenu } from "../componenti/Menu";
import { PulsanteIcona } from "../componenti/Pulsante";
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
  /** «Sposta in…»: il pannello si apre accanto al pulsante, sopra Info che resta aperta. */
  onSpostaIn: (pulsante: DOMRect) => void;
  /** Il pannello Sposta in è aperto sopra Info. */
  spostaInAperto?: boolean;
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
  /** Sposta in era aperto quando è cominciato il clic: il pannello si chiude prima che il velo
   * riceva il clic, che allora chiude solo lui. */
  const spostaInAlClic = useRef(false);
  const campoTag = useRef<HTMLInputElement>(null);
  const pulsanteTag = useRef<HTMLButtonElement>(null);
  const [titolo, setTitolo] = useState(p.nota.titolo);
  const [testoTag, setTestoTag] = useState("");
  /** Dove sta il campo dei tag: i suggerimenti si aprono sotto. */
  const [rettangoloCampo, setRettangoloCampo] = useState<DOMRect | null>(null);
  const [suggerimentiChiusi, setSuggerimentiChiusi] = useState(false);
  const [menuTag, setMenuTag] = useState<{ nome: string; x: number; y: number } | null>(null);
  const [daEliminare, setDaEliminare] = useState<string | null>(null);
  /** «+ Tag» premuto: al suo posto il campo per aggiungerne uno. */
  const [aggiungiTag, setAggiungiTag] = useState(false);
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

  // La comparsa sta sotto il titolo, centrata su di lui, senza uscire dalla finestra. In una
  // finestra stretta si restringe: la larghezza vera serve sia alla misura sia alla posizione,
  // così resta a MARGINE_FINESTRA da entrambi i lati.
  const larghezza = Math.min(LARGHEZZA, window.innerWidth - 2 * MARGINE_FINESTRA);
  const posizione =
    comparsa && p.ancora
      ? {
          width: larghezza,
          maxWidth: "none",
          left: Math.max(
            MARGINE_FINESTRA,
            Math.min(p.ancora.x - larghezza / 2, window.innerWidth - larghezza - MARGINE_FINESTRA),
          ),
          top: p.ancora.y + DISTANZA,
        }
      : undefined;

  const cartella =
    p.nota.cartella === "" ? "Non organizzata" : p.nota.cartella.split("/").join(" › ");

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
      <AreaScorrevole className="info-scorrimento">
        {/* Il contenitore ha spazio-pannello su tutti i lati e spazio-blocco tra i blocchi; le righe
            sono pillole con spazio-controllo ai lati (DEC-100). */}
        <div className="info-contenuto">
          {!comparsa && (
            <div className="info-riga info-intestazione">
              <p className="interfaccia-titolo">Info</p>
              <PulsanteIcona nome="Chiudi" icona={<Icona di={X} />} onClick={p.onChiudi} />
            </div>
          )}

          <input
            className="info-campo interfaccia-controllo"
            aria-label="Titolo"
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

          <div className="info-righe">
            <div className="info-riga">
              <button
                type="button"
                className="info-riga-pulsante interfaccia-controllo"
                aria-label={`Cartella ${cartella}: Sposta in…`}
                onClick={(e) => p.onSpostaIn(e.currentTarget.getBoundingClientRect())}
              >
                <Icona di={Folder} />
                <span className="info-riga-testo">{cartella}</span>
              </button>
            </div>
            <RigaData
              etichetta="Data di creazione"
              testo={(valore) =>
                `Creata il ${valore ? scriviGiorno(valore) : giornoDiSistema(p.nota.creata)}`
              }
              valore={p.nota.creataScelta}
              vuoto={giornoDiSistema(p.nota.creata)}
              suggerimento={`Data di sistema: ${testoCreata(p.nota.creata).replace("Creata il ", "")}`}
              ripristina
              onCambia={(giorno) => p.onDettagli({ creataScelta: giorno })}
            />
            <RigaData
              etichetta="Fine validità"
              testo={(valore) =>
                valore ? `Fine validità il ${scriviGiorno(valore)}` : "Nessuna fine validità"
              }
              valore={p.nota.fineValidita}
              vuoto="GG/MM/AAAA"
              suggerimento="Solo un promemoria: alla scadenza non succede nulla"
              onCambia={(giorno) => p.onDettagli({ fineValidita: giorno })}
            />
            <div className="info-riga info-riga-tag">
              <span className="info-riga-icona">
                <Icona di={TagIcona} />
              </span>
              <div className="info-tag">
                {p.nota.tag.map((nome) => (
                  <Tag
                    key={nome}
                    nome={nome}
                    onTogli={() => {
                      p.onTogliTag(nome);
                      // Il focus non si perde: va nel campo o su «+ Tag».
                      (aggiungiTag ? campoTag : pulsanteTag).current?.focus();
                    }}
                  />
                ))}
                {aggiungiTag ? (
                  <input
                    ref={campoTag}
                    className="info-campo-tag interfaccia-controllo"
                    aria-label="Aggiungi un tag"
                    placeholder="Aggiungi un tag"
                    autoFocus
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
                    onBlur={() => {
                      // Lasciato vuoto, torna «+ Tag» (salvo mentre si sceglie dai suggerimenti).
                      if (testoTag === "" && !menuTag && !daEliminare) setAggiungiTag(false);
                    }}
                  />
                ) : (
                  <button
                    ref={pulsanteTag}
                    type="button"
                    className="info-aggiungi-tag interfaccia-controllo"
                    onClick={() => setAggiungiTag(true)}
                  >
                    <Icona di={Plus} />
                    Tag
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className="info-riga info-modificata interfaccia-dettaglio">
            {testoModificata(p.nota.modificata)}
          </p>

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
      </AreaScorrevole>
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
          onPointerDown={() => {
            spostaInAlClic.current = p.spostaInAperto ?? false;
          }}
          onMouseDown={(e) => {
            if (e.target !== e.currentTarget || menuTag || daEliminare) return;
            if (spostaInAlClic.current) {
              // Si chiude solo il pannello: il focus resta sulla riga Cartella, non va alla pagina.
              e.preventDefault();
              return;
            }
            if (finestra.current?.querySelector(".info-riga-aperta")) return;
            // Il clic non porta il focus sulla pagina: torna dove era prima di Info.
            e.preventDefault();
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

/** Il giorno di sistema di un istante, nel fuso di questo computer: GG/MM/AAAA. */
function giornoDiSistema(istante: string): string {
  return testoCreata(istante)
    .replace("Creata il ", "")
    .replace(/ alle .*/, "");
}

/**
 * Una riga di data (proposta C, DEC-97): un pulsante con l'icona e la frase («Creata il
 * 12/09/2026»); un clic apre il campo al posto della frase e il calendario sotto la riga. Si
 * scrive GG/MM/AAAA o si sceglie; una data che non esiste, confermata con Invio, resta nel campo
 * con il messaggio; uscendo dal campo torna quella di prima (DEC-52). Con `ripristina`, se c'è una
 * data scelta, a destra «Ripristina» la toglie e torna quella di sistema.
 */
function RigaData(p: {
  etichetta: string;
  testo: (valore: string | null) => string;
  valore: string | null;
  vuoto: string;
  suggerimento: string;
  ripristina?: boolean;
  onCambia: (giorno: string | null) => void;
}): ReactElement {
  const scritto = p.valore ? scriviGiorno(p.valore) : "";
  const [aperta, setAperta] = useState(false);
  const [testo, setTesto] = useState(scritto);
  const [errore, setErrore] = useState(false);
  const idErrore = useId();
  const [calendario, setCalendario] = useState<DOMRect | null>(null);
  // Il focus parte nel campo; con ↓ passa al calendario.
  const [nelCalendario, setNelCalendario] = useState(false);
  const riga = useRef<HTMLDivElement>(null);
  const casella = useRef<HTMLInputElement>(null);
  const pulsante = useRef<HTMLButtonElement>(null);
  // Chiusa con Invio, Esc o il calendario, il focus torna sulla riga; uscendo con Tab no.
  const [rimetti, setRimetti] = useState(false);
  // L'ultimo valore inviato: Invio e poi l'uscita dal campo non lo mandano due volte.
  const [inviato, setInviato] = useState(p.valore);
  // Quando il valore cambia da fuori, la riga lo mostra.
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

  const apri = () => {
    setTesto(scritto);
    setAperta(true);
    setCalendario(riga.current?.getBoundingClientRect() ?? null);
  };
  const chiudi = (uscita = false) => {
    setAperta(false);
    setCalendario(null);
    setNelCalendario(false);
    setErrore(false);
    setRimetti(!uscita);
  };
  useEffect(() => {
    if (aperta) {
      // Il testo è selezionato: scrivendo si sostituisce.
      casella.current?.focus();
      casella.current?.select();
    } else if (rimetti) pulsante.current?.focus();
  }, [aperta, rimetti]);

  const conferma = (uscita: boolean) => {
    if (testo.trim() === "") {
      cambia(null);
      chiudi(uscita);
      return;
    }
    const giorno = leggiGiorno(testo);
    if (giorno) {
      cambia(giorno);
      chiudi(uscita);
    } else if (uscita) chiudi(true);
    else setErrore(true);
  };

  return (
    <div
      ref={riga}
      className={`info-riga ${aperta ? "info-riga-aperta" : ""} ${errore ? "info-riga-errore" : ""}`}
      title={aperta ? undefined : p.suggerimento}
    >
      {aperta ? (
        <>
          <span className="info-riga-icona">
            <Icona di={Calendar} />
          </span>
          <input
            ref={casella}
            className="info-riga-campo interfaccia-controllo"
            aria-label={p.etichetta}
            aria-invalid={errore}
            aria-describedby={errore ? idErrore : undefined}
            data-apre-calendario=""
            placeholder={p.vuoto}
            value={testo}
            onChange={(e) => {
              const nuovo = e.target.value;
              setTesto(nuovo);
              if (errore && (nuovo.trim() === "" || leggiGiorno(nuovo))) setErrore(false);
            }}
            onBlur={(e) => {
              // Il passaggio al calendario non è un'uscita dal campo.
              if ((e.relatedTarget as Element | null)?.closest?.(".calendario")) return;
              conferma(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                conferma(false);
              } else if (e.key === "ArrowDown" && calendario) {
                e.preventDefault();
                setNelCalendario(true);
              } else if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                chiudi();
              }
            }}
          />
        </>
      ) : (
        <button
          ref={pulsante}
          type="button"
          className="info-riga-pulsante interfaccia-controllo"
          aria-label={`${p.etichetta}: ${p.testo(p.valore)}`}
          data-apre-calendario=""
          onClick={apri}
        >
          <Icona di={Calendar} />
          <span className={`info-riga-testo ${p.valore || p.ripristina ? "" : "info-tenue"}`}>
            {p.testo(p.valore)}
          </span>
        </button>
      )}
      {p.ripristina && p.valore && !aperta && (
        <button
          type="button"
          className="info-ripristina interfaccia-controllo-attivo"
          onClick={() => cambia(null)}
        >
          Ripristina
        </button>
      )}
      {errore && (
        <p id={idErrore} className="info-errore-data interfaccia-dettaglio" role="alert">
          <Icona di={CircleAlert} />
          Data non valida: scrivi GG/MM/AAAA
        </p>
      )}
      {calendario && (
        <Calendario
          valore={p.valore}
          ancora={calendario}
          sopraOverlay
          prendeFocus={nelCalendario}
          onScegli={(giorno) => {
            cambia(giorno);
            chiudi();
          }}
          onChiudi={(come) => {
            // Esc nel calendario torna nel campo; un clic fuori chiude la riga come uscirne.
            if (come === "esc") {
              setNelCalendario(false);
              casella.current?.focus();
            } else conferma(true);
          }}
        />
      )}
    </div>
  );
}
