// Prima schermata (ID-54, DEC-154, DEC-160): la colonna a riquadri al posto della colonna del
// computer, con i componenti del design system alla scala del telefono (DEC-157). In cima, a
// destra, il tondo di Impostazioni, che serve di rado; poi Cloud in un riquadro (CMP-14) con il
// Cestino come ultima riga, e sotto il riquadro di Brainet con Journal, Entità e Calendario. In
// fondo, alla portata del pollice, la ricerca e la penna di Nuova nota. Nella radice di Cloud
// prima le note per ultima modifica, poi le cartelle; dentro una cartella prima le note, poi le
// sottocartelle, in ordine alfabetico (RB-60, RB-64, RB-65). Le cartelle si aprono a tendina.
import { router, Stack } from "expo-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Brain,
  Calendar,
  FileText,
  Folder,
  FolderInput,
  Info,
  Pencil,
  Settings,
  Trash2,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ALTEZZA_BARRA, BarraInFondo } from "@/componenti/BarraInFondo";
import { Riquadro } from "@/componenti/Riquadro";
import { Conferma } from "@/componenti/Foglio";
import { InfoNota } from "@/componenti/InfoNota";
import { MenuRiga, type VoceMenu } from "@/componenti/MenuRiga";
import {
  CampoNomeCartella,
  RigaCartella,
  RigaNota,
  RigaVoce,
  type Rettangolo,
} from "@/componenti/Righe";
import { SpostaIn } from "@/componenti/SpostaIn";
import { Tendina } from "@/componenti/Tendina";
import { useNegozio } from "@/dati/negozio";
import type { Cartella, Nota } from "@/nucleo/archivio";
import { misura, raggio, spazio, testo, useColori } from "@/tema";

const alfabetico = (a: string, b: string) => a.localeCompare(b, "it", { sensitivity: "base" });
const titoloDi = (n: Nota) =>
  n.titolo.trim() || n.contenuto.trim().split(/\s+/).slice(0, 6).join(" ");

export default function Note() {
  const { archivio, versione, modificato } = useNegozio();
  const c = useColori();
  const margini = useSafeAreaInsets();
  const [dati, setDati] = useState<{ note: Nota[]; cartelle: Cartella[] }>({
    note: [],
    cartelle: [],
  });
  const [cerca, setCerca] = useState("");
  const [cloudAperta, setCloudAperta] = useState(true);
  const [brainetAperta, setBrainetAperta] = useState(true);
  const [aperte, setAperte] = useState<Set<string>>(new Set());
  const [brainet, setBrainet] = useState(false);
  const [cestino, setCestino] = useState(0);
  /** La riga tenuta premuta, con il suo menu (CMP-53). */
  const [menu, setMenu] = useState<{
    ancora: Rettangolo;
    tipo: "nota" | "cartella" | "cloud";
    id: string | null;
    nome: string;
  } | null>(null);
  const [sposta, setSposta] = useState<Nota | null>(null);
  const [info, setInfo] = useState<{ nota: Nota; cartella: string } | null>(null);
  /** Il campo nome nell'albero: cartella nuova dentro `madre` o rinomina (RB-48). */
  const [campo, setCampo] = useState<
    | { tipo: "nuova"; madre: string | null; nome: string }
    | { tipo: "rinomina"; id: string; nome: string }
    | null
  >(null);
  /** Un nome già usato (RB-31): le tre scelte del computer. */
  const [conflitto, setConflitto] = useState<{
    nome: string;
    dove: string | null;
    risolvi: (scelta: "numero" | "unisci") => Promise<unknown>;
  } | null>(null);

  // Rilegge a ogni cambio della copia di lavoro: modifiche qui e note arrivate dagli altri dispositivi.
  useEffect(() => {
    if (!archivio) return;
    let vivo = true;
    void (async () => {
      const [note, tutte] = await Promise.all([archivio.note(), archivio.cartelle()]);
      // Le cartelle nel cestino non si vedono, e nemmeno quello che contengono.
      const viste = tutte.filter((x) => !x.eliminata_il);
      const ids = new Set(viste.map((x) => x.id));
      const visibile = (id: string | null): boolean => {
        for (let passi = 0; id && passi < 100; passi++) {
          if (!ids.has(id)) return false;
          id = viste.find((x) => x.id === id)?.madre ?? null;
        }
        return true;
      };
      const cartelle = viste.filter((x) => visibile(x.id));
      const [acceso, nelCestino] = await Promise.all([
        archivio.brainetAcceso(),
        archivio.quantiNelCestino(),
      ]);
      if (!vivo) return;
      setDati({ note: note.filter((n) => visibile(n.cartella)), cartelle });
      setBrainet(acceso);
      setCestino(nelCestino);
    })();
    return () => {
      vivo = false;
    };
  }, [archivio, versione]);

  // Il numero di una cartella conta anche le sottocartelle (RB-56).
  const conta = useMemo(() => {
    const di = (id: string): number =>
      dati.note.filter((n) => n.cartella === id).length +
      dati.cartelle.filter((x) => x.madre === id).reduce((tot, x) => tot + di(x.id), 0);
    return new Map(dati.cartelle.map((x) => [x.id, di(x.id)]));
  }, [dati]);

  const apri = (id: string) => router.push({ pathname: "/nota/[id]", params: { id } });
  const nuova = async (cartella: string | null = null) => {
    if (!archivio) return;
    apri(await archivio.creaNota(cartella));
  };
  const elimina = async (id: string) => {
    await archivio?.cestinaNota(id);
    modificato();
  };
  const nomeDi = (id: string | null) =>
    id ? (dati.cartelle.find((x) => x.id === id)?.nome ?? null) : null;

  const nuovaCartella = async (madre: string | null) => {
    if (!archivio) return;
    if (madre) setAperte((s) => new Set(s).add(madre));
    else setCloudAperta(true);
    setCampo({ tipo: "nuova", madre, nome: await archivio.nomeProposto(madre) });
  };
  const confermaCampo = async (nome: string) => {
    const attuale = campo;
    setCampo(null);
    if (!archivio || !attuale || !nome.trim()) return;
    if (attuale.tipo === "nuova") {
      const proposto = nome === attuale.nome;
      const esito = await archivio.creaCartella(attuale.madre, nome, proposto);
      if (esito)
        setConflitto({
          nome: esito.conflitto,
          dove: nomeDi(attuale.madre),
          risolvi: (scelta) => archivio.creaCartella(attuale.madre, nome, false, scelta),
        });
    } else {
      if (nome === attuale.nome) return;
      const esito = await archivio.rinominaCartella(attuale.id, nome);
      const madre = dati.cartelle.find((x) => x.id === attuale.id)?.madre ?? null;
      if (esito)
        setConflitto({
          nome: esito.conflitto,
          dove: nomeDi(madre),
          risolvi: (scelta) => archivio.rinominaCartella(attuale.id, nome, scelta),
        });
    }
    modificato();
  };
  const apriInfo = async (id: string) => {
    const n = await archivio?.nota(id);
    if (archivio && n) setInfo({ nota: n, cartella: await archivio.percorso(n.cartella) });
  };
  const spostaIn = async (cartella: string | null) => {
    const nota = sposta;
    setSposta(null);
    if (!archivio || !nota) return;
    await archivio.spostaNota(nota.id, cartella);
    if (cartella) setAperte((s) => new Set(s).add(cartella));
    modificato();
  };
  const tieniNota = (n: Nota) => (ancora: Rettangolo) =>
    setMenu({ ancora, tipo: "nota", id: n.id, nome: titoloDi(n) || "Nota vuota" });

  const vociMenu = (): VoceMenu[] => {
    if (!menu) return [];
    const id = menu.id;
    if (menu.tipo === "cloud")
      return [
        { etichetta: "Nuova nota", icona: FileText, onPress: () => void nuova(null) },
        { etichetta: "Nuova cartella", icona: Folder, onPress: () => void nuovaCartella(null) },
      ];
    if (menu.tipo === "cartella" && id)
      return [
        { etichetta: "Nuova nota qui", icona: FileText, onPress: () => void nuova(id) },
        { etichetta: "Nuova sottocartella", icona: Folder, onPress: () => void nuovaCartella(id) },
        {
          etichetta: "Rinomina",
          icona: Pencil,
          onPress: () => setCampo({ tipo: "rinomina", id, nome: menu.nome }),
        },
        "filo",
        {
          etichetta: "Elimina",
          icona: Trash2,
          errore: true,
          onPress: () => void archivio?.cestinaCartella(id).then(modificato),
        },
      ];
    const nota = dati.note.find((n) => n.id === id);
    if (!nota) return [];
    return [
      { etichetta: "Info", icona: Info, onPress: () => void apriInfo(nota.id) },
      { etichetta: "Sposta in…", icona: FolderInput, onPress: () => setSposta(nota) },
      "filo",
      { etichetta: "Elimina", icona: Trash2, errore: true, onPress: () => void elimina(nota.id) },
    ];
  };

  const apriChiudi = (id: string) =>
    setAperte((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const rigaNota = (n: Nota, livelloCartella?: number) => (
    <RigaNota
      key={n.id}
      titolo={titoloDi(n)}
      vuota={!titoloDi(n)}
      livelloCartella={livelloCartella}
      onPress={() => apri(n.id)}
      onSposta={() => setSposta(n)}
      onElimina={() => void elimina(n.id)}
      onTieni={tieniNota(n)}
    />
  );

  const albero = (padre: string | null, livello: number): ReactNode[] => {
    const note = dati.note
      .filter((n) => n.cartella === padre)
      .sort((a, b) =>
        padre === null
          ? b.modificata.localeCompare(a.modificata)
          : alfabetico(titoloDi(a), titoloDi(b)),
      );
    const cartelle = dati.cartelle
      .filter((x) => x.madre === padre)
      .sort((a, b) => alfabetico(a.nome, b.nome));
    const campoNuovo =
      campo?.tipo === "nuova" && campo.madre === padre ? (
        <CampoNomeCartella
          key="campo-nuovo"
          nome={campo.nome}
          livello={livello}
          onConferma={(nome) => void confermaCampo(nome)}
        />
      ) : null;
    return [
      ...note.map((n) => rigaNota(n, padre === null ? undefined : livello - 1)),
      ...(campoNuovo ? [campoNuovo] : []),
      ...cartelle.flatMap((x) => [
        campo?.tipo === "rinomina" && campo.id === x.id ? (
          <CampoNomeCartella
            key={x.id}
            nome={campo.nome}
            livello={livello}
            onConferma={(nome) => void confermaCampo(nome)}
          />
        ) : (
          <RigaCartella
            key={x.id}
            nome={x.nome}
            conteggio={conta.get(x.id) ?? 0}
            aperta={aperte.has(x.id)}
            livello={livello}
            onPress={() => apriChiudi(x.id)}
            onTieni={(ancora) => setMenu({ ancora, tipo: "cartella", id: x.id, nome: x.nome })}
          />
        ),
        <Tendina key={`${x.id}-dentro`} aperta={aperte.has(x.id)}>
          <View>{albero(x.id, livello + 1)}</View>
        </Tendina>,
      ]),
    ];
  };

  const q = cerca.trim().toLowerCase();
  const trovate = q
    ? dati.note.filter((n) => `${n.titolo} ${n.contenuto}`.toLowerCase().includes(q))
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: c.sfondoColonna }}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAwareScrollView
        bottomOffset={spazio.gruppo}
        contentContainerStyle={[
          stili.contenuto,
          {
            paddingTop: margini.top + spazio.elemento,
            paddingBottom: spazio.pannello + ALTEZZA_BARRA + spazio.gruppo,
          },
        ]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={stili.inCima}>
          <Pressable
            onPress={() => router.push("/impostazioni")}
            accessibilityRole="button"
            accessibilityLabel="Impostazioni"
            hitSlop={spazio.elemento}
            style={({ pressed }) => [
              stili.tondo,
              { backgroundColor: pressed ? c.sfondoPremuto : c.sfondoCampo },
            ]}
          >
            <Settings size={misura.icona} color={c.testoPrimario} strokeWidth={misura.tratto} />
          </Pressable>
        </View>
        {q ? (
          <View style={[stili.risultati, { backgroundColor: c.sfondoNota }]}>
            {trovate.length ? (
              trovate.map((n) => rigaNota(n))
            ) : (
              <Text
                allowFontScaling={false}
                style={[testo.messaggio, stili.vuoto, { color: c.testoTenue }]}
              >
                Nessuna nota trovata
              </Text>
            )}
          </View>
        ) : (
          <>
            <Riquadro
              titolo="Cloud"
              aperto={cloudAperta}
              onApriChiudi={() => setCloudAperta((a) => !a)}
              onTieni={(ancora) => setMenu({ ancora, tipo: "cloud", id: null, nome: "CLOUD" })}
            >
              {albero(null, 0)}
              <View
                key="divisore"
                style={[stili.divisore, { backgroundColor: c.bordoDivisoreTenue }]}
              />
              <RigaVoce
                key="cestino"
                nome="Cestino"
                icona={Trash2}
                conteggio={cestino}
                onPress={() => router.push("/cestino")}
              />
            </Riquadro>
            {brainet ? (
              <Riquadro
                titolo="Brainet"
                aperto={brainetAperta}
                onApriChiudi={() => setBrainetAperta((a) => !a)}
              >
                <RigaVoce key="journal" nome="Journal" icona={BookOpen} />
                <RigaVoce key="entita" nome="Entità" icona={Brain} />
                <RigaVoce key="calendario" nome="Calendario" icona={Calendar} />
              </Riquadro>
            ) : null}
          </>
        )}
      </KeyboardAwareScrollView>
      <MenuRiga
        ancora={menu?.ancora ?? null}
        riga={menu ? <RigaSollevata nome={menu.nome} tipo={menu.tipo} /> : null}
        voci={vociMenu()}
        onChiudi={() => setMenu(null)}
      />
      {sposta ? (
        <SpostaIn
          visibile
          cartelle={dati.cartelle}
          attuale={sposta.cartella}
          onScegli={(cartella) => void spostaIn(cartella)}
          onChiudi={() => setSposta(null)}
        />
      ) : null}
      {info ? (
        <InfoNota
          visibile
          nota={info.nota}
          cartella={info.cartella}
          onSposta={() => {
            setInfo(null);
            setSposta(info.nota);
          }}
          onElimina={() => {
            setInfo(null);
            void elimina(info.nota.id);
          }}
          onChiudi={() => setInfo(null)}
        />
      ) : null}
      {conflitto ? (
        <Conferma
          visibile
          titolo={
            conflitto.dove
              ? `Esiste già «${conflitto.nome}» in ${conflitto.dove}`
              : `Esiste già «${conflitto.nome}» tra le cartelle`
          }
          testo="Puoi aggiungere un numero al nome, unire le due cartelle o annullare."
          azione="Aggiungi un numero"
          altra={{
            etichetta: "Unisci",
            onPress: () => {
              const c = conflitto;
              setConflitto(null);
              void c.risolvi("unisci").then(modificato);
            },
          }}
          onConferma={() => {
            const c = conflitto;
            setConflitto(null);
            void c.risolvi("numero").then(modificato);
          }}
          onAnnulla={() => setConflitto(null)}
        />
      ) : null}
      {/* Mentre si scrive il nome di una cartella la barra non sale sopra la tastiera. */}
      {campo ? null : (
        <BarraInFondo cerca={cerca} onCerca={setCerca} onNuova={() => void nuova()} />
      )}
    </View>
  );
}

/** La riga tenuta premuta, sollevata sopra il velo: icona e nome come nella colonna. */
function RigaSollevata({ nome, tipo }: { nome: string; tipo: "nota" | "cartella" | "cloud" }) {
  const c = useColori();
  return (
    <View style={stili.sollevata}>
      {tipo === "cartella" ? (
        <Folder size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
      ) : null}
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={[
          tipo === "cloud" ? testo.titoloSezione : testo.controllo,
          { color: c.testoPrimario },
        ]}
      >
        {nome}
      </Text>
    </View>
  );
}

const stili = StyleSheet.create({
  sollevata: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    paddingHorizontal: spazio.controllo,
  },
  // Colonna (CMP-14): spazio-pannello ai lati, spazio-blocco tra Impostazioni e i riquadri.
  contenuto: {
    paddingHorizontal: spazio.pannello,
    paddingBottom: spazio.pannello,
    gap: spazio.blocco,
  },
  inCima: { flexDirection: "row", justifyContent: "flex-end" },
  tondo: {
    width: misura.riga,
    height: misura.riga,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raggio.pillola,
  },
  divisore: { height: 1, marginHorizontal: spazio.controllo, marginVertical: spazio.elemento },
  risultati: { borderRadius: raggio.contenitore, padding: spazio.elenco },
  vuoto: { padding: spazio.controllo },
});
