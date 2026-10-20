// CMP-51 Foglio dal basso e CMP-56 Conferma, alla scala del telefono (DEC-161). Il foglio sale
// sopra il velo in movimento-durata-media; si chiude con la ×, toccando il velo o trascinando la
// maniglia verso il basso. Raggio-contenitore in alto, sfondo-flottante, spazio-pannello ai lati
// e in fondo.
// La conferma è un foglio con il titolo, il testo e i pulsanti larghi: l'azione piena sopra,
// Annulla sotto, con gli stessi testi della finestra di conferma del computer (CMP-16).

import { X } from "lucide-react-native";
import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Pulsante } from "@/componenti/Pulsante";
import { misura, movimento, raggio, spazio, t, testo, useColori } from "@/tema";

const SOGLIA_CHIUSURA = t(80);

export function Foglio({
  visibile,
  titolo,
  onChiudi,
  children,
}: {
  visibile: boolean;
  titolo: string;
  onChiudi: () => void;
  children: ReactNode;
}) {
  const c = useColori();
  const scesa = useSharedValue(0);
  const trascina = Gesture.Pan()
    .onUpdate((e) => {
      scesa.value = Math.max(0, e.translationY);
    })
    .onEnd(() => {
      if (scesa.value > SOGLIA_CHIUSURA) runOnJS(onChiudi)();
      else scesa.value = withTiming(0, { duration: movimento.durataBreve });
    });
  const spostato = useAnimatedStyle(() => ({ transform: [{ translateY: scesa.value }] }));
  return (
    <Modal
      visible={visibile}
      transparent
      animationType="none"
      onRequestClose={onChiudi}
      onShow={() => {
        scesa.value = 0;
      }}
    >
      <GestureHandlerRootView style={stili.pieno}>
        {visibile ? (
          <>
            <Animated.View
              entering={FadeIn.duration(movimento.durataMedia)}
              exiting={FadeOut.duration(movimento.durataBreve)}
              style={[StyleSheet.absoluteFill, { backgroundColor: c.velo }]}
            >
              <Pressable style={stili.pieno} onPress={onChiudi} accessibilityLabel="Chiudi" />
            </Animated.View>
            <Animated.View
              entering={SlideInDown.duration(movimento.durataMedia)}
              exiting={SlideOutDown.duration(movimento.durataBreve)}
              style={[stili.foglio, spostato, { backgroundColor: c.sfondoFlottante }]}
              accessibilityViewIsModal
            >
              <GestureDetector gesture={trascina}>
                <View style={stili.presa}>
                  <View style={[stili.maniglia, { backgroundColor: c.sfondoPremuto }]} />
                  <View style={stili.testata}>
                    <Text
                      allowFontScaling={false}
                      style={[testo.titoloSchermata, stili.titolo, { color: c.testoPrimario }]}
                      numberOfLines={2}
                    >
                      {titolo}
                    </Text>
                    <Pressable
                      onPress={onChiudi}
                      hitSlop={spazio.icona}
                      accessibilityRole="button"
                      accessibilityLabel="Chiudi"
                      style={({ pressed }) => [
                        stili.chiudi,
                        { backgroundColor: pressed ? c.sfondoPremuto : c.sfondoCampo },
                      ]}
                    >
                      <X size={misura.icona} color={c.testoPrimario} strokeWidth={misura.tratto} />
                    </Pressable>
                  </View>
                </View>
              </GestureDetector>
              {children}
            </Animated.View>
          </>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

export function Conferma({
  visibile,
  titolo,
  testo: messaggio,
  azione,
  altra,
  onConferma,
  onAnnulla,
}: {
  visibile: boolean;
  titolo: string;
  testo?: string;
  azione: string;
  /** Una seconda azione, come «Unisci» di RB-31. */
  altra?: { etichetta: string; onPress: () => void };
  onConferma: () => void;
  onAnnulla: () => void;
}) {
  const c = useColori();
  return (
    <Foglio visibile={visibile} titolo={titolo} onChiudi={onAnnulla}>
      {messaggio ? (
        <Text allowFontScaling={false} style={[testo.messaggio, { color: c.testoTenue }]}>
          {messaggio}
        </Text>
      ) : null}
      <View style={stili.pulsanti}>
        <Pulsante etichetta={azione} tipo="primario" largo onPress={onConferma} />
        {altra ? <Pulsante etichetta={altra.etichetta} largo onPress={altra.onPress} /> : null}
        <Pulsante etichetta="Annulla" largo onPress={onAnnulla} />
      </View>
    </Foglio>
  );
}

const stili = StyleSheet.create({
  pieno: { flex: 1 },
  foglio: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    gap: spazio.blocco,
    paddingHorizontal: spazio.pannello,
    paddingTop: spazio.icona,
    // Dal fondo lo stesso spazio-pannello dei lati, come la barra in basso: non sembra sollevato.
    paddingBottom: spazio.pannello,
    borderTopLeftRadius: raggio.contenitore,
    borderTopRightRadius: raggio.contenitore,
  },
  presa: { gap: spazio.icona },
  maniglia: { alignSelf: "center", width: t(28), height: 5, borderRadius: raggio.pillola },
  testata: { flexDirection: "row", alignItems: "center", gap: spazio.controllo },
  titolo: { flex: 1 },
  chiudi: {
    width: t(24),
    height: t(24),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raggio.pillola,
  },
  pulsanti: { gap: spazio.icona, marginTop: spazio.icona },
});
