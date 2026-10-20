// CMP-24 Info sul telefono, nel foglio dal basso (CMP-51), con le righe e i testi del computer:
// la cartella («Non organizzata» nella radice, altrimenti «Lavoro › Clienti»), la data di
// creazione, la fine validità, i tag; sotto l'ultima modifica e, separata, «Elimina», che manda
// la nota nel Cestino. Toccando la cartella si apre Sposta in…; date e tag per ora si leggono
// soltanto, cambiarli dal telefono arriva dopo.

import {
  Brain,
  Calendar,
  CircleAlert,
  Folder,
  Tag,
  Trash2,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Foglio } from "@/componenti/Foglio";
import { giornoDi, scriviGiorno, testoModificata } from "@/dati/date";
import type { Nota } from "@/nucleo/archivio";
import { misura, raggio, spazio, testo, useColori } from "@/tema";

function Riga({
  icona: Icona,
  onPress,
  nome,
  children,
}: {
  icona: LucideIcon;
  onPress?: () => void;
  nome?: string;
  children: React.ReactNode;
}) {
  const c = useColori();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={nome}
      style={({ pressed }) => [stili.riga, pressed && { backgroundColor: c.sfondoHover }]}
    >
      <Icona size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
      <View style={stili.testoRiga}>{children}</View>
    </Pressable>
  );
}

export function InfoNota({
  visibile,
  nota,
  cartella,
  onSposta,
  onSpostaInBrainet,
  onElimina,
  onChiudi,
}: {
  visibile: boolean;
  nota: Nota;
  /** Il percorso della cartella, «Lavoro/Clienti»; vuoto nella radice. */
  cartella: string;
  /** La riga della cartella apre Sposta in…, come sul computer. */
  onSposta: () => void;
  /** «Sposta in Brainet», solo con Brainet acceso e per una nota di CLOUD (RB-130, DEC-147). */
  onSpostaInBrainet?: () => void;
  onElimina: () => void;
  onChiudi: () => void;
}) {
  const c = useColori();
  const testoRiga = [testo.controllo, { color: c.testoPrimario }];
  const creata = nota.creata_scelta ? scriviGiorno(nota.creata_scelta) : giornoDi(nota.creata);
  return (
    <Foglio visibile={visibile} titolo="Info" onChiudi={onChiudi}>
      <View style={stili.righe}>
        <Riga
          icona={Folder}
          onPress={onSposta}
          nome={`Cartella ${cartella ? cartella.split("/").join(" › ") : "Non organizzata"}: Sposta in…`}
        >
          <Text allowFontScaling={false} style={testoRiga} numberOfLines={2}>
            {cartella ? cartella.split("/").join(" › ") : "Non organizzata"}
          </Text>
        </Riga>
        <Riga icona={Calendar}>
          <Text allowFontScaling={false} style={testoRiga}>
            Creata il {creata}
          </Text>
        </Riga>
        <Riga icona={CircleAlert}>
          <Text allowFontScaling={false} style={testoRiga}>
            {nota.fine_validita
              ? `Fine validità il ${scriviGiorno(nota.fine_validita)}`
              : "Nessuna fine validità"}
          </Text>
        </Riga>
        {nota.tag.length ? (
          <Riga icona={Tag}>
            <View style={stili.tag}>
              {nota.tag.map((nome) => (
                <View key={nome} style={[stili.pillola, { backgroundColor: c.sfondoCampo }]}>
                  <Text
                    allowFontScaling={false}
                    style={[testo.controllo, { color: c.testoPrimario }]}
                  >
                    {nome}
                  </Text>
                </View>
              ))}
            </View>
          </Riga>
        ) : null}
        <Text
          allowFontScaling={false}
          style={[testo.dettaglio, stili.modificata, { color: c.testoTenue }]}
        >
          {testoModificata(nota.modificata)}
        </Text>
      </View>
      <View style={[stili.separatore, { backgroundColor: c.bordoDivisoreTenue }]} />
      {onSpostaInBrainet ? (
        <Pressable
          onPress={onSpostaInBrainet}
          accessibilityRole="button"
          style={({ pressed }) => [stili.riga, pressed && { backgroundColor: c.sfondoHover }]}
        >
          <Brain size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
          <Text allowFontScaling={false} style={[testo.controllo, { color: c.testoPrimario }]}>
            Sposta in Brainet
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={onElimina}
        accessibilityRole="button"
        style={({ pressed }) => [stili.riga, pressed && { backgroundColor: c.sfondoHover }]}
      >
        <Trash2 size={misura.icona} color={c.testoErrore} strokeWidth={misura.tratto} />
        <Text allowFontScaling={false} style={[testo.controllo, { color: c.testoErrore }]}>
          Elimina
        </Text>
      </Pressable>
    </Foglio>
  );
}

const stili = StyleSheet.create({
  righe: { gap: 0 },
  riga: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    minHeight: misura.riga,
    paddingHorizontal: spazio.controllo,
    borderRadius: raggio.pillola,
  },
  testoRiga: { flex: 1, paddingVertical: spazio.elemento },
  tag: { flexDirection: "row", flexWrap: "wrap", gap: spazio.elemento },
  pillola: {
    paddingHorizontal: spazio.controlloPiccolo,
    paddingVertical: spazio.elemento,
    borderRadius: raggio.pillola,
  },
  modificata: { paddingHorizontal: spazio.controllo, paddingTop: spazio.elemento },
  separatore: { height: 1 },
});
