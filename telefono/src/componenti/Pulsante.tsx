// CMP-01 Pulsante alla scala del telefono (DEC-157): alto misura-riga (32 → 44, la misura minima di
// un tocco), pillola, spazio-pulsante ai lati (16 → 21), testo Interfaccia/Controllo attivo.
// Primario: sfondo-pieno; secondario: sfondo-campo; tenue: senza sfondo, testo-tenue. Premuto:
// sfondo-pieno-premuto o sfondo-premuto. Disabilitato a opacita-disabilitato. In caricamento la
// rotella prende il posto dell'icona e l'etichetta resta. «Largo» prende tutta la larghezza, come i
// pulsanti dei fogli del telefono (CMP-56).

import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { misura, opacitaDisabilitato, raggio, spazio, testo, useColori } from "@/tema";

export function Pulsante({
  etichetta,
  tipo = "secondario",
  largo,
  inCorso,
  disabilitato,
  onPress,
}: {
  etichetta: string;
  tipo?: "primario" | "secondario" | "tenue";
  largo?: boolean;
  inCorso?: boolean;
  disabilitato?: boolean;
  onPress: () => void;
}) {
  const c = useColori();
  const sfondo = (premuto: boolean) =>
    tipo === "primario"
      ? premuto
        ? c.sfondoPienoPremuto
        : c.sfondoPieno
      : tipo === "secondario"
        ? premuto
          ? c.sfondoPremuto
          : c.sfondoCampo
        : premuto
          ? c.sfondoPremuto
          : "transparent";
  const colore =
    tipo === "primario" ? c.testoSuPieno : tipo === "tenue" ? c.testoTenue : c.testoPrimario;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabilitato || inCorso}
      accessibilityRole="button"
      accessibilityLabel={etichetta}
      accessibilityState={{ disabled: !!disabilitato, busy: !!inCorso }}
      style={({ pressed }) => [
        stili.pulsante,
        { backgroundColor: sfondo(pressed) },
        largo ? stili.largo : stili.stretto,
        disabilitato && { opacity: opacitaDisabilitato },
      ]}
    >
      {inCorso ? <ActivityIndicator size="small" color={colore} /> : null}
      <Text allowFontScaling={false} style={[testo.controlloAttivo, { color: colore }]}>
        {etichetta}
      </Text>
    </Pressable>
  );
}

const stili = StyleSheet.create({
  pulsante: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spazio.icona,
    height: misura.riga,
    paddingHorizontal: spazio.pulsante,
    borderRadius: raggio.pillola,
  },
  largo: { alignSelf: "stretch" },
  stretto: { alignSelf: "flex-start" },
});
