// Le azioni su un'entità dal telefono (RF-18, passo 2), con i testi del computer
// (client/src/brainet/VisteBrainet.tsx): il foglio del tipo (Persona, Argomento, Evento, Oggetto,
// una linea e «Senza tipo», con la spunta su quello attuale, RB-122), «Unisci a…» con
// «Cerca un'entità», le altre entità per tipo e la conferma (RB-108), «Scegli una foto…» dalle
// foto del telefono, ridotta a 256 punti di lato e salvata in JPEG come sul computer (CA-18.13).

import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Check, Search } from "lucide-react-native";
import { Fragment, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { TITOLO_TIPO, TITOLO_TIPO_SINGOLARE } from "@/componenti/Brainet";
import { Conferma, Foglio } from "@/componenti/Foglio";
import { useNegozio } from "@/dati/negozio";
import { riferimentiDi, type Entita, type NotaBrainet, type TipoEntita } from "@/nucleo/brainet";
import { misura, raggio, spazio, t, testo, useColori } from "@/tema";

const TIPI: TipoEntita[] = ["persona", "argomento", "evento", "oggetto"];
/** Lato lungo della foto di un'entità, come sul computer. */
const LATO_FOTO = 256;

function Voce({
  etichetta,
  spunta,
  onPress,
}: {
  etichetta: string;
  spunta?: boolean;
  onPress: () => void;
}) {
  const c = useColori();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityState={{ checked: !!spunta }}
      style={({ pressed }) => [stili.voce, pressed && { backgroundColor: c.sfondoHover }]}
    >
      <Text
        allowFontScaling={false}
        style={[testo.controllo, stili.flessibile, { color: c.testoPrimario }]}
      >
        {etichetta}
      </Text>
      {spunta ? (
        <Check size={misura.icona} color={c.testoPrimario} strokeWidth={misura.tratto} />
      ) : null}
    </Pressable>
  );
}

/** «1 citazione e 2 aree passano a «Luca Bianchi», che tiene il suo nome. L'unione non si annulla.» */
function testoUnione(n: { citazioni: number; aree: number }, verso: string): string {
  const cit = n.citazioni === 1 ? "1 citazione" : `${n.citazioni} citazioni`;
  const aree = n.aree === 1 ? "1 area" : `${n.aree} aree`;
  const parti = [n.citazioni && cit, n.aree && aree].filter(Boolean);
  const soggetto = parti.length ? parti.join(" e ") : `${cit} e ${aree}`;
  const verbo = parti.length === 1 && n.citazioni + n.aree === 1 ? "passa" : "passano";
  return `${soggetto} ${verbo} a «${verso}», che tiene il suo nome. L'unione non si annulla.`;
}

/** Il foglio del tipo dell'entità (RB-122). */
export function FoglioTipo({ entita, onChiudi }: { entita: Entita | null; onChiudi: () => void }) {
  const c = useColori();
  const { archivio, modificato } = useNegozio();
  const scegli = (tipo: TipoEntita | null) => {
    if (!entita) return;
    onChiudi();
    void archivio?.impostaTipo(entita.id, tipo).then(modificato);
  };
  return (
    <Foglio visibile={entita !== null} titolo="Tipo" onChiudi={onChiudi}>
      <View>
        {TIPI.map((tipo) => (
          <Voce
            key={tipo}
            etichetta={TITOLO_TIPO_SINGOLARE[tipo]}
            spunta={entita?.tipo === tipo}
            onPress={() => scegli(tipo)}
          />
        ))}
        <View style={[stili.filo, { backgroundColor: c.bordoDivisoreTenue }]} />
        <Voce
          etichetta="Senza tipo"
          spunta={!!entita && !entita.tipo}
          onPress={() => scegli(null)}
        />
      </View>
    </Foglio>
  );
}

/** «Unisci a…»: il foglio con la ricerca e le altre entità per tipo, poi la conferma (RB-108). */
export function FoglioUnisci({
  da,
  entita,
  note,
  onChiudi,
}: {
  da: Entita | null;
  entita: Map<string, Entita>;
  note: NotaBrainet[];
  onChiudi: () => void;
}) {
  const c = useColori();
  const { archivio, modificato } = useNegozio();
  const [cerca, setCerca] = useState("");
  const [verso, setVerso] = useState<Entita | null>(null);
  const f = cerca.trim().toLowerCase();
  const altre = [...entita.values()].filter(
    (e) => da && !e.unitaIn && e.id !== da.id && (!f || e.nome.toLowerCase().includes(f)),
  );
  const chiudi = () => {
    setCerca("");
    setVerso(null);
    onChiudi();
  };
  return (
    <>
      <Foglio visibile={da !== null && verso === null} titolo="Unisci a" onChiudi={chiudi}>
        <View style={[stili.campo, { backgroundColor: c.sfondoCampo }]}>
          <Search size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
          <TextInput
            allowFontScaling={false}
            value={cerca}
            onChangeText={setCerca}
            placeholder="Cerca un'entità"
            placeholderTextColor={c.testoTenue}
            accessibilityLabel="Cerca un'entità"
            autoCorrect={false}
            style={[
              testo.controllo,
              stili.flessibile,
              stili.campoTesto,
              { color: c.testoPrimario },
            ]}
          />
        </View>
        <ScrollView style={stili.elenco} keyboardShouldPersistTaps="handled">
          {altre.length ? (
            [...TIPI, null].map((tipo) => {
              const lista = altre
                .filter((e) => (e.tipo ?? null) === tipo)
                .sort((a, b) => a.nome.localeCompare(b.nome));
              if (!lista.length) return null;
              return (
                <Fragment key={tipo ?? "nessuno"}>
                  <Text
                    allowFontScaling={false}
                    style={[testo.titoloSezione, stili.titolo, { color: c.testoTenue }]}
                  >
                    {TITOLO_TIPO[tipo ?? "nessuno"]}
                  </Text>
                  {lista.map((e) => (
                    <Voce key={e.id} etichetta={e.nome} onPress={() => setVerso(e)} />
                  ))}
                </Fragment>
              );
            })
          ) : (
            <Text
              allowFontScaling={false}
              style={[testo.controllo, stili.titolo, { color: c.testoTenue }]}
            >
              Nessuna entità
            </Text>
          )}
        </ScrollView>
      </Foglio>
      {da && verso ? (
        <Conferma
          visibile
          titolo={`Unire «${da.nome}» a «${verso.nome}»?`}
          testo={testoUnione(riferimentiDi(da.id, note, entita), verso.nome)}
          azione="Unisci"
          onConferma={() => {
            const [x, y] = [da.id, verso.id];
            chiudi();
            void archivio?.unisciEntita(x, y).then(modificato);
          }}
          onAnnulla={chiudi}
        />
      ) : null}
    </>
  );
}

/** «Scegli una foto…»: dalle foto del telefono, ridotta e in JPEG (CA-18.13). */
export async function scegliFoto(): Promise<string | null> {
  const scelta = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
  if (scelta.canceled || !scelta.assets?.length) return null;
  const { uri, width, height } = scelta.assets[0];
  const contesto = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > LATO_FOTO)
    contesto.resize(width >= height ? { width: LATO_FOTO } : { height: LATO_FOTO });
  const immagine = await contesto.renderAsync();
  const salvata = await immagine.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.85,
    base64: true,
  });
  return salvata.base64 ?? null;
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
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.icona,
    height: misura.riga,
    paddingHorizontal: spazio.controllo,
    borderRadius: raggio.pillola,
  },
  campoTesto: { paddingVertical: 0 },
  elenco: { maxHeight: t(320) },
  titolo: { paddingHorizontal: spazio.controllo, paddingTop: spazio.icona, paddingBottom: 2 },
});
