// La nota a tutto schermo (ID-54) alla scala del telefono (DEC-161): in alto il tondo per tornare
// alla lista (CMP-50, proposta C), anche con il gesto dal bordo, e a destra Info (CMP-24) nel
// foglio dal basso; sotto il titolo e il testo nell'editor del computer (DEC-162), in vista
// Markdown con i simboli nascosti, come sul computer. Mentre scrivi, sopra la tastiera la bollicina dei formati aperta (CMP-10) e «Fine».
// Si salva da sola; una nota lasciata vuota sparisce (RB-10).

import { router, Stack, useLocalSearchParams } from "expo-router";
import { Info } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useKeyboardState } from "react-native-keyboard-controller";
import { BarraFormati, type Voce } from "@/componenti/BarraFormati";
import { BarraInCima } from "@/componenti/BarraInCima";
import { FoglioArea, SuggerimentiChiocciola } from "@/componenti/BrainetNota";
import { Conferma } from "@/componenti/Foglio";
import { InfoNota } from "@/componenti/InfoNota";
import { SpostaIn } from "@/componenti/SpostaIn";
import { useDatiBrainet } from "@/dati/brainet";
import { useNegozio } from "@/dati/negozio";
import { segui } from "@/nucleo/brainet";
import EditorNota, {
  type BrainetQui,
  type FormatoInJson,
  type ManigliaEditorNota,
} from "@/editor/EditorNota";
import type { Cartella, Nota } from "@/nucleo/archivio";
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
  /** `cursore`: dove mettere il cursore all'apertura, dalla pagina dell'entità (RB-124). */
  const { id, cursore } = useLocalSearchParams<{ id: string; cursore?: string }>();
  const { archivio, modificato } = useNegozio();
  const c = useColori();
  const [nota, setNota] = useState<{ titolo: string; contenuto: string; brainet: boolean } | null>(
    null,
  );
  const [scrive, setScrive] = useState(false);
  // Le pillole e le aree della nota con i nomi e i colori di adesso (RB-111).
  const dati = useDatiBrainet();
  const brainet = useMemo(
    () => ({
      entita: Object.fromEntries(
        [...(dati?.entita.values() ?? [])].map((e) => {
          const vera = dati!.entita.get(segui(dati!.entita, e.id)) ?? e;
          return [e.id, { nome: vera.nome, foto: vera.foto }];
        }),
      ),
      colori: Object.fromEntries((dati?.stati ?? []).map((s) => [s.id, s.colore])),
    }),
    [dati],
  );
  // La barra dei formati c'è solo con la tastiera aperta: entrando in una nota nuova il fuoco va
  // nel titolo, ma la tastiera può non aprirsi, e la barra resterebbe appoggiata in fondo.
  const tastiera = useKeyboardState((k) => k.isVisible);
  const [info, setInfo] = useState<{ nota: Nota; cartella: string } | null>(null);
  const [sposta, setSposta] = useState<{ nota: Nota; cartelle: Cartella[] } | null>(null);
  const [formato, setFormato] = useState<FormatoInJson | null>(null);
  // Brainet da scrivere (passo 2): @ e l'area dove si sta, con Brainet acceso (RB-111).
  const [qui, setQui] = useState<BrainetQui>({ chiocciola: null, area: null });
  const [acceso, setAcceso] = useState(false);
  const [foglioArea, setFoglioArea] = useState(false);
  const [versoBrainet, setVersoBrainet] = useState(false);
  useEffect(() => {
    void archivio?.brainetAcceso().then(setAcceso);
  }, [archivio]);
  const creaECita = async (nome: string) => {
    const e = await archivio?.creaEntita(nome);
    if (!e) return;
    editor.current?.cita(e.id, e.nome);
    modificato();
  };
  const creaELega = async (nome: string) => {
    const e = await archivio?.creaEntita(nome);
    if (!e) return;
    editor.current?.alterna("entita", e.id);
    modificato();
  };
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
      const campi = await archivio.datiBrainet();
      setNota({
        titolo: n.titolo,
        contenuto: n.contenuto,
        brainet: campi.note.find((x) => x.id === id)?.brainet ?? false,
      });
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
    const i = await archivio.notaPerInfo(id);
    if (i) setInfo(i);
  };
  // Da Info, la riga della cartella apre Sposta in… (FL-05).
  const apriSposta = async () => {
    if (!archivio || !info) return;
    const tutte = await archivio.cartelle();
    const ids = new Set(tutte.filter((x) => !x.eliminata_il).map((x) => x.id));
    const nota = info.nota;
    setInfo(null);
    setSposta({
      nota,
      cartelle: tutte.filter((x) => ids.has(x.id) && (!x.madre || ids.has(x.madre))),
    });
  };
  const spostaIn = async (cartella: string | null) => {
    const s = sposta;
    setSposta(null);
    if (!archivio || !s) return;
    await archivio.spostaNota(s.nota.id, cartella);
    modificato();
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
          cursore={cursore ? Number(cursore) : undefined}
          entita={brainet.entita}
          coloriStati={brainet.colori}
          onPillola={async (e) => {
            router.push({ pathname: "/entita/[id]", params: { id: e } });
          }}
          onCambia={cambia}
          onFormato={async (f) => setFormato(f)}
          onScrive={async (s) => setScrive(s)}
          onBrainet={async (q) => setQui(q)}
          dom={{
            style: { flex: 1, backgroundColor: c.sfondoNota },
            hideKeyboardAccessoryView: true,
            keyboardDisplayRequiresUserAction: false,
            bounces: true,
          }}
        />
      ) : null}
      <BarraFormati
        visibile={scrive && tastiera}
        attivi={vociAccese(formato)}
        onFormato={(v) => editor.current?.applica(v)}
        onFine={() => editor.current?.chiudiTastiera()}
        brainet={acceso ? { attivo: qui.area !== null, onPress: () => setFoglioArea(true) } : null}
        sopra={
          acceso && dati && qui.chiocciola !== null ? (
            <SuggerimentiChiocciola
              domanda={qui.chiocciola}
              entita={dati.entita}
              onScegli={(e) => editor.current?.cita(e.id, e.nome)}
              onCrea={(nome) => void creaECita(nome)}
            />
          ) : null
        }
      />
      {acceso && dati && qui.area ? (
        <FoglioArea
          visibile={foglioArea}
          area={qui.area}
          entita={dati.entita}
          stati={dati.stati}
          onAlterna={(tipo, x) => editor.current?.alterna(tipo, x)}
          onCrea={(nome) => void creaELega(nome)}
          onChiudi={() => setFoglioArea(false)}
        />
      ) : null}
      <Conferma
        visibile={versoBrainet}
        titolo="Spostare la nota in Brainet?"
        testo="La nota esce da CLOUD e dalla ricerca e non si riporta indietro. Nel Journal puoi collegarla a persone, oggetti e argomenti."
        azione="Sposta"
        onConferma={() => {
          setVersoBrainet(false);
          void salvaOra()
            .then(() => archivio?.spostaInBrainet(id))
            .then(() => {
              modificato();
              router.replace("/journal");
            });
        }}
        onAnnulla={() => setVersoBrainet(false)}
      />
      {info ? (
        <InfoNota
          visibile
          nota={info.nota}
          cartella={info.cartella}
          onSposta={() => void apriSposta()}
          onSpostaInBrainet={
            acceso && !nota?.brainet
              ? () => {
                  setInfo(null);
                  setVersoBrainet(true);
                }
              : undefined
          }
          onElimina={() => void elimina()}
          onChiudi={() => setInfo(null)}
        />
      ) : null}
      {sposta ? (
        <SpostaIn
          visibile
          cartelle={sposta.cartelle}
          attuale={sposta.nota.cartella}
          onScegli={(cartella) => void spostaIn(cartella)}
          onChiudi={() => setSposta(null)}
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
