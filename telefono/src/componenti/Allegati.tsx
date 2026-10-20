// Gli allegati sul telefono (RF-18, passo 3 di Brainet, DEC-169), come nei mockup del 20/10/2026:
// il foglio «Allega» della graffetta con «Foto» e «File», il foglio di un allegato con il nome del
// file, «Apri», «Dimensioni» (solo per le foto su una riga loro: Piccola, Media, Grande, con la
// spunta) e «Togli», e l'avviso che scende in alto (CMP-57) per un file che non entra.

import {
  Check,
  CircleAlert,
  Eye,
  FileText,
  Image as IconaImmagine,
  Trash2,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { SlideInUp, SlideOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Foglio } from "@/componenti/Foglio";
import { misura, movimento, raggio, spazio, testo, useColori } from "@/tema";

export type FormaAllegato = "documento" | "bolla" | "piccola" | "media" | "grande";

/** Un allegato toccato nella nota: il suo segno. */
export interface AllegatoToccato {
  id: string;
  nome: string;
  forma: FormaAllegato;
}

const DIMENSIONI: { forma: FormaAllegato; etichetta: string }[] = [
  { forma: "piccola", etichetta: "Piccola" },
  { forma: "media", etichetta: "Media" },
  { forma: "grande", etichetta: "Grande" },
];
/** Quanto resta l'avviso prima di risalire da solo. */
const DURATA_AVVISO_MS = 4000;

function Voce({
  icona: Icona,
  etichetta,
  dopo,
  spunta,
  errore,
  onPress,
}: {
  icona?: LucideIcon;
  etichetta: string;
  dopo?: string;
  spunta?: boolean;
  errore?: boolean;
  onPress: () => void;
}) {
  const c = useColori();
  const colore = errore ? c.testoErrore : c.testoPrimario;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityState={spunta === undefined ? undefined : { checked: spunta }}
      style={({ pressed }) => [stili.voce, pressed && { backgroundColor: c.sfondoHover }]}
    >
      {Icona ? (
        <Icona
          size={misura.icona}
          color={errore ? c.testoErrore : c.iconaTenue}
          strokeWidth={misura.tratto}
        />
      ) : null}
      <Text allowFontScaling={false} style={[testo.controllo, stili.flessibile, { color: colore }]}>
        {etichetta}
      </Text>
      {dopo ? (
        <Text allowFontScaling={false} style={[testo.controllo, { color: c.testoTenue }]}>
          {dopo}
        </Text>
      ) : null}
      {spunta ? (
        <Check size={misura.icona} color={c.testoPrimario} strokeWidth={misura.tratto} />
      ) : null}
    </Pressable>
  );
}

/** La graffetta: «Foto» o «File» (RB-114). */
export function FoglioAllega({
  visibile,
  onFoto,
  onFile,
  onChiudi,
}: {
  visibile: boolean;
  onFoto: () => void;
  onFile: () => void;
  onChiudi: () => void;
}) {
  return (
    <Foglio visibile={visibile} titolo="Allega" onChiudi={onChiudi}>
      <Voce icona={IconaImmagine} etichetta="Foto" onPress={onFoto} />
      <Voce icona={FileText} etichetta="File" onPress={onFile} />
    </Foglio>
  );
}

/** Il tocco su un allegato (RB-119, RB-120, RB-121). */
export function FoglioAllegato({
  allegato,
  onApri,
  onForma,
  onTogli,
  onChiudi,
}: {
  allegato: AllegatoToccato | null;
  onApri: () => void;
  onForma: (forma: FormaAllegato) => void;
  onTogli: () => void;
  onChiudi: () => void;
}) {
  const c = useColori();
  const [dimensioni, setDimensioni] = useState(false);
  useEffect(() => setDimensioni(false), [allegato]);
  const a = allegato;
  const attuale = DIMENSIONI.find((d) => d.forma === a?.forma);
  return (
    <Foglio
      visibile={a !== null}
      titolo={dimensioni ? "Dimensioni" : (a?.nome ?? "")}
      onChiudi={onChiudi}
    >
      {a && dimensioni ? (
        DIMENSIONI.map((d) => (
          <Voce
            key={d.forma}
            etichetta={d.etichetta}
            spunta={d.forma === a.forma}
            onPress={() => onForma(d.forma)}
          />
        ))
      ) : a ? (
        <>
          <Voce icona={Eye} etichetta="Apri" onPress={onApri} />
          {/* Dimensioni solo per le foto fuori dal paragrafo (RB-120). */}
          {attuale ? (
            <Voce
              icona={IconaImmagine}
              etichetta="Dimensioni"
              dopo={attuale.etichetta}
              onPress={() => setDimensioni(true)}
            />
          ) : null}
          <View style={[stili.filo, { backgroundColor: c.bordoDivisoreTenue }]} />
          <Voce icona={Trash2} etichetta="Togli" errore onPress={onTogli} />
        </>
      ) : null}
    </Foglio>
  );
}

/** CMP-57: l'avviso del computer scende in alto e risale da solo, o toccandolo. */
export function AvvisoInAlto({
  testo: messaggio,
  onFine,
}: {
  testo: string | null;
  onFine: () => void;
}) {
  const c = useColori();
  const margini = useSafeAreaInsets();
  useEffect(() => {
    if (!messaggio) return;
    const t = setTimeout(onFine, DURATA_AVVISO_MS);
    return () => clearTimeout(t);
  }, [messaggio, onFine]);
  if (!messaggio) return null;
  return (
    <Animated.View
      entering={SlideInUp.duration(movimento.durataMedia)}
      exiting={SlideOutUp.duration(movimento.durataBreve)}
      style={[stili.avvisoPosto, { top: margini.top + spazio.elemento }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onFine}
        accessibilityRole="alert"
        style={[
          stili.avviso,
          { backgroundColor: c.sfondoFlottante, shadowOpacity: c.ombraOpacita },
        ]}
      >
        <CircleAlert size={misura.icona} color={c.iconaErrore} strokeWidth={misura.tratto} />
        <Text
          allowFontScaling={false}
          style={[testo.controllo, stili.flessibile, { color: c.testoPrimario }]}
        >
          {messaggio}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const stili = StyleSheet.create({
  voce: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    height: misura.riga,
    paddingHorizontal: spazio.controllo,
    borderRadius: raggio.pillola,
  },
  flessibile: { flex: 1 },
  filo: { height: 1, marginVertical: spazio.elemento },
  avvisoPosto: { position: "absolute", left: spazio.gruppo, right: spazio.gruppo, zIndex: 50 },
  avviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.controllo,
    padding: spazio.pannello,
    borderRadius: raggio.contenitore,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
  },
});
