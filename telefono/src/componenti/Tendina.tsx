// Apertura e chiusura di cartelle e riquadri (CMP-14) sul telefono come una tendina (scelta di
// Manuel Cucca del 20/10/2026): il contenuto non compare riga per riga ma scende tutto insieme da
// sotto la riga che lo apre, scoperto da un bordo che si allunga, e le righe sotto scendono con
// lui; alla chiusura risale. Movimento-durata-media ad aprire, movimento-durata-breve a chiudere.
// All'apertura dell'app e con «Riduci movimento» niente animazione. Ferma, la tendina non ha
// un'altezza sua: una cartella aperta dentro allunga solo la propria tendina.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { movimento } from "@/tema";

const curva = Easing.out(Easing.cubic);

export function Tendina({
  aperta,
  scarto = 0,
  children,
}: {
  aperta: boolean;
  /**
   * Lo spazio che il genitore mette prima della tendina: chiusa la tendina se lo riprende, così
   * le righe sotto non saltano quando sparisce.
   */
  scarto?: number;
  children: ReactNode;
}) {
  const ridotto = useReducedMotion();
  const [presente, setPresente] = useState(aperta);
  const [misurata, setMisurata] = useState(aperta);
  const avanzamento = useSharedValue(aperta ? 1 : 0);
  // Vale 1 finché la tendina non è ferma e aperta: così le righe che nascono restano coperte fin
  // dal primo fotogramma.
  const inMoto = useSharedValue(aperta ? 0 : 1);
  const altezza = useSharedValue(0);
  const prima = useRef(true);

  useEffect(() => {
    if (prima.current) {
      prima.current = false;
      return;
    }
    if (ridotto) {
      avanzamento.value = aperta ? 1 : 0;
      inMoto.value = aperta ? 0 : 1;
      setPresente(aperta);
      return;
    }
    if (aperta) {
      // Si rimisura a ogni apertura: il contenuto può essere cambiato da chiuso.
      altezza.value = 0;
      setMisurata(false);
      setPresente(true);
    }
    inMoto.value = 1;
    avanzamento.value = withTiming(
      aperta ? 1 : 0,
      { duration: aperta ? movimento.durataMedia : movimento.durataBreve, easing: curva },
      (finita) => {
        if (!finita) return;
        if (aperta) inMoto.value = 0;
        else runOnJS(setPresente)(false);
      },
    );
  }, [aperta, ridotto, avanzamento, inMoto, altezza]);

  const bordo = useAnimatedStyle(() =>
    inMoto.value && altezza.value
      ? {
          height: altezza.value * avanzamento.value,
          overflow: "hidden",
          marginTop: -scarto * (1 - avanzamento.value),
        }
      : { height: "auto", overflow: "visible", marginTop: 0 },
  );
  const contenuto = useAnimatedStyle(() => ({
    transform: [{ translateY: inMoto.value ? -altezza.value * (1 - avanzamento.value) : 0 }],
  }));

  if (!presente) return null;
  return (
    // Prima di conoscere l'altezza il contenuto si misura fuori dal flusso e invisibile, già dal
    // primo fotogramma: dentro un bordo alto zero iOS non lo dispone.
    <Animated.View style={[bordo, !misurata && stili.daMisurare]}>
      <Animated.View style={contenuto}>
        <View
          onLayout={(e) => {
            altezza.value = e.nativeEvent.layout.height;
            setMisurata(true);
          }}
        >
          {children}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const stili = StyleSheet.create({
  daMisurare: { position: "absolute", left: 0, right: 0, opacity: 0 },
});
