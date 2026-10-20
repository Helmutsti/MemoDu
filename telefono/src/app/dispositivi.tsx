// SC-09 Dispositivi collegati sul telefono (CMP-36, RB-100), con i testi del computer
// (client/src/componenti/DispositiviCollegati.tsx): i dispositivi dell'account in un riquadro,
// con nome, tipo e ultima sincronizzazione. Questo telefono è il primo, senza «Scollega» (si esce
// con Esci, RB-89). «Scollega» chiede conferma nella riga stessa; dopo, la riga sparisce. Senza
// server un messaggio in linea al posto dell'elenco.

import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BarraInCima } from "@/componenti/BarraInCima";
import { MessaggioInLinea } from "@/componenti/PartiImpostazioni";
import { Pulsante } from "@/componenti/Pulsante";
import { quando } from "@/dati/date";
import { useNegozio } from "@/dati/negozio";
import { elencaDispositivi, scollegaDispositivo, type Dispositivo } from "@/nucleo/accesso";
import { raggio, spazio, testo, useColori } from "@/tema";

const TESTO_ELENCO_IRRAGGIUNGIBILE = "Server non raggiungibile. Riprova tra poco.";

/** Il nome da mostrare: quello scelto, o il tipo se il dispositivo non l'ha ancora mandato. */
const nomeDi = (d: Dispositivo) =>
  d.nome ?? (d.tipo === "ios" ? "iPhone" : d.tipo === "macos" ? "Mac" : "PC Windows");
const tipoDi = (d: Dispositivo) =>
  d.tipo === "ios" ? "iOS" : d.tipo === "macos" ? "macOS" : "Windows";

function dettaglio(d: Dispositivo): string {
  if (d.questo) return `${tipoDi(d)} · questo dispositivo`;
  if (!d.ultimaSincronizzazione) return `${tipoDi(d)} · non ancora sincronizzato`;
  return `${tipoDi(d)} · sincronizzato ${quando(d.ultimaSincronizzazione)}`;
}

export default function Dispositivi() {
  const c = useColori();
  const { sessione } = useNegozio();
  const [elenco, setElenco] = useState<Dispositivo[] | null>(null);
  const [errore, setErrore] = useState(false);
  const [daConfermare, setDaConfermare] = useState<string | null>(null);
  const [inCorso, setInCorso] = useState(false);

  useEffect(() => {
    if (sessione) elencaDispositivi(sessione).then(setElenco, () => setErrore(true));
  }, [sessione]);

  const scollega = async (id: string) => {
    if (!sessione) return;
    setInCorso(true);
    try {
      await scollegaDispositivo(sessione, id);
      setElenco((e) => e?.filter((d) => d.id !== id) ?? null);
      setDaConfermare(null);
    } catch {
      setErrore(true);
    } finally {
      setInCorso(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.sfondoColonna }}>
      <Stack.Screen options={{ headerShown: false }} />
      <BarraInCima sfondo={c.sfondoColonna} titolo="Dispositivi collegati" />
      <ScrollView contentContainerStyle={stili.contenuto}>
        <Text allowFontScaling={false} style={[testo.messaggio, { color: c.testoTenue }]}>
          {errore
            ? "Scollega un dispositivo perso o che non usi più."
            : "Scollega un dispositivo perso o che non usi più. Le note su quel dispositivo restano, ma non si sincronizzano più."}
        </Text>
        {errore ? (
          <MessaggioInLinea testo={TESTO_ELENCO_IRRAGGIUNGIBILE} />
        ) : elenco ? (
          <View style={[stili.riquadro, { backgroundColor: c.sfondoNota }]}>
            {elenco.map((d, i) => (
              <View key={d.id}>
                {i > 0 ? (
                  <View style={[stili.filo, { backgroundColor: c.bordoDivisoreTenue }]} />
                ) : null}
                {daConfermare === d.id ? (
                  <View style={stili.riga} accessibilityLabel={`Scollegare ${nomeDi(d)}`}>
                    <View style={stili.testi}>
                      <Text
                        allowFontScaling={false}
                        style={[testo.controllo, { color: c.testoPrimario }]}
                      >
                        {`Scollegare «${nomeDi(d)}»?`}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={[testo.dettaglio, { color: c.testoTenue }]}
                      >
                        Le note su quel dispositivo restano, ma non si sincronizzano più.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={stili.riga}>
                    <View style={stili.testi}>
                      <Text
                        allowFontScaling={false}
                        style={[testo.controllo, { color: c.testoPrimario }]}
                      >
                        {nomeDi(d)}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={[testo.dettaglio, { color: c.testoTenue }]}
                      >
                        {dettaglio(d)}
                      </Text>
                    </View>
                    {d.questo ? null : (
                      <Pulsante
                        etichetta="Scollega"
                        disabilitato={inCorso}
                        onPress={() => setDaConfermare(d.id)}
                      />
                    )}
                  </View>
                )}
                {daConfermare === d.id ? (
                  <View style={stili.azioni}>
                    <View style={stili.meta}>
                      <Pulsante
                        etichetta="Annulla"
                        largo
                        disabilitato={inCorso}
                        onPress={() => setDaConfermare(null)}
                      />
                    </View>
                    <View style={stili.meta}>
                      <Pulsante
                        etichetta="Scollega"
                        tipo="primario"
                        largo
                        inCorso={inCorso}
                        onPress={() => void scollega(d.id)}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const stili = StyleSheet.create({
  contenuto: { padding: spazio.pannello, gap: spazio.blocco },
  riquadro: { borderRadius: raggio.contenitore, padding: spazio.elenco },
  filo: { height: 1, marginHorizontal: spazio.controllo },
  riga: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    paddingHorizontal: spazio.controllo,
    paddingVertical: spazio.icona,
  },
  testi: { flex: 1, gap: 2 },
  azioni: {
    flexDirection: "row",
    gap: spazio.icona,
    paddingHorizontal: spazio.controllo,
    paddingBottom: spazio.icona,
  },
  meta: { flex: 1 },
});
