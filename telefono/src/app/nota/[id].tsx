// La nota a tutto schermo (ID-54) alla scala del telefono (DEC-157): in alto «‹ cartella» con il
// gesto dal bordo per tornare; il titolo in Nota/Titolo e il testo in Nota/Corpo, in Markdown
// con gli stessi segni del computer; il cursore resta sopra la tastiera. Mentre scrivi, sopra la
// tastiera la bollicina dei formati aperta (CMP-10) e «Fine». Si salva da sola; una nota lasciata
// vuota sparisce (RB-10). Editor: il campo di testo nativo di iOS (proposta dell'agente, DEC-156).

import { Stack, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import { Keyboard, StyleSheet, TextInput, type TextInputInstance } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { BarraFormati, type Voce } from "@/componenti/BarraFormati";
import { eliminaSeVuota, leggiNota, nomeCartella, salvaNota } from "@/dati/archivio";
import {
  applicaRiga,
  applicaTesto,
  attivi,
  type FormatoTesto,
  type Selezione,
} from "@/dati/formati";
import { spazio, t, testo, useColori } from "@/tema";

const RITARDO_SALVATAGGIO_MS = 500;
const CARATTERE = new Set<Voce>(["grassetto", "corsivo", "barrato", "sottolineato"]);

export default function NotaAperta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const c = useColori();
  const [titolo, setTitolo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [cartella, setCartella] = useState("Cloud");
  const [pronta, setPronta] = useState(false);
  const [scrive, setScrive] = useState(false);
  const [sel, setSel] = useState<Selezione>({ start: 0, end: 0 });
  const [selForzata, setSelForzata] = useState<Selezione | undefined>();
  const corpoRef = useRef<TextInputInstance>(null);
  const ultimo = useRef({ titolo: "", corpo: "" });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const n = await leggiNota(db, id);
      if (!vivo || !n) return;
      setTitolo(n.titolo);
      setCorpo(n.contenuto);
      ultimo.current = { titolo: n.titolo, corpo: n.contenuto };
      setCartella(await nomeCartella(db, n.cartella));
      setPronta(true);
    })();
    return () => {
      vivo = false;
    };
  }, [db, id]);

  const salvaOra = async () => {
    clearTimeout(timer.current);
    await salvaNota(db, id, ultimo.current.titolo, ultimo.current.corpo);
  };
  const cambia = (ti: string, co: string) => {
    ultimo.current = { titolo: ti, corpo: co };
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void salvaOra(), RITARDO_SALVATAGGIO_MS);
  };
  // Lasciando la nota si salva subito; vuota, sparisce. Il ref tiene l'ultima versione della
  // funzione, così l'effetto parte solo all'apertura e alla chiusura.
  const allaChiusura = useRef(salvaOra);
  allaChiusura.current = salvaOra;
  useEffect(
    () => () => {
      void allaChiusura.current().then(() => eliminaSeVuota(db, id));
    },
    [db, id],
  );

  const formato = (v: Voce) => {
    const r = CARATTERE.has(v)
      ? applicaTesto(corpo, sel, v as FormatoTesto)
      : applicaRiga(corpo, sel, v as never);
    setCorpo(r.testo);
    cambia(titolo, r.testo);
    setSel(r.sel);
    setSelForzata(r.sel);
    requestAnimationFrame(() => setSelForzata(undefined));
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerBackTitle: cartella,
          headerStyle: { backgroundColor: c.sfondoNota },
          contentStyle: { backgroundColor: c.sfondoNota },
        }}
      />
      <KeyboardAwareScrollView
        bottomOffset={t(32) + spazio.icona * 3}
        style={{ backgroundColor: c.sfondoNota }}
        contentContainerStyle={stili.contenuto}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          value={titolo}
          onChangeText={(ti) => {
            setTitolo(ti);
            cambia(ti, corpo);
          }}
          placeholder="Titolo"
          placeholderTextColor={c.testoTenue}
          style={[testo.notaTitolo, stili.campo, { color: c.testoPrimario }]}
          multiline
          submitBehavior="submit"
          returnKeyType="next"
          onSubmitEditing={() => corpoRef.current?.focus()}
          autoFocus={pronta && !titolo && !corpo}
        />
        <TextInput
          ref={corpoRef}
          value={corpo}
          onChangeText={(co) => {
            setCorpo(co);
            cambia(titolo, co);
          }}
          onFocus={() => setScrive(true)}
          onBlur={() => setScrive(false)}
          onSelectionChange={(e) => setSel(e.nativeEvent.selection)}
          selection={selForzata}
          placeholder="Scrivi qui"
          placeholderTextColor={c.testoTenue}
          style={[testo.notaCorpo, stili.campo, stili.corpo, { color: c.testoPrimario }]}
          multiline
          scrollEnabled={false}
          textAlignVertical="top"
        />
      </KeyboardAwareScrollView>
      <BarraFormati
        visibile={scrive}
        attivi={attivi(corpo, sel)}
        onFormato={formato}
        onFine={() => Keyboard.dismiss()}
      />
    </>
  );
}

const stili = StyleSheet.create({
  // Margini della nota sul computer (SC-03): spazio-gruppo ai lati sul telefono.
  contenuto: {
    paddingHorizontal: spazio.gruppo,
    paddingTop: spazio.icona,
    paddingBottom: t(120),
    gap: spazio.blocco,
  },
  campo: { padding: 0 },
  corpo: { minHeight: t(240) },
});
