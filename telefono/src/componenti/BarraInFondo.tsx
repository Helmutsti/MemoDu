// In fondo alla colonna del telefono, alla portata del pollice (scelta di Manuel Cucca del
// 20/10/2026, DEC-160): la ricerca (CMP-03) e accanto il tondo pieno di Nuova nota con la penna,
// entrambi su sfondo-flottante o sfondo-pieno con ombra-flottante, sopra le note. Dal bordo in
// basso c'è lo stesso spazio-pannello dei lati, così la barra non sembra sollevata: alta 52, sta
// comunque sopra la linea di iOS in fondo. Con la tastiera aperta sale e resta sopra la tastiera,
// staccata di spazio-icona come la penna dalla ricerca.

import { Pencil } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { Ricerca } from "@/componenti/Ricerca";
import { misura, raggio, spazio, t, useColori } from "@/tema";

export const ALTEZZA_BARRA = t(40);

export function BarraInFondo({
  cerca,
  onCerca,
  onNuova,
}: {
  cerca: string;
  onCerca: (v: string) => void;
  onNuova: () => void;
}) {
  const c = useColori();
  const ombra = {
    shadowColor: "#000",
    shadowOpacity: c.ombraOpacita,
    shadowRadius: t(24) / 2,
    shadowOffset: { width: 0, height: t(8) },
  };
  return (
    <KeyboardStickyView offset={{ opened: spazio.pannello - spazio.icona }} style={stili.barra}>
      <View style={[stili.ricerca, ombra]}>
        <Ricerca
          valore={cerca}
          onCambia={onCerca}
          alta={ALTEZZA_BARRA}
          sfondo={c.sfondoFlottante}
        />
      </View>
      <Pressable
        onPress={onNuova}
        accessibilityRole="button"
        accessibilityLabel="Nuova nota"
        style={({ pressed }) => [
          stili.tondo,
          ombra,
          { backgroundColor: pressed ? c.sfondoPienoPremuto : c.sfondoPieno },
        ]}
      >
        <Pencil size={misura.icona} color={c.iconaSuPieno} strokeWidth={misura.tratto} />
      </Pressable>
    </KeyboardStickyView>
  );
}

const stili = StyleSheet.create({
  barra: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    paddingHorizontal: spazio.pannello,
    paddingBottom: spazio.pannello,
  },
  ricerca: { flex: 1, borderRadius: raggio.pillola },
  tondo: {
    width: ALTEZZA_BARRA,
    height: ALTEZZA_BARRA,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raggio.pillola,
  },
});
