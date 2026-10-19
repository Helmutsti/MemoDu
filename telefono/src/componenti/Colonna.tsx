// Pezzi della colonna del computer alla scala del telefono (DEC-157): CMP-49 Barra delle
// tessere di Brainet (tessere CMP-48) e CMP-30 Fondo della colonna (Cestino in un riquadro,
// Impostazioni in un tondo, DEC-154). Una tessera o una riga senza schermata ancora (Brainet,
// Cestino sul telefono) è disabilitata, con opacita-disabilitato.

import { BookOpen, Brain, Calendar, Settings, Trash2, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { misura, opacitaDisabilitato, raggio, spazio, t, testo, useColori } from "@/tema";

function Tessera({
  nome,
  icona: Icona,
  onPress,
}: {
  nome: string;
  icona: LucideIcon;
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
        stili.tessera,
        { backgroundColor: pressed ? c.sfondoHover : c.sfondoNota },
        !onPress && { opacity: opacitaDisabilitato },
      ]}
    >
      <Icona size={misura.icona} color={c.testoPrimario} strokeWidth={misura.tratto} />
      <Text
        allowFontScaling={false}
        style={[testo.etichetta, { color: c.testoPrimario }]}
        numberOfLines={1}
      >
        {nome}
      </Text>
    </Pressable>
  );
}

export function BarraTessere({
  onJournal,
  onEntita,
  onCalendario,
}: {
  onJournal?: () => void;
  onEntita?: () => void;
  onCalendario?: () => void;
}) {
  return (
    <View style={stili.barra} accessibilityLabel="Brainet">
      <Tessera nome="Journal" icona={BookOpen} onPress={onJournal} />
      <Tessera nome="Entità" icona={Brain} onPress={onEntita} />
      <Tessera nome="Calendario" icona={Calendar} onPress={onCalendario} />
    </View>
  );
}

export function FondoColonna({
  cestino,
  onCestino,
  onImpostazioni,
  marginiInBasso,
}: {
  cestino: number;
  onCestino?: () => void;
  onImpostazioni: () => void;
  marginiInBasso: number;
}) {
  const c = useColori();
  return (
    <View
      style={[
        stili.fondo,
        { backgroundColor: c.sfondoColonna, paddingBottom: spazio.pannello + marginiInBasso },
      ]}
    >
      <View
        style={[
          stili.riquadro,
          stili.riquadroCestino,
          { backgroundColor: c.sfondoNota },
          !onCestino && { opacity: opacitaDisabilitato },
        ]}
      >
        <Pressable
          onPress={onCestino}
          disabled={!onCestino}
          accessibilityRole="button"
          style={({ pressed }) => [stili.riga, pressed && { backgroundColor: c.sfondoHover }]}
        >
          <Trash2 size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
          <Text
            allowFontScaling={false}
            style={[testo.controllo, stili.nome, { color: c.testoPrimario }]}
          >
            Cestino
          </Text>
          <Text
            allowFontScaling={false}
            style={[testo.dettaglio, stili.conteggio, { color: c.testoTenue }]}
          >
            {cestino}
          </Text>
        </Pressable>
      </View>
      <View style={[stili.riquadro, { backgroundColor: c.sfondoNota }]}>
        <Pressable
          onPress={onImpostazioni}
          accessibilityRole="button"
          accessibilityLabel="Impostazioni"
          style={({ pressed }) => [stili.tondo, pressed && { backgroundColor: c.sfondoHover }]}
        >
          <Settings size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
        </Pressable>
      </View>
    </View>
  );
}

const stili = StyleSheet.create({
  barra: { flexDirection: "row", gap: spazio.icona },
  // Alta 58 sul computer.
  tessera: {
    flex: 1,
    height: t(58),
    alignItems: "center",
    justifyContent: "center",
    gap: spazio.elemento,
    paddingHorizontal: spazio.elemento,
    borderRadius: raggio.interno,
  },
  fondo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    paddingHorizontal: spazio.pannello,
    paddingTop: spazio.pannello,
  },
  riquadro: { padding: spazio.elemento, borderRadius: raggio.contenitore },
  riquadroCestino: { flex: 1 },
  riga: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    height: misura.riga,
    paddingHorizontal: spazio.controllo,
    borderRadius: raggio.pillola,
  },
  nome: { flex: 1 },
  conteggio: { paddingRight: spazio.elemento },
  tondo: {
    width: misura.riga,
    height: misura.riga,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raggio.pillola,
  },
});
