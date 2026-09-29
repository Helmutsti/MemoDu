// SC-01 Finestra principale, versione del frammento Must B «Smistare» (DEC-36): colonna con
// Non organizzate e Cartelle (CMP-14), area della nota con il menu ··· (Sposta in, Elimina,
// Cestino) o il cestino (SC-04). Niente ricerca, tag e date. Se l'API non risponde compare
// SC-07 al posto del contenuto, che resta in memoria (RB-61); chiudendo con testo non salvato
// si chiede conferma (RB-62). Un'operazione su cartelle o cestino che non riesce mostra un
// avviso e ricarica la colonna (DEC-37); un nome già usato apre la finestra con tre scelte
// (RB-31).

import { Ellipsis, FileText, Folder, FolderInput, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import type {
  Albero,
  Cartella,
  ElementoCestino,
  EsitoCartella,
  Nota,
  Percorso,
  SeEsiste,
} from "@memodu/condiviso";
import { api, ErroreApi } from "../api";
import { Avviso } from "../componenti/Avviso";
import { FinestraConferma } from "../componenti/FinestraConferma";
import { Icona } from "../componenti/Icona";
import { Menu, type VoceMenu } from "../componenti/Menu";
import { PannelloSpostaIn } from "../componenti/PannelloSpostaIn";
import { Pulsante, PulsanteIcona } from "../componenti/Pulsante";
import { StatoVuoto } from "../componenti/StatoVuoto";
import { alChiudere, allaRichiestaDiApertura, chiudiFinestra } from "../finestra";
import { CodaSalvataggio } from "../salvataggio";
import { Blocco } from "./Blocco";
import { Cestino } from "./Cestino";
import { Colonna, type Campo, type Destinazione, type Trascinato } from "./Colonna";
import { NotaAperta } from "./NotaAperta";
import "./FinestraPrincipale.css";

const TESTO_ERRORE =
  "Non è stato possibile completare l'operazione. La colonna mostra com'è adesso.";
const NUOVA_CARTELLA = "Nuova cartella";

const stesso = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const padre = (percorso: Percorso) => percorso.split("/").slice(0, -1).join("/");
const ultimo = (percorso: Percorso) => percorso.split("/").pop() ?? "";
const dentro = (percorso: Percorso, cartella: Percorso) =>
  stesso(percorso, cartella) || percorso.toLowerCase().startsWith(`${cartella.toLowerCase()}/`);
/** La cartella e i suoi antenati: «A/B» → «A», «A/B». */
const catena = (percorso: Percorso) =>
  percorso === "" ? [] : percorso.split("/").map((_, i, parti) => parti.slice(0, i + 1).join("/"));

/** Cerca una cartella nell'albero. */
function trova(cartelle: Cartella[], percorso: Percorso): Cartella | undefined {
  for (const c of cartelle) {
    if (stesso(c.percorso, percorso)) return c;
    const sotto = trova(c.cartelle, percorso);
    if (sotto) return sotto;
  }
  return undefined;
}

/** La nota modificata più di recente, in tutta la colonna. */
function piuRecente(albero: Albero): string | undefined {
  const tutte = [...albero.nonOrganizzate.note];
  const visita = (elenco: Cartella[]) =>
    elenco.forEach((c) => {
      tutte.push(...c.note);
      visita(c.cartelle);
    });
  visita(albero.cartelle);
  return tutte.sort((a, b) => b.modificata.localeCompare(a.modificata))[0]?.id;
}

interface Conflitto {
  nome: string;
  dove: Percorso;
  risolvi: (scelta: SeEsiste | null) => void;
}

export function FinestraPrincipale(): ReactElement {
  const [albero, setAlbero] = useState<Albero | null>(null);
  const [aperta, setAperta] = useState<Nota | null>(null);
  const [nuovaId, setNuovaId] = useState<string | null>(null);
  const [cartelleAperte, setCartelleAperte] = useState<Set<Percorso>>(() => new Set());
  const [campo, setCampo] = useState<Campo | null>(null);
  /** Cartella su cui torna il focus quando il campo della rinomina si chiude (CA-05.11). */
  const rigaDelFocus = useRef<Percorso | null>(null);
  const [trascinato, setTrascinato] = useState<Trascinato | null>(null);
  const [menuCartella, setMenuCartella] = useState<{
    percorso: Percorso;
    x: number;
    y: number;
  } | null>(null);
  const [menuNota, setMenuNota] = useState<{ x: number; y: number } | null>(null);
  const [menuRiga, setMenuRiga] = useState<{
    id: string;
    cartella: Percorso;
    x: number;
    y: number;
  } | null>(null);
  /** Pannello Sposta in per una nota: quella aperta (dal ···) o una della colonna (tasto destro). */
  const [spostaIn, setSpostaIn] = useState<{
    id: string;
    cartella: Percorso;
    destra: number;
    y: number;
  } | null>(null);
  const [conflitto, setConflitto] = useState<Conflitto | null>(null);
  const [avviso, setAvviso] = useState(false);
  const [vista, setVista] = useState<"nota" | "cestino">("nota");
  const [cestino, setCestino] = useState<ElementoCestino[]>([]);
  const [bloccata, setBloccata] = useState(false);
  const [riprovando, setRiprovando] = useState(false);
  const [confermaChiusura, setConfermaChiusura] = useState(false);
  const apertaAttuale = useRef<Nota | null>(null);
  const pulsanteMenu = useRef<HTMLButtonElement>(null);

  // Dopo ogni salvataggio la colonna si aggiorna: titolo e ordine (RB-60, RB-65).
  const [coda] = useState(
    () =>
      new CodaSalvataggio(
        api.salva,
        () => void api.albero().then(setAlbero, () => setBloccata(true)),
        () => setBloccata(true),
      ),
  );

  useEffect(() => {
    apertaAttuale.current = aperta;
  }, [aperta]);

  const ricarica = useCallback(async () => {
    const nuovo = await api.albero();
    setAlbero(nuovo);
    return nuovo;
  }, []);

  /**
   * Esegue una chiamata all'API. Se l'API non risponde: SC-07 (RB-61). Se risponde con un
   * errore: avviso e colonna ricaricata (SF-32, DEC-37).
   */
  const esegui = useCallback(
    async <T,>(chiamata: () => Promise<T>): Promise<T | undefined> => {
      try {
        return await chiamata();
      } catch (errore) {
        if (errore instanceof ErroreApi && errore.stato !== null) {
          setAvviso(true);
          await ricarica().catch(() => setBloccata(true));
        } else {
          setBloccata(true);
        }
        return undefined;
      }
    },
    [ricarica],
  );

  const chiediConflitto = (nome: string, dove: Percorso) =>
    new Promise<SeEsiste | null>((risolvi) =>
      setConflitto({
        nome,
        dove,
        risolvi: (scelta) => {
          setConflitto(null);
          risolvi(scelta);
        },
      }),
    );

  /**
   * Operazione su una cartella con RB-31: al primo 409 chiede cosa fare e ripete con la scelta;
   * con Unisci risolve una per una le sottocartelle omonime rimaste.
   */
  const conNome = async (
    operazione: (seEsiste: SeEsiste) => Promise<EsitoCartella>,
    dove: Percorso,
  ): Promise<EsitoCartella | null> => {
    let scelta: SeEsiste = "chiedi";
    for (;;) {
      try {
        const esito = await operazione(scelta);
        for (const resto of esito.daRisolvere) {
          await conNome(
            (s) => api.spostaCartella(resto, esito.cartella.percorso, s, true),
            esito.cartella.percorso,
          );
        }
        return esito;
      } catch (errore) {
        if (errore instanceof ErroreApi && errore.stato === 409 && scelta === "chiedi") {
          const decisa = await chiediConflitto(errore.conflitto ?? "", dove);
          if (!decisa) return null;
          scelta = decisa;
          continue;
        }
        throw errore;
      }
    }
  };

  /** Dopo che una cartella cambia percorso, le cartelle aperte e la nota aperta la seguono. */
  const seguiCartella = async (prima: Percorso, dopo: Percorso) => {
    setCartelleAperte((aperte) => {
      const nuove = new Set<Percorso>();
      for (const p of aperte) nuove.add(dentro(p, prima) ? dopo + p.slice(prima.length) : p);
      catena(padre(dopo)).forEach((p) => nuove.add(p));
      return nuove;
    });
    const nota = apertaAttuale.current;
    if (nota && dentro(nota.cartella, prima)) {
      const aggiornata = await api.leggi(nota.id).catch(() => null);
      if (aggiornata) {
        setAperta((a) => (a ? { ...a, cartella: aggiornata.cartella } : a));
        // La nota aperta resta visibile nella colonna, anche dopo un'unione (RB-66).
        setCartelleAperte((aperte) => new Set([...aperte, ...catena(aggiornata.cartella)]));
      }
    }
  };

  const apriCartelle = (percorsi: Percorso[]) =>
    setCartelleAperte((aperte) => new Set([...aperte, ...percorsi]));

  // Aprendo un'altra nota, quella corrente si salva prima (RB-06); se non si salva, si resta.
  /**
   * Lasciando la nota aperta, se è vuota si cancella per sempre (RB-10, DEC-39). Il controllo
   * lo fa l'API: una nota con del testo riceve 409 e resta. Dice se la nota è stata cancellata.
   */
  const lasciaVuota = useCallback(async (opzioni?: { keepalive?: boolean }) => {
    const nota = apertaAttuale.current;
    if (!nota) return false;
    try {
      await api.eliminaSeVuota(nota.id, opzioni);
      return true;
    } catch {
      return false;
    }
  }, []);

  const apri = useCallback(
    async (id: string) => {
      await coda.scarica();
      if (coda.haModifiche) return;
      if (id === apertaAttuale.current?.id) return;
      if (await lasciaVuota()) await ricarica().catch(() => setBloccata(true));
      const nota = await esegui(() => api.leggi(id));
      if (!nota) return;
      setNuovaId(null);
      setAperta(nota);
      setVista("nota");
    },
    [coda, esegui, lasciaVuota, ricarica],
  );

  // Carica la colonna e, se non c'è una nota aperta, apre la modificata più di recente.
  const carica = useCallback(async () => {
    const nuovo = await ricarica();
    const id = piuRecente(nuovo);
    if (!apertaAttuale.current && id) {
      const nota = await api.leggi(id);
      setAperta(nota);
      apriCartelle(catena(nota.cartella));
    }
  }, [ricarica]);

  // All'avvio: se l'API non risponde, SC-07 (RB-61).
  useEffect(() => {
    void (async () => {
      try {
        await carica();
      } catch {
        setBloccata(true);
      }
    })();
  }, [carica]);

  // Si salva subito anche quando la finestra perde il focus o si chiude (RB-06).
  useEffect(() => {
    const suPerditaFocus = () => void coda.scarica();
    window.addEventListener("blur", suPerditaFocus);
    const togli = alChiudere(
      async () => {
        await coda.scarica({ keepalive: true });
        if (!coda.haModifiche) {
          // La finestra si nasconde: una nota vuota lasciata aperta sparisce (DEC-39).
          if (await lasciaVuota({ keepalive: true })) {
            setAperta(null);
            await ricarica().catch(() => setBloccata(true));
          }
          return true;
        }
        setConfermaChiusura(true);
        return false;
      },
      () => coda.haModifiche,
    );
    return () => {
      window.removeEventListener("blur", suPerditaFocus);
      togli();
    };
  }, [coda, lasciaVuota, ricarica]);

  // "Apri nel programma" da una nota rapida: la nota aperta si salva e al suo posto si apre
  // la nota rapida (RB-05); la colonna si aggiorna perché la nota è nuova.
  useEffect(
    () =>
      allaRichiestaDiApertura((id) => {
        void (async () => {
          await ricarica().catch(() => setBloccata(true));
          if (id) await apri(id);
        })();
      }),
    [apri, ricarica],
  );

  // Riprova: prima il testo in attesa, poi di nuovo la colonna.
  const riprova = async () => {
    setRiprovando(true);
    try {
      await coda.scarica();
      if (coda.haModifiche) return;
      await carica();
      setBloccata(false);
    } catch {
      setBloccata(true);
    } finally {
      setRiprovando(false);
    }
  };

  /** Crea una nota vuota e la apre (FL-09, RB-10): con il + nella radice, o in una cartella (RB-09). */
  const nuovaNota = async (cartella: Percorso = "") => {
    await coda.scarica();
    if (coda.haModifiche) return;
    await lasciaVuota();
    const nota = await esegui(() => api.crea(cartella === "" ? {} : { cartella }));
    if (!nota) return;
    await ricarica().catch(() => setBloccata(true));
    apriCartelle(catena(cartella));
    setNuovaId(nota.id);
    setAperta(nota);
    setVista("nota");
  };

  // ——— Cartelle ———

  /** Nuova cartella: il campo compare al suo posto con «Nuova cartella» selezionato (RB-48). */
  const nuovaCartella = (genitore: Percorso) => {
    if (!albero) return;
    const figli =
      genitore === "" ? albero.cartelle : (trova(albero.cartelle, genitore)?.cartelle ?? []);
    let proposta = NUOVA_CARTELLA;
    for (let n = 2; figli.some((c) => stesso(c.nome, proposta)); n++) {
      proposta = `${NUOVA_CARTELLA} (${n})`;
    }
    apriCartelle(catena(genitore));
    setCampo({ tipo: "nuova", genitore, proposta });
  };

  const annullaCampo = () => {
    if (campo?.tipo === "rinomina") rigaDelFocus.current = campo.percorso;
    setCampo(null);
  };

  const confermaCampo = async (valore: string, daTastiera: boolean) => {
    const attuale = campo;
    const segueFocus = daTastiera && attuale?.tipo === "rinomina";
    if (segueFocus) rigaDelFocus.current = attuale.percorso;
    setCampo(null);
    if (!attuale || valore.trim() === "") return;
    if (attuale.tipo === "nuova") {
      // Il nome proposto lo numera il server (RB-48); un nome scelto segue RB-31.
      const nome = valore === attuale.proposta ? undefined : valore;
      await esegui(() =>
        conNome((s) => api.creaCartella(attuale.genitore, nome, s), attuale.genitore),
      );
    } else {
      if (valore === attuale.nome) return;
      const esito = await esegui(() =>
        conNome((s) => api.rinominaCartella(attuale.percorso, valore, s), padre(attuale.percorso)),
      );
      if (esito) {
        if (segueFocus) rigaDelFocus.current = esito.cartella.percorso;
        await seguiCartella(attuale.percorso, esito.cartella.percorso);
      }
    }
    await ricarica().catch(() => setBloccata(true));
  };

  // Chiuso il campo con Invio o Esc, il focus torna sulla riga della cartella; dopo un clic
  // altrove resta dove si è cliccato.
  useEffect(() => {
    const percorso = rigaDelFocus.current;
    if (percorso === null || campo) return;
    const riga = document.querySelector<HTMLElement>(`[data-cartella="${CSS.escape(percorso)}"]`);
    if (!riga) return;
    rigaDelFocus.current = null;
    if (document.activeElement === document.body || document.activeElement === null) riga.focus();
  }, [albero, campo]);

  const spostaCartella = async (percorso: Percorso, destinazione: Percorso) => {
    const esito = await esegui(() =>
      conNome((s) => api.spostaCartella(percorso, destinazione, s), destinazione),
    );
    if (esito) await seguiCartella(percorso, esito.cartella.percorso);
    await ricarica().catch(() => setBloccata(true));
  };

  /** Sposta una nota; se è quella aperta resta aperta e la sua cartella si apre (RB-66). */
  const spostaNota = async (id: string, cartella: Percorso) => {
    await coda.scarica();
    if (coda.haModifiche) return;
    const nota = await esegui(() => api.spostaNota(id, cartella));
    if (nota && nota.id === apertaAttuale.current?.id) {
      setAperta((a) => (a ? { ...a, cartella: nota.cartella } : a));
      apriCartelle(catena(nota.cartella));
    }
    await ricarica().catch(() => setBloccata(true));
  };

  // ——— Cestino ———

  const ricaricaCestino = async () => {
    const elementi = await esegui(api.cestino);
    if (elementi) setCestino(elementi);
  };

  /** Nel cestino, senza conferma (RB-25, RB-26); se ci finisce la nota aperta, stato vuoto (RB-67). */
  const cestinaNota = async (id: string) => {
    await coda.scarica();
    if (coda.haModifiche) return;
    const fatto = await esegui(() => api.cestinaNota(id));
    if (fatto && apertaAttuale.current?.id === id) setAperta(null);
    await ricarica().catch(() => setBloccata(true));
    if (vista === "cestino") await ricaricaCestino();
  };

  const cestinaCartella = async (percorso: Percorso) => {
    await coda.scarica();
    if (coda.haModifiche) return;
    const fatto = await esegui(() => api.cestinaCartella(percorso));
    const nota = apertaAttuale.current;
    if (fatto && nota && dentro(nota.cartella, percorso)) setAperta(null);
    await ricarica().catch(() => setBloccata(true));
    // Con il cestino aperto, l'elemento appena eliminato compare subito nell'elenco.
    if (vista === "cestino") await ricaricaCestino();
  };

  const ripristina = async (elemento: ElementoCestino) => {
    await esegui(() =>
      elemento.tipo === "nota"
        ? api.ripristina(elemento.id)
        : conNome((s) => api.ripristina(elemento.id, s) as Promise<EsitoCartella>, ""),
    );
    await ricarica().catch(() => setBloccata(true));
    await ricaricaCestino();
  };

  const apriCestino = async () => {
    await coda.scarica();
    if (coda.haModifiche) return;
    if (await lasciaVuota()) {
      setAperta(null);
      await ricarica().catch(() => setBloccata(true));
    }
    await ricaricaCestino();
    setVista("cestino");
  };

  const rilascia = async (destinazione: Destinazione) => {
    const t = trascinato;
    setTrascinato(null);
    if (!t) return;
    if (destinazione.tipo === "cestino") {
      if (t.tipo === "nota") await cestinaNota(t.id);
      else await cestinaCartella(t.percorso);
      return;
    }
    const dove = destinazione.tipo === "radice" ? "" : destinazione.percorso;
    if (t.tipo === "nota") await spostaNota(t.id, dove);
    else await spostaCartella(t.percorso, dove);
  };

  // ——— Menu ———

  const vociCartella = (percorso: Percorso): VoceMenu[] => [
    {
      tipo: "voce",
      etichetta: "Nuova nota qui",
      icona: FileText,
      azione: () => void nuovaNota(percorso),
    },
    {
      tipo: "voce",
      etichetta: "Nuova sottocartella",
      icona: Folder,
      azione: () => nuovaCartella(percorso),
    },
    {
      tipo: "voce",
      etichetta: "Rinomina",
      icona: Pencil,
      azione: () => setCampo({ tipo: "rinomina", percorso, nome: ultimo(percorso) }),
    },
    { tipo: "separatore" },
    {
      tipo: "voce",
      etichetta: "Elimina",
      icona: Trash2,
      errore: true,
      azione: () => void cestinaCartella(percorso),
    },
  ];

  /** Tasto destro su una nota della colonna: lo stesso menu della nota, senza aprirla. */
  const vociRiga = (riga: { id: string; cartella: Percorso; x: number; y: number }): VoceMenu[] => [
    {
      tipo: "voce",
      etichetta: "Sposta in…",
      icona: FolderInput,
      azione: () =>
        setSpostaIn({ id: riga.id, cartella: riga.cartella, destra: riga.x + 236, y: riga.y }),
    },
    { tipo: "separatore" },
    {
      tipo: "voce",
      etichetta: "Elimina",
      icona: Trash2,
      errore: true,
      azione: () => void cestinaNota(riga.id),
    },
  ];

  const mostraNota = vista === "nota" && aperta !== null;
  const vociNota: VoceMenu[] = [
    ...(mostraNota
      ? ([
          {
            tipo: "voce",
            etichetta: "Sposta in…",
            icona: FolderInput,
            azione: () => {
              const r = pulsanteMenu.current?.getBoundingClientRect();
              if (r && aperta)
                setSpostaIn({
                  id: aperta.id,
                  cartella: aperta.cartella,
                  destra: r.right,
                  y: r.bottom + 4,
                });
            },
          },
          { tipo: "separatore" },
          {
            tipo: "voce",
            etichetta: "Elimina",
            icona: Trash2,
            errore: true,
            azione: () => aperta && void cestinaNota(aperta.id),
          },
        ] satisfies VoceMenu[])
      : []),
  ];

  const ciSonoNote = albero !== null && piuRecente(albero) !== undefined;

  return (
    <>
      {albero !== null && (
        <div className={`finestra ${bloccata ? "finestra-nascosta" : ""}`} inert={bloccata}>
          <Colonna
            albero={albero}
            apertaId={vista === "nota" ? (aperta?.id ?? null) : null}
            cartelleAperte={cartelleAperte}
            onApriChiudiCartella={(percorso, apri) =>
              setCartelleAperte((aperte) => {
                const nuove = new Set(aperte);
                if (apri ?? !nuove.has(percorso)) nuove.add(percorso);
                else nuove.delete(percorso);
                return nuove;
              })
            }
            onApriNota={(id) => void apri(id)}
            onNuovaNota={() => void nuovaNota()}
            onNuovaCartella={nuovaCartella}
            campo={campo}
            onConfermaCampo={(valore, daTastiera) => void confermaCampo(valore, daTastiera)}
            onAnnullaCampo={annullaCampo}
            onMenuCartella={(percorso, x, y) => setMenuCartella({ percorso, x, y })}
            onMenuNota={(id, cartella, x, y) => setMenuRiga({ id, cartella, x, y })}
            onRinomina={(percorso) =>
              setCampo({ tipo: "rinomina", percorso, nome: ultimo(percorso) })
            }
            trascinato={trascinato}
            onTrascina={setTrascinato}
            onRilascia={(d) => void rilascia(d)}
            cestinoAperto={vista === "cestino"}
            onApriCestino={() => void apriCestino()}
          />
          <main className="area-nota">
            {mostraNota && (
              <div className="area-nota-menu">
                <PulsanteIcona
                  ref={pulsanteMenu}
                  nome="Altre azioni"
                  icona={<Icona di={Ellipsis} />}
                  aria-haspopup="menu"
                  aria-expanded={menuNota !== null}
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setMenuNota(menuNota ? null : { x: r.right - 236, y: r.bottom + 4 });
                  }}
                />
              </div>
            )}
            {avviso && <Avviso testo={TESTO_ERRORE} onChiudi={() => setAvviso(false)} />}
            {vista === "cestino" ? (
              <Cestino
                elementi={cestino}
                onRipristina={(e) => void ripristina(e)}
                onElimina={(e) =>
                  void (async () => {
                    await esegui(() => api.eliminaDefinitivamente(e.id));
                    await ricaricaCestino();
                    await ricarica().catch(() => setBloccata(true));
                  })()
                }
                onSvuota={() =>
                  void (async () => {
                    await esegui(api.svuotaCestino);
                    await ricaricaCestino();
                    await ricarica().catch(() => setBloccata(true));
                  })()
                }
              />
            ) : aperta ? (
              <NotaAperta
                key={aperta.id}
                nota={aperta}
                nuova={aperta.id === nuovaId}
                onModifica={(dati) => coda.modifica(aperta.id, dati)}
              />
            ) : (
              <div className="area-nota-vuota">
                {ciSonoNote ? (
                  <StatoVuoto
                    icona={FileText}
                    titolo="Nessuna nota aperta"
                    testo="Scrivi quello che ti serve ricordare: la nota si salva da sola."
                    azione={<Pulsante onClick={() => void nuovaNota()}>Nuova nota</Pulsante>}
                  />
                ) : (
                  <StatoVuoto
                    icona={FileText}
                    titolo="Nessuna nota, per ora."
                    testo="Inizia a scrivere."
                    azione={<Pulsante onClick={() => void nuovaNota()}>Nuova nota</Pulsante>}
                  />
                )}
              </div>
            )}
          </main>
        </div>
      )}
      {menuCartella && (
        <Menu
          voci={vociCartella(menuCartella.percorso)}
          etichetta={`Cartella ${ultimo(menuCartella.percorso)}`}
          x={menuCartella.x}
          y={menuCartella.y}
          onChiudi={() => setMenuCartella(null)}
        />
      )}
      {menuNota && (
        <Menu
          voci={vociNota}
          etichetta="Altre azioni"
          x={menuNota.x}
          y={menuNota.y}
          onChiudi={() => setMenuNota(null)}
        />
      )}
      {menuRiga && (
        <Menu
          voci={vociRiga(menuRiga)}
          etichetta="Nota"
          x={menuRiga.x}
          y={menuRiga.y}
          onChiudi={() => setMenuRiga(null)}
        />
      )}
      {spostaIn && albero && (
        <PannelloSpostaIn
          cartelle={albero.cartelle}
          attuale={spostaIn.cartella}
          destra={spostaIn.destra}
          y={spostaIn.y}
          onScegli={(percorso) => {
            setSpostaIn(null);
            void spostaNota(spostaIn.id, percorso);
          }}
          onChiudi={() => {
            setSpostaIn(null);
            pulsanteMenu.current?.focus();
          }}
        />
      )}
      {conflitto && (
        <FinestraConferma
          titolo={
            conflitto.dove === ""
              ? `Esiste già «${conflitto.nome}» tra le cartelle`
              : `Esiste già «${conflitto.nome}» in ${ultimo(conflitto.dove)}`
          }
          testo="Puoi aggiungere un numero al nome, unire le due cartelle o annullare."
          azione="Aggiungi un numero"
          altra={{ etichetta: "Unisci", onClick: () => conflitto.risolvi("unisci") }}
          onAnnulla={() => conflitto.risolvi(null)}
          onConferma={() => conflitto.risolvi("numero")}
        />
      )}
      {bloccata && <Blocco inCorso={riprovando} onRiprova={riprova} />}
      {confermaChiusura && (
        <FinestraConferma
          titolo="La nota non è salvata"
          testo="Chiudendo, il testo va perso."
          azione="Chiudi comunque"
          onAnnulla={() => setConfermaChiusura(false)}
          onConferma={() => void chiudiFinestra()}
        />
      )}
    </>
  );
}
