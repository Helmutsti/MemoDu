// Apertura e chiusura di cartelle e riquadri (CMP-14) con il movimento del design system: le
// righe che nascono compaiono in dissolvenza, quelle che spariscono svaniscono, e le righe sotto
// scendono o salgono morbide, in movimento-durata-media. Con «Riduci movimento» niente animazione.

import type { ReactNode } from "react";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { movimento } from "@/tema";

export const transizione = LinearTransition.duration(movimento.durataMedia);
const entra = FadeIn.duration(movimento.durataMedia);
const esce = FadeOut.duration(movimento.durataBreve);

export function Comparsa({ children }: { children: ReactNode }) {
  return (
    <Animated.View entering={entra} exiting={esce} layout={transizione}>
      {children}
    </Animated.View>
  );
}
