// Il gruppo Brainet delle Impostazioni (SC-06, RF-18): «Usa Brainet»; acceso, gli stati delle
// evidenziature (CMP-42). Spegnere nasconde Brainet e non cancella niente, senza conferma (RB-111,
// DEC-145). Togliendo uno stato usato, Memodu propone di cambiarlo con un altro (RB-110).

import { Plus } from "lucide-react";
import { useEffect, useState, type ReactElement } from "react";
import { FinestraConferma } from "../componenti/FinestraConferma";
import { GruppoImpostazioni, Riquadro } from "../componenti/GruppoImpostazioni";
import { Icona } from "../componenti/Icona";
import { Menu, type ColoreStato } from "../componenti/Menu";
import { Pallino } from "../componenti/Pallino";
import { Pulsante } from "../componenti/Pulsante";
import { RigaImpostazione, RigaInterruttore } from "../componenti/RigaImpostazione";
import { brainet, type StatoArea, type StatoBrainet } from "./api";

const COLORI: ColoreStato[] = ["avviso", "informazione", "successo", "errore"];
/** Tra il pulsante e il menu che apre (spazio-elemento, come in CMP-09). */
const DISTANZA = 4;
const NOME_COLORE: Record<ColoreStato, string> = {
  avviso: "ambra",
  informazione: "blu",
  successo: "verde",
  errore: "rosso",
};

interface Proprieta {
  esegui: <T>(chiamata: () => Promise<T>) => Promise<T | undefined>;
  /** Acceso o spento: la colonna si aggiorna. */
  onCambiato: (stato: StatoBrainet) => void;
  /** Cambia quando la sincronizzazione porta modifiche di Brainet. */
  versione: number;
}

export function GruppoBrainet({ esegui, onCambiato, versione }: Proprieta): ReactElement | null {
  const [stato, setStato] = useState<StatoBrainet | null>(null);
  const [stati, setStati] = useState<StatoArea[]>([]);
  const [nuovo, setNuovo] = useState<{ nome: string; colore: ColoreStato; errore?: string } | null>(
    null,
  );
  const [togli, setTogli] = useState<{
    stato: StatoArea;
    aree: number;
    x: number;
    y: number;
  } | null>(null);
  const [cambia, setCambia] = useState<{ stato: StatoArea; x: number; y: number } | null>(null);

  // Leggere non blocca la pagina: senza risposta il gruppo non c'è, il resto resta.
  useEffect(() => {
    let vivo = true;
    void brainet.stato().then(
      (s) => vivo && setStato(s),
      () => vivo && setStato(null),
    );
    return () => {
      vivo = false;
    };
  }, [versione]);
  useEffect(() => {
    if (!stato?.acceso) return;
    let vivo = true;
    void brainet.elencaStati().then(
      (s) => vivo && setStati(s),
      () => undefined,
    );
    return () => {
      vivo = false;
    };
  }, [stato?.acceso, versione]);

  if (!stato) return null;

  const aggiorna = (s: StatoBrainet | undefined) => {
    if (!s) return;
    setStato(s);
    onCambiato(s);
  };
  const rileggiStati = () => void esegui(() => brainet.elencaStati()).then((s) => s && setStati(s));

  const salvaNuovo = async () => {
    if (!nuovo) return;
    const nome = nuovo.nome.trim();
    if (!nome) return setNuovo(null);
    if (stati.some((s) => s.nome.toLowerCase() === nome.toLowerCase())) {
      return setNuovo({ ...nuovo, errore: "C'è già uno stato con questo nome" });
    }
    await esegui(() => brainet.creaStato(nome, nuovo.colore));
    setNuovo(null);
    rileggiStati();
  };

  const chiediTogli = async (s: StatoArea, dove: { x: number; y: number }) => {
    const aree = await esegui(() => brainet.areeConStato(s.id));
    if (aree === undefined) return;
    if (aree === 0) {
      await esegui(() => brainet.togliStato(s.id));
      rileggiStati();
    } else setTogli({ stato: s, aree, ...dove });
  };

  return (
    <>
      <GruppoImpostazioni titolo="Brainet">
        <RigaInterruttore
          etichetta="Usa Brainet"
          descrizione="Collega quello che scrivi nelle note a persone, oggetti, eventi e argomenti, e lo ritrovi in Entità e nel Calendario."
          acceso={stato.acceso}
          onCambia={(si) =>
            void esegui(() => (si ? brainet.accendi() : brainet.spegni())).then(aggiorna)
          }
        />
      </GruppoImpostazioni>
      {stato.acceso && (
        <section className="gruppo-impostazioni" aria-label="Stati delle evidenziature">
          <Riquadro>
            <RigaImpostazione
              key="informazione"
              etichetta="Stati delle evidenziature"
              descrizione="Gli stati che puoi dare a un'area, ognuno con il suo colore."
            />
            {stati.map((s) => (
              <div key={s.id} className="riga-impostazione riga-stato">
                <span className="riga-stato-nome interfaccia-controllo">
                  <Pallino colore={s.colore} />
                  {s.nome}
                </span>
                <Pulsante
                  tipo="tenue"
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    void chiediTogli(s, { x: r.left, y: r.bottom + DISTANZA });
                  }}
                >
                  Togli
                </Pulsante>
              </div>
            ))}
            {nuovo ? (
              <div key="nuovo" className="riga-impostazione riga-stato">
                <span className="riga-stato-nome">
                  <span className="riga-stato-colori" role="radiogroup" aria-label="Colore">
                    {COLORI.map((c) => (
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={nuovo.colore === c}
                        aria-label={NOME_COLORE[c]}
                        className={`riga-stato-colore ${nuovo.colore === c ? "riga-stato-colore-scelto" : ""}`}
                        onClick={() => setNuovo({ ...nuovo, colore: c })}
                      >
                        <Pallino colore={c} />
                      </button>
                    ))}
                  </span>
                  <input
                    className="campo-ricerca-menu interfaccia-controllo"
                    autoFocus
                    aria-label="Nome dello stato"
                    placeholder="Nome dello stato"
                    value={nuovo.nome}
                    aria-invalid={nuovo.errore ? true : undefined}
                    onChange={(e) =>
                      setNuovo({ ...nuovo, nome: e.target.value, errore: undefined })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void salvaNuovo();
                      if (e.key === "Escape") setNuovo(null);
                    }}
                  />
                </span>
                {nuovo.errore && (
                  <span className="riga-stato-errore interfaccia-dettaglio">{nuovo.errore}</span>
                )}
              </div>
            ) : (
              <Pulsante
                key="aggiungi"
                tipo="tenue"
                className="aggiungi-stato"
                icona={<Icona di={Plus} />}
                onClick={() =>
                  setNuovo({
                    nome: "",
                    colore: COLORI.find((c) => !stati.some((s) => s.colore === c)) ?? COLORI[0],
                  })
                }
              >
                Aggiungi uno stato
              </Pulsante>
            )}
          </Riquadro>
        </section>
      )}
      {togli && (
        <FinestraConferma
          titolo={`Togliere «${togli.stato.nome}»?`}
          testo={`È in ${togli.aree === 1 ? "1 area" : `${togli.aree} aree`}. Puoi cambiarlo con un altro stato; se lo togli, le aree che avevano solo lui spariscono.`}
          azione="Togli"
          altra={
            stati.length > 1
              ? {
                  etichetta: "Cambia con…",
                  onClick: () => {
                    const { stato: s, x, y } = togli;
                    setTogli(null);
                    setCambia({ stato: s, x, y });
                  },
                }
              : undefined
          }
          onAnnulla={() => setTogli(null)}
          onConferma={() => {
            const s = togli.stato;
            setTogli(null);
            void esegui(() => brainet.togliStato(s.id)).then(rileggiStati);
          }}
        />
      )}
      {cambia && (
        <Menu
          etichetta={`Cambia «${cambia.stato.nome}» con`}
          x={cambia.x}
          y={cambia.y}
          voci={stati
            .filter((s) => s.id !== cambia.stato.id)
            .map((s) => ({
              tipo: "voce" as const,
              etichetta: s.nome,
              pallino: s.colore,
              azione: () =>
                void esegui(() => brainet.togliStato(cambia.stato.id, s.id)).then(rileggiStati),
            }))}
          onChiudi={() => setCambia(null)}
        />
      )}
    </>
  );
}
