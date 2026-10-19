// Prima schermata (ID-54, DEC-154): la colonna a riquadri al posto della colonna del computer,
// con i componenti del design system alla scala del telefono (DEC-157). In cima «Memodu» e la
// ricerca (CMP-03), le tessere di Brainet (CMP-49) e Cloud in un riquadro (CMP-14), con il + per
// una nota nuova; in fondo Cestino e Impostazioni (CMP-30), come sul computer. Nella radice di
// Cloud prima le note per ultima modifica, poi le cartelle; dentro una cartella prima le note,
// poi le sottocartelle, in ordine alfabetico (RB-60, RB-64, RB-65). Brainet, Info, Sposta in…,
// Cestino e Impostazioni arrivano dopo.

import { router, Stack } from "expo-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LayoutAnimationConfig } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BarraTessere, FondoColonna } from "@/componenti/Colonna";
import { Ricerca } from "@/componenti/Ricerca";
import { Riquadro } from "@/componenti/Riquadro";
import { Comparsa } from "@/componenti/Comparsa";
import { RigaCartella, RigaNota } from "@/componenti/Righe";
import { useNegozio } from "@/dati/negozio";
import type { Cartella, Nota } from "@/nucleo/archivio";
import { raggio, spazio, testo, useColori } from "@/tema";

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
      ...note.map((n) => (
        <Comparsa key={n.id}>{rigaNota(n, padre === null ? undefined : livello - 1)}</Comparsa>
      )),
      ...cartelle.flatMap((x) => [
        <Comparsa key={x.id}>
          <RigaCartella
            nome={x.nome}
            conteggio={conta.get(x.id) ?? 0}
            aperta={aperte.has(x.id)}
            livello={livello}
            onPress={() => apriChiudi(x.id)}
          />
        </Comparsa>,
        ...(aperte.has(x.id) ? albero(x.id, livello + 1) : []),
      ]),
    ];
  };

  const q = cerca.trim().toLowerCase();
  const trovate = q
    ? dati.note.filter((n) => `${n.titolo} ${n.contenuto}`.toLowerCase().includes(q))
    : [];
  const quante = dati.note.length;

  return (
    <View style={{ flex: 1, backgroundColor: c.sfondoColonna }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={[stili.contenuto, { paddingTop: margini.top + spazio.pannello }]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <Ricerca valore={cerca} onCambia={setCerca} />
        {/* All'apertura dell'app le righe ci sono già: si animano solo aprendo e chiudendo. */}
        <LayoutAnimationConfig skipEntering>
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
              {brainet ? <BarraTessere /> : null}
              <Riquadro
                titolo="Cloud"
                aperto={cloudAperta}
                riassunto={quante === 0 ? undefined : quante === 1 ? "1 nota" : `${quante} note`}
                onApriChiudi={() => setCloudAperta((a) => !a)}
                onAggiungi={() => void nuova()}
                nomeAggiungi="Nuova nota"
              >
                {albero(null, 0)}
              </Riquadro>
            </>
          )}
        </LayoutAnimationConfig>
      </ScrollView>
      <FondoColonna
        cestino={cestino}
        onImpostazioni={() => router.push("/impostazioni")}
        marginiInBasso={margini.bottom}
      />
    </View>
  );
}

const stili = StyleSheet.create({
  // Colonna (CMP-14): spazio-pannello ai lati e in cima, spazio-blocco tra ricerca, tessere e riquadri.
  contenuto: {
    paddingHorizontal: spazio.pannello,
    paddingBottom: spazio.pannello,
    gap: spazio.blocco,
  },
  risultati: { borderRadius: raggio.contenitore, padding: spazio.elenco, gap: spazio.elemento },
  vuoto: { padding: spazio.controllo },
});
