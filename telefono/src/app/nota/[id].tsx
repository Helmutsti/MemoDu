// La nota a tutto schermo (ID-54) alla scala del telefono (DEC-161): in alto il tondo per tornare
// alla lista (CMP-50, proposta C), anche con il gesto dal bordo, e a destra Info (CMP-24) nel
// foglio dal basso; sotto il titolo e il testo nell'editor del computer (DEC-162), in vista
// Markdown con i simboli nascosti, come sul computer. Mentre scrivi, sopra la tastiera la bollicina dei formati aperta (CMP-10) e «Fine».
// Si salva da sola; una nota lasciata vuota sparisce (RB-10).

import { router, Stack, useLocalSearchParams } from "expo-router";
import { Info } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BarraFormati, type Voce } from "@/componenti/BarraFormati";
import { BarraInCima } from "@/componenti/BarraInCima";
import { InfoNota } from "@/componenti/InfoNota";
import { useNegozio } from "@/dati/negozio";
import EditorNota, { type FormatoInJson, type ManigliaEditorNota } from "@/editor/EditorNota";
import type { Nota } from "@/nucleo/archivio";
import { misura, raggio, spazio, useColori } from "@/tema";

const RITARDO_SALVATAGGIO_MS = 500;

/** Le voci da accendere nella bollicina per il formato dove sta il cursore (CA-02.4). */
function vociAccese(f: FormatoInJson | null): Set<Voce> {
  if (!f) return new Set();
  const voci = new Set(f.caratteri as Voce[]);
  if (f.riga !== "misto") voci.add(f.riga);
  return voci;
}

export default function NotaAperta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { archivio, modificato } = useNegozio();
  const c = useColori();
  const [nota, setNota] = useState<{ titolo: string; contenuto: string } | null>(null);
  const [scrive, setScrive] = useState(false);
  const [info, setInfo] = useState<{ nota: Nota; cartella: string } | null>(null);
  const [formato, setFormato] = useState<FormatoInJson | null>(null);
  const editor = useRef<ManigliaEditorNota>(null);
  const ultimo = useRef({ titolo: "", corpo: "" });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      if (!archivio) return;
      const n = await archivio.nota(id);
      if (!vivo || !n) return;
      ultimo.current = { titolo: n.titolo, corpo: n.contenuto };
      setNota({ titolo: n.titolo, contenuto: n.contenuto });
    })();
    return () => {
      vivo = false;
    };
  }, [archivio, id]);

  const salvaOra = async () => {
    clearTimeout(timer.current);
    if (!archivio) return;
    await archivio.salvaNota(id, ultimo.current.titolo, ultimo.current.corpo);
    modificato();
  };
  const cambia = async (ti: string, co: string) => {
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
      void allaChiusura.current().then(async () => {
        await archivio?.eliminaSeVuota(id);
        modificato();
      });
    },
    [archivio, id, modificato],
  );

  // Info si apre con i dati salvati: prima si salva quello che si è appena scritto.
  const apriInfo = async () => {
    if (!archivio) return;
    editor.current?.chiudiTastiera();
    await salvaOra();
    const n = await archivio.nota(id);
    if (n) setInfo({ nota: n, cartella: await archivio.percorso(n.cartella) });
  };
  const elimina = async () => {
    setInfo(null);
    await salvaOra();
    await archivio?.cestinaNota(id);
    modificato();
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.sfondoNota }}>
      <Stack.Screen
        options={{ headerShown: false, contentStyle: { backgroundColor: c.sfondoNota } }}
      />
      <BarraInCima
        destra={
          <Pressable
            onPress={() => void apriInfo()}
            accessibilityRole="button"
            accessibilityLabel="Info"
            hitSlop={spazio.elemento}
            style={({ pressed }) => [
              stili.tondo,
              { backgroundColor: pressed ? c.sfondoPremuto : c.sfondoCampo },
            ]}
          >
            <Info size={misura.icona} color={c.testoPrimario} strokeWidth={misura.tratto} />
          </Pressable>
        }
      />
      {nota ? (
        <EditorNota
          ref={editor}
          titolo={nota.titolo}
          contenuto={nota.contenuto}
          nuova={!nota.titolo && !nota.contenuto}
          onCambia={cambia}
          onFormato={async (f) => setFormato(f)}
          onScrive={async (s) => setScrive(s)}
          dom={{
            style: { flex: 1, backgroundColor: c.sfondoNota },
            hideKeyboardAccessoryView: true,
            keyboardDisplayRequiresUserAction: false,
            bounces: true,
          }}
        />
      ) : null}
      <BarraFormati
        visibile={scrive}
        attivi={vociAccese(formato)}
        onFormato={(v) => editor.current?.applica(v)}
        onFine={() => editor.current?.chiudiTastiera()}
      />
      {info ? (
        <InfoNota
          visibile
          nota={info.nota}
          cartella={info.cartella}
          onElimina={() => void elimina()}
          onChiudi={() => setInfo(null)}
        />
      ) : null}
    </View>
  );
}

const stili = StyleSheet.create({
  // Come il tondo per tornare indietro (CMP-50): pulsante solo icona da 44 su sfondo-campo.
  tondo: {
    width: misura.riga,
    height: misura.riga,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: raggio.pillola,
  },
});
