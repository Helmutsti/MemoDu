// CMP-10 Bollicina del formato, aperta, come barra sopra la tastiera (ID-54), alla scala del
// telefono (DEC-157): il cassetto è una pillola flottante con spazio-elemento di margine e tra
// gli strumenti (tondi alti 32, icona 16), divisori sottili tra i gruppi: riga (Testo normale,
// Titolo, Sottotitolo, Elenco puntato, Elenco numerato, Casella) e carattere (Grassetto, Corsivo,
// Barrato, Sottolineato). Scorre di lato se non ci sta. Accanto, un tondo con la freccia giù chiude
// la tastiera (sul telefono non c'è Esc), alto come il cassetto (scelta di Manuel Cucca del
// 20/10/2026, proposta A). Dopo i formati la graffetta apre «Allega» (DEC-169).

import {
  Bold,
  Brain,
  ChevronDown,
  Heading1,
  Heading2,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Paperclip,
  Strikethrough,
  Type,
  Underline,
  type LucideIcon,
} from "lucide-react-native";
import { Fragment } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import type { FormatoRiga, FormatoTesto } from "../../../client/src/editor/formati";
import { misura, opacitaDisabilitato, raggio, spazio, t, useColori } from "@/tema";

export type Voce = FormatoRiga | "testo" | FormatoTesto;

const GRUPPI: { voce: Voce; nome: string; icona: LucideIcon }[][] = [
  [
    { voce: "testo", nome: "Testo normale", icona: Type },
    { voce: "titolo", nome: "Titolo", icona: Heading1 },
    { voce: "sottotitolo", nome: "Sottotitolo", icona: Heading2 },
    { voce: "puntato", nome: "Elenco puntato", icona: List },
    { voce: "numerato", nome: "Elenco numerato", icona: ListOrdered },
    { voce: "checklist", nome: "Casella", icona: ListChecks },
  ],
  [
    { voce: "grassetto", nome: "Grassetto", icona: Bold },
    { voce: "corsivo", nome: "Corsivo", icona: Italic },
    { voce: "barrato", nome: "Barrato", icona: Strikethrough },
    { voce: "sottolineato", nome: "Sottolineato", icona: Underline },
  ],
];

export function BarraFormati({
  visibile,
  attivi,
  onFormato,
  onFine,
  sopra,
  brainet,
  onAllega,
}: {
  visibile: boolean;
  /** Le voci accese dove sta il cursore (CA-02.4). */
  attivi: Set<Voce>;
  onFormato: (v: Voce) => void;
  onFine: () => void;
  /** Sopra la barra: i suggerimenti di @ (Brainet, passo 2). */
  sopra?: React.ReactNode;
  /** Il tondo di Brainet in testa al cassetto: acceso su una frase selezionata o in un'area. */
  brainet?: { attivo: boolean; onPress: () => void } | null;
  /** La graffetta, dopo i formati: apre il foglio «Allega» (RB-114). */
  onAllega?: () => void;
}) {
  const c = useColori();
  const ombra = {
    shadowColor: "#000",
    shadowOpacity: c.ombraOpacita,
    shadowRadius: t(24) / 2,
    shadowOffset: { width: 0, height: t(8) },
  };
  return (
    <KeyboardStickyView
      offset={{ opened: -spazio.icona }}
      style={[stili.posto, !visibile && stili.nascosta]}
      pointerEvents={visibile ? "box-none" : "none"}
    >
      {sopra}
      <View style={stili.riga}>
        <View
          style={[stili.pillola, stili.cassetto, ombra, { backgroundColor: c.sfondoFlottante }]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
          >
            <View style={stili.strumenti}>
              {brainet ? (
                <>
                  <Pressable
                    onPress={brainet.onPress}
                    disabled={!brainet.attivo}
                    accessibilityRole="button"
                    accessibilityLabel="Area"
                    accessibilityState={{ disabled: !brainet.attivo }}
                    style={({ pressed }) => [
                      stili.strumento,
                      pressed && { backgroundColor: c.sfondoHover },
                      !brainet.attivo && { opacity: opacitaDisabilitato },
                    ]}
                  >
                    <Brain
                      size={misura.icona}
                      color={c.testoPrimario}
                      strokeWidth={misura.tratto}
                    />
                  </Pressable>
                  <View style={[stili.divisore, { backgroundColor: c.bordoDivisoreTenue }]} />
                </>
              ) : null}
              {GRUPPI.map((g, i) => (
                <Fragment key={i}>
                  {i > 0 ? (
                    <View style={[stili.divisore, { backgroundColor: c.bordoDivisoreTenue }]} />
                  ) : null}
                  {g.map(({ voce, nome, icona: Icona }) => (
                    <Pressable
                      key={voce}
                      onPress={() => onFormato(voce)}
                      accessibilityRole="button"
                      accessibilityLabel={nome}
                      accessibilityState={{ selected: attivi.has(voce) }}
                      style={({ pressed }) => [
                        stili.strumento,
                        (pressed || attivi.has(voce)) && { backgroundColor: c.sfondoHover },
                      ]}
                    >
                      <Icona
                        size={misura.icona}
                        color={c.testoPrimario}
                        strokeWidth={misura.tratto}
                      />
                    </Pressable>
                  ))}
                </Fragment>
              ))}
              {onAllega ? (
                <>
                  <View style={[stili.divisore, { backgroundColor: c.bordoDivisoreTenue }]} />
                  <Pressable
                    onPress={onAllega}
                    accessibilityRole="button"
                    accessibilityLabel="Allega"
                    style={({ pressed }) => [
                      stili.strumento,
                      pressed && { backgroundColor: c.sfondoHover },
                    ]}
                  >
                    <Paperclip
                      size={misura.icona}
                      color={c.testoPrimario}
                      strokeWidth={misura.tratto}
                    />
                  </Pressable>
                </>
              ) : null}
            </View>
          </ScrollView>
        </View>
        <Pressable
          onPress={onFine}
          accessibilityRole="button"
          accessibilityLabel="Chiudi la tastiera"
          style={({ pressed }) => [
            stili.chiudi,
            ombra,
            { backgroundColor: pressed ? c.sfondoHover : c.sfondoFlottante },
          ]}
        >
          <ChevronDown size={misura.icona} color={c.testoPrimario} strokeWidth={misura.tratto} />
        </Pressable>
      </View>
    </KeyboardStickyView>
  );
}

const STRUMENTO = t(32);

const stili = StyleSheet.create({
  posto: {
    position: "absolute",
    left: spazio.icona,
    right: spazio.icona,
    bottom: 0,
    gap: spazio.icona,
  },
  riga: { flexDirection: "row", gap: spazio.icona },
  nascosta: { opacity: 0 },
  pillola: { borderRadius: raggio.pillola, padding: spazio.elemento },
  cassetto: { flex: 1, overflow: "visible" },
  strumenti: { flexDirection: "row", alignItems: "center", gap: spazio.elemento },
  strumento: {
    width: STRUMENTO,
    height: STRUMENTO,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raggio.pillola,
  },
  divisore: { width: 1, height: STRUMENTO - spazio.icona * 2, marginHorizontal: spazio.elemento },
  // Tondo alto come il cassetto: lo strumento più il margine sopra e sotto.
  chiudi: {
    width: STRUMENTO + spazio.elemento * 2,
    height: STRUMENTO + spazio.elemento * 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raggio.pillola,
  },
});
