// CMP-12 Date picker sul telefono, nel foglio dal basso (CMP-51), per le date di Info e per
// «Scegli le date…» nei filtri (scelte di Manuel Cucca del 21/10/2026): il mese con le frecce
// «Mese prima» e «Mese dopo», la settimana da lunedì, oggi su sfondo-hover, il giorno scelto su
// sfondo-pieno. Un tocco su un giorno lo sceglie e chiude il foglio; in fondo, sotto un filo, le
// voci del caso («Oggi», «Ripristina», «Nessuna fine validità»).

import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Foglio } from "@/componenti/Foglio";
import { misura, raggio, spazio, t, testo, useColori } from "@/tema";

const GIORNI = ["L", "M", "M", "G", "V", "S", "D"];
const due = (n: number) => String(n).padStart(2, "0");

/** Oggi come AAAA-MM-GG, nell'ora del telefono. */
export const giornoDiOggi = (d = new Date()) =>
  `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`;

const primoDelMese = (g: string | null) => {
  const d = g ? new Date(`${g}T12:00:00`) : new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

export interface VoceData {
  etichetta: string;
  /** A destra, in tenue: per esempio la data di sistema accanto a «Ripristina». */
  dopo?: string;
  onPress: () => void;
}

export function FoglioData({
  visibile,
  titolo,
  onChiudi,
  ...calendario
}: Parameters<typeof CalendarioMese>[0] & {
  visibile: boolean;
  titolo: string;
  onChiudi: () => void;
}) {
  return (
    <Foglio visibile={visibile} titolo={titolo} onChiudi={onChiudi}>
      {visibile ? <CalendarioMese {...calendario} /> : null}
    </Foglio>
  );
}

/** Il mese da scegliere, dentro un foglio: anche nel foglio di Info, al posto delle righe. */
export function CalendarioMese({
  scelto,
  voci,
  onScegli,
}: {
  /** Il giorno scelto, AAAA-MM-GG, o null. */
  scelto: string | null;
  voci: VoceData[];
  onScegli: (giorno: string) => void;
}) {
  const c = useColori();
  // Si apre sul mese del giorno scelto, o su quello di oggi.
  const [mese, setMese] = useState(() => primoDelMese(scelto));
  useEffect(() => setMese(primoDelMese(scelto)), [scelto]);
  const chiave = `${mese.getFullYear()}-${due(mese.getMonth() + 1)}`;
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
  const oggi = giornoDiOggi();
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
    <>
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
        <View key={i} style={stili.settimana}>
          {s.map((g, j) => {
            const giorno = g ? `${chiave}-${due(g)}` : "";
            const pieno = g !== null && giorno === scelto;
            return g === null ? (
              <View key={j} style={stili.cella} />
            ) : (
              <Pressable
                key={j}
                onPress={() => onScegli(giorno)}
                accessibilityRole="button"
                accessibilityLabel={`${g} ${nome}`}
                accessibilityState={{ selected: pieno }}
                style={stili.cella}
              >
                {({ pressed }) => (
                  <View
                    style={[
                      stili.tondo,
                      giorno === oggi && { backgroundColor: c.sfondoHover },
                      pressed && { backgroundColor: c.sfondoPremuto },
                      pieno && { backgroundColor: c.sfondoPieno },
                    ]}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[testo.controllo, { color: pieno ? c.testoSuPieno : c.testoPrimario }]}
                    >
                      {g}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
      {voci.length ? (
        <View style={[stili.filo, { backgroundColor: c.bordoDivisoreTenue }]} />
      ) : null}
      {voci.map((v) => (
        <Pressable
          key={v.etichetta}
          onPress={v.onPress}
          accessibilityRole="button"
          style={({ pressed }) => [stili.voce, pressed && { backgroundColor: c.sfondoHover }]}
        >
          <Text
            allowFontScaling={false}
            style={[testo.controllo, stili.flessibile, { color: c.testoPrimario }]}
          >
            {v.etichetta}
          </Text>
          {v.dopo ? (
            <Text allowFontScaling={false} style={[testo.controllo, { color: c.testoTenue }]}>
              {v.dopo}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </>
  );
}

const stili = StyleSheet.create({
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
  },
  tondo: {
    width: misura.riga,
    height: misura.riga,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raggio.pillola,
  },
  filo: { height: 1, marginVertical: spazio.elemento },
  voce: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    height: misura.riga,
    paddingHorizontal: spazio.controllo,
    borderRadius: raggio.pillola,
  },
});
