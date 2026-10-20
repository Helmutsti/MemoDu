// Le parti delle impostazioni del computer alla scala del telefono (DEC-161): gruppo con il titolo
// di sezione e le righe in un riquadro (CMP-31, DEC-122), riga di impostazione con etichetta,
// descrizione e controllo a destra (o la freccia, se apre una schermata), interruttore, scelta a
// segmenti, campo con l'etichetta sopra, casella e messaggio in linea in testo-errore (SC-08).

import { Check, ChevronRight, Eye, EyeOff } from "lucide-react-native";
import { Children, Fragment, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { misura, raggio, spazio, t, testo, useColori } from "@/tema";

export function GruppoImpostazioni({ titolo, children }: { titolo?: string; children: ReactNode }) {
  const c = useColori();
  const righe = Children.toArray(children).filter(Boolean);
  return (
    <View style={stili.gruppo}>
      {titolo ? (
        <Text
          allowFontScaling={false}
          accessibilityRole="header"
          style={[testo.titoloSezione, stili.titolo, { color: c.testoTenue }]}
        >
          {titolo}
        </Text>
      ) : null}
      <View style={[stili.riquadro, { backgroundColor: c.sfondoNota }]}>
        {righe.map((r, i) => (
          <Fragment key={i}>
            {i > 0 ? (
              <View style={[stili.filo, { backgroundColor: c.bordoDivisoreTenue }]} />
            ) : null}
            {r}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

export function RigaImpostazione({
  etichetta,
  descrizione,
  destra,
  onPress,
}: {
  etichetta: string;
  descrizione?: string;
  destra?: ReactNode;
  /** Apre una schermata: a destra la freccia. */
  onPress?: () => void;
}) {
  const c = useColori();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      style={({ pressed }) => [stili.riga, pressed && { backgroundColor: c.sfondoHover }]}
    >
      <View style={stili.testi}>
        <Text allowFontScaling={false} style={[testo.controllo, { color: c.testoPrimario }]}>
          {etichetta}
        </Text>
        {descrizione ? (
          <Text allowFontScaling={false} style={[testo.dettaglio, { color: c.testoTenue }]}>
            {descrizione}
          </Text>
        ) : null}
      </View>
      {destra}
      {onPress ? (
        <ChevronRight size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
      ) : null}
    </Pressable>
  );
}

export function Interruttore({
  acceso,
  etichetta,
  onCambia,
}: {
  acceso: boolean;
  etichetta: string;
  onCambia: (acceso: boolean) => void;
}) {
  const c = useColori();
  return (
    <Switch
      value={acceso}
      onValueChange={onCambia}
      accessibilityLabel={etichetta}
      trackColor={{ true: c.sfondoPieno, false: c.sfondoCampo }}
      thumbColor={c.sfondoNota}
      ios_backgroundColor={c.sfondoCampo}
    />
  );
}

export function SceltaSegmenti<T extends string>({
  nome,
  opzioni,
  valore,
  onScegli,
}: {
  nome: string;
  opzioni: { valore: T; etichetta: string }[];
  valore: T;
  onScegli: (v: T) => void;
}) {
  const c = useColori();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={nome}
      style={[stili.segmenti, { backgroundColor: c.sfondoCampo }]}
    >
      {opzioni.map((o) => {
        const scelto = o.valore === valore;
        return (
          <Pressable
            key={o.valore}
            onPress={() => onScegli(o.valore)}
            accessibilityRole="radio"
            accessibilityState={{ checked: scelto }}
            style={[stili.segmento, scelto && { backgroundColor: c.sfondoNota }]}
          >
            <Text
              allowFontScaling={false}
              style={[scelto ? testo.etichetta : testo.dettaglio, { color: c.testoPrimario }]}
            >
              {o.etichetta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CampoEtichettato({
  etichetta,
  valore,
  onCambia,
  password,
  autoComplete,
}: {
  etichetta: string;
  valore: string;
  onCambia: (v: string) => void;
  password?: boolean;
  autoComplete?: "current-password" | "new-password" | "off";
}) {
  const c = useColori();
  const [visibile, setVisibile] = useState(false);
  return (
    <View style={stili.campoGruppo}>
      <Text allowFontScaling={false} style={[testo.etichetta, { color: c.testoPrimario }]}>
        {etichetta}
      </Text>
      <View style={[stili.campo, { backgroundColor: c.sfondoCampo }]}>
        <TextInput
          allowFontScaling={false}
          value={valore}
          onChangeText={onCambia}
          secureTextEntry={password && !visibile}
          autoComplete={autoComplete}
          autoCapitalize={password ? "none" : "characters"}
          autoCorrect={false}
          accessibilityLabel={etichetta}
          style={[testo.controllo, stili.campoTesto, { color: c.testoPrimario }]}
        />
        {password ? (
          <Pressable
            onPress={() => setVisibile((v) => !v)}
            hitSlop={spazio.controllo}
            accessibilityRole="button"
            accessibilityLabel={visibile ? "Nascondi la password" : "Mostra la password"}
          >
            {visibile ? (
              <EyeOff size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
            ) : (
              <Eye size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function Casella({
  etichetta,
  spuntata,
  onCambia,
}: {
  etichetta: string;
  spuntata: boolean;
  onCambia: (v: boolean) => void;
}) {
  const c = useColori();
  return (
    <Pressable
      onPress={() => onCambia(!spuntata)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: spuntata }}
      style={stili.casellaRiga}
    >
      <View
        style={[
          stili.casella,
          spuntata
            ? { backgroundColor: c.sfondoPieno, borderColor: c.sfondoPieno }
            : { borderColor: c.iconaTenue },
        ]}
      >
        {spuntata ? <Check size={t(12)} color={c.iconaSuPieno} strokeWidth={2.5} /> : null}
      </View>
      <Text allowFontScaling={false} style={[testo.controllo, { color: c.testoPrimario }]}>
        {etichetta}
      </Text>
    </Pressable>
  );
}

export function MessaggioInLinea({ testo: messaggio }: { testo: string }) {
  const c = useColori();
  return (
    <Text
      allowFontScaling={false}
      accessibilityRole="alert"
      style={[testo.dettaglio, { color: c.testoErrore }]}
    >
      {messaggio}
    </Text>
  );
}

const stili = StyleSheet.create({
  gruppo: { gap: spazio.elemento },
  titolo: { paddingHorizontal: spazio.elenco + spazio.controllo, paddingVertical: spazio.elemento },
  riquadro: { borderRadius: raggio.contenitore, padding: spazio.elenco },
  filo: { height: 1, marginHorizontal: spazio.controllo },
  riga: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    minHeight: misura.riga,
    paddingHorizontal: spazio.controllo,
    paddingVertical: spazio.icona,
    borderRadius: raggio.interno,
  },
  testi: { flex: 1, gap: 2 },
  segmenti: { flexDirection: "row", padding: 2, borderRadius: raggio.pillola },
  segmento: {
    paddingHorizontal: spazio.controllo,
    paddingVertical: spazio.elemento + 2,
    borderRadius: raggio.pillola,
  },
  campoGruppo: { gap: spazio.elemento },
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    height: misura.riga,
    paddingHorizontal: spazio.controllo,
    borderRadius: raggio.pillola,
  },
  campoTesto: { flex: 1, paddingVertical: 0 },
  casellaRiga: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    minHeight: misura.riga,
  },
  casella: {
    width: t(16),
    height: t(16),
    borderWidth: 1.5,
    borderRadius: raggio.casella,
    alignItems: "center",
    justifyContent: "center",
  },
});
