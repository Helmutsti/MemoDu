// SC-13 Pagina dell'entità sul telefono (RF-18, RB-124, FL-26): nome e tipo, «Nominata 3 volte ·
// l'ultima il 16/10/2026», la cronologia dei mesi (CMP-47: un pallino più grande se il mese ha
// più paragrafi; si scorre di lato e un tocco porta al giorno più recente del mese) e i
// passaggi per giorno (titolo della nota e ora, sotto il paragrafo con pillole e aree). Un
// tocco su un passaggio apre la nota con il cursore su quel paragrafo. Il tipo si vede, ma si
// cambia con il passo 2.

import { router, Stack, useLocalSearchParams } from "expo-router";
import { Brain } from "lucide-react-native";
import { Fragment, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
} from "react-native";
import { BarraInCima } from "@/componenti/BarraInCima";
import { data, ParagrafoBrainet, titoloGiorno, TITOLO_TIPO_SINGOLARE } from "@/componenti/Brainet";
import { anteprima } from "../../../../condiviso/src/anteprima";
import { useDatiBrainet } from "@/dati/brainet";
import { paginaEntita, type NotaBrainet } from "@/nucleo/brainet";
import { misura, raggio, spazio, t, testo, useColori } from "@/tema";

/** Un mese della cronologia: «2026-10», il nome breve e quanti paragrafi (RB-133). */
interface Mese {
  mese: string;
  etichetta: string;
  paragrafi: number;
  /** Il giorno più recente del mese nell'elenco, dove porta il tocco. */
  giorno: string | null;
}

/** I mesi dal primo all'ultimo con paragrafi, dal più vecchio; i mesi vuoti in mezzo restano. */
function mesiCronologia(giorni: { giorno: string; passaggi: unknown[] }[]): Mese[] {
  if (!giorni.length) return [];
  const conti = new Map<string, number>();
  const primo = new Map<string, string>();
  for (const g of giorni) {
    const m = g.giorno.slice(0, 7);
    conti.set(m, (conti.get(m) ?? 0) + g.passaggi.length);
    if (!primo.has(m) || g.giorno > primo.get(m)!) primo.set(m, g.giorno);
  }
  const ordinati = [...conti.keys()].sort();
  const [a1, m1] = ordinati[ordinati.length - 1].split("-").map(Number);
  const mesi: Mese[] = [];
  let [a, m] = ordinati[0].split("-").map(Number);
  while (a < a1 || (a === a1 && m <= m1)) {
    const chiave = `${a}-${String(m).padStart(2, "0")}`;
    const breve = new Date(a, m - 1, 1)
      .toLocaleDateString("it-IT", { month: "short" })
      .replace(".", "");
    mesi.push({
      mese: chiave,
      etichetta: `${breve} ${String(a).slice(2)}`,
      paragrafi: conti.get(chiave) ?? 0,
      giorno: primo.get(chiave) ?? null,
    });
    if (m === 12) {
      a += 1;
      m = 1;
    } else m += 1;
  }
  return mesi;
}

/** Tre misure del pallino: 1 paragrafo, da 2 a 4, 5 o più (CMP-47); un punto se il mese è vuoto. */
const misuraPallino = (n: number) => (n >= 5 ? 14 : n >= 2 ? 10 : n === 1 ? 6 : 4);

const titoloNota = (n: NotaBrainet) => n.titolo.trim() || anteprima(n.contenuto);

export default function PaginaEntita() {
  const c = useColori();
  const { id } = useLocalSearchParams<{ id: string }>();
  const dati = useDatiBrainet();
  const pagina = dati ? paginaEntita(id, dati.note, dati.entita, titoloNota) : null;
  const scorrimento = useRef<ScrollViewInstance>(null);
  const posizioni = useRef(new Map<string, number>());
  if (!dati || !pagina)
    return (
      <View style={{ flex: 1, backgroundColor: c.sfondoColonna }}>
        <Stack.Screen options={{ headerShown: false }} />
        <BarraInCima sfondo={c.sfondoColonna} />
      </View>
    );
  const e = pagina.entita;
  const dettagli = pagina.nominata
    ? `${pagina.nominata === 1 ? "Nominata 1 volta" : `Nominata ${pagina.nominata} volte`}${
        pagina.ultimaVolta
          ? ` · l'ultima il ${data(pagina.ultimaVolta).toLocaleDateString("it-IT")}`
          : ""
      }`
    : "Mai nominata";
  const mesi = mesiCronologia(pagina.giorni);
  return (
    <View style={{ flex: 1, backgroundColor: c.sfondoColonna }}>
      <Stack.Screen options={{ headerShown: false }} />
      <BarraInCima sfondo={c.sfondoColonna} />
      <ScrollView ref={scorrimento} contentContainerStyle={stili.contenuto}>
        <View style={stili.testata}>
          <View style={stili.nome}>
            <Text
              allowFontScaling={false}
              accessibilityRole="header"
              style={[testo.notaTitolo, stili.flessibile, { color: c.testoPrimario }]}
            >
              {e.nome}
            </Text>
            <View style={[stili.tipo, { backgroundColor: c.sfondoCampo }]}>
              <Text allowFontScaling={false} style={[testo.etichetta, { color: c.testoPrimario }]}>
                {TITOLO_TIPO_SINGOLARE[e.tipo ?? "nessuno"]}
              </Text>
            </View>
          </View>
          <Text allowFontScaling={false} style={[testo.dettaglio, { color: c.testoTenue }]}>
            {dettagli}
          </Text>
        </View>
        {mesi.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={stili.cronologia} accessibilityLabel="Cronologia">
              {mesi.map((m) => {
                const d = misuraPallino(m.paragrafi);
                return (
                  <Pressable
                    key={m.mese}
                    disabled={!m.giorno}
                    onPress={() => {
                      const y = m.giorno ? posizioni.current.get(m.giorno) : undefined;
                      if (y !== undefined) scorrimento.current?.scrollTo({ y, animated: true });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${m.etichetta}, ${m.paragrafi} paragrafi`}
                    style={({ pressed }) => [
                      stili.mese,
                      pressed && { backgroundColor: c.sfondoHover },
                    ]}
                  >
                    <View style={stili.pallinoPosto}>
                      <View
                        style={{
                          width: d,
                          height: d,
                          borderRadius: d / 2,
                          backgroundColor: m.paragrafi ? c.iconaInformazione : c.bordoDivisoreTenue,
                        }}
                      />
                    </View>
                    <Text
                      allowFontScaling={false}
                      style={[testo.dettaglio, { color: c.testoTenue }]}
                    >
                      {m.etichetta}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : null}
        {pagina.giorni.length ? (
          pagina.giorni.map((g) => (
            <View
              key={g.giorno}
              style={stili.giorno}
              onLayout={(ev) => posizioni.current.set(g.giorno, ev.nativeEvent.layout.y)}
            >
              <Text
                allowFontScaling={false}
                accessibilityRole="header"
                style={[testo.titoloSezione, stili.titolo, { color: c.testoTenue }]}
              >
                {titoloGiorno(g.giorno)}
              </Text>
              <View style={[stili.riquadro, { backgroundColor: c.sfondoNota }]}>
                {g.passaggi.map((p, i) => (
                  <Fragment key={`${p.nota}-${p.inizio}`}>
                    {i > 0 ? (
                      <View style={[stili.filo, { backgroundColor: c.bordoDivisoreTenue }]} />
                    ) : null}
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/nota/[id]",
                          params: { id: p.nota, cursore: String(p.inizio) },
                        })
                      }
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        stili.passaggio,
                        pressed && { backgroundColor: c.sfondoHover },
                      ]}
                    >
                      <Text
                        allowFontScaling={false}
                        numberOfLines={1}
                        style={[testo.dettaglio, { color: c.testoTenue }]}
                      >
                        {p.ora ? `${p.titolo} · ${p.ora}` : p.titolo}
                      </Text>
                      <ParagrafoBrainet testo={p.testo} entita={dati.entita} stati={dati.stati} />
                    </Pressable>
                  </Fragment>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={stili.vuoto}>
            <Brain size={misura.icona + 4} color={c.iconaTenue} strokeWidth={misura.tratto} />
            <Text allowFontScaling={false} style={[testo.titolo, { color: c.testoPrimario }]}>
              {`Nessuna nota parla ancora di «${e.nome}».`}
            </Text>
            <Text allowFontScaling={false} style={[testo.messaggio, { color: c.testoTenue }]}>
              Scrivi @ in una nota per citarla.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const stili = StyleSheet.create({
  contenuto: { padding: spazio.pannello, gap: spazio.blocco },
  testata: { gap: spazio.elemento, paddingHorizontal: spazio.elenco },
  nome: { flexDirection: "row", alignItems: "center", gap: spazio.icona },
  flessibile: { flexShrink: 1 },
  tipo: {
    paddingHorizontal: spazio.controlloPiccolo,
    paddingVertical: spazio.elemento,
    borderRadius: raggio.pillola,
  },
  cronologia: { flexDirection: "row", gap: spazio.elemento, paddingHorizontal: spazio.elemento },
  mese: {
    width: t(48),
    alignItems: "center",
    gap: spazio.elemento,
    paddingVertical: spazio.elemento,
    borderRadius: raggio.interno,
  },
  pallinoPosto: { height: 16, alignItems: "center", justifyContent: "center" },
  giorno: { gap: spazio.elemento },
  titolo: { paddingHorizontal: spazio.elenco + spazio.controllo, paddingVertical: spazio.elemento },
  riquadro: { borderRadius: raggio.contenitore, padding: spazio.elenco },
  filo: { height: 1, marginHorizontal: spazio.controllo },
  passaggio: {
    gap: spazio.elemento,
    paddingHorizontal: spazio.controllo,
    paddingVertical: spazio.icona,
    borderRadius: raggio.interno,
  },
  vuoto: { alignItems: "center", gap: spazio.icona, paddingTop: spazio.finestra },
});
