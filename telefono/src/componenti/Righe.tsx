// CMP-06 Riga della colonna alla scala del telefono (DEC-157): pillola alta misura-riga con
// spazio-controllo ai lati, spazio-icona tra icona e testo, spazio-rientro per livello. La nota
// ha solo il titolo e si allinea al nome delle sottocartelle sorelle; la cartella ha l'icona
// chiusa o aperta (DEC-99) e il numero di note in Interfaccia/Dettaglio. Sul telefono l'Hover
// diventa il tocco premuto; la riga della nota si fa scorrere a sinistra per Elimina (ID-55),
// con il gesto nativo di Gesture Handler.

import { Folder, FolderInput, FolderOpen, Trash2, type LucideIcon } from "lucide-react-native";
import { useEffect, useRef, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type HostInstance,
  type TextInputInstance,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { misura, movimento, opacitaDisabilitato, raggio, spazio, testo, useColori } from "@/tema";

/**
 * La riga che scorrendo ha mostrato le sue azioni: ce n'è una sola aperta alla volta, come in
 * Mail (CMP-52). Si chiude appena un'altra riga comincia a scorrere, al tocco di un'altra riga
 * (che allora non si apre) e quando la lista scorre.
 */
type RigaScorrevole = { current: SwipeableMethods | null };
let rigaAperta: RigaScorrevole | null = null;

/** Da chiamare appena una riga comincia ad aprirsi: chiude quella aperta prima e segna questa. */
export function apriSoloQuesta(riga: RigaScorrevole) {
  if (rigaAperta && rigaAperta !== riga) rigaAperta.current?.close();
  rigaAperta = riga;
}

/** Da chiamare quando una riga si è richiusa. */
export function richiusa(riga: RigaScorrevole) {
  if (rigaAperta === riga) rigaAperta = null;
}

/** Chiude la riga aperta, se c'è: true se l'ha chiusa (il tocco serviva solo a chiuderla). */
export function chiudiAperta(): boolean {
  const aperta = rigaAperta;
  rigaAperta = null;
  if (!aperta?.current) return false;
  aperta.current.close();
  return true;
}

/** Quando il tocco sullo schermo ha appena chiuso una riga aperta. */
let chiusaAlTocco = 0;
/** Il tocco è cominciato sulle azioni di una riga aperta: quella non va chiusa prima. */
let suAzioni = false;

/**
 * Da mettere su onTouchStart della schermata: un tocco ovunque fuori dalle azioni chiude la riga
 * aperta appena il dito tocca, anche se poi comincia a scorrere un'altra riga o la lista.
 */
export function chiudiAlTocco() {
  if (suAzioni) {
    suAzioni = false;
    return;
  }
  if (chiudiAperta()) chiusaAlTocco = Date.now();
}

/** Un tocco su una riga: se è servito a chiudere quella aperta, la riga non fa la sua azione. */
export const tocco = (azione?: () => void) =>
  azione
    ? () => {
        if (Date.now() - chiusaAlTocco < 800 || chiudiAperta()) return;
        azione();
      }
    : undefined;

/** Dove sta una riga sullo schermo: il menu della pressione lunga le si apre accanto (CMP-53). */
export interface Rettangolo {
  x: number;
  y: number;
  larghezza: number;
  altezza: number;
}

/** Tenendo premuta la riga, la misura e la passa a chi apre il menu. */
function usaTieni(onTieni?: (r: Rettangolo) => void) {
  const vista = useRef<HostInstance>(null);
  const tieni = onTieni
    ? () =>
        !chiudiAperta() &&
        vista.current?.measureInWindow((x, y, larghezza, altezza) =>
          onTieni({ x, y, larghezza, altezza }),
        )
    : undefined;
  return { vista, tieni };
}

export function RigaCartella({
  nome,
  conteggio,
  aperta,
  livello,
  onPress,
  onTieni,
}: {
  nome: string;
  conteggio: number;
  aperta: boolean;
  livello: number;
  onPress: () => void;
  onTieni?: (r: Rettangolo) => void;
}) {
  const c = useColori();
  const Icona = aperta ? FolderOpen : Folder;
  const { vista, tieni } = usaTieni(onTieni);
  return (
    <Pressable
      ref={vista}
      onPress={tocco(onPress)}
      onLongPress={tieni}
      accessibilityRole="button"
      accessibilityState={{ expanded: aperta }}
      style={({ pressed }) => [
        stili.riga,
        stili.conIcona,
        { paddingLeft: spazio.controllo + livello * spazio.rientro },
        pressed && { backgroundColor: c.sfondoHover },
      ]}
    >
      <Icona size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
      <Text
        allowFontScaling={false}
        style={[testo.controllo, stili.nome, { color: c.testoPrimario }]}
        numberOfLines={1}
      >
        {nome}
      </Text>
      <Text
        allowFontScaling={false}
        style={[testo.dettaglio, stili.conteggio, { color: c.testoTenue }]}
      >
        {conteggio}
      </Text>
    </Pressable>
  );
}

/**
 * Una voce della colonna con icona e nome, come il Cestino (con il numero di elementi, CMP-30) o
 * Journal, Entità e Calendario nel riquadro di Brainet. Senza schermata ancora è disabilitata.
 */
export function RigaVoce({
  nome,
  icona: Icona,
  conteggio,
  onPress,
}: {
  nome: string;
  icona: LucideIcon;
  conteggio?: number;
  onPress?: () => void;
}) {
  const c = useColori();
  return (
    <Pressable
      onPress={tocco(onPress)}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
      style={({ pressed }) => [
        stili.riga,
        stili.conIcona,
        { paddingLeft: spazio.controllo },
        pressed && { backgroundColor: c.sfondoHover },
        !onPress && { opacity: opacitaDisabilitato },
      ]}
    >
      <Icona size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
      <Text
        allowFontScaling={false}
        style={[testo.controllo, stili.nome, { color: c.testoPrimario }]}
        numberOfLines={1}
      >
        {nome}
      </Text>
      {conteggio !== undefined ? (
        <Text
          allowFontScaling={false}
          style={[testo.dettaglio, stili.conteggio, { color: c.testoTenue }]}
        >
          {conteggio}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function RigaNota({
  titolo,
  vuota,
  livelloCartella,
  onPress,
  onSposta,
  onElimina,
  onTieni,
}: {
  titolo: string;
  vuota: boolean;
  /** Livello della cartella che la contiene; assente nella radice di Cloud. */
  livelloCartella?: number;
  onPress: () => void;
  onSposta: () => void;
  onElimina: () => void;
  onTieni?: (r: Rettangolo) => void;
}) {
  const c = useColori();
  const riga = useRef<SwipeableMethods>(null);
  const { vista, tieni } = usaTieni(onTieni);
  const sinistra =
    livelloCartella === undefined
      ? spazio.controllo
      : spazio.controllo + (livelloCartella + 2) * spazio.rientro;
  return (
    <ReanimatedSwipeable
      ref={riga}
      onSwipeableOpenStartDrag={() => apriSoloQuesta(riga)}
      onSwipeableWillOpen={() => apriSoloQuesta(riga)}
      onSwipeableClose={() => richiusa(riga)}
      friction={1.5}
      rightThreshold={spazio.gruppo * 2}
      overshootRight={false}
      containerStyle={stili.scorre}
      renderRightActions={(progresso) => (
        <AzioniNota
          progresso={progresso}
          onSposta={() => {
            riga.current?.close();
            onSposta();
          }}
          onElimina={() => {
            riga.current?.close();
            onElimina();
          }}
        />
      )}
    >
      <Pressable
        ref={vista}
        onPress={tocco(onPress)}
        onLongPress={tieni}
        accessibilityRole="button"
        style={({ pressed }) => [
          stili.riga,
          { paddingLeft: sinistra, backgroundColor: pressed ? c.sfondoHover : c.sfondoNota },
        ]}
      >
        <Text
          allowFontScaling={false}
          style={[testo.controllo, stili.nome, { color: vuota ? c.testoTenue : c.testoPrimario }]}
          numberOfLines={1}
        >
          {vuota ? "Nota vuota" : titolo}
        </Text>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

/**
 * Le azioni di una riga che scorre (CMP-52): entrano da destra attaccate alla riga, staccate da
 * spazio-elemento, così la riga intera si sposta e non scivola sopra le azioni. Da ferme non si
 * vedono, nemmeno dagli angoli.
 */
export function AzioniAccanto({
  progresso,
  children,
}: {
  progresso: SharedValue<number>;
  children: ReactNode;
}) {
  const larghezza = useSharedValue(0);
  const accanto = useAnimatedStyle(() => ({
    opacity: progresso.value > 0.02 ? 1 : 0,
    transform: [{ translateX: larghezza.value * Math.max(0, 1 - progresso.value) }],
  }));
  return (
    <Animated.View
      onTouchStart={() => (suAzioni = true)}
      style={[stili.azioni, accanto]}
      onLayout={(e) => (larghezza.value = e.nativeEvent.layout.width)}
    >
      {children}
    </Animated.View>
  );
}

/** Sposta (sfondo-campo) ed Elimina (sfondo-pieno) dietro la nota che scorre (CMP-52). */
function AzioniNota({
  progresso,
  onSposta,
  onElimina,
}: {
  progresso: SharedValue<number>;
  onSposta: () => void;
  onElimina: () => void;
}) {
  const c = useColori();
  return (
    <AzioniAccanto progresso={progresso}>
      <Pressable
        onPress={onSposta}
        accessibilityRole="button"
        accessibilityLabel="Sposta"
        style={({ pressed }) => [
          stili.azione,
          { backgroundColor: pressed ? c.sfondoPremuto : c.sfondoCampo },
        ]}
      >
        <FolderInput size={misura.icona} color={c.testoPrimario} strokeWidth={misura.tratto} />
        <Text allowFontScaling={false} style={[testo.etichetta, { color: c.testoPrimario }]}>
          Sposta
        </Text>
      </Pressable>
      <Pressable
        onPress={onElimina}
        accessibilityRole="button"
        accessibilityLabel="Elimina"
        style={({ pressed }) => [
          stili.azione,
          { backgroundColor: pressed ? c.sfondoPremuto : c.sfondoPieno },
        ]}
      >
        <Trash2 size={misura.icona} color={c.iconaSuPieno} strokeWidth={misura.tratto} />
        <Text allowFontScaling={false} style={[testo.etichetta, { color: c.testoSuPieno }]}>
          Elimina
        </Text>
      </Pressable>
    </AzioniAccanto>
  );
}

/**
 * Il campo nome nell'albero (CMP-14, RB-48) alla scala del telefono: al posto della riga della
 * cartella, su sfondo-campo con il contorno, il nome già selezionato e la tastiera aperta. Invio
 * o un tocco altrove confermano; un nome vuoto annulla.
 */
export function CampoNomeCartella({
  nome,
  livello,
  onConferma,
}: {
  nome: string;
  livello: number;
  onConferma: (nome: string) => void;
}) {
  const c = useColori();
  const testoScritto = useRef(nome);
  const fatto = useRef(false);
  const campo = useRef<TextInputInstance>(null);
  // Il fuoco arriva quando la cartella ha finito di aprirsi a tendina: così la lista scorre fino
  // al campo, sopra la tastiera, misurandolo dove sta davvero.
  useEffect(() => {
    const t = setTimeout(() => campo.current?.focus(), movimento.durataMedia + 50);
    return () => clearTimeout(t);
  }, []);
  const conferma = () => {
    if (fatto.current) return;
    fatto.current = true;
    onConferma(testoScritto.current);
  };
  return (
    <View
      style={[
        stili.riga,
        stili.conIcona,
        stili.campo,
        {
          paddingLeft: spazio.controllo + livello * spazio.rientro,
          backgroundColor: c.sfondoCampo,
          borderColor: c.testoPrimario,
        },
      ]}
    >
      <Folder size={misura.icona} color={c.iconaTenue} strokeWidth={misura.tratto} />
      <TextInput
        ref={campo}
        allowFontScaling={false}
        defaultValue={nome}
        selectTextOnFocus
        returnKeyType="done"
        autoCorrect={false}
        onChangeText={(t) => (testoScritto.current = t)}
        onSubmitEditing={conferma}
        onBlur={conferma}
        accessibilityLabel="Nome della cartella"
        style={[testo.controllo, stili.nome, stili.campoTesto, { color: c.testoPrimario }]}
      />
    </View>
  );
}

const stili = StyleSheet.create({
  // Alta fissa: la tendina la misura giusta già dal primo fotogramma.
  scorre: { height: misura.riga, borderRadius: raggio.pillola },
  riga: {
    flexDirection: "row",
    alignItems: "center",
    height: misura.riga,
    paddingRight: spazio.controllo,
    borderRadius: raggio.pillola,
  },
  conIcona: { gap: spazio.icona },
  nome: { flex: 1 },
  conteggio: { paddingRight: spazio.elemento },
  azioni: { flexDirection: "row", gap: spazio.elemento, paddingLeft: spazio.elemento },
  campo: { borderWidth: 2 },
  campoTesto: { paddingVertical: 0 },
  azione: {
    flexDirection: "row",
    alignItems: "center",
    gap: spazio.iconaPiccola,
    paddingHorizontal: spazio.pulsante,
    borderRadius: raggio.pillola,
  },
});
