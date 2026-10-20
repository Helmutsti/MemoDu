// CMP-11 Pannello, variante Sposta in, sul telefono: nel foglio dal basso (CMP-51) la ricerca
// «Cerca una cartella» e sotto CLOUD (la radice) e l'albero delle cartelle, con spazio-rientro
// per livello e la spunta sulla cartella attuale. Scrivendo si filtra; un tocco sposta e chiude.

import { Check, Folder, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Foglio } from "@/componenti/Foglio";
import type { Cartella } from "@/nucleo/archivio";
import { misura, raggio, spazio, t, testo, useColori } from "@/tema";

const alfabetico = (a: string, b: string) => a.localeCompare(b, "it", { sensitivity: "base" });

export function SpostaIn({
  visibile,
  cartelle,
  attuale,
  onScegli,
  onChiudi,
}: {
  visibile: boolean;
  /** Le cartelle fuori dal cestino. */
  cartelle: Cartella[];
  attuale: string | null;
  onScegli: (cartella: string | null) => void;
  onChiudi: () => void;
}) {
  const c = useColori();
  const [filtro, setFiltro] = useState("");
  const voci = useMemo(() => {
    const albero: { id: string | null; nome: string; livello: number }[] = [
      { id: null, nome: "CLOUD", livello: 0 },
    ];
    const giu = (madre: string | null, livello: number) => {
      for (const x of cartelle
        .filter((x) => x.madre === madre)
        .sort((a, b) => alfabetico(a.nome, b.nome))) {
        albero.push({ id: x.id, nome: x.nome, livello });
        giu(x.id, livello + 1);
      }
    };
    giu(null, 0);
    const f = filtro.trim().toLowerCase();
    return f ? albero.filter((v) => v.nome.toLowerCase().includes(f)) : albero;
  }, [cartelle, filtro]);
  return (
    <Foglio visibile={visibile} titolo="Sposta in" onChiudi={onChiudi}>
      <View style={[stili.campo, { backgroundColor: c.sfondoCampo }]}>
        <Search size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
        <TextInput
          allowFontScaling={false}
          value={filtro}
          onChangeText={setFiltro}
          placeholder="Cerca una cartella"
          placeholderTextColor={c.testoTenue}
          accessibilityLabel="Cerca una cartella"
          autoCorrect={false}
          style={[testo.controllo, stili.testo, { color: c.testoPrimario }]}
        />
      </View>
      <ScrollView style={stili.elenco} keyboardShouldPersistTaps="handled">
        {voci.map((v) => (
          <Pressable
            key={v.id ?? "cloud"}
            onPress={() => onScegli(v.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: v.id === attuale }}
            style={({ pressed }) => [
              stili.voce,
              { paddingLeft: spazio.controllo + (filtro ? 0 : v.livello * spazio.rientro) },
              pressed && { backgroundColor: c.sfondoHover },
            ]}
          >
            {v.id ? (
              <Folder size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
            ) : null}
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={[testo.controllo, stili.testo, { color: c.testoPrimario }]}
            >
              {v.nome}
            </Text>
            {v.id === attuale ? (
              <Check size={misura.icona} color={c.testoPrimario} strokeWidth={misura.tratto} />
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </Foglio>
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
  elenco: { maxHeight: t(320) },
  voce: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    height: misura.riga,
    paddingRight: spazio.controllo,
    borderRadius: raggio.pillola,
  },
});
