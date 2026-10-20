// Prima schermata (ID-54, DEC-154, DEC-160): la colonna a riquadri al posto della colonna del
// computer, con i componenti del design system alla scala del telefono (DEC-157). In cima, a
// destra, il tondo di Impostazioni, che serve di rado; poi Cloud in un riquadro (CMP-14) con il
// Cestino come ultima riga, e sotto il riquadro di Brainet con Journal, Entità e Calendario. In
// fondo, alla portata del pollice, la ricerca e la penna di Nuova nota. Nella radice di Cloud
// prima le note per ultima modifica, poi le cartelle; dentro una cartella prima le note, poi le
// sottocartelle, in ordine alfabetico (RB-60, RB-64, RB-65). Le cartelle si aprono a tendina.
import { router, Stack } from "expo-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BookOpen, Brain, Calendar, Settings, Trash2 } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ALTEZZA_BARRA, BarraInFondo } from "@/componenti/BarraInFondo";
import { Riquadro } from "@/componenti/Riquadro";
import { RigaCartella, RigaNota, RigaVoce } from "@/componenti/Righe";
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
      onElimina={() => void elimina(n.id)}
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
    return [
      ...note.map((n) => rigaNota(n, padre === null ? undefined : livello - 1)),
      ...cartelle.flatMap((x) => [
        <RigaCartella
          key={x.id}
          nome={x.nome}
          conteggio={conta.get(x.id) ?? 0}
          aperta={aperte.has(x.id)}
          livello={livello}
          onPress={() => apriChiudi(x.id)}
        />,
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
      <ScrollView
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
      </ScrollView>
      <BarraInFondo cerca={cerca} onCerca={setCerca} onNuova={() => void nuova()} />
    </View>
  );
}

const stili = StyleSheet.create({
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
