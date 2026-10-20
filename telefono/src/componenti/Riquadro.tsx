// CMP-14 Albero delle cartelle a riquadro (DEC-154) alla scala del telefono (DEC-157). Sul telefono
// l'intestazione CMP-06 Sezione sta sopra il riquadro, fuori, senza numero e senza il + (il + vale
// solo sul computer: sul telefono la nota nuova è la penna in basso; scelte di Manuel Cucca del
// 19 e del 20/10/2026, DEC-159, DEC-160): freccia 12 e nome in Interfaccia/Titolo di sezione
// (maiuscolo) in testo-tenue, allineati alle righe. Il riquadro: sfondo-nota, raggio-contenitore,
// spazio-elenco su tutti i lati, righe attaccate (DEC-161). Si apre e si chiude a tendina.

import { ChevronDown, ChevronRight } from "lucide-react-native";
import { Children, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Tendina } from "@/componenti/Tendina";
import { misura, raggio, spazio, t, testo, useColori } from "@/tema";

export function Riquadro({
  titolo,
  aperto,
  onApriChiudi,
  children,
}: {
  titolo: string;
  aperto: boolean;
  onApriChiudi: () => void;
  children?: ReactNode;
}) {
  const c = useColori();
  const Freccia = aperto ? ChevronDown : ChevronRight;
  const righe = Children.toArray(children);
  return (
    <View>
      <Pressable
        onPress={onApriChiudi}
        accessibilityRole="button"
        accessibilityState={{ expanded: aperto }}
        accessibilityLabel={titolo}
        style={({ pressed }) => [stili.intestazione, pressed && { backgroundColor: c.sfondoHover }]}
      >
        <Freccia size={t(12)} color={c.testoTenue} strokeWidth={misura.tratto} />
        <Text allowFontScaling={false} style={[testo.titoloSezione, { color: c.testoTenue }]}>
          {titolo}
        </Text>
      </Pressable>
      <Tendina aperta={aperto && righe.length > 0}>
        <View style={[stili.riquadro, { backgroundColor: c.sfondoNota }]}>{righe}</View>
      </Tendina>
    </View>
  );
}

const stili = StyleSheet.create({
  // L'intestazione sta sopra il riquadro, allineata alle righe che ha dentro; spazio-elemento sotto.
  intestazione: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    height: misura.riga,
    marginBottom: spazio.elemento,
    paddingLeft: spazio.elenco + spazio.controllo,
    paddingRight: spazio.elenco + spazio.controlloPiccolo,
    borderRadius: raggio.pillola,
  },
  // Righe attaccate, senza spazio tra l'una e l'altra (DEC-161).
  riquadro: { borderRadius: raggio.contenitore, padding: spazio.elenco },
});
