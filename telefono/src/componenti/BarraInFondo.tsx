// In fondo alla colonna del telefono, alla portata del pollice (scelta di Manuel Cucca del
// 20/10/2026, DEC-160): la ricerca (CMP-03) e accanto il tondo pieno di Nuova nota con la penna,
// entrambi su sfondo-flottante o sfondo-pieno con ombra-flottante, sopra le note. Dal bordo in
// basso c'è lo stesso spazio-pannello dei lati, così la barra non sembra sollevata. Con la
// tastiera aperta sale e resta sopra la tastiera, staccata di spazio-icona come la penna dalla
// ricerca. Mentre si cerca (richiesta di Manuel Cucca del 20/10/2026) la penna se ne va
// stringendosi e svanendo, la ricerca prende tutta la larghezza e sopra compaiono i filtri, a
// portata del pollice; in movimento-durata-media.

import { Pencil } from "lucide-react-native";
import { useEffect, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import Animated, {
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ricerca } from "@/componenti/Ricerca";
import { misura, movimento, raggio, spazio, t, useColori } from "@/tema";

export const ALTEZZA_BARRA = t(40);
/** Quanto si alza la barra con i filtri sopra: la fila dei filtri e lo spazio fino alla ricerca. */
export const ALTEZZA_FILTRI = t(28) + spazio.icona;

export function BarraInFondo({
  cerca,
  onCerca,
  onNuova,
  onFocus,
  onBlur,
  cercando,
  filtri,
}: {
  cerca: string;
  onCerca: (v: string) => void;
  onNuova: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Si sta cercando: la penna se ne va e sopra la ricerca ci sono i filtri. */
  cercando: boolean;
  filtri: ReactNode;
}) {
  const c = useColori();
  const ridotto = useReducedMotion();
  const ombra = {
    shadowColor: "#000",
    shadowOpacity: c.ombraOpacita,
    shadowRadius: t(24) / 2,
    shadowOffset: { width: 0, height: t(8) },
  };
  const penna = useSharedValue(cercando ? 0 : 1);
  useEffect(() => {
    penna.value = ridotto
      ? cercando
        ? 0
        : 1
      : withTiming(cercando ? 0 : 1, { duration: movimento.durataMedia });
  }, [cercando, ridotto, penna]);
  const stilePenna = useAnimatedStyle(() => ({
    width: (ALTEZZA_BARRA + spazio.icona) * penna.value,
    opacity: penna.value,
    transform: [{ scale: 0.6 + 0.4 * penna.value }],
  }));
  return (
    <KeyboardStickyView offset={{ opened: spazio.pannello - spazio.icona }} style={stili.barra}>
      {cercando ? (
        <Animated.View
          entering={FadeInDown.duration(movimento.durataMedia)}
          exiting={FadeOutDown.duration(movimento.durataBreve)}
          style={stili.filtri}
        >
          {filtri}
        </Animated.View>
      ) : null}
      <View style={stili.riga}>
        <View style={[stili.ricerca, ombra]}>
          <Ricerca
            valore={cerca}
            onCambia={onCerca}
            alta={ALTEZZA_BARRA}
            sfondo={c.sfondoFlottante}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </View>
        <Animated.View style={[stili.posto, stilePenna]} pointerEvents={cercando ? "none" : "auto"}>
          <Pressable
            onPress={onNuova}
            accessibilityRole="button"
            accessibilityLabel="Nuova nota"
            accessibilityElementsHidden={cercando}
            style={({ pressed }) => [
              stili.tondo,
              ombra,
              { backgroundColor: pressed ? c.sfondoPienoPremuto : c.sfondoPieno },
            ]}
          >
            <Pencil size={misura.icona} color={c.iconaSuPieno} strokeWidth={misura.tratto} />
          </Pressable>
        </Animated.View>
      </View>
    </KeyboardStickyView>
  );
}

const stili = StyleSheet.create({
  barra: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    gap: spazio.icona,
    paddingHorizontal: spazio.pannello,
    paddingBottom: spazio.pannello,
  },
  filtri: { flexDirection: "row" },
  riga: { flexDirection: "row", alignItems: "center" },
  ricerca: { flex: 1, borderRadius: raggio.pillola },
  // Il posto della penna: si stringe fino a zero, con lo spazio che la stacca dalla ricerca.
  posto: { alignItems: "flex-end", overflow: "visible" },
  tondo: {
    width: ALTEZZA_BARRA,
    height: ALTEZZA_BARRA,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raggio.pillola,
  },
});
