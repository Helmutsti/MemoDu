// CMP-03 Campo di testo, tipo Ricerca, alla scala del telefono (DEC-157): pillola su
// sfondo-campo, spazio-controllo ai lati, icona Cerca 16 in icona-tenue, testo in
// Interfaccia/Controllo e segnaposto «Cerca nelle note» in testo-tenue. Sul telefono niente
// scorciatoia da tastiera; con un testo scritto, la × lo cancella.

import { Search, X } from "lucide-react-native";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { misura, raggio, spazio, testo, useColori } from "@/tema";

export function Ricerca({
  valore,
  onCambia,
  alta,
  sfondo,
}: {
  valore: string;
  onCambia: (v: string) => void;
  /** In fondo alla colonna la ricerca è alta come la penna accanto. */
  alta?: number;
  sfondo?: string;
}) {
  const c = useColori();
  return (
    <View
      style={[
        stili.campo,
        { backgroundColor: sfondo ?? c.sfondoCampo },
        alta !== undefined && { height: alta },
      ]}
    >
      <Search size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
      <TextInput
        allowFontScaling={false}
        value={valore}
        onChangeText={onCambia}
        placeholder="Cerca nelle note"
        placeholderTextColor={c.testoTenue}
        style={[testo.controllo, stili.testo, { color: c.testoPrimario }]}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="never"
        accessibilityLabel="Cerca nelle note"
      />
      {valore ? (
        <Pressable
          onPress={() => onCambia("")}
          hitSlop={spazio.controllo}
          accessibilityLabel="Cancella la ricerca"
        >
          <X size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
        </Pressable>
      ) : null}
    </View>
  );
}

const stili = StyleSheet.create({
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    height: misura.riga,
    paddingHorizontal: spazio.controllo,
    borderRadius: raggio.pillola,
  },
  testo: { flex: 1, paddingVertical: 0 },
});
