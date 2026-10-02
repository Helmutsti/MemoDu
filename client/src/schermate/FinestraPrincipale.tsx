// SC-01 Finestra principale, versione del frammento Must B «Smistare» (DEC-36): colonna con
// Non organizzate e Cartelle (CMP-14), area della nota o il cestino (SC-04). Un clic sul titolo
// del percorso apre Info (CMP-24, DEC-96), che ha anche Sposta in, Chiudi nota ed Elimina; il
// tasto destro su una nota della colonna apre la stessa Info al centro. In cima alla colonna la
// ricerca, anche con Ctrl + K (RF-08, DEC-94), e la ricerca avanzata con Ctrl + Maiusc + K
// (DEC-96). Se l'API non risponde compare
// SC-07 al posto del contenuto, che resta in memoria (RB-61); chiudendo con testo non salvato
// si chiede conferma (RB-62). Un'operazione su cartelle o cestino che non riesce mostra un
// avviso e ricarica la colonna (DEC-37); un nome già usato apre la finestra con tre scelte
// (RB-31). La riga Impostazioni sotto il Cestino apre SC-06 al posto della nota (DEC-91).

import {
  FileText,
  Folder,
  FolderInput,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Pin,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import type {
  Albero,
  Cartella,
  DatiDettagli,
  DatiNota,
  ElementoCestino,
  EsitoCartella,
  Nota,
  Percorso,
  SeEsiste,
  VoceElenco,
  VoceTag,
} from "@memodu/condiviso";
import { anteprima } from "@memodu/condiviso";
import { api, ErroreApi, type RisultatoRicerca } from "../api";
import { Avviso } from "../componenti/Avviso";
import { FinestraConferma } from "../componenti/FinestraConferma";
import { Icona } from "../componenti/Icona";
import { Menu, type VoceMenu } from "../componenti/Menu";
import { PannelloSpostaIn } from "../componenti/PannelloSpostaIn";
import { PulsantiFinestra } from "../componenti/PulsantiFinestra";
import { Ricerca } from "../componenti/Ricerca";
import { Pulsante, PulsanteIcona } from "../componenti/Pulsante";
import { StatoVuoto } from "../componenti/StatoVuoto";
import {
  alChiudere,
  allaChiusuraDiUnaNotaRapida,
  allaRichiestaDiApertura,
  allaSincronizzazione,
  allUscita,
  annullaUscita,
  chiudiFinestra,
  confermaUscita,
  mostraFinestra,
  PULSANTI_FINESTRA,
  riprovaSincronizzazione,
  SU_MAC,
} from "../finestra";
import { CodaSalvataggio } from "../salvataggio";
import { Blocco } from "./Blocco";
import { Cestino } from "./Cestino";
import { Info as FinestraInfo, type TipoInfo } from "./Info";
import { Impostazioni } from "./Impostazioni";
import { Colonna, type Campo, type Destinazione, type Trascinato } from "./Colonna";
import { NotaAperta } from "./NotaAperta";
import "./FinestraPrincipale.css";

const TESTO_ERRORE =
  "Non è stato possibile completare l'operazione. La colonna mostra com'è adesso.";
const NUOVA_CARTELLA = "Nuova cartella";

// Testi degli avvisi della sincronizzazione (SC-01, RB-39, RB-40, DEC-83): proposte
// dell'agente, finché non ci sono i testi definitivi della Fase 6.
const TESTO_CONFLITTO =
  "Una nota è stata modificata su due dispositivi: ci sono tutte e due le versioni.";
const TESTO_IRRAGGIUNGIBILE =
  "Il server non risponde da più di un giorno: le modifiche restano su questo computer.";
const TESTO_ERRORE_SINC = "La sincronizzazione non è riuscita: riprovo da sola.";
const TESTO_PROTOCOLLO = "Memodu e il server hanno versioni diverse: aggiornali per sincronizzare.";
const TESTO_CREDENZIALI =
  "Le credenziali non sono valide. Correggi il file credenziali e premi Riprova.";

type AvvisoSincronizzazione =
  | { tipo: "conflitto"; copia: string }
  | { tipo: "irraggiungibile" }
  | { tipo: "errore"; protocollo: boolean };

const stesso = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
const padre = (percorso: Percorso) => percorso.split("/").slice(0, -1).join("/");
const ultimo = (percorso: Percorso) => percorso.split("/").pop() ?? "";
const dentro = (percorso: Percorso, cartella: Percorso) =>
  stesso(percorso, cartella) || percorso.toLowerCase().startsWith(`${cartella.toLowerCase()}/`);
/** La cartella e i suoi antenati: «A/B» → «A», «A/B». */
const catena = (percorso: Percorso) =>
  percorso === "" ? [] : percorso.split("/").map((_, i, parti) => parti.slice(0, i + 1).join("/"));

/** Cerca una cartella nell'albero. */
/** L'albero con il titolo nuovo di una nota, per mostrarlo subito nella colonna (CA-04.7). */
function conTitolo(albero: Albero, id: string, titolo: string): Albero {
  const voci = (note: VoceElenco[]) => note.map((v) => (v.id === id ? { ...v, titolo } : v));
  const cartelle = (elenco: Cartella[]): Cartella[] =>
    elenco.map((c) => ({ ...c, note: voci(c.note), cartelle: cartelle(c.cartelle) }));
  return {
    ...albero,
    nonOrganizzate: { ...albero.nonOrganizzate, note: voci(albero.nonOrganizzate.note) },
    cartelle: cartelle(albero.cartelle),
  };
}

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

/** Memodu ricorda se la colonna è fissata (DEC-55). */
const CHIAVE_COLONNA_FISSATA = "memodu.colonna-fissata";
/** Entro questa distanza dal bordo sinistro compare «| →» (DEC-55). */
const DISTANZA_BORDO_PX = 48;
/** Su macOS il pulsante sta dopo i tre pallini nativi: la zona comprende anche il pulsante. */
const DISTANZA_BORDO_MAC_PX = 144;
/** Il gruppo di destra compare solo con il mouse in alto e vicino a lui, non nell'angolo di
 * «| →» (DEC-61). */
const ZONA_TASTI_DESTRA_PX = 240;

function leggiColonnaFissata(): boolean {
  try {
    return localStorage.getItem(CHIAVE_COLONNA_FISSATA) === "1";
  } catch {
    return false;
  }
}

/** Larghezza della colonna (DEC-62): normale 288, da 10 fino a lasciare 48 px al foglio. */
const CHIAVE_LARGHEZZA_COLONNA = "memodu.colonna-larghezza";
const LARGHEZZA_COLONNA = 288;
const LARGHEZZA_COLONNA_MINIMA = 10;
const SPAZIO_FOGLIO_MINIMO = 48;
const PASSO_TASTIERA_PX = 16;

function limitaLarghezza(larghezza: number): number {
  const massima = Math.max(LARGHEZZA_COLONNA_MINIMA, window.innerWidth - SPAZIO_FOGLIO_MINIMO);
  return Math.round(Math.max(LARGHEZZA_COLONNA_MINIMA, Math.min(larghezza, massima)));
}

function leggiLarghezzaColonna(): number {
  try {
    const salvata = Number(localStorage.getItem(CHIAVE_LARGHEZZA_COLONNA));
    return salvata > 0 ? limitaLarghezza(salvata) : LARGHEZZA_COLONNA;
  } catch {
    return LARGHEZZA_COLONNA;
  }
}

function salvaLarghezzaColonna(larghezza: number): void {
  try {
    localStorage.setItem(CHIAVE_LARGHEZZA_COLONNA, String(larghezza));
  } catch {
    // Senza memoria del browser la larghezza vale fino alla chiusura.
  }
}

function salvaColonnaFissata(fissata: boolean): void {
  try {
    localStorage.setItem(CHIAVE_COLONNA_FISSATA, fissata ? "1" : "0");
  } catch {
    // Senza memoria del browser la scelta vale fino alla chiusura.
  }
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
  const [menuRiga, setMenuRiga] = useState<{
    id: string;
    cartella: Percorso;
    x: number;
    y: number;
  } | null>(null);
  /** Pannello Sposta in per una nota: da Info o dal tasto destro su una riga della colonna. */
  const [spostaIn, setSpostaIn] = useState<{
    id: string;
    cartella: Percorso;
    destra: number;
    y: number;
    /** Aperto per una riga della colonna (tasto destro): il focus ci torna. */
    daRiga?: boolean;
    /** Aperto dalla riga Cartella di Info, che resta aperta sotto: il focus torna lì. */
    daInfo?: boolean;
  } | null>(null);
  const [conflitto, setConflitto] = useState<Conflitto | null>(null);
  const [avviso, setAvviso] = useState(false);
  const [vista, setVista] = useState<"nota" | "cestino" | "impostazioni">("nota");
  const [cestino, setCestino] = useState<ElementoCestino[]>([]);
  const [bloccata, setBloccata] = useState(false);
  const [riprovando, setRiprovando] = useState(false);
  /** Bloccata perché il server rifiuta le credenziali (RB-57), non per l'archivio locale. */
  const [credenzialiRifiutate, setCredenzialiRifiutate] = useState(false);
  const [avvisoSinc, setAvvisoSinc] = useState<AvvisoSincronizzazione | null>(null);
  /** Cresce quando la nota aperta si rilegge per una modifica ricevuta: l'editor riparte. */
  const [riletta, setRiletta] = useState(0);
  const [confermaChiusura, setConfermaChiusura] = useState(false);
  /** La conferma di chiusura è comparsa per «Esci da Memodu». */
  const uscendo = useRef(false);
  // Colonna (DEC-55): chiusa, aperta sopra il foglio o fissata accanto; «| →» compare con il
  // mouse vicino al bordo sinistro.
  const [colonnaFissata, setColonnaFissata] = useState(leggiColonnaFissata);
  const [colonnaAperta, setColonnaAperta] = useState(false);
  const [vicinoAlBordo, setVicinoAlBordo] = useState(false);
  // Per ora i pulsanti della finestra compaiono solo con il mouse vicino al bordo in alto
  // (DEC-61, provvisorio).
  const [vicinoInAlto, setVicinoInAlto] = useState(false);
  const statoColonna = colonnaFissata ? "fissata" : colonnaAperta ? "aperta" : "chiusa";
  const pulsanteApriColonna = useRef<HTMLButtonElement>(null);
  const pulsanteChiudiColonna = useRef<HTMLButtonElement>(null);
  const apriColonna = () => {
    setColonnaAperta(true);
    requestAnimationFrame(() => pulsanteChiudiColonna.current?.focus());
  };
  const chiudiColonna = () => {
    setColonnaAperta(false);
    requestAnimationFrame(() => pulsanteApriColonna.current?.focus());
  };
  const fissaColonna = () => {
    const fissata = !colonnaFissata;
    setColonnaFissata(fissata);
    setColonnaAperta(false);
    salvaColonnaFissata(fissata);
  };
  // Larghezza della colonna aperta o fissata, dalla maniglia sul bordo destro (DEC-62).
  const [larghezzaColonna, setLarghezzaColonna] = useState(leggiLarghezzaColonna);
  const cambiaLarghezza = (larghezza: number) => {
    const nuova = limitaLarghezza(larghezza);
    setLarghezzaColonna(nuova);
    salvaLarghezzaColonna(nuova);
  };
  /**
   * Info aperta (CMP-24, DEC-96): la nota, il tipo (Comparsa sotto il titolo della nota aperta o
   * Finestra al centro dal tasto destro) e dove sta il titolo; tutti i tag per i suggerimenti.
   */
  const [info, setInfo] = useState<{
    nota: Nota;
    tipo: TipoInfo;
    ancora?: { x: number; y: number };
  } | null>(null);
  const [tuttiTag, setTuttiTag] = useState<VoceTag[]>([]);
  /**
   * Nota sparita mentre era aperta: nel cestino (`elemento` da ripristinare) o eliminata per
   * sempre. Il testo non salvato resta qui finché l'avviso è aperto.
   */
  const [sparita, setSparita] = useState<{
    id: string;
    dati: DatiNota;
    elemento?: string;
  } | null>(null);
  const apertaAttuale = useRef<Nota | null>(null);
  const suErroreSalvataggio = useRef<(errore: unknown) => void>(() => setBloccata(true));

  // Dopo ogni salvataggio la colonna si aggiorna: titolo e ordine (RB-60, RB-65).
  const [coda] = useState(
    () =>
      new CodaSalvataggio(
        api.salva,
        (salvata) => {
          // La riga sotto il titolo mostra l'ultima modifica (CA-04.1).
          setAperta((a) =>
            a && a.id === salvata.id ? { ...a, modificata: salvata.modificata } : a,
          );
          void api.albero().then(setAlbero, () => setBloccata(true));
        },
        (errore) => suErroreSalvataggio.current(errore),
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
          // 422 (spostamento dentro sé stessa): nessun avviso, solo l'albero aggiornato (api.md).
          if (errore.stato !== 422) setAvviso(true);
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
    /** Dopo l'operazione e le sottocartelle da risolvere, anche se una di queste fallisce. */
    dopo?: (esito: EsitoCartella) => Promise<void>,
  ): Promise<EsitoCartella | null> => {
    let scelta: SeEsiste = "chiedi";
    for (;;) {
      try {
        const esito = await operazione(scelta);
        try {
          for (const resto of esito.daRisolvere) {
            await conNome(
              (s) => api.spostaCartella(resto, esito.cartella.percorso, s, true),
              esito.cartella.percorso,
            );
          }
        } finally {
          await dopo?.(esito);
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
   * lo fa l'archivio: una nota con del testo riceve 409 e resta. Dice se la nota è stata cancellata.
   */
  const lasciaVuota = useCallback(async () => {
    const nota = apertaAttuale.current;
    if (!nota) return false;
    try {
      await api.eliminaSeVuota(nota.id);
      return true;
    } catch {
      return false;
    }
  }, []);

  const apri = useCallback(
    async (id: string) => {
      await coda.scarica();
      if (coda.haModifiche) return;
      // La nota è già aperta: se l'area mostra il cestino, si torna alla nota.
      if (id === apertaAttuale.current?.id) {
        setVista("nota");
        return;
      }
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
    const puoChiudere = async () => {
      await coda.scarica();
      if (!coda.haModifiche) {
        // La finestra si nasconde: una nota vuota lasciata aperta sparisce (DEC-39).
        if (await lasciaVuota()) {
          setAperta(null);
          await ricarica().catch(() => setBloccata(true));
        }
        return true;
      }
      setConfermaChiusura(true);
      return false;
    };
    const togli = alChiudere(puoChiudere, () => coda.haModifiche);
    // «Esci da Memodu»: con testo non salvato la finestra ricompare con la conferma (RB-62).
    const togliUscita = allUscita(async () => {
      if (await puoChiudere()) return true;
      uscendo.current = true;
      await mostraFinestra();
      return false;
    });
    return () => {
      window.removeEventListener("blur", suPerditaFocus);
      togli();
      togliUscita();
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

  // Sincronizzazione in background (RF-10): le modifiche ricevute aggiornano la colonna e, se la
  // nota aperta non ha testo in attesa, anche lei; un conflitto nato mentre si scriveva apre la
  // copia, dove è finito il testo (DEC-06, RB-39).
  const gestoriSinc = useRef({ ricarica, apri });
  useEffect(() => {
    gestoriSinc.current = { ricarica, apri };
  });
  useEffect(
    () =>
      allaSincronizzazione((evento) => {
        const { ricarica: ricaricaColonna, apri: apriNota } = gestoriSinc.current;
        switch (evento.tipo) {
          case "note-cambiate": {
            void ricaricaColonna().catch(() => setBloccata(true));
            const aperta = apertaAttuale.current;
            if (aperta && evento.note.includes(aperta.id) && !coda.haModifiche) {
              void api.leggi(aperta.id).then(
                (nota) => {
                  setAperta((a) => (a && a.id === nota.id ? nota : a));
                  setRiletta((n) => n + 1);
                },
                () => undefined,
              );
            }
            break;
          }
          case "conflitto":
            setAvvisoSinc({ tipo: "conflitto", copia: evento.copia });
            if (evento.scrivendo && apertaAttuale.current?.id === evento.originale) {
              void apriNota(evento.copia);
            }
            break;
          case "riuscita":
            setAvvisoSinc((a) => (a?.tipo === "conflitto" ? a : null));
            setCredenzialiRifiutate((rifiutate) => {
              if (rifiutate) setBloccata(false);
              return false;
            });
            setRiprovando(false);
            break;
          case "credenziali-rifiutate":
            setCredenzialiRifiutate(true);
            setBloccata(true);
            setRiprovando(false);
            break;
          case "irraggiungibile":
            setAvvisoSinc({ tipo: "irraggiungibile" });
            break;
          case "errore":
            setAvvisoSinc({ tipo: "errore", protocollo: evento.protocollo });
            break;
        }
      }),
    [coda],
  );

  // Una nota rapida chiusa è nuova o cambiata: la colonna si aggiorna subito.
  useEffect(
    () => allaChiusuraDiUnaNotaRapida(() => void ricarica().catch(() => setBloccata(true))),
    [ricarica],
  );

  // Riprova: prima il testo in attesa, poi di nuovo la colonna. Con le credenziali rifiutate si
  // rilegge il file e si riprova la sincronizzazione: il blocco sparisce quando riesce (RB-57).
  const riprova = async () => {
    setRiprovando(true);
    if (credenzialiRifiutate) {
      await riprovaSincronizzazione();
      return;
    }
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

  // Scorciatoie della finestra (⌘ al posto di Ctrl su Mac): Ctrl + N crea una nuova nota come
  // il + delle non organizzate (FL-09, DEC-69); Ctrl + W chiude la nota aperta come «Chiudi
  // nota» (DEC-70); Ctrl + K porta nella ricerca (RB-71), Ctrl + Maiusc + K nella ricerca
  // avanzata (DEC-96). Con una finestra di dialogo o SC-07 davanti non fanno niente; Info sotto il
  // titolo e la card della ricerca non bloccano.
  const scorciatoie = useRef<Record<string, (() => Promise<void>) | undefined>>({});
  useEffect(() => {
    scorciatoie.current = bloccata
      ? {}
      : {
          n: nuovaNota,
          w: vista === "nota" && aperta !== null ? chiudiNota : undefined,
          k: async () => vaiAllaRicerca(),
          K: async () => setAvanzataRicerca((n) => n + 1),
          // Ctrl + B resta il grassetto (DEC-102).
          "\\": async () => fissaColonna(),
        };
  });
  useEffect(() => {
    const suTasto = (e: KeyboardEvent) => {
      const comando = SU_MAC ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey;
      const minuscolo = e.key.toLowerCase();
      const tasto = e.shiftKey ? (minuscolo === "k" ? "K" : "") : minuscolo;
      if (!comando || e.altKey || !["n", "w", "k", "K", "\\"].includes(tasto)) return;
      e.preventDefault();
      const davanti = document.querySelector(
        '[role="dialog"]:not(.info-comparsa):not(.card-ricerca), [role="alertdialog"]',
      );
      if (e.repeat || davanti) return;
      void scorciatoie.current[tasto]?.();
    };
    window.addEventListener("keydown", suTasto, true);
    return () => window.removeEventListener("keydown", suTasto, true);
  }, []);

  // ——— Ricerca (RF-08, DEC-94) ———

  const [focusRicerca, setFocusRicerca] = useState(0);
  /** Cresce a ogni Ctrl + Maiusc + K: si apre la ricerca avanzata (DEC-96, CA-08.17). */
  const [avanzataRicerca, setAvanzataRicerca] = useState(0);
  /** La colonna l'ha aperta Ctrl + K: si richiude con la ricerca (RB-71). */
  const colonnaDallaRicerca = useRef(false);
  /** Dove era il cursore prima di Ctrl + K: ci torna con Esc (RB-71). */
  const primaDellaRicerca = useRef<HTMLElement | null>(null);

  const vaiAllaRicerca = () => {
    // Dal campo stesso non c'è un posto a cui tornare.
    const attivo = document.activeElement;
    if (!attivo?.closest(".ricerca")) {
      primaDellaRicerca.current = attivo instanceof HTMLElement ? attivo : null;
    }
    if (statoColonna === "chiusa") {
      colonnaDallaRicerca.current = true;
      setColonnaAperta(true);
    }
    setFocusRicerca((n) => n + 1);
  };

  /** Finita la ricerca: la colonna aperta da Ctrl + K si richiude. */
  const lasciaRicerca = () => {
    if (colonnaDallaRicerca.current) setColonnaAperta(false);
    colonnaDallaRicerca.current = false;
  };

  /**
   * Card chiusa senza aprire niente. Con Esc la colonna aperta da Ctrl + K si richiude e il
   * cursore torna dov'era; con un clic fuori la colonna resta come aperta a mano: un clic sul
   * foglio la chiude comunque (DEC-56), uno nella colonna no.
   */
  const chiusaRicerca = (conEsc: boolean) => {
    const dallaScorciatoia = colonnaDallaRicerca.current;
    if (conEsc) {
      lasciaRicerca();
      if (dallaScorciatoia) primaDellaRicerca.current?.focus();
    } else {
      colonnaDallaRicerca.current = false;
    }
    primaDellaRicerca.current = null;
  };

  /** La ricerca non è riuscita: SC-07 se la copia di lavoro non risponde, altrimenti l'avviso. */
  const erroreRicerca = (errore: unknown) => {
    if (errore instanceof ErroreApi && errore.stato !== null) setAvviso(true);
    else setBloccata(true);
  };

  /**
   * Apre un risultato com'è adesso (RB-45): una nota nel cestino, anche se ci è finita mentre la
   * card era aperta, mostra l'avviso con Ripristina (RB-29, RB-28); una eliminata per sempre lo
   * dice.
   */
  const apriRisultato = async (r: RisultatoRicerca) => {
    lasciaRicerca();
    primaDellaRicerca.current = null;
    await coda.scarica();
    if (coda.haModifiche) return;
    try {
      await api.leggi(r.id);
    } catch (errore) {
      if (errore instanceof ErroreApi && errore.stato === 404) {
        // L'avviso parla del risultato: la nota di prima si chiude, come con «Chiudi nota».
        const cancellata = await lasciaVuota();
        setNuovaId(null);
        setAperta(null);
        setVista("nota");
        setSparita({ id: r.id, dati: {}, elemento: errore.cestino });
        if (cancellata) await ricarica().catch(() => setBloccata(true));
      } else {
        setBloccata(true);
      }
      return;
    }
    await apri(r.id);
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

  // Chiuso il campo nome, il focus torna su una riga (CA-05.11): la cartella rinominata o
  // creata; annullando una cartella nuova, la cartella madre o il + delle Cartelle ("").
  const annullaCampo = () => {
    if (campo) rigaDelFocus.current = campo.tipo === "rinomina" ? campo.percorso : campo.genitore;
    setCampo(null);
  };

  const confermaCampo = async (valore: string, daTastiera: boolean) => {
    const attuale = campo;
    const segueFocus = daTastiera && attuale !== null;
    if (segueFocus)
      rigaDelFocus.current = attuale.tipo === "rinomina" ? attuale.percorso : attuale.genitore;
    setCampo(null);
    if (!attuale || valore.trim() === "") return;
    if (attuale.tipo === "nuova") {
      // Il nome proposto lo numera il server (RB-48); un nome scelto segue RB-31.
      const nome = valore === attuale.proposta ? undefined : valore;
      const esito = await esegui(() =>
        conNome((s) => api.creaCartella(attuale.genitore, nome, s), attuale.genitore),
      );
      if (esito && segueFocus) rigaDelFocus.current = esito.cartella.percorso;
    } else {
      if (valore === attuale.nome) return;
      await esegui(() =>
        conNome(
          (s) => api.rinominaCartella(attuale.percorso, valore, s),
          padre(attuale.percorso),
          async (esito) => {
            if (segueFocus) rigaDelFocus.current = esito.cartella.percorso;
            await seguiCartella(attuale.percorso, esito.cartella.percorso);
          },
        ),
      );
    }
    await ricarica().catch(() => setBloccata(true));
  };

  // Chiuso il campo con Invio o Esc, il focus torna sulla riga della cartella; dopo un clic
  // altrove resta dove si è cliccato.
  useEffect(() => {
    const percorso = rigaDelFocus.current;
    if (percorso === null || campo) return;
    const riga =
      percorso === ""
        ? document.querySelector<HTMLElement>('button[aria-label="Nuova cartella"]')
        : document.querySelector<HTMLElement>(`[data-cartella="${CSS.escape(percorso)}"]`);
    if (!riga) return;
    rigaDelFocus.current = null;
    if (document.activeElement === document.body || document.activeElement === null) riga.focus();
  }, [albero, campo]);

  const spostaCartella = async (percorso: Percorso, destinazione: Percorso) => {
    await esegui(() =>
      conNome(
        (s) => api.spostaCartella(percorso, destinazione, s),
        destinazione,
        (esito) => seguiCartella(percorso, esito.cartella.percorso),
      ),
    );
    await ricarica().catch(() => setBloccata(true));
  };

  /** Chiuso Sposta in, il focus torna dove era stato aperto: la riga Cartella di Info, la riga
   * della nota o il titolo del percorso. */
  const ridaiFocus = (id: string, daRiga?: boolean, daInfo?: boolean) => {
    const dove = daInfo
      ? document.querySelector<HTMLElement>(".info .info-riga-pulsante")
      : daRiga
        ? document.querySelector<HTMLElement>(`[data-nota="${CSS.escape(id)}"]`)
        : null;
    (dove ?? document.querySelector<HTMLElement>(".percorso-titolo"))?.focus();
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
    // Info aperta sulla nota mostra subito la cartella nuova.
    if (nota) setInfo((i) => (i && i.nota.id === nota.id ? { ...i, nota } : i));
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

  // Salvataggio non riuscito. Se la nota non c'è più (404) si chiude e l'avviso dice se è
  // nel cestino, con Ripristina; altrimenti SC-07 e il testo resta in coda (RB-61).
  suErroreSalvataggio.current = (errore) => {
    if (!(errore instanceof ErroreApi) || errore.stato !== 404) {
      setBloccata(true);
      return;
    }
    const { id, dati } = coda.abbandona();
    if (id === null) return;
    if (apertaAttuale.current?.id === id) setAperta(null);
    setInfo((i) => (i?.nota.id === id ? null : i));
    setSparita({ id, dati, elemento: errore.cestino });
    void ricarica().catch(() => setBloccata(true));
  };

  /** Ripristina l'elemento del cestino, riapre la nota e salva il testo rimasto in sospeso. */
  const ripristinaSparita = async () => {
    if (!sparita?.elemento) return;
    const { id, dati, elemento } = sparita;
    const voce = (await esegui(api.cestino))?.find((e) => e.id === elemento);
    if (!voce) return;
    await ripristina(voce);
    // Ripristino annullato (per esempio davanti a un nome già usato): l'avviso resta.
    if (
      !(await api.leggi(id).then(
        () => true,
        () => false,
      ))
    )
      return;
    if (Object.keys(dati).length > 0 && !(await esegui(() => api.salva(id, dati)))) return;
    setSparita(null);
    await ricarica().catch(() => setBloccata(true));
    await apri(id);
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

  /** Le impostazioni al posto della nota, come il cestino (DEC-91). */
  const apriImpostazioni = async () => {
    await coda.scarica();
    if (coda.haModifiche) return;
    if (await lasciaVuota()) {
      setAperta(null);
      await ricarica().catch(() => setBloccata(true));
    }
    setVista("impostazioni");
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

  // ——— Info e tag (DEC-96, DEC-51) ———

  /**
   * Apre Info di una nota dopo aver salvato il testo in sospeso: sotto il titolo per la nota
   * aperta (Comparsa), al centro dal tasto destro (Finestra).
   */
  const apriInfo = async (id: string, tipo: TipoInfo, ancora?: { x: number; y: number }) => {
    await coda.scarica();
    if (coda.haModifiche) return;
    const letti = await esegui(() => Promise.all([api.leggi(id), api.elencaTag()]));
    if (!letti) return;
    setTuttiTag(letti[1]);
    setInfo({ nota: letti[0], tipo, ancora });
  };

  /** Chiude Info; dalla Comparsa il cursore torna nel testo della nota (CA-04.2). */
  const chiudiInfo = () => {
    const daComparsa = info?.tipo === "comparsa";
    setInfo(null);
    if (daComparsa)
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(".nota-aperta [contenteditable=true]")?.focus(),
      );
  };

  /** Titolo cambiato in Info (CA-04.7): la nota aperta passa dalla coda, un'altra si salva. */
  const titoloInSospeso = useRef<{ id: string; titolo: string; timer: number } | null>(null);
  const salvaTitoloInSospeso = async () => {
    const sospeso = titoloInSospeso.current;
    if (!sospeso) return;
    window.clearTimeout(sospeso.timer);
    titoloInSospeso.current = null;
    if (await esegui(() => api.salva(sospeso.id, { titolo: sospeso.titolo })))
      await ricarica().catch(() => setBloccata(true));
  };
  const cambiaTitolo = (id: string, titolo: string) => {
    setAlbero((a) => a && conTitolo(a, id, titolo));
    if (apertaAttuale.current?.id === id) {
      coda.modifica(id, { titolo });
      setAperta((a) => (a && a.id === id ? { ...a, titolo } : a));
      return;
    }
    if (titoloInSospeso.current) window.clearTimeout(titoloInSospeso.current.timer);
    titoloInSospeso.current = {
      id,
      titolo,
      timer: window.setTimeout(() => void salvaTitoloInSospeso(), 400),
    };
  };
  useEffect(() => {
    // Chiusa Info, il titolo di una nota non aperta si salva subito.
    if (!info) void salvaTitoloInSospeso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info]);

  /** Dopo una modifica in Info: Info, la nota aperta e l'elenco si aggiornano. */
  const aggiornaDettagli = async (nota: Nota) => {
    setInfo((i) => (i && i.nota.id === nota.id ? { ...i, nota } : i));
    setAperta((a) =>
      a && a.id === nota.id
        ? {
            ...a,
            modificata: nota.modificata,
            creataScelta: nota.creataScelta,
            fineValidita: nota.fineValidita,
            tag: nota.tag,
          }
        : a,
    );
    const tag = await esegui(api.elencaTag);
    if (tag) setTuttiTag(tag);
    await ricarica().catch(() => setBloccata(true));
  };

  const cambiaDettagli = async (chiamata: () => Promise<Nota>) => {
    const nota = await esegui(chiamata);
    if (nota) await aggiornaDettagli(nota);
  };

  /** Elimina un tag da tutte le note (RB-19): si rileggono la nota di Info e quella aperta. */
  const eliminaTag = async (id: string, nome: string) => {
    await esegui(() => api.eliminaTag(nome));
    const nota = await esegui(() => api.leggi(id));
    if (nota) await aggiornaDettagli(nota);
    const aperta = apertaAttuale.current;
    if (aperta && aperta.id !== id) {
      const riletta = await api.leggi(aperta.id).catch(() => null);
      if (riletta) setAperta((a) => (a && a.id === riletta.id ? { ...a, tag: riletta.tag } : a));
    }
  };

  /**
   * «Chiudi nota» (DEC-68): la nota si salva e l'area mostra «Nessuna nota aperta»; se non si
   * salva, resta aperta. Una nota vuota sparisce, come passando a un'altra (DEC-39).
   */
  const chiudiNota = async () => {
    await coda.scarica();
    if (coda.haModifiche) return;
    const cancellata = await lasciaVuota();
    setNuovaId(null);
    setAperta(null);
    setInfo((i) => (i?.tipo === "comparsa" ? null : i));
    if (cancellata) await ricarica().catch(() => setBloccata(true));
  };

  /** Tasto destro su una nota della colonna, senza aprirla: Info, Sposta in, Elimina (DEC-96). */
  const vociRiga = (riga: { id: string; cartella: Percorso; x: number; y: number }): VoceMenu[] => [
    {
      tipo: "voce",
      etichetta: "Info",
      icona: Info,
      azione: () => void apriInfo(riga.id, "finestra"),
    },
    {
      tipo: "voce",
      etichetta: "Sposta in…",
      icona: FolderInput,
      azione: () =>
        setSpostaIn({
          id: riga.id,
          cartella: riga.cartella,
          destra: riga.x + 236,
          y: riga.y,
          daRiga: true,
        }),
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

  // «Nessuna nota, per ora.» solo al primo utilizzo: nessuna nota e nessuna cartella (SC-01).
  const ciSonoNote =
    albero !== null && (piuRecente(albero) !== undefined || albero.cartelle.length > 0);

  return (
    <>
      {albero !== null && (
        <div
          className={`finestra ${bloccata ? "finestra-nascosta" : ""} ${SU_MAC ? "sistema-mac" : ""}`}
          inert={bloccata}
          onMouseMove={(e) => {
            const vicino = e.clientX <= (SU_MAC ? DISTANZA_BORDO_MAC_PX : DISTANZA_BORDO_PX);
            if (vicino !== vicinoAlBordo) setVicinoAlBordo(vicino);
            const destra = e.currentTarget.getBoundingClientRect().right - e.clientX;
            const inAlto =
              e.clientY <= (SU_MAC ? DISTANZA_BORDO_PX + 16 : DISTANZA_BORDO_PX) &&
              destra <= ZONA_TASTI_DESTRA_PX;
            if (inAlto !== vicinoInAlto) setVicinoInAlto(inAlto);
          }}
          onMouseLeave={() => {
            setVicinoAlBordo(false);
            setVicinoInAlto(false);
          }}
        >
          <Colonna
            stato={statoColonna}
            larghezza={larghezzaColonna}
            testata={
              <>
                {statoColonna === "aperta" && (
                  <PulsanteIcona
                    ref={pulsanteChiudiColonna}
                    nome="Chiudi la colonna"
                    icona={<Icona di={PanelLeftClose} />}
                    onClick={chiudiColonna}
                  />
                )}
                <PulsanteIcona
                  nome={colonnaFissata ? "Sblocca la colonna" : "Fissa la colonna"}
                  aria-pressed={colonnaFissata}
                  aria-keyshortcuts={SU_MAC ? "Meta+\\" : "Control+\\"}
                  icona={<Icona di={Pin} piena={colonnaFissata} />}
                  onClick={fissaColonna}
                />
              </>
            }
            ricerca={
              <Ricerca
                focus={focusRicerca}
                avanzata={avanzataRicerca}
                onTornaAllaCard={vaiAllaRicerca}
                onApri={(r) => void apriRisultato(r)}
                onChiusa={chiusaRicerca}
                onErrore={erroreRicerca}
              />
            }
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
            impostazioniAperte={vista === "impostazioni"}
            onApriImpostazioni={() => void apriImpostazioni()}
          />
          {statoColonna !== "chiusa" && (
            <div
              className="colonna-maniglia"
              role="separator"
              aria-orientation="vertical"
              aria-label="Larghezza della colonna"
              aria-valuenow={larghezzaColonna}
              aria-valuemin={LARGHEZZA_COLONNA_MINIMA}
              tabIndex={0}
              style={{ left: larghezzaColonna }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.currentTarget.setPointerCapture(e.pointerId);
                e.currentTarget.classList.add("colonna-maniglia-attiva");
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) cambiaLarghezza(e.clientX);
              }}
              onPointerUp={(e) => {
                e.currentTarget.releasePointerCapture(e.pointerId);
                e.currentTarget.classList.remove("colonna-maniglia-attiva");
              }}
              onDoubleClick={() => cambiaLarghezza(LARGHEZZA_COLONNA)}
              onKeyDown={(e) => {
                const passo = { ArrowLeft: -PASSO_TASTIERA_PX, ArrowRight: PASSO_TASTIERA_PX }[
                  e.key as "ArrowLeft" | "ArrowRight"
                ];
                if (passo === undefined) return;
                e.preventDefault();
                cambiaLarghezza(larghezzaColonna + passo);
              }}
            />
          )}
          <main
            className="area-nota"
            // Clic sul foglio: la colonna aperta e non fissata si chiude (DEC-56).
            onMouseDown={() => {
              if (statoColonna === "aperta") setColonnaAperta(false);
            }}
          >
            <div
              className={`barra-finestra ${PULSANTI_FINESTRA ? "barra-con-pulsanti" : ""}`}
              data-tauri-drag-region
            >
              {statoColonna === "chiusa" && (
                <PulsanteIcona
                  ref={pulsanteApriColonna}
                  className={`barra-apri-colonna ${vicinoAlBordo ? "barra-apri-visibile" : ""}`}
                  nome="Apri la colonna"
                  icona={<Icona di={PanelLeftOpen} />}
                  onClick={apriColonna}
                />
              )}
              <div className={`barra-destra ${vicinoInAlto ? "barra-destra-visibile" : ""}`}>
                {PULSANTI_FINESTRA && <PulsantiFinestra />}
              </div>
            </div>
            {sparita ? (
              <Avviso
                tipo="avviso"
                testo={sparita.elemento ? "La nota è nel cestino." : "La nota è stata eliminata."}
                azione={
                  sparita.elemento
                    ? { etichetta: "Ripristina", onClick: () => void ripristinaSparita() }
                    : undefined
                }
                onChiudi={() => setSparita(null)}
              />
            ) : (
              (avviso && <Avviso testo={TESTO_ERRORE} onChiudi={() => setAvviso(false)} />) ||
              (avvisoSinc && (
                <Avviso
                  tipo={avvisoSinc.tipo === "conflitto" ? "avviso" : "errore"}
                  testo={
                    avvisoSinc.tipo === "conflitto"
                      ? TESTO_CONFLITTO
                      : avvisoSinc.tipo === "irraggiungibile"
                        ? TESTO_IRRAGGIUNGIBILE
                        : avvisoSinc.protocollo
                          ? TESTO_PROTOCOLLO
                          : TESTO_ERRORE_SINC
                  }
                  azione={
                    avvisoSinc.tipo === "conflitto"
                      ? {
                          etichetta: "Apri l'altra",
                          onClick: () => {
                            setAvvisoSinc(null);
                            void apri(avvisoSinc.copia);
                          },
                        }
                      : undefined
                  }
                  onChiudi={() => setAvvisoSinc(null)}
                />
              ))
            )}
            {vista === "impostazioni" ? (
              <Impostazioni esegui={esegui} />
            ) : vista === "cestino" ? (
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
                key={`${aperta.id}:${riletta}`}
                nota={aperta}
                nuova={aperta.id === nuovaId}
                infoAperta={info?.tipo === "comparsa" && info.nota.id === aperta.id}
                onModifica={(dati) => coda.modifica(aperta.id, dati)}
                onApriInfo={(ancora) =>
                  info ? chiudiInfo() : void apriInfo(aperta.id, "comparsa", ancora)
                }
                onApriCartella={(percorso) => {
                  // La cartella del percorso si apre nella colonna, che compare se è chiusa.
                  apriCartelle(catena(percorso));
                  if (statoColonna === "chiusa") apriColonna();
                }}
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
          sopraOverlay={spostaIn.daInfo}
          onScegli={(percorso) => {
            const { id, daRiga, daInfo } = spostaIn;
            setSpostaIn(null);
            void spostaNota(id, percorso).then(() => ridaiFocus(id, daRiga, daInfo));
          }}
          onChiudi={() => {
            setSpostaIn(null);
            ridaiFocus(spostaIn.id, spostaIn.daRiga, spostaIn.daInfo);
          }}
        />
      )}
      {info && (
        <FinestraInfo
          key={`${info.nota.id}:${info.tipo}`}
          tipo={info.tipo}
          nota={info.nota}
          titolo={info.nota.titolo || anteprima(info.nota.contenuto) || "Nota vuota"}
          tutti={tuttiTag}
          ancora={info.ancora}
          onTitolo={(titolo) => cambiaTitolo(info.nota.id, titolo)}
          onDettagli={(dati: DatiDettagli) =>
            void cambiaDettagli(() => api.salvaDettagli(info.nota.id, dati))
          }
          onAggiungiTag={(nome) => void cambiaDettagli(() => api.aggiungiTag(info.nota.id, nome))}
          onTogliTag={(nome) => void cambiaDettagli(() => api.togliTag(info.nota.id, nome))}
          onEliminaTag={(nome) => void eliminaTag(info.nota.id, nome)}
          onSpostaIn={(pulsante) =>
            // Info resta aperta sotto il pannello (CMP-24).
            setSpostaIn({
              id: info.nota.id,
              cartella: info.nota.cartella,
              destra: pulsante.right,
              y: pulsante.bottom + 4,
              daInfo: true,
            })
          }
          spostaInAperto={spostaIn?.daInfo}
          onChiudiNota={info.tipo === "comparsa" ? () => void chiudiNota() : undefined}
          onElimina={() => {
            const id = info.nota.id;
            setInfo(null);
            void cestinaNota(id);
          }}
          onChiudi={chiudiInfo}
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
      {bloccata && (
        <Blocco
          inCorso={riprovando}
          onRiprova={riprova}
          testo={credenzialiRifiutate ? TESTO_CREDENZIALI : undefined}
        />
      )}
      {confermaChiusura && (
        <FinestraConferma
          titolo="La nota non è salvata"
          testo="Chiudendo, il testo va perso."
          azione="Chiudi comunque"
          onAnnulla={() => {
            setConfermaChiusura(false);
            if (uscendo.current) void annullaUscita();
            uscendo.current = false;
          }}
          onConferma={() => void (uscendo.current ? confermaUscita() : chiudiFinestra())}
        />
      )}
    </>
  );
}
