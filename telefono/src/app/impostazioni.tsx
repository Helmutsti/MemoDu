// Impostazioni sul telefono (SC-06), dal tondo in cima alla colonna, con gli stessi testi e gli
// stessi stati del computer (client/src/schermate/Impostazioni.tsx): il riquadro dell'account
// (CMP-32, DEC-122) con iniziale, email, stato della sincronizzazione con il pallino del suo
// colore ed Esci, poi il nome del dispositivo e le righe che aprono Cambia password (SC-08) e
// Dispositivi collegati (SC-09); senza accesso «Non hai fatto l'accesso» e Accedi. Sotto, Generale
// con il tema (solo su questo telefono) e Ricerca con le note del cestino nei risultati
// (sincronizzata). Scorciatoia, avvio e primo piano restano solo sul computer.

import { router, Stack } from "expo-router";
import { User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { BarraInCima } from "@/componenti/BarraInCima";
import {
  GruppoImpostazioni,
  Interruttore,
  RigaImpostazione,
  SceltaSegmenti,
} from "@/componenti/PartiImpostazioni";
import { Pulsante } from "@/componenti/Pulsante";
import { orario, quando } from "@/dati/date";
import { useNegozio } from "@/dati/negozio";
import type { Problema } from "@/nucleo/sinc";
import { misura, raggio, spazio, t, testo, useColori } from "@/tema";

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

export default function Impostazioni() {
  const c = useColori();
  const scuro = c.sfondoNota !== "#FFFFFF";
  const {
    archivio,
    sessione,
    problema,
    ultimaRiuscita,
    esci,
    modificato,
    nomeDispositivo,
    cambiaNome,
    tema,
    impostaTema,
  } = useNegozio();
  const [uscendo, setUscendo] = useState(false);
  const [cestinoInRicerca, setCestinoInRicerca] = useState(true);
  useEffect(() => {
    void archivio?.cestinoInRicerca().then(setCestinoInRicerca);
  }, [archivio]);
  const stato = statoDelBox(problema, ultimaRiuscita);
  const pallino = COLORE_TONO[stato.tono][scuro ? "scuro" : "chiaro"];

  return (
    <View style={{ flex: 1, backgroundColor: c.sfondoColonna }}>
      <BarraInCima sfondo={c.sfondoColonna} titolo="Impostazioni" />
      <ScrollView contentContainerStyle={stili.contenuto} keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[stili.riquadro, { backgroundColor: c.sfondoNota }]}>
          <View style={stili.intestazione}>
            {sessione ? (
              <View
                style={[stili.iniziale, { backgroundColor: c.sfondoPieno }]}
                accessibilityElementsHidden
              >
                <Text
                  allowFontScaling={false}
                  style={[testo.titoloSchermata, { color: c.testoSuPieno }]}
                >
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
              <Text
                allowFontScaling={false}
                style={[testo.titolo, { color: c.testoPrimario }]}
                numberOfLines={sessione ? 1 : undefined}
              >
                {sessione ? sessione.email : "Non hai fatto l'accesso"}
              </Text>
              {sessione ? (
                <View style={stili.stato}>
                  <View style={[stili.pallino, { backgroundColor: pallino }]} />
                  <Text
                    allowFontScaling={false}
                    style={[testo.dettaglio, stili.testoStato, { color: c.testoTenue }]}
                  >
                    {stato.testo}
                  </Text>
                </View>
              ) : (
                <Text allowFontScaling={false} style={[testo.dettaglio, { color: c.testoTenue }]}>
                  Le note restano su questo telefono.
                </Text>
              )}
            </View>
            {/* Come nel box del computer: il pulsante a destra, nella stessa riga. */}
            {sessione && problema !== "rifiutate" ? (
              <Pulsante
                etichetta="Esci"
                inCorso={uscendo}
                onPress={() => {
                  setUscendo(true);
                  void esci().then(() => {
                    setUscendo(false);
                    router.replace("/accesso");
                  });
                }}
              />
            ) : (
              <Pulsante
                etichetta="Accedi"
                tipo="primario"
                onPress={() => router.push("/accesso")}
              />
            )}
          </View>
          {sessione ? (
            <>
              <View style={[stili.filo, { backgroundColor: c.bordoDivisoreTenue }]} />
              <RigaImpostazione
                etichetta="Nome del dispositivo"
                descrizione="Così lo riconosci tra i tuoi dispositivi."
                destra={
                  <TextInput
                    allowFontScaling={false}
                    defaultValue={nomeDispositivo}
                    onEndEditing={(e) => void cambiaNome(e.nativeEvent.text)}
                    returnKeyType="done"
                    autoCorrect={false}
                    accessibilityLabel="Nome del dispositivo"
                    style={[testo.controllo, stili.nome, { color: c.testoTenue }]}
                  />
                }
              />
              <View style={[stili.filo, { backgroundColor: c.bordoDivisoreTenue }]} />
              <RigaImpostazione
                etichetta="Cambia password"
                onPress={() => router.push("/cambia-password")}
              />
              <RigaImpostazione
                etichetta="Dispositivi collegati"
                onPress={() => router.push("/dispositivi")}
              />
            </>
          ) : null}
        </View>
        <GruppoImpostazioni titolo="Generale">
          <RigaImpostazione
            etichetta="Tema"
            destra={
              <SceltaSegmenti
                nome="Tema"
                opzioni={[
                  { valore: "sistema", etichetta: "Sistema" },
                  { valore: "chiaro", etichetta: "Chiaro" },
                  { valore: "scuro", etichetta: "Scuro" },
                ]}
                valore={tema}
                onScegli={(v) => void impostaTema(v)}
              />
            }
          />
        </GruppoImpostazioni>
        <GruppoImpostazioni titolo="Ricerca">
          <RigaImpostazione
            etichetta="Mostra le note del cestino nei risultati"
            destra={
              <Interruttore
                acceso={cestinoInRicerca}
                etichetta="Mostra le note del cestino nei risultati"
                onCambia={(v) => {
                  setCestinoInRicerca(v);
                  void archivio?.impostaCestinoInRicerca(v).then(modificato);
                }}
              />
            }
          />
        </GruppoImpostazioni>
      </ScrollView>
    </View>
  );
}

const stili = StyleSheet.create({
  contenuto: { padding: spazio.pannello, gap: spazio.blocco },
  riquadro: { borderRadius: raggio.contenitore, padding: spazio.elenco, gap: spazio.elemento },
  filo: { height: 1, marginHorizontal: spazio.controllo },
  nome: { minWidth: t(80), textAlign: "right", paddingVertical: 0 },
  intestazione: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.controllo,
    padding: spazio.controllo,
  },
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
