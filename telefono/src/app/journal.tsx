// SC-10 Journal sul telefono (RF-18, DEC-147), dalla riga Journal del riquadro Brainet: le note
// in Brainet fuori dal Cestino, dalla più recente, con giorno e ora sopra e il testo con pillole
// e aree; un tocco apre la nota, che si scrive come le altre. Vuoto: i testi del computer.

import { router, Stack } from "expo-router";
import { BookOpen } from "lucide-react-native";
import { Fragment } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarraInCima } from "@/componenti/BarraInCima";
import { ParagrafoBrainet } from "@/componenti/Brainet";
import { quando } from "@/dati/date";
import { useDatiBrainet } from "@/dati/brainet";
import { journal, type NotaBrainet } from "@/nucleo/brainet";
import { misura, raggio, spazio, testo, useColori } from "@/tema";
import { scriviGiorno } from "@/dati/date";

/** «oggi alle 18:40», «il 09/10/2026 alle 17:02»; con un giorno scelto senza ora. */
function quandoNota(n: NotaBrainet, adesso = new Date()): string {
  if (!n.creata_scelta) return quando(n.creata, adesso);
  const due = (x: number) => String(x).padStart(2, "0");
  const oggi = `${adesso.getFullYear()}-${due(adesso.getMonth() + 1)}-${due(adesso.getDate())}`;
  return n.creata_scelta === oggi ? "oggi" : `il ${scriviGiorno(n.creata_scelta)}`;
}

export default function Journal() {
  const c = useColori();
  const dati = useDatiBrainet();
  const note = dati ? journal(dati.note) : [];
  return (
    <View style={{ flex: 1, backgroundColor: c.sfondoColonna }}>
      <Stack.Screen options={{ headerShown: false }} />
      <BarraInCima sfondo={c.sfondoColonna} titolo="Journal" />
      <ScrollView contentContainerStyle={stili.contenuto}>
        {dati && !note.length ? (
          <View style={stili.vuoto}>
            <BookOpen size={misura.icona + 4} color={c.iconaTenue} strokeWidth={misura.tratto} />
            <Text allowFontScaling={false} style={[testo.titolo, { color: c.testoPrimario }]}>
              Nessuna nota in Brainet
            </Text>
            <Text
              allowFontScaling={false}
              style={[testo.messaggio, stili.centro, { color: c.testoTenue }]}
            >
              Sposta una nota qui dal suo menu: tasto destro › «Sposta in Brainet».
            </Text>
          </View>
        ) : note.length ? (
          <View style={[stili.riquadro, { backgroundColor: c.sfondoNota }]}>
            {note.map((n, i) => (
              <Fragment key={n.id}>
                {i > 0 ? (
                  <View style={[stili.filo, { backgroundColor: c.bordoDivisoreTenue }]} />
                ) : null}
                <Pressable
                  onPress={() => router.push({ pathname: "/nota/[id]", params: { id: n.id } })}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    stili.nota,
                    pressed && { backgroundColor: c.sfondoHover },
                  ]}
                >
                  <Text allowFontScaling={false} style={[testo.dettaglio, { color: c.testoTenue }]}>
                    {quandoNota(n)}
                  </Text>
                  <ParagrafoBrainet
                    testo={n.contenuto}
                    entita={dati!.entita}
                    stati={dati!.stati}
                    righe={6}
                  />
                </Pressable>
              </Fragment>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const stili = StyleSheet.create({
  contenuto: { padding: spazio.pannello, gap: spazio.blocco },
  riquadro: { borderRadius: raggio.contenitore, padding: spazio.elenco },
  filo: { height: 1, marginHorizontal: spazio.controllo },
  nota: {
    gap: spazio.elemento,
    paddingHorizontal: spazio.controllo,
    paddingVertical: spazio.icona + 2,
    borderRadius: raggio.interno,
  },
  vuoto: { alignItems: "center", gap: spazio.icona, paddingTop: spazio.finestra * 2 },
  centro: { textAlign: "center" },
});
