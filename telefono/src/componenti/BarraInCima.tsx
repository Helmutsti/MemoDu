// CMP-50 Barra in cima alle schermate interne del telefono (nota, Cestino, Impostazioni), con il
// tasto indietro scelto da Manuel Cucca il 19/10/2026 (proposta C): il pulsante solo icona di
// CMP-01, tondo da 44 su sfondo-campo, con la freccia a sinistra; il nome di dove si torna non
// c'è. Torna anche con il gesto dal bordo sinistro, che dà la navigazione nativa. A destra le
// azioni della schermata. Spazio-pannello ai lati.

import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { misura, opacitaDisabilitato, raggio, spazio, testo, useColori } from "@/tema";

export function BarraInCima({
  sfondo,
  titolo,
  indietro = true,
  destra,
}: {
  sfondo?: string;
  /** Il titolo della schermata accanto al tondo, in Titolo di schermata (SC-06, SC-08, SC-09). */
  titolo?: string;
  /** Spento dove non si può tornare indietro (la chiave di recupero nuova, RB-99). */
  indietro?: boolean;
  destra?: ReactNode;
}) {
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
        disabled={!indietro}
        accessibilityRole="button"
        accessibilityLabel="Indietro"
        accessibilityState={{ disabled: !indietro }}
        hitSlop={spazio.elemento}
        style={({ pressed }) => [
          stili.tondo,
          { backgroundColor: pressed ? c.sfondoPremuto : c.sfondoCampo },
          !indietro && { opacity: opacitaDisabilitato },
        ]}
      >
        <ChevronLeft size={misura.icona} color={c.testoPrimario} strokeWidth={misura.tratto} />
      </Pressable>
      {titolo ? (
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          accessibilityRole="header"
          style={[testo.titoloSchermata, stili.titolo, { color: c.testoPrimario }]}
        >
          {titolo}
        </Text>
      ) : null}
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
  titolo: { flexShrink: 1, marginLeft: spazio.controllo },
  destra: { flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: spazio.icona },
});
