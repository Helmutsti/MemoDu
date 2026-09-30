// SC-06 Impostazioni (DEC-91): dalla riga sotto il Cestino, al posto della nota come il cestino.
// Generale (scorciatoia della nota rapida, avvio all'accensione), Tema, Sincronizzazione (solo
// lettura), Ricerca (note del cestino nei risultati, DEC-94) e Dispositivo. Ogni cambio vale subito, senza Salva (RB-06). Testi in 4-schermate.md.

import { CircleAlert } from "lucide-react";
import { useCallback, useEffect, useId, useState, type ReactElement } from "react";
import {
  api,
  ErroreApi,
  type Impostazioni as Valori,
  type StatoSincronizzazione,
  type Tema,
} from "../api";
import { quando } from "../date";
import { alCambioDelloStatoSinc } from "../finestra";
import { Icona } from "../componenti/Icona";
import { Pulsante } from "../componenti/Pulsante";
import { RigaImpostazione, RigaInterruttore, TitoloGruppo } from "../componenti/RigaImpostazione";
import { SceltaSegmenti } from "../componenti/SceltaSegmenti";
import { daTasto, scriviScorciatoia, type Sistema } from "../scorciatoia";
import "./Impostazioni.css";

const TEMI: { valore: Tema; etichetta: string }[] = [
  { valore: "sistema", etichetta: "Sistema" },
  { valore: "chiaro", etichetta: "Chiaro" },
  { valore: "scuro", etichetta: "Scuro" },
];

const TESTO_OCCUPATA = "Già usata da un altro programma";
const TESTO_NON_VALIDA =
  "Usa almeno due tasti tra Ctrl, Alt, Maiusc e Win, poi una lettera o una cifra";

interface Proprieta {
  /** Esegue un comando: se non riesce, l'avviso o SC-07 come nel resto della finestra. */
  esegui: <T>(chiamata: () => Promise<T>) => Promise<T | undefined>;
}

const maiuscola = (testo: string) => testo.charAt(0).toUpperCase() + testo.slice(1);

/** Riga Stato della sincronizzazione (SC-06). */
function testoStato(s: StatoSincronizzazione): string {
  if (!s.collegata) return "Senza collegamento: le note restano su questo computer";
  switch (s.problema) {
    case "rete":
      return "Server non raggiungibile: le modifiche restano su questo computer";
    case "rifiutate":
      return "Credenziali non valide";
    case "protocollo":
      return "Memodu e il server hanno versioni diverse";
    case "errore":
      return "Non riuscita: riprovo da sola";
    default:
      return s.ultimaRiuscita ? "Sincronizzata" : "In attesa della prima sincronizzazione";
  }
}

/** Il campo della scorciatoia: cliccato, aspetta la combinazione nuova; Esc lo lascia. */
function CampoScorciatoia({
  valore,
  sistema,
  errore,
  idEtichetta,
  onCombinazione,
  onNonValida,
}: {
  valore: string;
  sistema: Sistema;
  errore: string | null;
  idEtichetta: string;
  onCombinazione: (combinazione: string) => void;
  onNonValida: () => void;
}): ReactElement {
  const [inAscolto, setInAscolto] = useState(false);
  const idErrore = useId();
  return (
    <span className="campo-scorciatoia">
      <input
        className={`campo-impostazione interfaccia-controllo ${errore ? "campo-impostazione-errore" : ""}`}
        readOnly
        aria-labelledby={idEtichetta}
        aria-invalid={errore !== null}
        aria-describedby={errore ? idErrore : undefined}
        value={inAscolto ? "" : scriviScorciatoia(valore, sistema)}
        placeholder="Premi la combinazione"
        onFocus={() => setInAscolto(true)}
        onBlur={() => setInAscolto(false)}
        onKeyDown={(e) => {
          if (e.key === "Tab") return;
          e.preventDefault();
          if (e.key === "Escape") {
            e.currentTarget.blur();
            return;
          }
          const combinazione = daTasto(e.nativeEvent);
          if (combinazione === null) return;
          if (combinazione === "non valida") onNonValida();
          else onCombinazione(combinazione);
          e.currentTarget.blur();
        }}
      />
      {errore && (
        <span
          id={idErrore}
          className="campo-impostazione-messaggio interfaccia-dettaglio"
          role="alert"
        >
          <Icona di={CircleAlert} />
          {errore}
        </span>
      )}
    </span>
  );
}

/** Il nome del dispositivo: si salva lasciando il campo o con Invio; Esc torna com'era. */
function CampoNome({
  valore,
  idEtichetta,
  onCambia,
}: {
  valore: string;
  idEtichetta: string;
  onCambia: (nome: string) => void;
}): ReactElement {
  // Il valore salvato arriva con una chiave nuova (key): il campo riparte da lì.
  const [testo, setTesto] = useState(valore);
  return (
    <input
      className="campo-impostazione interfaccia-controllo"
      aria-labelledby={idEtichetta}
      value={testo}
      maxLength={100}
      onChange={(e) => setTesto(e.target.value)}
      onBlur={() => {
        if (testo !== valore) onCambia(testo);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setTesto(valore);
          requestAnimationFrame(() => e.currentTarget?.blur());
        }
      }}
    />
  );
}

export function Impostazioni({ esegui }: Proprieta): ReactElement | null {
  const [valori, setValori] = useState<Valori | null>(null);
  const [stato, setStato] = useState<StatoSincronizzazione | null>(null);
  const [erroreScorciatoia, setErroreScorciatoia] = useState<string | null>(null);
  const idScorciatoia = useId();
  const idNome = useId();

  const rileggi = useCallback(async () => {
    const letti = await esegui(() =>
      Promise.all([api.impostazioni(), api.statoSincronizzazione()]),
    );
    if (!letti) return;
    setValori(letti[0]);
    setStato(letti[1]);
  }, [esegui]);

  useEffect(() => {
    void rileggi();
  }, [rileggi]);
  // La sincronizzazione cambia lo stato e può portare una scorciatoia nuova (RB-52).
  useEffect(() => alCambioDelloStatoSinc(() => void rileggi()), [rileggi]);

  if (!valori || !stato) return null;

  const cambiaScorciatoia = async (combinazione: string | null) => {
    try {
      await api.cambiaScorciatoia(combinazione);
      setErroreScorciatoia(null);
      await rileggi();
    } catch (errore) {
      if (errore instanceof ErroreApi && (errore.stato === 409 || errore.stato === 400)) {
        setErroreScorciatoia(errore.stato === 409 ? TESTO_OCCUPATA : TESTO_NON_VALIDA);
      } else {
        await esegui(() => Promise.reject(errore));
      }
    }
  };

  const cambia = async (chiamata: () => Promise<unknown>, nuovi: Partial<Valori>) => {
    const prima = valori;
    setValori({ ...valori, ...nuovi });
    const riuscito = await esegui(async () => {
      await chiamata();
      return true;
    });
    if (!riuscito) setValori(prima);
  };

  const sistema = valori.sistema;
  return (
    <section className="impostazioni" aria-labelledby="impostazioni-titolo">
      <h1 id="impostazioni-titolo" className="impostazioni-titolo interfaccia-titolo-schermata">
        Impostazioni
      </h1>

      <TitoloGruppo>Generale</TitoloGruppo>
      <RigaImpostazione
        id={idScorciatoia}
        etichetta="Scorciatoia della nota rapida"
        descrizione={`Su ${sistema === "macos" ? "macOS" : "Windows"}. Clicca il campo e premi la combinazione nuova.`}
      >
        <CampoScorciatoia
          valore={valori.scorciatoia}
          sistema={sistema}
          errore={erroreScorciatoia}
          idEtichetta={idScorciatoia}
          onCombinazione={(c) => void cambiaScorciatoia(c)}
          onNonValida={() => setErroreScorciatoia(TESTO_NON_VALIDA)}
        />
        <Pulsante
          tipo="tenue"
          disabled={valori.scorciatoiaPredefinita}
          onClick={() => void cambiaScorciatoia(null)}
        >
          Ripristina
        </Pulsante>
      </RigaImpostazione>
      <RigaInterruttore
        etichetta="Avvia Memodu all'accensione"
        descrizione="Memodu parte in background e la nota rapida è subito pronta. Solo su questo dispositivo."
        acceso={valori.avvioAutomatico}
        onCambia={(attivo) =>
          void cambia(() => api.cambiaAvvio(attivo), { avvioAutomatico: attivo })
        }
      />
      {/* DEC-93: in Generale per ora; la posizione è da rivedere. */}
      <RigaInterruttore
        etichetta="Tieni Memodu in primo piano"
        descrizione="La finestra resta sopra gli altri programmi. Solo su questo dispositivo."
        acceso={valori.inPrimoPiano}
        onCambia={(attivo) =>
          void cambia(() => api.cambiaPrimoPiano(attivo), { inPrimoPiano: attivo })
        }
      />

      <TitoloGruppo>Tema</TitoloGruppo>
      <RigaImpostazione
        etichetta="Tema"
        descrizione="Chiaro o scuro, oppure come il sistema. Solo su questo dispositivo."
      >
        <SceltaSegmenti
          nome="Tema"
          opzioni={TEMI}
          valore={valori.tema}
          onScegli={(tema) => void cambia(() => api.cambiaTema(tema), { tema })}
        />
      </RigaImpostazione>

      <TitoloGruppo>Sincronizzazione</TitoloGruppo>
      <RigaImpostazione etichetta="Stato" descrizione={testoStato(stato)} />
      {stato.ultimaRiuscita && (
        <RigaImpostazione
          etichetta="Ultima sincronizzazione"
          descrizione={maiuscola(quando(stato.ultimaRiuscita))}
        />
      )}

      {/* DEC-94: tra Sincronizzazione e Dispositivo. */}
      <TitoloGruppo>Ricerca</TitoloGruppo>
      <RigaInterruttore
        etichetta="Mostra le note del cestino nei risultati"
        descrizione="Compaiono attenuate, con l’etichetta «nel cestino». Vale su tutti i dispositivi."
        acceso={valori.cestinoInRicerca}
        onCambia={(attivo) =>
          void cambia(() => api.cambiaCestinoInRicerca(attivo), { cestinoInRicerca: attivo })
        }
      />

      <TitoloGruppo>Dispositivo</TitoloGruppo>
      <RigaImpostazione
        id={idNome}
        etichetta="Nome del dispositivo"
        descrizione="Così lo riconosci tra i tuoi dispositivi."
      >
        <CampoNome
          key={valori.nomeDispositivo}
          valore={valori.nomeDispositivo}
          idEtichetta={idNome}
          onCambia={(nome) =>
            void (async () => {
              const valido = await esegui(() => api.cambiaNomeDispositivo(nome));
              setValori((v) => (v ? { ...v, nomeDispositivo: valido ?? v.nomeDispositivo } : v));
            })()
          }
        />
      </RigaImpostazione>
    </section>
  );
}
