// CMP-14 Albero delle cartelle a riquadro (DEC-154) con l'intestazione CMP-06 Sezione dentro,
// alla scala del telefono (DEC-157): sfondo-nota, raggio-contenitore, spazio-elemento in cima e
// spazio-elenco ai lati e in fondo; spazio-elemento tra le righe. Intestazione: freccia 16 in
// icona-tenue, nome in Interfaccia/Titolo, da chiuso il riassunto in Interfaccia/Dettaglio
// (DEC-155), il + in testo-primario a destra.

import { ChevronDown, ChevronRight, Plus } from "lucide-react-native";
import { Children, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { misura, raggio, spazio, testo, useColori } from "@/tema";

interface Proprieta {
  titolo: string;
  aperto: boolean;
  riassunto?: string;
  onApriChiudi: () => void;
  onAggiungi?: () => void;
  nomeAggiungi?: string;
  children?: ReactNode;
}

export function Riquadro({
  titolo,
  aperto,
  riassunto,
  onApriChiudi,
  onAggiungi,
  nomeAggiungi,
  children,
}: Proprieta) {
  const c = useColori();
  const Freccia = aperto ? ChevronDown : ChevronRight;
  const righe = Children.toArray(children);
  return (
    <View
      style={[
        stili.riquadro,
        {
          backgroundColor: c.sfondoNota,
          paddingBottom: aperto && righe.length ? spazio.elenco : spazio.elemento,
        },
      ]}
    >
      <Pressable
        onPress={onApriChiudi}
        accessibilityRole="button"
        accessibilityState={{ expanded: aperto }}
        accessibilityLabel={aperto || !riassunto ? titolo : `${titolo}, ${riassunto}`}
        style={({ pressed }) => [stili.intestazione, pressed && { backgroundColor: c.sfondoHover }]}
      >
        <View style={stili.titolo}>
          <Freccia size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
          <Text style={[testo.titolo, { color: c.testoPrimario }]}>{titolo}</Text>
          {!aperto && riassunto ? (
            <Text style={[testo.dettaglio, { color: c.testoTenue }]} numberOfLines={1}>
              {riassunto}
            </Text>
          ) : null}
        </View>
        {onAggiungi ? (
          <Pressable
            onPress={onAggiungi}
            hitSlop={spazio.controllo}
            accessibilityRole="button"
            accessibilityLabel={nomeAggiungi ?? "Aggiungi"}
          >
            <Plus size={misura.icona} color={c.testoPrimario} strokeWidth={misura.tratto} />
          </Pressable>
        ) : null}
      </Pressable>
      {aperto ? <View style={stili.righe}>{righe}</View> : null}
    </View>
  );
}

const stili = StyleSheet.create({
  riquadro: {
    borderRadius: raggio.contenitore,
    paddingTop: spazio.elemento,
    paddingHorizontal: spazio.elenco,
  },
  intestazione: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.elemento,
    height: misura.riga,
    paddingLeft: spazio.controllo,
    paddingRight: spazio.controlloPiccolo,
    borderRadius: raggio.pillola,
  },
  titolo: { flex: 1, flexDirection: "row", alignItems: "center", gap: spazio.icona },
  righe: { gap: spazio.elemento, marginTop: spazio.elemento },
});
