// Le parti di Brainet da leggere sul telefono (RF-18, passo 1), con i testi e le regole delle
// viste del computer (client/src/brainet/VisteBrainet.tsx): il paragrafo con le pillole dei
// collegamenti (CMP-38, sfondo-informazione), le aree evidenziate del colore del loro primo
// stato con i pallini degli stati alla fine (CMP-40, CMP-37), il volto dell'entità (CMP-46) e i
// testi delle date.

import { Image, StyleSheet, Text, View } from "react-native";
import type { Entita, Stato } from "@/nucleo/brainet";
import { raggio, t, testo, useColori, type Colori } from "@/tema";

export const TITOLO_TIPO = {
  persona: "Persone",
  argomento: "Argomenti",
  evento: "Eventi",
  oggetto: "Oggetti",
  nessuno: "Senza tipo",
} as const;

export const TITOLO_TIPO_SINGOLARE = {
  persona: "Persona",
  argomento: "Argomento",
  evento: "Evento",
  oggetto: "Oggetto",
  nessuno: "Senza tipo",
} as const;

/** «AAAA-MM-GG» come data di questo telefono. */
export function data(giorno: string): Date {
  const [a, m, g] = giorno.split("-").map(Number);
  return new Date(a, m - 1, g);
}

const volte = (n: number) => (n === 1 ? "nominato 1 volta" : `nominato ${n} volte`);

/** «nominato 3 volte · ultima volta oggi» (CMP-41). */
export function dettagliEntita(
  v: { nominata: number; ultimaVolta: string | null },
  adesso = new Date(),
): string {
  if (!v.ultimaVolta) return volte(v.nominata);
  const d = data(v.ultimaVolta);
  const oggi = d.toDateString() === adesso.toDateString();
  const giorno = d.toLocaleDateString("it-IT", { day: "numeric", month: "long" });
  return `${volte(v.nominata)} · ultima volta ${oggi ? "oggi" : `il ${giorno}`}`;
}

/** «Venerdì 16 ottobre», con l'anno se non è quello di oggi (CMP-39). */
export function titoloGiorno(giorno: string, adesso = new Date()): string {
  const d = data(giorno);
  const s = d.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(d.getFullYear() === adesso.getFullYear() ? {} : { year: "numeric" }),
  });
  return s[0].toUpperCase() + s.slice(1);
}

/** «Luca Bianchi» → «LB», «Giorgio» → «G»: al posto della foto che manca (CMP-46). */
export function iniziali(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => Array.from(p)[0] ?? "")
    .join("")
    .toLocaleUpperCase("it-IT");
}

/** Il fondo e il pallino di un colore di stato (DEC-14). */
export function coloriStato(c: Colori, colore: string): { sfondo: string; icona: string } {
  switch (colore) {
    case "avviso":
      return { sfondo: c.sfondoAvviso, icona: c.iconaAvviso };
    case "successo":
      return { sfondo: c.sfondoSuccesso, icona: c.iconaSuccesso };
    case "errore":
      return { sfondo: c.sfondoErrore, icona: c.iconaErrore };
    default:
      return { sfondo: c.sfondoInformazione, icona: c.iconaInformazione };
  }
}

const SEGNI =
  /<cita e="([^"]+)">([^<]*)<\/cita>|<area id="([^"]+)"(?: s="([^"]*)")?(?: e="[^"]*")?>|<\/area id="([^"]+)">|<allegato id="[^"]+" f="[a-z]+">([^<]*)<\/allegato>/g;

/** Il testo che si legge, senza i simboli del Markdown (RB-124). */
function senzaMarkdown(t: string): string {
  return t
    .replace(/\*\*|__|~~|<\/?u>|\\(?=[\\*_~`<#])/g, "")
    .replace(/&lt;/g, "<")
    .replace(/^\s*(#{1,6}\s+|[-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d+[.)]\s+)/gm, "");
}

/** Un paragrafo di Brainet con pillole, aree e pallini degli stati, da leggere. */
export function ParagrafoBrainet({
  testo: sorgente,
  entita,
  stati,
  righe,
}: {
  testo: string;
  entita: Map<string, Entita>;
  stati: Stato[];
  /** Al massimo tante righe, con «…» in fondo. */
  righe?: number;
}) {
  const c = useColori();
  const colori = new Map(stati.map((s) => [s.id, s.colore]));
  const pezzi: React.ReactNode[] = [];
  const aperte = new Map<string, string[]>();
  let ultimo = 0;
  const piano = (fino: number) => {
    if (fino <= ultimo) return;
    const testoPiano = senzaMarkdown(sorgente.slice(ultimo, fino));
    if (!testoPiano) return;
    const prima = [...aperte.values()][0];
    const colore = prima ? (prima.map((s) => colori.get(s)).find(Boolean) ?? "informazione") : null;
    pezzi.push(
      <Text
        key={pezzi.length}
        style={colore ? { backgroundColor: coloriStato(c, colore).sfondo } : undefined}
      >
        {testoPiano}
      </Text>,
    );
  };
  for (const m of sorgente.matchAll(SEGNI)) {
    piano(m.index);
    ultimo = m.index + m[0].length;
    if (m[1]) {
      const e = entita.get(m[1]);
      pezzi.push(
        <Text
          key={pezzi.length}
          style={[
            testo.dettaglio,
            { color: c.testoInformazione, backgroundColor: c.sfondoInformazione },
          ]}
        >
          {` ${e?.nome ?? m[2]} `}
        </Text>,
      );
    } else if (m[3]) {
      aperte.set(m[3], m[4] ? m[4].split(",").filter(Boolean) : []);
    } else if (m[5]) {
      // A fine area i pallini dei suoi stati.
      for (const id of aperte.get(m[5]) ?? []) {
        const colore = colori.get(id);
        if (colore)
          pezzi.push(
            <Text key={pezzi.length} style={{ color: coloriStato(c, colore).icona }}>
              {" ●"}
            </Text>,
          );
      }
      aperte.delete(m[5]);
    } else {
      pezzi.push(
        <Text
          key={pezzi.length}
          style={[
            testo.dettaglio,
            { color: c.testoInformazione, backgroundColor: c.sfondoInformazione },
          ]}
        >
          {` ${m[6]} `}
        </Text>,
      );
    }
  }
  piano(sorgente.length);
  return (
    <Text
      allowFontScaling={false}
      numberOfLines={righe}
      style={[testo.controllo, stili.paragrafo, { color: c.testoPrimario }]}
    >
      {pezzi}
    </Text>
  );
}

/** CMP-46 Volto dell'entità: la foto tonda o le iniziali, il nome sotto. */
export function Volto({ entita, misura = t(56) }: { entita: Entita; misura?: number }) {
  const c = useColori();
  const tondo = { width: misura, height: misura, borderRadius: raggio.pillola };
  return entita.foto ? (
    <Image source={{ uri: `data:image/jpeg;base64,${entita.foto}` }} style={tondo} />
  ) : (
    <View style={[tondo, stili.iniziali, { backgroundColor: c.sfondoCampo }]}>
      <Text allowFontScaling={false} style={[testo.titoloSchermata, { color: c.testoTenue }]}>
        {iniziali(entita.nome)}
      </Text>
    </View>
  );
}

const stili = StyleSheet.create({
  paragrafo: { lineHeight: t(15) * 1.5 },
  iniziali: { alignItems: "center", justifyContent: "center" },
});
