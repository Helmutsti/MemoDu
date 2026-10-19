// Accesso (CMP-22 Modulo di accesso, RF-14) alla scala del telefono (DEC-157), con gli stessi
// testi del computer (client/src/componenti/ModuloAccesso.tsx): email e password, «Accedi» e «Non
// voglio usare il cloud» (DEC-84). La password non lascia il telefono: da lei si ricava la prova
// di accesso (Argon2id, qualche secondo). Il recupero dell'account arriva dopo.

import { router } from "expo-router";
import { CircleAlert } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pulsante } from "@/componenti/Pulsante";
import { useNegozio } from "@/dati/negozio";
import { misura, raggio, spazio, t, testo, useColori } from "@/tema";

function Campo({
  etichetta,
  valore,
  onCambia,
  password,
  invalido,
}: {
  etichetta: string;
  valore: string;
  onCambia: (v: string) => void;
  password?: boolean;
  invalido?: boolean;
}) {
  const c = useColori();
  return (
    <View style={stili.campo}>
      <Text allowFontScaling={false} style={[testo.etichetta, { color: c.testoTenue }]}>
        {etichetta}
      </Text>
      <TextInput
        allowFontScaling={false}
        value={valore}
        onChangeText={onCambia}
        secureTextEntry={password}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={password ? "default" : "email-address"}
        textContentType={password ? "password" : "username"}
        autoComplete={password ? "current-password" : "email"}
        accessibilityLabel={etichetta}
        style={[
          testo.controllo,
          stili.input,
          { backgroundColor: c.sfondoCampo, color: c.testoPrimario },
          invalido && { borderColor: c.iconaErrore, borderWidth: 1.5 },
        ]}
      />
    </View>
  );
}

export default function Accesso() {
  const c = useColori();
  const margini = useSafeAreaInsets();
  const { accedi, usaSenzaCloud } = useNegozio();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const credenzialiErrate = errore === "Email o password non corrette.";

  const vai = async () => {
    if (!email.trim() || !password) return;
    setInCorso(true);
    setErrore(null);
    const messaggio = await accedi(email, password);
    setInCorso(false);
    if (messaggio) setErrore(messaggio);
    else router.replace("/");
  };

  return (
    <KeyboardAwareScrollView
      style={{ backgroundColor: c.sfondoColonna }}
      contentContainerStyle={[stili.contenuto, { paddingTop: margini.top + t(48) }]}
      keyboardShouldPersistTaps="handled"
      bottomOffset={spazio.gruppo}
    >
      <Text
        allowFontScaling={false}
        style={[testo.titoloSchermata, { color: c.testoPrimario }]}
        accessibilityRole="header"
      >
        Accedi a Memodu
      </Text>
      <Text allowFontScaling={false} style={[testo.messaggio, { color: c.testoTenue }]}>
        Accedi alla tua installazione.
      </Text>
      <View style={stili.campi}>
        <Campo etichetta="Email" valore={email} onCambia={setEmail} invalido={credenzialiErrate} />
        <Campo
          etichetta="Password"
          valore={password}
          onCambia={setPassword}
          password
          invalido={credenzialiErrate}
        />
      </View>
      {errore ? (
        <View style={stili.errore} accessibilityLiveRegion="polite">
          <CircleAlert size={misura.icona} color={c.iconaErrore} strokeWidth={misura.tratto} />
          <Text
            allowFontScaling={false}
            style={[testo.messaggio, stili.testoErrore, { color: c.testoErrore }]}
          >
            {errore}
          </Text>
        </View>
      ) : null}
      <View style={stili.pulsanti}>
        <Pulsante
          etichetta="Accedi"
          tipo="primario"
          largo
          inCorso={inCorso}
          onPress={() => void vai()}
          disabilitato={!email.trim() || !password}
        />
        <Pulsante
          etichetta="Non voglio usare il cloud"
          largo
          disabilitato={inCorso}
          onPress={() => {
            void usaSenzaCloud().then(() => router.replace("/"));
          }}
        />
      </View>
    </KeyboardAwareScrollView>
  );
}

const stili = StyleSheet.create({
  contenuto: {
    paddingHorizontal: spazio.finestra,
    paddingBottom: spazio.gruppo,
    gap: spazio.icona,
  },
  campi: { gap: spazio.blocco, marginTop: spazio.gruppo },
  campo: { gap: spazio.elemento },
  input: { height: misura.riga, paddingHorizontal: spazio.controllo, borderRadius: raggio.pillola },
  errore: {
    flexDirection: "row",
    gap: spazio.icona,
    alignItems: "flex-start",
    marginTop: spazio.blocco,
  },
  testoErrore: { flex: 1 },
  pulsanti: { gap: spazio.icona, marginTop: spazio.gruppo },
  pulsante: {
    height: t(40),
    borderRadius: raggio.pillola,
    alignItems: "center",
    justifyContent: "center",
  },
});
