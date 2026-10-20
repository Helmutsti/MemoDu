// SC-12 Calendario di Brainet sul telefono (RF-18, CMP-43), dalla riga Calendario del riquadro
// Brainet: il mese con le frecce «Mese prima» e «Mese dopo», la settimana da lunedì, un pallino
// nei giorni in cui è nata almeno una nota in Brainet fuori dal Cestino (RB-113, RB-127), oggi su
// sfondo-campo. Si guarda soltanto, come sul computer.

import { Stack } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarraInCima } from "@/componenti/BarraInCima";
import { useDatiBrainet } from "@/dati/brainet";
import { giorniDelCalendario } from "@/nucleo/brainet";
import { misura, raggio, spazio, t, testo, useColori } from "@/tema";

const GIORNI = ["L", "M", "M", "G", "V", "S", "D"];
const due = (n: number) => String(n).padStart(2, "0");

export default function Calendario() {
  const c = useColori();
  const dati = useDatiBrainet();
  const oggi = new Date();
  const [mese, setMese] = useState(() => new Date(oggi.getFullYear(), oggi.getMonth(), 1));
  const chiave = `${mese.getFullYear()}-${due(mese.getMonth() + 1)}`;
  const conNote = dati ? giorniDelCalendario(chiave, dati.note) : new Set<string>();
  const primo = (mese.getDay() + 6) % 7;
  const giorniMese = new Date(mese.getFullYear(), mese.getMonth() + 1, 0).getDate();
  const celle: (number | null)[] = [
    ...Array.from({ length: primo }, () => null),
    ...Array.from({ length: giorniMese }, (_, i) => i + 1),
  ];
  while (celle.length % 7) celle.push(null);
  const settimane = Array.from({ length: celle.length / 7 }, (_, i) =>
    celle.slice(i * 7, i * 7 + 7),
  );
  const oggiChiave = `${oggi.getFullYear()}-${due(oggi.getMonth() + 1)}-${due(oggi.getDate())}`;
  const nome = mese.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  const tondo = (dir: -1 | 1) => {
    const Icona = dir < 0 ? ChevronLeft : ChevronRight;
    return (
      <Pressable
        onPress={() => setMese(new Date(mese.getFullYear(), mese.getMonth() + dir, 1))}
        accessibilityRole="button"
        accessibilityLabel={dir < 0 ? "Mese prima" : "Mese dopo"}
        style={({ pressed }) => [
          stili.freccia,
          { backgroundColor: pressed ? c.sfondoPremuto : c.sfondoCampo },
        ]}
      >
        <Icona size={misura.icona} color={c.testoPrimario} strokeWidth={misura.tratto} />
      </Pressable>
    );
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.sfondoColonna }}>
      <Stack.Screen options={{ headerShown: false }} />
      <BarraInCima sfondo={c.sfondoColonna} titolo="Calendario" />
      <ScrollView contentContainerStyle={stili.contenuto}>
        <View style={[stili.riquadro, { backgroundColor: c.sfondoNota }]}>
          <View style={stili.testata}>
            <Text
              allowFontScaling={false}
              style={[testo.titolo, stili.flessibile, { color: c.testoPrimario }]}
            >
              {nome[0].toUpperCase() + nome.slice(1)}
            </Text>
            {tondo(-1)}
            {tondo(1)}
          </View>
          <View style={stili.settimana}>
            {GIORNI.map((g, i) => (
              <Text
                key={i}
                allowFontScaling={false}
                style={[testo.etichetta, stili.cella, { color: c.testoTenue }]}
              >
                {g}
              </Text>
            ))}
          </View>
          {settimane.map((s, i) => (
            <View key={i} style={stili.settimana} accessibilityLabel={`Note di ${nome}`}>
              {s.map((g, j) => {
                const giorno = g ? `${chiave}-${due(g)}` : "";
                const segnato = g !== null && conNote.has(giorno);
                const passato = g !== null && giorno <= oggiChiave;
                return (
                  <View
                    key={j}
                    style={[
                      stili.cella,
                      giorno === oggiChiave && { backgroundColor: c.sfondoCampo },
                    ]}
                    accessibilityLabel={g ? `${g}${segnato ? ", con note" : ""}` : undefined}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[testo.controllo, { color: passato ? c.testoPrimario : c.testoTenue }]}
                    >
                      {g ?? ""}
                    </Text>
                    <View
                      style={[
                        stili.pallino,
                        { backgroundColor: segnato ? c.iconaInformazione : "transparent" },
                      ]}
                    />
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const stili = StyleSheet.create({
  contenuto: { padding: spazio.pannello },
  riquadro: { borderRadius: raggio.contenitore, padding: spazio.controllo, gap: spazio.elemento },
  testata: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    paddingBottom: spazio.icona,
  },
  flessibile: { flex: 1, paddingLeft: spazio.elemento },
  freccia: {
    width: t(32),
    height: t(32),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raggio.pillola,
  },
  settimana: { flexDirection: "row" },
  cella: {
    flex: 1,
    height: misura.riga,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    borderRadius: raggio.pillola,
    gap: 2,
  },
  pallino: { width: 5, height: 5, borderRadius: 3 },
});
