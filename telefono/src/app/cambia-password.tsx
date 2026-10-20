// SC-08 Cambia password sul telefono (CMP-35, RB-98), con i campi e i testi del computer
// (client/src/componenti/CambiaPassword.tsx): la password attuale, o al suo posto la chiave di
// recupero; la password nuova due volte; la casella per scollegare gli altri dispositivi. Questo
// telefono resta collegato. Fatto con la chiave di recupero, mostra la chiave nuova una volta
// sola (RB-99): da lì non si torna indietro finché non si tocca «Ho conservato la chiave».
// Non c'è Annulla: si annulla con il tasto indietro.

import * as Clipboard from "expo-clipboard";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { BarraInCima } from "@/componenti/BarraInCima";
import { CampoEtichettato, Casella, MessaggioInLinea } from "@/componenti/PartiImpostazioni";
import { Pulsante } from "@/componenti/Pulsante";
import { useNegozio } from "@/dati/negozio";
import { cambiaPassword, type ErroreCambio } from "@/nucleo/accesso";
import { raggio, spazio, testo, useColori } from "@/tema";

const TESTO_PASSWORD_DIVERSE = "Le due password non sono uguali.";
const TESTO_CHIAVE_ERRATA = "Chiave di recupero non corretta.";
const TESTO_SERVER_IRRAGGIUNGIBILE = "Non riesco a raggiungere il server. Riprova tra poco.";

function testoErrore(e: ErroreCambio, conChiave: boolean): string {
  switch (e.tipo) {
    case "password":
      return e.testo;
    case "verifica":
      return conChiave ? TESTO_CHIAVE_ERRATA : "Password attuale non corretta.";
    case "accesso":
      return "Accedi di nuovo per sincronizzare.";
    default:
      return TESTO_SERVER_IRRAGGIUNGIBILE;
  }
}

export default function CambiaPassword() {
  const c = useColori();
  const { sessione } = useNegozio();
  const [conChiave, setConChiave] = useState(false);
  const [verifica, setVerifica] = useState("");
  const [nuova, setNuova] = useState("");
  const [ripetuta, setRipetuta] = useState("");
  const [scollega, setScollega] = useState(false);
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [chiaveNuova, setChiaveNuova] = useState<string | null>(null);
  const [copiata, setCopiata] = useState(false);

  const cambia = async () => {
    if (!sessione || inCorso) return;
    setErrore(null);
    if (nuova !== ripetuta) return setErrore(TESTO_PASSWORD_DIVERSE);
    setInCorso(true);
    try {
      const esito = await cambiaPassword(
        sessione,
        conChiave ? { chiaveRecupero: verifica } : { attuale: verifica },
        nuova,
        scollega,
      );
      if (esito.chiave) setChiaveNuova(esito.chiave);
      else router.back();
    } catch (e) {
      setErrore(testoErrore(e as ErroreCambio, conChiave));
    } finally {
      setInCorso(false);
    }
  };

  if (chiaveNuova)
    return (
      <View style={{ flex: 1, backgroundColor: c.sfondoColonna }}>
        <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
        <BarraInCima sfondo={c.sfondoColonna} indietro={false} />
        <View style={stili.contenuto}>
          <Text
            allowFontScaling={false}
            accessibilityRole="header"
            style={[testo.titoloSchermata, { color: c.testoPrimario }]}
          >
            La tua nuova chiave di recupero
          </Text>
          <Text allowFontScaling={false} style={[testo.messaggio, { color: c.testoTenue }]}>
            La vedi solo adesso. Conservala: ti serve se dimentichi la password. Quella di prima non
            vale più.
          </Text>
          <View style={[stili.chiave, { backgroundColor: c.sfondoCampo }]}>
            <Text
              allowFontScaling={false}
              selectable
              style={[testo.dettaglio, stili.chiaveTesto, { color: c.testoPrimario }]}
            >
              {chiaveNuova}
            </Text>
            <Pulsante
              etichetta={copiata ? "Copiata" : "Copia"}
              onPress={() =>
                void Clipboard.setStringAsync(chiaveNuova).then(() => setCopiata(true))
              }
            />
          </View>
          <Pulsante
            etichetta="Ho conservato la chiave"
            tipo="primario"
            largo
            onPress={() => router.back()}
          />
        </View>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: c.sfondoColonna }}>
      <Stack.Screen options={{ headerShown: false }} />
      <BarraInCima sfondo={c.sfondoColonna} titolo="Cambia password" />
      <KeyboardAwareScrollView
        contentContainerStyle={stili.contenuto}
        keyboardShouldPersistTaps="handled"
        bottomOffset={spazio.gruppo}
      >
        <CampoEtichettato
          key={conChiave ? "chiave" : "password"}
          etichetta={conChiave ? "Chiave di recupero" : "Password attuale"}
          password={!conChiave}
          autoComplete={conChiave ? "off" : "current-password"}
          valore={verifica}
          onCambia={setVerifica}
        />
        <View style={stili.inizio}>
          <Pulsante
            etichetta={conChiave ? "Usa la password attuale" : "Usa la chiave di recupero"}
            tipo="tenue"
            disabilitato={inCorso}
            onPress={() => {
              setConChiave((v) => !v);
              setVerifica("");
              setErrore(null);
            }}
          />
        </View>
        <CampoEtichettato
          etichetta="Password nuova"
          password
          autoComplete="new-password"
          valore={nuova}
          onCambia={setNuova}
        />
        <CampoEtichettato
          etichetta="Ripeti la password nuova"
          password
          autoComplete="new-password"
          valore={ripetuta}
          onCambia={setRipetuta}
        />
        <Casella
          etichetta="Scollega gli altri miei dispositivi"
          spuntata={scollega}
          onCambia={setScollega}
        />
        {errore ? <MessaggioInLinea testo={errore} /> : null}
        <Pulsante
          etichetta="Cambia password"
          tipo="primario"
          largo
          inCorso={inCorso}
          onPress={() => void cambia()}
        />
      </KeyboardAwareScrollView>
    </View>
  );
}

const stili = StyleSheet.create({
  contenuto: { padding: spazio.pannello, gap: spazio.blocco },
  inizio: { alignItems: "flex-start", marginTop: -spazio.icona },
  chiave: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    padding: spazio.controllo,
    borderRadius: raggio.interno,
  },
  chiaveTesto: { flex: 1 },
});
