// CMP-06 Riga della colonna alla scala del telefono (DEC-157): pillola alta misura-riga con
// spazio-controllo ai lati, spazio-icona tra icona e testo, spazio-rientro per livello. La nota
// ha solo il titolo e si allinea al nome delle sottocartelle sorelle; la cartella ha l'icona
// chiusa o aperta (DEC-99) e il numero di note in Interfaccia/Dettaglio. Sul telefono l'Hover
// diventa il tocco premuto; la riga della nota si fa scorrere a sinistra per Elimina (ID-55),
// con il gesto nativo di Gesture Handler.

import { Folder, FolderOpen, Trash2, type LucideIcon } from "lucide-react-native";
import { useRef, type ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { misura, opacitaDisabilitato, raggio, spazio, testo, useColori } from "@/tema";

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
      <Text
        allowFontScaling={false}
        style={[testo.controllo, stili.nome, { color: c.testoPrimario }]}
        numberOfLines={1}
      >
        {nome}
      </Text>
      <Text
        allowFontScaling={false}
        style={[testo.dettaglio, stili.conteggio, { color: c.testoTenue }]}
      >
        {conteggio}
      </Text>
    </Pressable>
  );
}

/**
 * Una voce della colonna con icona e nome, come il Cestino (con il numero di elementi, CMP-30) o
 * Journal, Entità e Calendario nel riquadro di Brainet. Senza schermata ancora è disabilitata.
 */
export function RigaVoce({
  nome,
  icona: Icona,
  conteggio,
  onPress,
}: {
  nome: string;
  icona: LucideIcon;
  conteggio?: number;
  onPress?: () => void;
}) {
  const c = useColori();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
      style={({ pressed }) => [
        stili.riga,
        stili.conIcona,
        { paddingLeft: spazio.controllo },
        pressed && { backgroundColor: c.sfondoHover },
        !onPress && { opacity: opacitaDisabilitato },
      ]}
    >
      <Icona size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
      <Text
        allowFontScaling={false}
        style={[testo.controllo, stili.nome, { color: c.testoPrimario }]}
        numberOfLines={1}
      >
        {nome}
      </Text>
      {conteggio !== undefined ? (
        <Text
          allowFontScaling={false}
          style={[testo.dettaglio, stili.conteggio, { color: c.testoTenue }]}
        >
          {conteggio}
        </Text>
      ) : null}
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
          allowFontScaling={false}
          style={[testo.controllo, stili.nome, { color: vuota ? c.testoTenue : c.testoPrimario }]}
          numberOfLines={1}
        >
          {vuota ? "Nota vuota" : titolo}
        </Text>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

/**
 * Le azioni di una riga che scorre (CMP-52): entrano da destra attaccate alla riga, staccate da
 * spazio-elemento, così la riga intera si sposta e non scivola sopra le azioni. Da ferme non si
 * vedono, nemmeno dagli angoli.
 */
export function AzioniAccanto({
  progresso,
  children,
}: {
  progresso: SharedValue<number>;
  children: ReactNode;
}) {
  const larghezza = useSharedValue(0);
  const accanto = useAnimatedStyle(() => ({
    opacity: progresso.value > 0.02 ? 1 : 0,
    transform: [{ translateX: larghezza.value * Math.max(0, 1 - progresso.value) }],
  }));
  return (
    <Animated.View
      style={[stili.azioni, accanto]}
      onLayout={(e) => (larghezza.value = e.nativeEvent.layout.width)}
    >
      {children}
    </Animated.View>
  );
}

function AzioneElimina({
  progresso,
  onPress,
}: {
  progresso: SharedValue<number>;
  onPress: () => void;
}) {
  const c = useColori();
  return (
    <AzioniAccanto progresso={progresso}>
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
        <Text allowFontScaling={false} style={[testo.etichetta, { color: c.testoSuPieno }]}>
          Elimina
        </Text>
      </Pressable>
    </AzioniAccanto>
  );
}

const stili = StyleSheet.create({
  // Alta fissa: la tendina la misura giusta già dal primo fotogramma.
  scorre: { height: misura.riga, borderRadius: raggio.pillola },
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
  azioni: { flexDirection: "row", gap: spazio.elemento, paddingLeft: spazio.elemento },
  azione: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.iconaPiccola,
    paddingHorizontal: spazio.pulsante,
    borderRadius: raggio.pillola,
  },
});
