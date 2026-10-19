// CMP-10 Bollicina del formato, aperta, come barra sopra la tastiera (ID-54), alla scala del
// telefono (DEC-157): il cassetto è una pillola flottante con spazio-elemento di margine e tra
// gli strumenti (tondi alti 32, icona 16), divisori sottili tra i gruppi: riga (Testo normale,
// Titolo, Sottotitolo, Elenco puntato, Elenco numerato, Casella) e carattere (Grassetto, Corsivo,
// Barrato, Sottolineato). Scorre di lato se non ci sta. Accanto, in una pillola a parte, «Fine»
// chiude la tastiera (sul telefono non c'è Esc): manca nel design system.

import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Strikethrough,
  Type,
  Underline,
  type LucideIcon,
} from "lucide-react-native";
import { Fragment } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import type { FormatoRiga, FormatoTesto } from "@/dati/formati";
import { misura, raggio, spazio, t, testo, useColori } from "@/tema";

export type Voce = FormatoRiga | "testo" | FormatoTesto;

const GRUPPI: { voce: Voce; nome: string; icona: LucideIcon }[][] = [
  [
    { voce: "testo", nome: "Testo normale", icona: Type },
    { voce: "titolo", nome: "Titolo", icona: Heading1 },
    { voce: "sottotitolo", nome: "Sottotitolo", icona: Heading2 },
    { voce: "puntato", nome: "Elenco puntato", icona: List },
    { voce: "numerato", nome: "Elenco numerato", icona: ListOrdered },
    { voce: "checklist", nome: "Casella", icona: ListChecks },
  ],
  [
    { voce: "grassetto", nome: "Grassetto", icona: Bold },
    { voce: "corsivo", nome: "Corsivo", icona: Italic },
    { voce: "barrato", nome: "Barrato", icona: Strikethrough },
    { voce: "sottolineato", nome: "Sottolineato", icona: Underline },
  ],
];

export function BarraFormati({
  visibile,
  attivi,
  onFormato,
  onFine,
}: {
  visibile: boolean;
  /** Le voci accese dove sta il cursore (CA-02.4). */
  attivi: Set<Voce>;
  onFormato: (v: Voce) => void;
  onFine: () => void;
}) {
  const c = useColori();
  const ombra = {
    shadowColor: "#000",
    shadowOpacity: c.ombraOpacita,
    shadowRadius: t(24) / 2,
    shadowOffset: { width: 0, height: t(8) },
  };
  return (
    <KeyboardStickyView
      offset={{ opened: -spazio.icona }}
      style={[stili.posto, !visibile && stili.nascosta]}
    >
      <View style={[stili.pillola, stili.cassetto, ombra, { backgroundColor: c.sfondoFlottante }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          <View style={stili.strumenti}>
            {GRUPPI.map((g, i) => (
              <Fragment key={i}>
                {i > 0 ? (
                  <View style={[stili.divisore, { backgroundColor: c.bordoDivisoreTenue }]} />
                ) : null}
                {g.map(({ voce, nome, icona: Icona }) => (
                  <Pressable
                    key={voce}
                    onPress={() => onFormato(voce)}
                    accessibilityRole="button"
                    accessibilityLabel={nome}
                    accessibilityState={{ selected: attivi.has(voce) }}
                    style={({ pressed }) => [
                      stili.strumento,
                      (pressed || attivi.has(voce)) && { backgroundColor: c.sfondoHover },
                    ]}
                  >
                    <Icona
                      size={misura.icona}
                      color={c.testoPrimario}
                      strokeWidth={misura.tratto}
                    />
                  </Pressable>
                ))}
              </Fragment>
            ))}
          </View>
        </ScrollView>
      </View>
      <Pressable
        onPress={onFine}
        accessibilityRole="button"
        style={({ pressed }) => [
          stili.pillola,
          stili.fine,
          ombra,
          { backgroundColor: pressed ? c.sfondoHover : c.sfondoFlottante },
        ]}
      >
        <Text allowFontScaling={false} style={[testo.titolo, { color: c.testoPrimario }]}>
          Fine
        </Text>
      </Pressable>
    </KeyboardStickyView>
  );
}

const STRUMENTO = t(32);

const stili = StyleSheet.create({
  posto: {
    position: "absolute",
    left: spazio.icona,
    right: spazio.icona,
    bottom: 0,
    flexDirection: "row",
    gap: spazio.icona,
  },
  nascosta: { opacity: 0 },
  pillola: { borderRadius: raggio.pillola, padding: spazio.elemento },
  cassetto: { flex: 1, overflow: "visible" },
  strumenti: { flexDirection: "row", alignItems: "center", gap: spazio.elemento },
  strumento: {
    width: STRUMENTO,
    height: STRUMENTO,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raggio.pillola,
  },
  divisore: { width: 1, height: STRUMENTO - spazio.icona * 2, marginHorizontal: spazio.elemento },
  fine: { justifyContent: "center", paddingHorizontal: spazio.controllo },
});
