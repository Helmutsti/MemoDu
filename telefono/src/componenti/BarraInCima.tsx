// CMP-50 Barra in cima alle schermate interne del telefono (nota, Cestino, Impostazioni), con il
// tasto indietro scelto da Manuel Cucca il 19/10/2026 (proposta C): il pulsante solo icona di
// CMP-01, tondo da 44 su sfondo-campo, con la freccia a sinistra; il nome di dove si torna non
// c'è. Torna anche con il gesto dal bordo sinistro, che dà la navigazione nativa. A destra le
// azioni della schermata. Spazio-pannello ai lati.

import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { misura, raggio, spazio, useColori } from "@/tema";

export function BarraInCima({ sfondo, destra }: { sfondo?: string; destra?: ReactNode }) {
  const c = useColori();
  const margini = useSafeAreaInsets();
  return (
    <View
      style={[
        stili.barra,
        { paddingTop: margini.top + spazio.elemento, backgroundColor: sfondo ?? c.sfondoNota },
      ]}
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Indietro"
        hitSlop={spazio.elemento}
        style={({ pressed }) => [
          stili.tondo,
          { backgroundColor: pressed ? c.sfondoPremuto : c.sfondoCampo },
        ]}
      >
        <ChevronLeft size={misura.icona} color={c.testoPrimario} strokeWidth={misura.tratto} />
      </Pressable>
      <View style={stili.destra}>{destra}</View>
    </View>
  );
}

const stili = StyleSheet.create({
  barra: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spazio.pannello,
    paddingBottom: spazio.elemento,
  },
  tondo: {
    width: misura.riga,
    height: misura.riga,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raggio.pillola,
  },
  destra: { flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: spazio.icona },
});
