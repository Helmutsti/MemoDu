// SC-04 Cestino sul telefono (RF-15), dalla riga Cestino in fondo alla colonna, con le regole e i
// testi del computer (client/src/schermate/Cestino.tsx): elementi dal più recente, con tipo,
// provenienza e data (CMP-17); Ripristina riporta nella radice (RB-28), Elimina definitivamente
// e Svuota cestino chiedono conferma (RB-32, RB-55); una cartella con un nome già usato nella
// radice segue RB-31. Sul telefono le azioni di un elemento stanno nel foglio che si apre
// toccandolo (CMP-51), o facendo scorrere la riga (CMP-52): accanto al nome non ci stanno.

import { Stack } from "expo-router";
import { FileText, Folder, RotateCcw, Trash2, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  LayoutAnimationConfig,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { Comparsa, transizione } from "@/componenti/Comparsa";
import { Conferma, Foglio } from "@/componenti/Foglio";
import { Pulsante } from "@/componenti/Pulsante";
import { useNegozio } from "@/dati/negozio";
import type { ElementoCestino } from "@/nucleo/archivio";
import { misura, raggio, spazio, t, testo, useColori } from "@/tema";

const data = (istante: string) =>
  new Date(istante).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
const note = (n: number) => (n === 1 ? "1 nota" : `${n} note`);
/** «da Lavoro › Clienti», oppure dalla radice «da CLOUD» (DEC-119). */
const provenienza = (e: ElementoCestino) =>
  e.provenienza !== "" ? `da ${e.provenienza.split("/").join(" › ")}` : "da CLOUD";
const dettagli = (e: ElementoCestino) =>
  `${e.tipo === "nota" ? "Nota" : `Cartella con ${note(e.conteggio ?? 0)}`} · ${provenienza(e)} · eliminata il ${data(e.eliminato)}`;
const nome = (e: ElementoCestino) => e.nome || "Nota vuota";
function testoElimina(e: ElementoCestino): string {
  if (e.tipo === "nota") return "La nota verrà eliminata per sempre.";
  const n = e.conteggio ?? 0;
  if (n === 0) return "La cartella verrà eliminata per sempre.";
  if (n === 1) return "La cartella e la sua nota verranno eliminate per sempre.";
  return `La cartella e le sue ${n} note verranno eliminate per sempre.`;
}

function Azione({
  etichetta,
  icona: Icona,
  piena,
  onPress,
}: {
  etichetta: string;
  icona: LucideIcon;
  piena?: boolean;
  onPress: () => void;
}) {
  const c = useColori();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etichetta}
      style={({ pressed }) => [
        stili.azione,
        {
          backgroundColor: piena
            ? pressed
              ? c.sfondoPienoPremuto
              : c.sfondoPieno
            : pressed
              ? c.sfondoPremuto
              : c.sfondoCampo,
        },
      ]}
    >
      <Icona
        size={misura.icona}
        color={piena ? c.iconaSuPieno : c.testoPrimario}
        strokeWidth={misura.tratto}
      />
      <Text
        allowFontScaling={false}
        style={[testo.etichetta, { color: piena ? c.testoSuPieno : c.testoPrimario }]}
      >
        {etichetta}
      </Text>
    </Pressable>
  );
}

/** Le azioni sotto la riga si vedono solo mentre la riga scorre (CMP-52). */
function AzioniNascoste({
  progresso,
  children,
}: {
  progresso: SharedValue<number>;
  children: React.ReactNode;
}) {
  const visibile = useAnimatedStyle(() => ({ opacity: progresso.value > 0.02 ? 1 : 0 }));
  return <Animated.View style={[stili.azioni, visibile]}>{children}</Animated.View>;
}

/** CMP-17 alla scala del telefono: icona 16 → 20, nome in Interfaccia/Titolo, sotto i dettagli. */
function Elemento({
  e,
  onApri,
  onRipristina,
  onElimina,
}: {
  e: ElementoCestino;
  onApri: () => void;
  onRipristina: () => void;
  onElimina: () => void;
}) {
  const c = useColori();
  const riga = useRef<SwipeableMethods>(null);
  const chiudiE = (f: () => void) => () => {
    riga.current?.close();
    f();
  };
  return (
    <ReanimatedSwipeable
      ref={riga}
      friction={1.5}
      rightThreshold={spazio.gruppo * 2}
      overshootRight={false}
      renderRightActions={(progresso) => (
        <AzioniNascoste progresso={progresso}>
          <Azione etichetta="Ripristina" icona={RotateCcw} onPress={chiudiE(onRipristina)} />
          <Azione etichetta="Elimina" icona={Trash2} piena onPress={chiudiE(onElimina)} />
        </AzioniNascoste>
      )}
    >
      <Pressable
        onPress={onApri}
        accessibilityRole="button"
        accessibilityHint="Apre Ripristina ed Elimina definitivamente"
        style={({ pressed }) => [
          stili.elemento,
          { backgroundColor: pressed ? c.sfondoHover : c.sfondoNota },
        ]}
      >
        {e.tipo === "nota" ? (
          <FileText size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
        ) : (
          <Folder size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
        )}
        <View style={stili.testi}>
          <Text
            allowFontScaling={false}
            style={[testo.titolo, { color: c.testoPrimario }]}
            numberOfLines={1}
          >
            {nome(e)}
          </Text>
          <Text
            allowFontScaling={false}
            style={[testo.dettaglio, { color: c.testoTenue }]}
            numberOfLines={2}
          >
            {dettagli(e)}
          </Text>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

export default function Cestino() {
  const c = useColori();
  const { archivio, versione, modificato } = useNegozio();
  const [elementi, setElementi] = useState<ElementoCestino[]>([]);
  const [caricato, setCaricato] = useState(false);
  const [aperto, setAperto] = useState<ElementoCestino | null>(null);
  const [daEliminare, setDaEliminare] = useState<ElementoCestino | null>(null);
  const [svuota, setSvuota] = useState(false);
  const [conflitto, setConflitto] = useState<{ e: ElementoCestino; nome: string } | null>(null);

  useEffect(() => {
    if (!archivio) return;
    let vivo = true;
    void archivio.elementiCestino().then((x) => {
      if (!vivo) return;
      setElementi(x);
      setCaricato(true);
    });
    return () => {
      vivo = false;
    };
  }, [archivio, versione]);

  const ripristina = async (e: ElementoCestino, scelta?: "numero" | "unisci") => {
    const esito = await archivio?.ripristina(e.id, scelta);
    if (esito) return setConflitto({ e, nome: esito.conflitto });
    modificato();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.sfondoNota }}>
      <Stack.Screen
        options={{
          title: "",
          headerBackTitle: "Memodu",
          headerStyle: { backgroundColor: c.sfondoNota },
        }}
      />
      {caricato && elementi.length === 0 ? (
        // CMP-19 Stato vuoto, variante Cestino.
        <View style={stili.vuoto}>
          <Trash2 size={t(24)} color={c.iconaTenue} strokeWidth={misura.tratto} />
          <Text allowFontScaling={false} style={[testo.titolo, { color: c.testoPrimario }]}>
            Il cestino è vuoto
          </Text>
          <Text
            allowFontScaling={false}
            style={[testo.messaggio, stili.centrato, { color: c.testoTenue }]}
          >
            Le note e le cartelle eliminate restano qui finché non svuoti il cestino.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={stili.contenuto}>
          <View style={stili.intestazione}>
            <Text
              allowFontScaling={false}
              style={[testo.titoloSchermata, { color: c.testoPrimario }]}
              accessibilityRole="header"
            >
              Cestino
            </Text>
            {elementi.length ? (
              <Pulsante etichetta="Svuota cestino" onPress={() => setSvuota(true)} />
            ) : null}
          </View>
          <LayoutAnimationConfig skipEntering>
            <Animated.View layout={transizione} style={stili.elenco}>
              {elementi.map((e) => (
                <Comparsa key={e.id}>
                  <Elemento
                    e={e}
                    onApri={() => setAperto(e)}
                    onRipristina={() => void ripristina(e)}
                    onElimina={() => setDaEliminare(e)}
                  />
                </Comparsa>
              ))}
            </Animated.View>
          </LayoutAnimationConfig>
        </ScrollView>
      )}
      <Foglio
        visibile={!!aperto}
        titolo={aperto ? nome(aperto) : ""}
        onChiudi={() => setAperto(null)}
      >
        {aperto ? (
          <>
            <Text allowFontScaling={false} style={[testo.dettaglio, { color: c.testoTenue }]}>
              {dettagli(aperto)}
            </Text>
            <View style={stili.pulsanti}>
              <Pulsante
                etichetta="Ripristina"
                largo
                onPress={() => {
                  const e = aperto;
                  setAperto(null);
                  void ripristina(e);
                }}
              />
              <Pulsante
                etichetta="Elimina definitivamente"
                largo
                onPress={() => {
                  const e = aperto;
                  setAperto(null);
                  setDaEliminare(e);
                }}
              />
            </View>
          </>
        ) : null}
      </Foglio>
      <Conferma
        visibile={!!daEliminare}
        titolo={daEliminare ? `Eliminare per sempre «${nome(daEliminare)}»?` : ""}
        testo={daEliminare ? testoElimina(daEliminare) : ""}
        azione="Elimina definitivamente"
        onAnnulla={() => setDaEliminare(null)}
        onConferma={() => {
          const e = daEliminare;
          setDaEliminare(null);
          if (e) void archivio?.eliminaDefinitivamente(e.id).then(modificato);
        }}
      />
      <Conferma
        visibile={svuota}
        titolo="Svuotare il cestino?"
        testo={
          elementi.length === 1
            ? "1 elemento verrà eliminato per sempre."
            : `${elementi.length} elementi verranno eliminati per sempre.`
        }
        azione="Svuota"
        onAnnulla={() => setSvuota(false)}
        onConferma={() => {
          setSvuota(false);
          void archivio?.svuotaCestino().then(modificato);
        }}
      />
      <Conferma
        visibile={!!conflitto}
        titolo={conflitto ? `Esiste già «${conflitto.nome}» tra le cartelle` : ""}
        testo="Puoi aggiungere un numero al nome, unire le due cartelle o annullare."
        azione="Aggiungi un numero"
        altra={{
          etichetta: "Unisci",
          onPress: () => {
            const x = conflitto;
            setConflitto(null);
            if (x) void ripristina(x.e, "unisci");
          },
        }}
        onAnnulla={() => setConflitto(null)}
        onConferma={() => {
          const x = conflitto;
          setConflitto(null);
          if (x) void ripristina(x.e, "numero");
        }}
      />
    </View>
  );
}

const stili = StyleSheet.create({
  // Come SC-04: spazio-gruppo ai lati, il titolo e Svuota cestino sopra l'elenco.
  contenuto: {
    paddingHorizontal: spazio.gruppo,
    paddingTop: spazio.icona,
    paddingBottom: spazio.gruppo,
  },
  intestazione: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spazio.blocco,
    marginBottom: spazio.blocco,
  },
  elenco: { gap: spazio.elemento },
  // CMP-17: spazio-controllo a sinistra, spazio-controllo-piccolo sopra, sotto e a destra.
  elemento: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    paddingLeft: spazio.controllo,
    paddingRight: spazio.controlloPiccolo,
    paddingVertical: spazio.controlloPiccolo,
    borderRadius: raggio.interno,
  },
  testi: { flex: 1, gap: 2 },
  azioni: { flexDirection: "row", gap: spazio.elemento, marginLeft: spazio.elemento },
  azione: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.iconaPiccola,
    paddingHorizontal: spazio.pulsante,
    borderRadius: raggio.interno,
  },
  pulsanti: { gap: spazio.icona, marginTop: spazio.icona },
  vuoto: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spazio.icona,
    paddingHorizontal: spazio.gruppo,
  },
  centrato: { textAlign: "center", maxWidth: t(320) },
});
