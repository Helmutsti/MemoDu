// CMP-06 Riga della colonna alla scala del telefono (DEC-157): pillola alta misura-riga con
// spazio-controllo ai lati, spazio-icona tra icona e testo, spazio-rientro per livello. La nota
// ha solo il titolo e si allinea al nome delle sottocartelle sorelle; la cartella ha l'icona
// chiusa o aperta (DEC-99) e il numero di note in Interfaccia/Dettaglio. Sul telefono l'Hover
// diventa il tocco premuto; la riga della nota si fa scorrere a sinistra per Elimina (ID-55),
// con il gesto nativo di Gesture Handler.

import { Folder, FolderOpen, Trash2 } from "lucide-react-native";
import { useRef } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { misura, raggio, spazio, testo, useColori } from "@/tema";

export function RigaCartella({
  nome,
  conteggio,
  aperta,
  livello,
  onPress,
}: {
  nome: string;
  conteggio: number;
  aperta: boolean;
  livello: number;
  onPress: () => void;
}) {
  const c = useColori();
  const Icona = aperta ? FolderOpen : Folder;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: aperta }}
      style={({ pressed }) => [
        stili.riga,
        stili.conIcona,
        { paddingLeft: spazio.controllo + livello * spazio.rientro },
        pressed && { backgroundColor: c.sfondoHover },
      ]}
    >
      <Icona size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
      <Text style={[testo.controllo, stili.nome, { color: c.testoPrimario }]} numberOfLines={1}>
        {nome}
      </Text>
      <Text style={[testo.dettaglio, stili.conteggio, { color: c.testoTenue }]}>{conteggio}</Text>
    </Pressable>
  );
}

export function RigaNota({
  titolo,
  vuota,
  livelloCartella,
  onPress,
  onElimina,
}: {
  titolo: string;
  vuota: boolean;
  /** Livello della cartella che la contiene; assente nella radice di Cloud. */
  livelloCartella?: number;
  onPress: () => void;
  onElimina: () => void;
}) {
  const c = useColori();
  const riga = useRef<SwipeableMethods>(null);
  const sinistra =
    livelloCartella === undefined
      ? spazio.controllo
      : spazio.controllo + (livelloCartella + 2) * spazio.rientro;
  return (
    <ReanimatedSwipeable
      ref={riga}
      friction={1.5}
      rightThreshold={spazio.gruppo * 2}
      overshootRight={false}
      containerStyle={stili.scorre}
      renderRightActions={(progresso) => (
        <AzioneElimina
          progresso={progresso}
          onPress={() => {
            riga.current?.close();
            onElimina();
          }}
        />
      )}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          stili.riga,
          { paddingLeft: sinistra, backgroundColor: pressed ? c.sfondoHover : c.sfondoNota },
        ]}
      >
        <Text
          style={[testo.controllo, stili.nome, { color: vuota ? c.testoTenue : c.testoPrimario }]}
          numberOfLines={1}
        >
          {vuota ? "Nota vuota" : titolo}
        </Text>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

/** Elimina sotto la riga: si vede solo mentre la riga scorre, così da ferma non spunta dagli angoli. */
function AzioneElimina({
  progresso,
  onPress,
}: {
  progresso: SharedValue<number>;
  onPress: () => void;
}) {
  const c = useColori();
  const visibile = useAnimatedStyle(() => ({ opacity: progresso.value > 0.02 ? 1 : 0 }));
  return (
    <Animated.View style={[stili.azioneFuori, visibile]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Elimina"
        style={({ pressed }) => [
          stili.azione,
          { backgroundColor: pressed ? c.sfondoPremuto : c.sfondoPieno },
        ]}
      >
        <Trash2 size={misura.icona} color={c.iconaSuPieno} strokeWidth={misura.tratto} />
        <Text style={[testo.etichetta, { color: c.testoSuPieno }]}>Elimina</Text>
      </Pressable>
    </Animated.View>
  );
}

const stili = StyleSheet.create({
  scorre: { borderRadius: raggio.pillola },
  riga: {
    flexDirection: "row",
    alignItems: "center",
    height: misura.riga,
    paddingRight: spazio.controllo,
    borderRadius: raggio.pillola,
  },
  conIcona: { gap: spazio.icona },
  nome: { flex: 1 },
  conteggio: { paddingRight: spazio.elemento },
  azioneFuori: { flexDirection: "row" },
  azione: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.iconaPiccola,
    paddingHorizontal: spazio.pulsante,
    marginLeft: spazio.elemento,
    borderRadius: raggio.pillola,
  },
});
