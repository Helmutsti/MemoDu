// Impostazioni sul telefono (SC-06), dal tondo in fondo alla colonna. Per ora il riquadro
// dell'account (CMP-32, DEC-122) con gli stessi testi e gli stessi stati del computer
// (client/src/componenti/BoxAccount.tsx): iniziale, email, stato della sincronizzazione con il
// pallino del suo colore, Esci; senza accesso «Non hai fatto l'accesso» e Accedi. Il resto delle
// impostazioni (tema, ricerca, nome del dispositivo) arriva dopo.

import { router, Stack } from "expo-router";
import { User } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { orario, quando } from "@/dati/date";
import { useNegozio } from "@/dati/negozio";
import type { Problema } from "@/nucleo/sinc";
import { misura, raggio, spazio, t, testo, useColori, type Colori } from "@/tema";

type Tono = "attesa" | "successo" | "avviso" | "errore";

function statoDelBox(
  problema: Problema | null,
  ultima: string | null,
): { testo: string; tono: Tono } {
  switch (problema) {
    case "rete":
      return {
        testo: ultima
          ? `Server non raggiungibile: ultimo backup ${orario(ultima)}`
          : "Server non raggiungibile",
        tono: "avviso",
      };
    case "errore":
      return { testo: "Non riuscita: riprovo da sola", tono: "avviso" };
    case "rifiutate":
      return { testo: "Accedi di nuovo per sincronizzare", tono: "errore" };
    case "protocollo":
      return { testo: "Memodu e il server hanno versioni diverse", tono: "errore" };
    default:
      return ultima
        ? { testo: `Sincronizzata · ${quando(ultima)}`, tono: "successo" }
        : { testo: "In attesa della prima sincronizzazione", tono: "attesa" };
  }
}

// I colori di stato (DEC-14): icona-successo, icona-avviso, icona-errore; in attesa icona-tenue.
const COLORE_TONO: Record<Tono, { chiaro: string; scuro: string }> = {
  successo: { chiaro: "#047F39", scuro: "#58BC72" },
  avviso: { chiaro: "#915C02", scuro: "#DE8F0F" },
  errore: { chiaro: "#BE232A", scuro: "#FE6F69" },
  attesa: { chiaro: "#696969", scuro: "#A3A3A3" },
};

function Pulsante({
  etichetta,
  pieno,
  inCorso,
  onPress,
  c,
}: {
  etichetta: string;
  pieno?: boolean;
  inCorso?: boolean;
  onPress: () => void;
  c: Colori;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={inCorso}
      accessibilityRole="button"
      style={({ pressed }) => [
        stili.pulsante,
        { backgroundColor: pieno ? c.sfondoPieno : pressed ? c.sfondoPremuto : c.sfondoCampo },
        pressed && pieno && { opacity: 0.8 },
      ]}
    >
      {inCorso ? (
        <ActivityIndicator color={pieno ? c.testoSuPieno : c.testoPrimario} />
      ) : (
        <Text style={[testo.titolo, { color: pieno ? c.testoSuPieno : c.testoPrimario }]}>
          {etichetta}
        </Text>
      )}
    </Pressable>
  );
}

export default function Impostazioni() {
  const c = useColori();
  const scuro = c.sfondoNota !== "#FFFFFF";
  const { sessione, problema, ultimaRiuscita, esci } = useNegozio();
  const [uscendo, setUscendo] = useState(false);
  const stato = statoDelBox(problema, ultimaRiuscita);
  const pallino = COLORE_TONO[stato.tono][scuro ? "scuro" : "chiaro"];

  return (
    <ScrollView
      style={{ backgroundColor: c.sfondoColonna }}
      contentContainerStyle={stili.contenuto}
    >
      <Stack.Screen
        options={{
          title: "Impostazioni",
          headerBackTitle: "Memodu",
          headerStyle: { backgroundColor: c.sfondoColonna },
        }}
      />
      <View style={[stili.riquadro, { backgroundColor: c.sfondoNota }]}>
        <View style={stili.intestazione}>
          {sessione ? (
            <View
              style={[stili.iniziale, { backgroundColor: c.sfondoPieno }]}
              accessibilityElementsHidden
            >
              <Text style={[testo.titoloSchermata, { color: c.testoSuPieno }]}>
                {sessione.email.charAt(0).toUpperCase()}
              </Text>
            </View>
          ) : (
            <View
              style={[stili.iniziale, { backgroundColor: c.sfondoCampo }]}
              accessibilityElementsHidden
            >
              <User size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
            </View>
          )}
          <View style={stili.testi}>
            <Text style={[testo.titolo, { color: c.testoPrimario }]} numberOfLines={1}>
              {sessione ? sessione.email : "Non hai fatto l'accesso"}
            </Text>
            {sessione ? (
              <View style={stili.stato}>
                <View style={[stili.pallino, { backgroundColor: pallino }]} />
                <Text style={[testo.dettaglio, stili.testoStato, { color: c.testoTenue }]}>
                  {stato.testo}
                </Text>
              </View>
            ) : (
              <Text style={[testo.dettaglio, { color: c.testoTenue }]}>
                Le note restano su questo telefono.
              </Text>
            )}
          </View>
        </View>
        {sessione && problema !== "rifiutate" ? (
          <Pulsante
            etichetta="Esci"
            inCorso={uscendo}
            c={c}
            onPress={() => {
              setUscendo(true);
              void esci().then(() => {
                setUscendo(false);
                router.replace("/accesso");
              });
            }}
          />
        ) : (
          <Pulsante etichetta="Accedi" pieno c={c} onPress={() => router.push("/accesso")} />
        )}
      </View>
    </ScrollView>
  );
}

const stili = StyleSheet.create({
  contenuto: { padding: spazio.pannello, gap: spazio.blocco },
  riquadro: { borderRadius: raggio.contenitore, padding: spazio.pannello, gap: spazio.blocco },
  intestazione: { flexDirection: "row", alignItems: "center", gap: spazio.controllo },
  iniziale: {
    width: t(40),
    height: t(40),
    borderRadius: raggio.pillola,
    alignItems: "center",
    justifyContent: "center",
  },
  testi: { flex: 1, gap: spazio.elemento },
  stato: { flexDirection: "row", alignItems: "center", gap: spazio.icona },
  pallino: { width: t(8), height: t(8), borderRadius: raggio.pillola },
  testoStato: { flex: 1 },
  pulsante: {
    height: t(40),
    borderRadius: raggio.pillola,
    alignItems: "center",
    justifyContent: "center",
  },
});
