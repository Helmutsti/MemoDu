// CMP-53 Menu della pressione lunga: il tasto destro del computer (CMP-09) sul telefono. Tenendo
// premuta una riga, sopra il velo la riga si solleva (sfondo-nota con ombra-flottante, nello
// stesso punto) e sotto, o sopra se sotto non c'è posto, compare il menu: sfondo-flottante,
// raggio-contenitore, spazio-elenco di margine, voci alte 44 con l'icona; un filo prima di
// Elimina, in testo-errore. Un tocco sul velo chiude.

import type { LucideIcon } from "lucide-react-native";
import { Fragment, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import type { Rettangolo } from "@/componenti/Righe";
import { misura, movimento, raggio, spazio, t, testo, useColori } from "@/tema";

export type VoceMenu =
  { etichetta: string; icona?: LucideIcon; errore?: boolean; onPress: () => void } | "filo";

const LARGHEZZA = t(220);

export function MenuRiga({
  ancora,
  riga,
  voci,
  onChiudi,
}: {
  /** Dove sta la riga tenuta premuta; null: menu chiuso. */
  ancora: Rettangolo | null;
  /** Il contenuto della riga sollevata. */
  riga: ReactNode;
  voci: VoceMenu[];
  onChiudi: () => void;
}) {
  const c = useColori();
  const schermo = useWindowDimensions();
  if (!ancora) return null;
  const alto =
    voci.reduce((h, v) => h + (v === "filo" ? 1 + spazio.elemento * 2 : misura.riga), 0) +
    spazio.elenco * 2;
  const sotto = ancora.y + ancora.altezza + spazio.icona;
  const y = sotto + alto < schermo.height - spazio.gruppo ? sotto : ancora.y - spazio.icona - alto;
  const ombra = {
    shadowColor: "#000",
    shadowOpacity: c.ombraOpacita,
    shadowRadius: t(24) / 2,
    shadowOffset: { width: 0, height: t(8) },
  };
  return (
    <Modal visible transparent animationType="none" onRequestClose={onChiudi}>
      <Animated.View
        entering={FadeIn.duration(movimento.durataBreve)}
        exiting={FadeOut.duration(movimento.durataBreve)}
        style={[StyleSheet.absoluteFill, { backgroundColor: c.velo }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onChiudi} accessibilityLabel="Chiudi" />
        <View
          pointerEvents="none"
          style={[
            stili.riga,
            ombra,
            {
              left: ancora.x,
              top: ancora.y,
              width: ancora.larghezza,
              height: ancora.altezza,
              backgroundColor: c.sfondoNota,
            },
          ]}
        >
          {riga}
        </View>
        <View
          style={[
            stili.menu,
            ombra,
            { left: ancora.x, top: y, width: LARGHEZZA, backgroundColor: c.sfondoFlottante },
          ]}
          accessibilityRole="menu"
        >
          {voci.map((v, i) =>
            v === "filo" ? (
              <View key={i} style={[stili.filo, { backgroundColor: c.bordoDivisoreTenue }]} />
            ) : (
              <Fragment key={i}>
                <Pressable
                  onPress={() => {
                    onChiudi();
                    v.onPress();
                  }}
                  accessibilityRole="menuitem"
                  style={({ pressed }) => [
                    stili.voce,
                    pressed && { backgroundColor: c.sfondoHover },
                  ]}
                >
                  {v.icona ? (
                    <v.icona
                      size={misura.icona}
                      color={v.errore ? c.testoErrore : c.iconaTenue}
                      strokeWidth={misura.tratto}
                    />
                  ) : null}
                  <Text
                    allowFontScaling={false}
                    style={[testo.controllo, { color: v.errore ? c.testoErrore : c.testoPrimario }]}
                  >
                    {v.etichetta}
                  </Text>
                </Pressable>
              </Fragment>
            ),
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const stili = StyleSheet.create({
  riga: { position: "absolute", borderRadius: raggio.pillola, justifyContent: "center" },
  menu: { position: "absolute", padding: spazio.elenco, borderRadius: raggio.contenitore },
  voce: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    height: misura.riga,
    paddingHorizontal: spazio.controllo,
    borderRadius: raggio.pillola,
  },
  filo: { height: 1, marginVertical: spazio.elemento },
});
