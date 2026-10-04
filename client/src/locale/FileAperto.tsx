// Un file di Locale aperto nell'area della nota (RF-17, FL-11, FL-13): in alto il percorso
// «Locale › cartella › nome» con il pallino delle modifiche non salvate (CMP-26, RB-77); sotto il
// testo, con lo stesso editor delle note. Si salva solo con Ctrl + S (⌘ + S su Mac, RB-79);
// mentre si scrive il testo resta in sospeso nel nucleo (RB-78). Se il file cambia o sparisce sul
// disco compare sempre l'avviso con la scelta (RB-85).

import { ChevronRight, FileText } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { ErroreApi } from "../api";
import { AreaScorrevole } from "../componenti/AreaScorrevole";
import { Avviso } from "../componenti/Avviso";
import { Icona } from "../componenti/Icona";
import { StatoVuoto } from "../componenti/StatoVuoto";
import { cursoreDalClic, Editor } from "../editor/Editor";
import { SU_MAC } from "../finestra";
import { apiLocale, cartellaDi, dentroDi, nomeDi, type FileLocale } from "./api";
import type { StatoLocale } from "./useLocale";
import "../schermate/NotaAperta.css";
import "../componenti/Percorso.css";

/** Il testo scritto va al nucleo dopo questa pausa (RB-78). */
const PAUSA_MS = 400;

type AvvisoFile =
  | { tipo: "cambiato" }
  | { tipo: "sparito" }
  | { tipo: "informazione"; testo: string }
  | { tipo: "errore"; testo: string };

interface Proprieta {
  percorso: string;
  locale: StatoLocale;
  /** Il file ha un percorso nuovo: nato al primo salvataggio o rinominato. */
  onPercorso: (nuovo: string) => void;
  /** «Chiudi» dell'avviso del file sparito. */
  onChiudi: () => void;
}

export function FileAperto({ percorso, locale, onPercorso, onChiudi }: Proprieta): ReactElement {
  const [file, setFile] = useState<FileLocale | null>(null);
  const [errore, setErrore] = useState<{ titolo: string; testo: string } | null>(null);
  const [versione, setVersione] = useState(0);
  const [sospeso, setSospeso] = useState(false);
  const [avviso, setAvviso] = useState<AvvisoFile | null>(null);
  const [rinomina, setRinomina] = useState(false);
  const pagina = useRef<HTMLElement>(null);
  const testo = useRef("");
  /** Impronta del disco quando il testo si è letto; "" se il disco è cambiato e non si è scelto. */
  const impronta = useRef<string | null>(null);
  const timer = useRef<number | null>(null);
  const nuovo = file?.nuovo ?? false;

  const applica = useCallback((f: FileLocale) => {
    testo.current = f.testo;
    impronta.current = f.cambiatoFuori || f.sparito ? "" : f.impronta;
    setFile(f);
    setSospeso(f.sospeso);
    setErrore(null);
    setVersione((v) => v + 1);
    if (f.cambiatoFuori) setAvviso({ tipo: "cambiato" });
    else if (f.sparito) setAvviso({ tipo: "sparito" });
    else if (f.solaLettura) {
      setAvviso({
        tipo: "informazione",
        testo: "Questo file è in sola lettura: puoi leggerlo ma non modificarlo.",
      });
    }
  }, []);

  const nonSiApre = useCallback((e: unknown) => {
    setFile(null);
    setErrore(
      e instanceof ErroreApi && e.stato === 413
        ? {
            titolo: "Questo file è troppo grande per Memodu",
            testo: `${e.message}: Memodu apre file fino a 10 MB. Aprilo con un altro programma.`,
          }
        : { titolo: "Questo file non si apre", testo: e instanceof Error ? e.message : String(e) },
    );
  }, []);

  const carica = useCallback(
    () => apiLocale.apri(percorso).then(applica, nonSiApre),
    [percorso, applica, nonSiApre],
  );

  useEffect(() => {
    void carica();
  }, [carica]);

  /** Manda subito al nucleo il testo in attesa. */
  const scarica = useCallback(async () => {
    if (timer.current === null) return;
    window.clearTimeout(timer.current);
    timer.current = null;
    await apiLocale.sospendi(percorso, testo.current, impronta.current).catch(() => undefined);
  }, [percorso]);

  // Uscendo dal file il testo non salvato resta in sospeso (RB-78).
  useEffect(() => () => void scarica(), [scarica]);

  const modifica = (t: string) => {
    testo.current = t;
    const prima = sospeso;
    setSospeso(true);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      void apiLocale
        .sospendi(percorso, testo.current, impronta.current)
        .then(() => (prima ? undefined : locale.ricaricaAttorno(percorso)))
        .catch((e: unknown) =>
          setAvviso({ tipo: "errore", testo: e instanceof Error ? e.message : String(e) }),
        );
    }, PAUSA_MS);
  };

  const salva = useCallback(async () => {
    if (!file || file.solaLettura) return;
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    try {
      const salvato = await apiLocale.salva(percorso, testo.current, impronta.current);
      impronta.current = salvato.impronta;
      setSospeso(false);
      setAvviso(
        salvato.convertitoInUtf8
          ? {
              tipo: "informazione",
              testo: `${nomeDi(percorso)} era in Windows-1252: l'ho salvato in UTF-8.`,
            }
          : null,
      );
      await locale.ricaricaAttorno(salvato.percorso);
      if (salvato.percorso !== percorso) onPercorso(salvato.percorso);
      else setFile((f) => (f ? { ...f, nuovo: false, sospeso: false } : f));
    } catch (e) {
      // Il testo resta in sospeso (CA-17.16).
      await apiLocale.sospendi(percorso, testo.current, impronta.current).catch(() => undefined);
      if (e instanceof ErroreApi && e.motivo === "cambiato") setAvviso({ tipo: "cambiato" });
      else if (e instanceof ErroreApi && e.stato === 404) setAvviso({ tipo: "sparito" });
      else {
        setAvviso({
          tipo: "errore",
          testo: `Non riesco a salvare ${nomeDi(percorso)}: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    }
  }, [file, locale, onPercorso, percorso]);

  // Ctrl + S (⌘ + S su Mac) salva il file (RB-79).
  useEffect(() => {
    const suTasto = (e: KeyboardEvent) => {
      const comando = SU_MAC ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
      if (!comando || e.altKey || e.shiftKey || e.key.toLowerCase() !== "s") return;
      e.preventDefault();
      if (!e.repeat) void salva();
    };
    window.addEventListener("keydown", suTasto);
    return () => window.removeEventListener("keydown", suTasto);
  }, [salva]);

  // Un altro programma ha toccato il file: sempre l'avviso, se il disco non è quello letto (RB-85).
  useEffect(
    () =>
      locale.alCambio((percorsi) => {
        if (nuovo || !percorsi.some((p) => dentroDi(percorso, p))) return;
        void (async () => {
          await scarica();
          try {
            const f = await apiLocale.apri(percorso);
            if (f.impronta === null) setAvviso({ tipo: "sparito" });
            else if (f.impronta !== impronta.current) setAvviso({ tipo: "cambiato" });
          } catch (e) {
            if (e instanceof ErroreApi && e.stato === 404) setAvviso({ tipo: "sparito" });
          }
        })();
      }),
    [locale, nuovo, percorso, scarica],
  );

  const ricarica = async () => {
    setAvviso(null);
    await apiLocale.scarta(percorso).catch(() => undefined);
    await carica();
    await locale.ricaricaAttorno(percorso);
  };

  const tieniLaMia = async () => {
    setAvviso(null);
    try {
      const f = await apiLocale.apri(percorso);
      impronta.current = f.impronta;
      await apiLocale.sospendi(percorso, testo.current, f.impronta);
      setSospeso(true);
      await locale.ricaricaAttorno(percorso);
    } catch (e) {
      if (e instanceof ErroreApi && e.stato === 404) setAvviso({ tipo: "sparito" });
    }
  };

  const ricrealo = async () => {
    setAvviso(null);
    impronta.current = null;
    setSospeso(true);
    await apiLocale.sospendi(percorso, testo.current, null).catch(() => undefined);
  };

  const chiudiSparito = async () => {
    setAvviso(null);
    await apiLocale.scarta(percorso).catch(() => undefined);
    await locale.ricaricaAttorno(percorso);
    onChiudi();
  };

  const confermaNome = async (nome: string) => {
    setRinomina(false);
    const pulito = nome.trim();
    if (!pulito || pulito === nomeDi(percorso)) return;
    try {
      await scarica();
      const { percorso: nuovoPercorso } = await apiLocale.rinomina(percorso, pulito);
      await locale.ricaricaAttorno(nuovoPercorso);
      onPercorso(nuovoPercorso);
    } catch (e) {
      setAvviso({ tipo: "errore", testo: e instanceof Error ? e.message : String(e) });
    }
  };

  // Percorso: «Locale», la cartella dell'elenco e le sottocartelle, il nome del file.
  const radice = locale.cartelle.find((c) => dentroDi(percorso, c.percorso));
  const cartelle = radice
    ? [
        radice.nome,
        ...cartellaDi(percorso).slice(radice.percorso.length).split(/[\\/]/).filter(Boolean),
      ]
    : [nomeDi(cartellaDi(percorso))];
  const nome = nuovo ? "Senza titolo" : nomeDi(percorso);
  const separatore = (
    <span className="percorso-separatore" aria-hidden="true">
      <Icona di={ChevronRight} misura={12} />
    </span>
  );

  return (
    <>
      <nav className="percorso" aria-label="Percorso del file">
        <ol className="percorso-elenco">
          {["Locale", ...cartelle].map((c, i) => (
            <li key={`${i}:${c}`} className="percorso-elemento">
              <span className="percorso-segmento percorso-cartella interfaccia-controllo">{c}</span>
              {separatore}
            </li>
          ))}
          <li className="percorso-elemento">
            {rinomina ? (
              <input
                className="percorso-campo interfaccia-controllo-attivo"
                aria-label="Nome del file"
                defaultValue={nome}
                autoFocus
                onFocus={(e) => e.currentTarget.select()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void confermaNome(e.currentTarget.value);
                  else if (e.key === "Escape") {
                    e.stopPropagation();
                    setRinomina(false);
                  }
                }}
                onBlur={(e) => void confermaNome(e.currentTarget.value)}
              />
            ) : (
              <button
                type="button"
                className={`percorso-segmento percorso-titolo interfaccia-controllo-attivo ${nuovo ? "percorso-senza-titolo" : ""}`}
                aria-current="page"
                title={
                  nuovo ? "Il nome viene dalla prima riga al primo salvataggio" : `Rinomina ${nome}`
                }
                disabled={nuovo}
                onClick={() => setRinomina(true)}
              >
                {nome}
              </button>
            )}
            {sospeso && (
              <span className="percorso-non-salvato" role="img" aria-label="non salvato" />
            )}
          </li>
        </ol>
      </nav>
      {avviso?.tipo === "cambiato" && (
        <Avviso
          tipo="avviso"
          testo={`${nome} è cambiato sul disco.`}
          azione={{ etichetta: "Ricarica", onClick: () => void ricarica() }}
          etichettaChiudi="Tieni la mia versione"
          onChiudi={() => void tieniLaMia()}
        />
      )}
      {avviso?.tipo === "sparito" && (
        <Avviso
          tipo="avviso"
          testo={`${nome} non c'è più sul disco.`}
          azione={{ etichetta: "Ricrealo", onClick: () => void ricrealo() }}
          etichettaChiudi="Chiudi"
          onChiudi={() => void chiudiSparito()}
        />
      )}
      {(avviso?.tipo === "informazione" || avviso?.tipo === "errore") && (
        <Avviso tipo={avviso.tipo} testo={avviso.testo} onChiudi={() => setAvviso(null)} />
      )}
      {errore ? (
        <div className="area-nota-vuota">
          <StatoVuoto icona={FileText} titolo={errore.titolo} testo={errore.testo} />
        </div>
      ) : (
        file && (
          <article
            ref={pagina}
            className="nota-aperta"
            onMouseDown={(e) => pagina.current && cursoreDalClic(pagina.current, e)}
          >
            <AreaScorrevole className="nota-aperta-scorrimento">
              <div className="nota-aperta-corpo">
                <div className="nota-aperta-misura">
                  <Editor
                    key={versione}
                    contenuto={file.testo}
                    focus
                    solaLettura={file.solaLettura}
                    etichetta={`Testo di ${nome}`}
                    onModifica={modifica}
                  />
                </div>
              </div>
            </AreaScorrevole>
          </article>
        )
      )}
    </>
  );
}
