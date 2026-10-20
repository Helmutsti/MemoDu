// SC-11 Entità sul telefono (RF-18), dalla riga Entità del riquadro Brainet: un gruppo per tipo
// nell'ordine di @ (Persone, Argomenti, Eventi, Oggetti, Senza tipo), i gruppi vuoti non si
// vedono; le persone come volti (CMP-46), gli altri in righe (CMP-41) con la lampadina per gli
// argomenti e il calendario per gli eventi, e «nominato 3 volte · ultima volta oggi». Un tocco
// apre la pagina dell'entità. Tenendola premuta: «Unisci a…» e «Scegli una foto…» (passo 2).

import { router, Stack } from "expo-router";
import {
  Brain,
  Calendar,
  ChevronRight,
  Image as ImageIcon,
  Lightbulb,
  Merge,
  type LucideIcon,
} from "lucide-react-native";
import { Fragment, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from "react-native";
import { FoglioUnisci, scegliFoto } from "@/componenti/AzioniEntita";
import { MenuRiga } from "@/componenti/MenuRiga";
import type { Rettangolo } from "@/componenti/Righe";
import { useNegozio } from "@/dati/negozio";
import { BarraInCima } from "@/componenti/BarraInCima";
import { dettagliEntita, TITOLO_TIPO, Volto } from "@/componenti/Brainet";
import { useDatiBrainet } from "@/dati/brainet";
import {
  elencoEntita,
  type Entita as EntitaBrainet,
  type TipoEntita,
  type VoceEntita,
} from "@/nucleo/brainet";
import { misura, raggio, spazio, t, testo, useColori } from "@/tema";

const TIPI: (TipoEntita | "nessuno")[] = ["persona", "argomento", "evento", "oggetto", "nessuno"];
const ICONA: Partial<Record<TipoEntita, LucideIcon>> = { argomento: Lightbulb, evento: Calendar };

const apri = (id: string) => router.push({ pathname: "/entita/[id]", params: { id } });

export default function Entita() {
  const c = useColori();
  const dati = useDatiBrainet();
  const { archivio, modificato } = useNegozio();
  const schermo = useWindowDimensions();
  const [menu, setMenu] = useState<{ ancora: Rettangolo; entita: EntitaBrainet } | null>(null);
  const [unisci, setUnisci] = useState<EntitaBrainet | null>(null);
  /** Tenendo premuta un'entità, il suo menu accanto al dito (CMP-53). */
  const tieni = (e: EntitaBrainet) => (ev: GestureResponderEvent) =>
    setMenu({
      entita: e,
      ancora: {
        x: spazio.pannello,
        y: ev.nativeEvent.pageY - misura.riga / 2,
        larghezza: schermo.width - spazio.pannello * 2,
        altezza: misura.riga,
      },
    });
  const foto = async (e: EntitaBrainet) => {
    const scelta = await scegliFoto();
    if (scelta) await archivio?.impostaFoto(e.id, scelta);
    modificato();
  };
  const voci = dati ? elencoEntita(dati.note, dati.entita) : [];
  const perTipo = (tipo: TipoEntita | "nessuno") =>
    voci.filter((v) => (v.entita.tipo ?? "nessuno") === tipo);
  const titolo = (s: string) => (
    <Text
      allowFontScaling={false}
      accessibilityRole="header"
      style={[testo.titoloSezione, stili.titolo, { color: c.testoTenue }]}
    >
      {s}
    </Text>
  );
  const riga = (v: VoceEntita, i: number) => {
    const Icona = v.entita.tipo ? ICONA[v.entita.tipo] : undefined;
    return (
      <Fragment key={v.entita.id}>
        {i > 0 ? <View style={[stili.filo, { backgroundColor: c.bordoDivisoreTenue }]} /> : null}
        <Pressable
          onPress={() => apri(v.entita.id)}
          onLongPress={tieni(v.entita)}
          accessibilityRole="button"
          style={({ pressed }) => [stili.riga, pressed && { backgroundColor: c.sfondoHover }]}
        >
          {Icona ? (
            <View style={[stili.icona, { backgroundColor: c.sfondoCampo }]}>
              <Icona size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
            </View>
          ) : null}
          <View style={stili.testi}>
            <Text allowFontScaling={false} style={[testo.controllo, { color: c.testoPrimario }]}>
              {v.entita.nome}
            </Text>
            <Text allowFontScaling={false} style={[testo.dettaglio, { color: c.testoTenue }]}>
              {dettagliEntita(v)}
            </Text>
          </View>
          <ChevronRight size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
        </Pressable>
      </Fragment>
    );
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.sfondoColonna }}>
      <Stack.Screen options={{ headerShown: false }} />
      <BarraInCima sfondo={c.sfondoColonna} titolo="Entità" />
      <ScrollView contentContainerStyle={stili.contenuto}>
        {dati && !voci.length ? (
          <View style={stili.vuoto}>
            <Brain size={misura.icona + 4} color={c.iconaTenue} strokeWidth={misura.tratto} />
            <Text allowFontScaling={false} style={[testo.titolo, { color: c.testoPrimario }]}>
              Nessuna entità
            </Text>
            <Text allowFontScaling={false} style={[testo.messaggio, { color: c.testoTenue }]}>
              Nascono quando scrivi @ in una nota.
            </Text>
          </View>
        ) : null}
        {TIPI.map((tipo) => {
          const lista = perTipo(tipo);
          if (!lista.length) return null;
          return (
            <View key={tipo} style={stili.gruppo}>
              {titolo(TITOLO_TIPO[tipo])}
              {tipo === "persona" ? (
                <View style={stili.volti}>
                  {lista.map((v) => (
                    <Pressable
                      key={v.entita.id}
                      onPress={() => apri(v.entita.id)}
                      onLongPress={tieni(v.entita)}
                      accessibilityRole="button"
                      accessibilityLabel={`${v.entita.nome}, ${dettagliEntita(v)}`}
                      style={({ pressed }) => [
                        stili.volto,
                        pressed && { backgroundColor: c.sfondoHover },
                      ]}
                    >
                      <Volto entita={v.entita} />
                      <Text
                        allowFontScaling={false}
                        numberOfLines={2}
                        style={[testo.controllo, stili.nomeVolto, { color: c.testoPrimario }]}
                      >
                        {v.entita.nome}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={[stili.riquadro, { backgroundColor: c.sfondoNota }]}>
                  {lista.map(riga)}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
      <MenuRiga
        ancora={menu?.ancora ?? null}
        riga={
          menu ? (
            <Text
              allowFontScaling={false}
              style={[testo.controllo, stili.sollevata, { color: c.testoPrimario }]}
            >
              {menu.entita.nome}
            </Text>
          ) : null
        }
        voci={
          menu
            ? [
                { etichetta: "Unisci a…", icona: Merge, onPress: () => setUnisci(menu.entita) },
                {
                  etichetta: "Scegli una foto…",
                  icona: ImageIcon,
                  onPress: () => void foto(menu.entita),
                },
              ]
            : []
        }
        onChiudi={() => setMenu(null)}
      />
      {dati ? (
        <FoglioUnisci
          da={unisci}
          entita={dati.entita}
          note={dati.note}
          onChiudi={() => setUnisci(null)}
        />
      ) : null}
    </View>
  );
}

const stili = StyleSheet.create({
  contenuto: { padding: spazio.pannello, gap: spazio.blocco },
  gruppo: { gap: spazio.elemento },
  titolo: { paddingHorizontal: spazio.elenco + spazio.controllo, paddingVertical: spazio.elemento },
  volti: { flexDirection: "row", flexWrap: "wrap" },
  volto: {
    width: t(96),
    alignItems: "center",
    gap: spazio.icona,
    padding: spazio.icona,
    borderRadius: raggio.interno,
  },
  nomeVolto: { textAlign: "center" },
  riquadro: { borderRadius: raggio.contenitore, padding: spazio.elenco },
  filo: { height: 1, marginHorizontal: spazio.controllo },
  riga: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    paddingHorizontal: spazio.controllo,
    paddingVertical: spazio.icona,
    borderRadius: raggio.interno,
  },
  icona: {
    width: t(32),
    height: t(32),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raggio.pillola,
  },
  testi: { flex: 1, gap: 2 },
  sollevata: { paddingHorizontal: spazio.controllo },
  vuoto: { alignItems: "center", gap: spazio.icona, paddingTop: spazio.finestra * 2 },
});
