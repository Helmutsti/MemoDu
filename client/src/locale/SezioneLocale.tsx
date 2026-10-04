// Sezione Locale della colonna (RF-17, CMP-14): sotto Cartelle, il titolo con il + che aggiunge
// una cartella del disco (FL-10); le cartelle dell'elenco con sottocartelle e file .md e .txt
// (RB-75), quelle che mancano «non trovata». Tasto destro: Nuovo file, Nuova cartella, Rinomina,
// Elimina, Togli da Locale (FL-12); trascinando si sposta sul disco. Eliminare manda nel Cestino
// del sistema; dove non c'è chiede se eliminare per sempre (RB-83).

import { FilePlus, FolderMinus, FolderPlus, Pencil, Trash2, type LucideIcon } from "lucide-react";
import {
  useState,
  type PointerEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { ErroreApi } from "../api";
import { avviaTrascinamento } from "../componenti/trascina";
import { FinestraConferma } from "../componenti/FinestraConferma";
import { Menu, type VoceMenu } from "../componenti/Menu";
import { CampoNomeCartella, RigaCartella, RigaFile, RigaSezione } from "../componenti/RigaColonna";
import { StatoVuotoColonna } from "../componenti/StatoVuoto";
import {
  apiLocale,
  cartellaDi,
  dentroDi,
  nomeDi,
  type CartellaLocale,
  type VoceLocale,
} from "./api";
import type { StatoLocale } from "./useLocale";

interface Proprieta {
  locale: StatoLocale;
  /** Il file aperto nell'area, se c'è. */
  fileAperto: string | null;
  onApriFile: (percorso: string) => void;
  /** Un file aperto è stato rinominato, spostato o eliminato da qui. */
  onFileSpostato: (da: string, a: string | null) => void;
  /** Un'operazione sul disco non è riuscita: l'avviso con il motivo (SF-37). */
  onErrore: (messaggio: string) => void;
}

type Campo =
  | { tipo: "nuova"; dentro: string }
  | { tipo: "rinomina"; percorso: string; nome: string; file: boolean };

interface Elemento {
  percorso: string;
  tipo: "cartella" | "file" | "radice" | "assente";
}

export function SezioneLocale({
  locale,
  fileAperto,
  onApriFile,
  onFileSpostato,
  onErrore,
}: Proprieta): ReactElement {
  const [aperta, setAperta] = useState(true);
  const [campo, setCampo] = useState<Campo | null>(null);
  const [menu, setMenu] = useState<{ elemento: Elemento; x: number; y: number } | null>(null);
  const [perSempre, setPerSempre] = useState<string | null>(null);
  const [sopra, setSopra] = useState<string | null>(null);

  const messaggio = (e: unknown) =>
    e instanceof ErroreApi ? e.message : "Non è stato possibile completare l'operazione.";

  const dopo = async (cartelle: string[]) => {
    for (const c of cartelle) await locale.ricaricaCartella(c);
  };

  const aggiungi = async () => {
    setAperta(true);
    try {
      const nuova = await apiLocale.aggiungi();
      await locale.ricaricaCartelle();
      if (nuova) locale.apriChiudi(nuova.percorso, true);
    } catch (e) {
      // Già in Locale: si apre quella che c'è (RB-74).
      if (e instanceof ErroreApi && e.motivo === "elenco" && e.conflitto) {
        locale.apriChiudi(e.conflitto, true);
      } else onErrore(messaggio(e));
    }
  };

  const nuovoFile = async (cartella: string) => {
    try {
      const { percorso } = await apiLocale.nuovo(cartella);
      locale.apriChiudi(cartella, true);
      await locale.ricaricaCartella(cartella);
      onApriFile(percorso);
    } catch (e) {
      onErrore(messaggio(e));
    }
  };

  const elimina = async (percorso: string, definitivo = false) => {
    try {
      await apiLocale.elimina(percorso, definitivo);
      setPerSempre(null);
      if (fileAperto && dentroDi(fileAperto, percorso)) onFileSpostato(fileAperto, null);
      await dopo([cartellaDi(percorso)]);
    } catch (e) {
      if (e instanceof ErroreApi && e.motivo === "cestino") setPerSempre(percorso);
      else onErrore(messaggio(e));
    }
  };

  const sposta = async (percorso: string, dentro: string) => {
    try {
      const { percorso: nuovo } = await apiLocale.sposta(percorso, dentro);
      if (fileAperto && dentroDi(fileAperto, percorso)) {
        onFileSpostato(fileAperto, nuovo + fileAperto.slice(percorso.length));
      }
      locale.apriChiudi(dentro, true);
      await dopo([cartellaDi(percorso), dentro]);
    } catch (e) {
      onErrore(messaggio(e));
    }
  };

  const confermaCampo = async (valore: string) => {
    const c = campo;
    setCampo(null);
    if (!c) return;
    const nome = valore.trim();
    try {
      if (c.tipo === "nuova") {
        if (!nome) return;
        await apiLocale.creaCartella(c.dentro, nome);
        await dopo([c.dentro]);
      } else if (nome && nome !== c.nome) {
        const { percorso: nuovo } = await apiLocale.rinomina(c.percorso, nome);
        if (fileAperto && dentroDi(fileAperto, c.percorso)) {
          onFileSpostato(fileAperto, nuovo + fileAperto.slice(c.percorso.length));
        }
        await dopo([cartellaDi(c.percorso)]);
      }
    } catch (e) {
      onErrore(messaggio(e));
    }
  };

  const voci = (e: Elemento): VoceMenu[] => {
    const v = (
      etichetta: string,
      icona: LucideIcon,
      azione: () => void,
      errore = false,
    ): VoceMenu => ({
      tipo: "voce",
      etichetta,
      icona,
      azione,
      errore,
    });
    if (e.tipo === "assente")
      return [v("Togli da Locale", FolderMinus, () => void togli(e.percorso))];
    if (e.tipo === "file") {
      return [
        v("Rinomina", Pencil, () =>
          setCampo({
            tipo: "rinomina",
            percorso: e.percorso,
            nome: nomeDi(e.percorso),
            file: true,
          }),
        ),
        { tipo: "separatore" },
        v("Elimina", Trash2, () => void elimina(e.percorso), true),
      ];
    }
    const comuni = [
      v("Nuovo file", FilePlus, () => void nuovoFile(e.percorso)),
      v("Nuova cartella", FolderPlus, () => {
        locale.apriChiudi(e.percorso, true);
        setCampo({ tipo: "nuova", dentro: e.percorso });
      }),
    ];
    if (e.tipo === "radice") {
      return [
        ...comuni,
        { tipo: "separatore" },
        v("Togli da Locale", FolderMinus, () => void togli(e.percorso)),
      ];
    }
    return [
      ...comuni,
      v("Rinomina", Pencil, () =>
        setCampo({ tipo: "rinomina", percorso: e.percorso, nome: nomeDi(e.percorso), file: false }),
      ),
      { tipo: "separatore" },
      v("Elimina", Trash2, () => void elimina(e.percorso), true),
    ];
  };

  const togli = async (percorso: string) => {
    try {
      await apiLocale.togli(percorso);
      if (fileAperto && dentroDi(fileAperto, percorso)) onFileSpostato(fileAperto, null);
      locale.apriChiudi(percorso, false);
      await locale.ricaricaCartelle();
    } catch (e) {
      onErrore(messaggio(e));
    }
  };

  // Trascinamento: file e cartelle (non quelli dell'elenco) su una cartella di Locale, con il
  // puntatore (DEC-120, `trascina.ts`). Le destinazioni sono «l:» e il percorso.
  const accetta = (da: string, dentro: string) =>
    !dentroDi(dentro, da) && cartellaDi(da) !== dentro;
  const sorgente = (percorso: string) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) =>
      avviaTrascinamento(e, {
        onInizio: () => setSopra(null),
        onSopra: (k) => {
          const dentro = k?.startsWith("l:") ? k.slice(2) : null;
          setSopra(dentro && accetta(percorso, dentro) ? dentro : null);
        },
        onRilascio: (k) => {
          const dentro = k?.startsWith("l:") ? k.slice(2) : null;
          setSopra(null);
          if (dentro && accetta(percorso, dentro)) void sposta(percorso, dentro);
        },
        onFine: () => setSopra(null),
      }),
  });
  const destinazione = (dentro: string) => ({ "data-destinazione": `l:${dentro}` });

  const campoNuova = (dentro: string, livello: number): ReactNode =>
    campo?.tipo === "nuova" && campo.dentro === dentro ? (
      <li role="none" key="campo-nuova">
        <CampoNomeCartella
          valore="Nuova cartella"
          livello={livello}
          onConferma={(valore) => void confermaCampo(valore)}
          onAnnulla={() => setCampo(null)}
        />
      </li>
    ) : null;

  const contenuto = (cartella: string, livello: number): ReactNode => {
    const voci = locale.contenuti[cartella] ?? [];
    const nuova = campoNuova(cartella, livello + 1);
    if (voci.length === 0 && !nuova) return null;
    return (
      <ul role="group" className="colonna-elenco">
        {nuova}
        {voci.map((v) =>
          v.tipo === "cartella" ? sottocartella(v, livello + 1) : file(v, livello),
        )}
      </ul>
    );
  };

  const rinominando = (percorso: string) =>
    campo?.tipo === "rinomina" && campo.percorso === percorso ? campo : null;

  const file = (v: VoceLocale, livelloCartella: number): ReactNode => {
    const r = rinominando(v.percorso);
    return r ? (
      <li role="none" key={v.percorso}>
        <CampoNomeCartella
          valore={r.nome}
          livello={livelloCartella + 1}
          file
          onConferma={(valore) => void confermaCampo(valore)}
          onAnnulla={() => setCampo(null)}
        />
      </li>
    ) : (
      <RigaFile
        key={v.percorso}
        nome={v.nome}
        percorso={v.percorso}
        selezionata={v.percorso === fileAperto}
        sospeso={v.sospeso}
        nuovo={v.nuovo}
        livelloCartella={livelloCartella}
        onApri={() => onApriFile(v.percorso)}
        onMenu={(e) =>
          setMenu({ elemento: { percorso: v.percorso, tipo: "file" }, x: e.clientX, y: e.clientY })
        }
        {...(v.nuovo ? {} : sorgente(v.percorso))}
      />
    );
  };

  const sottocartella = (v: VoceLocale, livello: number): ReactNode => {
    const r = rinominando(v.percorso);
    const apertaQui = locale.aperte.has(v.percorso);
    return (
      <li role="none" key={v.percorso}>
        {r ? (
          <CampoNomeCartella
            valore={r.nome}
            livello={livello}
            onConferma={(valore) => void confermaCampo(valore)}
            onAnnulla={() => setCampo(null)}
          />
        ) : (
          <RigaCartella
            nome={v.nome}
            percorso={v.percorso}
            aperta={apertaQui}
            livello={livello}
            sopra={sopra === v.percorso}
            onApriChiudi={() => locale.apriChiudi(v.percorso)}
            onMenu={(e) =>
              setMenu({
                elemento: { percorso: v.percorso, tipo: "cartella" },
                x: e.clientX,
                y: e.clientY,
              })
            }
            {...sorgente(v.percorso)}
            {...destinazione(v.percorso)}
          />
        )}
        {apertaQui && contenuto(v.percorso, livello)}
      </li>
    );
  };

  const radice = (c: CartellaLocale): ReactNode => {
    const presente = c.stato === "presente";
    // Un file trascinato da solo: una riga file nella radice, come le note di CLOUD (DEC-120).
    if (c.tipo === "file") {
      return (
        <RigaFile
          key={c.percorso}
          nome={c.nome}
          percorso={c.percorso}
          selezionata={c.percorso === fileAperto}
          sospeso={c.sospeso}
          nuovo={false}
          stato={presente ? undefined : c.stato}
          livelloCartella={-2}
          onApri={() => presente && onApriFile(c.percorso)}
          onMenu={(e) =>
            setMenu({
              elemento: { percorso: c.percorso, tipo: "assente" },
              x: e.clientX,
              y: e.clientY,
            })
          }
        />
      );
    }
    const apertaQui = presente && locale.aperte.has(c.percorso);
    return (
      <li role="none" key={c.percorso}>
        <RigaCartella
          nome={c.nome}
          percorso={c.percorso}
          stato={presente ? undefined : c.stato}
          aperta={apertaQui}
          livello={0}
          sopra={sopra === c.percorso}
          onApriChiudi={() => presente && locale.apriChiudi(c.percorso)}
          onMenu={(e) =>
            setMenu({
              elemento: { percorso: c.percorso, tipo: presente ? "radice" : "assente" },
              x: e.clientX,
              y: e.clientY,
            })
          }
          {...(presente ? destinazione(c.percorso) : {})}
        />
        {apertaQui && contenuto(c.percorso, 0)}
      </li>
    );
  };

  // Destra e sinistra aprono e chiudono le cartelle di Locale; F2 rinomina (CMP-06). Su e giù
  // li gestisce la colonna.
  const suTasto = (e: KeyboardEvent) => {
    const riga = document.activeElement as HTMLElement | null;
    const percorso = riga?.dataset.cartella ?? riga?.dataset.file;
    if (!percorso || !["ArrowRight", "ArrowLeft", "F2"].includes(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    const radiceQui = locale.cartelle.some((c) => c.percorso === percorso);
    if (e.key === "F2") {
      if (!radiceQui) {
        setCampo({
          tipo: "rinomina",
          percorso,
          nome: nomeDi(percorso),
          file: !!riga?.dataset.file,
        });
      }
      return;
    }
    if (riga?.dataset.cartella) locale.apriChiudi(percorso, e.key === "ArrowRight");
  };

  return (
    <div
      className={`colonna-sezione ${locale.esterno ? "colonna-sezione-rilascio" : ""}`}
      onKeyDown={suTasto}
    >
      <RigaSezione
        titolo="Locale"
        aperta={aperta}
        onApriChiudi={() => setAperta((a) => !a)}
        nomeAggiungi="Aggiungi cartella"
        onAggiungi={() => void aggiungi()}
      />
      {aperta &&
        (locale.cartelle.length === 0 ? (
          <StatoVuotoColonna testo="Nessuna cartella. Aggiungine una con +" />
        ) : (
          <ul role="group" className="colonna-elenco">
            {locale.cartelle.map(radice)}
          </ul>
        ))}
      {menu && (
        <Menu
          voci={voci(menu.elemento)}
          etichetta={nomeDi(menu.elemento.percorso)}
          x={menu.x}
          y={menu.y}
          onChiudi={() => setMenu(null)}
        />
      )}
      {perSempre && (
        <FinestraConferma
          titolo={`Eliminare per sempre «${nomeDi(perSempre)}»?`}
          testo="Questo disco non ha un Cestino: non si potrà recuperare."
          azione="Elimina per sempre"
          onAnnulla={() => setPerSempre(null)}
          onConferma={() => void elimina(perSempre, true)}
        />
      )}
    </div>
  );
}
